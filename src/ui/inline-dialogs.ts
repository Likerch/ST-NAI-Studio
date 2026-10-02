// Popups for inline images: insert (mode + prompt + size), "redo with an edited prompt"
// (prefilled parameters) and per-image display options.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { settings } from '../core/settings';
import { MODE, MODELS, TRIGGER_WORDS, WAND_MODES } from '../domain';
import type { DisplayOptions, InlineGenerationMeta, ModeId } from '../domain';
import type { EditParams, InlineRequest } from '../features/inline/inline-service';
import { escapeHtml } from './components/dom';

async function confirmPopup(root: HTMLElement, okKey: string, wide = false): Promise<boolean> {
    const c = ctx();
    localize(root);
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t(okKey),
        cancelButton: t('naist.inspector.cancel'),
        wide,
    });
    return result === c.POPUP_RESULT.AFFIRMATIVE;
}

function value(root: HTMLElement, selector: string): string {
    return root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value ?? '';
}

function checked(root: HTMLElement, selector: string): boolean {
    return root.querySelector<HTMLInputElement>(selector)?.checked === true;
}

/** Insert dialog. `selection` pre-fills the prompt (selected text or text near the cursor). */
export async function insertDialog(selection: string): Promise<InlineRequest | null> {
    const s = settings().inline;
    const modes = [
        { value: 'free', label: t('naist.inline.modeFree') },
        { value: 'text', label: t('naist.inline.modeText') },
        ...WAND_MODES.map((m) => ({ value: String(m), label: t(`naist.mode.${m}`) })),
    ];
    const root = document.createElement('div');
    root.className = 'naist-dialog';
    root.innerHTML = `
        <h3 data-i18n="naist.inline.insertTitle"></h3>
        <label for="naist_ins_mode" data-i18n="naist.inline.mode"></label>
        <select id="naist_ins_mode" class="text_pole">${modes
            .map(
                (m) =>
                    `<option value="${escapeHtml(m.value)}"${m.value === s.insertMode ? ' selected' : ''}>${escapeHtml(m.label)}</option>`,
            )
            .join('')}</select>
        <label for="naist_ins_prompt" data-i18n="naist.inline.prompt"></label>
        <textarea id="naist_ins_prompt" class="text_pole" rows="4">${escapeHtml(selection)}</textarea>
        <div class="naist-hint" data-i18n="naist.inline.promptHint"></div>
        <div class="naist-grid3">
            <div><label data-i18n="naist.inline.width"></label><input id="naist_ins_width" type="number" min="5" class="text_pole" value="${s.defaultWidth}"></div>
            <div><label data-i18n="naist.inline.unit"></label><select id="naist_ins_unit" class="text_pole"><option value="%">%</option><option value="px">px</option></select></div>
            <div><label data-i18n="naist.inline.align"></label><select id="naist_ins_align" class="text_pole">
                <option value="center" data-i18n="naist.inline.alignCenter"></option>
                <option value="left" data-i18n="naist.inline.alignLeft"></option>
                <option value="right" data-i18n="naist.inline.alignRight"></option></select></div>
        </div>`;
    root.querySelector<HTMLSelectElement>('#naist_ins_unit')!.value = s.defaultWidthUnit;
    root.querySelector<HTMLSelectElement>('#naist_ins_align')!.value = s.defaultAlign;
    if (!(await confirmPopup(root, 'naist.inline.insertOk', true))) return null;
    const mode = value(root, '#naist_ins_mode');
    const prompt = value(root, '#naist_ins_prompt').trim();
    s.insertMode = mode;
    ctx().saveSettingsDebounced();
    const display: Partial<DisplayOptions> = {
        width: Number(value(root, '#naist_ins_width')) || s.defaultWidth,
        widthUnit: value(root, '#naist_ins_unit') === 'px' ? 'px' : '%',
        align: (value(root, '#naist_ins_align') as DisplayOptions['align']) || 'center',
    };
    if (mode === 'free') return prompt ? { trigger: prompt, mode: MODE.FREE, display } : null;
    if (mode === 'text') return prompt ? { trigger: prompt, mode: MODE.FREE_EXTENDED, display } : null;
    const id = Number(mode) as ModeId;
    return { trigger: TRIGGER_WORDS[id] ?? prompt, mode: id, display };
}

/** "Redo with an edited prompt": every parameter pre-filled from the current image. */
export async function editDialog(meta: InlineGenerationMeta): Promise<EditParams | null> {
    const root = document.createElement('div');
    root.className = 'naist-dialog';
    root.innerHTML = `
        <h3 data-i18n="naist.inline.editTitle"></h3>
        <label data-i18n="naist.inline.prompt"></label>
        <textarea id="naist_ed_scene" class="text_pole" rows="5">${escapeHtml(meta.scenePrompt)}</textarea>
        <label data-i18n="naist.refine.negative"></label>
        <textarea id="naist_ed_negative" class="text_pole" rows="2">${escapeHtml(meta.negative)}</textarea>
        <label data-i18n="naist.panel.model"></label>
        <select id="naist_ed_model" class="text_pole">${MODELS.map(
            (m) =>
                `<option value="${escapeHtml(m.id)}"${m.id === meta.model ? ' selected' : ''}>${escapeHtml(t(m.nameKey))}</option>`,
        ).join('')}</select>
        <div class="naist-grid3">
            <div><label data-i18n="naist.meta.seed"></label><input id="naist_ed_seed" type="number" class="text_pole" value="${meta.seed}"></div>
            <div><label data-i18n="naist.panel.width"></label><input id="naist_ed_width" type="number" step="64" min="64" class="text_pole" value="${meta.width}"></div>
            <div><label data-i18n="naist.panel.height"></label><input id="naist_ed_height" type="number" step="64" min="64" class="text_pole" value="${meta.height}"></div>
            <div><label data-i18n="naist.panel.steps"></label><input id="naist_ed_steps" type="number" min="1" max="50" class="text_pole" value="${meta.steps}"></div>
            <div><label data-i18n="naist.panel.scale"></label><input id="naist_ed_scale" type="number" step="0.1" min="0" max="10" class="text_pole" value="${meta.scale}"></div>
            <div><label class="checkbox_label"><input id="naist_ed_random" type="checkbox"><span data-i18n="naist.inline.randomSeed"></span></label></div>
        </div>`;
    if (!(await confirmPopup(root, 'naist.inline.editOk', true))) return null;
    const scene = value(root, '#naist_ed_scene').trim();
    if (!scene) return null;
    const num = (selector: string, fallback: number) => {
        const n = Number(value(root, selector));
        return Number.isFinite(n) ? n : fallback;
    };
    return {
        scene,
        negative: value(root, '#naist_ed_negative').trim(),
        model: value(root, '#naist_ed_model') || meta.model,
        seed: checked(root, '#naist_ed_random') ? -1 : num('#naist_ed_seed', meta.seed),
        width: num('#naist_ed_width', meta.width),
        height: num('#naist_ed_height', meta.height),
        steps: num('#naist_ed_steps', meta.steps),
        scale: num('#naist_ed_scale', meta.scale),
    };
}

export async function displayDialog(display: DisplayOptions): Promise<Partial<DisplayOptions> | null> {
    const root = document.createElement('div');
    root.className = 'naist-dialog';
    root.innerHTML = `
        <h3 data-i18n="naist.inline.displayTitle"></h3>
        <div class="naist-grid3">
            <div><label data-i18n="naist.inline.width"></label><input id="naist_dp_width" type="number" min="5" class="text_pole" value="${display.width}"></div>
            <div><label data-i18n="naist.inline.unit"></label><select id="naist_dp_unit" class="text_pole"><option value="%">%</option><option value="px">px</option></select></div>
            <div><label data-i18n="naist.inline.align"></label><select id="naist_dp_align" class="text_pole">
                <option value="center" data-i18n="naist.inline.alignCenter"></option>
                <option value="left" data-i18n="naist.inline.alignLeft"></option>
                <option value="right" data-i18n="naist.inline.alignRight"></option></select></div>
            <div><label data-i18n="naist.inline.radius"></label><input id="naist_dp_radius" type="number" min="0" class="text_pole" value="${display.radius}"></div>
            <div><label data-i18n="naist.inline.layout"></label><select id="naist_dp_layout" class="text_pole">
                <option value="grid" data-i18n="naist.inline.layoutGrid"></option>
                <option value="carousel" data-i18n="naist.inline.layoutCarousel"></option>
                <option value="list" data-i18n="naist.inline.layoutList"></option></select></div>
        </div>
        <div class="naist-flags">
            <label class="checkbox_label"><input id="naist_dp_wrap" type="checkbox"${display.wrap ? ' checked' : ''}><span data-i18n="naist.inline.wrap"></span></label>
            <label class="checkbox_label"><input id="naist_dp_border" type="checkbox"${display.border ? ' checked' : ''}><span data-i18n="naist.inline.border"></span></label>
            <label class="checkbox_label"><input id="naist_dp_spoiler" type="checkbox"${display.spoiler ? ' checked' : ''}><span data-i18n="naist.inline.spoilerOption"></span></label>
        </div>
        <label data-i18n="naist.inline.caption"></label>
        <input id="naist_dp_caption" class="text_pole" value="${escapeHtml(display.caption)}">
        <label data-i18n="naist.inline.altText"></label>
        <input id="naist_dp_alt" class="text_pole" value="${escapeHtml(display.alt)}">`;
    root.querySelector<HTMLSelectElement>('#naist_dp_unit')!.value = display.widthUnit;
    root.querySelector<HTMLSelectElement>('#naist_dp_align')!.value = display.align;
    root.querySelector<HTMLSelectElement>('#naist_dp_layout')!.value = display.layout;
    if (!(await confirmPopup(root, 'naist.inline.displayOk'))) return null;
    return {
        width: Number(value(root, '#naist_dp_width')) || display.width,
        widthUnit: value(root, '#naist_dp_unit') === 'px' ? 'px' : '%',
        align: (value(root, '#naist_dp_align') as DisplayOptions['align']) || 'center',
        radius: Math.max(0, Number(value(root, '#naist_dp_radius')) || 0),
        layout: (value(root, '#naist_dp_layout') as DisplayOptions['layout']) || 'grid',
        wrap: checked(root, '#naist_dp_wrap'),
        border: checked(root, '#naist_dp_border'),
        spoiler: checked(root, '#naist_dp_spoiler'),
        caption: value(root, '#naist_dp_caption').trim(),
        alt: value(root, '#naist_dp_alt').trim(),
    };
}

export async function confirmDelete(): Promise<boolean> {
    const c = ctx();
    const result = await c.callGenericPopup(t('naist.inline.deleteConfirm'), c.POPUP_TYPE.CONFIRM);
    return result === c.POPUP_RESULT.AFFIRMATIVE;
}
