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
}));

class FakePopup {
    cropData = { x: 1, y: 2, width: 3, height: 4 };
    constructor(
        public content: string,
        public type: number,
    ) {}
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

const { AVATAR_FRAMING, drawPersonaAvatar, uploadPersonaAvatar } =
    await import('../../src/features/characters/persona-avatar');

const image: GeneratedImage = { base64: 'iVBORw0KGgo=', mime: 'image/png', index: 0 };

beforeEach(() => {
    state.settings = defaultSettings();
    state.neverResize = false;
    state.cropResult = 1;
    state.rendered = [];
});

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
        expect(await uploadPersonaAvatar('me.png', image)).toBe(true);
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
        expect(await uploadPersonaAvatar('me.png', image)).toBe(true);
        expect((fetch.mock.calls[0] as unknown as [string])[0]).toBe('/api/avatars/upload');
        fetch.mockClear();
        state.neverResize = false;
        state.cropResult = null;
        expect(await uploadPersonaAvatar('me.png', image)).toBe(false);
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
});
