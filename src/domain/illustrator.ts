// The illustrator (v0.16): another extension (Maestro's illustrator agent) may write the image markers of a
// reply instead of the chat model. Who writes them is the setting `markers.writer`:
// - "main": the chat model, as before;
// - "illustrator": the illustrator only — the marker rules leave the chat model's prompt (NAI Studio's own
//   instruction is not injected; a rules block of the preset is cut out of the prompt), and the illustrator
//   is given those same rules;
// - "fallback": the chat model as before; the illustrator only for a reply without a marker.
// Pure helpers: the rules blocks of a prompt and the place a picture goes after a sentence of the reply.

export type MarkerWriter = 'main' | 'illustrator' | 'fallback';

export const MARKER_WRITERS: readonly MarkerWriter[] = ['main', 'illustrator', 'fallback'];

export function isMarkerWriter(value: unknown): value is MarkerWriter {
    return typeof value === 'string' && (MARKER_WRITERS as readonly string[]).includes(value);
}

/** Tags of a reply's own HTML (a figure around a marker), never a rules block of the preset. */
const CONTENT_TAGS = new Set([
    'img',
    'figure',
    'figcaption',
    'div',
    'span',
    'p',
    'br',
    'details',
    'summary',
    'b',
    'i',
    'em',
    'strong',
    'code',
    'pre',
    'font',
    'small',
    'a',
]);

/** A rules block longer than this is not cut: it is most likely a wrapper of the whole preset. */
export const MAX_RULES_BLOCK = 6000;

export interface RulesBlock {
    start: number;
    end: number;
    text: string;
}

/**
 * The blocks of a prompt text that teach the chat model the marker format: the smallest element
 * `<name …>…</name>` (not a reply's own HTML) around each `data-nai`, as presets wrap their rules
 * (`<images>…</images>`). A `data-nai` outside any such element is no block (nothing is cut then).
 */
export function findRulesBlocks(text: string): RulesBlock[] {
    const blocks: RulesBlock[] = [];
    let from = 0;
    for (;;) {
        const at = text.indexOf('data-nai', from);
        if (at < 0) break;
        const block = enclosing(text, at);
        if (block) {
            blocks.push(block);
            from = block.end;
        } else from = at + 8;
    }
    return blocks;
}

function enclosing(text: string, at: number): RulesBlock | null {
    const open = /<([A-Za-z][\w-]*)\b[^<>]*>/g;
    let best: RulesBlock | null = null;
    for (let m = open.exec(text); m && m.index < at; m = open.exec(text)) {
        const name = (m[1] as string).toLowerCase();
        if (CONTENT_TAGS.has(name)) continue;
        const close = new RegExp(`</${name}\\s*>`, 'ig');
        close.lastIndex = m.index + m[0].length;
        let closed: RegExpExecArray | null = null;
        for (let c = close.exec(text); c; c = close.exec(text)) {
            if (c.index >= at) {
                closed = c;
                break;
            }
        }
        if (!closed) continue;
        const end = closed.index + closed[0].length;
        // The innermost element wins: the latest opening tag that still closes after the marker.
        if (!best || m.index > best.start) best = { start: m.index, end, text: text.slice(m.index, end) };
    }
    return best && best.end - best.start <= MAX_RULES_BLOCK ? best : null;
}

/** The text without its rules blocks (and the blank lines they leave). */
export function stripRulesBlocks(text: string, blocks: readonly RulesBlock[]): string {
    let out = text;
    for (const block of [...blocks].sort((a, b) => b.start - a.start)) {
        out = out.slice(0, block.start) + out.slice(block.end);
    }
    return out.replace(/\n{3,}/g, '\n\n').trim() === '' ? '' : out.replace(/\n{3,}/g, '\n\n');
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/** Where `after` (a sentence of the text, quoted loosely) ends; -1 when it is not found. */
export function findAnchorEnd(text: string, after: string): number {
    const wanted = after
        .trim()
        .replace(/^["'«“„]+|["'»”“]+$/g, '')
        .trim();
    if (!wanted) return -1;
    const exact = text.indexOf(wanted);
    if (exact >= 0) return exact + wanted.length;
    // Spacing and case differ: match word by word.
    const words = collapse(wanted)
        .split(' ')
        .filter(Boolean)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // The whole sentence, then its start (the model shortened or changed its end).
    const takes = [...new Set([words.length, Math.min(words.length, 8), Math.min(words.length, 4)])];
    for (const take of takes) {
        if (!take) continue;
        const found = new RegExp(words.slice(0, take).join('\\s+'), 'i').exec(text);
        if (found) return found.index + found[0].length;
    }
    return -1;
}

/**
 * Where a picture about `after` goes: the end of the paragraph (line) the sentence ends in; the end of
 * the text when the sentence is not found or not given. Never inside a placeholder.
 */
export function pictureOffset(text: string, after?: string): number {
    if (!after?.trim()) return text.length;
    const end = findAnchorEnd(text, after);
    if (end < 0) return text.length;
    const lineEnd = text.indexOf('\n', end);
    return lineEnd < 0 ? text.length : lineEnd;
}

/** The text with a placeholder on its own line at `offset` (a line end or the end of the text). */
export function insertPictureLine(text: string, line: string, offset: number): string {
    const at = Math.max(0, Math.min(text.length, offset));
    const before = text.slice(0, at).replace(/[ \t]+$/, '');
    const after = text.slice(at);
    if (!before) return `${line}\n${after.replace(/^\n/, '')}`;
    return after ? `${before}\n${line}${after.startsWith('\n') ? '' : '\n'}${after}` : `${before}\n${line}`;
}
