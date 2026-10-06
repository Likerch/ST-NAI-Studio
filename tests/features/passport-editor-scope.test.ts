// @vitest-environment happy-dom
// The passport editor's scope switch (v0.10): "Card / This chat" shows the card or the chat's view,
// keeps an unsaved draft per scope, "back to the card" resets the chat view, and the result says
// where to save. Without scopes the editor works as before.
import { describe, expect, it, vi } from 'vitest';
import { defaultPassport } from '../../src/domain';
import type { Passport } from '../../src/domain';

const state = vi.hoisted(() => ({
    script: (() => 1) as (root: HTMLElement, options: { customButtons?: { text: string; result: number }[] }) => number,
}));

vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key, localize: vi.fn() }));
vi.mock('../../src/core/notify', () => ({ reportGenerationError: vi.fn() }));
vi.mock('../../src/core/settings', () => ({ settings: () => ({ generation: { model: 'nai-diffusion-4-5-full' } }) }));
vi.mock('../../src/ui/prompt-assist', () => ({ attachPromptAssist: vi.fn() }));
vi.mock('../../src/ui/pose-helpers', () => ({ poseSelectOptions: () => '<option value=""></option>' }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        POPUP_TYPE: { CONFIRM: 2 },
        POPUP_RESULT: { AFFIRMATIVE: 1, CANCELLED: 0 },
        callGenericPopup: async (root: HTMLElement, _type: number, _text: string, options: object) =>
            state.script(root, options),
    }),
}));

const { editPassport, editPassportIn } = await import('../../src/ui/passport-editor');

function lyra(hair: string): Passport {
    const p = defaultPassport('character', 'Lyra', 'p1');
    p.slots.hair = hair;
    p.outfits = [{ name: 'Armor', tags: 'armor' }];
    return p;
}

const hairOf = (root: HTMLElement) => root.querySelector<HTMLTextAreaElement>('[data-slot="hair"]')!;
const radio = (root: HTMLElement, value: string) =>
    root.querySelector<HTMLInputElement>(`.naist-passport-scope input[value="${value}"]`)!;

function choose(root: HTMLElement, value: 'card' | 'chat'): void {
    const input = radio(root, value);
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('passport editor scopes', () => {
    it('edits a plain passport without a scope bar', async () => {
        state.script = (root) => {
            expect(root.querySelector('.naist-passport-scope')).toBeNull();
            hairOf(root).value = 'red hair';
            return 1;
        };
        const edited = await editPassport('Lyra', lyra('silver hair'));
        expect(edited?.slots.hair).toBe('red hair');
        state.script = () => 0;
        expect(await editPassport('Lyra', lyra('x'))).toBeNull();
    });

    it('keeps the tracker wordings of outfits (v0.12.1) it does not show', async () => {
        state.script = (root) => {
            // Remove the first outfit, rename the second, add one: the wordings stay with their outfit.
            root.querySelector<HTMLElement>('.naist-outfit-remove')!.click();
            root.querySelector<HTMLInputElement>('.naist-outfit-name')!.value = 'Plate armor';
            root.querySelector<HTMLElement>('.naist-outfit-add')!.click();
            return 1;
        };
        const p = lyra('silver hair');
        p.outfits = [
            { name: 'Robe', tags: 'robe' },
            { name: 'Armor', tags: 'armor', looks: ['стальные латы'] },
        ];
        const edited = await editPassport('Lyra', p);
        expect(edited?.outfits).toEqual([
            { name: 'Plate armor', tags: 'armor', looks: ['стальные латы'] },
            { name: 'naist.passport.outfitDefault', tags: '' },
        ]);
    });

    it('switches between the card and the chat view, each with its own draft', async () => {
        state.script = (root) => {
            // The chat already changes the passport: it opens on the chat view.
            expect(radio(root, 'chat').checked).toBe(true);
            expect(hairOf(root).value).toBe('braided hair');
            expect(root.querySelector('.naist-passport-scope-reset')!.classList.contains('naist-hidden')).toBe(false);
            expect(root.querySelector('.naist-passport-scope-hint')!.textContent).toBe('naist.passport.scopeChatHint');
            hairOf(root).value = 'wet braided hair';
            choose(root, 'card');
            expect(hairOf(root).value).toBe('silver hair');
            expect(root.querySelector('.naist-passport-scope-reset')!.classList.contains('naist-hidden')).toBe(true);
            hairOf(root).value = 'short silver hair';
            choose(root, 'chat');
            expect(hairOf(root).value).toBe('wet braided hair');
            const select = root.querySelector<HTMLSelectElement>('.naist-active-outfit')!;
            select.value = 'Armor';
            return 1;
        };
        const result = await editPassportIn('Lyra', {
            card: lyra('silver hair'),
            chat: lyra('braided hair'),
            initial: 'chat',
        });
        expect(result?.scope).toBe('chat');
        expect(result?.passport.slots.hair).toBe('wet braided hair');
        expect(result?.passport.activeOutfit).toBe('Armor');
    });

    it('goes back to the card values for the chat', async () => {
        state.script = (root) => {
            root.querySelector<HTMLElement>('.naist-passport-scope-reset')!.click();
            expect(hairOf(root).value).toBe('silver hair');
            return 1;
        };
        const result = await editPassportIn('Lyra', {
            card: lyra('silver hair'),
            chat: lyra('braided hair'),
            initial: 'chat',
            persona: true,
        });
        expect(result).toMatchObject({ scope: 'chat', passport: { slots: { hair: 'silver hair' } } });
    });

    it('saves the card view when it is chosen', async () => {
        state.script = (root) => {
            expect(radio(root, 'card').checked).toBe(true);
            hairOf(root).value = 'grey hair';
            return 1;
        };
        const result = await editPassportIn('Lyra', {
            card: lyra('silver hair'),
            chat: lyra('silver hair'),
            initial: 'card',
        });
        expect(result).toMatchObject({ scope: 'card', passport: { slots: { hair: 'grey hair' } } });
    });

    it('keeps a passport of the chat itself in the chat scope', async () => {
        state.script = (root) => {
            expect(radio(root, 'card').disabled).toBe(true);
            expect(root.querySelector('.naist-passport-scope-hint')!.textContent).toBe('naist.passport.scopeChatOnly');
            choose(root, 'card');
            expect(radio(root, 'chat').checked).toBe(true);
            return 1;
        };
        const result = await editPassportIn('Mira', { card: null, chat: lyra('red hair'), initial: 'card' });
        expect(result?.scope).toBe('chat');
    });

    it('offers "Move to the card" for a passport of the chat itself (v0.14)', async () => {
        state.script = (root, options) => {
            expect(options.customButtons).toEqual([{ text: 'naist.passport.moveToCard', result: 4, classes: [] }]);
            expect(root.querySelector('.naist-passport-scope-hint')!.textContent).toBe(
                'naist.passport.scopeChatOnlyMove',
            );
            hairOf(root).value = 'auburn hair';
            return 4;
        };
        const moved = await editPassportIn('Mira', {
            card: null,
            chat: lyra('red hair'),
            initial: 'chat',
            movable: true,
        });
        expect(moved).toMatchObject({
            scope: 'chat',
            move: true,
            passport: { id: 'p1', slots: { hair: 'auburn hair' } },
        });
        // Saved as usual: no move.
        state.script = () => 1;
        expect(
            await editPassportIn('Mira', { card: null, chat: lyra('red hair'), initial: 'chat', movable: true }),
        ).not.toHaveProperty('move');
        // A card passport, or a chat passport with no card to go to: no such button.
        state.script = (_root, options) => {
            expect(options.customButtons).toBeUndefined();
            return 4;
        };
        expect(
            await editPassportIn('Lyra', { card: lyra('a'), chat: lyra('b'), initial: 'card', movable: true }),
        ).toBeNull();
        expect(await editPassportIn('Mira', { card: null, chat: lyra('b'), initial: 'chat' })).toBeNull();
    });
});
