// @vitest-environment happy-dom
// The passports of a card in the open chat (v0.14): a passport can be left out of this chat (greyed, with
// "Back to this chat"), the passports of the chat itself are listed with "Move to the card"; both are
// saved at once, the card list of the dialog follows.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    characters: [] as Record<string, unknown>[],
    meta: {} as Record<string, unknown>,
    chatId: 'chat-1' as string | undefined,
    script: (async () => 0) as (root: HTMLElement) => Promise<number>,
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings, saveSettings: vi.fn() }));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key, localize: vi.fn() }));
vi.mock('../../src/core/notify', () => ({ reportGenerationError: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: '0',
        groupId: null,
        groups: [],
        name1: 'Player',
        chat: [],
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => undefined),
        getCurrentChatId: () => state.chatId,
        unshallowCharacter: vi.fn(),
        writeExtensionField: vi.fn(async (index: number, key: string, value: unknown) => {
            const ch = state.characters[index] as { data: { extensions: Record<string, unknown> } };
            ch.data.extensions[key] = structuredClone(value);
        }),
        POPUP_TYPE: { CONFIRM: 2 },
        POPUP_RESULT: { AFFIRMATIVE: 1, CANCELLED: 0 },
        callGenericPopup: async (root: HTMLElement) => state.script(root),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));
vi.stubGlobal('toastr', { info: vi.fn(), success: vi.fn(), warning: vi.fn() });

const { openPassportManager } = await import('../../src/ui/passport-manager');
const store = await import('../../src/features/characters/passport-store');

function person(id: string, name: string): Passport {
    const p = defaultPassport('character', name, id);
    p.slots.hair = `${name} hair`;
    return p;
}

const stored = () =>
    (state.characters[0] as { data: { extensions: { nai_studio: { passports: Passport[] } } } }).data.extensions
        .nai_studio.passports;

const row = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)!;

beforeEach(() => {
    state.settings = defaultSettings();
    state.characters = [
        {
            name: 'Lyra',
            avatar: 'Lyra.png',
            data: { extensions: { nai_studio: { passports: [person('p1', ''), person('p2', 'Ophelia')] } } },
        },
    ];
    state.meta = {};
    state.chatId = 'chat-1';
});

describe('passport manager in the open chat (v0.14)', () => {
    it('leaves a passport out of this chat, greyed with "Back to this chat", and brings it back', async () => {
        await store.setPassportExcluded('p2', true, 'Lyra.png');
        state.script = async (root) => {
            const excluded = row(root, '[data-index="1"]');
            expect(excluded.classList.contains('naist-passport-excluded')).toBe(true);
            expect(excluded.textContent).toContain('naist.passports.excluded');
            expect(excluded.querySelector('.naist-passport-emotions')).toBeNull();
            expect(excluded.querySelector('.naist-passport-include')?.textContent).toContain('naist.passports.include');
            excluded.querySelector<HTMLElement>('.naist-passport-include')!.click();
            await vi.waitFor(() => expect(store.passportExcluded('p2', 'Lyra.png')).toBe(false));
            await vi.waitFor(() =>
                expect(row(root, '[data-index="1"]').classList.contains('naist-passport-excluded')).toBe(false),
            );
            row(root, '[data-index="0"] .naist-passport-exclude').click();
            await vi.waitFor(() => expect(store.passportExcluded('p1', 'Lyra.png')).toBe(true));
            return 0;
        };
        await openPassportManager(0, { emotions: vi.fn() });
        // The card itself is not touched.
        expect(stored().map((p) => p.id)).toEqual(['p1', 'p2']);
    });

    it('lists the passports of the chat itself and moves one into the card', async () => {
        await store.saveChatPassport(null, { ...person('npc1', 'Bran'), origin: 'auto-des' });
        state.script = async (root) => {
            const own = row(root, '[data-chat-id="npc1"]');
            expect(root.querySelector('.naist-passports-chat')?.textContent).toContain('naist.passports.chatTitle');
            own.querySelector<HTMLElement>('.naist-passport-move')!.click();
            await vi.waitFor(() => expect(root.querySelector('[data-chat-id="npc1"]')).toBeNull());
            // Now in the card list of the dialog.
            expect(root.querySelectorAll('.naist-passport-row[data-index]')).toHaveLength(3);
            return 0;
        };
        await openPassportManager(0, { emotions: vi.fn() });
        expect(stored().find((p) => p.id === 'npc1')).toMatchObject({ name: 'Bran', origin: 'auto-des' });
        expect(store.chatPassportData().extra).toEqual([]);
    });

    it('shows neither outside the chat of the card', async () => {
        await store.saveChatPassport(null, person('npc1', 'Bran'));
        state.chatId = undefined;
        state.script = async (root) => {
            expect(root.querySelector('.naist-passport-exclude')).toBeNull();
            expect(root.querySelector('.naist-passports-chat')).toBeNull();
            return 0;
        };
        await openPassportManager(0, { emotions: vi.fn() });
    });
});
