// Several passports per card and their kinds (v0.8): reading old and new cards, the main
// character, tags of non-character passports, and passports written by an LLM.
import { describe, expect, it } from 'vitest';
import {
    defaultPassport,
    extractJson,
    isPassportEmpty,
    LEGACY_PASSPORT_ID,
    normalizePassport,
    normalizePassportList,
    parseGeneratedPassports,
    passportGenMessages,
    passportTags,
    primaryPassport,
} from '../../src/domain';

describe('passport list', () => {
    it('reads the single passport of older cards as the main character', () => {
        const legacy = { slots: { hair: 'red hair' } };
        const [only] = normalizePassportList(undefined, legacy);
        expect(only).toMatchObject({ id: LEGACY_PASSPORT_ID, kind: 'character', name: '', aliases: [] });
        expect(only!.slots.hair).toBe('red hair');
        expect(normalizePassportList(undefined, undefined)).toEqual([]);
    });

    it('prefers the list, keeps kinds and makes ids unique', () => {
        const list = normalizePassportList(
            [
                { id: 'a', kind: 'character', name: 'Mira', aliases: 'Mi, Mirochka', slots: { hair: 'black hair' } },
                { id: 'a', kind: 'world', name: 'Aster', tags: 'steampunk, airships' },
                { kind: 'nonsense', name: 'X' },
            ],
            { slots: { hair: 'ignored' } },
        );
        expect(list.map((p) => [p.id, p.kind, p.name])).toEqual([
            ['a', 'character', 'Mira'],
            ['a-2', 'world', 'Aster'],
            ['main', 'character', 'X'],
        ]);
        expect(list[0]!.aliases).toEqual(['Mi', 'Mirochka']);
    });

    it('finds the passport of the card itself', () => {
        const unnamed = defaultPassport('character', '');
        const other = defaultPassport('character', 'Bob');
        const named = defaultPassport('character', 'Lyra');
        const world = defaultPassport('world', 'Realm');
        expect(primaryPassport([world, other, unnamed], 'Lyra')).toBe(unnamed);
        expect(primaryPassport([other, named], 'lyra')).toBe(named);
        expect(primaryPassport([world, other], 'Lyra')).toBe(other);
        expect(primaryPassport([world], 'Lyra')).toBeNull();
    });

    it('non-character passports are their tags', () => {
        const location = normalizePassport({
            kind: 'location',
            name: 'Tavern',
            tags: 'tavern, tavern, candlelight',
            slots: { hair: 'x' },
        })!;
        expect(passportTags(location, { allowNsfw: true })).toBe('tavern, candlelight');
        expect(isPassportEmpty(location)).toBe(false);
        expect(isPassportEmpty({ ...location, tags: ' ' })).toBe(true);
    });
});

describe('generated passports', () => {
    it('builds the prompt from the card fields', () => {
        const { system, user } = passportGenMessages(
            { name: 'Monster Inn', description: 'An inn run by Mira, a tall lamia.', scenario: 'You arrive at night.' },
            'card',
        );
        expect(system).toContain('kind "scenario"');
        expect(user).toBe(
            'Card: Monster Inn\n\nDescription:\nAn inn run by Mira, a tall lamia.\n\nScenario:\nYou arrive at night.',
        );
        expect(passportGenMessages({ name: 'Me', description: 'short' }, 'persona').system).toContain(
            "player's persona",
        );
    });

    it('reads JSON wrapped in chatter or code fences', () => {
        expect(extractJson('Sure!\n```json\n{"passports": []}\n```')).toEqual({ passports: [] });
        expect(extractJson('text [1, 2] more')).toEqual([1, 2]);
        expect(extractJson('no json')).toBeNull();
    });

    it('turns the answer into passports, drops empty ones and cleans tags', () => {
        const answer = JSON.stringify({
            passports: [
                {
                    kind: 'character',
                    name: 'Mira',
                    aliases: ['Mira', 'Miri'],
                    base: '1girl, lamia',
                    hair: 'long_hair, black hair',
                    outfits: [
                        { name: 'Apron', tags: 'apron' },
                        { name: '', tags: 'x' },
                    ],
                    nsfw: 'large breasts',
                    negative: 'legs',
                },
                { kind: 'location', name: 'Inn', tags: 'inn, wooden_interior' },
                { kind: 'world', name: 'World', tags: '' },
                { kind: 'character', name: '', hair: 'blonde' },
            ],
        });
        const list = parseGeneratedPassports(`Here: ${answer}`, 'Monster Inn');
        expect(list.map((p) => [p.kind, p.name])).toEqual([
            ['character', 'Mira'],
            ['location', 'Inn'],
            ['character', 'Monster Inn'],
        ]);
        const mira = list[0]!;
        expect(mira.aliases).toEqual(['Miri']);
        expect(mira.slots).toMatchObject({ base: '1girl, lamia', hair: 'long hair, black hair' });
        expect(mira.outfits).toEqual([{ name: 'Apron', tags: 'apron' }]);
        expect(mira.nsfw).toEqual({ enabled: false, tags: 'large breasts' });
        expect(mira.negative).toBe('legs');
        expect(list[1]!.tags).toBe('inn, wooden interior');
        expect(new Set(list.map((p) => p.id)).size).toBe(3);
    });
});
