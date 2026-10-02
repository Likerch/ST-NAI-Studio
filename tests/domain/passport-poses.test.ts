import { describe, expect, it } from 'vitest';
import {
    clothingTags,
    defaultPassport,
    detectPairPose,
    detectPose,
    findPairPose,
    findPose,
    isPassportEmpty,
    joinTags,
    normalizePassport,
    optionTags,
    pairPoseTags,
    PASSPORT_SLOTS,
    passportTags,
    POSE_CATEGORIES,
    POSES,
    posesByCategory,
    splitTags,
    STATE_PRESETS,
    FRAMINGS,
} from '../../src/domain';
import type { Passport } from '../../src/domain';

function passport(over: Partial<Passport> = {}): Passport {
    const p = defaultPassport();
    p.slots = {
        ...p.slots,
        base: '1girl, elf',
        hair: 'long hair, silver hair',
        eyes: 'green eyes',
        clothing: 'white dress',
        style: 'watercolor',
    };
    return { ...p, ...over };
}

describe('tags', () => {
    it('splits, trims and removes case-insensitive duplicates', () => {
        expect(splitTags(' a, B ,b,\n c,, ')).toEqual(['a', 'B', 'c']);
        expect(joinTags('a, b', '', 'B, c')).toBe('a, b, c');
    });
});

describe('passport', () => {
    it('assembles slots in a stable order with the art style last', () => {
        expect(passportTags(passport(), { allowNsfw: false })).toBe(
            '1girl, elf, long hair, silver hair, green eyes, white dress, watercolor',
        );
    });

    it('uses the active or an explicit outfit instead of the clothing slot', () => {
        const p = passport({ outfits: [{ name: 'Armor', tags: 'plate armor, cape' }], activeOutfit: 'Armor' });
        expect(clothingTags(p)).toBe('plate armor, cape');
        expect(passportTags(p, { allowNsfw: false })).toContain('plate armor, cape');
        expect(passportTags(p, { allowNsfw: false, outfit: 'missing' })).toContain('white dress');
    });

    it('adds enabled and forced states; the NSFW layer needs both switches', () => {
        const p = passport({ nsfw: { enabled: true, tags: 'nsfw-tag' } });
        p.states = p.states.map((s) => (s.id === 'wet' ? { ...s, enabled: true } : s));
        const withStates = passportTags(p, { allowNsfw: false, states: ['tears'] });
        expect(withStates).toContain(STATE_PRESETS.wet);
        expect(withStates).toContain('tears, crying');
        expect(withStates).not.toContain('nsfw-tag');
        expect(passportTags(p, { allowNsfw: true })).toContain('nsfw-tag');
        expect(passportTags({ ...p, nsfw: { enabled: false, tags: 'nsfw-tag' } }, { allowNsfw: true })).not.toContain(
            'nsfw-tag',
        );
    });

    it('normalizes stored data defensively and keeps custom states', () => {
        expect(normalizePassport(null)).toBeNull();
        expect(normalizePassport('x')).toBeNull();
        const stored = {
            slots: { base: '1boy', hair: 5 },
            nsfw: { enabled: 'yes', tags: 'x' },
            outfits: [{ name: ' Coat ', tags: 'coat' }, { name: '', tags: 'nothing' }, 'junk'],
            activeOutfit: 'Coat',
            states: [
                { id: 'wet', tags: 'soaked', enabled: true },
                { id: 'glowing', tags: 'glowing eyes', enabled: true },
                { id: '' },
            ],
            negative: 'bad hands',
            pose: { preset: 'sitting', custom: 'smile' },
            position: { x: 2, y: 'a' },
        };
        const p = normalizePassport(stored)!;
        expect(p.slots.base).toBe('1boy');
        expect(p.slots.hair).toBe('');
        expect(p.nsfw.enabled).toBe(false);
        expect(p.outfits).toEqual([{ name: 'Coat', tags: 'coat' }]);
        expect(p.activeOutfit).toBe('Coat');
        expect(p.states.find((s) => s.id === 'wet')).toEqual({ id: 'wet', tags: 'soaked', enabled: true });
        expect(p.states.find((s) => s.id === 'glowing')?.enabled).toBe(true);
        expect(p.states.filter((s) => s.id === 'tears')).toHaveLength(1);
        expect(p.pose).toEqual({ preset: 'sitting', custom: 'smile' });
        expect(p.position).toEqual({ x: 1, y: 0.5 });
        expect(normalizePassport({ activeOutfit: 'none' })?.activeOutfit).toBe('');
        expect(normalizePassport({})?.position).toBeNull();
    });

    it('survives a JSON round trip (card export/import keeps data.extensions as JSON)', () => {
        const p = passport({ outfits: [{ name: 'A', tags: 'a' }], activeOutfit: 'A', negative: 'n' });
        const card = { data: { extensions: { nai_studio: { passport: p } } } };
        const restored = normalizePassport(JSON.parse(JSON.stringify(card)).data.extensions.nai_studio.passport);
        expect(restored).toEqual(p);
    });

    it('knows an empty passport', () => {
        expect(isPassportEmpty(null)).toBe(true);
        expect(isPassportEmpty(defaultPassport())).toBe(true);
        expect(isPassportEmpty(passport())).toBe(false);
        expect(PASSPORT_SLOTS).toHaveLength(8);
    });
});

describe('poses', () => {
    it('every pose has a known category and unique id', () => {
        const ids = POSES.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const pose of POSES) expect(POSE_CATEGORIES).toContain(pose.category);
        const grouped = posesByCategory(POSES);
        expect([...grouped.values()].flat()).toHaveLength(POSES.length);
    });

    it('detects poses from English and Russian text (earliest mention wins)', () => {
        expect(detectPose('She sits on the floor and reads.')?.id).toBe('sitting');
        expect(detectPose('Она лежит на спине и смотрит вверх')?.id).toBe('lying');
        expect(detectPose('He crosses his arms, then sits down.')?.id).toBe('crossed_arms');
        expect(detectPose('Nothing happens here.')).toBeNull();
    });

    it('custom poses override the library by id', () => {
        const custom = [{ id: 'sitting', category: 'sitting' as const, tags: 'custom sit', keywords: [] }];
        expect(findPose('sitting', custom)?.tags).toBe('custom sit');
        expect(findPose('standing', custom)?.tags).toBe('standing');
        expect(findPose('nope')).toBeUndefined();
    });

    it('pair poses: interaction prefixes on V4+, plain tags otherwise', () => {
        const hug = findPairPose('hug')!;
        expect(pairPoseTags(hug, true)).toEqual(['source#hug', 'target#hug']);
        expect(pairPoseTags(findPairPose('holding_hands')!, true)).toEqual([
            'mutual#holding hands',
            'mutual#holding hands',
        ]);
        expect(pairPoseTags(hug, false)).toEqual(['hug', 'hug']);
        expect(detectPairPose('Alice hugs Bob tightly')?.id).toBe('hug');
        expect(detectPairPose('они держатся за руки')?.id).toBe('holding_hands');
        expect(detectPairPose('they talk')).toBeNull();
    });

    it('framing options resolve to tags', () => {
        expect(optionTags(FRAMINGS, 'cowboy_shot')).toBe('cowboy shot');
        expect(optionTags(FRAMINGS, 'auto')).toBe('');
        expect(optionTags(FRAMINGS, 'nope')).toBe('');
    });
});
