// What a DES portrait was drawn from (v0.13.2): the normalised look of a character without a passport,
// the passport identity, the stored records (old bare hashes too) and the decision of each policy.
import { describe, expect, it } from 'vitest';
import {
    defaultPassport,
    lookChanged,
    lookSimilarity,
    lookTokens,
    PORTRAIT_LOOK_THRESHOLD,
    portraitDecision,
    portraitIdentity,
    portraitRecord,
    readPortraitRecord,
} from '../../src/domain';
import type { PortraitCheck } from '../../src/domain';

function mira() {
    const passport = defaultPassport('character', 'Mira', 'p-mira');
    passport.slots.hair = 'white hair';
    passport.slots.clothing = 'blue cloak';
    passport.outfits = [{ name: 'Gala', tags: 'red evening gown' }];
    return passport;
}

describe('look normalisation', () => {
    it('lower-cases, drops punctuation and stop words, cuts words to a stem, sorts the set', () => {
        expect(lookTokens('Wearing a BLACK dress,  her hair — loose!')).toEqual(['black', 'dress', 'hair', 'loose']);
        expect(lookTokens('Одета в чёрное платье; волосы распущены')).toEqual(['волос', 'плать', 'распу', 'черн']);
        expect(lookTokens('в черном платье, распущенные волосы, черное')).toEqual(
            lookTokens('чёрное платье, волосы распущены'),
        );
        expect(lookTokens('  ')).toEqual([]);
        // An English plural "s" goes ("ss" and "us" stay); an ending goes only when three letters stay.
        expect(lookTokens('Boots, dress, glasses, status')).toEqual(['boot', 'dress', 'glass', 'statu']);
        expect(lookTokens('очки, шея')).toEqual(['очк', 'шея']);
    });

    it('a reworded look stays similar, a new look does not', () => {
        const before = 'Высокая блондинка, голубые глаза; белое платье; улыбается, смущена';
        const reworded = 'высокая блондинка с голубыми глазами; в белом платье; задумчиво улыбается';
        expect(lookSimilarity(before, reworded)).toBeGreaterThanOrEqual(PORTRAIT_LOOK_THRESHOLD);
        expect(lookChanged(before, reworded)).toBe(false);
        expect(lookChanged(before, 'мокрый кожаный доспех, шрам на щеке, короткая стрижка')).toBe(true);
        expect(lookChanged('Wet blue cloak, muddy boots', 'muddy boots and a wet blue cloak')).toBe(false);
        expect(lookChanged('Wet blue cloak, muddy boots', 'red silk dress, pearl necklace')).toBe(true);
        expect(lookSimilarity('', ' ')).toBe(1);
        expect(lookSimilarity('', 'cloak')).toBe(0);
    });
});

describe('portrait identity and records', () => {
    it('follows the passport id, its tags, the active outfit and the enabled states, not the look', () => {
        const passport = mira();
        const base = portraitRecord(passport, 'wet blue cloak');
        expect(base.look).toBe('wet blue cloak');
        expect(portraitRecord(passport, 'a completely different look').hash).toBe(base.hash);
        const outfit = { ...passport, activeOutfit: 'Gala' };
        expect(portraitRecord(outfit, 'wet blue cloak').hash).not.toBe(base.hash);
        const wet = { ...passport, states: passport.states.map((s) => (s.id === 'wet' ? { ...s, enabled: true } : s)) };
        expect(portraitRecord(wet, 'wet blue cloak').hash).not.toBe(base.hash);
        const other = { ...passport, id: 'p-other' };
        expect(portraitRecord(other, 'wet blue cloak').hash).not.toBe(base.hash);
        const hair = { ...passport, slots: { ...passport.slots, hair: 'black hair' } };
        expect(portraitRecord(hair, 'wet blue cloak').hash).not.toBe(base.hash);
        expect(portraitIdentity(null)).toBe('look');
        expect(portraitIdentity(passport)).toContain('p-mira');
        expect(portraitRecord(null, 'x'.repeat(1500)).look).toHaveLength(1000);
    });

    it('reads stored records; a bare hash (before 0.13.2) or junk is no record', () => {
        expect(readPortraitRecord({ hash: 'ab', look: 'cloak' })).toEqual({ hash: 'ab', look: 'cloak' });
        expect(readPortraitRecord({ hash: 'ab', look: 3 })).toEqual({ hash: 'ab' });
        expect(readPortraitRecord('1f2e3d')).toBeNull();
        expect(readPortraitRecord(undefined)).toBeNull();
        expect(readPortraitRecord(['ab'])).toBeNull();
        expect(readPortraitRecord({ look: 'cloak' })).toBeNull();
    });
});

describe('portrait decision', () => {
    const passport = mira();
    const check = (over: Partial<PortraitCheck>): PortraitCheck => ({
        policy: 'state',
        exists: true,
        stored: portraitRecord(passport, 'wet blue cloak'),
        current: portraitRecord(passport, 'blue cloak, soaked through'),
        passport: true,
        ...over,
    });

    it('a missing portrait is always drawn, "every" always draws, "missing" keeps an existing one', () => {
        for (const policy of ['missing', 'state', 'every'] as const) {
            expect(portraitDecision(check({ policy, exists: false, stored: undefined }))).toBe('draw');
        }
        expect(portraitDecision(check({ policy: 'every' }))).toBe('draw');
        expect(portraitDecision(check({ policy: 'missing', current: portraitRecord(null, 'other') }))).toBe('keep');
        expect(portraitDecision(check({ policy: 'missing', stored: 'oldhash' }))).toBe('keep');
    });

    it('"state" with a passport: a reworded look keeps, a changed identity draws', () => {
        expect(portraitDecision(check({}))).toBe('keep');
        const gala = { ...passport, activeOutfit: 'Gala' };
        expect(portraitDecision(check({ current: portraitRecord(gala, 'wet blue cloak') }))).toBe('draw');
    });

    it('"state" without a passport compares the looks; a passport written later draws once', () => {
        const stored = portraitRecord(null, 'wet blue cloak, muddy boots');
        const without = (look: string) => check({ stored, current: portraitRecord(null, look), passport: false });
        expect(portraitDecision(without('muddy boots, a wet blue cloak'))).toBe('keep');
        expect(portraitDecision(without('red silk dress, pearl necklace'))).toBe('draw');
        expect(portraitDecision(check({ stored }))).toBe('draw');
    });

    it('"state" adopts a portrait without a record of this version as current', () => {
        expect(portraitDecision(check({ stored: '1f2e3d' }))).toBe('adopt');
        expect(portraitDecision(check({ stored: undefined }))).toBe('adopt');
        const lookless = { hash: portraitRecord(null, '').hash };
        expect(
            portraitDecision(check({ stored: lookless, current: portraitRecord(null, 'cloak'), passport: false })),
        ).toBe('adopt');
    });
});
