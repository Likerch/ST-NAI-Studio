// Quality gates (v0.11) with mocked SillyTavern: one verdict per reply swipe from every gate in parallel,
// false wins, true from all or the time limit draws, a reply still streaming asks only when complete,
// swipes / deletions / other chats cancel, a new generation forgets settled verdicts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as Record<string, unknown>[],
    chatId: 'chat-1',
    handlers: {} as Record<string, (...args: unknown[]) => unknown>,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        getCurrentChatId: () => state.chatId,
        eventTypes: {
            MESSAGE_SWIPED: 'message_swiped',
            MESSAGE_DELETED: 'message_deleted',
            CHAT_CHANGED: 'chat_id_changed',
            GENERATION_STARTED: 'generation_started',
        },
        eventSource: {
            on: (name: string, handler: (...args: unknown[]) => unknown) => (state.handlers[name] = handler),
        },
    }),
}));

const quality = await import('../../src/features/quality/quality-gate');
const { setupQualityGates } = await import('../../src/integration/quality-setup');
const {
    clampGateTimeout,
    clearQualityVerdicts,
    onQualityGatesChange,
    qualityGatesActive,
    qualityGenerationStarted,
    registerQualityGate,
    replyAbandoned,
    replyComplete,
    replyVerdict,
    revalidateVerdicts,
} = quality;

const offs: (() => void)[] = [];
function gate(fn: (detail: { messageIndex: number; swipeId: number }) => Promise<boolean> | boolean) {
    const spy = vi.fn(fn);
    offs.push(registerQualityGate(spy));
    return spy;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
    state.settings = defaultSettings();
    state.chat = [
        { mes: 'hi', is_user: true },
        { mes: 'reply', is_user: false, swipe_id: 0 },
    ];
    state.chatId = 'chat-1';
});

afterEach(() => {
    for (const off of offs.splice(0)) off();
    clearQualityVerdicts();
    vi.useRealTimers();
});

describe('quality gates', () => {
    it('draws at once without a gate and has a 20 s default time limit', async () => {
        expect(qualityGatesActive()).toBe(false);
        expect(await replyVerdict(1)).toBe('draw');
        expect(state.settings.quality.gateTimeoutMs).toBe(20000);
        expect(clampGateTimeout(undefined)).toBe(20000);
        expect(clampGateTimeout(-5)).toBe(20000);
        expect(clampGateTimeout(10)).toBe(1000);
        expect(clampGateTimeout(5e6)).toBe(600000);
        expect(clampGateTimeout(1234.4)).toBe(1234);
    });

    it('asks every gate once per reply swipe, in parallel; all true draws', async () => {
        const a = deferred<boolean>();
        const first = gate(() => a.promise);
        const second = gate(() => true);
        const one = replyVerdict(1);
        const two = replyVerdict(1);
        expect(two).toBe(one);
        expect(first).toHaveBeenCalledWith({ messageIndex: 1, swipeId: 0 });
        expect(second).toHaveBeenCalledTimes(1);
        let done = false;
        void one.then(() => (done = true));
        await settle();
        expect(done).toBe(false);
        a.resolve(true);
        expect(await one).toBe('draw');
        // Settled verdicts are kept for later drawings of the same reply.
        expect(await replyVerdict(1)).toBe('draw');
        expect(first).toHaveBeenCalledTimes(1);
    });

    it('skips as soon as one gate says false, without waiting for the others', async () => {
        gate(() => new Promise<boolean>(() => {}));
        gate(async () => false);
        expect(await replyVerdict(1)).toBe('skip');
    });

    it('draws when the gates do not answer in time, and counts a throwing gate as true', async () => {
        vi.useFakeTimers();
        state.settings.quality.gateTimeoutMs = 5000;
        gate(() => {
            throw new Error('broken');
        });
        gate(async () => {
            throw new Error('also broken');
        });
        expect(await replyVerdict(1)).toBe('draw');
        clearQualityVerdicts();
        gate(() => new Promise<boolean>(() => {}));
        let verdict: string | undefined;
        void replyVerdict(1).then((v) => (verdict = v));
        await vi.advanceTimersByTimeAsync(4999);
        expect(verdict).toBeUndefined();
        await vi.advanceTimersByTimeAsync(1);
        expect(verdict).toBe('draw');
    });

    it('asks a reply that still streams only when it is complete; the time limit starts there', async () => {
        vi.useFakeTimers();
        const spy = gate(() => new Promise<boolean>(() => {}));
        let verdict: string | undefined;
        void replyVerdict(1, { streaming: true }).then((v) => (verdict = v));
        await vi.advanceTimersByTimeAsync(60000);
        expect(spy).not.toHaveBeenCalled();
        expect(verdict).toBeUndefined();
        replyComplete(1);
        expect(spy).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(19999);
        expect(verdict).toBeUndefined();
        await vi.advanceTimersByTimeAsync(1);
        expect(verdict).toBe('draw');
    });

    it('a later request without "streaming" means the reply is complete; abandoned replies are cancelled', async () => {
        const spy = gate(() => true);
        const early = replyVerdict(1, { streaming: true });
        expect(spy).not.toHaveBeenCalled();
        expect(await replyVerdict(1)).toBe('draw');
        expect(await early).toBe('draw');
        qualityGenerationStarted();
        const stopped = replyVerdict(1, { streaming: true });
        replyAbandoned(1);
        expect(await stopped).toBe('cancelled');
        const next = replyVerdict(1, { streaming: true });
        qualityGenerationStarted();
        expect(await next).toBe('cancelled');
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('cancels the drawing of a swipe that is swiped away, deleted or left with its chat', async () => {
        const answers: ReturnType<typeof deferred<boolean>>[] = [];
        const spy = gate(() => {
            const d = deferred<boolean>();
            answers.push(d);
            return d.promise;
        });
        const swiped = replyVerdict(1);
        state.chat[1]!.swipe_id = 1;
        revalidateVerdicts();
        expect(await swiped).toBe('cancelled');
        // The new swipe gets its own verdict.
        const second = replyVerdict(1);
        expect(spy).toHaveBeenLastCalledWith({ messageIndex: 1, swipeId: 1 });
        state.chat.pop();
        revalidateVerdicts();
        expect(await second).toBe('cancelled');
        state.chat.push({ mes: 'again', is_user: false });
        const third = replyVerdict(1);
        state.chatId = 'chat-2';
        // An answer that arrives after the chat changed does not draw either.
        answers.at(-1)!.resolve(true);
        expect(await third).toBe('cancelled');
        expect(await replyVerdict(7)).toBe('cancelled');
    });

    it('a regenerated reply (new message at the same index) is asked again', async () => {
        const spy = gate(() => true);
        expect(await replyVerdict(1)).toBe('draw');
        state.chat[1] = { mes: 'regenerated', is_user: false, swipe_id: 0 };
        expect(await replyVerdict(1)).toBe('draw');
        expect(spy).toHaveBeenCalledTimes(2);
        // A new generation (continue) forgets the settled verdict.
        qualityGenerationStarted();
        await replyVerdict(1);
        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('stops waiting for a gate that is unregistered and tells listeners about changes', async () => {
        const listener = vi.fn();
        const off = onQualityGatesChange(listener);
        const unregister = registerQualityGate(() => new Promise<boolean>(() => {}));
        expect(qualityGatesActive()).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        const verdict = replyVerdict(1);
        unregister();
        unregister();
        expect(await verdict).toBe('draw');
        expect(qualityGatesActive()).toBe(false);
        expect(listener).toHaveBeenCalledTimes(2);
        off();
    });

    it('is wired to swipes, deletions, chat changes and new generations', async () => {
        setupQualityGates();
        expect(Object.keys(state.handlers).sort()).toEqual([
            'chat_id_changed',
            'generation_started',
            'message_deleted',
            'message_swiped',
        ]);
        const spy = gate(() => new Promise<boolean>(() => {}));
        const asked = replyVerdict(1);
        const streaming = replyVerdict(0, { streaming: true });
        state.handlers.generation_started!('quiet', {}, false);
        state.handlers.generation_started!('normal', {}, true);
        state.handlers.message_swiped!(0);
        let done = false;
        void streaming.then(() => (done = true));
        await settle();
        expect(done).toBe(false);
        state.handlers.generation_started!('normal', {}, false);
        expect(await streaming).toBe('cancelled');
        state.chat[1]!.swipe_id = 3;
        state.handlers.message_swiped!(1);
        expect(await asked).toBe('cancelled');
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
