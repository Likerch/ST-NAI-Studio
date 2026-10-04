// NAI_STUDIO_API (v0.10) with mocked SillyTavern: published and removed with the extension, passports
// as the chat sees them, saves into the card or the chat, outfits and states, events, scene providers.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';
import type { NaiStudioApi } from '../../src/integration/public-api';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    characters: [] as Record<string, unknown>[],
    characterId: '0' as string | undefined,
    groupId: null as string | null,
    groups: [] as { id: string; members: string[] }[],
    chat: [] as Record<string, unknown>[],
    meta: {} as Record<string, unknown>,
    chatId: 'chat-1' as string | undefined,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings, saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: state.characterId,
        groupId: state.groupId,
        groups: state.groups,
        name1: 'Player',
        chat: state.chat,
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => undefined),
        getCurrentChatId: () => state.chatId,
        unshallowCharacter: vi.fn(),
        writeExtensionField: vi.fn(async (index: number, key: string, value: unknown) => {
            const ch = state.characters[index] as { data: { extensions: Record<string, unknown> } };
            ch.data.extensions[key] = structuredClone(value);
        }),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));

const { API_GLOBAL, installPublicApi, uninstallPublicApi } = await import('../../src/integration/public-api');
const { imageReady } = await import('../../src/features/events/studio-events');
const { sceneHint, sceneHintProviders } = await import('../../src/features/scene/scene-providers');

function passport(id: string, name = '', kind: Passport['kind'] = 'character'): Passport {
    const p = defaultPassport(kind, name, id);
    if (kind === 'character') {
        p.slots.base = '1girl';
        p.outfits = [
            { name: 'Ballgown', tags: 'ballgown' },
            { name: 'Armor', tags: 'armor' },
        ];
    } else p.tags = `${name} tags`;
    return p;
}

function card(name: string, passports: Passport[]) {
    return { name, avatar: `${name}.png`, data: { extensions: { nai_studio: { passports } } } };
}

const cardPassports = (index: number) =>
    (state.characters[index] as { data: { extensions: { nai_studio: { passports: Passport[] } } } }).data.extensions
        .nai_studio.passports;

const global = () => (globalThis as Record<string, unknown>)[API_GLOBAL] as NaiStudioApi | undefined;

let api: NaiStudioApi;

beforeEach(async () => {
    state.settings = defaultSettings();
    state.characters = [card('Lyra', [passport('p1'), passport('p2', 'Bram')]), card('Mira', [passport('m1')])];
    state.characterId = '0';
    state.groupId = null;
    state.groups = [];
    state.chat = [];
    state.meta = {};
    state.chatId = 'chat-1';
    const me = passport('me');
    state.settings.scene.personaPassports['player.png'] = me;
    api = installPublicApi();
    await Promise.resolve();
});

afterEach(() => {
    uninstallPublicApi();
});

describe('NAI_STUDIO_API', () => {
    it('is published on activation and removed with everything registered through it', async () => {
        expect(global()).toBe(api);
        expect(api.version).toBe(1);
        expect(Object.isFrozen(api)).toBe(true);
        for (const method of [
            'passports',
            'getPassport',
            'savePassport',
            'setOutfit',
            'setState',
            'clearChatOverride',
            'on',
            'registerSceneProvider',
        ] as const)
            expect(typeof api[method]).toBe('function');
        const listener = vi.fn();
        api.on('imageReady', listener);
        api.registerSceneProvider({ id: 'maestro', priority: 1, describe: () => ({ tags: 'x' }) });
        expect(sceneHintProviders()).toHaveLength(1);
        uninstallPublicApi();
        expect(global()).toBeUndefined();
        expect(sceneHintProviders()).toHaveLength(0);
        imageReady(1, 'marker');
        expect(listener).not.toHaveBeenCalled();
    });

    it('lists the passports of the chat as copies, by scope', async () => {
        expect(api.passports().map((p) => p.id)).toEqual(['p1', 'p2', 'me']);
        expect(api.passports({ avatar: 'Mira.png' }).map((p) => p.id)).toEqual(['m1']);
        expect(api.passports({ avatar: 'Mira' }).map((p) => p.id)).toEqual(['m1']);
        expect(api.passports({ persona: true }).map((p) => p.id)).toEqual(['me']);
        expect(api.passports({ chat: true })).toEqual([]);
        expect(api.passports({ avatar: 'Nobody.png' })).toEqual([]);
        const copy = api.getPassport('p2')!;
        copy.name = 'changed';
        expect(api.getPassport('p2')!.name).toBe('Bram');
        expect(api.getPassport('me')!.id).toBe('me');
        expect(api.getPassport('nope')).toBeNull();
        expect(api.getPassport('' as string)).toBeNull();
        state.groupId = 'g';
        state.groups = [{ id: 'g', members: ['Lyra.png', 'Mira.png'] }];
        expect(api.passports().map((p) => p.id)).toEqual(['p1', 'p2', 'm1', 'me']);
    });

    it('switches outfits and states for the chat by default, the card stays', async () => {
        const saved = vi.fn();
        api.on('passportsSaved', saved);
        await api.setOutfit('p2', 'armor');
        expect(api.getPassport('p2')!.activeOutfit).toBe('Armor');
        expect(cardPassports(0)[1]!.activeOutfit).toBe('');
        expect(saved).toHaveBeenLastCalledWith({ ids: ['p2'], scope: 'chat' });
        await api.setState('p2', 'wet', true);
        await api.setState('p2', 'covered in soot', true);
        await api.setState('p2', 'unknown', false);
        const states = api.getPassport('p2')!.states;
        expect(states.find((s) => s.id === 'wet')?.enabled).toBe(true);
        expect(states.at(-1)).toEqual({ id: 'covered in soot', tags: 'covered in soot', enabled: true });
        expect(states.some((s) => s.id === 'unknown')).toBe(false);
        expect(state.meta).toMatchObject({
            nai_studio: { passports: { overrides: { p2: { owner: 'Lyra.png', activeOutfit: 'Armor' } } } },
        });
        // Back to the card value.
        await api.clearChatOverride('p2');
        expect(api.getPassport('p2')!.activeOutfit).toBe('');
        expect(saved).toHaveBeenLastCalledWith({ ids: ['p2'], scope: 'chat' });
        // The card scope writes the card.
        await api.setOutfit('p2', 'Ballgown', 'card');
        expect(cardPassports(0)[1]!.activeOutfit).toBe('Ballgown');
        expect(saved).toHaveBeenLastCalledWith({ ids: ['p1', 'p2'], scope: 'card', avatar: 'Lyra.png' });
        await api.setState('me', 'blush', true, 'card');
        expect(state.settings.scene.personaPassports['player.png']).toMatchObject({
            states: expect.arrayContaining([{ id: 'blush', tags: 'blush, embarrassed', enabled: true }]),
        });
        expect(saved).toHaveBeenLastCalledWith({ ids: ['me'], scope: 'card', persona: true });
        await api.setOutfit('p2', '');
        expect(api.getPassport('p2')!.activeOutfit).toBe('');
    });

    it('refuses what it cannot do', async () => {
        await expect(api.setOutfit('p2', 'Spacesuit')).rejects.toThrow(/no outfit "Spacesuit"/);
        await expect(api.setOutfit('nope', '')).rejects.toThrow(/no passport "nope"/);
        await expect(api.setOutfit('', '')).rejects.toThrow(/passport id/);
        await expect(api.setState('p2', 'wet', true, 'world' as never)).rejects.toThrow(/scope/);
        await expect(api.savePassport(passport('x'), 'everywhere' as never)).rejects.toThrow(/scope/);
        await expect(api.savePassport(null as never, 'card')).rejects.toThrow(/object/);
        await expect(api.savePassport(passport('x'), 'card', { avatar: 'Nobody.png' })).rejects.toThrow(/no card/);
        expect(() => api.on('nope' as never, () => {})).toThrow(/unknown event/);
        expect(() => api.on('imageReady', 'x' as never)).toThrow(/function/);
        expect(() => api.registerSceneProvider({ id: '', priority: 1, describe: () => null })).toThrow(/id/);
        expect(() => api.registerSceneProvider({ id: 'a', priority: 1 } as never)).toThrow(/describe/);
        state.chatId = undefined;
        await expect(api.setOutfit('p2', 'Armor')).rejects.toThrow(/no chat/);
        await expect(api.clearChatOverride('p2')).rejects.toThrow(/no chat/);
    });

    it('saves passports into the card or the chat', async () => {
        const saved = vi.fn();
        api.on('passportsSaved', saved);
        // An existing card passport, edited for the chat: only the difference is kept.
        const bram = api.getPassport('p2')!;
        bram.slots.hair = 'red hair';
        await api.savePassport(bram, 'chat');
        expect(state.meta).toMatchObject({
            nai_studio: { passports: { overrides: { p2: { owner: 'Lyra.png', slots: { hair: 'red hair' } } } } },
        });
        // A new passport for the chat only.
        const npc = passport('', 'Guard');
        await api.savePassport(npc, 'chat');
        const created = api.passports({ chat: true });
        expect(created).toHaveLength(1);
        expect(created[0]!.name).toBe('Guard');
        expect(created[0]!.id).toMatch(/^p/);
        expect(saved).toHaveBeenLastCalledWith({ ids: [created[0]!.id], scope: 'chat' });
        // Moving it into the card drops the chat's copy.
        await api.savePassport(created[0]!, 'card');
        expect(cardPassports(0).map((p) => p.name)).toContain('Guard');
        expect(api.passports({ chat: true })).toEqual([]);
        // A new card passport for a named card; the persona; a world passport for the chat.
        await api.savePassport(passport('m2', 'Captain'), 'card', { avatar: 'Mira.png' });
        expect(cardPassports(1).map((p) => p.id)).toEqual(['m1', 'm2']);
        await api.savePassport({ ...passport('me'), negative: 'hat' }, 'card', { persona: true });
        expect(api.getPassport('me')!.negative).toBe('hat');
        await api.savePassport({ ...passport('me'), negative: 'glasses' }, 'card');
        expect(api.getPassport('me')!.negative).toBe('glasses');
        await api.savePassport(passport('w1', 'Docks', 'location'), 'chat');
        expect(api.passports({ chat: true }).map((p) => p.kind)).toEqual(['location']);
        // In a group a new card passport needs its card.
        state.characterId = undefined;
        state.groupId = 'g';
        state.groups = [{ id: 'g', members: ['Lyra.png', 'Mira.png'] }];
        await expect(api.savePassport(passport('n1', 'New'), 'card')).rejects.toThrow(/target\.avatar/);
    });

    it('reports images with the passports drawn', () => {
        const listener = vi.fn();
        const off = api.on('imageReady', listener);
        imageReady(4, 'marker', ['p1', 'p2']);
        expect(listener).toHaveBeenCalledWith({ messageIndex: 4, kind: 'marker', passportIds: ['p1', 'p2'] });
        // A listener's failure stays with the listener; its copy of the detail is its own.
        const broken = api.on('imageReady', (detail) => {
            detail.passportIds.push('x');
            throw new Error('boom');
        });
        const asyncBroken = api.on('imageReady', async () => {
            throw new Error('later');
        });
        expect(() => imageReady(5, 'inline')).not.toThrow();
        expect(listener).toHaveBeenLastCalledWith({ messageIndex: 5, kind: 'inline', passportIds: [] });
        off();
        broken();
        asyncBroken();
        imageReady(6, 'message');
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('asks registered scene providers by priority', async () => {
        state.chat = [{ mes: 'At the docks.', is_user: false }];
        const offLow = api.registerSceneProvider({
            id: 'low',
            priority: Number.NaN,
            describe: () => ({ locationName: 'Low', tags: 'low' }),
        });
        api.registerSceneProvider({
            id: 'maestro',
            priority: 100,
            describe: async ({ messageIndex, text }) => ({
                locationId: `pl-${messageIndex}`,
                locationName: text.includes('docks') ? 'Docks' : 'Elsewhere',
            }),
        });
        expect(await sceneHint()).toEqual({ locationId: 'pl-0', locationName: 'Docks', tags: 'low' });
        offLow();
        offLow();
        expect(await sceneHint({ messageId: 0, text: 'x' })).toEqual({ locationId: 'pl-0', locationName: 'Elsewhere' });
    });
});
