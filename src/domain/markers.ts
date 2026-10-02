// Image markers written by the chat model inside its reply (TZ Phase 7, docs/research). The main
// format is `<img data-nai='{json}'>`; older formats are accepted so existing presets and chats
// keep working: a `/gen?prompt=…` image URL, sillyimages' `data-iig-instruction` / `[IMG:GEN:{…}]`
// and Auto Illustrator's `<!--img-prompt="…"-->`. A `<figure>` around a marker is consumed with it
// and its `<figcaption>` becomes the caption. Pure.
import { FREE_MAX_PIXELS } from './cost';
import { isModelId } from './models';
import type { ModelId } from './models';
import { fitArea, MIN_SIDE, SIZE_STEP } from './sizes';
import type { DisplayOptions } from './inline';
import type { Point } from './types';

export type MarkerFormat = 'nai' | 'legacy-url' | 'iig' | 'comment';

export interface MarkerCharacter {
    name: string;
    /** left / center / right / top / bottom, or "x,y" in 0..1. */
    pos?: string;
    pose?: string;
    action?: string;
}

export interface MarkerParams {
    prompt: string;
    negative?: string;
    chars?: MarkerCharacter[];
    ratio?: string;
    size?: string;
    model?: string;
    style?: string;
    /** Words written in the picture (the `Text:` block). */
    text?: string;
    caption?: string;
    spoiler?: boolean;
    align?: string;
    width?: number;
    seed?: number;
    steps?: number;
    scale?: number;
    sampler?: string;
    rescale?: number;
    variety?: boolean;
    quality?: boolean;
    uc?: string;
    transparent?: boolean;
    location?: string;
    /** Id of an earlier image of the chat to use as the img2img base. */
    ref?: string;
    vibe?: string;
    count?: number;
    id?: string;
}

export interface MarkerMatch {
    /** Range in the text that the marker (with its <figure>, if any) occupies. */
    start: number;
    end: number;
    format: MarkerFormat;
    params: MarkerParams;
}

const ENTITIES: Record<string, string> = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>', nbsp: ' ' };

export function decodeHtmlEntities(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
            return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
        }
        return ENTITIES[body.toLowerCase()] ?? whole;
    });
}

/** End index (exclusive) of an HTML tag starting at `start` (`<`), quotes respected; -1 if unfinished. */
function tagEnd(text: string, start: number): number {
    let quote = '';
    for (let i = start + 1; i < text.length; i++) {
        const c = text[i] as string;
        if (quote) {
            if (c === quote) quote = '';
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === '>') {
            return i + 1;
        } else if (c === '<') {
            return -1;
        }
    }
    return -1;
}

/** Attributes of a tag: name → raw value (entities decoded), lenient about quotes. */
export function parseAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const body = tag.replace(/^<\s*[\w-]+/, '').replace(/\/?>$/, '');
    const re = /([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    for (const m of body.matchAll(re)) {
        const name = (m[1] as string).toLowerCase();
        const value = m[3] ?? m[4] ?? m[5] ?? '';
        attrs[name] = decodeHtmlEntities(value);
    }
    return attrs;
}

/** JSON as models write it: strict first, then with single quotes and trailing commas fixed, then key: value scanning. */
export function parseLooseJson(text: string): Record<string, unknown> | null {
    const source = decodeHtmlEntities(text.trim());
    const attempts = [
        source,
        source.replace(/,\s*([}\]])/g, '$1'),
        source.replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1'),
    ];
    for (const attempt of attempts) {
        try {
            const value = JSON.parse(attempt) as unknown;
            if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
        } catch {
            // next attempt
        }
    }
    // Relaxed scan: "key": "value" | number | true/false | [ ... ].
    const out: Record<string, unknown> = {};
    const re =
        /["']?([A-Za-z_][\w-]*)["']?\s*:\s*("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(-?\d+(?:\.\d+)?)|(true|false)|(\[[^\]]*\]))/g;
    for (const m of source.matchAll(re)) {
        const key = m[1] as string;
        if (m[3] !== undefined || m[4] !== undefined) out[key] = (m[3] ?? m[4] ?? '').replace(/\\(["'\\])/g, '$1');
        else if (m[5] !== undefined) out[key] = Number(m[5]);
        else if (m[6] !== undefined) out[key] = m[6] === 'true';
        else if (m[7] !== undefined) {
            try {
                out[key] = JSON.parse((m[7] as string).replace(/'/g, '"')) as unknown;
            } catch {
                out[key] = (m[7] as string)
                    .slice(1, -1)
                    .split(',')
                    .map((s) => s.trim().replace(/^["']|["']$/g, ''));
            }
        }
    }
    return Object.keys(out).length ? out : null;
}

const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : undefined;
const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
};
const bool = (v: unknown): boolean | undefined =>
    typeof v === 'boolean' ? v : v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : undefined;
const pick = (o: Record<string, unknown>, ...keys: string[]) =>
    keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');

function characters(value: unknown): MarkerCharacter[] | undefined {
    const list = typeof value === 'string' ? value.split(/[,;]/) : Array.isArray(value) ? value : [];
    const out: MarkerCharacter[] = [];
    for (const item of list) {
        if (typeof item === 'string' && item.trim()) out.push({ name: item.trim() });
        else if (item && typeof item === 'object') {
            const o = item as Record<string, unknown>;
            const name = str(pick(o, 'name', 'who', 'character'));
            if (!name) continue;
            const ch: MarkerCharacter = { name };
            const pos = str(pick(o, 'pos', 'position'));
            const pose = str(o.pose);
            const action = str(o.action);
            if (pos) ch.pos = pos;
            if (pose) ch.pose = pose;
            if (action) ch.action = action;
            out.push(ch);
        }
    }
    return out.length ? out : undefined;
}

/** Marker parameters from any key spelling models use; unknown keys are ignored. */
export function normalizeParams(o: Record<string, unknown>): MarkerParams | null {
    const prompt = str(pick(o, 'prompt', 'description', 'desc', 'scene', 'image'));
    if (!prompt) return null;
    const p: MarkerParams = { prompt };
    const set = <K extends keyof MarkerParams>(key: K, value: MarkerParams[K] | undefined) => {
        if (value !== undefined) p[key] = value;
    };
    set('negative', str(pick(o, 'negative', 'neg', 'uc', 'undesired')));
    set('chars', characters(pick(o, 'chars', 'characters', 'who')));
    set('ratio', str(pick(o, 'ratio', 'aspect', 'aspect_ratio', 'aspectRatio', 'orientation')));
    set('size', str(pick(o, 'size', 'image_size', 'imageSize', 'resolution')));
    set('model', str(o.model));
    set('style', str(pick(o, 'style', 'preset')));
    set('text', str(pick(o, 'text', 'text_in_image', 'sign')));
    set('caption', str(pick(o, 'caption', 'title', 'figcaption')));
    set('spoiler', bool(o.spoiler));
    set('align', str(o.align));
    set('width', num(o.width));
    set('seed', num(o.seed));
    set('steps', num(o.steps));
    set('scale', num(pick(o, 'scale', 'guidance', 'cfg')));
    set('sampler', str(o.sampler));
    set('rescale', num(pick(o, 'rescale', 'cfg_rescale')));
    set('variety', bool(pick(o, 'variety', 'variety_boost')));
    set('quality', bool(pick(o, 'quality', 'quality_tags')));
    set('uc', str(pick(o, 'uc_preset', 'ucPreset')));
    set('transparent', bool(pick(o, 'transparent', 'transparency')));
    set('location', str(pick(o, 'location', 'place')));
    set('ref', str(pick(o, 'ref', 'base', 'from')));
    set('vibe', str(o.vibe));
    set('count', num(pick(o, 'count', 'n', 'variants')));
    set('id', str(o.id));
    return p;
}

/** Underscored URL tags (`white_hair,golden_eyes`) back to NovelAI's spelling (`white hair, golden eyes`). */
function urlTags(text: string): string {
    return text
        .split(',')
        .map((t) => t.trim().replace(/_/g, ' '))
        .filter(Boolean)
        .join(', ');
}

function fromLegacyUrl(src: string): MarkerParams | null {
    const q = src.indexOf('?');
    if (q < 0 || !/\/gen$/.test(src.slice(0, q).replace(/\/+$/, ''))) return null;
    const query = new URLSearchParams(src.slice(q + 1));
    const prompt = query.get('prompt');
    if (!prompt) return null;
    const style = query.get('style');
    const o: Record<string, unknown> = { prompt: urlTags(prompt) };
    if (style) o.style = urlTags(style);
    for (const key of ['negative', 'model', 'ratio', 'size', 'seed', 'steps', 'scale']) {
        const v = query.get(key);
        if (v) o[key] = key === 'negative' ? urlTags(v) : v;
    }
    return normalizeParams(o);
}

/** `<figure>` that wraps [start, end) with only whitespace between; its range and figcaption text. */
function figureAround(
    text: string,
    start: number,
    end: number,
): { start: number; end: number; caption?: string } | null {
    const before = text.slice(0, start);
    const open = before.match(/<figure\b[^>]*>\s*$/i);
    if (!open || open.index === undefined) return null;
    const rest = text.slice(end);
    const close = rest.match(/^\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>\s*)?<\/figure>/i);
    if (!close) return null;
    const caption = close[1] ? decodeHtmlEntities(close[1].replace(/<[^>]+>/g, '')).trim() : undefined;
    return { start: open.index, end: end + close[0].length, ...(caption ? { caption } : {}) };
}

function withFigure(text: string, match: MarkerMatch): MarkerMatch {
    const figure = figureAround(text, match.start, match.end);
    if (!figure) return match;
    const params =
        figure.caption && !match.params.caption ? { ...match.params, caption: figure.caption } : match.params;
    return { ...match, start: figure.start, end: figure.end, params };
}

/** Every complete marker in the text, in order. Plain `<img>` tags that are not markers are left alone. */
export function findMarkers(text: string): MarkerMatch[] {
    const found: MarkerMatch[] = [];
    const imgTag = /<img\b/gi;
    for (let m = imgTag.exec(text); m; m = imgTag.exec(text)) {
        const end = tagEnd(text, m.index);
        if (end < 0) continue;
        const attrs = parseAttributes(text.slice(m.index, end));
        let params: MarkerParams | null = null;
        let format: MarkerFormat | null = null;
        if ('data-nai' in attrs) {
            const json = parseLooseJson(attrs['data-nai'] as string);
            params = json ? normalizeParams(json) : normalizeParams({ prompt: attrs['data-nai'] });
            format = 'nai';
        } else if ('data-iig-instruction' in attrs) {
            const json = parseLooseJson(attrs['data-iig-instruction'] as string);
            params = json ? normalizeParams(json) : null;
            format = 'iig';
        } else if (attrs.src && /\/gen\?/.test(attrs.src)) {
            params = fromLegacyUrl(attrs.src);
            format = 'legacy-url';
        }
        if (params && format) found.push(withFigure(text, { start: m.index, end, format, params }));
        imgTag.lastIndex = end;
    }
    // [IMG:GEN:{json}] with balanced braces.
    for (let i = text.indexOf('[IMG:GEN:'); i >= 0; i = text.indexOf('[IMG:GEN:', i + 1)) {
        const open = i + '[IMG:GEN:'.length;
        if (text[open] !== '{') continue;
        let depth = 0;
        let quote = '';
        let close = -1;
        for (let j = open; j < text.length; j++) {
            const c = text[j] as string;
            if (quote) {
                if (c === '\\') j++;
                else if (c === quote) quote = '';
            } else if (c === '"') quote = c;
            else if (c === '{') depth++;
            else if (c === '}' && --depth === 0) {
                close = j;
                break;
            }
        }
        if (close < 0 || text[close + 1] !== ']') continue;
        const json = parseLooseJson(text.slice(open, close + 1));
        const params = json ? normalizeParams(json) : null;
        if (params) found.push({ start: i, end: close + 2, format: 'iig', params });
    }
    for (const m of text.matchAll(/<!--\s*img-prompt="((?:[^"\\]|\\.)*)"\s*-->/g)) {
        const prompt = (m[1] as string).replace(/\\"/g, '"');
        if (prompt.trim() && m.index !== undefined) {
            found.push(
                withFigure(text, {
                    start: m.index,
                    end: m.index + m[0].length,
                    format: 'comment',
                    params: { prompt: prompt.trim() },
                }),
            );
        }
    }
    // Ordered by position; overlapping matches (a figure counted twice) keep the first.
    found.sort((a, b) => a.start - b.start);
    return found.filter((f, i) => i === 0 || f.start >= (found[i - 1] as MarkerMatch).end);
}

/**
 * Where an unfinished marker begins at the end of a streaming text (so it can be hidden until it
 * is complete), or -1: an open <figure>, an unclosed <img or comment, an unbalanced [IMG:GEN:,
 * or the first letters of one of them at the very end.
 */
export function partialMarkerStart(text: string): number {
    const starts: number[] = [];
    const lastFigure = text.toLowerCase().lastIndexOf('<figure');
    if (lastFigure >= 0 && !/<\/figure>/i.test(text.slice(lastFigure))) starts.push(lastFigure);
    const lastImg = text.toLowerCase().lastIndexOf('<img');
    if (lastImg >= 0 && tagEnd(text, lastImg) < 0) starts.push(lastImg);
    const lastComment = text.lastIndexOf('<!--');
    if (lastComment >= 0 && !text.includes('-->', lastComment)) starts.push(lastComment);
    const lastGen = text.lastIndexOf('[IMG:GEN:');
    if (lastGen >= 0 && !findMarkers(text.slice(lastGen)).some((m) => m.start === 0)) starts.push(lastGen);
    const tail = text.match(/(?:<|<i|<im|<f|<fi|<fig|<figu|<figur|<!|<!-|\[|\[I|\[IM|\[IMG|\[IMG:[A-Z:]*)$/i);
    if (tail?.index !== undefined) starts.push(tail.index);
    return starts.length ? Math.min(...starts) : -1;
}

/** Replaces marker ranges right to left (so earlier indices stay valid). */
export function replaceMarkers(
    text: string,
    markers: MarkerMatch[],
    replacement: (m: MarkerMatch, i: number) => string,
): string {
    let out = text;
    for (let i = markers.length - 1; i >= 0; i--) {
        const m = markers[i] as MarkerMatch;
        out = out.slice(0, m.start) + replacement(m, i) + out.slice(m.end);
    }
    return out;
}

export const MODEL_ALIASES: Record<string, ModelId> = {
    v5: 'nai-diffusion-5-full',
    'v5-full': 'nai-diffusion-5-full',
    v5c: 'nai-diffusion-5-curated',
    'v5-curated': 'nai-diffusion-5-curated',
    'v4.5': 'nai-diffusion-4-5-full',
    v45: 'nai-diffusion-4-5-full',
    'v4.5-full': 'nai-diffusion-4-5-full',
    'v4.5c': 'nai-diffusion-4-5-curated',
    'v4.5-curated': 'nai-diffusion-4-5-curated',
    v4: 'nai-diffusion-4-full',
    'v4-full': 'nai-diffusion-4-full',
    v4c: 'nai-diffusion-4-curated-preview',
    'v4-curated': 'nai-diffusion-4-curated-preview',
    v3: 'nai-diffusion-3',
    anime: 'nai-diffusion-3',
    furry: 'nai-diffusion-furry-3',
};

export function markerModel(value: string | undefined): ModelId | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();
    if (isModelId(v)) return v;
    return MODEL_ALIASES[v];
}

const RATIO_ALIASES: Record<string, [number, number]> = {
    portrait: [2, 3],
    vertical: [2, 3],
    landscape: [3, 2],
    horizontal: [3, 2],
    square: [1, 1],
    wide: [16, 9],
    tall: [9, 16],
};

export function parseRatio(value: string | undefined): [number, number] {
    const v = (value ?? '').trim().toLowerCase();
    const alias = RATIO_ALIASES[v];
    if (alias) return alias;
    const m = v.match(/^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/);
    const a = m ? Number(m[1]) : 0;
    const b = m ? Number(m[2]) : 0;
    return a > 0 && b > 0 ? [a, b] : [2, 3];
}

/** Pixel budget of a size: 1K ≈ 1 MP (free on Opus), 2K ≈ 2 MP, 3K/4K = NovelAI's maximum. */
export function sizeArea(value: string | undefined): number | { width: number; height: number } {
    const v = (value ?? '').trim().toUpperCase();
    if (!v || v === '1K' || v === 'FREE' || v === 'NORMAL') return FREE_MAX_PIXELS;
    if (v === '2K' || v === 'LARGE') return 2097152;
    if (v === '3K' || v === '4K' || v === 'WALLPAPER' || v === 'MAX') return 3145728;
    const dims = v.match(/^(\d+)\s*[X×*]\s*(\d+)$/);
    if (dims) return { width: Number(dims[1]), height: Number(dims[2]) };
    const edge = Number(v);
    if (Number.isFinite(edge) && edge >= MIN_SIDE) return Math.min(3145728, edge * edge);
    return FREE_MAX_PIXELS;
}

/**
 * Request size for a marker: the ratio within the size's pixel budget, multiples of 64, never above
 * 1 MP in free-only mode (rounded down, unlike the old microservice which could overshoot).
 */
export function markerDimensions(
    ratio: string | undefined,
    size: string | undefined,
    freeOnly: boolean,
): { width: number; height: number } {
    const area = sizeArea(size);
    const limit = freeOnly ? FREE_MAX_PIXELS : 3145728;
    if (typeof area === 'object') {
        const round = (n: number) => Math.max(MIN_SIDE, Math.round(n / SIZE_STEP) * SIZE_STEP);
        const w = round(area.width);
        const h = round(area.height);
        return w * h <= limit ? { width: w, height: h } : fitArea(w, h, limit);
    }
    const [a, b] = parseRatio(ratio);
    return fitArea(Math.round(a * 4096), Math.round(b * 4096), Math.min(area, limit));
}

/** At most `max` markers per reply (the rest are dropped from the text). */
export function limitMarkers(markers: MarkerMatch[], max: number): { keep: MarkerMatch[]; drop: MarkerMatch[] } {
    const n = Math.max(0, Math.floor(max));
    return { keep: markers.slice(0, n), drop: markers.slice(n) };
}

const AXIS: Record<string, { x?: number; y?: number }> = {
    'far left': { x: 0.1 },
    left: { x: 0.3 },
    center: { x: 0.5 },
    centre: { x: 0.5 },
    middle: { x: 0.5 },
    right: { x: 0.7 },
    'far right': { x: 0.9 },
    top: { y: 0.3 },
    upper: { y: 0.3 },
    bottom: { y: 0.7 },
    lower: { y: 0.7 },
};

/**
 * A character position written in a marker: the NovelAI grid ("C3": columns A-E, rows 1-5),
 * words ("left", "top right", "far left") or "x,y" between 0 and 1. Null when not understood.
 */
export function markerPosition(pos: string | undefined): Point | null {
    const v = (pos ?? '').trim().toLowerCase();
    if (!v) return null;
    const grid = v.match(/^([a-e])\s*([1-5])$/);
    if (grid) return { x: 0.1 + 0.2 * (grid[1]!.charCodeAt(0) - 97), y: 0.1 + 0.2 * (Number(grid[2]) - 1) };
    const xy = v.match(/^(0(?:\.\d+)?|1(?:\.0+)?)\s*[,;\s]\s*(0(?:\.\d+)?|1(?:\.0+)?)$/);
    if (xy) return { x: Number(xy[1]), y: Number(xy[2]) };
    const point = { x: 0.5, y: 0.5 };
    let known = false;
    let rest = v.replace(/[-_]/g, ' ');
    for (const word of Object.keys(AXIS).sort((a, b) => b.length - a.length)) {
        if (!new RegExp(`(^|\\s)${word}(\\s|$)`).test(rest)) continue;
        Object.assign(point, AXIS[word]);
        rest = rest.replace(word, ' ');
        known = true;
    }
    return known ? { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 } : null;
}

/** Parameters that only change how an image is shown (not what is generated). */
const DISPLAY_KEYS = new Set<string>(['caption', 'spoiler', 'align', 'width', 'id']);

/**
 * Identity of what a marker generates: while a reply streams, a marker can grow (a figcaption
 * arrives after the <img>), and that must not start a second generation.
 */
export function markerGenerationKey(params: MarkerParams): string {
    const record = params as unknown as Record<string, unknown>;
    return JSON.stringify(
        Object.keys(record)
            .filter((k) => !DISPLAY_KEYS.has(k) && record[k] !== undefined)
            .sort()
            .map((k) => [k, record[k]]),
    );
}

/** Display options a marker asks for (caption, spoiler, alignment, width in % up to 100, else px). */
export function markerDisplay(params: MarkerParams): Partial<DisplayOptions> {
    const display: Partial<DisplayOptions> = {};
    if (params.caption) display.caption = params.caption;
    display.alt = (params.caption || params.prompt).slice(0, 200);
    if (params.spoiler) display.spoiler = true;
    const align = params.align?.trim().toLowerCase();
    if (align === 'left' || align === 'right' || align === 'center') display.align = align;
    if (params.width !== undefined && params.width > 0) {
        if (params.width <= 100) {
            display.width = params.width;
            display.widthUnit = '%';
        } else {
            display.width = Math.min(Math.round(params.width), 2048);
            display.widthUnit = 'px';
        }
    }
    return display;
}

/** Plain text of a reply for an automatic illustration: no HTML, placeholders or markers, cut to `max`. */
export function replyExcerpt(text: string, max = 800): string {
    const plain = replaceMarkers(text, findMarkers(text), () => ' ')
        .replace(/\[nai:img:[^\]]+\]/g, ' ')
        .replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[*_~`#>]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (plain.length <= max) return plain;
    const cut = plain.slice(0, max);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return (end > max / 2 ? cut.slice(0, end + 1) : cut).trim();
}
