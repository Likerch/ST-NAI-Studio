// v0.10 domain: chat-level passport overrides (diff, merge, parse), scene hints of other extensions
// (parse, merge by priority) and continuity keys of places with a stable id.
import { describe, expect, it } from 'vitest';
import {
    applyPassportOverride,
    byPriority,
    defaultPassport,
    isOverrideEmpty,
    locationKeys,
    mergeSceneHints,
    normalizeChatPassports,
    normalizeOverride,
    normalizePlace,
    normalizeSceneHint,
    passportDiff,
    placeKey,
    resolveChatPassport,
} from '../../src/domain';
import type { Passport } from '../../src/domain';

function lyra(): Passport {
    const p = defaultPassport('character', 'Lyra', 'p1');
    p.slots.hair = 'silver hair';
    p.slots.clothing = 'travel cloak';
    p.outfits = [
        { name: 'Ballgown', tags: 'blue ballgown' },
        { name: 'Armor', tags: 'silver armor' },
    ];
    return p;
}

describe('passport overrides', () => {
    it('keeps only the fields that differ', () => {
        const base = lyra();
        expect(passportDiff(base, structuredClone(base))).toEqual({});
        const edited = structuredClone(base);
        edited.activeOutfit = 'Armor';
        edited.slots.hair = 'short silver hair';
        edited.states.find((s) => s.id === 'wet')!.enabled = true;
        edited.states.push({ id: 'muddy', tags: 'mud on clothes', enabled: true });
        edited.nsfw.tags = 'x';
        edited.aliases = ['Lira'];
        edited.position = { x: 0.3, y: 0.5 };
        expect(passportDiff(base, edited)).toEqual({
            activeOutfit: 'Armor',
            slots: { hair: 'short silver hair' },
            states: [
                { id: 'wet', tags: 'wet, wet hair, wet clothes', enabled: true },
                { id: 'muddy', tags: 'mud on clothes', enabled: true },
            ],
            nsfw: { tags: 'x' },
            aliases: ['Lira'],
            position: { x: 0.3, y: 0.5 },
        });
        const moved = structuredClone(edited);
        moved.position = null;
        expect(passportDiff(edited, moved)).toEqual({ position: null });
    });

    it('records every other kind of change too', () => {
        const base = lyra();
        const edited = structuredClone(base);
        Object.assign(edited, { name: 'Lyra Vale', kind: 'object', tags: 't', negative: 'n' });
        edited.nsfw.enabled = true;
        edited.outfits = [{ name: 'Robe', tags: 'robe' }];
        edited.pose = { preset: 'sitting', custom: '' };
        expect(passportDiff(base, edited)).toEqual({
            name: 'Lyra Vale',
            kind: 'object',
            tags: 't',
            negative: 'n',
            nsfw: { enabled: true },
            outfits: [{ name: 'Robe', tags: 'robe' }],
            pose: { preset: 'sitting', custom: '' },
        });
    });

    it('merges an override over the card and leaves the card untouched', () => {
        const base = lyra();
        const before = structuredClone(base);
        const merged = applyPassportOverride(base, {
            owner: 'Lyra.png',
            activeOutfit: 'Ballgown',
            slots: { hair: 'braided silver hair' },
            states: [
                { id: 'wet', tags: 'soaked', enabled: true },
                { id: 'muddy', tags: 'mud', enabled: true },
            ],
            position: { x: 0.7, y: 0.5 },
        });
        expect(base).toEqual(before);
        expect(merged).not.toBe(base);
        expect(merged.id).toBe('p1');
        expect(merged.activeOutfit).toBe('Ballgown');
        expect(merged.slots).toMatchObject({ hair: 'braided silver hair', clothing: 'travel cloak' });
        expect(merged.states.find((s) => s.id === 'wet')).toEqual({ id: 'wet', tags: 'soaked', enabled: true });
        expect(merged.states.at(-1)).toEqual({ id: 'muddy', tags: 'mud', enabled: true });
        expect(merged.position).toEqual({ x: 0.7, y: 0.5 });
        expect(applyPassportOverride(base, { position: null, nsfw: { enabled: true } })).toMatchObject({
            position: null,
            nsfw: { enabled: true, tags: '' },
        });
        // An outfit the card no longer has falls back to the clothing slot.
        expect(applyPassportOverride(base, { activeOutfit: 'Gone' }).activeOutfit).toBe('');
        expect(applyPassportOverride(base, null)).toEqual(base);
        expect(applyPassportOverride(base, { owner: 'x' })).toEqual(base);
    });

    it('round-trips: base + diff = edited', () => {
        const base = lyra();
        const edited = structuredClone(base);
        edited.activeOutfit = 'Armor';
        edited.slots.eyes = 'green eyes';
        edited.outfits.push({ name: 'Rags', tags: 'torn rags' });
        expect(applyPassportOverride(base, passportDiff(base, edited))).toEqual(edited);
    });

    it('treats an override with only an owner as empty', () => {
        expect(isOverrideEmpty(undefined)).toBe(true);
        expect(isOverrideEmpty({ owner: 'a.png' })).toBe(true);
        expect(isOverrideEmpty({ tags: '' })).toBe(false);
    });

    it('applies an override only to its own owner', () => {
        const base = lyra();
        const data = { overrides: { p1: { owner: 'Lyra.png', activeOutfit: 'Armor' } }, extra: [] };
        expect(resolveChatPassport(base, 'Lyra.png', data).activeOutfit).toBe('Armor');
        expect(resolveChatPassport(base, 'Other.png', data)).toBe(base);
        expect(resolveChatPassport(base, undefined, data).activeOutfit).toBe('Armor');
        const anyOwner = { overrides: { p1: { activeOutfit: 'Armor' } }, extra: [] };
        expect(resolveChatPassport(base, 'Other.png', anyOwner).activeOutfit).toBe('Armor');
        expect(resolveChatPassport(base, 'Lyra.png', { overrides: {}, extra: [] })).toBe(base);
    });

    it('parses stored chat data defensively', () => {
        expect(normalizeChatPassports(undefined)).toEqual({ overrides: {}, extra: [] });
        const data = normalizeChatPassports({
            overrides: {
                p1: {
                    owner: ' Lyra.png ',
                    kind: 'robot',
                    name: 'L',
                    aliases: ['a', 3],
                    tags: 'x',
                    slots: { hair: 'h', wings: 'w', eyes: 5 },
                    nsfw: { enabled: 'yes', tags: 't' },
                    outfits: [{ name: ' Robe ', tags: 1 }, { name: '' }, 'junk'],
                    activeOutfit: 'Robe',
                    states: [{ id: 'wet', enabled: true }, { id: '' }],
                    negative: 'n',
                    pose: { preset: 'sitting' },
                    position: { x: 2, y: -1 },
                },
                p2: { owner: 'x.png' },
                p3: 'junk',
                ' ': { tags: 'y' },
                p4: { position: 'nowhere' },
            },
            extra: [{ id: 'c1', kind: 'character', name: 'Mira' }, null],
        });
        expect(data.overrides).toEqual({
            p1: {
                owner: 'Lyra.png',
                name: 'L',
                aliases: ['a'],
                tags: 'x',
                slots: { hair: 'h' },
                nsfw: { tags: 't' },
                outfits: [{ name: 'Robe', tags: '' }],
                activeOutfit: 'Robe',
                states: [{ id: 'wet', tags: '', enabled: true }],
                negative: 'n',
                pose: { preset: 'sitting', custom: '' },
                position: { x: 1, y: 0 },
            },
            p4: { position: null },
        });
        expect(data.extra.map((p) => [p.id, p.name])).toEqual([['c1', 'Mira']]);
        expect(normalizeOverride(['x'])).toBeNull();
        expect(normalizeOverride({ nsfw: { enabled: false }, states: [] })).toEqual({ nsfw: { enabled: false } });
    });
});

describe('scene hints', () => {
    it('parses what a provider returns', () => {
        expect(normalizeSceneHint(null)).toBeNull();
        expect(normalizeSceneHint('tavern')).toBeNull();
        expect(normalizeSceneHint({ locationName: '  ', characters: [] })).toBeNull();
        expect(
            normalizeSceneHint({
                locationId: ' pl1 ',
                locationName: 'Rusty Tavern',
                tags: ['tavern', 'night', 3],
                characters: ['Lyra', ' lyra ', '', 'Bram', 7],
            }),
        ).toEqual({
            locationId: 'pl1',
            locationName: 'Rusty Tavern',
            tags: 'tavern, night',
            characters: ['Lyra', 'Bram'],
        });
        expect(normalizeSceneHint({ tags: 'rain' })).toEqual({ tags: 'rain' });
    });

    it('takes each field from the first hint that has it', () => {
        expect(mergeSceneHints([])).toEqual({});
        expect(
            mergeSceneHints([
                null,
                { locationName: 'Market' },
                { locationId: 'pl2', locationName: 'Harbor', tags: 'sea' },
                { characters: ['Lyra'], tags: 'ignored' },
            ]),
        ).toEqual({ locationName: 'Market', locationId: 'pl2', tags: 'sea', characters: ['Lyra'] });
    });

    it('orders providers by priority, keeping the registration order for ties', () => {
        const list = [
            { id: 'a', priority: 1 },
            { id: 'b', priority: 5 },
            { id: 'c', priority: 1 },
            { id: 'd', priority: 10 },
        ];
        expect(byPriority(list).map((p) => p.id)).toEqual(['d', 'b', 'a', 'c']);
    });
});

describe('place continuity keys', () => {
    it('parses places', () => {
        expect(normalizePlace(null)).toBeNull();
        expect(normalizePlace({ name: 'x' })).toBeNull();
        expect(
            normalizePlace({ id: ' pl1 ', name: ' Rusty Tavern ', aliases: ['Tavern', '', 4], parent: 'city' }),
        ).toEqual({
            id: 'pl1',
            name: 'Rusty Tavern',
            aliases: ['Tavern'],
            parent: 'city',
        });
        expect(normalizePlace({ id: 'pl2' })).toEqual({ id: 'pl2', name: '', aliases: [], parent: null });
    });

    it('looks for the id key first, then the old name keys', () => {
        expect(placeKey(' pl1 ')).toBe('place:pl1');
        expect(locationKeys('The  Tavern', null)).toEqual(['the tavern']);
        const place = { id: 'pl1', name: 'Rusty Tavern', aliases: ['tavern', 'The Tavern'], parent: null };
        expect(locationKeys('the tavern', place)).toEqual(['place:pl1', 'the tavern', 'rusty tavern', 'tavern']);
    });
});
