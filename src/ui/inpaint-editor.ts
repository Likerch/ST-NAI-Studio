// Inpaint / outpaint editor (TZ Phase 5): brush and eraser with an adjustable size, invert, clear,
// "keep the original" switch, the inpaint model from the matrix with an honest note when another
// model does the work; outpaint grows the canvas and masks the new areas automatically.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { saveSettings, settings } from '../core/settings';
import { fitArea, FREE_MAX_PIXELS, MODELS, planOutpaint, roundToStep } from '../domain';
import type { ImageSource } from '../features/tools/tool-common';
import { escapeHtml } from './components/dom';

export type EditorResult =
    | {
          kind: 'inpaint';
          mask: string;
          prompt: string;
          negative: string;
          strength: number;
          keepOriginal: boolean;
          model: string;
      }
    | {
          kind: 'outpaint';
          grow: { left: number; right: number; top: number; bottom: number };
          prompt: string;
          negative: string;
          model: string;
      };

async function canvasBase64(canvas: HTMLCanvasElement): Promise<string> {
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas export failed'))), 'image/png'),
    );
    const buffer = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buffer.length; i += 0x8000) binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
    return btoa(binary);
}

export async function openInpaintEditor(
    source: ImageSource,
    initial: 'inpaint' | 'outpaint',
    fallbackModel: (model: string) => string | null,
): Promise<EditorResult | null> {
    const c = ctx();
    const tools = settings().tools;
    const meta = source.meta;
    const url = URL.createObjectURL(await source.blob());
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-inpaint';
    const defaultModel = meta?.model ?? settings().generation.model;
    root.innerHTML = `
        <h3>${escapeHtml(t('naist.inpaint.title'))}</h3>
        <div class="naist-tabs naist-inpaint-tabs">
            <div class="naist-tab menu_button" data-pane="inpaint">${escapeHtml(t('naist.tools.inpaint'))}</div>
            <div class="naist-tab menu_button" data-pane="outpaint">${escapeHtml(t('naist.tools.outpaint'))}</div>
        </div>
        <div class="naist-pane" data-pane="inpaint">
            <div class="naist-row">
                <label class="checkbox_label"><input type="radio" name="naist_ip_tool" value="brush" checked><span>${escapeHtml(t('naist.inpaint.brush'))}</span></label>
                <label class="checkbox_label"><input type="radio" name="naist_ip_tool" value="eraser"><span>${escapeHtml(t('naist.inpaint.eraser'))}</span></label>
                <label>${escapeHtml(t('naist.inpaint.size'))}</label>
                <input type="range" min="4" max="300" class="naist-ip-size" value="${tools.brushSize}">
                <div class="menu_button naist-ip-invert">${escapeHtml(t('naist.inpaint.invert'))}</div>
                <div class="menu_button naist-ip-clear">${escapeHtml(t('naist.inpaint.clear'))}</div>
            </div>
            <div class="naist-inpaint-stage"><img alt="" src="${escapeHtml(url)}"><canvas class="naist-ip-canvas"></canvas></div>
            <div class="naist-hint">${escapeHtml(t('naist.inpaint.hint'))}</div>
            <div class="naist-grid2">
                <div><label>${escapeHtml(t('naist.inpaint.strength'))}</label><input type="number" min="0.01" max="1" step="0.01" class="text_pole naist-ip-strength" value="${tools.inpaintStrength}"></div>
                <div><label class="checkbox_label"><input type="checkbox" class="naist-ip-keep"${tools.keepOriginal ? ' checked' : ''}><span>${escapeHtml(t('naist.inpaint.keepOriginal'))}</span></label></div>
            </div>
        </div>
        <div class="naist-pane naist-hidden" data-pane="outpaint">
            <div class="naist-hint">${escapeHtml(t('naist.outpaint.hint'))}</div>
            <div class="naist-grid2">${['left', 'right', 'top', 'bottom']
                .map(
                    (side) =>
                        `<div><label>${escapeHtml(t(`naist.outpaint.${side}`))}</label><input type="number" min="0" step="64" value="${side === 'left' || side === 'right' ? 128 : 0}" class="text_pole naist-op-${side}"></div>`,
                )
                .join('')}</div>
            <div class="naist-muted naist-op-size"></div>
        </div>
        <label>${escapeHtml(t('naist.inline.prompt'))}</label>
        <textarea class="text_pole naist-ip-prompt" rows="3">${escapeHtml(meta?.scenePrompt ?? '')}</textarea>
        <label>${escapeHtml(t('naist.refine.negative'))}</label>
        <input class="text_pole naist-ip-negative" value="${escapeHtml(meta?.negative ?? '')}">
        <label>${escapeHtml(t('naist.panel.model'))}</label>
        <select class="text_pole naist-ip-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === defaultModel ? ' selected' : ''}>${escapeHtml(t(m.nameKey))}</option>`).join('')}</select>
        <div class="naist-warning naist-ip-fallback"></div>`;

    const canvas = root.querySelector('.naist-ip-canvas') as HTMLCanvasElement;
    canvas.width = source.width;
    canvas.height = source.height;
    const view = canvas.getContext('2d') as CanvasRenderingContext2D;
    const mask = document.createElement('canvas');
    mask.width = source.width;
    mask.height = source.height;
    const maskContext = mask.getContext('2d') as CanvasRenderingContext2D;
    maskContext.fillStyle = '#000';
    maskContext.fillRect(0, 0, mask.width, mask.height);
    let pane: 'inpaint' | 'outpaint' = initial;
    let painted = false;

    const redrawView = () => {
        const data = maskContext.getImageData(0, 0, mask.width, mask.height);
        const overlay = view.createImageData(mask.width, mask.height);
        for (let i = 0; i < data.data.length; i += 4) {
            const on = (data.data[i] ?? 0) > 127;
            overlay.data[i] = 255;
            overlay.data[i + 1] = 40;
            overlay.data[i + 2] = 40;
            overlay.data[i + 3] = on ? 130 : 0;
        }
        view.putImageData(overlay, 0, 0);
    };

    const showPane = (name: 'inpaint' | 'outpaint') => {
        pane = name;
        root.querySelectorAll<HTMLElement>('.naist-pane').forEach((p) =>
            p.classList.toggle('naist-hidden', p.dataset.pane !== name),
        );
        root.querySelectorAll<HTMLElement>('.naist-inpaint-tabs .naist-tab').forEach((tab) =>
            tab.classList.toggle('naist-tab-active', tab.dataset.pane === name),
        );
    };
    const showFallback = () => {
        const model = root.querySelector<HTMLSelectElement>('.naist-ip-model')?.value ?? defaultModel;
        const fallback = fallbackModel(model);
        const el = root.querySelector('.naist-ip-fallback');
        if (el) el.textContent = fallback ? t('naist.inpaint.fallback', { model: fallback }) : '';
    };
    const growOf = () => {
        const read = (side: string) =>
            Math.max(0, Number(root.querySelector<HTMLInputElement>(`.naist-op-${side}`)?.value) || 0);
        return { left: read('left'), right: read('right'), top: read('top'), bottom: read('bottom') };
    };
    const showOutpaintSize = () => {
        const plan = planOutpaint(source.width, source.height, growOf());
        const el = root.querySelector('.naist-op-size');
        if (!el) return;
        el.textContent = t(plan.tooLarge ? 'naist.outpaint.tooLarge' : 'naist.outpaint.size', {
            width: plan.width,
            height: plan.height,
        });
        if (!plan.tooLarge && settings().anlas.freeOnly && plan.width * plan.height > FREE_MAX_PIXELS) {
            const sent = fitArea(roundToStep(plan.width), roundToStep(plan.height), FREE_MAX_PIXELS);
            el.textContent += ` ${t('naist.outpaint.freeSize', sent)}`;
        }
    };

    const paint = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
        const size = Number(root.querySelector<HTMLInputElement>('.naist-ip-size')?.value ?? 40);
        const erase = root.querySelector<HTMLInputElement>('input[name="naist_ip_tool"]:checked')?.value === 'eraser';
        maskContext.fillStyle = erase ? '#000' : '#fff';
        maskContext.beginPath();
        maskContext.arc(x, y, size / 2, 0, Math.PI * 2);
        maskContext.fill();
        painted = true;
    };
    let drawing = false;
    canvas.addEventListener('pointerdown', (event) => {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        paint(event);
        redrawView();
    });
    canvas.addEventListener('pointermove', (event) => {
        if (!drawing) return;
        paint(event);
        redrawView();
    });
    canvas.addEventListener('pointerup', () => (drawing = false));
    canvas.addEventListener('pointercancel', () => (drawing = false));

    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        const tab = el.closest<HTMLElement>('.naist-inpaint-tabs .naist-tab');
        if (tab) showPane(tab.dataset.pane === 'outpaint' ? 'outpaint' : 'inpaint');
        else if (el.classList.contains('naist-ip-clear')) {
            maskContext.fillStyle = '#000';
            maskContext.fillRect(0, 0, mask.width, mask.height);
            painted = false;
            redrawView();
        } else if (el.classList.contains('naist-ip-invert')) {
            const data = maskContext.getImageData(0, 0, mask.width, mask.height);
            for (let i = 0; i < data.data.length; i += 4) {
                const v = 255 - (data.data[i] ?? 0);
                data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
            }
            maskContext.putImageData(data, 0, 0);
            painted = true;
            redrawView();
        }
    });
    root.addEventListener('change', (event) => {
        const el = event.target as HTMLElement;
        if (el.classList.contains('naist-ip-model')) showFallback();
        if (el.className.includes('naist-op-')) showOutpaintSize();
    });
    root.addEventListener('input', (event) => {
        if ((event.target as HTMLElement).className.includes('naist-op-')) showOutpaintSize();
    });

    showPane(initial);
    showFallback();
    showOutpaintSize();
    redrawView();
    localize(root);
    const ok = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.inpaint.run'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    URL.revokeObjectURL(url);
    if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return null;
    const prompt = root.querySelector<HTMLTextAreaElement>('.naist-ip-prompt')?.value.trim() ?? '';
    const negative = root.querySelector<HTMLInputElement>('.naist-ip-negative')?.value.trim() ?? '';
    const model = root.querySelector<HTMLSelectElement>('.naist-ip-model')?.value ?? defaultModel;
    tools.brushSize = Number(root.querySelector<HTMLInputElement>('.naist-ip-size')?.value ?? tools.brushSize);
    if (pane === 'outpaint') {
        saveSettings();
        return { kind: 'outpaint', grow: growOf(), prompt, negative, model };
    }
    if (!painted) {
        toastr.warning(t('naist.inpaint.emptyMask'));
        return null;
    }
    tools.inpaintStrength = Math.min(
        1,
        Math.max(0.01, Number(root.querySelector<HTMLInputElement>('.naist-ip-strength')?.value) || 1),
    );
    tools.keepOriginal = root.querySelector<HTMLInputElement>('.naist-ip-keep')?.checked === true;
    saveSettings();
    return {
        kind: 'inpaint',
        mask: await canvasBase64(mask),
        prompt,
        negative,
        strength: tools.inpaintStrength,
        keepOriginal: tools.keepOriginal,
        model,
    };
}
