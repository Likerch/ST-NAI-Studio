// One queue for every NovelAI image request (v0.13.1). NovelAI draws one picture per account at a
// time and answers 429 ("concurrent generation is locked") to a second one, so generations of every
// kind wait here: the panel, commands, the composer, image markers, automatic scenes, DES portraits,
// sprites, comics, Maestro's backgrounds, Director Tools, upscales and vibe encodings. Strictly one
// request is in flight; the most urgent waits first (user > reply > portrait > background), first
// come first served within a priority. A request NovelAI turns away as busy keeps its turn and is
// sent again after about 2, 5 and 12 s (or when the server says), then the error is shown.
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';

/** Who waits for the picture: the user right now, the current reply, a DES portrait, background work. */
export type QueuePriority = 'user' | 'reply' | 'portrait' | 'background';

export const QUEUE_PRIORITIES: readonly QueuePriority[] = ['user', 'reply', 'portrait', 'background'];

/** What a request draws, for the queue status in the panel. */
export type QueueKind =
    'picture' | 'marker' | 'auto' | 'portrait' | 'sprites' | 'comic' | 'background' | 'tools' | 'vibe';

export const QUEUE_KINDS: readonly QueueKind[] = [
    'picture',
    'marker',
    'auto',
    'portrait',
    'sprites',
    'comic',
    'background',
    'tools',
    'vibe',
];

export type QueueStatus =
    | { state: 'queued'; ahead: number }
    | { state: 'running' }
    | { state: 'retry'; seconds: number; attempt: number }
    | { state: 'done' };

export interface QueueJob {
    /** Default "user". */
    priority?: QueuePriority;
    /** Default "picture". */
    kind?: QueueKind;
    /** The chat the result belongs to: a waiting request of another chat is dropped when the chat changes. */
    chatId?: string;
    /** Aborts a waiting request (dropped) or the running one (its transport call). */
    signal?: AbortSignal;
    /** Asked before the request starts and on revalidate(): true drops it (its message was deleted or swiped). */
    stale?: () => boolean;
    onStatus?: (status: QueueStatus) => void;
}

export interface QueueEntryView {
    id: number;
    priority: QueuePriority;
    kind: QueueKind;
    chatId?: string;
    /** Seconds until the running request is sent again, null when it is not waiting for a retry. */
    retryIn: number | null;
}

export interface QueueSnapshot {
    running: QueueEntryView | null;
    waiting: QueueEntryView[];
}

export interface QueueOptions {
    /** Waits before the 1st, 2nd and 3rd retry (jittered by ±20 %). */
    delays?: readonly number[];
    random?: () => number;
    now?: () => number;
    sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000, 12000];
const MAX_WAIT_MS = 60000;
const RANK: Record<QueuePriority, number> = { user: 0, reply: 1, portrait: 2, background: 3 };
/** Answers that are about the account, not about another generation: never sent again. */
const FINAL_CODES = new Set(['unauthorized', 'token-missing', 'insufficient-anlas', 'forbidden', 'aborted']);
const BUSY_TEXT = /concurrent generation|generation is locked|too many requests/i;

interface ErrorLike {
    name?: string;
    code?: string;
    kind?: string;
    status?: number;
    retryAfter?: number;
    serverMessage?: string;
    bodyPreview?: string;
    message?: string;
    params?: Record<string, string | number>;
}

/** NovelAI turned the request away because another generation of the account is running (429). */
export function isBusyAnswer(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const e = error as ErrorLike;
    if (e.code && FINAL_CODES.has(e.code)) return false;
    if (e.kind === 'aborted' || e.name === 'AbortError') return false;
    if (e.code === 'rate-limited' || e.status === 429 || e.params?.status === 429) return true;
    const text = [e.serverMessage, e.bodyPreview, e.params?.server, e.params?.preview].filter(Boolean).join(' ');
    return BUSY_TEXT.test(text);
}

/** Seconds the server asked to wait (Retry-After), if it said so. */
export function retryAfterSeconds(error: unknown): number | undefined {
    const e = (typeof error === 'object' && error !== null ? error : {}) as ErrorLike;
    const value = Number(e.retryAfter ?? e.params?.retryAfter);
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new NaiError('aborted', 'none'));
            return;
        }
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(new NaiError('aborted', 'none'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

interface Entry {
    id: number;
    job: QueueJob;
    priority: QueuePriority;
    kind: QueueKind;
    task: (signal: AbortSignal) => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    abort: AbortController;
    retryAt: number | null;
    detach: () => void;
}

export class GenerationQueue {
    private running: Entry | null = null;
    private readonly waiting: Entry[] = [];
    private seq = 0;
    private readonly listeners = new Set<() => void>();
    private readonly delays: readonly number[];
    private readonly random: () => number;
    private readonly now: () => number;
    private readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;

    constructor(options: QueueOptions = {}) {
        this.delays = options.delays ?? RETRY_DELAYS_MS;
        this.random = options.random ?? Math.random;
        this.now = options.now ?? Date.now;
        this.sleep = options.sleep ?? abortableSleep;
    }

    /** Runs `task` when it is its turn, alone; a busy answer is retried with the same turn. */
    run<T>(job: QueueJob, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (job.signal?.aborted) {
                reject(new NaiError('aborted', 'none'));
                return;
            }
            const entry: Entry = {
                id: ++this.seq,
                job,
                priority: job.priority ?? 'user',
                kind: job.kind ?? 'picture',
                task,
                resolve: resolve as (value: unknown) => void,
                reject,
                abort: new AbortController(),
                retryAt: null,
                detach: () => {},
            };
            const signal = job.signal;
            if (signal) {
                const onAbort = () => {
                    if (this.waiting.includes(entry)) this.drop(entry, 'aborted');
                    else entry.abort.abort();
                };
                signal.addEventListener('abort', onAbort, { once: true });
                entry.detach = () => signal.removeEventListener('abort', onAbort);
            }
            // After every entry of the same or a higher priority: first come, first served.
            const at = this.waiting.findIndex((other) => RANK[other.priority] > RANK[entry.priority]);
            if (at === -1) this.waiting.push(entry);
            else this.waiting.splice(at, 0, entry);
            log.info(
                `queue: ${entry.kind} (${entry.priority}) added, ${this.waiting.length + (this.running ? 1 : 0)} in the queue`,
            );
            this.pump();
            this.changed();
        });
    }

    /** A request is in flight (or waits for its retry). */
    get busy(): boolean {
        return this.running !== null;
    }

    get size(): number {
        return this.waiting.length;
    }

    snapshot(): QueueSnapshot {
        return {
            running: this.running ? this.view(this.running) : null,
            waiting: this.waiting.map((e) => this.view(e)),
        };
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /** Drops every waiting request ("Clear the queue"); the running one finishes. */
    clear(): number {
        return this.dropWhere(() => true, 'cleared');
    }

    /** Another chat is open: waiting requests of other chats are dropped. */
    dropOtherChats(chatId: string | undefined): number {
        return this.dropWhere((e) => e.job.chatId !== undefined && e.job.chatId !== chatId, 'chat changed');
    }

    /** Messages were deleted or swiped: waiting requests that lost their message are dropped. */
    revalidate(): number {
        return this.dropWhere((e) => this.isStale(e), 'message gone');
    }

    /** Aborts the request in flight (the panel's Cancel). */
    cancelRunning(): void {
        this.running?.abort.abort();
    }

    private view(entry: Entry): QueueEntryView {
        return {
            id: entry.id,
            priority: entry.priority,
            kind: entry.kind,
            ...(entry.job.chatId !== undefined ? { chatId: entry.job.chatId } : {}),
            retryIn: entry.retryAt === null ? null : Math.max(0, Math.ceil((entry.retryAt - this.now()) / 1000)),
        };
    }

    private isStale(entry: Entry): boolean {
        try {
            return entry.job.stale?.() === true;
        } catch {
            return false;
        }
    }

    private dropWhere(test: (entry: Entry) => boolean, reason: string): number {
        const dropped = this.waiting.filter(test);
        for (const entry of dropped) this.drop(entry, reason, false);
        if (dropped.length) this.changed();
        return dropped.length;
    }

    private drop(entry: Entry, reason: string, notify = true): void {
        const index = this.waiting.indexOf(entry);
        if (index === -1) return;
        this.waiting.splice(index, 1);
        entry.detach();
        log.info(`queue: ${entry.kind} (${entry.priority}) dropped: ${reason}`);
        entry.job.onStatus?.({ state: 'done' });
        entry.reject(new NaiError('aborted', 'none'));
        if (notify) this.changed();
    }

    private changed(): void {
        const offset = this.running ? 1 : 0;
        this.waiting.forEach((entry, i) => entry.job.onStatus?.({ state: 'queued', ahead: i + offset }));
        for (const listener of this.listeners) {
            try {
                listener();
            } catch (error) {
                log.warn('queue listener failed', error);
            }
        }
    }

    private pump(): void {
        if (this.running) return;
        let next = this.waiting.shift();
        while (next && this.isStale(next)) {
            next.detach();
            log.info(`queue: ${next.kind} (${next.priority}) dropped: message gone`);
            next.job.onStatus?.({ state: 'done' });
            next.reject(new NaiError('aborted', 'none'));
            next = this.waiting.shift();
        }
        if (!next) return;
        this.running = next;
        void this.execute(next);
    }

    private async execute(entry: Entry): Promise<void> {
        entry.job.onStatus?.({ state: 'running' });
        try {
            entry.resolve(await this.attempt(entry));
        } catch (error) {
            entry.reject(error);
        } finally {
            entry.detach();
            entry.job.onStatus?.({ state: 'done' });
            this.running = null;
            this.pump();
            this.changed();
        }
    }

    private async attempt(entry: Entry): Promise<unknown> {
        for (let attempt = 0; ; attempt++) {
            try {
                return await entry.task(entry.abort.signal);
            } catch (error) {
                const delay = this.delays[attempt];
                if (entry.abort.signal.aborted || delay === undefined || !isBusyAnswer(error)) throw error;
                const jitter = 0.8 + 0.4 * this.random();
                const asked = retryAfterSeconds(error);
                const ms = Math.min(MAX_WAIT_MS, Math.max(Math.round(delay * jitter), asked ? asked * 1000 : 0));
                const seconds = Math.ceil(ms / 1000);
                log.warn(
                    `queue: NovelAI is busy with another generation, ${entry.kind} sent again in ${seconds} s (${attempt + 1}/${this.delays.length})`,
                );
                entry.retryAt = this.now() + ms;
                entry.job.onStatus?.({ state: 'retry', seconds, attempt: attempt + 1 });
                this.changed();
                try {
                    await this.sleep(ms, entry.abort.signal);
                } finally {
                    entry.retryAt = null;
                }
                entry.job.onStatus?.({ state: 'running' });
                this.changed();
            }
        }
    }
}

/** The queue of the extension: every NovelAI image request goes through it. */
export const generationQueue = new GenerationQueue();
