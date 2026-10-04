// Automatic generation with mocked SillyTavern and the quality gate (v0.11): without a gate a fired rule
// draws at once; with one the picture waits for the verdict, a redone or swiped reply gets none and does
// not start the cooldown.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as Record<string, unknown>[],
    meta: {} as Record<string, unknown>,
    handler: null as unknown as (id: unknown, type: unknown) => void,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/notify', () => ({ reportGenerationError: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => undefined),
        getCurrentChatId: () => 'chat-1',
        eventTypes: { CHARACTER_MESSAGE_RENDERED: 'character_message_rendered' },
        eventSource: { on: (_name: string, handler: typeof state.handler) => (state.handler = handler) },
    }),
}));

const { AutoGenerator } = await import('../../src/features/auto/auto-generation');
const { clearQualityVerdicts, registerQualityGate, revalidateVerdicts } =
    await import('../../src/features/quality/quality-gate');

const settle = async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

function setup() {
    const controller = { state: { busy: false }, prepare: vi.fn(() => ({ cost: { total: 0 } })) };
    const pipeline = { generatePicture: vi.fn(async () => null) };
    new AutoGenerator(controller as never, pipeline as never).attach();
    return { controller, pipeline };
}

const offs: (() => void)[] = [];

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.auto.enabled = true;
    state.settings.auto.everyMessages = 1;
    state.settings.auto.cooldownMessages = 1;
    state.settings.auto.cooldownSeconds = 0;
    state.chat = [
        { mes: 'hi', is_user: true, is_system: false },
        { mes: 'A long reply.', is_user: false, is_system: false, swipe_id: 0, extra: {} },
    ];
    state.meta = {};
});

afterEach(() => {
    for (const off of offs.splice(0)) off();
    clearQualityVerdicts();
});

describe('AutoGenerator and the quality gate', () => {
    it('draws at once without a gate', async () => {
        const { pipeline } = setup();
        state.handler(1, 'normal');
        await settle();
        expect(pipeline.generatePicture).toHaveBeenCalledWith(expect.objectContaining({ initiator: 'auto' }));
    });

    it('waits for the verdict; a redone reply gets no picture and does not start the cooldown', async () => {
        const { pipeline } = setup();
        let answer!: (ok: boolean) => void;
        const gate = vi.fn(() => new Promise<boolean>((r) => (answer = r)));
        offs.push(registerQualityGate(gate));
        state.handler(1, 'normal');
        await settle();
        expect(gate).toHaveBeenCalledWith({ messageIndex: 1, swipeId: 0 });
        expect(pipeline.generatePicture).not.toHaveBeenCalled();
        answer(false);
        await settle();
        expect(pipeline.generatePicture).not.toHaveBeenCalled();
        expect((state.meta.nai_studio as { auto: { lastAt: number } }).auto.lastAt).toBe(0);
    });

    it('draws after a yes, and not for a swipe that was swiped away meanwhile', async () => {
        const { pipeline } = setup();
        let answer!: (ok: boolean) => void;
        const gate = vi.fn(() => new Promise<boolean>((r) => (answer = r)));
        offs.push(registerQualityGate(gate));
        state.handler(1, 'normal');
        await settle();
        answer(true);
        await settle();
        expect(pipeline.generatePicture).toHaveBeenCalledTimes(1);
        expect((state.meta.nai_studio as { auto: { lastAt: number } }).auto.lastAt).toBeGreaterThan(0);

        state.chat[1]!.swipe_id = 1;
        state.handler(1, 'swipe');
        await settle();
        expect(gate).toHaveBeenLastCalledWith({ messageIndex: 1, swipeId: 1 });
        state.chat[1]!.swipe_id = 2;
        revalidateVerdicts();
        answer(true);
        await settle();
        expect(pipeline.generatePicture).toHaveBeenCalledTimes(1);
    });
});
