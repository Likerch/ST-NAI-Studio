// The one NovelAI queue with the real controller and pipeline and a fake transport (v0.13.1):
// requests of the panel, image markers, a DES portrait, the composer and a comic made at the same
// time reach NovelAI one by one in priority order; a 429 is retried without a second cost
// confirmation; three 429 in a row show the error; the queue follows chat changes and deletions.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import type { NaiImageRequest } from '../../src/shared/nai-wire';
import type { GenerateOptions, Transport } from '../../src/transport';
import { TransportError } from '../../src/transport';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chatId: 'chat-1',
    handlers: new Map<string, (() => void)[]>(),
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: [],
        characters: [],
        groupId: null,
        substituteParams: (text: string) => text,
        eventSource: {
            emit: vi.fn(async () => undefined),
            on: (event: string, handler: () => void) =>
                state.handlers.set(event, [...(state.handlers.get(event) ?? []), handler]),
        },
        eventTypes: {
            CHAT_CHANGED: 'chat_id_changed',
            MESSAGE_DELETED: 'message_deleted',
            MESSAGE_SWIPED: 'message_swiped',
        },
        getCurrentChatId: () => state.chatId,
    }),
    importHost: vi.fn(),
}));
vi.mock('../../src/features/characters/character-prompts', () => ({
    avatarKey: (avatar: string) => avatar,
    currentCharacterPrompt: () => ({ positive: '', negative: '' }),
    lastSpeakerPrompt: () => ({ positive: '', negative: '' }),
    soloCharacterIndex: () => undefined,
}));
vi.mock('../../src/features/generation/output', () => ({
    appendToMessage: vi.fn(),
    imageFolder: vi.fn(),
    messageText: vi.fn(),
    postToChat: vi.fn(),
    saveImages: vi.fn(),
}));
vi.mock('../../src/features/generation/multimodal', () => ({ describeImage: vi.fn() }));

const { StudioController } = await import('../../src/features/generation/controller');
const { Pipeline } = await import('../../src/features/generation/pipeline');
const { GenerationQueue, generationQueue } = await import('../../src/features/generation/queue');
const { accountFromSubscription } = await import('../../src/features/generation/account');
const { setupGenerationQueue } = await import('../../src/integration/queue-setup');
const { createNativeTransport } = await import('../../src/transport/st-native');

const PNG = 'iVBORw0KGgo';
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const OPUS = { tier: 3, active: true, trainingStepsLeft: { fixedTrainingStepsLeft: 1000, purchasedTrainingSteps: 0 } };

function setup(
    answer: (body: NaiImageRequest, call: number, options: GenerateOptions) => Promise<void> | void = () => {},
) {
    const calls: string[] = [];
    let inFlight = 0;
    let most = 0;
    const generate = vi.fn(async (body: NaiImageRequest, options: GenerateOptions) => {
        inFlight++;
        most = Math.max(most, inFlight);
        calls.push(body.input.split(',')[0]!);
        try {
            await answer(body, calls.length, options);
            await settle();
            return { images: [{ base64: PNG, mime: 'image/png' as const, index: 0 }] };
        } finally {
            inFlight--;
        }
    });
    const transport: Transport = {
        id: 'plugin',
        features: { ...createNativeTransport({ fetch, headers: () => ({}) }).features, characters: true },
        generate,
        subscription: vi.fn(async () => OPUS),
        effectiveRequest: (body) => ({ body, lost: [] }),
    };
    const queue = new GenerationQueue({ random: () => 0.5, sleep: async () => void (await settle()) });
    const controller = new StudioController({ fetch, headers: () => ({}) }, queue);
    controller.state.selection = { transport, health: null, degraded: false } as never;
    controller.state.account = accountFromSubscription(OPUS);
    const progress = { start: vi.fn(), frame: vi.fn(), end: vi.fn() };
    const ui = {
        refine: vi.fn(),
        confirmCost: vi.fn(async () => true),
        inspect: vi.fn(async () => true),
        progress,
    };
    const pipeline = new Pipeline(controller as never, ui as never);
    return { pipeline, controller, queue, generate, calls, ui, progress, most: () => most };
}

const draw = (pipeline: InstanceType<typeof Pipeline>, scene: string, queue?: Record<string, unknown>) =>
    pipeline.produce({
        initiator: 'panel',
        trigger: scene,
        scene,
        overrides: { quiet: true, edit: false },
        ...(queue ? { queue } : {}),
    });

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.stream.enabled = false;
    state.chatId = 'chat-1';
    state.handlers.clear();
});

describe('one NovelAI queue for every request', () => {
    it('sends markers, a DES portrait, the composer and a comic one at a time, most urgent first', async () => {
        let release!: () => void;
        const first = new Promise<void>((resolve) => (release = resolve));
        const { pipeline, queue, calls, progress, most } = setup((_body, call) => (call === 1 ? first : undefined));
        const panel = draw(pipeline, 'panel');
        while (!calls.length) await settle();
        const others = [
            draw(pipeline, 'comic', { priority: 'background', kind: 'comic' }),
            draw(pipeline, 'portrait', { priority: 'portrait', kind: 'portrait' }),
            draw(pipeline, 'marker one', { priority: 'reply', kind: 'marker' }),
            draw(pipeline, 'composer'),
            draw(pipeline, 'marker two', { priority: 'reply', kind: 'marker' }),
        ];
        while (queue.size < others.length) await settle();
        // The progress card belongs to the request in flight only.
        expect(progress.start).toHaveBeenCalledTimes(1);
        expect(queue.snapshot().waiting.map((w) => w.kind)).toEqual([
            'picture',
            'marker',
            'marker',
            'portrait',
            'comic',
        ]);
        release();
        const results = await Promise.all([panel, ...others]);
        expect(results.every((r) => r?.images.length === 1)).toBe(true);
        expect(calls).toEqual(['panel', 'composer', 'marker one', 'marker two', 'portrait', 'comic']);
        expect(most()).toBe(1);
        expect(progress.start).toHaveBeenCalledTimes(6);
        expect(progress.end).toHaveBeenCalledTimes(6);
    });

    it('retries a 429 without asking for the cost again', async () => {
        state.settings.anlas.freeOnly = false;
        const { pipeline, generate, ui } = setup((_body, call) => {
            if (call === 1)
                throw new TransportError('http', { status: 429, serverMessage: 'Concurrent generation is locked' });
        });
        // A paid size: the cost is confirmed once.
        state.settings.generation.width = 1600;
        state.settings.generation.height = 1600;
        const result = await pipeline.produce({ initiator: 'panel', trigger: 'cat', scene: 'cat' });
        expect(result?.images).toHaveLength(1);
        expect(generate).toHaveBeenCalledTimes(2);
        expect(ui.confirmCost).toHaveBeenCalledTimes(1);
        expect(result?.prepared.cost.total).toBeGreaterThan(0);
    });

    it('shows the error after three retries', async () => {
        const { pipeline, generate } = setup(() => {
            throw new TransportError('http', { status: 429 });
        });
        await expect(draw(pipeline, 'cat')).rejects.toMatchObject({ code: 'rate-limited', action: 'retry' });
        expect(generate).toHaveBeenCalledTimes(4);
    });

    it('does not retry an answer about the account', async () => {
        const { pipeline, generate } = setup(() => {
            throw new TransportError('http', { status: 401 });
        });
        await expect(draw(pipeline, 'cat')).rejects.toMatchObject({ code: 'unauthorized' });
        expect(generate).toHaveBeenCalledTimes(1);
    });

    it('drops a waiting request that is aborted, and cancels the running one', async () => {
        let release!: () => void;
        const first = new Promise<void>((resolve) => (release = resolve));
        const { pipeline, controller, queue, calls } = setup((_body, call) => (call === 1 ? first : undefined));
        const running = draw(pipeline, 'one');
        while (!calls.length) await settle();
        expect(controller.state.busy).toBe(true);
        const abort = new AbortController();
        const waiting = pipeline.produce({
            initiator: 'panel',
            trigger: 'two',
            scene: 'two',
            overrides: { quiet: true, edit: false },
            signal: abort.signal,
        });
        while (queue.size < 1) await settle();
        abort.abort();
        await expect(waiting).rejects.toMatchObject({ code: 'aborted' });
        release();
        await running;
        expect(calls).toEqual(['one']);
        expect(controller.state.busy).toBe(false);
    });

    it('cancels the request in flight from the panel', async () => {
        const { pipeline, controller, calls } = setup(
            (_body, _call, options) =>
                new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(resolve, 5000);
                    options.signal?.addEventListener('abort', () => {
                        clearTimeout(timer);
                        reject(new TransportError('aborted'));
                    });
                }),
        );
        const run = draw(pipeline, 'one');
        while (!calls.length) await settle();
        controller.cancel();
        await expect(run).rejects.toMatchObject({ code: 'aborted' });
    });

    it('keeps a picture of no chat (a persona avatar, 0.15) queued when another chat opens', async () => {
        let release!: () => void;
        const first = new Promise<void>((resolve) => (release = resolve));
        const { pipeline, queue, calls } = setup((_body, call) => (call === 1 ? first : undefined));
        const running = draw(pipeline, 'one');
        while (!calls.length) await settle();
        const avatar = pipeline.produce({
            initiator: 'panel',
            trigger: 'avatar',
            scene: 'avatar',
            overrides: { quiet: true, edit: false },
            chatless: true,
            queue: { priority: 'portrait', kind: 'portrait' },
        });
        const marker = draw(pipeline, 'marker', { priority: 'reply', kind: 'marker' });
        while (queue.size < 2) await settle();
        expect(queue.snapshot().waiting.map((w) => [w.kind, w.chatId])).toEqual([
            ['marker', 'chat-1'],
            ['portrait', undefined],
        ]);
        state.chatId = 'chat-2';
        expect(queue.dropOtherChats('chat-2')).toBe(1);
        await expect(marker).rejects.toMatchObject({ code: 'aborted' });
        release();
        await running;
        expect((await avatar)?.images).toHaveLength(1);
        expect(calls).toEqual(['one', 'avatar']);
    });

    it('drops waiting requests of the old chat and of deleted messages', async () => {
        setupGenerationQueue();
        const first = new Promise<string>((resolve) => setTimeout(() => resolve('first'), 30));
        const running = generationQueue.run({ chatId: 'chat-1' }, () => first);
        let deleted = false;
        const old = generationQueue.run({ chatId: 'chat-1' }, async () => 'old chat');
        const gone = generationQueue.run({ chatId: 'chat-2', stale: () => deleted }, async () => 'deleted');
        const kept = generationQueue.run({ chatId: 'chat-2' }, async () => 'kept');
        state.chatId = 'chat-2';
        for (const handler of state.handlers.get('chat_id_changed') ?? []) handler();
        await expect(old).rejects.toMatchObject({ code: 'aborted' });
        deleted = true;
        for (const handler of state.handlers.get('message_deleted') ?? []) handler();
        await expect(gone).rejects.toMatchObject({ code: 'aborted' });
        expect(await running).toBe('first');
        expect(await kept).toBe('kept');
    });
});
