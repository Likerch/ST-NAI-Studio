// Quality gates (v0.11, Maestro plan §16). Before NAI Studio draws on its own for an assistant reply
// (image markers of the reply, also the ones found while it streams; automatic illustrations; automatic
// generation; DES portraits after it) it asks every registered gate whether the reply stays.
// - One verdict per reply swipe, shared by every drawing of it: each gate is asked once.
// - The gates are asked in parallel once the reply is complete; any false → nothing is drawn for that
//   reply swipe (it is being redone); all true, or no answer within `quality.gateTimeoutMs` from the end
//   of the reply → drawn as before. A gate that throws counts as true.
// - A reply swiped away, deleted or left with its chat while waiting: its drawings are cancelled.
// - Without gates nothing waits. Manual generation (buttons, commands) never asks.
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';

export interface QualityGateDetail {
    /** Index of the reply in the chat. */
    messageIndex: number;
    /** The swipe of the reply the drawings are for. */
    swipeId: number;
}

/** false: the reply is being redone, draw nothing for it; true: draw. */
export type QualityGate = (detail: QualityGateDetail) => Promise<boolean> | boolean;

/** draw: as before; skip: a gate said no; cancelled: the reply was swiped, deleted or its chat left. */
export type QualityVerdict = 'draw' | 'skip' | 'cancelled';

export const DEFAULT_GATE_TIMEOUT_MS = 20000;
const MIN_GATE_TIMEOUT_MS = 1000;
const MAX_GATE_TIMEOUT_MS = 600000;
/** Settled verdicts kept for later drawings of the same reply (DES trackers come late). */
const MAX_ENTRIES = 64;

interface Registration {
    gate: QualityGate;
}

interface Entry {
    key: string;
    chatId: string;
    messageIndex: number;
    swipeId: number;
    /** The message object: a regenerated reply is a new object at the same index. */
    message: STChatMessage;
    /** deferred: the reply still streams, the gates are asked when it is complete. */
    phase: 'deferred' | 'asking' | 'settled';
    waiting: Set<Registration>;
    timer: ReturnType<typeof setTimeout> | null;
    promise: Promise<QualityVerdict>;
    resolve: (verdict: QualityVerdict) => void;
}

const gates = new Set<Registration>();
const listeners = new Set<() => void>();
const entries = new Map<string, Entry>();

/** The time limit in range: 1 s … 10 min, 20 s when unset. */
export function clampGateTimeout(ms: unknown): number {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_GATE_TIMEOUT_MS;
    return Math.min(MAX_GATE_TIMEOUT_MS, Math.max(MIN_GATE_TIMEOUT_MS, Math.round(value)));
}

function gateTimeout(): number {
    return clampGateTimeout(settings().quality?.gateTimeoutMs);
}

const swipeOf = (message: STChatMessage) => {
    const id = Number(message.swipe_id ?? 0);
    return Number.isInteger(id) && id >= 0 ? id : 0;
};

const chatIdNow = () => String(ctx().getCurrentChatId() ?? '');

function changed(): void {
    for (const listener of listeners) {
        try {
            listener();
        } catch (error) {
            log.warn('quality gate listener failed', error);
        }
    }
}

/** Registers a gate; returns its unregistration. Pending verdicts stop waiting for a gate that goes. */
export function registerQualityGate(gate: QualityGate): () => void {
    const registration: Registration = { gate };
    gates.add(registration);
    changed();
    return () => {
        if (!gates.delete(registration)) return;
        for (const entry of [...entries.values()]) {
            if (entry.phase === 'asking' && entry.waiting.has(registration)) vote(entry, registration, true);
        }
        changed();
    };
}

/** A gate is registered: automatic drawings of a reply wait for its verdict. */
export function qualityGatesActive(): boolean {
    return gates.size > 0;
}

/** Gates registered or removed (the settings panel shows its section only with a gate). */
export function onQualityGatesChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function isCurrent(entry: Entry): boolean {
    const c = ctx();
    return (
        chatIdNow() === entry.chatId &&
        c.chat[entry.messageIndex] === entry.message &&
        swipeOf(entry.message) === entry.swipeId
    );
}

function forget(entry: Entry): void {
    if (entries.get(entry.key) === entry) entries.delete(entry.key);
}

function settle(entry: Entry, verdict: QualityVerdict): void {
    if (entry.phase === 'settled') return;
    entry.phase = 'settled';
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = null;
    entry.waiting.clear();
    const final = verdict !== 'cancelled' && !isCurrent(entry) ? 'cancelled' : verdict;
    if (final === 'cancelled') forget(entry);
    entry.resolve(final);
}

function vote(entry: Entry, registration: Registration, ok: boolean): void {
    if (entry.phase !== 'asking') return;
    if (!ok) {
        log.info(`quality gate: reply ${entry.messageIndex} (swipe ${entry.swipeId}) is redone, its pictures wait`);
        settle(entry, 'skip');
        return;
    }
    entry.waiting.delete(registration);
    if (!entry.waiting.size) settle(entry, 'draw');
}

/** Every gate at once; the time limit runs from now (the end of the reply). */
function ask(entry: Entry): void {
    entry.phase = 'asking';
    entry.waiting = new Set(gates);
    if (!entry.waiting.size) {
        settle(entry, 'draw');
        return;
    }
    const limit = gateTimeout();
    entry.timer = setTimeout(() => {
        log.info(`quality gate: no answer for reply ${entry.messageIndex} in ${limit} ms, drawing`);
        settle(entry, 'draw');
    }, limit);
    const detail: QualityGateDetail = { messageIndex: entry.messageIndex, swipeId: entry.swipeId };
    for (const registration of [...entry.waiting]) {
        let answer: Promise<boolean> | boolean;
        try {
            answer = registration.gate({ ...detail });
        } catch (error) {
            log.warn('quality gate failed, counted as "ok"', error);
            vote(entry, registration, true);
            continue;
        }
        Promise.resolve(answer).then(
            (ok) => vote(entry, registration, ok !== false),
            (error: unknown) => {
                log.warn('quality gate failed, counted as "ok"', error);
                vote(entry, registration, true);
            },
        );
    }
}

/** Old settled verdicts go first when there are too many. */
function prune(): void {
    if (entries.size <= MAX_ENTRIES) return;
    for (const entry of [...entries.values()]) {
        if (entries.size <= MAX_ENTRIES) return;
        if (entry.phase === 'settled') forget(entry);
    }
}

/**
 * The verdict for the automatic drawings of a reply (its current swipe). Without gates: "draw" at once.
 * `streaming`: the reply is still being written, the gates are asked when replyComplete() is called;
 * a later request without it means the reply is complete.
 */
export function replyVerdict(messageIndex: number, options: { streaming?: boolean } = {}): Promise<QualityVerdict> {
    if (!gates.size) return Promise.resolve('draw');
    const message = ctx().chat[messageIndex];
    if (!message) return Promise.resolve('cancelled');
    const chatId = chatIdNow();
    const swipeId = swipeOf(message);
    const key = `${chatId}\u0000${messageIndex}\u0000${swipeId}`;
    let entry = entries.get(key);
    if (entry && entry.message !== message) {
        settle(entry, 'cancelled');
        forget(entry);
        entry = undefined;
    }
    if (!entry) {
        let resolve!: (verdict: QualityVerdict) => void;
        const promise = new Promise<QualityVerdict>((r) => (resolve = r));
        entry = {
            key,
            chatId,
            messageIndex,
            swipeId,
            message,
            phase: 'deferred',
            waiting: new Set(),
            timer: null,
            promise,
            resolve,
        };
        entries.set(key, entry);
        prune();
    }
    if (entry.phase === 'deferred' && !options.streaming) ask(entry);
    return entry.promise;
}

/** The reply is complete: verdicts that waited for it ask the gates now (the time limit starts here). */
export function replyComplete(messageIndex: number): void {
    for (const entry of [...entries.values()]) {
        if (entry.phase === 'deferred' && entry.messageIndex === messageIndex) {
            if (isCurrent(entry)) ask(entry);
            else settle(entry, 'cancelled');
        }
    }
}

/** A reply that will not be drawn (stopped, markers off): its waiting verdicts are cancelled. */
export function replyAbandoned(messageIndex?: number): void {
    for (const entry of [...entries.values()]) {
        if (entry.phase === 'deferred' && (messageIndex === undefined || entry.messageIndex === messageIndex))
            settle(entry, 'cancelled');
    }
}

/** Swipes, deletions, another chat: verdicts of a reply swipe no longer shown are cancelled. */
export function revalidateVerdicts(): void {
    for (const entry of [...entries.values()]) {
        if (isCurrent(entry)) continue;
        if (entry.phase === 'settled') forget(entry);
        else settle(entry, 'cancelled');
    }
}

/**
 * A new generation: settled verdicts are forgotten (a continued reply is checked again) and verdicts of
 * a reply that never completed are cancelled. Verdicts being asked keep waiting for their reply.
 */
export function qualityGenerationStarted(): void {
    for (const entry of [...entries.values()]) {
        if (entry.phase === 'settled') forget(entry);
        else if (entry.phase === 'deferred') settle(entry, 'cancelled');
    }
}

/** Drops every verdict (pending drawings are cancelled). */
export function clearQualityVerdicts(): void {
    for (const entry of [...entries.values()]) {
        settle(entry, 'cancelled');
        forget(entry);
    }
    entries.clear();
}
