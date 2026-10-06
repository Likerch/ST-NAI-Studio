// Editing a passport where it lives (v0.10): with a chat open, the editor offers "Card / This chat";
// the card scope saves to the card (or the persona settings), the chat scope saves a chat override.
// Since v0.14 a passport of the chat itself can be moved into the card of the chat (keeping its id).
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import type { Passport } from '../domain';
import {
    chatOpen,
    defaultCardForChat,
    moveChatPassportToCard,
    resolvedAfterSave,
    savePassportIn,
} from '../features/characters/passport-store';
import type { LocatedPassport } from '../features/characters/passport-store';
import { editPassport, editPassportIn } from './passport-editor';
import type { PassportEditorOptions } from './passport-editor';

/**
 * Edits and saves; resolves with the passport as the chat now sees it, or null when cancelled. `moveTo`:
 * the card a passport of the chat itself moves into (the chat's default card when absent).
 */
export async function editLocatedPassport(
    name: string,
    located: LocatedPassport,
    options: PassportEditorOptions = {},
    place: { moveTo?: number } = {},
): Promise<Passport | null> {
    if (!chatOpen()) {
        if (!located.base) return null;
        const edited = await editPassport(name, located.base, options);
        if (!edited) return null;
        await savePassportIn(located, edited, 'card');
        toastr.success(t('naist.passport.saved', { name: edited.name || name }));
        return resolvedAfterSave(located, edited, 'card');
    }
    // A passport of the chat itself may move into the card of the chat (the speaker's in a group).
    const moveTo = located.owner.type === 'chat' ? (place.moveTo ?? defaultCardForChat()) : null;
    const scoped = await editPassportIn(
        name,
        {
            card: located.base,
            chat: located.resolved,
            initial: located.overridden ? 'chat' : 'card',
            persona: located.owner.type === 'persona',
            movable: moveTo !== null,
        },
        options,
    );
    if (!scoped) return null;
    const label = scoped.passport.name || name;
    if (scoped.move && moveTo !== null) {
        await moveChatPassportToCard(located.resolved.id, moveTo, scoped.passport);
        toastr.success(t('naist.passport.moved', { name: label, card: ctx().characters[moveTo]?.name ?? '' }));
        return { ...scoped.passport, id: located.resolved.id };
    }
    await savePassportIn(located, scoped.passport, scoped.scope);
    toastr.success(t(scoped.scope === 'chat' ? 'naist.passport.savedChat' : 'naist.passport.saved', { name: label }));
    return resolvedAfterSave(located, scoped.passport, scoped.scope);
}
