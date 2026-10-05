// Undesired content of styles (v0.13): a style's negative either replaces the undesired content
// ("replace", the behaviour of older styles) or is added after a base negative common to all styles
// ("append"). Tags are compared ignoring case and extra spaces; groups in brackets and `1.2::a, b::`
// weight groups stay whole, so merging never breaks weight syntax.

export type NegativeMode = 'replace' | 'append';

export const NEGATIVE_MODES: readonly NegativeMode[] = ['replace', 'append'];

/** A stored mode; anything else (absent in styles saved before v0.13) is "replace". */
export function negativeMode(value: unknown): NegativeMode {
    return value === 'append' ? 'append' : 'replace';
}

const OPEN = new Set(['{', '[', '(']);
const CLOSE = new Set(['}', ']', ')']);

/** Comma or newline separated parts of a negative, trimmed, empty ones dropped, duplicates kept. */
export function negativeTags(text: string): string[] {
    const tags: string[] = [];
    let depth = 0;
    let weighted = false;
    let start = 0;
    const push = (end: number) => {
        const tag = text.slice(start, end).trim();
        if (tag) tags.push(tag);
    };
    for (let i = 0; i < text.length; i++) {
        const ch = text[i] as string;
        if (OPEN.has(ch)) depth++;
        else if (CLOSE.has(ch)) depth = Math.max(0, depth - 1);
        else if (ch === ':' && text[i + 1] === ':') {
            // "1.2::" opens a weight group, the next "::" closes it.
            weighted = !weighted;
            i++;
        } else if ((ch === ',' || ch === '\n') && depth === 0 && !weighted) {
            push(i);
            start = i + 1;
        }
    }
    push(text.length);
    return tags;
}

const tagKey = (tag: string): string => tag.toLowerCase().replace(/\s+/g, ' ');

/** Joins negatives in order; a tag already there is dropped (first wins). */
export function mergeNegatives(...parts: string[]): string {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const tag of parts.flatMap(negativeTags)) {
        const key = tagKey(tag);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(tag);
    }
    return result.join(', ');
}

/** The tags of `text` that `remove` does not have, in order. */
export function subtractNegatives(text: string, remove: string): string {
    const removed = new Set(negativeTags(remove).map(tagKey));
    return negativeTags(text)
        .filter((tag) => !removed.has(tagKey(tag)))
        .join(', ');
}

/** The same tags in the same order, ignoring case, spaces and separators. */
export function sameNegative(a: string, b: string): boolean {
    const left = negativeTags(a).map(tagKey);
    const right = negativeTags(b).map(tagKey);
    return left.length === right.length && left.every((tag, i) => tag === right[i]);
}

/** The undesired content a style's own negative makes: itself, or the base and then itself. */
export function effectiveNegative(base: string, own: string, mode: NegativeMode): string {
    return mode === 'append' ? mergeNegatives(base, own) : own;
}

/**
 * The style's own part of an effective negative: all of it for "replace"; for "append" the first
 * candidate that gives exactly this effective negative (what the user typed, the saved style), else
 * the tags the base does not have.
 */
export function ownNegative(
    effective: string,
    base: string,
    mode: NegativeMode,
    candidates: readonly (string | undefined)[] = [],
): string {
    if (mode !== 'append') return effective;
    for (const own of candidates) {
        if (own !== undefined && sameNegative(mergeNegatives(base, own), effective)) return own;
    }
    return subtractNegatives(effective, base);
}
