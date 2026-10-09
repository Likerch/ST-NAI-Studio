// @vitest-environment happy-dom
// Persona avatar from the passport (v0.9.2): a free quiet portrait of the passport, uploaded the way
// SillyTavern uploads persona avatars (crop popup unless avatars are never resized, overwrite_name).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { GeneratedImage } from '../../src/transport';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    neverResize: false,
    cropResult: 1 as number | null,
    rendered: [] as unknown[],
    popups: 0,
}));

class FakePopup {
    cropData = { x: 1, y: 2, width: 3, height: 4 };
    constructor(
        public content: string,
        public type: number,
    ) {
        state.popups++;
    }
    async show() {
        return state.cropResult;
    }
}

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        powerUserSettings: { never_resize_avatars: state.neverResize },
        Popup: FakePopup,
        POPUP_TYPE: { TEXT: 1, CONFIRM: 2, INPUT: 3, DISPLAY: 4, CROP: 5 },
        getThumbnailUrl: (type: string, file: string) => `/thumbnail?type=${type}&file=${file}`,
    }),
    requestHeaders: () => ({ 'X-CSRF-Token': 't' }),
    importHost: async () => ({
        getUserAvatars: async (render: boolean, at: string) => state.rendered.push([render, at]),
    }),
}));

const {
    AVATAR_FRAMING,
    centeredAvatarCrop,
    drawFreePersonaAvatar,
    drawPersonaAvatar,
    generatePersonaAvatarFile,
    uploadPersonaAvatar,
} = await import('../../src/features/characters/persona-avatar');
const { NaiError } = await import('../../src/core/errors');

const image: GeneratedImage = { base64: 'iVBORw0KGgo=', mime: 'image/png', index: 0 };

beforeEach(() => {
    state.settings = defaultSettings();
    state.neverResize = false;
    state.cropResult = 1;
    state.rendered = [];
    state.popups = 0;
});

function anna() {
    const passport = defaultPassport('character', 'Anna');
    passport.slots.base = '1girl';
    passport.slots.hair = 'silver hair';
    return passport;
}

/** A pipeline whose picture came back at the size NovelAI drew it. */
const drawn = (width = 832, height = 1216) =>
    vi.fn(async () => ({ images: [image], prepared: { request: { width, height }, cost: { total: 0 } } }));

describe('drawPersonaAvatar', () => {
    it('draws the passport as a quiet free portrait without the NSFW layer', async () => {
        const passport = defaultPassport('character', 'Аня');
        passport.slots.base = '1girl';
        passport.slots.hair = 'red hair';
        passport.nsfw = { enabled: true, tags: 'nude' };
        passport.negative = 'glasses';
        const produce = vi.fn(async () => ({ images: [image] }));
        const result = await drawPersonaAvatar({ produce } as never, passport);
        expect(result).toBe(image);
        const req = (produce.mock.calls[0] as unknown[])[0] as {
            scene: string;
            noContinuity: boolean;
            overrides: { quiet: boolean; negative: string; generation: { width: number; height: number } };
        };
        expect(req.scene).toBe(`1girl, red hair, ${AVATAR_FRAMING}`);
        expect(req.noContinuity).toBe(true);
        expect(req.overrides.quiet).toBe(true);
        expect(req.overrides.negative).toBe('glasses');
        const { width, height } = req.overrides.generation;
        expect(height).toBeGreaterThan(width);
        expect(width * height).toBeLessThanOrEqual(1024 * 1024);
    });

    it('returns null when the generation is cancelled', async () => {
        const produce = vi.fn(async () => null);
        expect(await drawPersonaAvatar({ produce } as never, defaultPassport())).toBeNull();
    });
});

describe('uploadPersonaAvatar', () => {
    it('crops, overwrites the persona file and refreshes the persona list', async () => {
        const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
            async () => new Response(JSON.stringify({ path: 'me.png' })),
        );
        vi.stubGlobal('fetch', fetch);
        expect(await uploadPersonaAvatar('me.png', image)).toBe('me.png');
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(url.startsWith('/api/avatars/upload?crop=')).toBe(true);
        expect(JSON.parse(decodeURIComponent(url.split('crop=')[1] ?? ''))).toEqual({
            x: 1,
            y: 2,
            width: 3,
            height: 4,
        });
        const form = init.body as FormData;
        expect(form.get('overwrite_name')).toBe('me.png');
        expect((form.get('avatar') as File).type).toBe('image/png');
        expect(fetch.mock.calls.map((call) => call[0])).toContain('/User Avatars/me.png');
        expect(state.rendered).toEqual([[true, 'me.png']]);
        vi.unstubAllGlobals();
    });

    it('uploads without a crop when avatars are never resized, and stops when the crop is closed', async () => {
        const fetch = vi.fn(async () => new Response('{}'));
        vi.stubGlobal('fetch', fetch);
        state.neverResize = true;
        expect(await uploadPersonaAvatar('me.png', image)).toBe('me.png');
        expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('/api/avatars/upload');
        fetch.mockClear();
        state.neverResize = false;
        state.cropResult = null;
        expect(await uploadPersonaAvatar('me.png', image)).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it('reports a failed upload', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response('', { status: 500 })),
        );
        state.neverResize = true;
        await expect(uploadPersonaAvatar('me.png', image)).rejects.toThrow('HTTP 500');
        vi.unstubAllGlobals();
    });

    it("sends ST's default crop without a popup when the image size is known (since 0.15)", async () => {
        const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
            async () => new Response(JSON.stringify({ path: '1728000000000-Anna.png' })),
        );
        vi.stubGlobal('fetch', fetch);
        const path = await uploadPersonaAvatar('1728000000000-Anna.png', image, { size: { width: 832, height: 1216 } });
        expect(path).toBe('1728000000000-Anna.png');
        expect(state.popups).toBe(0);
        const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(JSON.parse(decodeURIComponent(url.split('?crop=')[1] ?? ''))).toEqual({
            x: 10,
            y: 0,
            width: 811,
            height: 1216,
            want_resize: true,
        });
        expect((init.body as FormData).get('overwrite_name')).toBe('1728000000000-Anna.png');
        // Avatars are never resized: uploaded as it is, the way ST does it.
        fetch.mockClear();
        state.neverResize = true;
        await uploadPersonaAvatar('1728000000000-Anna.png', image, { size: { width: 832, height: 1216 } });
        expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('/api/avatars/upload');
        expect(state.popups).toBe(0);
        vi.unstubAllGlobals();
    });
});

describe('centeredAvatarCrop', () => {
    it("is the largest centred 2:3 box, as ST's crop popup proposes it", () => {
        expect(centeredAvatarCrop(832, 1216)).toEqual({ x: 10, y: 0, width: 811, height: 1216, want_resize: true });
        expect(centeredAvatarCrop(1024, 1024)).toEqual({ x: 170, y: 0, width: 683, height: 1024, want_resize: true });
        expect(centeredAvatarCrop(1216, 832)).toEqual({ x: 330, y: 0, width: 555, height: 832, want_resize: true });
        expect(centeredAvatarCrop(512, 1024)).toEqual({ x: 0, y: 128, width: 512, height: 768, want_resize: true });
    });
});

describe('drawFreePersonaAvatar (since 0.15)', () => {
    it('draws free only: no Anlas, at most 28 steps, no vibe encoding, a portrait of no chat in the queue', async () => {
        state.settings.generation.steps = 40;
        const produce = drawn();
        const abort = new AbortController();
        const result = await drawFreePersonaAvatar({ produce } as never, anna(), abort.signal);
        expect(result).toEqual({ image, width: 832, height: 1216 });
        const req = (produce.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
        expect(req).toMatchObject({
            scene: `1girl, silver hair, ${AVATAR_FRAMING}`,
            interpret: 'cyrillic',
            noContinuity: true,
            maxCost: 0,
            skipCostConfirm: true,
            noVibeEncoding: true,
            chatless: true,
            queue: { priority: 'portrait', kind: 'portrait' },
            signal: abort.signal,
            overrides: { quiet: true, edit: false, generation: { steps: 28, samples: 1, characters: [] } },
        });
        const { width, height } = (req.overrides as { generation: { width: number; height: number } }).generation;
        expect(width * height).toBeLessThanOrEqual(1024 * 1024);
        state.settings.generation.steps = 23;
        await drawFreePersonaAvatar({ produce } as never, anna());
        const second = (produce.mock.calls[1] as unknown[])[0];
        expect(second).toMatchObject({ overrides: { generation: { steps: 23 } } });
        expect(second).not.toHaveProperty('signal');
    });
});

describe('generatePersonaAvatarFile (since 0.15)', () => {
    it('refuses a picture that would cost Anlas before anything is uploaded', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        const produce = vi.fn(async () => {
            throw new NaiError('free-only-blocked', 'none', { cost: 6 });
        });
        expect(await generatePersonaAvatarFile({ produce } as never, 'a.png', anna())).toEqual({
            ok: false,
            error: 'cost',
        });
        expect(fetch).not.toHaveBeenCalled();
        expect(state.popups).toBe(0);
        vi.unstubAllGlobals();
    });

    it('stops on an abort, reports other failures by code and a failed upload as "upload"', async () => {
        const fetch = vi.fn(async () => new Response('', { status: 500 }));
        vi.stubGlobal('fetch', fetch);
        const abort = new AbortController();
        abort.abort();
        const produce = drawn();
        expect(await generatePersonaAvatarFile({ produce } as never, 'a.png', anna(), abort.signal)).toEqual({
            ok: false,
            error: 'aborted',
        });
        expect(produce).not.toHaveBeenCalled();
        // Aborted while it was drawn: nothing is uploaded.
        const late = new AbortController();
        const slow = vi.fn(async () => {
            late.abort();
            return { images: [image], prepared: { request: { width: 832, height: 1216 } } };
        });
        expect(await generatePersonaAvatarFile({ produce: slow } as never, 'a.png', anna(), late.signal)).toEqual({
            ok: false,
            error: 'aborted',
        });
        expect(fetch).not.toHaveBeenCalled();
        const declined = vi.fn(async () => null);
        expect(await generatePersonaAvatarFile({ produce: declined } as never, 'a.png', anna())).toMatchObject({
            error: 'aborted',
        });
        const refused = vi.fn(async () => {
            throw new NaiError('unauthorized', 'none');
        });
        expect(await generatePersonaAvatarFile({ produce: refused } as never, 'a.png', anna())).toMatchObject({
            ok: false,
            error: 'unauthorized',
        });
        expect(await generatePersonaAvatarFile({ produce } as never, 'a.png', anna())).toEqual({
            ok: false,
            error: 'upload',
        });
        vi.unstubAllGlobals();
    });
});
