// v0.12.1 domain: outfits recognised by the wording of a scene tracker (Outfit.looks, written by
// Maestro's wardrobe): normalisation of the wordings, matching a current look (exact, then word sets),
// the automatic scene drawing the recognised outfit instead of the look, chat overrides carrying looks.
import { describe, expect, it } from 'vitest';
import {
    applyPassportOverride,
    buildScene,
    defaultPassport,
    LOOK_MATCH_THRESHOLD,
    lookKey,
    lookOutfit,
    MAX_LOOK_LENGTH,
    MAX_OUTFIT_LOOKS,
    normalizeChatPassports,
    normalizeOutfit,
    normalizeOutfitLooks,
    normalizeOverride,
    normalizePassport,
    outfitForLook,
    participantFrom,
    passportDiff,
} from '../../src/domain';
import type { Passport, SceneCandidate, SceneSpec } from '../../src/domain';

const RU = {
    leather: 'Чёрная кожаная куртка, рваные джинсы',
    leatherAgain: 'черная кожаная куртка — «рваные» джинсы.',
    joined: 'Короткие светлые волосы; чёрная кожаная куртка, рваные джинсы; легко ранена',
    dress: 'Красное шёлковое платье',
    other: 'серый плащ с капюшоном',
};

function anna(): Passport {
    const p = defaultPassport('character', 'Anna', 'a1');
    p.slots.base = '1girl';
    p.slots.hair = 'short blonde hair';
    p.slots.clothing = 'school uniform';
    p.outfits = [
        { name: 'Ballgown', tags: 'blue ballgown' },
        { name: 'Leather', tags: 'black leather jacket, torn jeans', looks: [RU.leather] },
        { name: 'Party', tags: 'red silk dress', looks: ['red silk dress', RU.dress] },
    ];
    return p;
}

describe('tracker wordings of outfits', () => {
    it('reduces a wording for comparison: case, yo, punctuation, Russian quotes and dashes, spaces', () => {
        expect(lookKey(RU.leatherAgain)).toBe('черная кожаная куртка рваные джинсы');
        expect(lookKey(RU.leather)).toBe(lookKey(RU.leatherAgain));
        expect(lookKey('  Black   leather-jacket,\n"torn" jeans!  ')).toBe('black leather jacket torn jeans');
        expect(lookKey('...')).toBe('');
    });

    it('keeps strings only, trimmed, cut, without duplicates, the newest ones', () => {
        expect(normalizeOutfitLooks(undefined)).toEqual([]);
        expect(normalizeOutfitLooks('red dress')).toEqual([]);
        expect(
            normalizeOutfitLooks(['  red dress ', 5, null, '', '!!', 'Red  dress.', RU.leather, RU.leatherAgain]),
        ).toEqual(['red dress', RU.leather]);
        const long = 'x'.repeat(MAX_LOOK_LENGTH + 50);
        expect(normalizeOutfitLooks([long])[0]).toHaveLength(MAX_LOOK_LENGTH);
        const many = Array.from({ length: MAX_OUTFIT_LOOKS + 3 }, (_, i) => `look number ${i}`);
        const kept = normalizeOutfitLooks(many);
        expect(kept).toHaveLength(MAX_OUTFIT_LOOKS);
        expect(kept[0]).toBe('look number 3');
        expect(kept.at(-1)).toBe(`look number ${MAX_OUTFIT_LOOKS + 2}`);
    });

    it('keeps looks in stored passports and leaves them out when there are none', () => {
        expect(normalizeOutfit({ name: ' Leather ', tags: 'jacket', looks: [' a jacket ', 3] })).toEqual({
            name: 'Leather',
            tags: 'jacket',
            looks: ['a jacket'],
        });
        const plain = normalizeOutfit({ name: 'Robe', tags: 'robe', looks: [] });
        expect(plain).toEqual({ name: 'Robe', tags: 'robe' });
        expect('looks' in plain).toBe(false);
        const stored = JSON.parse(JSON.stringify(anna())) as Record<string, unknown>;
        (stored.outfits as Record<string, unknown>[])[1]!.looks = [RU.leather, RU.leatherAgain, 7];
        const passport = normalizePassport(stored)!;
        expect(passport.outfits[0]).toEqual({ name: 'Ballgown', tags: 'blue ballgown' });
        expect(passport.outfits[1]!.looks).toEqual([RU.leather]);
    });
});

describe('outfitForLook', () => {
    it('finds the outfit by an exact wording, Russian, whatever the punctuation and yo', () => {
        expect(outfitForLook(anna(), RU.leatherAgain)).toBe('Leather');
        expect(outfitForLook(anna(), 'красное шелковое платье!')).toBe('Party');
    });

    it('finds the outfit in one part of a look joined from several tracker fields', () => {
        expect(outfitForLook(anna(), RU.joined)).toBe('Leather');
        expect(outfitForLook(anna(), `short blonde hair\nRed silk dress`)).toBe('Party');
    });

    it('accepts close word sets from the threshold on; one-letter words do not count', () => {
        expect(LOOK_MATCH_THRESHOLD).toBe(0.75);
        // 3 of 4 words: exactly the threshold.
        expect(outfitForLook(anna(), 'red silk dress, gloves')).toBe('Party');
        // 3 of 5 words: below.
        expect(outfitForLook(anna(), 'red silk dress, long gloves')).toBe('');
        expect(outfitForLook(anna(), 'a red silk dress')).toBe('Party');
        const p = anna();
        p.outfits[1]!.looks = ['black leather jacket, torn jeans, white sneakers'];
        expect(outfitForLook(p, 'black leather jacket, torn jeans, white sneakers, belt')).toBe('Leather');
        expect(outfitForLook(p, 'black leather jacket, blue jeans')).toBe('');
        expect(outfitForLook(anna(), RU.other)).toBe('');
    });

    it('prefers an exact wording over a close one, and the closest of the close ones', () => {
        const p = anna();
        p.outfits = [
            { name: 'Gloves', tags: 'gloves', looks: ['red silk dress, gloves'] },
            { name: 'Exact', tags: 'dress', looks: ['red silk dress'] },
        ];
        expect(outfitForLook(p, 'red silk dress')).toBe('Exact');
        p.outfits = [
            { name: 'Far', tags: 'x', looks: ['old grey wool coat, black boots, hat'] },
            { name: 'Near', tags: 'y', looks: ['old grey wool coat, black boots'] },
        ];
        // Both pass the threshold: 6 common words of 8 (0.75) against 6 of 7 (0.86).
        expect(outfitForLook(p, 'old grey wool coat, black boots, scarf')).toBe('Near');
    });

    it('finds nothing without a character passport, a look or recorded wordings', () => {
        expect(outfitForLook(null, RU.leather)).toBe('');
        expect(outfitForLook(anna(), '')).toBe('');
        expect(outfitForLook(anna(), undefined)).toBe('');
        const place = defaultPassport('location', 'Mill');
        place.outfits = [{ name: 'Leather', tags: 'x', looks: [RU.leather] }];
        expect(outfitForLook(place, RU.leather)).toBe('');
        const bare = anna();
        bare.outfits = bare.outfits.map(({ name, tags }) => ({ name, tags }));
        expect(outfitForLook(bare, RU.leather)).toBe('');
    });
});

describe('the scene with a recognised look', () => {
    const caps = { maxCharacters: 6, positioning: 'grid', canPositionSingleCharacter: true, v4Prompt: true } as const;

    function spec(extra: Partial<SceneCandidate>, outfit = ''): SceneSpec {
        const candidate: SceneCandidate = {
            key: 'Anna.png',
            name: 'Anna',
            aliases: [],
            passport: anna(),
            fallbackPrompt: '',
            fallbackNegative: '',
            isUser: false,
            ...extra,
        };
        const participant = participantFrom(candidate, { x: 0.5, y: 0.5 });
        participant.outfit = outfit;
        return {
            base: 'street',
            framing: '',
            camera: '',
            distance: '',
            pair: null,
            participants: [participant],
            useCoords: false,
        };
    }

    const prompt = (s: SceneSpec) => buildScene(s, caps, { allowNsfw: false }).characters[0]!.prompt;

    it('draws the outfit whose wording the tracker used, not the converted look', () => {
        const s = spec({ currentLook: '1girl, black jacket, ripped jeans, injury', currentLookText: RU.joined });
        expect(s.participants[0]!.currentLookText).toBe(RU.joined);
        expect(lookOutfit(s.participants[0]!)).toBe('Leather');
        expect(prompt(s)).toBe('1girl, short blonde hair, black leather jacket, torn jeans');
    });

    it('recognises an English look as given when the tracker wording is not known', () => {
        expect(prompt(spec({ currentLook: 'red silk dress, gloves' }))).toBe(
            '1girl, short blonde hair, red silk dress',
        );
    });

    it('keeps the look over the clothing when no outfit recorded it', () => {
        const s = spec({ currentLook: 'grey hooded cloak', currentLookText: RU.other });
        expect(lookOutfit(s.participants[0]!)).toBe('');
        expect(prompt(s)).toBe('1girl, short blonde hair, grey hooded cloak');
    });

    it('lets an outfit chosen in the composer win over the look and the recognised outfit', () => {
        const s = spec({ currentLook: 'black jacket', currentLookText: RU.leather }, 'Ballgown');
        expect(prompt(s)).toBe('1girl, short blonde hair, blue ballgown');
    });

    it('does nothing for people without a passport', () => {
        const s = spec({
            passport: null,
            fallbackPrompt: '1girl, nurse',
            currentLookText: RU.leather,
            currentLook: 'x',
        });
        expect(lookOutfit(s.participants[0]!)).toBe('');
        expect(prompt(s)).toBe('1girl, nurse, x');
    });
});

describe('chat overrides with looks', () => {
    it('records a change of the wordings alone and merges it back', () => {
        const base = anna();
        expect(passportDiff(base, structuredClone(base))).toEqual({});
        const edited = structuredClone(base);
        edited.outfits[1]!.looks = [RU.leather, 'black jacket and jeans'];
        const diff = passportDiff(base, edited);
        expect(diff.outfits?.[1]).toEqual({
            name: 'Leather',
            tags: 'black leather jacket, torn jeans',
            looks: [RU.leather, 'black jacket and jeans'],
        });
        // The diff is a copy: later edits of the passport do not leak into it.
        edited.outfits[1]!.looks!.push('more');
        expect(diff.outfits?.[1]!.looks).toHaveLength(2);
        const merged = applyPassportOverride(base, diff);
        expect(merged.outfits[1]!.looks).toEqual([RU.leather, 'black jacket and jeans']);
        expect(base.outfits[1]!.looks).toEqual([RU.leather]);
    });

    it('parses stored overrides and chat passports with looks', () => {
        const override = normalizeOverride({
            outfits: [
                { name: 'Leather', tags: 'jacket', looks: [' black jacket ', 1, 'Black jacket!'] },
                { name: '', tags: 'nameless', looks: ['x'] },
                { name: 'Robe', tags: 'robe' },
            ],
        });
        expect(override?.outfits).toEqual([
            { name: 'Leather', tags: 'jacket', looks: ['black jacket'] },
            { name: 'Robe', tags: 'robe' },
        ]);
        const data = normalizeChatPassports({ extra: [anna()] });
        expect(data.extra[0]!.outfits[2]!.looks).toEqual(['red silk dress', RU.dress]);
    });
});
