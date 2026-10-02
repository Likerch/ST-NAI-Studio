// Phase 5 domain: Director Tools request bodies and image sizing (RECON §3.13), outpaint canvas
// geometry, Enhance sizes, upscale limits. Pure.
import type { DirectorTool } from './cost';
import { fitArea, roundToStep, SIZE_STEP } from './sizes';

/** Largest request area NovelAI accepts (RECON §3.4). */
export const MAX_REQUEST_PIXELS = 3145728;

const ceilToStep = (value: number) => Math.ceil(value / SIZE_STEP) * SIZE_STEP;

export const DIRECTOR_TOOLS: readonly DirectorTool[] = [
    'lineart',
    'sketch',
    'colorize',
    'emotion',
    'declutter',
    'declutter-keep-bubbles',
    'bg-removal',
];

/** Emotions of the emotion tool (bundle:266@100814); names are localized as naist.emotion.<id>. */
export const DIRECTOR_EMOTIONS = [
    'neutral',
    'happy',
    'sad',
    'angry',
    'scared',
    'surprised',
    'tired',
    'excited',
    'nervous',
    'thinking',
    'confused',
    'shy',
    'disgusted',
    'smug',
    'bored',
    'laughing',
    'irritated',
    'aroused',
    'embarrassed',
    'worried',
    'love',
    'determined',
    'hurt',
    'playful',
] as const;
export type DirectorEmotion = (typeof DIRECTOR_EMOTIONS)[number];

/** Tools that take a prompt and the "defry" strength (0-5). */
export function toolTakesPrompt(tool: DirectorTool): boolean {
    return tool === 'colorize' || tool === 'emotion';
}

const DIRECTOR_MAX_PIXELS = 3145728 - 2000;
const DIRECTOR_MIN_PIXELS = 1011712;

/**
 * Size the image is sent at: scaled down to fit 3145728-2000 px, scaled up to ~1 MP when smaller
 * than 1011712 px (bundle:_app@1563250, bundle:266@109900). Integer sides, aspect kept.
 */
export function directorSize(width: number, height: number): { width: number; height: number } {
    const area = width * height;
    if (area <= 0) return { width: 0, height: 0 };
    let scale = 1;
    if (area > DIRECTOR_MAX_PIXELS) scale = Math.sqrt(DIRECTOR_MAX_PIXELS / area);
    else if (area < DIRECTOR_MIN_PIXELS) scale = Math.sqrt(DIRECTOR_MIN_PIXELS / area);
    let w = Math.max(1, Math.floor(width * scale));
    let h = Math.max(1, Math.floor(height * scale));
    while (w * h > DIRECTOR_MAX_PIXELS) {
        w--;
        h = Math.max(1, Math.floor((w * height) / width));
    }
    return { width: w, height: h };
}

export interface DirectorOptions {
    prompt?: string;
    emotion?: DirectorEmotion;
    /** 0..5, colorize and emotion only. */
    defry?: number;
}

/** Body of POST /ai/augment-image (image already resized to `size`). */
export function directorBody(
    tool: DirectorTool,
    image: string,
    size: { width: number; height: number },
    options: DirectorOptions = {},
): Record<string, unknown> {
    const body: Record<string, unknown> = {
        req_type: tool,
        use_new_shared_trial: true,
        width: size.width,
        height: size.height,
        image,
    };
    if (toolTakesPrompt(tool)) {
        const extra = (options.prompt ?? '').trim();
        body.prompt = tool === 'emotion' ? `${options.emotion ?? 'neutral'};;${extra}` : extra;
        body.defry = Math.min(5, Math.max(0, Math.round(options.defry ?? 0)));
    }
    return body;
}

export interface OutpaintPlan {
    width: number;
    height: number;
    /** Where the original goes on the new canvas. */
    offsetX: number;
    offsetY: number;
    /** White (repaint) rectangles of the mask, in new-canvas pixels. */
    maskRects: { x: number; y: number; w: number; h: number }[];
    /** The new canvas is larger than NovelAI accepts. */
    tooLarge: boolean;
}

/**
 * Outpaint: grows the canvas by the given margins (rounded to 64 so the request size is valid)
 * and masks the new areas, plus `overlap` pixels into the original for a seamless join.
 */
export function planOutpaint(
    width: number,
    height: number,
    grow: { left: number; right: number; top: number; bottom: number },
    overlap = 16,
): OutpaintPlan {
    const clean = (v: number) => Math.max(0, Math.round(v));
    const left = clean(grow.left);
    let right = clean(grow.right);
    const top = clean(grow.top);
    let bottom = clean(grow.bottom);
    const extraW = ceilToStep(width + left + right) - (width + left + right);
    const extraH = ceilToStep(height + top + bottom) - (height + top + bottom);
    if (extraW > 0) right += extraW;
    if (extraH > 0) bottom += extraH;
    const newWidth = width + left + right;
    const newHeight = height + top + bottom;
    const rects: OutpaintPlan['maskRects'] = [];
    const o = Math.max(0, overlap);
    if (left) rects.push({ x: 0, y: 0, w: left + o, h: newHeight });
    if (right) rects.push({ x: newWidth - right - o, y: 0, w: right + o, h: newHeight });
    if (top) rects.push({ x: 0, y: 0, w: newWidth, h: top + o });
    if (bottom) rects.push({ x: 0, y: newHeight - bottom - o, w: newWidth, h: bottom + o });
    return {
        width: newWidth,
        height: newHeight,
        offsetX: left,
        offsetY: top,
        maskRects: rects,
        tooLarge: newWidth * newHeight > MAX_REQUEST_PIXELS,
    };
}

/** Enhance target: the source scaled up, multiples of 64, capped by the maximum request area. */
export function enhanceSize(width: number, height: number, scale: number): { width: number; height: number } {
    return fitArea(roundToStep(width * scale), roundToStep(height * scale), MAX_REQUEST_PIXELS);
}

/** The web client upscales sources up to 1536x2048 (RECON §3.14). */
export function canUpscale(width: number, height: number): boolean {
    return width * height > 0 && width * height <= 1536 * 2048;
}
