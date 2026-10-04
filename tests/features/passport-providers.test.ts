// Passport providers (v0.12, Maestro's lore entries) with mocked SillyTavern: their people join the scene
// candidates after the cards, the persona and the chat (which win by name or alias, as does the provider
// with the higher priority), their locations, objects and world join the setting the same way; a late,
// failing or junk provider is skipped; answers are reused for one picture; nothing changes without them.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';

const state = vi.hoisted(() => ({
    characters: [] as Record<string, unknown>[],
    chat: [] as Record<string, unknown>[],
    meta: {} as Record<string, unknown>,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => defaultSettings(), saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: '0',
        groupId: null,
        groups: [],
        name1: 'Player',
        chat: state.chat,
        chatMetadata: state.meta,
        unshallowCharacter: vi.fn(),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));

const providers = await import('../../src/features/scene/passport-providers');
const scenes = await import('../../src/features/scene/scene-service');

function person(id: string, name: string, hair: string, aliases: string[] = []): Passport {
    const p = defaultPassport('character', name, id);
    p.slots.base = '1boy';
    p.slots.hair = hair;
    p.aliases = aliases;
    return p;
}

function thing(id: string, kind: Passport['kind'], name: string, tags: string, aliases: string[] = []): Passport {
    const p = defaultPassport(kind, name, id);
    p.tags = tags;
    p.aliases = aliases;
    return p;
}

beforeEach(() => {
    providers.clearScenePassportProviders();
    scenes.setSceneProvider(null);
    state.characters = [
        {
            name: 'Lyra',
            avatar: 'Lyra.png',
            data: {
                extensions: {
                    nai_studio: {
                        passports: [
                            person('p1', '', 'silver hair'),
                            person('p2', 'Bob Stone', 'blond hair'),
                            thing('w1', 'world', 'Eldoria', 'high fantasy'),
                            thing('l1', 'location', 'Harbor', 'card harbor'),
                            thing('o1', 'object', 'Moon Lamp', 'silver lantern'),
                        ],
                    },
                },
            },
        },
    ];
    state.chat = [{ mes: 'Bram meets Lyra at the Old Mill.', is_user: false }];
    state.meta = { nai_studio: { passports: { overrides: {}, extra: [person('c1', 'Mira', 'red hair')] } } };
});

afterEach(() => {
    vi.useRealTimers();
});

describe('passport providers', () => {
    it('change nothing when none is registered', async () => {
        expect((await scenes.sceneCandidates()).map((c) => c.key)).toEqual([
            'Lyra',
            'Lyra#p2',
            'chat#c1',
            'persona:player.png',
        ]);
        const setting = await scenes.sceneSetting();
        expect(setting.world).toBe('high fantasy');
        expect(setting.locations.map((l) => l.name)).toEqual(['Harbor']);
        // Object passports of the card are named objects of the setting now.
        expect(setting.objects).toEqual([{ name: 'Moon Lamp', aliases: [], tags: 'silver lantern' }]);
        expect(await providers.providedPassports()).toEqual([]);
    });

    it('add their people after everyone the chat knows; the chat and the higher priority win', async () => {
        const maestro = vi.fn(() => [
            person('lore-bram', 'Bram', 'black hair', ['Smith']),
            person('lore-lyra', 'Lyra', 'green hair'),
            person('lore-bob', 'Bobby', 'grey hair', ['Bob Stone']),
            person('lore-mira', 'Mira', 'blue hair'),
            person('lore-player', 'Player', 'x'),
        ]);
        providers.registerScenePassportProvider({ id: 'maestro', priority: 10, passports: maestro });
        providers.registerScenePassportProvider({
            id: 'low',
            priority: 1,
            passports: async () => [person('', 'Bram', 'white hair'), person('', 'Nia', 'pink hair')],
        });
        const people = await scenes.sceneCandidates({ messageId: 0 });
        expect(people.map((c) => c.key)).toEqual([
            'Lyra',
            'Lyra#p2',
            'chat#c1',
            'persona:player.png',
            'provided#lore-bram',
            'provided#low:character:nia',
        ]);
        expect(maestro).toHaveBeenCalledWith({ messageIndex: 0, text: 'Bram meets Lyra at the Old Mill.' });
        const bram = people.find((c) => c.name === 'Bram')!;
        expect(bram).toMatchObject({ aliases: ['Smith'], isUser: false, passport: { slots: { hair: 'black hair' } } });
        expect(people[0]!.passport!.slots.hair).toBe('silver hair');

        // A marker names the lore person: drawn from the provider's passport.
        const service = new scenes.SceneService({} as never, {} as never);
        const built = await service.markerScene('two men talk', [{ name: 'Bram' }, { name: 'Nia' }], { messageId: 0 });
        expect(built?.characters.map((c) => c.prompt)).toEqual([
            expect.stringContaining('black hair'),
            expect.stringContaining('pink hair'),
        ]);
        expect(built?.passportIds).toEqual(['lore-bram', 'low:character:nia']);
    });

    it('add their places, objects and world to the setting, where the chat has no such name', async () => {
        providers.registerScenePassportProvider({
            id: 'maestro',
            priority: 5,
            passports: () => [
                thing('lore-harbor', 'location', 'Harbor', 'lore harbor'),
                thing('lore-mill', 'location', 'Old Mill', 'watermill, stone bridge', ['Mill']),
                thing('lore-blade', 'object', 'Sun Blade', 'golden sword'),
                thing('lore-lamp', 'object', 'Moon Lamp', 'lore lantern'),
                thing('lore-eldoria', 'world', 'Eldoria', 'lore world'),
                thing('lore-sea', 'world', 'Endless Sea', 'ocean world'),
                thing('lore-tale', 'scenario', '', 'storm season'),
            ],
        });
        const setting = await scenes.sceneSetting();
        expect(setting.world).toBe('high fantasy, ocean world, storm season');
        expect(setting.locations.map((l) => [l.name, l.tags])).toEqual([
            ['Harbor', 'card harbor'],
            ['Old Mill', 'watermill, stone bridge'],
        ]);
        expect(setting.objects.map((o) => [o.name, o.tags])).toEqual([
            ['Moon Lamp', 'silver lantern'],
            ['Sun Blade', 'golden sword'],
        ]);
        expect(scenes.mentionedLocationTags('He holds the Sun Blade by the mill', setting.objects)).toBe(
            'golden sword',
        );

        // The automatic scene takes the named lore person, place and object.
        const service = new scenes.SceneService({} as never, {} as never);
        providers.registerScenePassportProvider({
            id: 'people',
            priority: 1,
            passports: () => [person('lore-bram', 'Bram', 'black hair')],
        });
        const { spec } = await service.autoSpec('Bram raises the Sun Blade at the Old Mill.');
        expect(spec.participants.map((p) => p.key)).toEqual(['provided#lore-bram']);
        expect(spec.base).toBe('watermill, stone bridge, golden sword, high fantasy, ocean world, storm season');
    });

    it('reuse the answers for one picture, as copies', async () => {
        const good = vi.fn(() => [thing('lore-mill', 'location', 'Old Mill', 'watermill')]);
        providers.registerScenePassportProvider({ id: 'good', priority: 0, passports: good });
        const first = await providers.providedPassports({ messageId: 0 });
        first[0]!.name = 'changed';
        expect((await providers.providedPassports({ messageId: 0 }))[0]!.name).toBe('Old Mill');
        expect(good).toHaveBeenCalledTimes(1);
        // Another text asks again; a new registration (the same id replaces) drops the cache.
        await providers.providedPassports({ messageId: 0, text: 'other' });
        expect(good).toHaveBeenLastCalledWith({ messageIndex: 0, text: 'other' });
        expect(good).toHaveBeenCalledTimes(2);
        const off = providers.registerScenePassportProvider({ id: 'good', priority: 9, passports: good });
        await providers.providedPassports({ messageId: 0, text: 'other' });
        expect(good).toHaveBeenCalledTimes(3);
        expect(providers.scenePassportProviders()).toHaveLength(1);
        off();
        off();
        expect(providers.scenePassportProviders()).toEqual([]);
    });

    it('skip a provider that fails, answers junk or is late', async () => {
        providers.registerScenePassportProvider({
            id: 'good',
            priority: 0,
            passports: async () => [thing('lore-mill', 'location', 'Old Mill', 'watermill')],
        });
        providers.registerScenePassportProvider({
            id: 'broken',
            priority: 3,
            passports: () => {
                throw new Error('boom');
            },
        });
        providers.registerScenePassportProvider({ id: 'junk', priority: 2, passports: () => 'junk' });
        providers.registerScenePassportProvider({ id: 'late', priority: 1, passports: () => new Promise(() => {}) });
        expect(providers.scenePassportProviders().map((p) => p.id)).toEqual(['broken', 'junk', 'late', 'good']);
        vi.useFakeTimers();
        let done = false;
        const pending = providers.providedPassports({ messageId: 0 }).finally(() => (done = true));
        await vi.advanceTimersByTimeAsync(2900);
        expect(done).toBe(false);
        await vi.advanceTimersByTimeAsync(100);
        expect((await pending).map((p) => p.id)).toEqual(['lore-mill']);
    });
});
