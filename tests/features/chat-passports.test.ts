// Chat-level passports and scene providers (v0.10) with mocked SillyTavern: an override keeps only
// the changed fields in the chat metadata and every scene sees it, the card stays the default;
// passports of the chat itself take part; scene providers answer first, field by field, and the
// tracker integration fills the rest; nothing changes without them.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    characters: [] as Record<string, unknown>[],
    characterId: '0' as string | undefined,
    chat: [] as Record<string, unknown>[],
    meta: {} as Record<string, unknown>,
    chatId: 'chat-1' as string | undefined,
    saves: 0,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings, saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: state.characterId,
        groupId: null,
        groups: [],
        name1: 'Player',
        chat: state.chat,
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => {
            state.saves++;
        }),
        getCurrentChatId: () => state.chatId,
        unshallowCharacter: vi.fn(),
        writeExtensionField: vi.fn(async (index: number, key: string, value: unknown) => {
            const ch = state.characters[index] as { data: { extensions: Record<string, unknown> } };
            ch.data.extensions[key] = structuredClone(value);
        }),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));

const store = await import('../../src/features/characters/passport-store');
const scenes = await import('../../src/features/scene/scene-service');
const providers = await import('../../src/features/scene/scene-providers');
const events = await import('../../src/features/events/studio-events');

function lyra(): Passport {
    const p = defaultPassport('character', '', 'p1');
    p.slots.base = '1girl';
    p.slots.hair = 'silver hair';
    p.slots.clothing = 'travel cloak';
    p.outfits = [{ name: 'Ballgown', tags: 'blue ballgown' }];
    return p;
}

function card(name: string, passports: Passport[]) {
    return { name, avatar: `${name}.png`, data: { extensions: { nai_studio: { passports } } } };
}

const stored = () =>
    (state.characters[0] as { data: { extensions: { nai_studio: { passports: Passport[] } } } }).data.extensions
        .nai_studio.passports;

beforeEach(() => {
    state.settings = defaultSettings();
    state.characters = [card('Lyra', [lyra()])];
    state.characterId = '0';
    state.chat = [];
    state.meta = {};
    state.chatId = 'chat-1';
    state.saves = 0;
    providers.clearSceneHintProviders();
    scenes.setSceneProvider(null);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('chat overrides', () => {
    it('keeps only the changed fields in the chat, and every scene sees them', async () => {
        const saved = vi.fn();
        const off = events.onStudioEvent('passportsSaved', saved);
        const located = store.locatePassport('p1')!;
        expect(located).toMatchObject({ owner: { type: 'card', index: 0, avatar: 'Lyra.png' }, overridden: false });
        const edited = structuredClone(located.resolved);
        edited.activeOutfit = 'Ballgown';
        await store.savePassportIn(located, edited, 'chat');
        expect(state.meta).toEqual({
            nai_studio: {
                passports: { overrides: { p1: { owner: 'Lyra.png', activeOutfit: 'Ballgown' } }, extra: [] },
            },
        });
        expect(stored()[0]!.activeOutfit).toBe('');
        expect(saved).toHaveBeenLastCalledWith({ ids: ['p1'], scope: 'chat' });
        const [candidate] = await scenes.sceneCandidates();
        expect(candidate).toMatchObject({ key: 'Lyra', passport: { activeOutfit: 'Ballgown' } });
        expect(store.locatePassport('p1')).toMatchObject({ overridden: true, resolved: { activeOutfit: 'Ballgown' } });

        // The card scope still writes the card; the chat keeps its own outfit over it.
        const again = store.locatePassport('p1')!;
        const cardEdit = structuredClone(again.base!);
        cardEdit.slots.hair = 'short silver hair';
        await store.savePassportIn(again, cardEdit, 'card');
        expect(stored()[0]!.slots.hair).toBe('short silver hair');
        expect(saved).toHaveBeenLastCalledWith({ ids: ['p1'], scope: 'card', avatar: 'Lyra.png' });
        expect(store.resolvedAfterSave(again, cardEdit, 'card')).toMatchObject({
            activeOutfit: 'Ballgown',
            slots: { hair: 'short silver hair' },
        });

        // Clearing the override brings the card back; an edit equal to the card drops it too.
        expect(await store.clearChatOverride('p1')).toBe(true);
        expect(state.meta).toEqual({ nai_studio: {} });
        expect(await store.clearChatOverride('p1')).toBe(false);
        expect((await scenes.sceneCandidates())[0]!.passport!.activeOutfit).toBe('');
        await store.saveChatPassport(stored()[0]!, { ...stored()[0]!, activeOutfit: 'Ballgown' }, 'Lyra.png');
        await store.saveChatPassport(stored()[0]!, structuredClone(stored()[0]!), 'Lyra.png');
        expect(store.chatPassportData()).toEqual({ overrides: {}, extra: [] });
        off();
    });

    it('needs an open chat for the chat scope', async () => {
        state.chatId = undefined;
        expect(store.chatOpen()).toBe(false);
        await expect(store.saveChatPassport(null, lyra())).rejects.toThrow(/no chat/);
        await expect(store.clearChatOverride('p1')).rejects.toThrow(/no chat/);
    });

    it('applies a persona override to that persona only', async () => {
        const persona = defaultPassport('character', '', 'me');
        persona.slots.hair = 'black hair';
        state.settings.scene.personaPassports['player.png'] = persona;
        await store.currentPersonaKey();
        const located = store.locatePassport('me')!;
        expect(located.owner).toEqual({ type: 'persona', key: 'player.png' });
        await store.savePassportIn(
            located,
            { ...located.resolved, slots: { ...persona.slots, hair: 'red hair' } },
            'chat',
        );
        expect(store.resolvedPersonaPassport('player.png')!.slots.hair).toBe('red hair');
        state.settings.scene.personaPassports['other.png'] = persona;
        expect(store.resolvedPersonaPassport('other.png')!.slots.hair).toBe('black hair');
        const people = await scenes.sceneCandidates();
        expect(people.at(-1)).toMatchObject({ key: 'persona:player.png', passport: { slots: { hair: 'red hair' } } });
        // The persona scope of a card save goes to the settings.
        await store.savePassportIn(located, { ...persona, negative: 'hat' }, 'card');
        expect(store.personaPassport('player.png')!.negative).toBe('hat');
    });

    it('lets passports of the chat itself take part in scenes and the setting', async () => {
        const mira = defaultPassport('character', 'Mira', 'c1');
        mira.slots.hair = 'red hair';
        const harbor = defaultPassport('location', 'Harbor', 'c2');
        harbor.tags = 'harbor, ships';
        const world = defaultPassport('world', 'World', 'c3');
        world.tags = 'steampunk';
        const unnamed = defaultPassport('character', '', 'c4');
        unnamed.slots.hair = 'x';
        for (const p of [mira, harbor, world, unnamed]) await store.saveChatPassport(null, p);
        const located = store.locatePassport('c1')!;
        expect(located).toMatchObject({ owner: { type: 'chat' }, base: null, overridden: true });
        await expect(store.savePassportIn(located, mira, 'card')).rejects.toThrow(/no card/);
        await store.savePassportIn(located, { ...mira, aliases: ['Mi'] }, 'chat');
        const people = await scenes.sceneCandidates();
        expect(people.map((c) => [c.key, c.name, c.aliases])).toEqual([
            ['Lyra', 'Lyra', []],
            ['chat#c1', 'Mira', ['Mi']],
            ['persona:player.png', 'Player', []],
        ]);
        const setting = await scenes.sceneSetting();
        expect(setting.world).toBe('steampunk');
        expect(setting.locations).toEqual([{ name: 'Harbor', aliases: [], tags: 'harbor, ships' }]);
    });

    it('finds a card by its avatar with or without the extension', () => {
        expect(store.cardIndexByAvatar('Lyra.png')).toBe(0);
        expect(store.cardIndexByAvatar('Lyra')).toBe(0);
        expect(store.cardIndexByAvatar('Nope')).toBe(-1);
        expect(store.chatCardIndexes()).toEqual([0]);
        state.characterId = undefined;
        expect(store.chatCardIndexes()).toEqual([]);
    });
});

describe('scene providers', () => {
    const tracker = (location: string, tags: string[]) => ({
        candidates: async () => [],
        setting: async () => ({ tags, location }),
    });

    it('change nothing when none is registered', async () => {
        scenes.setSceneProvider(tracker('Old Mill', ['night']));
        expect(await scenes.sceneSetting()).toEqual({ world: 'night', locations: [], location: 'Old Mill' });
        expect(await providers.sceneHint()).toEqual({});
    });

    it('answer first, field by field, with the tracker for the rest', async () => {
        scenes.setSceneProvider(tracker('Old Mill', ['night', 'rain']));
        const low = vi.fn(() => ({ locationName: 'Low Place', tags: 'low tags', characters: ['Bram'] }));
        providers.registerSceneHintProvider({ id: 'low', priority: 1, describe: low });
        const off = providers.registerSceneHintProvider({
            id: 'maestro',
            priority: 10,
            describe: async () => ({ locationId: 'pl1', locationName: 'Rusty Tavern' }),
        });
        state.chat = [
            { mes: 'Hello.', is_user: false },
            { mes: 'note', is_system: true },
        ];
        const setting = await scenes.sceneSetting();
        expect(setting).toEqual({ world: 'low tags', locations: [], location: 'Rusty Tavern', locationId: 'pl1' });
        expect(low).toHaveBeenCalledWith({ messageIndex: 0, text: 'Hello.' });
        off();
        expect(await scenes.sceneSetting({ messageId: 5, text: 'x' })).toEqual({
            world: 'low tags',
            locations: [],
            location: 'Low Place',
        });
        expect(low).toHaveBeenLastCalledWith({ messageIndex: 5, text: 'x' });
    });

    it('fall back when a provider says nothing, fails or is late', async () => {
        scenes.setSceneProvider(tracker('Old Mill', ['night']));
        providers.registerSceneHintProvider({ id: 'empty', priority: 3, describe: () => null });
        providers.registerSceneHintProvider({
            id: 'broken',
            priority: 2,
            describe: () => {
                throw new Error('boom');
            },
        });
        providers.registerSceneHintProvider({ id: 'junk', priority: 1, describe: () => 'junk' as never });
        expect(await scenes.sceneSetting()).toMatchObject({ world: 'night', location: 'Old Mill' });

        providers.clearSceneHintProviders();
        vi.useFakeTimers();
        providers.registerSceneHintProvider({ id: 'slow', priority: 5, describe: () => new Promise(() => {}) });
        providers.registerSceneHintProvider({ id: 'quick', priority: 1, describe: () => ({ tags: 'quick' }) });
        const pending = providers.sceneHint({ messageId: 0, text: 'a' });
        await vi.advanceTimersByTimeAsync(providers.PROVIDER_TIMEOUT_MS + 10);
        expect(await pending).toEqual({ tags: 'quick' });
    });

    it('replace a provider registered again under the same id', async () => {
        const first = vi.fn(() => ({ tags: 'first' }));
        const unregisterFirst = providers.registerSceneHintProvider({ id: 'm', priority: 1, describe: first });
        providers.registerSceneHintProvider({ id: 'm', priority: 1, describe: () => ({ tags: 'second' }) });
        unregisterFirst();
        expect(providers.sceneHintProviders()).toHaveLength(1);
        expect(await providers.sceneHint({ messageId: 1, text: 'b' })).toEqual({ tags: 'second' });
        expect(first).not.toHaveBeenCalled();
    });

    it('mark the people present, and the automatic scene falls back to them', async () => {
        const bram = defaultPassport('character', 'Bram', 'c9');
        bram.slots.base = '1boy';
        await store.saveChatPassport(null, bram);
        providers.registerSceneHintProvider({ id: 'm', priority: 1, describe: () => ({ characters: ['Bram'] }) });
        state.chat = [
            { mes: 'The wind howls outside.', is_user: false, is_system: false, original_avatar: 'Lyra.png' },
        ];
        const people = await scenes.sceneCandidates();
        expect(people.filter((c) => c.present).map((c) => c.name)).toEqual(['Bram']);
        const service = new scenes.SceneService({} as never, {} as never);
        const { spec } = await service.autoSpec();
        expect(spec.participants.map((p) => p.name)).toEqual(['Bram']);
        // Someone named in the text still decides.
        const named = await service.autoSpec('Lyra smiles.');
        expect(named.spec.participants.map((p) => p.name)).toEqual(['Lyra']);
    });
});
