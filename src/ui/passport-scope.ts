// Editing a passport where it lives (v0.10): with a chat open, the editor offers "Card / This chat";
// the card scope saves to the card (or the persona settings), the chat scope saves a chat override.
import { t } from '../core/i18n';
import type { Passport } from '../domain';
import { chatOpen, resolvedAfterSave, savePassportIn } from '../features/characters/passport-store';
import type { LocatedPassport } from '../features/characters/passport-store';
import { editPassport, editPassportIn } from './passport-editor';
import type { PassportEditorOptions } from './passport-editor';

/** Edits and saves; resolves with the passport as the chat now sees it, or null when cancelled. */
export async function editLocatedPassport(
    name: string,
    located: LocatedPassport,
    options: PassportEditorOptions = {},
): Promise<Passport | null> {
    if (!chatOpen()) {
        if (!located.base) return null;
        const edited = await editPassport(name, located.base, options);
        if (!edited) return null;
        await savePassportIn(located, edited, 'card');
        toastr.success(t('naist.passport.saved', { name: edited.name || name }));
        return resolvedAfterSave(located, edited, 'card');
    }
    const scoped = await editPassportIn(
        name,
        {
            card: located.base,
            chat: located.resolved,
            initial: located.overridden ? 'chat' : 'card',
            persona: located.owner.type === 'persona',
        },
        options,
    );
    if (!scoped) return null;
    await savePassportIn(located, scoped.passport, scoped.scope);
    const label = scoped.passport.name || name;
    toastr.success(t(scoped.scope === 'chat' ? 'naist.passport.savedChat' : 'naist.passport.saved', { name: label }));
    return resolvedAfterSave(located, scoped.passport, scoped.scope);
}
