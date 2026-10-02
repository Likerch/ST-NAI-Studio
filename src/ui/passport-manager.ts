// Passports of a card (v0.8): every character the card describes, its world, locations, scenario
// and objects. Add, edit, remove, generate them from the card's description, and draw the
// Expressions sprites of a character. Changes are saved to the card together.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { defaultPassport, isPassportEmpty, PASSPORT_KINDS, passportTags, primaryPassport } from '../domain';
import type { Passport, PassportKind } from '../domain';
import { generateCardPassports } from '../features/characters/passport-generator';
import { cardPassports, loadCharacter, saveCardPassports } from '../features/characters/passport-store';
import { escapeHtml } from './components/dom';
import { editPassport } from './passport-editor';

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
    let dirty = false;
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-passports';

    const render = () => {
        const main = primaryPassport(list, character.name);
        const rows = list
            .map((p, i) => {
                const label = p.name || character.name;
                const summary = passportTags(p, { allowNsfw: false });
                return `<div class="naist-passport-row" data-index="${i}">
                    <i class="fa-solid ${KIND_ICON[p.kind]} naist-passport-kind-icon" title="${escapeHtml(t(`naist.passport.kind.${p.kind}`))}"></i>
                    <div class="naist-grow">
                        <div><b>${escapeHtml(label)}</b> <span class="naist-muted">${escapeHtml(t(`naist.passport.kind.${p.kind}`))}${p === main ? ` · ${escapeHtml(t('naist.passports.main'))}` : ''}${p.aliases.length ? ` · ${escapeHtml(p.aliases.join(', '))}` : ''}</span></div>
                        <div class="naist-muted naist-passport-summary">${escapeHtml(summary || t('naist.passports.empty'))}</div>
                    </div>
                    ${p.kind === 'character' ? `<div class="menu_button fa-solid fa-masks-theater naist-passport-emotions" title="${escapeHtml(t('naist.passports.emotions'))}"></div>` : ''}
                    <div class="menu_button fa-solid fa-pen-to-square naist-passport-edit" title="${escapeHtml(t('naist.passports.edit'))}"></div>
                    <div class="menu_button fa-solid fa-trash-can naist-passport-remove" title="${escapeHtml(t('naist.passport.remove'))}"></div>
                </div>`;
            })
            .join('');
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
            </div>`;
        localize(root);
    };

    const edit = async (i: number, fresh = false) => {
        const current = list[i];
        if (!current) return;
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
        const i = Number(row?.dataset.index);
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
