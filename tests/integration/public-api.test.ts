// NAI_STUDIO_API (v0.10) with mocked SillyTavern: published and removed with the extension, passports
// as the chat sees them, saves into the card or the chat, outfits and states, events, scene providers,
// quality gates (v0.11), passport providers, passports from a description and backgrounds (v0.12).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NaiError } from '../../src/core/errors';
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
    llm: [] as { system: string; user: string; maxTokens?: number }[],
    answer: '' as string | (() => never),
    neverResize: false,
    popups: 0,
    rendered: [] as unknown[],
}));

class FakePopup {
    constructor() {
        state.popups++;
    }
    async show() {
        return 1;
    }
}

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
        substituteParams: (text: string) => text.replace(/\{\{char\}\}/g, 'Lyra'),
        writeExtensionField: vi.fn(async (index: number, key: string, value: unknown) => {
            const ch = state.characters[index] as { data: { extensions: Record<string, unknown> } };
            ch.data.extensions[key] = structuredClone(value);
        }),
        powerUserSettings: { never_resize_avatars: state.neverResize },
        Popup: FakePopup,
        POPUP_TYPE: { CROP: 5 },
        getThumbnailUrl: (type: string, file: string) => `/thumbnail?type=${type}&file=${file}`,
    }),
    importHost: async () => ({
        user_avatar: 'player.png',
        getUserAvatars: async (render: boolean, at: string) => state.rendered.push([render, at]),
    }),
    requestHeaders: (omitContentType?: boolean) =>
        omitContentType ? { 'X-CSRF-Token': 'token' } : { 'X-CSRF-Token': 'token', 'Content-Type': 'application/json' },
}));
// The language backend: the test's answer instead of a model.
vi.mock('../../src/features/language/llm', () => ({
    askLlm: vi.fn(async (request: { system: string; user: string; maxTokens: number }) => {
        state.llm.push(request);
        return typeof state.answer === 'function' ? state.answer() : state.answer;
    }),
}));
vi.mock('../../src/features/images/image-utils', async (original) => ({
    ...(await original<typeof import('../../src/features/images/image-utils')>()),
    toPngBlob: vi.fn(async () => new Blob(['clean png'], { type: 'image/png' })),
}));
const toastr = { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() };
vi.stubGlobal('toastr', toastr);

const { API_GLOBAL, installPublicApi, uninstallPublicApi } = await import('../../src/integration/public-api');
const { imageReady } = await import('../../src/features/events/studio-events');
const { sceneHint, sceneHintProviders } = await import('../../src/features/scene/scene-providers');
const { providedPassports, scenePassportProviders } = await import('../../src/features/scene/passport-providers');
const { BackgroundService } = await import('../../src/features/backgrounds/background-service');
const { clearQualityVerdicts, qualityGatesActive, replyVerdict } =
    await import('../../src/features/quality/quality-gate');

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
    state.neverResize = false;
    state.popups = 0;
    state.rendered = [];
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
            'registerQualityGate',
            'registerPassportProvider',
            'generatePassport',
            'generateBackground',
        ] as const)
            expect(typeof api[method]).toBe('function');
        const listener = vi.fn();
        api.on('imageReady', listener);
        api.registerSceneProvider({ id: 'maestro', priority: 1, describe: () => ({ tags: 'x' }) });
        api.registerPassportProvider({ id: 'maestro', passports: () => [] });
        expect(sceneHintProviders()).toHaveLength(1);
        expect(scenePassportProviders()).toHaveLength(1);
        uninstallPublicApi();
        expect(global()).toBeUndefined();
        expect(sceneHintProviders()).toHaveLength(0);
        expect(scenePassportProviders()).toHaveLength(0);
        imageReady(1, 'marker');
        expect(listener).not.toHaveBeenCalled();
    });

    it('takes quality gates (v0.11) and drops them with the API', async () => {
        expect(() => api.registerQualityGate('gate' as never)).toThrow(/gate must be a function/);
        const gate = vi.fn(async () => false);
        const off = api.registerQualityGate(gate);
        expect(qualityGatesActive()).toBe(true);
        state.chat = [{ mes: 'reply', is_user: false, is_system: false, swipe_id: 2 }];
        expect(await replyVerdict(0)).toBe('skip');
        expect(gate).toHaveBeenCalledWith({ messageIndex: 0, swipeId: 2 });
        off();
        expect(qualityGatesActive()).toBe(false);
        api.registerQualityGate(gate);
        expect(qualityGatesActive()).toBe(true);
        uninstallPublicApi();
        expect(qualityGatesActive()).toBe(false);
        clearQualityVerdicts();
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
        expect(saved).toHaveBeenLastCalledWith({ ids: ['me'], scope: 'card', persona: true, personaKey: 'player.png' });
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

    it('keeps the tracker wordings of outfits (v0.12.1) in chat and card saves', async () => {
        const bram = api.getPassport('p2')!;
        bram.outfits[1] = { ...bram.outfits[1]!, looks: ['Стальные латы', '  steel plate armor  ', 42 as never] };
        await api.savePassport(bram, 'chat');
        const looks = ['Стальные латы', 'steel plate armor'];
        expect(api.getPassport('p2')!.outfits[1]).toEqual({ name: 'Armor', tags: 'armor', looks });
        expect(state.meta).toMatchObject({
            nai_studio: {
                passports: {
                    overrides: {
                        p2: {
                            owner: 'Lyra.png',
                            outfits: [
                                { name: 'Ballgown', tags: 'ballgown' },
                                { name: 'Armor', tags: 'armor', looks },
                            ],
                        },
                    },
                },
            },
        });
        expect(cardPassports(0)[1]!.outfits[1]!.looks).toBeUndefined();
        // Switching the outfit keeps them; so does a save into the card.
        await api.setOutfit('p2', 'Armor');
        expect(api.getPassport('p2')).toMatchObject({ activeOutfit: 'Armor', outfits: [{}, { looks }] });
        await api.savePassport(api.getPassport('p2')!, 'card');
        expect(cardPassports(0)[1]!.outfits[1]!.looks).toEqual(looks);
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

describe('NAI_STUDIO_API passport providers (v0.12)', () => {
    it('takes passport providers, checks them and gives their passports to scenes', async () => {
        expect(() => api.registerPassportProvider(null as never)).toThrow(/object/);
        expect(() => api.registerPassportProvider({ id: ' ', passports: () => [] })).toThrow(/provider id/);
        expect(() => api.registerPassportProvider({ id: 'm' } as never)).toThrow(/passports must be a function/);
        state.chat = [{ mes: 'At the Old Mill.', is_user: false }];
        const passports = vi.fn(() => [passport('lore-mill', 'Old Mill', 'location')]);
        const off = api.registerPassportProvider({ id: 'maestro', passports });
        expect(scenePassportProviders()[0]).toMatchObject({ id: 'maestro', priority: 0 });
        const list = await providedPassports();
        expect(list.map((p) => [p.id, p.kind, p.tags])).toEqual([['lore-mill', 'location', 'Old Mill tags']]);
        expect(passports).toHaveBeenCalledWith({ messageIndex: 0, text: 'At the Old Mill.' });
        off();
        off();
        expect(scenePassportProviders()).toHaveLength(0);
    });
});

describe('NAI_STUDIO_API.generatePassport (v0.12)', () => {
    beforeEach(() => {
        state.llm = [];
        toastr.error.mockClear();
    });

    it('writes one passport of the kind from a description, keeps the given name and saves nothing', async () => {
        state.answer = JSON.stringify({
            passports: [
                { kind: 'character', name: 'Someone', hair: 'x' },
                {
                    kind: 'location',
                    name: 'Old Mill',
                    aliases: ['Mill', 'The Old Mill'],
                    tags: 'watermill, stone_bridge, masterpiece',
                },
            ],
        });
        const before = structuredClone(state.characters);
        const result = await api.generatePassport({
            name: 'The Old Mill',
            kind: 'location',
            description: '{{char}} grew up by the mill.',
            language: 'ru',
        });
        expect(result).toMatchObject({
            kind: 'location',
            name: 'The Old Mill',
            aliases: ['Old Mill', 'Mill'],
            tags: 'watermill, stone bridge',
        });
        expect(result!.id).toMatch(/^p/);
        expect(state.llm).toHaveLength(1);
        expect(state.llm[0]!.system).toContain('about one place');
        expect(state.llm[0]!.user).toContain('Lyra grew up by the mill.');
        expect(state.llm[0]!.user).toContain('Story language: Russian');
        expect(state.characters).toEqual(before);
        expect(state.meta).toEqual({});
    });

    it('reads a character, leaving out a species the text never names', async () => {
        state.answer = JSON.stringify({ passports: [{ name: 'Bram', base: '1boy, elf', hair: 'black hair' }] });
        const result = await api.generatePassport({ name: 'Bram', kind: 'character', description: 'A smith.' });
        expect(result).toMatchObject({ kind: 'character', name: 'Bram', slots: { base: '1boy', hair: 'black hair' } });
    });

    it('resolves null with a "requestFailed" event when nothing usable comes back', async () => {
        const failed = vi.fn();
        api.on('requestFailed', failed);
        state.answer = JSON.stringify({ passports: [{ kind: 'object', name: 'Lamp', tags: 'lamp' }] });
        expect(await api.generatePassport({ name: 'Mill', kind: 'location', description: 'A mill.' })).toBeNull();
        expect(failed).toHaveBeenLastCalledWith({
            request: 'passport',
            name: 'Mill',
            code: 'translation-failed',
            message: expect.stringContaining('no location passport'),
        });
        expect(await api.generatePassport({ name: 'Mill', kind: 'world', description: '  ' })).toBeNull();
        expect(failed).toHaveBeenCalledTimes(2);
        state.answer = () => {
            throw new NaiError('translation-failed', 'none', { message: 'no connection profile selected' });
        };
        expect(await api.generatePassport({ name: 'Mill', kind: 'object', description: 'A mill.' })).toBeNull();
        expect(failed).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'translation-failed' }));
        expect(toastr.error).not.toHaveBeenCalled();
    });

    it('rejects input it cannot use', async () => {
        await expect(api.generatePassport(null as never)).rejects.toThrow(/input must be an object/);
        await expect(api.generatePassport({ name: '', kind: 'location', description: 'x' })).rejects.toThrow(/name/);
        await expect(api.generatePassport({ name: 'A', kind: 'scenario' as never, description: 'x' })).rejects.toThrow(
            /kind must be one of character, location, object, world/,
        );
        await expect(api.generatePassport({ name: 'A', kind: 'object', description: 5 as never })).rejects.toThrow(
            /description/,
        );
        await expect(
            api.generatePassport({ name: 'A', kind: 'object', description: 'x', language: 1 as never }),
        ).rejects.toThrow(/language must be a string/);
        expect(state.llm).toEqual([]);
    });
});

describe('NAI_STUDIO_API.generateBackground (v0.12)', () => {
    const NOW = 1759600000000;
    const image = { base64: btoa('png bytes'), mime: 'image/png', seed: 1, index: 0 };
    let produce: ReturnType<typeof vi.fn>;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        toastr.error.mockClear();
        produce = vi.fn(async () => ({ images: [image], prepared: { cost: { total: 0 } } }));
        fetchMock = vi.fn(async () => new Response(`maestro-old-mill-${NOW}.png`));
        vi.stubGlobal('fetch', fetchMock);
        const mill = passport('l1', 'Old Mill', 'location');
        mill.tags = 'watermill, stone bridge';
        mill.negative = 'modern';
        state.characters[0] = card('Lyra', [passport('p1'), passport('p2', 'Bram'), mill]);
    });

    const upload = () => {
        const [url, init] = fetchMock.mock.calls.at(-1)! as [string, RequestInit];
        const file = (init.body as FormData).get('avatar') as File;
        return { url, init, file };
    };
    const lastScene = () => (produce.mock.calls.at(-1)![0] as { scene: string }).scene;

    it('resolves null before NAI Studio is active, and rejects input it cannot use', async () => {
        const failed = vi.fn();
        api.on('requestFailed', failed);
        expect(await api.generateBackground({ locationName: 'Old Mill' })).toBeNull();
        expect(failed).toHaveBeenCalledWith(expect.objectContaining({ request: 'background', name: 'Old Mill' }));
        await expect(api.generateBackground(null as never)).rejects.toThrow(/input must be an object/);
        await expect(api.generateBackground({ locationName: ' ' })).rejects.toThrow(/locationName/);
        await expect(api.generateBackground({ locationName: 'A', tags: ['x'] as never })).rejects.toThrow(
            /tags must be a string/,
        );
    });

    it('draws one landscape image without people and uploads it into the backgrounds library', async () => {
        installPublicApi({ backgrounds: new BackgroundService({ produce } as never, () => NOW) });
        state.settings.anlas.freeOnly = false;
        const ink = { name: 'Ink', prefix: 'ink wash', suffix: 'monochrome', negative: 'color', ucPreset: 'light' };
        state.settings.prompts.styles = [ink];
        const result = await api.generateBackground({
            locationName: 'Old Mill',
            passportId: 'l1',
            tags: 'autumn leaves',
            timeOfDay: 'evening',
            weather: 'rain',
            style: 'ink',
        });
        expect(result).toEqual({ file: `maestro-old-mill-${NOW}.png` });
        expect(produce).toHaveBeenCalledTimes(1);
        const request = produce.mock.calls[0]![0] as Record<string, unknown>;
        expect(request).toMatchObject({
            initiator: 'panel',
            mode: 7,
            // The saved style replaces the active one in the pipeline (v0.13): prefix, suffix, negative.
            scene: 'no humans, scenery, watermill, stone bridge, autumn leaves, evening, rain',
            interpret: 'cyrillic',
            noContinuity: true,
            overrides: {
                edit: false,
                negative: '1girl, 1boy, multiple girls, multiple boys, people, crowd, modern',
                style: ink,
                generation: {
                    width: 1344,
                    height: 768,
                    samples: 1,
                    characters: [],
                    transparentBackground: false,
                    ucPreset: 'light',
                },
            },
        });
        // Not free-only: the pipeline's usual cost confirmation decides.
        expect(request).not.toHaveProperty('maxCost');
        const { url, init, file } = upload();
        expect(url).toBe('/api/backgrounds/upload');
        expect(init).toMatchObject({ method: 'POST', headers: { 'X-CSRF-Token': 'token' }, cache: 'no-cache' });
        expect(init.headers).not.toHaveProperty('Content-Type');
        expect(file.name).toBe(`maestro-old-mill-${NOW}.png`);
        expect(file.type).toBe('image/png');
        expect(await file.text()).toBe('png bytes');
        expect(toastr.error).not.toHaveBeenCalled();
    });

    it('uses a place passport of a passport provider, ignores a person, and strips metadata when asked', async () => {
        installPublicApi({ backgrounds: new BackgroundService({ produce } as never, () => NOW) });
        state.settings.png.stripMetadata = true;
        api.registerPassportProvider({
            id: 'maestro',
            passports: () => [{ ...passport('lore-dock', 'Docks', 'location'), tags: 'wooden pier, fishing boats' }],
        });
        await api.generateBackground({ locationName: 'Docks', passportId: 'lore-dock' });
        expect(lastScene()).toBe('no humans, scenery, wooden pier, fishing boats');
        expect(await upload().file.text()).toBe('clean png');
        await api.generateBackground({ locationName: 'Smithy', passportId: 'p2' });
        expect(lastScene()).toBe('no humans, scenery, Smithy');
        await api.generateBackground({ locationName: 'Nowhere', passportId: 'missing', style: 'sketch' });
        expect(lastScene()).toBe('sketch, no humans, scenery, Nowhere');
    });

    it('respects free-only mode: a request that would cost Anlas resolves null with a toast and an event', async () => {
        installPublicApi({ backgrounds: new BackgroundService({ produce } as never, () => NOW) });
        const failed = vi.fn();
        api.on('requestFailed', failed);
        expect(state.settings.anlas.freeOnly).toBe(true);
        produce.mockRejectedValueOnce(new NaiError('free-only-blocked', 'none', { cost: 6 }));
        expect(await api.generateBackground({ locationName: 'Old Mill' })).toBeNull();
        expect(produce.mock.calls[0]![0]).toMatchObject({ maxCost: 0 });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(failed).toHaveBeenCalledWith({
            request: 'background',
            name: 'Old Mill',
            code: 'free-only-blocked',
            message: 'This request would spend 6 Anlas.',
        });
        expect(toastr.error).toHaveBeenCalledWith(expect.stringContaining('Old Mill'), 'Blocked by free-only mode');
        expect(toastr.error.mock.calls[0]![0]).toContain('This request would spend 6 Anlas.');
    });

    it('resolves null without a toast when the cost confirmation is declined, and reports a failed upload', async () => {
        installPublicApi({ backgrounds: new BackgroundService({ produce } as never, () => NOW) });
        const failed = vi.fn();
        api.on('requestFailed', failed);
        produce.mockResolvedValueOnce(null);
        expect(await api.generateBackground({ locationName: 'Old Mill' })).toBeNull();
        expect(failed).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'aborted' }));
        expect(toastr.error).not.toHaveBeenCalled();
        fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
        expect(await api.generateBackground({ locationName: 'Old Mill' })).toBeNull();
        expect(failed).toHaveBeenLastCalledWith(
            expect.objectContaining({ code: 'unknown', message: 'background upload failed: HTTP 500' }),
        );
        expect(toastr.error).toHaveBeenCalledTimes(1);
    });
});

describe('NAI_STUDIO_API: excluded passports and DES portraits (v0.14)', () => {
    const scenes = () => import('../../src/features/scene/scene-service');
    const store = () => import('../../src/features/characters/passport-store');

    it('names its features and keeps them frozen', () => {
        expect(api.features).toEqual([
            'excludePassport',
            'requestDesPortrait',
            'chatNpcPassports',
            'chatPortraits',
            'personaKeys',
        ]);
        expect(Object.isFrozen(api.features)).toBe(true);
        for (const method of ['setPassportExcluded', 'isPassportExcluded', 'requestDesPortrait'] as const)
            expect(typeof api[method]).toBe('function');
    });

    it('excludes a passport from the current chat only; every reader of the chat leaves it out', async () => {
        const changed = vi.fn();
        api.on('passportExcludedChanged', changed);
        const lore = passport('lore-x', 'Ophelia');
        const off = api.registerPassportProvider({ id: 'maestro', passports: () => [lore] });
        try {
            await api.setPassportExcluded('p2', true);
            await api.setPassportExcluded('p2', true);
            expect(changed).toHaveBeenCalledTimes(1);
            expect(changed).toHaveBeenCalledWith({ id: 'p2', excluded: true });
            expect(api.isPassportExcluded('p2')).toBe(true);
            expect(state.meta).toMatchObject({
                nai_studio: { passports: { overrides: { p2: { owner: 'Lyra.png', excluded: true } } } },
            });
            // The card is not touched.
            expect(cardPassports(0).map((p) => p.id)).toEqual(['p1', 'p2']);
            expect(api.passports().map((p) => p.id)).toEqual(['p1', 'me']);
            expect(api.passports({ includeExcluded: true }).map((p) => p.id)).toEqual(['p1', 'p2', 'me']);
            expect(api.passports({ avatar: 'Lyra.png' }).map((p) => p.id)).toEqual(['p1']);
            expect(api.getPassport('p2')).toBeNull();
            expect(api.getPassport('p2', { includeExcluded: true })?.name).toBe('Bram');
            // Scenes and markers: no Bram, and no lore passport the chat excludes.
            const { sceneCandidates } = await scenes();
            expect((await sceneCandidates()).map((c) => c.name)).toEqual(['Lyra', 'Player', 'Ophelia']);
            await api.setPassportExcluded('lore-x', true);
            expect(await providedPassports({ messageId: 0 })).toEqual([]);
            expect((await sceneCandidates()).map((c) => c.name)).toEqual(['Lyra', 'Player']);
            // The persona and a passport of the chat itself.
            await api.savePassport(passport('own', 'Guard'), 'chat');
            await api.setPassportExcluded('me', true);
            await api.setPassportExcluded('own', true);
            expect(api.passports().map((p) => p.id)).toEqual(['p1']);
            expect(api.passports({ chat: true, includeExcluded: true }).map((p) => p.id)).toEqual(['own']);
            const people = await sceneCandidates();
            expect(people.find((c) => c.isUser)?.passport).toBeNull();
            expect(people.map((c) => c.name)).not.toContain('Guard');
            // Used again.
            await api.setPassportExcluded('p2', false);
            expect(changed).toHaveBeenLastCalledWith({ id: 'p2', excluded: false });
            expect(api.getPassport('p2')?.name).toBe('Bram');
            expect(state.meta).toMatchObject({ nai_studio: { passports: { overrides: { me: { excluded: true } } } } });
            expect(
                (state.meta.nai_studio as { passports: { overrides: object } }).passports.overrides,
            ).not.toHaveProperty('p2');
            // Another chat does not exclude it.
            state.meta = {};
            state.chatId = 'chat-2';
            expect(api.isPassportExcluded('me')).toBe(false);
            expect(api.passports().map((p) => p.id)).toEqual(['p1', 'p2', 'me']);
        } finally {
            off();
        }
    });

    it("keeps the card's own character in scenes, without a passport, when its passport is excluded", async () => {
        const { sceneCandidates } = await scenes();
        await api.setPassportExcluded('p1', true);
        const people = (await sceneCandidates()).filter((c) => !c.isUser);
        expect(people.map((c) => [c.key, c.name, c.passport?.id ?? null])).toEqual([
            ['Lyra', 'Lyra', null],
            ['Lyra#p2', 'Bram', 'p2'],
        ]);
    });

    it('leaves an excluded place out of the setting and a background', async () => {
        state.characters = [card('Lyra', [passport('p1'), passport('loc1', 'Old Mill', 'location')])];
        const { sceneSetting } = await scenes();
        expect((await sceneSetting()).locations.map((l) => l.name)).toEqual(['Old Mill']);
        await api.setPassportExcluded('loc1', true);
        expect((await sceneSetting()).locations).toEqual([]);
    });

    it('keeps the exclusion through chat saves and when the changes of the chat are dropped', async () => {
        await api.setPassportExcluded('p2', true);
        await api.setOutfit('p2', 'Armor');
        expect(state.meta).toMatchObject({
            nai_studio: {
                passports: { overrides: { p2: { owner: 'Lyra.png', activeOutfit: 'Armor', excluded: true } } },
            },
        });
        // An edit that ends up like the card keeps only the flag.
        await api.setOutfit('p2', '');
        expect(state.meta).toMatchObject({
            nai_studio: { passports: { overrides: { p2: { owner: 'Lyra.png', excluded: true } } } },
        });
        await api.setOutfit('p2', 'Armor');
        await api.clearChatOverride('p2');
        expect(api.isPassportExcluded('p2')).toBe(true);
        expect(api.getPassport('p2', { includeExcluded: true })?.activeOutfit).toBe('');
        // Only the flag left: nothing of the passport to drop.
        const { clearChatOverride, hasChatOverride } = await store();
        expect(await clearChatOverride('p2')).toBe(false);
        expect(hasChatOverride('p2', 'Lyra.png')).toBe(false);
    });

    it('refuses an exclusion it cannot store', async () => {
        await expect(api.setPassportExcluded('', true)).rejects.toThrow(/passport id/);
        await expect(api.setPassportExcluded('p2', 'yes' as never)).rejects.toThrow(/boolean/);
        state.chatId = undefined;
        await expect(api.setPassportExcluded('p2', true)).rejects.toThrow(/no chat/);
        expect(api.isPassportExcluded('p2')).toBe(false);
    });

    it('moves a passport of the chat into the card, keeping its id and origin', async () => {
        const saved = vi.fn();
        api.on('passportsSaved', saved);
        const npc = { ...passport('npc1', 'Ophelia'), origin: 'auto-des' as const };
        const { defaultCardForChat, moveChatPassportToCard } = await store();
        await api.savePassport(npc, 'chat');
        expect(api.getPassport('npc1')?.origin).toBe('auto-des');
        expect(defaultCardForChat()).toBe(0);
        const edited = { ...api.getPassport('npc1')!, tags: '', aliases: ['Ophi'] };
        expect(await moveChatPassportToCard('npc1', 0, edited)).toBe(true);
        expect(cardPassports(0).find((p) => p.id === 'npc1')).toMatchObject({ origin: 'auto-des', aliases: ['Ophi'] });
        expect(api.passports({ chat: true })).toEqual([]);
        expect(api.getPassport('npc1')?.aliases).toEqual(['Ophi']);
        expect(saved).toHaveBeenCalledWith({ ids: ['npc1'], scope: 'chat' });
        expect(await moveChatPassportToCard('npc1', 0)).toBe(false);
        // In a group the passport goes to the card of the last speaker by default.
        state.groupId = 'g';
        state.groups = [{ id: 'g', members: ['Lyra.png', 'Mira.png'] }];
        state.chat = [{ mes: 'hi', is_user: false, is_system: false, original_avatar: 'Mira.png' }];
        expect(defaultCardForChat()).toBe(1);
    });

    it('asks the DES integration for a portrait and says false without it', async () => {
        expect(await api.requestDesPortrait('Mira')).toBe(false);
        const request = vi.fn(async () => true);
        installPublicApi({ desPortraits: request });
        expect(await api.requestDesPortrait(' Mira ', { reason: 'outfit changed' })).toBe(true);
        expect(request).toHaveBeenCalledWith('Mira', 'outfit changed');
        expect(await api.requestDesPortrait('Mira')).toBe(true);
        expect(request).toHaveBeenLastCalledWith('Mira', undefined);
        request.mockRejectedValueOnce(new Error('boom'));
        expect(await api.requestDesPortrait('Mira')).toBe(false);
        await expect(api.requestDesPortrait('')).rejects.toThrow(/name/);
        await expect(api.requestDesPortrait('Mira', { reason: 5 } as never)).rejects.toThrow(/reason/);
    });

    it('keeps a portrait given as a data URL as a file of the chat', async () => {
        const { portraitReference, PORTRAIT_FOLDER } = await import('../../src/integration/des/chat-portraits');
        const bodies: Record<string, unknown>[] = [];
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
            bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
            return new Response(JSON.stringify({ path: '/user/images/nai-studio-portraits/Mira-1.webp' }));
        });
        vi.stubGlobal('fetch', fetchMock);
        try {
            expect(await portraitReference('Mira', 'data:image/webp;base64,UklGRg==')).toBe(
                '/user/images/nai-studio-portraits/Mira-1.webp',
            );
            expect(bodies[0]).toMatchObject({ image: 'UklGRg==', format: 'webp', ch_name: PORTRAIT_FOLDER });
            expect(bodies[0]!.filename).toMatch(/^Mira-[0-9a-f]+$/);
            // Any other path is kept as it is; nothing to keep is undefined.
            expect(await portraitReference('Mira', '/user/images/Lyra/mira.png')).toBe('/user/images/Lyra/mira.png');
            expect(await portraitReference('Mira', undefined)).toBeUndefined();
            expect(await portraitReference('Mira', 'data:image/png,raw')).toBeUndefined();
            // A failed upload never leaves a data URL in the chat.
            fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
            expect(await portraitReference('Mira', 'data:image/png;base64,AA')).toBeUndefined();
            expect(fetchMock).toHaveBeenCalledTimes(2);
        } finally {
            vi.unstubAllGlobals();
            vi.stubGlobal('toastr', toastr);
        }
    });
});

describe('NAI_STUDIO_API: any persona by its key (0.15)', () => {
    const ANNA = '1728000000000-Anna.png';

    it('names the feature and has the members', () => {
        expect(api.features).toContain('personaKeys');
        for (const method of ['getPersonaPassport', 'generatePersonaAvatar'] as const)
            expect(typeof api[method]).toBe('function');
    });

    it("reads and saves any persona's passport, current or not, whatever the scope", async () => {
        const saved = vi.fn();
        api.on('passportsSaved', saved);
        expect(api.getPersonaPassport(ANNA)).toBeNull();
        expect(api.getPersonaPassport('' as string)).toBeNull();
        expect(api.getPersonaPassport(42 as never)).toBeNull();
        const anna = { ...passport('', 'Anna'), negative: 'glasses' };
        await api.savePassport(anna, 'card', { personaKey: ANNA });
        const stored = api.getPersonaPassport(ANNA)!;
        expect(stored).toMatchObject({ name: 'Anna', negative: 'glasses', kind: 'character' });
        expect(stored.id).toMatch(/^p/);
        expect(saved).toHaveBeenLastCalledWith({ ids: [stored.id], scope: 'card', persona: true, personaKey: ANNA });
        // A copy; the current persona and the chat are not touched.
        stored.name = 'changed';
        expect(api.getPersonaPassport(ANNA)!.name).toBe('Anna');
        expect(api.passports({ persona: true }).map((p) => p.id)).toEqual(['me']);
        expect(state.meta).toEqual({});
        // The chat scope does not apply to a persona by key: its stored passport is replaced, keeping its id.
        await api.savePassport({ ...passport('', 'Anna'), negative: 'hat' }, 'chat', { personaKey: ANNA });
        expect(api.getPersonaPassport(ANNA)).toMatchObject({ id: stored.id, negative: 'hat' });
        expect(state.meta).toEqual({});
        // An id given wins; the key wins over `persona`; the current persona by its key too.
        await api.savePassport(passport('anna-2', 'Anna'), 'card', { personaKey: ANNA, persona: true });
        expect(api.getPersonaPassport(ANNA)!.id).toBe('anna-2');
        expect(api.getPersonaPassport('player.png')!.id).toBe('me');
        await api.savePassport({ ...passport('me'), negative: 'scar' }, 'card', { personaKey: 'player.png' });
        expect(api.getPassport('me')!.negative).toBe('scar');
        // The stored passport, without the chat's override of the current persona.
        await api.setOutfit('me', 'Armor');
        expect(api.getPassport('me')!.activeOutfit).toBe('Armor');
        expect(api.getPersonaPassport('player.png')!.activeOutfit).toBe('');
    });

    it('rejects a persona key that is not a file name', async () => {
        for (const key of ['', ' ', 'a/b.png', 'a\\b.png', '..', 5])
            await expect(api.savePassport(passport('x'), 'card', { personaKey: key as never })).rejects.toThrow(
                /personaKey/,
            );
        await expect(api.savePassport(passport('x'), 'card', { personaKey: ANNA, avatar: 'Lyra.png' })).rejects.toThrow(
            /exclude each other/,
        );
        await expect(api.savePassport(passport('x'), 'world' as never, { personaKey: ANNA })).rejects.toThrow(/scope/);
        expect(api.getPersonaPassport(ANNA)).toBeNull();
    });

    it('writes a persona passport from a description with the persona prompt and room for outfits', async () => {
        state.llm = [];
        state.answer = JSON.stringify({
            passports: [
                {
                    kind: 'character',
                    name: 'Anya',
                    aliases: ['Ann'],
                    base: '1girl, adult',
                    hair: 'silver hair',
                    clothing: 'black coat',
                    outfits: [
                        { name: 'Ballgown', tags: 'red ballgown' },
                        { name: 'Armor', tags: 'steel armor' },
                    ],
                },
            ],
        });
        const result = await api.generatePassport({
            name: 'Anna',
            kind: 'character',
            description: '{{char}} has a sister, Anna, with silver hair.',
            language: 'ru',
            persona: true,
        });
        expect(result).toMatchObject({
            kind: 'character',
            name: 'Anna',
            aliases: ['Anya', 'Ann'],
            slots: { hair: 'silver hair', clothing: 'black coat' },
            outfits: [
                { name: 'Ballgown', tags: 'red ballgown' },
                { name: 'Armor', tags: 'steel armor' },
            ],
        });
        expect(result!.id).toMatch(/^p/);
        expect(state.llm).toHaveLength(1);
        const request = state.llm[0]!;
        expect(request.system).toContain("player's persona");
        expect(request.system).not.toContain('lorebook entry');
        expect(request.system).toContain('the name as a Russian text spells it');
        expect(request.user).toContain('Persona: Anna');
        expect(request.user).toContain('Lyra has a sister');
        expect(request.user).toContain('Story language: Russian');
        expect(request.maxTokens).toBe(2000);
        // The kind may be left out; nothing is saved.
        await api.generatePassport({ name: 'Anna', description: 'x', persona: true } as never);
        expect(state.llm[1]!.system).toContain("player's persona");
        expect(state.llm[1]!.user).not.toContain('Story language');
        expect(state.settings.scene.personaPassports).not.toHaveProperty('1728000000000-Anna.png');
        // Without `persona` the lore entry prompt is used as before.
        await api.generatePassport({ name: 'Anna', kind: 'character', description: 'x', persona: false });
        expect(state.llm[2]!.system).toContain('lorebook entry');
        expect(state.llm[2]!.maxTokens).toBe(1200);
    });

    it('rejects a persona passport of another kind or a persona flag that is not a boolean', async () => {
        state.llm = [];
        await expect(
            api.generatePassport({ name: 'A', kind: 'location', description: 'x', persona: true }),
        ).rejects.toThrow(/kind "character"/);
        await expect(
            api.generatePassport({ name: 'A', kind: 'character', description: 'x', persona: 'yes' as never }),
        ).rejects.toThrow(/persona must be a boolean/);
        expect(state.llm).toEqual([]);
    });

    describe('generatePersonaAvatar', () => {
        const image = { base64: btoa('png bytes'), mime: 'image/png' as const, index: 0 };
        let produce: ReturnType<typeof vi.fn>;
        let fetchMock: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            toastr.error.mockClear();
            produce = vi.fn(async () => ({
                images: [image],
                prepared: { request: { width: 832, height: 1216 }, cost: { total: 0 } },
            }));
            fetchMock = vi.fn(async (url: string) =>
                url.startsWith('/api/avatars/upload') ? new Response(JSON.stringify({ path: ANNA })) : new Response(''),
            );
            vi.stubGlobal('fetch', fetchMock);
            vi.stubGlobal('document', { querySelectorAll: () => [] });
            const anna = passport('anna', 'Anna');
            anna.slots.hair = 'silver hair';
            state.settings.scene.personaPassports[ANNA] = anna;
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            vi.stubGlobal('toastr', toastr);
        });

        const uploads = () =>
            fetchMock.mock.calls.filter((call) => String(call[0]).startsWith('/api/avatars/upload')) as [
                string,
                RequestInit,
            ][];

        it('says "inactive" before NAI Studio runs, and rejects input it cannot use', async () => {
            expect(await api.generatePersonaAvatar({ personaKey: ANNA })).toEqual({ ok: false, error: 'inactive' });
            await expect(api.generatePersonaAvatar(null as never)).rejects.toThrow(/options must be an object/);
            await expect(api.generatePersonaAvatar({ personaKey: '../x.png' })).rejects.toThrow(/personaKey/);
            await expect(api.generatePersonaAvatar({ personaKey: ANNA, passport: 'x' as never })).rejects.toThrow(
                /passport must be an object/,
            );
            await expect(api.generatePersonaAvatar({ personaKey: ANNA, signal: {} as never })).rejects.toThrow(
                /signal must be an AbortSignal/,
            );
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('draws the stored passport free only and sets it as the avatar of a persona that is not current', async () => {
            installPublicApi({ pipeline: { produce } as never });
            const abort = new AbortController();
            const result = await api.generatePersonaAvatar({ personaKey: ANNA, signal: abort.signal });
            expect(result).toEqual({ ok: true, path: ANNA });
            expect(produce).toHaveBeenCalledTimes(1);
            expect(produce.mock.calls[0]![0]).toMatchObject({
                scene: expect.stringContaining('1girl, silver hair'),
                maxCost: 0,
                skipCostConfirm: true,
                noVibeEncoding: true,
                chatless: true,
                queue: { priority: 'portrait', kind: 'portrait' },
                signal: abort.signal,
                overrides: { quiet: true },
            });
            // No crop popup: ST's default crop goes with the upload, overwriting the persona's file.
            expect(state.popups).toBe(0);
            const [url, init] = uploads()[0]!;
            expect(url.startsWith('/api/avatars/upload?crop=')).toBe(true);
            expect(JSON.parse(decodeURIComponent(url.split('?crop=')[1]!))).toEqual({
                x: 10,
                y: 0,
                width: 811,
                height: 1216,
                want_resize: true,
            });
            expect(init).toMatchObject({ method: 'POST', headers: { 'X-CSRF-Token': 'token' }, cache: 'no-cache' });
            const form = init.body as FormData;
            expect(form.get('overwrite_name')).toBe(ANNA);
            expect((form.get('avatar') as File).type).toBe('image/png');
            // The persona list is rendered again at that persona; the cached files are reloaded.
            expect(state.rendered).toEqual([[true, ANNA]]);
            expect(fetchMock.mock.calls.map((call) => call[0])).toContain(`/User Avatars/${ANNA}`);
            // The current persona and its passport are not touched.
            expect(api.getPassport('me')).not.toBeNull();
        });

        it('uses the given passport, and uploads as it is when ST never resizes avatars', async () => {
            installPublicApi({ pipeline: { produce } as never });
            state.neverResize = true;
            const given = passport('given', 'Anna');
            given.slots.hair = 'pink hair';
            expect(await api.generatePersonaAvatar({ personaKey: 'new-persona.png', passport: given })).toEqual({
                ok: true,
                path: ANNA,
            });
            expect((produce.mock.calls[0]![0] as { scene: string }).scene).toContain('pink hair');
            expect(uploads()[0]![0]).toBe('/api/avatars/upload');
            expect((uploads()[0]![1].body as FormData).get('overwrite_name')).toBe('new-persona.png');
            expect(state.popups).toBe(0);
        });

        it('refuses a picture that would cost Anlas without uploading anything', async () => {
            installPublicApi({ pipeline: { produce } as never });
            produce.mockRejectedValueOnce(new NaiError('free-only-blocked', 'none', { cost: 6 }));
            expect(await api.generatePersonaAvatar({ personaKey: ANNA })).toEqual({ ok: false, error: 'cost' });
            expect(fetchMock).not.toHaveBeenCalled();
            expect(state.popups).toBe(0);
            expect(toastr.error).not.toHaveBeenCalled();
        });

        it('says "no-passport", "aborted" and "upload" when it cannot set one', async () => {
            installPublicApi({ pipeline: { produce } as never });
            expect(await api.generatePersonaAvatar({ personaKey: 'nobody.png' })).toEqual({
                ok: false,
                error: 'no-passport',
            });
            expect(
                await api.generatePersonaAvatar({ personaKey: ANNA, passport: defaultPassport('character', 'Anna') }),
            ).toEqual({ ok: false, error: 'no-passport' });
            const abort = new AbortController();
            abort.abort();
            expect(await api.generatePersonaAvatar({ personaKey: ANNA, signal: abort.signal })).toEqual({
                ok: false,
                error: 'aborted',
            });
            expect(produce).not.toHaveBeenCalled();
            produce.mockRejectedValueOnce(new NaiError('aborted', 'none'));
            expect(await api.generatePersonaAvatar({ personaKey: ANNA })).toEqual({ ok: false, error: 'aborted' });
            fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
            expect(await api.generatePersonaAvatar({ personaKey: ANNA })).toEqual({ ok: false, error: 'upload' });
        });
    });
});
