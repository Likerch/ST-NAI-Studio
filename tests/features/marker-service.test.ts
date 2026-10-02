// Image markers with mocked SillyTavern (TZ Phase 7): early start while streaming and reuse at
// the end, per-reply limit, every marker parameter in the generation request, paid policy,
// characters, errors and retry, automatic illustration, skipped generation types.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { MODE } from '../../src/domain';
import type { InlineImage, MarkerParams } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as STChatMessage[],
    chatId: 'chat-1',
    uuid: 0,
    now: 0,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        uuidv4: () => `id${++state.uuid}`,
        getCurrentChatId: () => state.chatId,
    }),
}));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../src/features/continuity/continuity-service', () => ({
    setCurrentLocation: vi.fn(async () => undefined),
}));
vi.mock('../../src/features/scene/scene-service', () => ({
    sceneCandidates: async () => [
        { key: 'alice.png', name: 'Alice', aliases: [], passport: null, fallbackPrompt: '', fallbackNegative: '' },
    ],
}));
vi.mock('../../src/features/vibes/vibe-library', () => ({
    vibeItems: () => [{ id: 'v1', name: 'Watercolor', imageHash: '', imageKey: '', thumbKey: '', createdAt: '' }],
}));
vi.mock('../../src/features/images/image-utils', () => ({
    blobToBase64: async () => 'BASE64',
    toPngBlob: async (blob: Blob) => blob,
}));

const { MarkerService } = await import('../../src/features/markers/marker-service');

const produced = { images: [{ base64: 'x', mime: 'image/png' }], meta: {}, mode: 0, chatId: 'chat-1' };

function setup() {
    const produce = vi.fn<(request: unknown) => Promise<never>>(async () => produced as never);
    const pipeline = { produce, studio: { state: { selection: { transport: { features: { img2img: true } } } } } };
    const entries = new Map<number, InlineImage[]>();
    const inline = {
        displayDefaults: (partial = {}) => ({ width: 60, widthUnit: '%', align: 'center', caption: '', ...partial }),
        addPending: vi.fn(async (messageId: number, text: string, list: InlineImage[]) => {
            state.chat[messageId]!.mes = text;
            entries.set(messageId, [...(entries.get(messageId) ?? []), ...list]);
        }),
        completePending: vi.fn(async () => true),
        setMarkerStatus: vi.fn(async () => true),
        entries: (messageId: number) => entries.get(messageId) ?? [],
        sourceBlob: vi.fn(async () => new Blob(['img'])),
    };
    const markerScene = vi.fn(async (prompt: string) => ({
        prompt: `scene: ${prompt}`,
        characters: [{ enabled: true, prompt: 'alice', negative: '', x: 0.3, y: 0.5 }],
        useCoords: true,
    }));
    const scenes = { markerScene };
    const service = new MarkerService(pipeline as never, inline as never, scenes as never);
    return { service, produce, inline, markerScene, entries };
}

function reply(mes: string): void {
    state.chat.push({
        mes,
        is_user: false,
        is_system: false,
        name: 'Alice',
        extra: {},
        swipe_id: 0,
    } as unknown as STChatMessage);
}

const settle = () => new Promise((r) => setTimeout(r, 0));
interface SentRequest {
    scene: string;
    maxCost?: number;
    vibes?: unknown;
    requestPatch?: unknown;
    noContinuity?: boolean;
    overrides: { generation: Record<string, unknown> & { width: number; height: number; characters?: unknown[] } };
}
const lastRequest = (produce: ReturnType<typeof setup>['produce']) => produce.mock.calls.at(-1)![0] as SentRequest;

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.markers.enabled = true;
    state.chat = [];
    state.uuid = 0;
    state.chatId = 'chat-1';
    state.now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => (state.now += 1000));
});

describe('MarkerService lifecycle', () => {
    it('starts a complete marker while streaming and reuses that generation for the finished reply', async () => {
        const { service, produce, inline } = setup();
        service.generationStarted('normal', false);
        reply('She turns. <img data-nai=\'{"prompt": "a cat on the win');
        service.streamProgress();
        expect(produce).not.toHaveBeenCalled();
        state.chat[0]!.mes = 'She turns. <figure><img data-nai=\'{"prompt": "a cat on the window"}\'>';
        service.streamProgress();
        await settle();
        expect(produce).toHaveBeenCalledTimes(1);
        state.chat[0]!.mes += '<figcaption>The cat</figcaption></figure> Then rain.';
        service.streamProgress();
        await service.finalize(0, 'normal');
        await settle();
        expect(produce).toHaveBeenCalledTimes(1);
        expect(state.chat[0]!.mes).toBe('She turns. [nai:img:id1] Then rain.');
        const [, , list] = inline.addPending.mock.calls[0]!;
        expect(list[0]).toMatchObject({
            id: 'id1',
            swipes: [],
            marker: { status: 'pending', params: { prompt: 'a cat on the window', caption: 'The cat' } },
        });
        expect(list[0]!.display.caption).toBe('The cat');
        expect(inline.completePending).toHaveBeenCalledWith(0, 'id1', produced);
    });

    it('keeps at most "max" markers and removes the rest from the text', async () => {
        const { service, produce } = setup();
        state.settings.markers.max = 2;
        reply('<img data-nai="a"> one <img data-nai="b"> two <img data-nai="c"> three');
        await service.finalize(0, 'normal');
        await settle();
        expect(state.chat[0]!.mes).toBe('[nai:img:id1] one [nai:img:id2] two  three');
        expect(produce).toHaveBeenCalledTimes(2);
    });

    it('skips impersonation, disabled markers and old formats when they are switched off', async () => {
        const { service, produce, inline } = setup();
        reply('<img data-nai="a">');
        await service.finalize(0, 'impersonate');
        state.settings.markers.enabled = false;
        await service.finalize(0, 'normal');
        state.settings.markers.enabled = true;
        state.settings.markers.legacy = false;
        state.chat[0]!.mes = '<img src="https://proxy.example/gen?prompt=cat&token=t">';
        await service.finalize(0, 'normal');
        expect(produce).not.toHaveBeenCalled();
        expect(inline.addPending).not.toHaveBeenCalled();
        state.settings.markers.legacy = true;
        await service.finalize(0, 'normal');
        await settle();
        expect(lastRequest(produce).scene).toBe('cat');
    });

    it('marks a failed generation, and a retry generates it again', async () => {
        const { service, produce, inline } = setup();
        produce.mockRejectedValueOnce(new Error('boom'));
        reply('<img data-nai="a cat">');
        await service.finalize(0, 'normal');
        await settle();
        await settle();
        expect(inline.setMarkerStatus).toHaveBeenCalledWith(0, 'id1', 'error', expect.any(String));
        expect(service.isRunning('id1')).toBe(false);
        await service.retry(0, 'id1');
        expect(inline.setMarkerStatus).toHaveBeenLastCalledWith(0, 'id1', 'pending');
        expect(inline.completePending).toHaveBeenCalledWith(0, 'id1', produced);
    });

    it('drops the result when the chat changed meanwhile', async () => {
        const { service, produce, inline } = setup();
        let finish!: (value: unknown) => void;
        produce.mockImplementationOnce(() => new Promise((r) => (finish = r)) as never);
        reply('<img data-nai="a cat">');
        await service.finalize(0, 'normal');
        await settle();
        expect(service.isRunning('id1')).toBe(true);
        state.chatId = 'chat-2';
        finish(produced);
        await settle();
        expect(inline.completePending).not.toHaveBeenCalled();
        expect(service.isRunning('id1')).toBe(false);
    });

    it('illustrates a reply without markers when auto fill is on, only for normal replies', async () => {
        const { service, produce, inline, markerScene } = setup();
        state.settings.markers.autoFill = true;
        state.settings.markers.min = 1;
        reply('<b>Alice</b> opens the door. Snow falls.');
        await service.finalize(0, 'extension');
        expect(inline.addPending).not.toHaveBeenCalled();
        await service.finalize(0, 'normal');
        await settle();
        expect(state.chat[0]!.mes).toBe('<b>Alice</b> opens the door. Snow falls.\n[nai:img:id1]');
        expect(markerScene).toHaveBeenCalledWith('Alice opens the door. Snow falls.', [{ name: 'Alice' }]);
        expect(produce).toHaveBeenCalledTimes(1);
        await service.finalize(0, 'normal');
        expect(inline.addPending).toHaveBeenCalledTimes(1);
    });
});

describe('MarkerService requests', () => {
    const params: MarkerParams = {
        prompt: 'girl reading',
        negative: 'hat',
        ratio: 'portrait',
        size: '2K',
        model: 'v4.5',
        style: 'Ink',
        text: 'HELLO',
        seed: 7,
        steps: 40,
        scale: 6,
        rescale: 0.2,
        uc: 'light',
        quality: false,
        variety: true,
        count: 3,
        vibe: 'watercolor',
    };

    it('turns every parameter into the generation request within the free limit', async () => {
        const { service, produce } = setup();
        state.settings.prompts.styles = [
            { name: 'ink', prefix: 'ink drawing', suffix: 'monochrome', negative: 'color' },
        ];
        await service.produce(params);
        const req = lastRequest(produce);
        expect(req).toMatchObject({
            initiator: 'message',
            mode: MODE.FREE,
            interpret: 'auto',
            skipCostConfirm: true,
            maxCost: 0,
            scene: 'ink drawing, girl reading, monochrome, text: HELLO',
            overrides: {
                edit: false,
                negative: 'hat, color',
                generation: {
                    model: 'nai-diffusion-4-5-full',
                    width: 832,
                    height: 1216,
                    seed: 7,
                    steps: 28,
                    scale: 6,
                    cfgRescale: 0.2,
                    ucPreset: 'light',
                    qualityPreset: 'none',
                    varietyBoost: true,
                    samples: 1,
                },
            },
        });
        expect(req.vibes).toEqual([
            { item: expect.objectContaining({ id: 'v1' }), strength: 0.6, informationExtracted: 1 },
        ]);
    });

    it('allows paid sizes, steps and samples up to the cap when paid markers are allowed', async () => {
        const { service, produce } = setup();
        state.settings.anlas.freeOnly = false;
        state.settings.markers.allowPaid = true;
        state.settings.markers.maxCost = 12;
        await service.produce({ ...params, style: 'pastel' });
        const req = lastRequest(produce);
        expect(req.maxCost).toBe(12);
        expect(req.scene).toBe('pastel, girl reading, text: HELLO');
        expect(req.overrides.generation).toMatchObject({ steps: 40, samples: 3 });
        expect(req.overrides.generation.width * req.overrides.generation.height).toBeGreaterThan(1048576);
    });

    it('builds characters from passports and uses an earlier image as the img2img base', async () => {
        const { service, produce, markerScene, entries } = setup();
        reply('earlier');
        entries.set(0, []);
        state.chat[0]!.extra = {
            nai_images: [
                {
                    id: 'img-1',
                    swipes: [{ blobKey: 'k', filePath: '', mime: 'image/png', meta: {} }],
                    activeSwipe: 0,
                    marker: { params: { prompt: 'p', id: 'tavern' }, status: 'done' },
                },
            ],
        };
        await service.produce({
            prompt: 'they talk',
            chars: [{ name: 'Alice', pos: 'left' }],
            ref: 'tavern',
            text: 'X',
            model: 'v3',
        });
        expect(markerScene).toHaveBeenCalledWith('they talk', [{ name: 'Alice', pos: 'left' }]);
        const req = lastRequest(produce);
        expect(req.scene).toBe('scene: they talk');
        expect(req.overrides.generation).toMatchObject({ useCoords: true, model: 'nai-diffusion-3' });
        expect(req.overrides.generation.characters).toHaveLength(1);
        expect(req.requestPatch).toEqual({ mode: 'img2img', image: 'BASE64', strength: 0.6 });
        expect(req.noContinuity).toBe(true);
    });
});
