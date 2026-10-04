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
    llm: [] as { system: string; user: string }[],
    answer: '' as string | (() => never),
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
        substituteParams: (text: string) => text.replace(/\{\{char\}\}/g, 'Lyra'),
        writeExtensionField: vi.fn(async (index: number, key: string, value: unknown) => {
            const ch = state.characters[index] as { data: { extensions: Record<string, unknown> } };
            ch.data.extensions[key] = structuredClone(value);
        }),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
    requestHeaders: (omitContentType?: boolean) =>
        omitContentType ? { 'X-CSRF-Token': 'token' } : { 'X-CSRF-Token': 'token', 'Content-Type': 'application/json' },
}));
// The language backend: the test's answer instead of a model.
vi.mock('../../src/features/language/llm', () => ({
    askLlm: vi.fn(async (request: { system: string; user: string }) => {
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
        state.settings.prompts.styles = [
            { name: 'Ink', prefix: 'ink wash', suffix: 'monochrome', negative: 'color', ucPreset: 'light' },
        ];
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
            scene: 'ink wash, no humans, scenery, watermill, stone bridge, autumn leaves, evening, rain, monochrome',
            interpret: 'cyrillic',
            noContinuity: true,
            overrides: {
                edit: false,
                negative: '1girl, 1boy, multiple girls, multiple boys, people, crowd, modern, color',
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
