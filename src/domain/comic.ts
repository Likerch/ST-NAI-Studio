// Comic mode for V5 (TZ Phase 6, RECON P-19): NovelAI has no multi-panel parameters, so every
// panel is its own generation at the panel's aspect ratio and the page is assembled locally.
// In-image text goes into a `text:` block of the panel prompt and is counted separately.
import { FREE_MAX_PIXELS } from './cost';
import { fitArea, MIN_SIDE, SIZE_STEP } from './sizes';

export interface PanelRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ComicLayout {
    id: string;
    panels: PanelRect[];
}

const row = (y: number, h: number, cols: number): PanelRect[] =>
    Array.from({ length: cols }, (_, i) => ({ x: i / cols, y, w: 1 / cols, h }));

export const COMIC_LAYOUTS: ComicLayout[] = [
    { id: 'single', panels: [{ x: 0, y: 0, w: 1, h: 1 }] },
    { id: 'two-rows', panels: [...row(0, 0.5, 1), ...row(0.5, 0.5, 1)] },
    { id: 'two-columns', panels: row(0, 1, 2) },
    { id: 'four-koma', panels: [0, 1, 2, 3].flatMap((i) => row(i / 4, 1 / 4, 1)) },
    { id: 'grid-4', panels: [...row(0, 0.5, 2), ...row(0.5, 0.5, 2)] },
    { id: 'hero-top', panels: [...row(0, 0.55, 1), ...row(0.55, 0.45, 2)] },
    { id: 'grid-6', panels: [...row(0, 1 / 3, 2), ...row(1 / 3, 1 / 3, 2), ...row(2 / 3, 1 / 3, 2)] },
];

export function comicLayout(id: string): ComicLayout {
    return COMIC_LAYOUTS.find((l) => l.id === id) ?? (COMIC_LAYOUTS[4] as ComicLayout);
}

export interface PixelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Panel rectangles on the page in pixels, with `gutter` px between panels and around the page. */
export function panelPixels(layout: ComicLayout, page: { width: number; height: number }, gutter: number): PixelRect[] {
    return layout.panels.map((p) => {
        const x0 = Math.round(p.x * page.width + gutter * (p.x === 0 ? 1 : 0.5));
        const y0 = Math.round(p.y * page.height + gutter * (p.y === 0 ? 1 : 0.5));
        const x1 = Math.round((p.x + p.w) * page.width - gutter * (p.x + p.w >= 0.999 ? 1 : 0.5));
        const y1 = Math.round((p.y + p.h) * page.height - gutter * (p.y + p.h >= 0.999 ? 1 : 0.5));
        return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
    });
}

/** Request size of a panel: its aspect ratio, multiples of 64, as large as `maxPixels` allows. */
export function panelRequestSize(
    panel: { width: number; height: number },
    maxPixels = FREE_MAX_PIXELS,
): { width: number; height: number } {
    const aspect = panel.width / panel.height;
    const height = Math.sqrt(maxPixels / aspect) * 1.5;
    const big = {
        width: Math.round((height * aspect) / SIZE_STEP) * SIZE_STEP,
        height: Math.round(height / SIZE_STEP) * SIZE_STEP,
    };
    const fitted = fitArea(Math.max(MIN_SIDE, big.width), Math.max(MIN_SIDE, big.height), maxPixels);
    return { width: Math.max(MIN_SIDE, fitted.width), height: Math.max(MIN_SIDE, fitted.height) };
}

export interface ComicPanel {
    prompt: string;
    /** Lines of in-image text (speech, captions, sound effects). */
    text: string[];
}

export function panelTextBlock(panel: ComicPanel): string {
    return panel.text
        .map((t) => t.trim())
        .filter(Boolean)
        .join('\n\n');
}

/** Panel prompt: page style, panel content, then the `text:` block (which must stay last). */
export function panelPrompt(style: string, panel: ComicPanel): string {
    const body = [style, panel.prompt]
        .map((p) => p.trim().replace(/[\s,]+$/, ''))
        .filter(Boolean)
        .join(', ');
    const text = panelTextBlock(panel);
    return text ? `${body}${body ? ', ' : ''}text: ${text}` : body;
}
