// Appearance passport editor (TZ Phase 4): slots, NSFW layer, outfits, states, personal UC,
// default pose and canvas position. Character passports go to the card, persona ones to settings.
// Since v0.8: name, aliases and kind (world, location, scenario and object passports hold tags
// instead of appearance), and filling the form from the description through the language backend.
// Since v0.10 a scope switch "Card / This chat": the chat scope shows the passport as this chat sees
// it and is saved as a chat override (the card stays as it is); "back to the card" drops the override.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import { defaultPassport, PASSPORT_KINDS, PASSPORT_SLOTS, STATE_PRESETS } from '../domain';
import type { Outfit, Passport, PassportKind, PassportState } from '../domain';
import { escapeHtml } from './components/dom';
import { attachPromptAssist } from './prompt-assist';
import { poseSelectOptions } from './pose-helpers';

function stateLabel(state: PassportState): string {
    return state.id in STATE_PRESETS ? t(`naist.state.${state.id}`) : state.id;
}

export interface PassportEditorOptions {
    /** Name, aliases and kind can be edited (passports of a card; a persona has one character). */
    identity?: boolean;
    /** Fills the form from the description (persona passports). */
    generate?: () => Promise<Passport>;
}

export type PassportScope = 'card' | 'chat';

/** The two views of a passport the scope switch moves between. */
export interface PassportScopes {
    /** As stored in the card (or the persona settings); null for a passport of the chat itself. */
    card: Passport | null;
    /** As the current chat sees it (the card with the chat's override, or the chat's own passport). */
    chat: Passport;
    /** Scope shown first (the chat when it already changes the passport). */
    initial: PassportScope;
    /** A persona passport: the card scope is labelled "Persona". */
    persona?: boolean;
}

export interface ScopedEdit {
    passport: Passport;
    scope: PassportScope;
}

/** Opens the editor; resolves with the edited passport or null when cancelled. */
export async function editPassport(
    name: string,
    initial: Passport | null,
    options: PassportEditorOptions = {},
): Promise<Passport | null> {
    const drafts = { card: structuredClone(initial ?? defaultPassport()), chat: null };
    const result = await openEditor(name, drafts, 'card', null, options);
    return result?.passport ?? null;
}

/** The editor with the scope switch; resolves with the edited passport and where to save it. */
export async function editPassportIn(
    name: string,
    scopes: PassportScopes,
    options: PassportEditorOptions = {},
): Promise<ScopedEdit | null> {
    const drafts = {
        card: scopes.card ? structuredClone(scopes.card) : null,
        chat: structuredClone(scopes.chat),
    };
    return await openEditor(name, drafts, scopes.card ? scopes.initial : 'chat', scopes, options);
}

interface Drafts {
    card: Passport | null;
    chat: Passport | null;
}

let editorCount = 0;

async function openEditor(
    name: string,
    drafts: Drafts,
    initialScope: PassportScope,
    scopes: PassportScopes | null,
    options: PassportEditorOptions,
): Promise<ScopedEdit | null> {
    const c = ctx();
    let scope: PassportScope = initialScope;
    let passport: Passport = (drafts[scope] ?? drafts.card ?? drafts.chat)!;
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-passport';
    const radioName = `naist-passport-scope-${++editorCount}`;

    const renderOutfits = () => `
        ${passport.outfits
            .map(
                (o, i) => `<div class="naist-row naist-outfit" data-index="${i}">
                    <input class="text_pole naist-outfit-name" value="${escapeHtml(o.name)}" placeholder="${escapeHtml(t('naist.passport.outfitName'))}">
                    <input class="text_pole naist-grow naist-outfit-tags" value="${escapeHtml(o.tags)}" placeholder="${escapeHtml(t('naist.passport.outfitTags'))}">
                    <div class="menu_button fa-solid fa-trash-can naist-outfit-remove" title="${escapeHtml(t('naist.passport.remove'))}"></div>
                </div>`,
            )
            .join('')}
        <div class="menu_button naist-outfit-add">${escapeHtml(t('naist.passport.addOutfit'))}</div>`;

    const renderStates = () =>
        passport.states
            .map(
                (s, i) => `<div class="naist-row naist-state" data-index="${i}">
                    <label class="checkbox_label"><input type="checkbox" class="naist-state-on"${s.enabled ? ' checked' : ''}><span>${escapeHtml(stateLabel(s))}</span></label>
                    <input class="text_pole naist-grow naist-state-tags" value="${escapeHtml(s.tags)}">
                </div>`,
            )
            .join('') +
        `<div class="naist-row"><input class="text_pole naist-grow naist-state-new" placeholder="${escapeHtml(t('naist.passport.newState'))}"><div class="menu_button naist-state-add">${escapeHtml(t('naist.passport.addState'))}</div></div>`;

    const scopeBar = scopes
        ? `<div class="naist-row naist-passport-scope">
            <span>${escapeHtml(t('naist.passport.scope'))}</span>
            <label class="checkbox_label"><input type="radio" name="${radioName}" value="card"${drafts.card ? '' : ' disabled'}><span>${escapeHtml(t(scopes.persona ? 'naist.passport.scopePersona' : 'naist.passport.scopeCard'))}</span></label>
            <label class="checkbox_label"><input type="radio" name="${radioName}" value="chat"><span>${escapeHtml(t('naist.passport.scopeChat'))}</span></label>
            <div class="menu_button naist-passport-scope-reset"><i class="fa-solid fa-rotate-left"></i> ${escapeHtml(t('naist.passport.scopeReset'))}</div>
        </div>
        <div class="naist-hint naist-passport-scope-hint"></div>`
        : '';

    const formHtml = () => {
        const identity = options.identity
            ? `<div class="naist-grid2">
                <div><label>${escapeHtml(t('naist.passport.name'))}</label>
                    <input class="text_pole naist-passport-name" value="${escapeHtml(passport.name)}" placeholder="${escapeHtml(name)}"></div>
                <div><label>${escapeHtml(t('naist.passport.kind'))}</label>
                    <select class="text_pole naist-passport-kind">${PASSPORT_KINDS.map((k) => `<option value="${k}"${k === passport.kind ? ' selected' : ''}>${escapeHtml(t(`naist.passport.kind.${k}`))}</option>`).join('')}</select></div>
            </div>
            <label>${escapeHtml(t('naist.passport.aliases'))}</label>
            <input class="text_pole naist-passport-aliases" value="${escapeHtml(passport.aliases.join(', '))}" placeholder="${escapeHtml(t('naist.passport.aliasesHint'))}">`
            : '';
        return `
            ${options.generate ? `<div class="naist-row"><div class="menu_button naist-passport-generate"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml(t('naist.passport.generateOne'))}</div><span class="naist-muted">${escapeHtml(t('naist.passport.generateHint'))}</span></div>` : ''}
            ${identity}
            <div class="naist-passport-tags-box">
                <label>${escapeHtml(t('naist.passport.tags'))}</label>
                <textarea class="text_pole textarea_compact naist-slot-input naist-passport-tags" rows="3">${escapeHtml(passport.tags)}</textarea>
                <div class="naist-hint">${escapeHtml(t('naist.passport.tagsHint'))}</div>
            </div>
            <div class="naist-passport-character">
            <div class="naist-grid2">${PASSPORT_SLOTS.map(
                (slot) => `<div><label>${escapeHtml(t(`naist.slot.${slot}`))}</label>
                    <textarea class="text_pole textarea_compact naist-slot-input" data-slot="${slot}" rows="2">${escapeHtml(passport.slots[slot])}</textarea></div>`,
            ).join('')}</div>
            <div class="naist-section">
                <b>${escapeHtml(t('naist.passport.outfits'))}</b>
                <div class="naist-hint">${escapeHtml(t('naist.passport.outfitsHint'))}</div>
                <div class="naist-outfits">${renderOutfits()}</div>
                <label>${escapeHtml(t('naist.passport.activeOutfit'))}</label>
                <select class="text_pole naist-active-outfit"></select>
            </div>
            <div class="naist-section">
                <b>${escapeHtml(t('naist.passport.states'))}</b>
                <div class="naist-states">${renderStates()}</div>
            </div>
            <div class="naist-section">
                <label class="checkbox_label"><input type="checkbox" class="naist-nsfw-on"${passport.nsfw.enabled ? ' checked' : ''}><span>${escapeHtml(t('naist.passport.nsfw'))}</span></label>
                <textarea class="text_pole textarea_compact naist-nsfw-tags" rows="2">${escapeHtml(passport.nsfw.tags)}</textarea>
                <div class="naist-hint">${escapeHtml(t('naist.passport.nsfwHint'))}</div>
            </div>
            <div class="naist-grid2">
                <div><label>${escapeHtml(t('naist.passport.pose'))}</label><select class="text_pole naist-pose">${poseSelectOptions(passport.pose.preset)}</select></div>
                <div><label>${escapeHtml(t('naist.passport.poseTags'))}</label><input class="text_pole naist-pose-tags" value="${escapeHtml(passport.pose.custom)}"></div>
            </div>
            <div class="naist-row">
                <label class="checkbox_label"><input type="checkbox" class="naist-pos-on"${passport.position ? ' checked' : ''}><span>${escapeHtml(t('naist.passport.position'))}</span></label>
                <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-x" value="${passport.position?.x ?? 0.5}" title="x">
                <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-y" value="${passport.position?.y ?? 0.5}" title="y">
            </div>
            </div>
            <label>${escapeHtml(t('naist.passport.negative'))}</label>
            <textarea class="text_pole textarea_compact naist-negative" rows="2">${escapeHtml(passport.negative)}</textarea>`;
    };

    root.innerHTML = `
        <h3 class="naist-passport-title"></h3>
        <div class="naist-hint">${escapeHtml(t('naist.passport.hint'))}</div>
        ${scopeBar}
        <div class="naist-passport-form"></div>`;
    const form = root.querySelector('.naist-passport-form') as HTMLElement;
    const q = <T extends Element>(selector: string) => form.querySelector<T>(selector);
    const outfitsBox = () => q<HTMLElement>('.naist-outfits');
    const statesBox = () => q<HTMLElement>('.naist-states');
    const activeSelect = () => q<HTMLSelectElement>('.naist-active-outfit');

    const applyKind = () => {
        const kind = (q<HTMLSelectElement>('.naist-passport-kind')?.value ?? passport.kind) as PassportKind;
        q('.naist-passport-character')?.classList.toggle('naist-hidden', kind !== 'character');
        q('.naist-passport-tags-box')?.classList.toggle('naist-hidden', kind === 'character');
    };

    const readOutfits = () => {
        const box = outfitsBox();
        if (!box) return;
        passport.outfits = [...box.querySelectorAll<HTMLElement>('.naist-outfit')].map((row) => {
            // Tracker wordings of an outfit (v0.12.1) are not shown, but stay with their row.
            const looks = passport.outfits[Number(row.dataset.index)]?.looks;
            return {
                name: row.querySelector<HTMLInputElement>('.naist-outfit-name')?.value.trim() ?? '',
                tags: row.querySelector<HTMLInputElement>('.naist-outfit-tags')?.value ?? '',
                ...(looks?.length ? { looks: [...looks] } : {}),
            };
        });
    };
    const readStates = () => {
        statesBox()
            ?.querySelectorAll<HTMLElement>('.naist-state')
            .forEach((row) => {
                const state = passport.states[Number(row.dataset.index)];
                if (!state) return;
                state.enabled = row.querySelector<HTMLInputElement>('.naist-state-on')?.checked === true;
                state.tags = row.querySelector<HTMLInputElement>('.naist-state-tags')?.value ?? '';
            });
    };
    const fillActive = () => {
        const select = activeSelect();
        if (!select) return;
        const current = passport.activeOutfit;
        select.innerHTML = [
            `<option value="">${escapeHtml(t('naist.passport.clothingSlot'))}</option>`,
            ...passport.outfits
                .filter((o) => o.name)
                .map((o) => `<option value="${escapeHtml(o.name)}">${escapeHtml(o.name)}</option>`),
        ].join('');
        select.value = passport.outfits.some((o) => o.name === current) ? current : '';
    };

    /** The form's values into the passport shown (before saving or switching the scope). */
    const readForm = () => {
        form.querySelectorAll<HTMLTextAreaElement>('.naist-slot-input[data-slot]').forEach((area) => {
            const slot = area.dataset.slot as (typeof PASSPORT_SLOTS)[number];
            if (slot) passport.slots[slot] = area.value.trim();
        });
        passport.tags = q<HTMLTextAreaElement>('.naist-passport-tags')?.value.trim() ?? passport.tags;
        if (options.identity) {
            passport.name = q<HTMLInputElement>('.naist-passport-name')?.value.trim() ?? passport.name;
            passport.kind =
                (q<HTMLSelectElement>('.naist-passport-kind')?.value as PassportKind | undefined) ?? passport.kind;
            passport.aliases = (q<HTMLInputElement>('.naist-passport-aliases')?.value ?? '')
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean);
        }
        readOutfits();
        passport.outfits = passport.outfits.filter((o) => o.name);
        const active = activeSelect()?.value ?? '';
        passport.activeOutfit = passport.outfits.some((o) => o.name === active) ? active : '';
        readStates();
        passport.nsfw = {
            enabled: q<HTMLInputElement>('.naist-nsfw-on')?.checked === true,
            tags: q<HTMLTextAreaElement>('.naist-nsfw-tags')?.value.trim() ?? '',
        };
        passport.negative = q<HTMLTextAreaElement>('.naist-negative')?.value.trim() ?? '';
        passport.pose = {
            preset: q<HTMLSelectElement>('.naist-pose')?.value ?? '',
            custom: q<HTMLInputElement>('.naist-pose-tags')?.value.trim() ?? '',
        };
        const usePosition = q<HTMLInputElement>('.naist-pos-on')?.checked === true;
        const clamp = (v: string | undefined) => Math.min(1, Math.max(0, Number(v) || 0.5));
        passport.position = usePosition
            ? {
                  x: clamp(q<HTMLInputElement>('.naist-pos-x')?.value),
                  y: clamp(q<HTMLInputElement>('.naist-pos-y')?.value),
              }
            : null;
    };

    const renderScope = () => {
        if (!scopes) return;
        root.querySelectorAll<HTMLInputElement>(`input[name="${radioName}"]`).forEach((radio) => {
            radio.checked = radio.value === scope;
        });
        const hint = root.querySelector('.naist-passport-scope-hint');
        if (hint)
            hint.textContent = t(
                !drafts.card
                    ? 'naist.passport.scopeChatOnly'
                    : scope === 'chat'
                      ? 'naist.passport.scopeChatHint'
                      : 'naist.passport.scopeCardHint',
            );
        root.querySelector('.naist-passport-scope-reset')?.classList.toggle(
            'naist-hidden',
            scope !== 'chat' || !scopes.card,
        );
    };

    const renderForm = () => {
        const title = root.querySelector('.naist-passport-title');
        if (title) title.textContent = t('naist.passport.title', { name: passport.name || name });
        form.innerHTML = formHtml();
        fillActive();
        applyKind();
        renderScope();
        localize(root);
    };

    const fill = (generated: Passport) => {
        form.querySelectorAll<HTMLTextAreaElement>('.naist-slot-input[data-slot]').forEach((area) => {
            const slot = area.dataset.slot as (typeof PASSPORT_SLOTS)[number];
            if (slot && generated.slots[slot]) area.value = generated.slots[slot];
        });
        const tags = q<HTMLTextAreaElement>('.naist-passport-tags');
        if (tags && generated.tags) tags.value = generated.tags;
        const nsfw = q<HTMLTextAreaElement>('.naist-nsfw-tags');
        if (nsfw && generated.nsfw.tags) nsfw.value = generated.nsfw.tags;
        const negative = q<HTMLTextAreaElement>('.naist-negative');
        if (negative && generated.negative) negative.value = generated.negative;
        const aliases = q<HTMLInputElement>('.naist-passport-aliases');
        if (aliases && generated.aliases.length) aliases.value = generated.aliases.join(', ');
        if (generated.outfits.length) {
            readOutfits();
            const names = new Set(passport.outfits.map((o) => o.name.toLowerCase()));
            passport.outfits.push(...generated.outfits.filter((o) => !names.has(o.name.toLowerCase())));
            const box = outfitsBox();
            if (box) box.innerHTML = renderOutfits();
            fillActive();
        }
    };

    const switchScope = (next: PassportScope) => {
        const target = drafts[next];
        if (next === scope || !target) {
            renderScope();
            return;
        }
        readForm();
        scope = next;
        passport = target;
        renderForm();
    };

    root.addEventListener('change', (event) => {
        const target = event.target as HTMLElement;
        if (target instanceof HTMLInputElement && target.name === radioName) {
            switchScope(target.value === 'chat' ? 'chat' : 'card');
        } else if (target.classList.contains('naist-passport-kind')) {
            applyKind();
        } else if (target.closest('.naist-outfits')) {
            readOutfits();
            fillActive();
        }
    });

    root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('.naist-passport-scope-reset') && scopes?.card) {
            // The chat view goes back to the card: saving in this scope drops the chat's override.
            drafts.chat = structuredClone(scopes.card);
            passport = drafts.chat;
            renderForm();
            return;
        }
        const generateButton = target.closest<HTMLElement>('.naist-passport-generate');
        if (generateButton && options.generate && !generateButton.classList.contains('disabled')) {
            generateButton.classList.add('disabled');
            void options
                .generate()
                .then((generated) => {
                    fill(generated);
                    toastr.success(t('naist.passport.generated'));
                })
                .catch(reportGenerationError)
                .finally(() => generateButton.classList.remove('disabled'));
            return;
        }
        const box = outfitsBox();
        if (target.classList.contains('naist-outfit-add') && box) {
            readOutfits();
            passport.outfits.push({
                name: t('naist.passport.outfitDefault', { n: passport.outfits.length + 1 }),
                tags: '',
            } as Outfit);
            box.innerHTML = renderOutfits();
            fillActive();
        } else if (target.classList.contains('naist-outfit-remove') && box) {
            readOutfits();
            passport.outfits.splice(Number(target.closest<HTMLElement>('.naist-outfit')?.dataset.index), 1);
            box.innerHTML = renderOutfits();
            fillActive();
        } else if (target.classList.contains('naist-state-add')) {
            readStates();
            const input = q<HTMLInputElement>('.naist-state-new');
            const id = input?.value.trim() ?? '';
            if (id && !passport.states.some((s) => s.id === id)) passport.states.push({ id, tags: id, enabled: true });
            const states = statesBox();
            if (states) states.innerHTML = renderStates();
        }
    });

    renderForm();
    attachPromptAssist(root, '.naist-slot-input, .naist-nsfw-tags, .naist-negative', () => settings().generation.model);
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.passport.save'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    if (result !== c.POPUP_RESULT.AFFIRMATIVE) return null;
    readForm();
    return { passport, scope };
}
