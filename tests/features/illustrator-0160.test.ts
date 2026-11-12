// v0.16 illustrator: who writes the markers (registration, setting, the effective writer), the rules blocks cut out
// of a real prompt in the illustrator mode and kept for the illustrator, an illustrator's marker placed after a
// paragraph and drawn as the reply's own (free only when asked), the excerpt-based automatic pictures off while an
// illustrator writes, the marker pictures of a reply, a picture that goes into no message.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import type { InlineImage } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as STChatMessage[],
    uuid: 0,
    uploads: [] as { folder: string; name: string }[],
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({ chat: state.chat, uuidv4: () => `id${++state.uuid}`, getCurrentChatId: () => 'chat-1' }),
}));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../src/features/continuity/continuity-service', () => ({ setCurrentLocation: vi.fn(async () => {}) }));
vi.mock('../../src/features/scene/scene-service', () => ({
    sceneCandidates: async () => [],
    sceneSetting: async () => ({ world: '', location: '', locations: [] }),
    mentionedLocationTags: () => '',
}));
vi.mock('../../src/features/vibes/vibe-library', () => ({ vibeItems: () => [] }));
vi.mock('../../src/features/images/image-utils', () => ({
    blobToBase64: async () => 'BASE64',
    toPngBlob: async (blob: Blob) => blob,
}));
vi.mock('../../src/features/generation/output', () => ({
    imageFolder: () => 'Alice',
    imageFileName: (folder: string, suffix: string) => `${folder}_${suffix}`,
    uploadImage: vi.fn(async (_b: string, _m: string, folder: string, name: string) => {
        state.uploads.push({ folder, name });
        return `user/images/${folder}/${name}.png`;
    }),
}));

const { MarkerService } = await import('../../src/features/markers/marker-service');
const illustrator = await import('../../src/features/markers/illustrator');

const produced = { images: [{ base64: 'x', mime: 'image/png' }], meta: {}, mode: 0, chatId: 'chat-1' };

function setup() {
    const produce = vi.fn<(request: unknown) => Promise<never>>(async () => produced as never);
    const pipeline = { produce, studio: { state: { selection: { transport: { features: { img2img: true } } } } } };
    const inline = {
        displayDefaults: (partial = {}) => ({ width: 60, widthUnit: '%', align: 'center', caption: '', ...partial }),
        addPending: vi.fn(async (messageId: number, text: string, list: InlineImage[]) => {
            const message = state.chat[messageId]!;
            message.mes = text;
            const extra = (message.extra ?? {}) as { nai_images?: InlineImage[] };
            extra.nai_images = [...(extra.nai_images ?? []), ...list];
            message.extra = extra as never;
        }),
        completePending: vi.fn(async () => true),
        setMarkerStatus: vi.fn(async () => true),
        entries: () => [],
    };
    const scenes = { markerScene: vi.fn(async () => null) };
    const service = new MarkerService(pipeline as never, inline as never, scenes as never);
    return { service, produce, inline };
}

function reply(mes: string): void {
    state.chat.push({ mes, is_user: false, is_system: false, name: 'Alice', extra: {}, swipe_id: 0 } as never);
}

const settle = () => new Promise((r) => setTimeout(r, 0));
const sent = (produce: ReturnType<typeof setup>['produce']) => produce.mock.calls.at(-1)![0] as { maxCost?: number };

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.markers.enabled = true;
    state.chat = [];
    state.uuid = 0;
    state.uploads = [];
});
afterEach(() => illustrator.resetIllustrator());

describe('who writes the markers', () => {
    it('the setting counts only while an illustrator is registered and markers are on', () => {
        state.settings.markers.writer = 'illustrator';
        expect(illustrator.effectiveWriter()).toBe('main');
        const changed = vi.fn();
        illustrator.onIllustratorsChange(changed);
        const off = illustrator.registerIllustrator('maestro');
        expect(changed).toHaveBeenCalledTimes(1);
        expect(illustrator.effectiveWriter()).toBe('illustrator');
        state.settings.markers.enabled = false;
        expect(illustrator.effectiveWriter()).toBe('main');
        state.settings.markers.enabled = true;
        // The same id registered again replaces the first registration: its old unregistration does nothing.
        const again = illustrator.registerIllustrator('maestro');
        off();
        expect(illustrator.illustratorRegistered()).toBe(true);
        again();
        expect(illustrator.illustratorRegistered()).toBe(false);
        expect(changed).toHaveBeenCalledTimes(2);
        state.settings.markers.writer = 'nonsense' as never;
        expect(illustrator.writerSetting()).toBe('main');
    });

    it('a real prompt: the rules are kept, and cut out only when asked', () => {
        const rules = `<images>\nOne picture.\n<img data-nai='{"prompt":"[SCENE]"}'>\n</images>`;
        const messages = [
            { role: 'system', content: `Be vivid.\n${rules}` },
            { role: 'system', content: rules },
            { role: 'user', content: 'Hello' },
        ];
        expect(illustrator.handlePrompt(structuredClone(messages), { strip: false })).toBe(0);
        expect(illustrator.capturedRules()).toBe(`${rules}\n\n${rules}`);
        const cut = structuredClone(messages);
        expect(illustrator.handlePrompt(cut, { strip: true })).toBe(2);
        expect(cut).toEqual([
            { role: 'system', content: 'Be vivid.\n' },
            { role: 'user', content: 'Hello' },
        ]);
    });
});

describe('an illustrator marker', () => {
    const marker = { prompt: 'candles go out', chars: [{ name: 'Mira', action: 'looks up' }], caption: 'Тьма' };

    it('goes after the paragraph of its sentence and is drawn free only', async () => {
        const { service, produce, inline } = setup();
        reply('Mira enters.\nThe candles go out one by one.\n\nKai is silent.');
        const result = await service.insertMarker(0, marker, { after: 'The candles go out', freeOnly: true });
        expect(result).toEqual({ ok: true, imageId: 'id1' });
        expect(state.chat[0]!.mes).toBe(
            'Mira enters.\nThe candles go out one by one.\n[nai:img:id1]\n\nKai is silent.',
        );
        const [, , list] = inline.addPending.mock.calls[0]!;
        expect(list[0]!.marker?.params).toMatchObject({ prompt: 'candles go out', caption: 'Тьма' });
        await settle();
        await settle();
        expect(produce).toHaveBeenCalledTimes(1);
        expect(sent(produce).maxCost).toBe(0);
        expect(service.messageMarkers(0)).toEqual([
            {
                imageId: 'id1',
                marker: expect.objectContaining({ prompt: 'candles go out' }),
                status: 'pending',
                by: 'illustrator',
            },
        ]);
    });

    it('paid when the marker settings allow it and the caller does not ask for free only', async () => {
        const { service, produce } = setup();
        state.settings.markers.allowPaid = true;
        state.settings.markers.maxCost = 7;
        state.settings.anlas.freeOnly = false;
        reply('Snow.');
        await service.insertMarker(0, marker);
        await settle();
        await settle();
        expect(sent(produce).maxCost).toBe(7);
    });

    it('refused: markers off, no reply, another swipe, no prompt, the limit', async () => {
        const { service } = setup();
        reply('Snow.');
        state.chat.push({ mes: 'Hi', is_user: true, extra: {} } as never);
        expect(await service.insertMarker(1, marker)).toEqual({ ok: false, error: 'message' });
        expect(await service.insertMarker(0, marker, { swipeId: 2 })).toEqual({ ok: false, error: 'stale' });
        expect(await service.insertMarker(0, { caption: 'x' })).toEqual({ ok: false, error: 'marker' });
        state.settings.markers.max = 1;
        expect((await service.insertMarker(0, marker)).ok).toBe(true);
        expect(await service.insertMarker(0, marker)).toEqual({ ok: false, error: 'limit' });
        state.settings.markers.enabled = false;
        expect(await service.insertMarker(0, marker)).toEqual({ ok: false, error: 'disabled' });
    });

    it('no automatic excerpt pictures while an illustrator writes', async () => {
        const { service, inline } = setup();
        state.settings.markers.autoFill = true;
        state.settings.markers.writer = 'fallback';
        illustrator.registerIllustrator('maestro');
        reply('Alice opens the door.');
        await service.finalize(0, 'normal');
        expect(inline.addPending).not.toHaveBeenCalled();
        illustrator.resetIllustrator();
        reply('Snow falls.');
        await service.finalize(1, 'normal');
        expect(inline.addPending).toHaveBeenCalledTimes(1);
    });

    it('a picture that goes into no message is saved into the chat folder', async () => {
        const { service, produce } = setup();
        reply('Snow.');
        const drawn = await service.drawPicture({ prompt: 'a book cover' }, { freeOnly: true, name: 'cover' });
        expect(drawn).toEqual({ path: 'user/images/Alice/Alice_cover.png', params: { prompt: 'a book cover' } });
        expect(sent(produce).maxCost).toBe(0);
        await expect(service.drawPicture({ caption: 'x' })).rejects.toThrow('marker has no prompt');
    });
});
