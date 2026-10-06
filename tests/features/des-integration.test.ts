// @vitest-environment happy-dom
// Doom's Enhancement Suite integration with mocked SillyTavern and DES (v0.9): people and setting
// from the tracker of a reply, passports found or written for new characters, the appearance line
// in DES, portrait policy and the /sd plan, DES auto portraits off and back, the separate-mode gate,
// automatic portraits behind the quality gate (v0.11), portraits drawn once by default and "state" following
// the drawn identity, not the tracker's wording (v0.13.2); passports of new characters in the chat, excluded
// passports, per-chat portraits and portraits on request (v0.14).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';

interface DesMock extends Record<string, unknown> {
    enabled?: boolean;
    generationMode?: string;
    autoPortraitMode?: string;
    autoGenerateAvatars?: boolean;
    npcAvatars: Record<string, string>;
    characterAppearance?: Record<string, string>;
}

interface Plan {
    scene: string;
    negative?: string;
    generation: { width: number; height: number; seed: number; characters: unknown[] };
    priority?: string;
    maxCost?: number;
    skipCostConfirm?: boolean;
}

interface Internals {
    handleTracker(portraits: boolean): Promise<void>;
    portraitQueue: Promise<unknown>;
    menuAction(action: string, name: string, isUser: boolean): Promise<void>;
    restoreTimer: ReturnType<typeof setTimeout> | null;
}

const inner = (integration: unknown) => integration as Internals;

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    chat: [] as Record<string, unknown>[],
    characters: [] as Record<string, unknown>[],
    cardPassports: [] as Passport[],
    des: null as unknown as DesMock,
    regenerate: null as unknown as (name: string) => Promise<string | null>,
    provider: null as unknown as {
        candidates: (q: unknown) => Promise<unknown[]>;
        setting: (q: unknown) => Promise<unknown>;
    },
    hook: null as unknown as (prompt: string) => Promise<Plan | null>,
    meta: {} as Record<string, unknown>,
    generated: [] as string[],
    chatPassports: [] as Passport[],
    excluded: new Set<string>(),
    chatId: 'chat-1',
    workshop: false,
}));

vi.mock('../../src/core/settings', () => ({
    settings: () => state.settings,
    saveSettings: vi.fn(),
    notifyExternalChange: vi.fn(),
}));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chat: state.chat,
        characters: state.characters,
        characterId: '0',
        groupId: null,
        groups: [],
        name1: 'Player',
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => undefined),
        getCurrentChatId: () => state.chatId,
        eventTypes: { MESSAGE_RECEIVED: 'message_received', APP_READY: 'app_ready' },
        eventSource: { on: vi.fn(), makeLast: vi.fn() },
    }),
    requestHeaders: () => ({ 'Content-Type': 'application/json' }),
}));
vi.mock('../../src/integration/des/des-adapter', () => ({
    connectDes: async () => ({
        name: 'third-party/Dooms-Enhancement-Suite',
        version: '2.6.0',
        verified: true,
        settings: state.des,
        enabled: () => state.des.enabled !== false,
        mode: () => state.des.generationMode ?? 'together',
        save: vi.fn(),
        regeneratePortrait: (name: string) => state.regenerate(name),
        refreshPortraits: vi.fn(),
        setPortraits: (portraits: Record<string, string>) => Object.assign((state.des.npcAvatars ??= {}), portraits),
        workshopOpen: () => state.workshop,
    }),
}));
// The chat's view of the passports (v0.14): its own passports and the ones it excludes.
const visible = (list: Passport[]) => list.filter((p) => !state.excluded.has(p.id));
vi.mock('../../src/features/characters/passport-store', () => ({
    cardPassports: () => state.cardPassports,
    resolvedCardPassports: () => visible(state.cardPassports),
    chatPassportData: () => ({ overrides: {}, extra: state.chatPassports }),
    chatOwnPassports: () => visible(state.chatPassports),
    passportExcluded: (id: string) => state.excluded.has(id),
    withoutExcluded: (list: Passport[]) => visible(list),
    chatCardIndexes: () => (state.characters.length ? [0] : []),
    chatOpen: () => Boolean(state.chatId),
    defaultCardForChat: () => (state.characters.length ? 0 : null),
    locatePassport: () => null,
    loadCharacter: async () => state.characters[0],
    onPassportsSaved: vi.fn(),
    saveCardPassport: vi.fn(async (_i: number, p: Passport) => {
        state.cardPassports = [...state.cardPassports.filter((x) => x.id !== p.id), p];
    }),
    saveChatPassport: vi.fn(async (_base: unknown, p: Passport) => {
        state.chatPassports = [...state.chatPassports.filter((x) => x.id !== p.id), p];
    }),
}));
vi.mock('../../src/features/characters/passport-generator', () => ({
    generateTrackerPassport: vi.fn(async (name: string) => {
        state.generated.push(name);
        const p = defaultPassport('character', name);
        p.slots.hair = 'white hair';
        p.slots.clothing = 'blue cloak';
        return p;
    }),
}));
vi.mock('../../src/features/language/interpreter', () => ({
    interpretForModel: async (text: string) => ({ prompt: `1girl, converted(${text.length})` }),
}));
vi.mock('../../src/features/scene/scene-service', () => ({
    setSceneProvider: (p: typeof state.provider) => (state.provider = p),
}));
vi.mock('../../src/integration/commands', () => ({ setPortraitHook: (h: typeof state.hook) => (state.hook = h) }));
vi.mock('../../src/features/sprites/sprite-service', () => ({ setExtraSpriteFolder: vi.fn() }));
vi.mock('../../src/features/continuity/continuity-service', () => ({
    setCurrentLocation: vi.fn(async () => undefined),
}));
vi.mock('../../src/integration/scene-setup', () => ({ editPersonaPassport: vi.fn(), openEmotions: vi.fn() }));
vi.mock('../../src/ui/passport-editor', () => ({ editPassport: vi.fn() }));
const toastr = { info: vi.fn(), warning: vi.fn(), success: vi.fn() };
vi.stubGlobal('toastr', toastr);

const { DesIntegration } = await import('../../src/integration/des/des-integration');
const { clearQualityVerdicts, qualityGenerationStarted, registerQualityGate } =
    await import('../../src/features/quality/quality-gate');
const { registerScenePassportProvider } = await import('../../src/features/scene/passport-providers');

const tracker = (
    characters: unknown[],
    infoBox: unknown = { time: '22:00', weather: { forecast: 'rain' }, location: 'Old Mill' },
) => '```json\n' + JSON.stringify({ infoBox, characters }) + '\n```\nText.';

function reply(mes: string, extra: Record<string, unknown> = {}) {
    state.chat.push({ mes, is_user: false, is_system: false, extra, swipe_id: 0 });
}

const markers = () => ({ setGate: vi.fn(), illustrate: vi.fn() }) as never;

const desPortraits = () =>
    ((state.meta.nai_studio as { desPortraits?: Record<string, unknown> } | undefined)?.desPortraits ?? {}) as Record<
        string,
        unknown
    >;

beforeEach(() => {
    state.settings = defaultSettings();
    state.chat = [];
    state.characters = [{ name: 'Lyra', avatar: 'Lyra.png' }];
    state.cardPassports = [];
    state.chatPassports = [];
    state.excluded = new Set();
    state.chatId = 'chat-1';
    state.workshop = false;
    state.generated = [];
    state.des = {
        enabled: true,
        generationMode: 'together',
        autoPortraitMode: 'only_missing',
        autoGenerateAvatars: true,
        npcAvatars: {},
    };
    // DES keeps the new portrait in npcAvatars, as regenerateAvatar does.
    state.regenerate = vi.fn(async (name: string) => (state.des.npcAvatars[name] = `/des-portraits/${name}.png`));
    state.meta = {};
    document.body.innerHTML = '<div id="chat"></div>';
});

describe('DesIntegration', () => {
    it('turns DES auto portraits off while it draws them, and back on when switched off', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        expect(des.status()).toMatchObject({ state: 'connected', version: '2.6.0', mode: 'together' });
        expect(state.des).toMatchObject({ autoPortraitMode: 'off', autoGenerateAvatars: false });
        expect(state.settings.des.saved).toEqual({ autoPortraitMode: 'only_missing', autoGenerateAvatars: true });
        state.settings.des.portraits = false;
        des.settingsChanged();
        expect(state.des).toMatchObject({ autoPortraitMode: 'only_missing', autoGenerateAvatars: true });
        expect(state.settings.des.saved).toBeNull();
    });

    it('gives scenes the people and setting of the reply tracker, Russian looks converted', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        reply(
            tracker([
                { name: 'Mira', details: { appearance: 'мокрый плащ' } },
                { name: 'Player', details: { appearance: 'x' } },
            ]),
        );
        const people = await state.provider.candidates({ messageId: 0 });
        expect(people).toEqual([
            expect.objectContaining({ key: 'des:Mira', name: 'Mira', passport: null, currentLook: 'converted(11)' }),
        ]);
        expect(await state.provider.setting({ text: state.chat[0]!.mes })).toEqual({
            tags: ['night', 'rain'],
            location: 'Old Mill',
        });
        state.settings.des.sceneTags = false;
        expect(await state.provider.setting({})).toEqual({ tags: [], location: '' });
    });

    it('writes a passport for a new character into the chat (v0.14), links it to DES and draws the portrait once', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        expect(state.settings.des.portraitPolicy).toBe('missing');
        expect(state.settings.des.npcPassportTarget).toBe('chat');
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        expect(state.generated).toEqual(['Mira']);
        expect(state.cardPassports).toEqual([]);
        expect(state.chatPassports).toEqual([expect.objectContaining({ name: 'Mira', origin: 'auto-des' })]);
        expect(toastr.info).toHaveBeenCalledWith('naist.des.passportCreatedChat', 'naist.des.title');
        expect(state.des.characterAppearance?.Mira).toBe('white hair, blue cloak');
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledWith('Mira');
        expect(desPortraits().Mira).toMatchObject({ look: 'wet blue cloak' });
        // Every next reply, however the tracker words the look: no second portrait.
        for (const look of ['wet blue cloak', 'red dress', 'armour; wounded']) {
            state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: look } }]);
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
        }
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        expect(state.generated).toEqual(['Mira']);
    });

    it('"card" as the target writes the passport into the card, marked as written from the tracker', async () => {
        state.settings.des.npcPassportTarget = 'card';
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(false);
        expect(state.chatPassports).toEqual([]);
        expect(state.cardPassports).toEqual([expect.objectContaining({ name: 'Mira', origin: 'auto-des' })]);
        expect(toastr.info).toHaveBeenCalledWith('naist.des.passportCreated', 'naist.des.title');
        // Without a card in the chat nothing is written.
        state.characters = [];
        reply(tracker([{ name: 'Bran', details: { appearance: 'grey beard' } }]));
        await inner(des).handleTracker(false);
        expect(state.generated).toEqual(['Mira']);
    });

    it('a passport written for a chat that was left meanwhile is not saved into the chat opened now', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        const generator = await import('../../src/features/characters/passport-generator');
        vi.mocked(generator.generateTrackerPassport).mockImplementationOnce(async (name: string) => {
            state.chatId = 'chat-2';
            return defaultPassport('character', name);
        });
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(false);
        expect(state.chatPassports).toEqual([]);
        expect(state.cardPassports).toEqual([]);
    });

    it('"missing" queues a portrait once while it is on its way; a deleted portrait is drawn again', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        let finish = () => {};
        state.regenerate = vi.fn(
            (name: string) =>
                new Promise<string>((resolve) => {
                    finish = () => resolve((state.des.npcAvatars[name] = `/des-portraits/${name}.png`));
                }),
        );
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await inner(des).handleTracker(true);
        await inner(des).handleTracker(true);
        finish();
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        delete state.des.npcAvatars.Mira;
        state.regenerate = vi.fn(async (name: string) => (state.des.npcAvatars[name] = `/des-portraits/${name}.png`));
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
    });

    it('"every" draws a portrait on every reply', async () => {
        state.settings.des.portraitPolicy = 'every';
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        for (let i = 0; i < 3; i++) {
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
        }
        expect(state.regenerate).toHaveBeenCalledTimes(3);
    });

    it('"state" with a passport: a reworded look keeps the portrait, outfit, states and passport redraw it', async () => {
        state.settings.des.portraitPolicy = 'state';
        const passport = defaultPassport('character', 'Mira', 'p-mira');
        passport.slots.hair = 'white hair';
        passport.slots.clothing = 'blue cloak';
        passport.outfits = [{ name: 'Gala', tags: 'red evening gown' }];
        state.cardPassports = [passport];
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        const turn = async (look: string) => {
            state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: look } }]);
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            return vi.mocked(state.regenerate).mock.calls.length;
        };
        expect(await turn('wet blue cloak')).toBe(1);
        // The model rewrites the look nearly every reply: no new portrait.
        expect(await turn('her blue cloak is soaked through')).toBe(1);
        expect(await turn('Soaked, shivering, cloak dripping')).toBe(1);
        // Maestro's wardrobe switches the outfit: a new portrait, once.
        passport.activeOutfit = 'Gala';
        expect(await turn('red evening gown')).toBe(2);
        expect(await turn('a red gown for the ball')).toBe(2);
        // A state switched on: a new portrait.
        passport.states = passport.states.map((s) => (s.id === 'wet' ? { ...s, enabled: true } : s));
        expect(await turn('red evening gown, wet')).toBe(3);
        // The passport itself edited (or another passport): a new portrait.
        passport.slots.hair = 'silver hair';
        expect(await turn('red evening gown, wet')).toBe(4);
        state.cardPassports = [{ ...passport, id: 'p-mira-2' }];
        expect(await turn('red evening gown, wet')).toBe(5);
        expect(await turn('red evening gown, wet')).toBe(5);
    });

    it('"state" without a passport: a small rewording keeps the portrait, a new look redraws it', async () => {
        state.settings.des.portraitPolicy = 'state';
        state.settings.des.autoPassports = false;
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'Wet blue cloak, muddy boots' } }]));
        const turn = async (look: string) => {
            state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: look } }]);
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            return vi.mocked(state.regenerate).mock.calls.length;
        };
        expect(await turn('Wet blue cloak, muddy boots')).toBe(1);
        expect(await turn('muddy boots and a wet blue cloak')).toBe(1);
        expect(await turn('высокая блондинка с голубыми глазами; в белом платье')).toBe(2);
        expect(await turn('Высокая блондинка, голубые глаза; белое платье')).toBe(2);
        expect(desPortraits().Mira).toMatchObject({ look: 'высокая блондинка с голубыми глазами; в белом платье' });
        expect(await turn('red silk dress, pearl necklace')).toBe(3);
    });

    it('"state" takes a portrait drawn before 0.13.2 as current: no redraw, the record starts now', async () => {
        state.settings.des.portraitPolicy = 'state';
        state.settings.des.autoPassports = false;
        state.des.npcAvatars.Mira = '/des-portraits/Mira.png';
        state.meta = { nai_studio: { desPortraits: { Mira: '1a2b3c4d' } } };
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).not.toHaveBeenCalled();
        expect(desPortraits().Mira).toMatchObject({ look: 'wet blue cloak' });
        state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: 'red silk dress, pearl necklace' } }]);
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
    });

    it('"new portrait" in the DES menu always draws and becomes the current portrait', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        await inner(des).menuAction('portrait', 'Mira', false);
        await inner(des).menuAction('portrait', 'Mira', false);
        expect(state.regenerate).toHaveBeenCalledTimes(3);
        // With "state" the menu's portrait is the baseline: the next reply does not draw again.
        state.settings.des.portraitPolicy = 'state';
        state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: 'red dress' } }]);
        await inner(des).menuAction('portrait', 'Mira', false);
        expect(state.regenerate).toHaveBeenCalledTimes(4);
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(4);
        expect(desPortraits().Mira).toMatchObject({ look: 'red dress' });
    });

    it('draws automatic portraits only after the quality gate approved the reply of the tracker', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        const gate = vi.fn(async () => false);
        const off = registerQualityGate(gate);
        try {
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            expect(gate).toHaveBeenCalledWith({ messageIndex: 0, swipeId: 0 });
            expect(state.regenerate).not.toHaveBeenCalled();
            // The passport and the appearance line do not wait.
            expect(state.des.characterAppearance?.Mira).toBe('white hair, blue cloak');
            qualityGenerationStarted();
            gate.mockResolvedValue(true);
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            expect(gate).toHaveBeenCalledTimes(2);
            expect(state.regenerate).toHaveBeenCalledWith('Mira');
        } finally {
            off();
            clearQualityVerdicts();
        }
    });

    it('uses the passport of a passport provider (v0.12) instead of writing one; the card still wins', async () => {
        const lore = defaultPassport('character', 'Mira', 'lore-mira');
        lore.slots.hair = 'black hair';
        lore.slots.clothing = 'green robe';
        const passports = vi.fn(() => [lore]);
        const off = registerScenePassportProvider({ id: 'maestro', priority: 1, passports });
        try {
            const des = new DesIntegration(markers());
            await des.start();
            reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            expect(state.generated).toEqual([]);
            expect(state.cardPassports).toEqual([]);
            expect(passports).toHaveBeenCalledWith({ messageIndex: 0, text: state.chat[0]!.mes });
            expect(state.des.characterAppearance?.Mira).toBe('black hair, green robe');
            expect(state.regenerate).toHaveBeenCalledWith('Mira');
            expect((await state.hook('black hair, green robe'))?.scene).toBe(
                'black hair, wet blue cloak, portrait, upper body, looking at viewer',
            );
            // A passport in the card wins over the provider's.
            const card = defaultPassport('character', 'Mira', 'card-mira');
            card.slots.hair = 'white hair';
            state.cardPassports = [card];
            await inner(des).handleTracker(false);
            expect(state.des.characterAppearance?.Mira).toBe('white hair');
        } finally {
            off();
        }
    });

    it('never replaces a portrait the user uploaded, nor the card character', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        state.des.npcAvatars = { Mira: '/uploads/mine.png' };
        reply(
            tracker([
                { name: 'Mira', details: { appearance: 'cloak' } },
                { name: 'Lyra', details: { appearance: 'bow' } },
            ]),
        );
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).not.toHaveBeenCalled();
    });

    it('recognises its appearance line in a DES /sd call and plans the portrait', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        const passport = defaultPassport('character', 'Mira');
        passport.slots.hair = 'white hair';
        passport.slots.clothing = 'blue cloak';
        passport.negative = 'hat';
        state.cardPassports = [passport];
        reply(tracker([{ name: 'Mira', details: { appearance: 'red dress' } }]));
        await inner(des).handleTracker(false);
        // DES sends the line cleaned (quotes, commas, spaces may change).
        const plan = await state.hook('white hair,  blue cloak');
        expect(plan).toMatchObject({
            scene: 'white hair, red dress, portrait, upper body, looking at viewer',
            negative: 'hat',
            generation: { width: 832, height: 1216, characters: [] },
        });
        expect(plan?.generation.seed).toBe((await state.hook('white hair, blue cloak'))?.generation.seed);
        expect(await state.hook('some other prompt')).toBeNull();
    });

    it('draws the outfit a tracker look stands for (v0.12.1), any other look over the clothing', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        const passport = defaultPassport('character', 'Mira');
        passport.slots.hair = 'white hair';
        passport.slots.clothing = 'blue cloak';
        passport.outfits = [{ name: 'Gala', tags: 'red evening gown', looks: ['Алое вечернее платье'] }];
        state.cardPassports = [passport];
        reply(tracker([{ name: 'Mira', details: { appearance: 'алое вечернее платье!' } }]));
        await inner(des).handleTracker(false);
        expect(await state.provider.candidates({ messageId: 0 })).toEqual([
            expect.objectContaining({ currentLook: 'converted(21)', currentLookText: 'алое вечернее платье!' }),
        ]);
        expect((await state.hook('white hair, blue cloak'))?.scene).toBe(
            'white hair, red evening gown, portrait, upper body, looking at viewer',
        );
        // A look no outfit recorded replaces the clothing, converted as before.
        state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: 'серый плащ' } }]);
        await inner(des).handleTracker(false);
        expect((await state.hook('white hair, blue cloak'))?.scene).toBe(
            'white hair, converted(10), portrait, upper body, looking at viewer',
        );
        // An English look is compared as written.
        passport.outfits[0]!.looks = ['scarlet evening gown'];
        state.chat[0]!.mes = tracker([{ name: 'Mira', details: { appearance: 'Scarlet evening gown.' } }]);
        await inner(des).handleTracker(false);
        expect((await state.hook('white hair, blue cloak'))?.scene).toBe(
            'white hair, red evening gown, portrait, upper body, looking at viewer',
        );
    });

    it('holds early start and waits for the tracker in separate mode', async () => {
        const gate = vi.fn();
        const des = new DesIntegration({ setGate: gate, illustrate: vi.fn() } as never);
        await des.start();
        const { holdEarlyStart, wait } = gate.mock.calls[0]![0];
        expect(holdEarlyStart()).toBe(false);
        state.des.generationMode = 'separate';
        expect(holdEarlyStart()).toBe(true);
        reply('Plain reply without a tracker.');
        let done = false;
        const waiting = wait(0).then(() => (done = true));
        await new Promise((r) => setTimeout(r, 50));
        expect(done).toBe(false);
        (state.chat[0]!.extra as Record<string, unknown>).dooms_tracker_swipes = { 0: { infoBox: '{"time":"10:00"}' } };
        await waiting;
        expect(done).toBe(true);
    });
});

describe('DesIntegration: excluded passports (v0.14)', () => {
    it('leaves a passport the chat excludes out of DES: no line from it, the character gets one of the chat', async () => {
        const card = defaultPassport('character', 'Mira', 'p-mira');
        card.slots.hair = 'black hair';
        card.slots.clothing = 'green robe';
        state.cardPassports = [card];
        state.excluded.add('p-mira');
        const des = new DesIntegration(markers());
        await des.start();
        // A save of the card writes no appearance line for the excluded passport.
        const store = await import('../../src/features/characters/passport-store');
        const synced = vi.mocked(store.onPassportsSaved).mock.calls.at(-1)![0];
        synced(0, [card]);
        expect(state.des.characterAppearance?.Mira).toBeUndefined();
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        // Treated as having no passport: a new passport of this chat, its line, its own portrait.
        expect(state.generated).toEqual(['Mira']);
        expect(state.chatPassports).toEqual([expect.objectContaining({ name: 'Mira', origin: 'auto-des' })]);
        expect(state.des.characterAppearance?.Mira).toBe('white hair, blue cloak');
        expect((await state.hook('white hair, blue cloak'))?.scene).toBe(
            'white hair, wet blue cloak, portrait, upper body, looking at viewer',
        );
        expect(state.regenerate).toHaveBeenCalledWith('Mira');
        // Used again in the chat: the card passport wins once more.
        state.excluded.clear();
        await inner(des).handleTracker(false);
        expect(state.des.characterAppearance?.Mira).toBe('black hair, green robe');
    });
});

describe('DesIntegration: per-chat portraits (v0.14)', () => {
    const record = (image: string, hash = 'h1') => ({ nai_studio: { desPortraits: { Mira: { hash, image } } } });

    it('puts the own portrait of each chat back into DES when the chat opens', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-b.png?t=1';
        state.meta = record('/user/images/Lyra/mira-a.png');
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-a.png');
        // Once per chat: a portrait changed later in the same chat is not overwritten.
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-c.png';
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-c.png');
        state.chatId = 'chat-2';
        state.meta = record('/user/images/Lyra/mira-b.png');
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-b.png');
        // The same file under another cache-buster is the same portrait: nothing is written.
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-a.png?t=9';
        state.chatId = 'chat-3';
        state.meta = record('/user/images/Lyra/mira-a.png');
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-a.png?t=9');
        // A chat without a record leaves DES as it is.
        state.chatId = 'chat-4';
        state.meta = {};
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-a.png?t=9');
        expect(state.meta).toEqual({});
    });

    it('never writes DES while its Workshop is open; the portraits come back once it closes', async () => {
        state.settings.des.autoPassports = false;
        const des = new DesIntegration(markers());
        await des.start();
        state.des.npcAvatars.Mira = '/user/images/Lyra/other.png';
        state.meta = record('/user/images/Lyra/mine.png');
        reply(tracker([{ name: 'Bran', details: { appearance: 'grey beard' } }]));
        state.workshop = true;
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/other.png');
        // No portrait is decided meanwhile either.
        expect(state.regenerate).not.toHaveBeenCalled();
        expect(inner(des).restoreTimer).not.toBeNull();
        clearTimeout(inner(des).restoreTimer!);
        inner(des).restoreTimer = null;
        state.workshop = false;
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mine.png');
        expect(state.regenerate).toHaveBeenCalledWith('Bran');
    });

    it('a character without a card passport has no portrait in a chat that did not record one', async () => {
        // Another chat drew Ophelia: DES keeps that portrait under the bare name for every chat.
        state.des.npcAvatars.Ophelia = '/user/images/Lyra/ophelia-old.png';
        const old = defaultPassport('character', 'Ophelia', 'p-ophelia');
        old.slots.hair = 'black hair';
        state.cardPassports = [old];
        const des = new DesIntegration(markers());
        await des.start();
        reply(tracker([{ name: 'Ophelia', details: { appearance: 'red hair, green dress' } }]));
        // With the card passport the shared portrait stays (as before v0.14).
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).not.toHaveBeenCalled();
        // The Ophelia of the card is someone else in this chat: excluded, a passport of the chat, her own portrait.
        state.excluded.add('p-ophelia');
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.chatPassports.map((p) => p.name)).toEqual(['Ophelia']);
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        expect(desPortraits().Ophelia).toMatchObject({ image: '/des-portraits/Ophelia.png' });
        // Drawn once: the record of this chat is its portrait from now on.
        await inner(des).handleTracker(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
    });

    it('a portrait changed while the chat is open becomes the own portrait of the chat, not redrawn', async () => {
        state.settings.des.autoPassports = false;
        const des = new DesIntegration(markers());
        await des.start();
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-other-chat.png';
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(false);
        // Uploaded in DES's Workshop while this chat is open: recorded as the chat's, not redrawn.
        state.des.npcAvatars.Mira = '/user/images/des-portraits/mira-upload-1a2b3c4d.png?t=5';
        const fetchMock = vi.fn(async (url: string, init?: RequestInit) =>
            url === '/api/images/upload'
                ? new Response(
                      JSON.stringify({
                          path: `/user/images/nai-studio-portraits/${JSON.parse(String(init?.body)).filename}.png`,
                      }),
                  )
                : new Response(new Blob(['png'], { type: 'image/png' })),
        );
        vi.stubGlobal('fetch', fetchMock);
        try {
            await inner(des).handleTracker(true);
            await inner(des).portraitQueue;
            await vi.waitFor(() => expect(desPortraits().Mira).toBeDefined());
        } finally {
            vi.unstubAllGlobals();
            vi.stubGlobal('toastr', toastr);
        }
        expect(state.regenerate).not.toHaveBeenCalled();
        // A file DES may delete is copied for the chat.
        expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
            '/user/images/des-portraits/mira-upload-1a2b3c4d.png?t=5',
            '/api/images/upload',
        ]);
        expect(desPortraits().Mira).toMatchObject({
            look: 'wet blue cloak',
            image: expect.stringMatching(/^\/user\/images\/nai-studio-portraits\/Mira-[0-9a-f]+\.png$/),
        });
    });

    it('chats recorded before v0.14 get the portrait DES held when v0.14 first started', async () => {
        state.des.npcAvatars = { Mira: '/user/images/Lyra/mira-old.png', Bran: 'data:image/png;base64,AAAA' };
        const des = new DesIntegration(markers());
        await des.start();
        // Taken once, without data URLs.
        expect(state.settings.des.legacyPortraits).toEqual({ Mira: '/user/images/Lyra/mira-old.png' });
        // Another chat drew a new Mira since then.
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-new.png';
        state.meta = { nai_studio: { desPortraits: { Mira: { hash: 'abc', look: 'cloak' } } } };
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-old.png');
        expect(desPortraits().Mira).toEqual({ hash: 'abc', look: 'cloak', image: '/user/images/Lyra/mira-old.png' });
        // A bare hash from before 0.13.2 keeps "identity unknown": "state" adopts it instead of redrawing.
        state.chatId = 'chat-2';
        state.meta = { nai_studio: { desPortraits: { Mira: '1a2b3c4d' } } };
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira-new.png';
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-old.png');
        expect(desPortraits().Mira).toEqual({ hash: '', image: '/user/images/Lyra/mira-old.png' });
        state.settings.des.portraitPolicy = 'state';
        state.settings.des.autoPassports = false;
        reply(tracker([{ name: 'Mira', details: { appearance: 'cloak' } }]));
        await inner(des).handleTracker(true);
        await vi.waitFor(() => expect(desPortraits().Mira).toMatchObject({ look: 'cloak' }));
        expect(state.regenerate).not.toHaveBeenCalled();
        expect(desPortraits().Mira).toMatchObject({ image: '/user/images/Lyra/mira-old.png' });
        // A second start keeps the snapshot.
        await new DesIntegration(markers()).start();
        expect(state.settings.des.legacyPortraits).toEqual({ Mira: '/user/images/Lyra/mira-old.png' });
    });

    it('a portrait drawn for a chat that was left is not recorded in the open chat; its own comes back', async () => {
        state.settings.des.autoPassports = false;
        const des = new DesIntegration(markers());
        await des.start();
        let finish = () => {};
        state.regenerate = vi.fn(
            (name: string) =>
                new Promise<string>((resolve) => {
                    finish = () => resolve((state.des.npcAvatars[name] = `/des-portraits/${name}-1.png`));
                }),
        );
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        const first = state.meta;
        await inner(des).handleTracker(true);
        await vi.waitFor(() => expect(state.regenerate).toHaveBeenCalled());
        state.chatId = 'chat-2';
        state.meta = record('/user/images/Lyra/mira-2.png');
        await inner(des).handleTracker(false);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-2.png');
        finish();
        await inner(des).portraitQueue;
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira-2.png');
        expect(desPortraits().Mira).toEqual({ hash: 'h1', image: '/user/images/Lyra/mira-2.png' });
        expect((first.nai_studio as { desPortraits?: object } | undefined)?.desPortraits ?? {}).toEqual({});
    });

    it('a portrait queued for a chat that was left before its turn is not drawn', async () => {
        state.settings.des.autoPassports = false;
        const des = new DesIntegration(markers());
        await des.start();
        let release = () => {};
        inner(des).portraitQueue = new Promise<void>((resolve) => (release = resolve));
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        state.chatId = 'chat-2';
        state.meta = {};
        release();
        await inner(des).portraitQueue;
        expect(state.regenerate).not.toHaveBeenCalled();
    });

    it('a failed redraw puts back the portrait DES moved to its history', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        state.des.npcAvatars.Mira = '/user/images/Lyra/mira.png';
        // DES stashes the current portrait first, then /sd fails (refused by the Anlas guard, for one).
        state.regenerate = vi.fn(async (name: string) => {
            delete state.des.npcAvatars[name];
            return null;
        });
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).menuAction('portrait', 'Mira', false);
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        expect(state.des.npcAvatars.Mira).toBe('/user/images/Lyra/mira.png');
    });
});

describe('DesIntegration: portraits on request (v0.14)', () => {
    function gala(): Passport {
        const passport = defaultPassport('character', 'Mira', 'p-mira');
        passport.slots.hair = 'white hair';
        passport.slots.clothing = 'blue cloak';
        passport.outfits = [{ name: 'Gala', tags: 'red evening gown' }];
        passport.activeOutfit = 'Gala';
        return passport;
    }

    it('queues a redraw now, once while it is pending, from the passport and under the Anlas cap', async () => {
        state.cardPassports = [gala()];
        const des = new DesIntegration(markers());
        await des.start();
        const plans: (Plan | null)[] = [];
        let finish = () => {};
        state.regenerate = vi.fn(async (name: string) => {
            plans.push(await state.hook(state.des.characterAppearance?.[name] ?? ''));
            await new Promise<void>((resolve) => (finish = resolve));
            return (state.des.npcAvatars[name] = `/user/images/Lyra/${name}-${plans.length}.png`);
        });
        reply(tracker([{ name: 'Mira' }]));
        expect(await des.requestPortrait('mira', 'outfit changed')).toBe(true);
        expect(await des.requestPortrait('Mira')).toBe(true);
        await vi.waitFor(() => expect(plans).toHaveLength(1));
        // The passport as the chat sees it, its active outfit; free-only: nothing that costs Anlas, no question.
        expect(plans[0]).toMatchObject({
            scene: 'white hair, red evening gown, portrait, upper body, looking at viewer',
            priority: 'portrait',
            maxCost: 0,
            skipCostConfirm: true,
        });
        finish();
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledTimes(1);
        expect(desPortraits().Mira).toMatchObject({ image: '/user/images/Lyra/Mira-1.png' });
        // Paid images allowed for markers: the same cap.
        state.settings.anlas.freeOnly = false;
        state.settings.markers.allowPaid = true;
        state.settings.markers.maxCost = 7;
        expect(await des.requestPortrait('Mira')).toBe(true);
        await vi.waitFor(() => expect(plans).toHaveLength(2));
        finish();
        await inner(des).portraitQueue;
        expect(plans[1]).toMatchObject({ maxCost: 7, skipCostConfirm: true });
        // Automatic portraits keep the usual confirmation.
        state.settings.des.portraitPolicy = 'every';
        await inner(des).handleTracker(true);
        await vi.waitFor(() => expect(plans).toHaveLength(3));
        finish();
        await inner(des).portraitQueue;
        expect(plans[2]).not.toHaveProperty('maxCost');
    });

    it('says false when the portrait cannot be drawn', async () => {
        const des = new DesIntegration(markers());
        expect(await des.requestPortrait('Mira')).toBe(false);
        await des.start();
        state.settings.des.autoPassports = false;
        reply(
            tracker([
                { name: 'Mira', details: { appearance: 'wet blue cloak' } },
                { name: 'Lyra', details: { appearance: 'bow' } },
                { name: 'Player', details: { appearance: 'x' } },
                { name: 'Edda' },
            ]),
        );
        expect(await des.requestPortrait('Nobody')).toBe(false);
        expect(await des.requestPortrait('Lyra')).toBe(false);
        expect(await des.requestPortrait('Player')).toBe(false);
        // Nothing to draw from: no passport and no look.
        expect(await des.requestPortrait('Edda')).toBe(false);
        state.settings.des.portraits = false;
        expect(await des.requestPortrait('Mira')).toBe(false);
        state.settings.des.portraits = true;
        state.des.enabled = false;
        expect(await des.requestPortrait('Mira')).toBe(false);
        state.des.enabled = true;
        // DES knows Bran from its portraits, not from the tracker now: no look, nothing to draw from.
        state.des.npcAvatars.Bran = '/user/images/Lyra/bran.png';
        expect(await des.requestPortrait('bran')).toBe(false);
        expect(await des.requestPortrait('Mira')).toBe(true);
        await inner(des).portraitQueue;
        expect(state.regenerate).toHaveBeenCalledWith('Mira');
    });
});
