// Comic mode dialog for V5 (TZ Phase 6): layout, page, style, a prompt and text lines per panel
// with the in-image text tokens counted separately, then one generation per panel.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { saveSettings, settings } from '../core/settings';
import { COMIC_LAYOUTS, comicLayout, MODELS, panelTextBlock, tokenLimit } from '../domain';
import type { ComicPanel, ModelId } from '../domain';
import type { ComicService } from '../features/comic/comic-service';
import { APPROXIMATE, loadTokenizer, readyTokenizer } from '../features/prompt-tools/tokenizers';
import { escapeHtml } from './components/dom';

const V5_MODELS = MODELS.filter((m) => m.id.startsWith('nai-diffusion-5'));

function layoutPreview(id: string): string {
    const layout = comicLayout(id);
    return `<svg viewBox="0 0 40 60" class="naist-comic-thumb">${layout.panels
        .map(
            (p) =>
                `<rect x="${p.x * 40 + 1}" y="${p.y * 60 + 1}" width="${p.w * 40 - 2}" height="${p.h * 60 - 2}" rx="1"></rect>`,
        )
        .join('')}</svg>`;
}

export async function openComicDialog(service: ComicService): Promise<void> {
    const c = ctx();
    const s = settings().comic;
    const current = settings().generation.model;
    const model = V5_MODELS.some((m) => m.id === current) ? current : 'nai-diffusion-5-full';
    let panels: ComicPanel[] = [];
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-comic';
    root.innerHTML = `
        <h3>${escapeHtml(t('naist.comic.title'))}</h3>
        <div class="naist-hint">${escapeHtml(t('naist.comic.hint'))}</div>
        <div class="naist-comic-layouts">${COMIC_LAYOUTS.map(
            (
                l,
            ) => `<label class="naist-comic-layout${l.id === s.layout ? ' naist-tab-active' : ''}" title="${escapeHtml(t(`naist.comic.layout.${l.id}`))}">
                <input type="radio" name="naist_comic_layout" value="${l.id}"${l.id === s.layout ? ' checked' : ''}>${layoutPreview(l.id)}</label>`,
        ).join('')}</div>
        <div class="naist-grid3">
            <div><label>${escapeHtml(t('naist.comic.pageWidth'))}</label><input type="number" min="256" max="4096" step="16" class="text_pole naist-comic-w" value="${s.pageWidth}"></div>
            <div><label>${escapeHtml(t('naist.comic.pageHeight'))}</label><input type="number" min="256" max="4096" step="16" class="text_pole naist-comic-h" value="${s.pageHeight}"></div>
            <div><label>${escapeHtml(t('naist.comic.gutter'))}</label><input type="number" min="0" max="128" class="text_pole naist-comic-gutter" value="${s.gutter}"></div>
        </div>
        <div class="naist-grid2">
            <div><label>${escapeHtml(t('naist.comic.style'))}</label><input class="text_pole naist-comic-style" value="${escapeHtml(s.style)}"></div>
            <div><label>${escapeHtml(t('naist.panel.model'))}</label><select class="text_pole naist-comic-model">${V5_MODELS.map(
                (m) =>
                    `<option value="${m.id}"${m.id === model ? ' selected' : ''}>${escapeHtml(t(m.nameKey))}</option>`,
            ).join('')}</select></div>
        </div>
        <div class="naist-comic-panels"></div>
        <div class="naist-row">
            <div class="menu_button naist-comic-run">${escapeHtml(t('naist.comic.run'))}</div>
            <span class="naist-muted naist-comic-status"></span>
        </div>`;

    const layoutId = () =>
        root.querySelector<HTMLInputElement>('input[name="naist_comic_layout"]:checked')?.value ?? s.layout;
    const modelId = () => (root.querySelector('.naist-comic-model') as HTMLSelectElement).value as ModelId;
    const counter = () => readyTokenizer('qwen') ?? APPROXIMATE;

    const readPanels = () => {
        panels = [...root.querySelectorAll<HTMLElement>('.naist-comic-panel')].map((el) => ({
            prompt: (el.querySelector('.naist-comic-prompt') as HTMLTextAreaElement).value,
            text: (el.querySelector('.naist-comic-text') as HTMLTextAreaElement).value.split('\n'),
        }));
    };
    const updateCounts = () => {
        readPanels();
        const limit = tokenLimit(modelId());
        const approx = !readyTokenizer('qwen');
        root.querySelectorAll<HTMLElement>('.naist-comic-panel').forEach((el, i) => {
            const panel = panels[i];
            const info = el.querySelector('.naist-comic-count');
            if (!panel || !info) return;
            const style = (root.querySelector('.naist-comic-style') as HTMLInputElement).value;
            const total = counter().count(`${style}, ${panel.prompt}`) + counter().count(panelTextBlock(panel));
            info.textContent = t('naist.comic.tokens', {
                text: `${approx ? '≈' : ''}${counter().count(panelTextBlock(panel))}`,
                total: `${approx ? '≈' : ''}${total}`,
                limit,
            });
            info.classList.toggle('naist-warning', total > limit);
        });
    };
    const renderPanels = () => {
        const count = comicLayout(layoutId()).panels.length;
        const box = root.querySelector('.naist-comic-panels') as HTMLElement;
        box.innerHTML = Array.from({ length: count }, (_, i) => {
            const p = panels[i] ?? { prompt: '', text: [] };
            return `<div class="naist-section naist-comic-panel">
                <b>${escapeHtml(t('naist.comic.panel', { n: i + 1 }))}</b>
                <textarea class="text_pole textarea_compact naist-comic-prompt" rows="2" placeholder="${escapeHtml(t('naist.comic.promptPlaceholder'))}">${escapeHtml(p.prompt)}</textarea>
                <textarea class="text_pole textarea_compact naist-comic-text" rows="2" placeholder="${escapeHtml(t('naist.comic.textPlaceholder'))}">${escapeHtml(p.text.join('\n'))}</textarea>
                <div class="naist-muted naist-comic-count"></div>
            </div>`;
        }).join('');
        updateCounts();
    };

    const abort = new AbortController();
    let running = false;
    root.addEventListener('change', (event) => {
        const el = event.target as HTMLElement;
        if (el.matches('input[name="naist_comic_layout"]')) {
            readPanels();
            root.querySelectorAll('.naist-comic-layout').forEach((l) =>
                l.classList.toggle('naist-tab-active', l.contains(el)),
            );
            renderPanels();
        }
    });
    root.addEventListener('input', () => updateCounts());
    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        if (!el.classList.contains('naist-comic-run') || running) return;
        readPanels();
        const status = root.querySelector('.naist-comic-status') as HTMLElement;
        s.layout = layoutId();
        s.pageWidth = Number((root.querySelector('.naist-comic-w') as HTMLInputElement).value) || s.pageWidth;
        s.pageHeight = Number((root.querySelector('.naist-comic-h') as HTMLInputElement).value) || s.pageHeight;
        s.gutter = Math.max(0, Number((root.querySelector('.naist-comic-gutter') as HTMLInputElement).value) || 0);
        s.style = (root.querySelector('.naist-comic-style') as HTMLInputElement).value;
        saveSettings();
        running = true;
        el.classList.add('disabled');
        void service
            .generate({
                layout: s.layout,
                page: { width: s.pageWidth, height: s.pageHeight },
                gutter: s.gutter,
                style: s.style,
                model: modelId(),
                panels,
                signal: abort.signal,
                onProgress: (done, total) => (status.textContent = t('naist.comic.progress', { done, total })),
            })
            .then((result) => {
                if (result) toastr.success(t('naist.comic.done', { count: result.panels }), t('naist.comic.title'));
            })
            .catch(reportGenerationError)
            .finally(() => {
                running = false;
                el.classList.remove('disabled');
            });
    });
    void loadTokenizer('qwen').then(() => updateCounts());
    renderPanels();
    localize(root);
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        okButton: t('naist.sprites.close'),
    });
    abort.abort();
}
