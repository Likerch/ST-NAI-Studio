// @vitest-environment happy-dom
// A picture that lands after the reply is on screen (a marker image done or failed, an image swipe, a removal)
// re-renders the message. SillyTavern's own message editor follows its re-render with MESSAGE_UPDATED, and the
// extensions that decorate the rendered text redo their work only on that event: Doom's Enhancement Suite keeps
// its "bubbles applied" attribute on .mes_text, so without the event the reply stayed without its speaker cards
// until the user opened and closed the editor (0.15.1).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { createPendingImage, defaultDisplay } from '../../src/domain';

type Listener = (...args: unknown[]) => unknown;

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as STChatMessage[],
    log: [] as string[],
    listeners: new Map<string, ((...args: unknown[]) => unknown)[]>(),
}));

const EVENTS = {
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_EDITED: 'message_edited',
    CHARACTER_MESSAGE_RENDERED: 'character_message_rendered',
};

const eventSource = {
    on(event: string, listener: Listener) {
        state.listeners.set(event, [...(state.listeners.get(event) ?? []), listener]);
    },
    removeListener() {},
    async emit(event: string, ...args: unknown[]) {
        state.log.push(`event:${event}`);
        for (const listener of state.listeners.get(event) ?? []) await listener(...args);
    },
};

/** updateMessageBlock as in ST 1.19: new HTML inside .mes_text, the element and its attributes stay. */
function updateMessageBlock(messageId: number, message: STChatMessage) {
    state.log.push('render');
    const text = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
    if (text) text.innerHTML = `<p>${message.mes}</p>`;
}

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        uuidv4: () => 'uuid',
        saveChat: async () => void state.log.push('saved'),
        updateMessageBlock,
        eventSource,
        eventTypes: EVENTS,
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
const { rerenderMessage } = await import('../../src/core/messages');

const APPLIED = 'data-dooms-bubbles-applied';

/**
 * The part of Doom's Enhancement Suite that matters here (chatBubbles.js, index.js 2.6.0): cards are laid out once
 * per .mes_text; only a render event clears the "applied" mark, so a re-render without one keeps the mark and loses
 * the cards.
 */
function fakeDes(): void {
    const layOut = (id: unknown) => {
        const text = document.querySelector(`#chat .mes[mesid="${String(id)}"] .mes_text`);
        if (!text) return;
        text.removeAttribute(APPLIED);
        text.setAttribute(APPLIED, 'true');
        text.innerHTML = `<div class="dooms-bubbles">${text.innerHTML}</div>`;
    };
    eventSource.on(EVENTS.CHARACTER_MESSAGE_RENDERED, layOut);
    eventSource.on(EVENTS.MESSAGE_UPDATED, layOut);
}

const cards = () => document.querySelector('#chat .mes[mesid="0"] .mes_text .dooms-bubbles') !== null;

const produced = {
    images: [{ base64: 'eA==', mime: 'image/png', seed: 5 }],
    meta: { scenePrompt: 's', seed: 1, width: 64, height: 64, model: 'm', mode: 7 },
    mode: 7,
    chatId: 'chat-1',
};

const pending = () => createPendingImage('img-0001', { prompt: 'x' }, defaultDisplay());

function reply(text = 'Hello. [nai:img:img-0001]'): STChatMessage {
    return {
        name: 'Char',
        send_date: '',
        mes: text,
        is_user: false,
        is_system: false,
        extra: { nai_images: [pending()] },
    } as STChatMessage;
}

beforeEach(async () => {
    state.settings = defaultSettings();
    state.settings.inline.keepBrowserCopy = true;
    state.settings.inline.saveToServer = false;
    state.chat = [reply()];
    state.log = [];
    state.listeners = new Map();
    document.body.innerHTML = '<div id="chat"><div class="mes" mesid="0"><div class="mes_text"></div></div></div>';
    fakeDes();
    updateMessageBlock(0, state.chat[0]!);
    await eventSource.emit(EVENTS.CHARACTER_MESSAGE_RENDERED, 0);
    state.log = [];
});

describe('re-rendering a message after a picture', () => {
    it('a finished marker image: saved, re-rendered, then MESSAGE_UPDATED, so the cards come back', async () => {
        expect(cards()).toBe(true);
        // What 0.15.0 did: a bare re-render keeps the mark and loses the cards.
        updateMessageBlock(0, state.chat[0]!);
        expect(cards()).toBe(false);
        state.log = [];
        const inline = new InlineImages({ notify: vi.fn() } as never);
        expect(await inline.completePending(0, 'img-0001', produced as never)).toBe(true);
        expect(state.log).toEqual(['saved', 'render', 'event:message_updated']);
        expect(cards()).toBe(true);
    });

    it('a failed marker image too (the status change re-renders the reply)', async () => {
        const inline = new InlineImages({ notify: vi.fn() } as never);
        expect(await inline.setMarkerStatus(0, 'img-0001', 'error', 'no NovelAI')).toBe(true);
        expect(state.log).toEqual(['saved', 'render', 'event:message_updated']);
        expect(cards()).toBe(true);
    });

    it('never sends MESSAGE_EDITED: the story text did not change', async () => {
        const inline = new InlineImages({ notify: vi.fn() } as never);
        await inline.addPending(0, 'Hello. [nai:img:img-0001]\n[nai:img:img-0002]', [
            createPendingImage('img-0002', { prompt: 'y' }, defaultDisplay()),
        ]);
        await inline.remove(0, 'img-0002');
        expect(state.log.filter((line) => line.startsWith('event:'))).toEqual([
            'event:message_updated',
            'event:message_updated',
        ]);
    });

    it('a message that is not on screen is re-rendered quietly', async () => {
        document.body.innerHTML = '<div id="chat"></div>';
        await rerenderMessage(0, state.chat[0]!);
        expect(state.log).toEqual(['render']);
    });

    it('an insertion in the message editor neither re-renders nor announces (ST does it when the editor closes)', async () => {
        const inline = new InlineImages({ notify: vi.fn() } as never);
        await inline.saveCreated(0, pending());
        expect(state.log).toEqual(['saved']);
    });

    it('a picture that lands while the message is being edited keeps the editor and what was typed (0.15.2)', async () => {
        const text = document.querySelector('#chat .mes[mesid="0"] .mes_text')!;
        text.innerHTML = '<textarea id="curEditTextarea" class="edit_textarea">Hello, half-typed</textarea>';
        const inline = new InlineImages({ notify: vi.fn() } as never);
        expect(await inline.completePending(0, 'img-0001', produced as never)).toBe(true);
        // Stored, not shown: no re-render, no event, the textarea and its text are where they were.
        expect(state.log).toEqual(['saved']);
        expect(document.querySelector<HTMLTextAreaElement>('#curEditTextarea')?.value).toBe('Hello, half-typed');
        expect(state.chat[0]!.extra?.nai_images).toEqual([
            expect.objectContaining({ id: 'img-0001', marker: expect.objectContaining({ status: 'done' }) }),
        ]);
        // ST closing the editor (Cancel or Save) re-renders from the chat and announces it: the picture and the
        // cards are there.
        updateMessageBlock(0, state.chat[0]!);
        await eventSource.emit(EVENTS.MESSAGE_UPDATED, 0);
        expect(cards()).toBe(true);
    });

    it('the reasoning editor counts as editing too', async () => {
        document
            .querySelector('#chat .mes[mesid="0"]')!
            .insertAdjacentHTML('beforeend', '<textarea class="reasoning_edit_textarea">thinking</textarea>');
        await rerenderMessage(0, state.chat[0]!);
        expect(state.log).toEqual([]);
    });

    it("NAI Studio's own MESSAGE_UPDATED listener (reconcile) does not loop", async () => {
        const inline = new InlineImages({ notify: vi.fn() } as never);
        eventSource.on(EVENTS.MESSAGE_UPDATED, (id) => void inline.reconcileMessage(Number(id)));
        // A placeholder without an entry: reconcile removes it once, the second pass finds nothing.
        state.chat[0]!.mes = 'Hello. [nai:img:img-0001] [nai:img:img-gone]';
        await inline.updateDisplay(0, 'img-0001', { caption: 'c' });
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(state.log.filter((line) => line === 'render')).toHaveLength(2);
        expect(state.chat[0]!.mes).not.toContain('img-gone');
        expect(cards()).toBe(true);
    });
});
