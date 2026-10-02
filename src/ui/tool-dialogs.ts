// Dialogs of the Phase 5 tools: the tools menu of an image, Director Tools, Enhance.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { saveSettings, settings } from '../core/settings';
import {
    DIRECTOR_EMOTIONS,
    DIRECTOR_TOOLS,
    directorSize,
    directorToolCost,
    enhanceSize,
    fitArea,
    FREE_MAX_PIXELS,
    MODELS,
    toolTakesPrompt,
    upscaleCost,
} from '../domain';
import type { AccountState, DirectorEmotion, DirectorOptions, DirectorTool } from '../domain';
import type { TransportFeatures } from '../transport';
import { escapeHtml } from './components/dom';

export type ToolAction = 'director' | 'inpaint' | 'outpaint' | 'upscale' | 'enhance';

const ACTIONS: { id: ToolAction; icon: string; feature: keyof TransportFeatures }[] = [
    { id: 'director', icon: 'fa-wand-magic-sparkles', feature: 'director' },
    { id: 'inpaint', icon: 'fa-paintbrush', feature: 'inpaint' },
    { id: 'outpaint', icon: 'fa-expand', feature: 'inpaint' },
    { id: 'upscale', icon: 'fa-up-right-and-down-left-from-center', feature: 'upscale' },
    { id: 'enhance', icon: 'fa-wand-sparkles', feature: 'img2img' },
];

/** Tools available for an image; disabled ones stay visible with the reason (TZ degradation rule). */
export async function toolsMenu(features: TransportFeatures | null): Promise<ToolAction | null> {
    const c = ctx();
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-tools-menu';
    root.innerHTML = `<h3>${escapeHtml(t('naist.tools.title'))}</h3>${ACTIONS.map((a) => {
        const on = features?.[a.feature] === true;
        return `<div class="menu_button naist-tools-item${on ? '' : ' disabled'}" data-action="${a.id}" title="${escapeHtml(on ? t(`naist.tools.${a.id}Hint`) : t('naist.tools.needsPlugin'))}">
            <i class="fa-solid ${a.icon}"></i> ${escapeHtml(t(`naist.tools.${a.id}`))}${on ? '' : ` <span class="naist-muted">— ${escapeHtml(t('naist.tools.needsPlugin'))}</span>`}</div>`;
    }).join('')}`;
    let chosen: ToolAction | null = null;
    const popup = new c.Popup(root, c.POPUP_TYPE.TEXT, '', { okButton: t('naist.inspector.cancel') });
    root.addEventListener('click', (event) => {
        const item = (event.target as HTMLElement).closest<HTMLElement>('.naist-tools-item');
        if (!item || item.classList.contains('disabled')) return;
        chosen = item.dataset.action as ToolAction;
        void popup.completeCancelled();
    });
    await popup.show();
    return chosen;
}

export async function directorDialog(
    size: { width: number; height: number },
    account: AccountState,
): Promise<{ tool: DirectorTool; options: DirectorOptions } | null> {
    const c = ctx();
    const s = settings().tools;
    const sent = directorSize(size.width, size.height);
    const root = document.createElement('div');
    root.className = 'naist-dialog';
    const costOf = (tool: DirectorTool) => directorToolCost(tool, sent.width, sent.height, account);
    root.innerHTML = `
        <h3>${escapeHtml(t('naist.director.title'))}</h3>
        <div class="naist-hint">${escapeHtml(t('naist.director.hint', { width: sent.width, height: sent.height }))}</div>
        <div class="naist-director-tools">${DIRECTOR_TOOLS.map((tool, i) => {
            const cost = costOf(tool);
            return `<label class="checkbox_label naist-director-tool"><input type="radio" name="naist_dir_tool" value="${tool}"${i === 0 ? ' checked' : ''}>
                <span><b>${escapeHtml(t(`naist.director.${tool}`))}</b> — ${escapeHtml(cost ? t('naist.director.costPaid', { cost }) : t('naist.director.costFree'))}<br><span class="naist-muted">${escapeHtml(t(`naist.director.${tool}Hint`))}</span></span></label>`;
        }).join('')}</div>
        <div class="naist-director-extra naist-hidden">
            <div class="naist-director-emotion-row"><label>${escapeHtml(t('naist.director.emotion'))}</label>
            <select class="text_pole naist-dir-emotion">${DIRECTOR_EMOTIONS.map((e) => `<option value="${e}"${e === s.emotion ? ' selected' : ''}>${escapeHtml(t(`naist.emotion.${e}`))}</option>`).join('')}</select></div>
            <label>${escapeHtml(t('naist.director.prompt'))}</label>
            <input class="text_pole naist-dir-prompt" placeholder="${escapeHtml(t('naist.director.promptPlaceholder'))}">
            <label>${escapeHtml(t('naist.director.defry'))}: <span class="naist-dir-defry-value">${s.defry}</span></label>
            <input type="range" min="0" max="5" step="1" class="naist-dir-defry" value="${s.defry}">
        </div>`;
    const update = () => {
        const tool = (root.querySelector<HTMLInputElement>('input[name="naist_dir_tool"]:checked')?.value ??
            'lineart') as DirectorTool;
        root.querySelector('.naist-director-extra')?.classList.toggle('naist-hidden', !toolTakesPrompt(tool));
        root.querySelector('.naist-director-emotion-row')?.classList.toggle('naist-hidden', tool !== 'emotion');
    };
    root.addEventListener('change', update);
    root.addEventListener('input', (event) => {
        const el = event.target as HTMLInputElement;
        if (el.classList.contains('naist-dir-defry')) {
            const label = root.querySelector('.naist-dir-defry-value');
            if (label) label.textContent = el.value;
        }
    });
    update();
    localize(root);
    const ok = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.director.run'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
    });
    if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return null;
    const tool = (root.querySelector<HTMLInputElement>('input[name="naist_dir_tool"]:checked')?.value ??
        'lineart') as DirectorTool;
    const emotion = (root.querySelector<HTMLSelectElement>('.naist-dir-emotion')?.value ?? 'happy') as DirectorEmotion;
    const defry = Number(root.querySelector<HTMLInputElement>('.naist-dir-defry')?.value ?? 0);
    s.emotion = emotion;
    s.defry = defry;
    saveSettings();
    return {
        tool,
        options: { emotion, defry, prompt: root.querySelector<HTMLInputElement>('.naist-dir-prompt')?.value ?? '' },
    };
}

export interface EnhanceChoice {
    scale: number;
    strength: number;
    noise: number;
    prompt: string;
    negative: string;
    model: string;
}

export async function enhanceDialog(
    size: { width: number; height: number },
    defaults: { prompt: string; negative: string; model: string },
): Promise<EnhanceChoice | null> {
    const c = ctx();
    const s = settings().tools;
    const root = document.createElement('div');
    root.className = 'naist-dialog';
    const target = (scale: number) => enhanceSize(size.width, size.height, scale);
    root.innerHTML = `
        <h3>${escapeHtml(t('naist.enhance.title'))}</h3>
        <div class="naist-hint">${escapeHtml(t('naist.enhance.hint'))}</div>
        <div class="naist-grid3">
            <div><label>${escapeHtml(t('naist.enhance.scale'))}</label><select class="text_pole naist-en-scale">${[
                1, 1.5, 2,
            ]
                .map((v) => `<option value="${v}"${v === s.enhanceScale ? ' selected' : ''}>×${v}</option>`)
                .join('')}</select></div>
            <div><label>${escapeHtml(t('naist.enhance.strength'))}</label><input type="number" min="0.01" max="0.99" step="0.01" class="text_pole naist-en-strength" value="${s.enhanceStrength}"></div>
            <div><label>${escapeHtml(t('naist.enhance.noise'))}</label><input type="number" min="0" max="0.99" step="0.01" class="text_pole naist-en-noise" value="${s.enhanceNoise}"></div>
        </div>
        <div class="naist-muted naist-en-size"></div>
        <label>${escapeHtml(t('naist.inline.prompt'))}</label>
        <textarea class="text_pole naist-en-prompt" rows="3">${escapeHtml(defaults.prompt)}</textarea>
        <label>${escapeHtml(t('naist.panel.model'))}</label>
        <select class="text_pole naist-en-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === defaults.model ? ' selected' : ''}>${escapeHtml(t(m.nameKey))}</option>`).join('')}</select>
        <div class="naist-hint">${escapeHtml(t('naist.enhance.freeNote'))}</div>`;
    const showSize = () => {
        const scale = Number(root.querySelector<HTMLSelectElement>('.naist-en-scale')?.value ?? 1.5);
        const out = target(scale);
        const el = root.querySelector('.naist-en-size');
        if (!el) return;
        el.textContent = t('naist.enhance.size', {
            from: `${size.width}×${size.height}`,
            to: `${out.width}×${out.height}`,
        });
        if (settings().anlas.freeOnly && out.width * out.height > FREE_MAX_PIXELS) {
            el.textContent += ` ${t('naist.outpaint.freeSize', fitArea(out.width, out.height, FREE_MAX_PIXELS))}`;
        }
    };
    root.addEventListener('change', showSize);
    showSize();
    localize(root);
    const ok = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.enhance.run'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
    });
    if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return null;
    const read = (sel: string, fallback: number) => {
        const n = Number(root.querySelector<HTMLInputElement>(sel)?.value);
        return Number.isFinite(n) ? n : fallback;
    };
    const choice: EnhanceChoice = {
        scale: read('.naist-en-scale', 1.5),
        strength: Math.min(0.99, Math.max(0.01, read('.naist-en-strength', 0.45))),
        noise: Math.min(0.99, Math.max(0, read('.naist-en-noise', 0))),
        prompt: root.querySelector<HTMLTextAreaElement>('.naist-en-prompt')?.value.trim() ?? defaults.prompt,
        negative: defaults.negative,
        model: root.querySelector<HTMLSelectElement>('.naist-en-model')?.value ?? defaults.model,
    };
    s.enhanceScale = choice.scale;
    s.enhanceStrength = choice.strength;
    s.enhanceNoise = choice.noise;
    saveSettings();
    return choice;
}

/** Cost confirmation of a paid tool call. */
export async function confirmToolCost(cost: number, what: string, balance: number): Promise<boolean> {
    const c = ctx();
    const result = await c.callGenericPopup(
        t('naist.tools.confirmCost', { cost, what, balance }),
        c.POPUP_TYPE.CONFIRM,
    );
    return result === c.POPUP_RESULT.AFFIRMATIVE;
}

export function upscalePrice(width: number, height: number): number | null {
    return upscaleCost(width, height);
}
