// Inline images (TZ Phase 3): the message text holds a `[nai:img:<id>]` placeholder and the image
// itself lives in `extra.nai_images[]`. Pure text/entry manipulation, no DOM and no storage.
// Placeholders survive ST formatting unchanged (RECON §2.3); the id must not be followed by "(".

/** Parameters an inline image was generated with (what the lightbox and "repeat" need). */
export interface InlineGenerationMeta {
    /** Scene prompt before prefix/suffix and character prompt. */
    scenePrompt: string;
    /** Final positive prompt sent to NovelAI. */
    prompt: string;
    /** Final undesired content sent to NovelAI. */
    negativePrompt: string;
    /** Extra undesired content given for this image only. */
    negative: string;
    mode: number;
    model: string;
    seed: number;
    width: number;
    height: number;
    steps: number;
    scale: number;
    cfgRescale: number;
    sampler: string;
    noiseSchedule: string;
    ucPreset: string;
    qualityPreset: string;
    requestType: 'txt2img' | 'img2img' | 'inpaint' | 'director' | 'upscale';
    characters: { prompt: string; negative: string; x: number; y: number }[];
    transport: string;
    cost: number;
    createdAt: string;
    /** Original prompt before RU->EN translation (Phase 6), if any. */
    sourcePrompt?: string;
    /** Director tool or other post-processing that produced this image. */
    tool?: string;
}

export interface InlineSwipe {
    /** Key of the full image in IndexedDB; empty when the browser copy was not kept. */
    blobKey: string;
    /** Path in /user/images; empty when the server copy was not saved. */
    filePath: string;
    mime: string;
    meta: InlineGenerationMeta;
}

export type InlineAlign = 'left' | 'center' | 'right';
export type InlineLayout = 'grid' | 'carousel' | 'list';

export interface DisplayOptions {
    width: number;
    widthUnit: '%' | 'px';
    align: InlineAlign;
    /** Float so the text wraps around the image (left/right alignment only). */
    wrap: boolean;
    caption: string;
    alt: string;
    border: boolean;
    radius: number;
    /** Blurred until clicked. */
    spoiler: boolean;
    /** Layout of the run of images this one starts (grid / carousel / list). */
    layout: InlineLayout;
}

/** TZ shape: the active swipe is mirrored in blobKey/filePath/meta for simple readers. */
export interface InlineImage {
    id: string;
    blobKey: string;
    filePath?: string;
    meta: InlineGenerationMeta;
    swipes: InlineSwipe[];
    activeSwipe: number;
    display: DisplayOptions;
}

export const PLACEHOLDER_PATTERN = /\[nai:img:([0-9a-zA-Z-]{6,64})\]/g;

export function placeholder(id: string): string {
    return `[nai:img:${id}]`;
}

export interface PlaceholderMatch {
    id: string;
    index: number;
    length: number;
}

export function findPlaceholders(text: string): PlaceholderMatch[] {
    const result: PlaceholderMatch[] = [];
    for (const match of text.matchAll(new RegExp(PLACEHOLDER_PATTERN.source, 'g'))) {
        result.push({ id: match[1] ?? '', index: match.index ?? 0, length: match[0].length });
    }
    return result;
}

export function placeholderIds(text: string): string[] {
    return findPlaceholders(text).map((m) => m.id);
}

/**
 * Inserts a placeholder at a character offset. A placeholder directly followed by "(" would
 * become a Markdown link, so a space is added in that case; the offset is clamped to the text.
 */
export function insertPlaceholder(text: string, id: string, offset: number = text.length): string {
    const at = Math.max(0, Math.min(text.length, Math.round(offset)));
    const before = text.slice(0, at);
    const after = text.slice(at);
    // Never split an existing placeholder.
    for (const match of findPlaceholders(text)) {
        if (at > match.index && at < match.index + match.length) {
            return insertPlaceholder(text, id, match.index + match.length);
        }
    }
    const lead = before === '' || /\s$/.test(before) ? '' : ' ';
    const trail = after === '' ? '' : after.startsWith('(') || !/^\s/.test(after) ? ' ' : '';
    return `${before}${lead}${placeholder(id)}${trail}${after}`;
}

/** Removes every occurrence of the placeholder and the spaces it leaves doubled. */
export function removePlaceholder(text: string, id: string): string {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`([ \\t]*)\\[nai:img:${escaped}\\]([ \\t]*)`, 'g');
    return text.replace(pattern, (match: string, lead: string, trail: string, offset: number, whole: string) => {
        const end = offset + match.length;
        const atLineStart = offset === 0 || whole[offset - 1] === '\n';
        const atLineEnd = end === whole.length || whole[end] === '\n';
        if (atLineStart || atLineEnd) return '';
        return lead || trail ? ' ' : '';
    });
}

/** Moves a placeholder before another one (or to the end) inside the same text. */
export function movePlaceholder(text: string, id: string, beforeId: string | null): string {
    if (id === beforeId || !placeholderIds(text).includes(id)) return text;
    const without = removePlaceholder(text, id);
    if (beforeId === null) return insertPlaceholder(without, id, without.length);
    const target = findPlaceholders(without).find((m) => m.id === beforeId);
    return target ? insertPlaceholder(without, id, target.index) : insertPlaceholder(without, id);
}

export interface Reconciled {
    text: string;
    entries: InlineImage[];
    /** Entries whose placeholder is gone from the text. */
    removedEntries: InlineImage[];
    /** Placeholders that had no entry and were removed from the text. */
    removedPlaceholders: string[];
}

/**
 * Keeps text and entries consistent after an edit, a swipe or a regeneration: entries without a
 * placeholder are dropped, orphaned placeholders are removed from the text (TZ Phase 3).
 */
export function reconcile(text: string, entries: readonly InlineImage[]): Reconciled {
    const ids = new Set(placeholderIds(text));
    const known = new Set(entries.map((e) => e.id));
    const kept: InlineImage[] = [];
    const removedEntries: InlineImage[] = [];
    for (const entry of entries) {
        if (ids.has(entry.id)) kept.push(entry);
        else removedEntries.push(entry);
    }
    const removedPlaceholders = [...ids].filter((id) => !known.has(id));
    let cleaned = text;
    for (const id of removedPlaceholders) cleaned = removePlaceholder(cleaned, id);
    return { text: cleaned, entries: kept, removedEntries, removedPlaceholders };
}

/**
 * Runs of placeholders separated only by whitespace (they render as one grid/carousel/list).
 * Single images form runs of one.
 */
export function placeholderRuns(text: string): string[][] {
    const matches = findPlaceholders(text);
    const runs: string[][] = [];
    let current: string[] = [];
    let lastEnd = -1;
    for (const match of matches) {
        const gap = lastEnd < 0 ? '' : text.slice(lastEnd, match.index);
        if (current.length > 0 && /^\s*$/.test(gap) && !/\n\s*\n/.test(gap)) {
            current.push(match.id);
        } else {
            if (current.length) runs.push(current);
            current = [match.id];
        }
        lastEnd = match.index + match.length;
    }
    if (current.length) runs.push(current);
    return runs;
}

/** How placeholders reach the LLM prompt: a short description, or nothing (RECON §2.3 item 8). */
export function textForPrompt(text: string, entries: readonly InlineImage[], mode: 'describe' | 'remove'): string {
    if (!findPlaceholders(text).length) return text;
    const byId = new Map(entries.map((e) => [e.id, e]));
    const replaced = text.replace(new RegExp(PLACEHOLDER_PATTERN.source, 'g'), (_m, id: string) => {
        if (mode === 'remove') return '';
        const entry = byId.get(id);
        const caption = entry?.display.caption.trim() || entry?.meta.scenePrompt.trim() || '';
        return caption ? `[image: ${caption}]` : '';
    });
    return replaced
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function defaultDisplay(partial: Partial<DisplayOptions> = {}): DisplayOptions {
    return {
        width: 60,
        widthUnit: '%',
        align: 'center',
        wrap: false,
        caption: '',
        alt: '',
        border: false,
        radius: 8,
        spoiler: false,
        layout: 'grid',
        ...partial,
    };
}

export function activeSwipe(entry: InlineImage): InlineSwipe | undefined {
    return entry.swipes[entry.activeSwipe] ?? entry.swipes[entry.swipes.length - 1];
}

function mirror(entry: InlineImage): InlineImage {
    const swipe = activeSwipe(entry);
    if (!swipe) return entry;
    entry.blobKey = swipe.blobKey;
    entry.meta = swipe.meta;
    if (swipe.filePath) entry.filePath = swipe.filePath;
    else delete entry.filePath;
    return entry;
}

export function createInlineImage(id: string, swipe: InlineSwipe, display: DisplayOptions): InlineImage {
    return mirror({ id, blobKey: '', meta: swipe.meta, swipes: [swipe], activeSwipe: 0, display });
}

/** Adds an alternative generation and makes it active. */
export function addSwipe(entry: InlineImage, swipe: InlineSwipe): InlineImage {
    entry.swipes.push(swipe);
    entry.activeSwipe = entry.swipes.length - 1;
    return mirror(entry);
}

export function setActiveSwipe(entry: InlineImage, index: number): InlineImage {
    const count = entry.swipes.length;
    if (count === 0) return entry;
    entry.activeSwipe = ((index % count) + count) % count;
    return mirror(entry);
}

/** Removes one swipe; returns it so its blob can be freed. The last swipe cannot be removed. */
export function removeSwipe(entry: InlineImage, index: number): InlineSwipe | null {
    if (entry.swipes.length <= 1 || index < 0 || index >= entry.swipes.length) return null;
    const [removed] = entry.swipes.splice(index, 1);
    if (entry.activeSwipe >= entry.swipes.length) entry.activeSwipe = entry.swipes.length - 1;
    else if (index < entry.activeSwipe) entry.activeSwipe -= 1;
    mirror(entry);
    return removed ?? null;
}

/** All blob keys an entry references (every swipe). */
export function entryBlobKeys(entry: InlineImage): string[] {
    return entry.swipes.map((s) => s.blobKey).filter(Boolean);
}

/** Reads `extra.nai_images` defensively (hand-edited or older chats). */
export function readEntries(extra: unknown): InlineImage[] {
    const list = (extra as { nai_images?: unknown } | undefined)?.nai_images;
    if (!Array.isArray(list)) return [];
    return list.filter(
        (e): e is InlineImage =>
            typeof e === 'object' &&
            e !== null &&
            typeof (e as InlineImage).id === 'string' &&
            Array.isArray((e as InlineImage).swipes) &&
            (e as InlineImage).swipes.length > 0,
    );
}

/** Inline CSS for the image container from its display options. */
export function displayStyle(display: DisplayOptions): Record<string, string> {
    const width = Math.max(1, display.width);
    const style: Record<string, string> = {
        width: `${display.widthUnit === '%' ? Math.min(100, width) : width}${display.widthUnit}`,
        'border-radius': `${Math.max(0, display.radius)}px`,
    };
    if (display.wrap && display.align !== 'center') {
        style.float = display.align;
        style.margin = display.align === 'left' ? '0 12px 8px 0' : '0 0 8px 12px';
    } else if (display.align === 'center') {
        style['margin-left'] = 'auto';
        style['margin-right'] = 'auto';
    } else if (display.align === 'right') {
        style['margin-left'] = 'auto';
    }
    return style;
}
