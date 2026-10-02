import { describe, expect, it } from 'vitest';
import {
    canUpscale,
    defaultVibeEntry,
    DIRECTOR_EMOTIONS,
    DIRECTOR_TOOLS,
    directorBody,
    directorSize,
    directorToolCost,
    encodingCacheKey,
    enhanceSize,
    getCapabilities,
    MAX_REQUEST_PIXELS,
    planOutpaint,
    planVibes,
    setApplies,
    toolTakesPrompt,
    upscaleCost,
    vibeAvailability,
} from '../../src/domain';
import type { VibeItem, VibeSet } from '../../src/domain';

const opus = { tier: 3, active: true, anlas: 100, usageNegative: false };

describe('Director Tools', () => {
    it('knows seven tools and 24 emotions', () => {
        expect(DIRECTOR_TOOLS).toHaveLength(7);
        expect(DIRECTOR_EMOTIONS).toHaveLength(24);
        expect(DIRECTOR_TOOLS.filter(toolTakesPrompt)).toEqual(['colorize', 'emotion']);
    });

    it('sizes images like the web client: down to 3145728-2000 px, up to about 1 MP', () => {
        expect(directorSize(832, 1216)).toEqual({ width: 832, height: 1216 });
        const big = directorSize(2048, 2048);
        expect(big.width * big.height).toBeLessThanOrEqual(3145728 - 2000);
        expect(big.width).toBe(big.height);
        const small = directorSize(512, 512);
        expect(small.width * small.height).toBeGreaterThan(1000000);
        expect(small.width * small.height).toBeLessThanOrEqual(1011712);
        expect(directorSize(0, 10)).toEqual({ width: 0, height: 0 });
    });

    it('builds augment bodies with prompt and defry only where they apply', () => {
        expect(directorBody('lineart', 'IMG', { width: 832, height: 1216 })).toEqual({
            req_type: 'lineart',
            use_new_shared_trial: true,
            width: 832,
            height: 1216,
            image: 'IMG',
        });
        expect(
            directorBody(
                'emotion',
                'IMG',
                { width: 64, height: 64 },
                { emotion: 'happy', prompt: ' smiling ', defry: 9 },
            ),
        ).toMatchObject({
            prompt: 'happy;;smiling',
            defry: 5,
        });
        expect(directorBody('emotion', 'IMG', { width: 64, height: 64 })).toMatchObject({
            prompt: 'neutral;;',
            defry: 0,
        });
        expect(
            directorBody('colorize', 'IMG', { width: 64, height: 64 }, { prompt: 'red dress', defry: 2 }),
        ).toMatchObject({
            prompt: 'red dress',
            defry: 2,
        });
    });

    it('six tools are free for Opus at about 1 MP, background removal never is', () => {
        const size = directorSize(832, 1216);
        expect(directorToolCost('lineart', size.width, size.height, opus)).toBe(0);
        expect(directorToolCost('bg-removal', size.width, size.height, opus)).toBe(65);
        expect(directorToolCost('sketch', size.width, size.height, { ...opus, tier: 1 })).toBeGreaterThan(0);
    });
});

describe('outpaint', () => {
    it('grows the canvas to multiples of 64 and masks new areas with an overlap', () => {
        const plan = planOutpaint(832, 1216, { left: 128, right: 0, top: 0, bottom: 64 });
        expect(plan).toMatchObject({ width: 960, height: 1280, offsetX: 128, offsetY: 0, tooLarge: false });
        expect(plan.maskRects).toEqual([
            { x: 0, y: 0, w: 144, h: 1280 },
            { x: 0, y: 1200, w: 960, h: 80 },
        ]);
        const odd = planOutpaint(832, 1216, { left: 0, right: 10, top: 0, bottom: 0 }, 0);
        expect(odd.width).toBe(896);
        expect(odd.maskRects).toEqual([{ x: 832, y: 0, w: 64, h: 1216 }]);
        expect(planOutpaint(2048, 1536, { left: 512, right: 512, top: 0, bottom: 0 }).tooLarge).toBe(true);
        expect(planOutpaint(64, 64, { left: -5, right: 0, top: 0, bottom: 0 }).maskRects).toEqual([]);
    });
});

describe('enhance and upscale', () => {
    it('enhance scales up in multiples of 64 within the maximum area', () => {
        expect(enhanceSize(832, 1216, 1.5)).toEqual({ width: 1280, height: 1856 });
        const capped = enhanceSize(1536, 2048, 2);
        expect(capped.width * capped.height).toBeLessThanOrEqual(MAX_REQUEST_PIXELS);
        expect(capped.width % 64).toBe(0);
    });

    it('upscale accepts sources up to 1536x2048 and costs 1-4 Anlas', () => {
        expect(canUpscale(832, 1216)).toBe(true);
        expect(canUpscale(2048, 2048)).toBe(false);
        expect(upscaleCost(832, 1216)).toBe(1);
        expect(upscaleCost(1536, 2048)).toBe(4);
    });
});

describe('vibe library', () => {
    const items: VibeItem[] = ['a', 'b', 'c'].map((id) => ({
        id,
        name: id,
        imageHash: `h${id}`,
        imageKey: `k${id}`,
        thumbKey: `t${id}`,
        createdAt: '',
    }));
    const set = (over: Partial<VibeSet>): VibeSet => ({
        id: 's',
        name: 's',
        enabled: true,
        global: false,
        entries: [],
        bindings: { characters: [], chats: [], styles: [] },
        ...over,
    });
    const ctx = { characters: ['alice'], chatId: 'chat-1', style: 'Ink' };

    it('applies global sets and sets bound to the character, chat or style', () => {
        expect(setApplies(set({ global: true }), ctx)).toBe(true);
        expect(setApplies(set({ global: true, enabled: false }), ctx)).toBe(false);
        expect(setApplies(set({ bindings: { characters: ['alice'], chats: [], styles: [] } }), ctx)).toBe(true);
        expect(setApplies(set({ bindings: { characters: [], chats: ['chat-1'], styles: [] } }), ctx)).toBe(true);
        expect(setApplies(set({ bindings: { characters: [], chats: [], styles: ['Ink'] } }), ctx)).toBe(true);
        expect(setApplies(set({ bindings: { characters: ['bob'], chats: ['x'], styles: ['y'] } }), ctx)).toBe(false);
        expect(
            setApplies(set({ bindings: { characters: [], chats: [''], styles: [''] } }), {
                characters: [],
                chatId: '',
                style: '',
            }),
        ).toBe(false);
    });

    it('plans enabled entries, first occurrence wins, values clamped, at most 16', () => {
        const sets = [
            set({
                global: true,
                entries: [
                    { vibeId: 'a', strength: 2, informationExtracted: 0, enabled: true },
                    { vibeId: 'b', strength: 0.5, informationExtracted: 0.7, enabled: false },
                ],
            }),
            set({
                global: true,
                entries: [
                    { vibeId: 'a', strength: 0.1, informationExtracted: 1, enabled: true },
                    { vibeId: 'c', strength: 0.3, informationExtracted: 0.5, enabled: true },
                    { vibeId: 'zzz', strength: 1, informationExtracted: 1, enabled: true },
                ],
            }),
        ];
        expect(planVibes(sets, items, ctx).map((p) => [p.item.id, p.strength, p.informationExtracted])).toEqual([
            ['a', 1, 0.01],
            ['c', 0.3, 0.5],
        ]);
        const many: VibeItem[] = Array.from({ length: 20 }, (_, i) => ({ ...items[0]!, id: `v${i}` }));
        expect(
            planVibes([set({ global: true, entries: many.map((m) => defaultVibeEntry(m.id)) })], many, ctx),
        ).toHaveLength(16);
    });

    it('explains availability per model and transport', () => {
        expect(vibeAvailability(getCapabilities('nai-diffusion-5-full'), true)).toBe('feature-flag-off');
        expect(vibeAvailability(getCapabilities('nai-diffusion-4-5-full'), true)).toBe('ok');
        expect(vibeAvailability(getCapabilities('nai-diffusion-4-5-full'), false)).toBe('transport');
        expect(vibeAvailability(getCapabilities('nai-diffusion-3'), true)).toBe('ok');
        expect(defaultVibeEntry('x', 'nai-diffusion-4-5-full').informationExtracted).toBe(0.7);
        expect(defaultVibeEntry('x', 'nai-diffusion-4-full').informationExtracted).toBe(1);
        expect(encodingCacheKey('h', 'm', 0.7)).toBe('vibeenc:h:m:0.70');
    });
});
