// Passports of a card (v0.8): every character the card describes, its world, locations, scenario
// and objects. Add, edit, remove, generate them from the card's description, and draw the
// Expressions sprites of a character. Changes are saved to the card together. Since v0.10 a passport
// of a card in the open chat can be edited for this chat only (saved at once as a chat override).
// Since v0.14, with the card in the open chat: a passport can be left out of this chat (shown greyed with
// "Back to this chat"), and the passports of the chat itself are listed below with "Move to the card";
// these actions are saved at once.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import {
    defaultPassport,
    isPassportEmpty,
    PASSPORT_KINDS,
    passportTags,
    primaryPassport,
    resolveChatPassport,
} from '../domain';
import type { Passport, PassportKind } from '../domain';
import { generateCardPassports } from '../features/characters/passport-generator';
import {
    cardPassports,
    chatCardIndexes,
    chatOpen,
    chatOwnPassports,
    chatPassportData,
    clearChatOverride,
    hasChatOverride,
    loadCharacter,
    locatePassport,
    moveChatPassportToCard,
    passportExcluded,
    saveCardPassports,
    saveChatPassport,
    setPassportExcluded,
} from '../features/characters/passport-store';
import { escapeHtml } from './components/dom';
import { editPassport, editPassportIn } from './passport-editor';
import { editLocatedPassport } from './passport-scope';

export interface PassportManagerActions {
    /** Opens the sprite generator for a character passport of the card. */
    emotions(characterIndex: number, passportId: string): void;
}

const KIND_ICON: Record<PassportKind, string> = {
    character: 'fa-user',
    world: 'fa-earth-europe',
    location: 'fa-map-location-dot',
    scenario: 'fa-scroll',
    object: 'fa-cube',
};

/** How generated passports join the list: replace everything, or add the ones not there yet. */
async function chooseMerge(): Promise<'replace' | 'add' | null> {
    const c = ctx();
    const result = await c.callGenericPopup(t('naist.passports.mergeQuestion'), c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.passports.mergeAdd'),
        cancelButton: t('naist.inspector.cancel'),
        customButtons: [{ text: t('naist.passports.mergeReplace'), result: 3, classes: [] }],
    });
    if (result === c.POPUP_RESULT.AFFIRMATIVE) return 'add';
    if (result === 3) return 'replace';
    return null;
}

function sameName(a: Passport, b: Passport, cardName: string): boolean {
    return a.kind === b.kind && (a.name || cardName).trim().toLowerCase() === (b.name || cardName).trim().toLowerCase();
}

export async function openPassportManager(index: number, actions: PassportManagerActions): Promise<void> {
    const c = ctx();
    const character = await loadCharacter(index);
    if (!character) return;
    let list: Passport[] = structuredClone(cardPassports(character));
    /** Ids saved in the card: only those can have a chat override. */
    const savedIds = new Set(list.map((p) => p.id));
    const inChat = () => chatOpen() && chatCardIndexes().includes(index);
    let dirty = false;
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-passports';

    /** "Leave out of this chat" for a saved passport, or "Back to this chat" when it is left out (v0.14). */
    const exclusionButton = (excluded: boolean) =>
        excluded
            ? `<div class="menu_button naist-passport-include"><i class="fa-solid fa-rotate-left"></i> ${escapeHtml(t('naist.passports.include'))}</div>`
            : `<div class="menu_button fa-solid fa-eye-slash naist-passport-exclude" title="${escapeHtml(t('naist.passports.exclude'))}"></div>`;

    const summaryLine = (p: Passport) =>
        `<div class="naist-muted naist-passport-summary">${escapeHtml(passportTags(p, { allowNsfw: false }) || t('naist.passports.empty'))}</div>`;

    /** Passports of the chat itself (v0.14): not in the card, with "Move to the card". */
    const chatRows = (chat: ReturnType<typeof chatPassportData>) =>
        chatOwnPassports(chat, { includeExcluded: true })
            .map((p) => {
                const excluded = passportExcluded(p.id, undefined, chat);
                return `<div class="naist-passport-row${excluded ? ' naist-passport-excluded' : ''}" data-chat-id="${escapeHtml(p.id)}">
                    <i class="fa-solid ${KIND_ICON[p.kind]} naist-passport-kind-icon" title="${escapeHtml(t(`naist.passport.kind.${p.kind}`))}"></i>
                    <div class="naist-grow">
                        <div><b>${escapeHtml(p.name || t(`naist.passport.kind.${p.kind}`))}</b> <span class="naist-muted">${escapeHtml(t(`naist.passport.kind.${p.kind}`))}${p.aliases.length ? ` · ${escapeHtml(p.aliases.join(', '))}` : ''}${excluded ? ` · ${escapeHtml(t('naist.passports.excluded'))}` : ''}</span></div>
                        ${summaryLine(p)}
                    </div>
                    ${exclusionButton(excluded)}
                    <div class="menu_button fa-solid fa-file-import naist-passport-move" title="${escapeHtml(t('naist.passport.moveToCard'))}"></div>
                    <div class="menu_button fa-solid fa-pen-to-square naist-passport-edit-chat" title="${escapeHtml(t('naist.passports.edit'))}"></div>
                    <div class="menu_button fa-solid fa-trash-can naist-passport-remove-chat" title="${escapeHtml(t('naist.passports.removeChat'))}"></div>
                </div>`;
            })
            .join('');

    const render = () => {
        const main = primaryPassport(list, character.name);
        const chat = inChat() ? chatPassportData() : null;
        const rows = list
            .map((p, i) => {
                const label = p.name || character.name;
                const changed = chat !== null && hasChatOverride(p.id, character.avatar, chat);
                // Only a passport saved in the card can be left out of the chat (v0.14).
                const saved = chat !== null && savedIds.has(p.id);
                const excluded = saved && passportExcluded(p.id, character.avatar, chat);
                return `<div class="naist-passport-row${excluded ? ' naist-passport-excluded' : ''}" data-index="${i}">
                    <i class="fa-solid ${KIND_ICON[p.kind]} naist-passport-kind-icon" title="${escapeHtml(t(`naist.passport.kind.${p.kind}`))}"></i>
                    <div class="naist-grow">
                        <div><b>${escapeHtml(label)}</b> <span class="naist-muted">${escapeHtml(t(`naist.passport.kind.${p.kind}`))}${p === main ? ` · ${escapeHtml(t('naist.passports.main'))}` : ''}${p.aliases.length ? ` · ${escapeHtml(p.aliases.join(', '))}` : ''}${changed ? ` · <i class="fa-solid fa-comments"></i> ${escapeHtml(t('naist.passports.chatOverride'))}` : ''}${excluded ? ` · ${escapeHtml(t('naist.passports.excluded'))}` : ''}</span></div>
                        ${summaryLine(p)}
                    </div>
                    ${saved ? exclusionButton(excluded) : ''}
                    ${p.kind === 'character' && !excluded ? `<div class="menu_button fa-solid fa-masks-theater naist-passport-emotions" title="${escapeHtml(t('naist.passports.emotions'))}"></div>` : ''}
                    <div class="menu_button fa-solid fa-pen-to-square naist-passport-edit" title="${escapeHtml(t('naist.passports.edit'))}"></div>
                    <div class="menu_button fa-solid fa-trash-can naist-passport-remove" title="${escapeHtml(t('naist.passport.remove'))}"></div>
                </div>`;
            })
            .join('');
        const own = chat ? chatRows(chat) : '';
        root.innerHTML = `
            <h3>${escapeHtml(t('naist.passports.title', { name: character.name }))}</h3>
            <div class="naist-hint">${escapeHtml(t('naist.passports.hint'))}</div>
            <div class="naist-row">
                <div class="menu_button naist-passports-generate"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml(t('naist.passports.generate'))}</div>
                <span class="naist-muted">${escapeHtml(t('naist.passports.generateHint'))}</span>
            </div>
            <div class="naist-passport-list">${rows || `<div class="naist-muted">${escapeHtml(t('naist.passports.none'))}</div>`}</div>
            <div class="naist-row">
                <select class="text_pole naist-passports-kind">${PASSPORT_KINDS.map((k) => `<option value="${k}">${escapeHtml(t(`naist.passport.kind.${k}`))}</option>`).join('')}</select>
                <div class="menu_button naist-passports-add"><i class="fa-solid fa-plus"></i> ${escapeHtml(t('naist.passports.add'))}</div>
            </div>
            ${
                own
                    ? `<div class="naist-section naist-passports-chat">
                <b>${escapeHtml(t('naist.passports.chatTitle'))}</b>
                <div class="naist-hint">${escapeHtml(t('naist.passports.chatHint'))}</div>
                <div class="naist-passport-list">${own}</div>
            </div>`
                    : ''
            }`;
        localize(root);
    };

    /** Leaves a passport out of this chat or brings it back; saved at once (v0.14). */
    const setExcluded = async (id: string, owner: string | undefined, label: string, excluded: boolean) => {
        await setPassportExcluded(id, excluded, owner);
        toastr.info(t(excluded ? 'naist.passports.excludedDone' : 'naist.passports.includedDone', { name: label }));
        render();
    };

    /** A passport of the chat itself: edited where it lives, moved into this card, or removed (v0.14). */
    const chatAction = async (action: 'edit' | 'move' | 'remove' | 'exclude' | 'include', id: string) => {
        const own = chatPassportData().extra.find((p) => p.id === id);
        if (!own) return;
        const label = own.name || character.name;
        if (action === 'exclude' || action === 'include') {
            await setExcluded(id, undefined, label, action === 'exclude');
            return;
        }
        if (action === 'remove') {
            await clearChatOverride(id);
            render();
            return;
        }
        if (action === 'move') {
            if (!(await moveChatPassportToCard(id, index))) return;
            toastr.success(t('naist.passport.moved', { name: label, card: character.name }));
        } else {
            const located = locatePassport(id);
            if (!located) return;
            await editLocatedPassport(character.name, located, { identity: true }, { moveTo: index });
        }
        // Moved (here or from the editor): the card's list shows it, a later "Save" keeps it.
        const moved = cardPassports(await loadCharacter(index)).find((p) => p.id === id);
        if (moved && !list.some((p) => p.id === id)) {
            list.push(moved);
            savedIds.add(id);
        }
        render();
    };

    const edit = async (i: number, fresh = false) => {
        const current = list[i];
        if (!current) return;
        if (!fresh && savedIds.has(current.id) && inChat()) {
            const chat = chatPassportData();
            const scoped = await editPassportIn(
                character.name,
                {
                    card: current,
                    chat: resolveChatPassport(current, character.avatar, chat),
                    initial: hasChatOverride(current.id, character.avatar, chat) ? 'chat' : 'card',
                },
                { identity: true },
            );
            if (!scoped) return;
            if (scoped.scope === 'chat') {
                // For this chat only: saved now, the card list stays as it is.
                await saveChatPassport(current, scoped.passport, character.avatar);
                toastr.success(t('naist.passport.savedChat', { name: scoped.passport.name || character.name }));
            } else {
                list[i] = scoped.passport;
                dirty = true;
            }
            render();
            return;
        }
        const edited = await editPassport(character.name, current, { identity: true });
        if (!edited) {
            // A new passport closed without saving is not kept.
            if (fresh) {
                list.splice(i, 1);
                render();
            }
            return;
        }
        list[i] = edited;
        dirty = true;
        render();
    };

    root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const row = target.closest<HTMLElement>('.naist-passport-row');
        const chatId = row?.dataset.chatId;
        if (chatId) {
            const action = target.closest('.naist-passport-edit-chat')
                ? 'edit'
                : target.closest('.naist-passport-move')
                  ? 'move'
                  : target.closest('.naist-passport-remove-chat')
                    ? 'remove'
                    : target.closest('.naist-passport-exclude')
                      ? 'exclude'
                      : target.closest('.naist-passport-include')
                        ? 'include'
                        : null;
            if (action) void chatAction(action, chatId).catch(reportGenerationError);
            return;
        }
        const i = Number(row?.dataset.index);
        const exclusion = target.closest('.naist-passport-exclude')
            ? true
            : target.closest('.naist-passport-include')
              ? false
              : null;
        if (exclusion !== null) {
            const passport = list[i];
            if (passport) {
                void setExcluded(passport.id, character.avatar, passport.name || character.name, exclusion).catch(
                    reportGenerationError,
                );
            }
            return;
        }
        if (target.closest('.naist-passport-edit')) void edit(i);
        else if (target.closest('.naist-passport-remove')) {
            list.splice(i, 1);
            dirty = true;
            render();
        } else if (target.closest('.naist-passport-emotions')) {
            const passport = list[i];
            if (!passport) return;
            // The sprite generator reads the card: save the list first.
            void (dirty ? saveCardPassports(index, list) : Promise.resolve())
                .then(() => {
                    dirty = false;
                    actions.emotions(index, passport.id);
                })
                .catch(reportGenerationError);
        } else if (target.closest('.naist-passports-add')) {
            const kind = (root.querySelector<HTMLSelectElement>('.naist-passports-kind')?.value ??
                'character') as PassportKind;
            const fresh = defaultPassport(
                kind,
                kind === 'character' && !list.some((p) => p.kind === 'character')
                    ? ''
                    : t(`naist.passport.kind.${kind}`),
            );
            list.push(fresh);
            dirty = true;
            void edit(list.length - 1, true);
        } else if (target.closest('.naist-passports-generate')) {
            const button = target.closest<HTMLElement>('.naist-passports-generate');
            if (!button || button.classList.contains('disabled')) return;
            button.classList.add('disabled');
            button.querySelector('i')?.classList.add('fa-spin');
            void generateCardPassports(index)
                .then(async (generated) => {
                    const mode = list.some((p) => !isPassportEmpty(p)) ? await chooseMerge() : 'replace';
                    if (!mode) return;
                    if (mode === 'replace') list = generated;
                    else list.push(...generated.filter((g) => !list.some((p) => sameName(p, g, character.name))));
                    dirty = true;
                    render();
                    toastr.success(t('naist.passports.generated', { count: generated.length }));
                })
                .catch(reportGenerationError)
                .finally(() => {
                    root.querySelector('.naist-passports-generate')?.classList.remove('disabled');
                    root.querySelector('.naist-passports-generate i')?.classList.remove('fa-spin');
                });
        }
    });

    render();
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.passport.save'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
        allowVerticalScrolling: true,
    });
    if (result !== c.POPUP_RESULT.AFFIRMATIVE || !dirty) return;
    await saveCardPassports(index, list);
    toastr.success(t('naist.passport.saved', { name: character.name }));
}
