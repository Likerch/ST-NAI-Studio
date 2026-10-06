// v0.14, pure: the origin of a passport NAI Studio wrote by itself, a chat's exclusion of a passport (a flag
// in its overrides, kept through parsing, not a change of the passport), and per-chat DES portraits: the
// image of a record, whose portrait a character has in a chat, what goes back into DES when a chat opens.
import { describe, expect, it } from 'vitest';
import {
    applyPassportOverride,
    defaultPassport,
    isDrawnPortrait,
    isExcludedIn,
    isLegacyRecord,
    isOverrideEmpty,
    legacyPortraitSnapshot,
    normalizeChatPassports,
    normalizePassport,
    normalizePassportList,
    portraitDecision,
    portraitFileName,
    portraitKey,
    portraitPresence,
    portraitRecord,
    portraitsToRestore,
    readPortraitRecord,
    recordWithImage,
    resolveChatPassport,
    samePortrait,
    withExcluded,
} from '../../src/domain';
import type { ChatPassports } from '../../src/domain';

describe('passport origin', () => {
    it('keeps "auto-des" through normalisation, lists and chat overrides, and drops anything else', () => {
        const passport = { ...defaultPassport('character', 'Mira', 'p1'), origin: 'auto-des' };
        expect(normalizePassport(passport)?.origin).toBe('auto-des');
        expect(normalizePassportList([passport])[0]?.origin).toBe('auto-des');
        expect(applyPassportOverride(normalizePassport(passport)!, { tags: 'x' }).origin).toBe('auto-des');
        expect(normalizePassport({ ...passport, origin: 'maestro' })).not.toHaveProperty('origin');
        expect(defaultPassport('character', 'Mira')).not.toHaveProperty('origin');
    });
});

describe('excluded passports', () => {
    const data = (raw: unknown): ChatPassports => normalizeChatPassports(raw);

    it('reads the flag and keeps an override that holds only it', () => {
        const parsed = data({
            overrides: { p1: { excluded: true }, p2: { owner: 'Lyra.png' }, p3: { excluded: 'yes' } },
        });
        expect(parsed.overrides).toEqual({ p1: { excluded: true } });
        expect(isExcludedIn(parsed, 'p1')).toBe(true);
        expect(isExcludedIn(parsed, 'p3')).toBe(false);
        expect(isOverrideEmpty({ owner: 'Lyra.png', excluded: true })).toBe(true);
    });

    it('applies to the owner it names only', () => {
        const parsed = data({ overrides: { main: { owner: 'Lyra.png', excluded: true } } });
        expect(isExcludedIn(parsed, 'main', 'Lyra.png')).toBe(true);
        expect(isExcludedIn(parsed, 'main', 'Mira.png')).toBe(false);
        expect(isExcludedIn(parsed, 'main')).toBe(true);
    });

    it('is not a change of the passport: the view of the chat stays the card one', () => {
        const card = defaultPassport('character', 'Mira', 'p1');
        card.slots.hair = 'white hair';
        const parsed = data({ overrides: { p1: { excluded: true } } });
        expect(resolveChatPassport(card, 'Lyra.png', parsed)).toEqual(card);
    });

    it('sets and clears the flag, keeping the fields the chat changed', () => {
        let parsed = data({ overrides: { p1: { tags: 'x' } } });
        parsed = withExcluded(parsed, 'p1', true, 'Lyra.png');
        expect(parsed.overrides.p1).toEqual({ owner: 'Lyra.png', tags: 'x', excluded: true });
        parsed = withExcluded(parsed, 'p2', true);
        expect(parsed.overrides.p2).toEqual({ excluded: true });
        parsed = withExcluded(parsed, 'p1', false, 'Lyra.png');
        expect(parsed.overrides.p1).toEqual({ owner: 'Lyra.png', tags: 'x' });
        parsed = withExcluded(parsed, 'p2', false);
        expect(parsed.overrides).not.toHaveProperty('p2');
        // The source is not changed.
        const source = data({ overrides: {} });
        withExcluded(source, 'p1', true);
        expect(source.overrides).toEqual({});
    });
});

describe('per-chat DES portraits', () => {
    it('keeps the image of a record, never a data URL', () => {
        expect(readPortraitRecord({ hash: 'h', image: '/user/images/a.png' })).toEqual({
            hash: 'h',
            image: '/user/images/a.png',
        });
        expect(readPortraitRecord({ hash: 'h', image: 'data:image/png;base64,AA' })).toEqual({ hash: 'h' });
        expect(recordWithImage({ hash: 'h', look: 'cloak' }, '/a.png')).toEqual({
            hash: 'h',
            look: 'cloak',
            image: '/a.png',
        });
        // A bare pre-0.13.2 hash: identity unknown, "state" adopts it instead of redrawing.
        expect(recordWithImage('1a2b', '/a.png')).toEqual({ hash: '', image: '/a.png' });
        const current = portraitRecord(null, 'cloak');
        expect(
            portraitDecision({
                policy: 'state',
                exists: true,
                stored: { hash: '', image: '/a.png' },
                current,
                passport: false,
            }),
        ).toBe('adopt');
        expect(isLegacyRecord('1a2b')).toBe(true);
        expect(isLegacyRecord({ hash: 'h', look: 'x' })).toBe(true);
        expect(isLegacyRecord({ hash: 'h', image: '/a.png' })).toBe(false);
        expect(isLegacyRecord(undefined)).toBe(false);
    });

    it('compares portraits without the cache-buster and knows drawn files from uploads', () => {
        expect(portraitKey('/user/images/des-portraits/mira-1a2b3c4d.png?t=17')).toBe(
            '/user/images/des-portraits/mira-1a2b3c4d.png',
        );
        expect(samePortrait('/a.png?t=1', '/a.png#x')).toBe(true);
        expect(samePortrait('/a.png', '/b.png')).toBe(false);
        expect(isDrawnPortrait('/user/images/Lyra/Lyra_2026-10-06_123.webp')).toBe(true);
        expect(isDrawnPortrait('/user/images/nai-studio-portraits/Mira-1a.png')).toBe(true);
        expect(isDrawnPortrait('/user/images/des-portraits/mira-1a2b3c4d.png?t=1')).toBe(false);
        expect(isDrawnPortrait('data:image/png;base64,AA')).toBe(false);
        expect(isDrawnPortrait('/characters/Mira.png')).toBe(false);
        expect(portraitFileName('Офелия Grey', '/x.png?t=1')).toBe(portraitFileName('Офелия Grey', '/x.png?t=2'));
        expect(portraitFileName('Офелия Grey', '/x.png')).toMatch(/^Офелия_Grey-[0-9a-f]+$/);
    });

    it('a card character shares the portrait; any other one has it only with a record of the chat', () => {
        const avatar = '/user/images/Lyra/ophelia.png';
        expect(portraitPresence({ scope: 'card', avatar, stored: undefined, baseline: avatar })).toEqual({
            exists: true,
            adopt: false,
        });
        // Left in DES by another chat: missing here.
        expect(portraitPresence({ scope: 'chat', avatar, stored: undefined, baseline: avatar })).toEqual({
            exists: false,
            adopt: false,
        });
        expect(portraitPresence({ scope: 'chat', avatar, stored: { hash: 'h' }, baseline: avatar }).exists).toBe(true);
        // Changed or added while the chat is open: the chat's.
        expect(portraitPresence({ scope: 'chat', avatar, stored: undefined, baseline: '/other.png' })).toEqual({
            exists: true,
            adopt: true,
        });
        expect(portraitPresence({ scope: 'chat', avatar, stored: undefined, baseline: undefined }).adopt).toBe(true);
        expect(
            portraitPresence({ scope: 'chat', avatar: undefined, stored: { hash: 'h' }, baseline: avatar }).exists,
        ).toBe(false);
    });

    it('puts back the images that differ, and the snapshot for records from before v0.14', () => {
        const records = {
            Mira: { hash: 'h', image: '/user/images/a/mira.png' },
            Bran: { hash: 'h', image: '/user/images/a/bran.png' },
            Edda: { hash: 'h', look: 'cloak' },
            Olaf: '1a2b',
            Ivo: { hash: 'h' },
        };
        const avatars = { Mira: '/user/images/a/mira.png?t=3', Bran: '/user/images/b/bran.png', Edda: '/new/edda.png' };
        expect(portraitsToRestore(records, { Edda: '/old/edda.png', Olaf: '/old/olaf.png' }, avatars)).toEqual([
            { name: 'Bran', image: '/user/images/a/bran.png', backfill: false },
            { name: 'Edda', image: '/old/edda.png', backfill: true },
            { name: 'Olaf', image: '/old/olaf.png', backfill: true },
        ]);
        expect(portraitsToRestore(records, null, avatars)).toEqual([
            { name: 'Bran', image: '/user/images/a/bran.png', backfill: false },
        ]);
        expect(legacyPortraitSnapshot({ Mira: '/a.png', Bran: 'data:image/png;base64,AA', Edda: 5, Ivo: '' })).toEqual({
            Mira: '/a.png',
        });
        expect(legacyPortraitSnapshot(undefined)).toEqual({});
    });
});
