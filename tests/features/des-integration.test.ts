// @vitest-environment happy-dom
// Doom's Enhancement Suite integration with mocked SillyTavern and DES (v0.9): people and setting
// from the tracker of a reply, passports found or written for new characters, the appearance line
// in DES, portrait policy and the /sd plan, DES auto portraits off and back, the separate-mode gate,
// automatic portraits behind the quality gate (v0.11), portraits drawn once by default and "state" following
// the drawn identity, not the tracker's wording (v0.13.2).
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
}

interface Internals {
    handleTracker(portraits: boolean): Promise<void>;
    portraitQueue: Promise<unknown>;
    menuAction(action: string, name: string, isUser: boolean): Promise<void>;
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
        getCurrentChatId: () => 'chat-1',
        eventTypes: { MESSAGE_RECEIVED: 'message_received', APP_READY: 'app_ready' },
        eventSource: { on: vi.fn(), makeLast: vi.fn() },
    }),
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
    }),
}));
vi.mock('../../src/features/characters/passport-store', () => ({
    cardPassports: () => state.cardPassports,
    resolvedCardPassports: () => state.cardPassports,
    chatPassportData: () => ({ overrides: {}, extra: [] }),
    chatCardIndexes: () => (state.characters.length ? [0] : []),
    locatePassport: () => null,
    loadCharacter: async () => state.characters[0],
    onPassportsSaved: vi.fn(),
    saveCardPassport: vi.fn(async (_i: number, p: Passport) => {
        state.cardPassports = [...state.cardPassports.filter((x) => x.id !== p.id), p];
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
vi.stubGlobal('toastr', { info: vi.fn(), warning: vi.fn(), success: vi.fn() });

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

    it('writes a passport for a new character, links it to DES and draws the portrait once', async () => {
        const des = new DesIntegration(markers());
        await des.start();
        expect(state.settings.des.portraitPolicy).toBe('missing');
        reply(tracker([{ name: 'Mira', details: { appearance: 'wet blue cloak' } }]));
        await inner(des).handleTracker(true);
        expect(state.generated).toEqual(['Mira']);
        expect(state.cardPassports.map((p) => p.name)).toEqual(['Mira']);
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
