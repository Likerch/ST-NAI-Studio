// Style negatives in the generation pipeline (v0.13): every request built from the current fields
// (the panel, scenes of the composer, auto scene, DES portraits, sprites, comic) sends the effective
// undesired content of the active style, and a style passed for one picture (a marker's or Maestro's
// `style`) replaces the active one: its prefix, suffix and undesired content with the base negative.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { GenerationSettings, NaiStudioSettings, StyleSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({ settings: null as unknown as NaiStudioSettings }));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: [],
        characters: [],
        groupId: null,
        substituteParams: (text: string) => text,
        eventSource: { emit: vi.fn(async () => undefined) },
        eventTypes: {},
        getCurrentChatId: () => 'chat-1',
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

const { Pipeline } = await import('../../src/features/generation/pipeline');
const { applyStyle } = await import('../../src/features/generation/styles');

const ink: StyleSettings = {
    name: 'Ink',
    prefix: 'ink wash',
    suffix: 'monochrome',
    negative: 'color, watermark',
    negativeMode: 'append',
};
const oil: StyleSettings = { name: 'Oil', prefix: 'oil painting', suffix: 'canvas', negative: 'anime, sketch' };

function setup() {
    const prepare = vi.fn((overrides: Partial<GenerationSettings>) => ({
        request: { model: 'nai-diffusion-4-5-full', seed: 1, steps: 23, characters: [] },
        body: {
            input: overrides.prompt,
            model: 'nai-diffusion-4-5-full',
            parameters: { negative_prompt: overrides.negativePrompt },
        },
        blockers: [],
        cost: { total: 0 },
        build: { endpoint: 'generate' },
        transportId: 'plugin',
        caps: { family: 'v4' },
    }));
    const controller = {
        prepare,
        send: vi.fn(async () => ({ images: [{ base64: 'x', mime: 'image/png' }], correlationId: 'c' })),
        state: { selection: null },
    };
    const ui = { refine: vi.fn(), confirmCost: vi.fn(async () => true), inspect: vi.fn(async () => true) };
    const pipeline = new Pipeline(controller as never, ui as never);
    const sent = () => prepare.mock.calls.at(-1)![0];
    return { pipeline, sent };
}

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.prompts.baseNegative = 'lowres, bad anatomy, Watermark';
    state.settings.prompts.styles = [structuredClone(ink), structuredClone(oil)];
});

describe('pipeline and style negatives', () => {
    it('sends the base negative and the active "append" style from the panel', () => {
        const { pipeline, sent } = setup();
        applyStyle(state.settings, state.settings.prompts.styles[0]!);
        pipeline.previewFree('cat');
        expect(sent()).toMatchObject({
            prompt: 'ink wash, cat, monochrome',
            negativePrompt: 'lowres, bad anatomy, Watermark, color',
        });
        // A "replace" style: its negative only.
        applyStyle(state.settings, state.settings.prompts.styles[1]!);
        pipeline.previewFree('cat');
        expect(sent()).toMatchObject({ prompt: 'oil painting, cat, canvas', negativePrompt: 'anime, sketch' });
    });

    it('sends the effective negative for a composed scene (composer, auto scene, DES, sprites, comic)', async () => {
        const { pipeline, sent } = setup();
        applyStyle(state.settings, state.settings.prompts.styles[0]!);
        const result = await pipeline.produce({
            initiator: 'auto',
            trigger: 'girl',
            scene: 'girl, park',
            overrides: { quiet: true, edit: false, negative: 'hat' },
        });
        expect(result?.images).toHaveLength(1);
        expect(sent()).toMatchObject({
            prompt: 'ink wash, girl, park, monochrome',
            negativePrompt: 'hat, lowres, bad anatomy, Watermark, color',
        });
    });

    it('draws a passed style instead of the active one, the suffix before the in-image text', async () => {
        const { pipeline, sent } = setup();
        applyStyle(state.settings, state.settings.prompts.styles[1]!);
        await pipeline.produce({
            initiator: 'message',
            trigger: 'girl reading, text: HELLO',
            scene: 'girl reading, text: HELLO',
            overrides: { edit: false, negative: 'hat', style: state.settings.prompts.styles[0]! },
        });
        expect(sent()).toMatchObject({
            prompt: 'ink wash, girl reading, monochrome, text: HELLO',
            negativePrompt: 'hat, lowres, bad anatomy, Watermark, color',
        });
        // A passed "replace" style: its own negative, not the active one's.
        applyStyle(state.settings, state.settings.prompts.styles[0]!);
        await pipeline.produce({
            initiator: 'panel',
            trigger: 'mill',
            scene: 'mill',
            overrides: { edit: false, style: state.settings.prompts.styles[1]! },
        });
        expect(sent()).toMatchObject({ prompt: 'oil painting, mill, canvas', negativePrompt: 'anime, sketch' });
    });

    it('keeps an explicit undesired content of the request over the style', async () => {
        const { pipeline, sent } = setup();
        await pipeline.produce({
            initiator: 'panel',
            trigger: 'mill',
            scene: 'mill',
            overrides: {
                edit: false,
                style: state.settings.prompts.styles[0]!,
                generation: { negativePrompt: 'only this' },
            },
        });
        expect(sent()).toMatchObject({ negativePrompt: 'only this' });
    });
});
