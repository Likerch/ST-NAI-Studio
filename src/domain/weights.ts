// Emphasis syntax (TZ Phase 6 "weight editor"): `{tag}` ×1.05 and `[tag]` ÷1.05 per level on
// every model; numeric `1.2::tags::` on V4+ only. Switching to V3 converts numeric weights to the
// nearest braces; weights at or below zero cannot be expressed there and are reported.

const BRACE_FACTOR = 1.05;
const NUMERIC = /(-?\d*\.?\d+)::([\s\S]*?)(?:::|(?=\|)|$)/g;

export interface WeightConversion {
    text: string;
    /** Parts that could not be expressed in the target syntax (dropped). */
    lossy: string[];
    changed: boolean;
}

export function hasNumericWeights(prompt: string): boolean {
    NUMERIC.lastIndex = 0;
    return NUMERIC.test(prompt);
}

/** Nearest number of brace levels for a weight: positive = `{}`, negative = `[]`. */
export function braceLevels(weight: number): number {
    return Math.round(Math.log(weight) / Math.log(BRACE_FACTOR));
}

export function numericToBraces(prompt: string): WeightConversion {
    const lossy: string[] = [];
    let changed = false;
    const text = prompt.replace(NUMERIC, (_whole, weightText: string, content: string) => {
        changed = true;
        const weight = Number(weightText);
        const body = content.trim();
        if (!(weight > 0)) {
            if (body) lossy.push(`${weightText}::${body}`);
            return '';
        }
        const levels = braceLevels(weight);
        if (levels === 0) return body;
        return levels > 0
            ? `${'{'.repeat(levels)}${body}${'}'.repeat(levels)}`
            : `${'['.repeat(-levels)}${body}${']'.repeat(-levels)}`;
    });
    return {
        text: changed ? text.replace(/,(\s*,)+/g, ',').replace(/^\s*,\s*|\s*,\s*$/g, '') : prompt,
        lossy,
        changed,
    };
}

/** Converts a prompt for the target model family (only V4+ → V3 needs it). */
export function convertWeights(prompt: string, targetSupportsNumeric: boolean): WeightConversion {
    if (targetSupportsNumeric || !hasNumericWeights(prompt)) return { text: prompt, lossy: [], changed: false };
    return numericToBraces(prompt);
}

export interface WeightEdit {
    text: string;
    start: number;
    end: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The tag around the cursor: text between the nearest commas, `|` or line breaks, trimmed. */
function tagRange(text: string, start: number, end: number): { start: number; end: number } {
    if (end > start) {
        let s = start;
        let e = end;
        while (s < e && /\s/.test(text[s] as string)) s++;
        while (e > s && /\s/.test(text[e - 1] as string)) e--;
        return { start: s, end: e };
    }
    const isStop = (c: string | undefined) => c === undefined || c === ',' || c === '|' || c === '\n';
    let s = start;
    while (!isStop(text[s - 1])) s--;
    let e = start;
    while (!isStop(text[e])) e++;
    while (s < e && /\s/.test(text[s] as string)) s++;
    while (e > s && /\s/.test(text[e - 1] as string)) e--;
    return { start: s, end: e };
}

/**
 * Raises or lowers the weight of the selection (or the tag under the cursor). Numeric syntax on
 * V4+ (steps of 0.05, the wrapper disappears at 1.0), braces on V3 (one level per step).
 */
export function adjustWeight(text: string, start: number, end: number, step: 1 | -1, numeric: boolean): WeightEdit {
    let { start: s, end: e } = tagRange(text, start, end);
    if (s >= e) return { text, start, end };
    // Selecting a tag that is already wrapped edits the wrapper rather than nesting a new one.
    let inner = text.slice(s, e);
    const wrapped = inner.match(/^(-?\d*\.?\d+)::([\s\S]*)::$/);
    if (numeric && wrapped) {
        s += wrapped[1]!.length + 2;
        e -= 2;
        inner = wrapped[2] as string;
    }
    if (numeric) {
        const before = text.slice(0, s).match(/(-?\d*\.?\d+)::$/);
        const closes = text.slice(e).startsWith('::');
        if (before && closes) {
            const weight = round2(Number(before[1]) + step * 0.05);
            const head = text.slice(0, s - before[0].length);
            const tail = text.slice(e + 2);
            if (weight === 1) return { text: head + inner + tail, start: head.length, end: head.length + inner.length };
            const prefix = `${weight}::`;
            return {
                text: `${head}${prefix}${inner}::${tail}`,
                start: head.length + prefix.length,
                end: head.length + prefix.length + inner.length,
            };
        }
        const prefix = `${round2(1 + step * 0.05)}::`;
        return {
            text: `${text.slice(0, s)}${prefix}${inner}::${text.slice(e)}`,
            start: s + prefix.length,
            end: s + prefix.length + inner.length,
        };
    }
    const open = step > 0 ? '{' : '[';
    const opposite = step > 0 ? ['[', ']'] : ['{', '}'];
    if (text[s - 1] === opposite[0] && text[e] === opposite[1]) {
        return { text: text.slice(0, s - 1) + inner + text.slice(e + 1), start: s - 1, end: e - 1 };
    }
    if (inner.startsWith(opposite[0] as string) && inner.endsWith(opposite[1] as string)) {
        const unwrapped = inner.slice(1, -1);
        return { text: text.slice(0, s) + unwrapped + text.slice(e), start: s, end: s + unwrapped.length };
    }
    const close = step > 0 ? '}' : ']';
    return { text: `${text.slice(0, s)}${open}${inner}${close}${text.slice(e)}`, start: s + 1, end: e + 1 };
}
