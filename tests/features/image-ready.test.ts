// The "imageReady" event (v0.10): fired after an image is attached to a message and the chat is
// saved, with the message index, how it got there and the passports drawn.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { createPendingImage, defaultDisplay } from '../../src/domain';
import type { InlineImage } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as STChatMessage[],
    order: [] as string[],
    uuid: 0,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        uuidv4: () => `img${++state.uuid}`,
        saveChat: vi.fn(async () => void state.order.push('saved')),
        updateMessageBlock: vi.fn(),
    }),
}));
vi.mock('../../src/features/inline/inline-store', () => ({
    newBlobKey: (id: string) => `blob:${id}`,
    putBlob: vi.fn(async () => undefined),
    settle: vi.fn(),
    getBlob: vi.fn(async () => null),
    removeBlobs: vi.fn(async () => undefined),
    collectGarbage: vi.fn(async () => undefined),
}));
vi.mock('../../src/features/generation/output', () => ({
    imageFolder: () => 'folder',
    imageFileName: () => 'file.png',
    uploadImage: vi.fn(async () => '/user/images/file.png'),
}));
vi.mock('../../src/features/images/image-utils', () => ({
    base64ToBlob: () => new Blob(['x']),
    blobToBase64: async () => 'BASE64',
    toPngBlob: async (blob: Blob) => blob,
}));

const { InlineImages } = await import('../../src/features/inline/inline-service');
const { onStudioEvent } = await import('../../src/features/events/studio-events');

const meta = { scenePrompt: 's', seed: 1, width: 64, height: 64, model: 'm', mode: 7 } as never;
const produced = (passportIds?: string[]) => ({
    images: [{ base64: 'eA==', mime: 'image/png', seed: 5 }],
    meta,
    mode: 7,
    chatId: 'chat-1',
    ...(passportIds ? { passportIds } : {}),
});

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.inline.keepBrowserCopy = true;
    state.settings.inline.saveToServer = false;
    state.chat = [{ mes: 'Hello.', is_user: false, is_system: false, extra: {} } as STChatMessage];
    state.order = [];
    state.uuid = 0;
});

describe('imageReady', () => {
    it('follows the save of a marker image and of an inserted image', async () => {
        const events: unknown[] = [];
        const off = onStudioEvent('imageReady', (detail) => {
            state.order.push('ready');
            events.push(detail);
        });
        const pipeline = {
            notify: vi.fn(),
            produce: vi.fn(async () => produced(['p1'])),
        };
        const inline = new InlineImages(pipeline as never);
        const pending: InlineImage = createPendingImage('m1', { prompt: 'x' }, defaultDisplay());
        state.chat[0]!.extra = { nai_images: [pending] };
        expect(await inline.completePending(0, 'm1', produced(['p1', 'p2']) as never)).toBe(true);
        expect(events).toEqual([{ messageIndex: 0, kind: 'marker', passportIds: ['p1', 'p2'] }]);
        expect(state.order).toEqual(['saved', 'ready']);

        await inline.insert(0, { trigger: 't', passportIds: ['p1'] });
        expect(pipeline.produce).toHaveBeenCalledWith(expect.objectContaining({ passportIds: ['p1'] }));
        expect(events.at(-1)).toEqual({ messageIndex: 0, kind: 'inline', passportIds: ['p1'] });

        await inline.addProducedSwipe(0, 'm1', produced() as never);
        expect(events.at(-1)).toEqual({ messageIndex: 0, kind: 'tool', passportIds: [] });
        off();
    });
});
