// Appearance passport editor (TZ Phase 4): slots, NSFW layer, outfits, states, personal UC,
// default pose and canvas position. Character passports go to the card, persona ones to settings.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { defaultPassport, PASSPORT_SLOTS, STATE_PRESETS } from '../domain';
import type { Outfit, Passport, PassportState } from '../domain';
import { escapeHtml } from './components/dom';
import { poseSelectOptions } from './pose-helpers';

function stateLabel(state: PassportState): string {
    return state.id in STATE_PRESETS ? t(`naist.state.${state.id}`) : state.id;
}

/** Opens the editor; resolves with the edited passport or null when cancelled. */
export async function editPassport(name: string, initial: Passport | null): Promise<Passport | null> {
    const c = ctx();
    const passport: Passport = structuredClone(initial ?? defaultPassport());
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-passport';

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

    root.innerHTML = `
        <h3>${escapeHtml(t('naist.passport.title', { name }))}</h3>
        <div class="naist-hint">${escapeHtml(t('naist.passport.hint'))}</div>
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
        <label>${escapeHtml(t('naist.passport.negative'))}</label>
        <textarea class="text_pole textarea_compact naist-negative" rows="2">${escapeHtml(passport.negative)}</textarea>
        <div class="naist-grid2">
            <div><label>${escapeHtml(t('naist.passport.pose'))}</label><select class="text_pole naist-pose">${poseSelectOptions(passport.pose.preset)}</select></div>
            <div><label>${escapeHtml(t('naist.passport.poseTags'))}</label><input class="text_pole naist-pose-tags" value="${escapeHtml(passport.pose.custom)}"></div>
        </div>
        <div class="naist-row">
            <label class="checkbox_label"><input type="checkbox" class="naist-pos-on"${passport.position ? ' checked' : ''}><span>${escapeHtml(t('naist.passport.position'))}</span></label>
            <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-x" value="${passport.position?.x ?? 0.5}" title="x">
            <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-y" value="${passport.position?.y ?? 0.5}" title="y">
        </div>`;

    const outfitsBox = root.querySelector('.naist-outfits') as HTMLElement;
    const statesBox = root.querySelector('.naist-states') as HTMLElement;
    const activeSelect = root.querySelector('.naist-active-outfit') as HTMLSelectElement;

    const readOutfits = () => {
        passport.outfits = [...outfitsBox.querySelectorAll<HTMLElement>('.naist-outfit')].map((row) => ({
            name: row.querySelector<HTMLInputElement>('.naist-outfit-name')?.value.trim() ?? '',
            tags: row.querySelector<HTMLInputElement>('.naist-outfit-tags')?.value ?? '',
        }));
    };
    const readStates = () => {
        statesBox.querySelectorAll<HTMLElement>('.naist-state').forEach((row) => {
            const state = passport.states[Number(row.dataset.index)];
            if (!state) return;
            state.enabled = row.querySelector<HTMLInputElement>('.naist-state-on')?.checked === true;
            state.tags = row.querySelector<HTMLInputElement>('.naist-state-tags')?.value ?? '';
        });
    };
    const fillActive = () => {
        const current = passport.activeOutfit;
        activeSelect.innerHTML = [
            `<option value="">${escapeHtml(t('naist.passport.clothingSlot'))}</option>`,
            ...passport.outfits
                .filter((o) => o.name)
                .map((o) => `<option value="${escapeHtml(o.name)}">${escapeHtml(o.name)}</option>`),
        ].join('');
        activeSelect.value = passport.outfits.some((o) => o.name === current) ? current : '';
    };
    fillActive();

    root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('naist-outfit-add')) {
            readOutfits();
            passport.outfits.push({
                name: t('naist.passport.outfitDefault', { n: passport.outfits.length + 1 }),
                tags: '',
            } as Outfit);
            outfitsBox.innerHTML = renderOutfits();
            fillActive();
        } else if (target.classList.contains('naist-outfit-remove')) {
            readOutfits();
            passport.outfits.splice(Number(target.closest<HTMLElement>('.naist-outfit')?.dataset.index), 1);
            outfitsBox.innerHTML = renderOutfits();
            fillActive();
        } else if (target.classList.contains('naist-state-add')) {
            readStates();
            const input = root.querySelector<HTMLInputElement>('.naist-state-new');
            const id = input?.value.trim() ?? '';
            if (id && !passport.states.some((s) => s.id === id)) passport.states.push({ id, tags: id, enabled: true });
            statesBox.innerHTML = renderStates();
        }
    });
    outfitsBox.addEventListener('change', () => {
        readOutfits();
        fillActive();
    });

    localize(root);
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.passport.save'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    if (result !== c.POPUP_RESULT.AFFIRMATIVE) return null;

    root.querySelectorAll<HTMLTextAreaElement>('.naist-slot-input').forEach((area) => {
        const slot = area.dataset.slot as (typeof PASSPORT_SLOTS)[number];
        if (slot) passport.slots[slot] = area.value.trim();
    });
    readOutfits();
    passport.outfits = passport.outfits.filter((o) => o.name);
    passport.activeOutfit = passport.outfits.some((o) => o.name === activeSelect.value) ? activeSelect.value : '';
    readStates();
    passport.nsfw = {
        enabled: root.querySelector<HTMLInputElement>('.naist-nsfw-on')?.checked === true,
        tags: root.querySelector<HTMLTextAreaElement>('.naist-nsfw-tags')?.value.trim() ?? '',
    };
    passport.negative = root.querySelector<HTMLTextAreaElement>('.naist-negative')?.value.trim() ?? '';
    passport.pose = {
        preset: root.querySelector<HTMLSelectElement>('.naist-pose')?.value ?? '',
        custom: root.querySelector<HTMLInputElement>('.naist-pose-tags')?.value.trim() ?? '',
    };
    const useposition = root.querySelector<HTMLInputElement>('.naist-pos-on')?.checked === true;
    const clamp = (v: string | undefined) => Math.min(1, Math.max(0, Number(v) || 0.5));
    passport.position = useposition
        ? {
              x: clamp(root.querySelector<HTMLInputElement>('.naist-pos-x')?.value),
              y: clamp(root.querySelector<HTMLInputElement>('.naist-pos-y')?.value),
          }
        : null;
    return passport;
}
