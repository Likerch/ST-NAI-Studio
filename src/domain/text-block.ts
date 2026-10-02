// V5 in-image text (RECON §3.5 "autoText", bundle:_app module 46278): when no prompt has a
// `text:` block, the web client collects quoted phrases from the base prompt and the characters
// and appends `, teXt: ` + the phrases joined by blank lines to the first `|` segment.

const SEGMENT = '|';
const RANDOM = '||';
const MAX_SEGMENTS = 6;
const TEXT_BLOCK = /(?:^|\s|[,.:[\]{}、。])text:(?!:)/i;
const AUTO_TEXT = 'teXt:';
const QUOTES: Record<string, string> = {
    '"': '"',
    '\u201c': '\u201d',
    '\u300c': '\u300d',
    "'": "'",
    '\u2018': '\u2019',
};
const CJK = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\u4E00-\u9FAF\u3400-\u4DBF]/gu;

/** `|` segments, keeping `||a|b||` random choices intact; at most six (the rest stays in the last). */
export function promptSegments(prompt: string): string[] {
    const RANDOM_MARK = '\u{103B9}';
    const PIPE_MARK = '\u{12137}';
    const protectedText = prompt
        .split(RANDOM)
        .map((part, i) => (i % 2 === 1 ? part.split(SEGMENT).join(RANDOM_MARK) : part))
        .join(PIPE_MARK);
    const parts = protectedText.split(SEGMENT);
    const segments = parts.slice(0, MAX_SEGMENTS - 1);
    if (parts.length > MAX_SEGMENTS - 1) segments.push(parts.slice(MAX_SEGMENTS - 1).join(SEGMENT));
    return segments.map((s) => s.replaceAll(RANDOM_MARK, SEGMENT).replaceAll(PIPE_MARK, RANDOM));
}

const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
const isBoundary = (c: string | undefined) => c === undefined || /[\s,.]/.test(c);

/** Phrases in quotes; an apostrophe opens a quote only after a space, comma, period or the start. */
export function quotedPhrases(text: string): string[] {
    const found: string[] = [];
    let i = 0;
    while (i < text.length) {
        const close = QUOTES[text[i] as string];
        if (close === undefined || (text[i] === "'" && !isBoundary(text[i - 1]))) {
            i++;
            continue;
        }
        const apostrophe = close === "'" || close === '’';
        let j = i + 1;
        while (j < text.length && (text[j] !== close || (apostrophe && isWordChar(text[j + 1])))) j++;
        if (j >= text.length) {
            i++;
            continue;
        }
        const phrase = text.slice(i + 1, j).trim();
        if (phrase) found.push(phrase);
        i = j + 1;
    }
    return found;
}

export interface TextCharacter {
    prompt: string;
    enabled?: boolean;
    center: { x: number; y: number };
}

/** Reading order of positioned characters: rows split at the largest vertical gaps, then x. */
function readingOrder(characters: TextCharacter[]): TextCharacter[] {
    const rows = (list: TextCharacter[]): TextCharacter[][] => {
        if (list.length <= 1) return [list];
        const spread = (list.at(-1) as TextCharacter).center.y - (list[0] as TextCharacter).center.y;
        let at = 1;
        let gap = -1;
        for (let i = 1; i < list.length; i++) {
            const d = (list[i] as TextCharacter).center.y - (list[i - 1] as TextCharacter).center.y;
            if (d > gap) {
                gap = d;
                at = i;
            }
        }
        return spread <= 0.15 && gap <= 0.1 ? [list] : [...rows(list.slice(0, at)), ...rows(list.slice(at))];
    };
    return rows([...characters].sort((a, b) => a.center.y - b.center.y)).flatMap((row) =>
        row.sort((a, b) => a.center.x - b.center.x),
    );
}

function phrasesOf(base: string, characters: TextCharacter[], useCoords: boolean): string[] {
    const active = characters.filter((c) => (c.enabled ?? true) && c.prompt.length > 0);
    const ordered = useCoords ? readingOrder(active) : active;
    const lists = [quotedPhrases(base), ...ordered.map((c) => quotedPhrases(c.prompt))];
    const all = lists.flat().join('');
    const cjk = all.match(CJK)?.length ?? 0;
    if (cjk && cjk / all.length > 0.3) lists.forEach((l) => l.reverse());
    return lists.flat();
}

export function hasTextBlock(text: string): boolean {
    return TEXT_BLOCK.test(text);
}

/** Adds the automatic text block (unchanged when any prompt already has `text:` or nothing is quoted). */
export function applyAutoText(prompt: string, characters: TextCharacter[], useCoords: boolean): string {
    const active = characters.filter((c) => (c.enabled ?? true) && c.prompt.length > 0);
    if (hasTextBlock(prompt) || active.some((c) => hasTextBlock(c.prompt))) return prompt;
    const segments = promptSegments(prompt);
    const phrases = phrasesOf(segments[0] ?? '', active, useCoords);
    if (!phrases.length) return prompt;
    const block = `${AUTO_TEXT} ${phrases.join('\n\n')}`;
    const head = (segments[0] ?? '').replace(/[\s,]+$/, '');
    segments[0] = head ? `${head}, ${block}` : block;
    return segments.join(SEGMENT);
}

/** The in-image text of a prompt (after the first `text:` of the first segment), or null. */
export function textBlockOf(prompt: string): string | null {
    const first = promptSegments(prompt)[0] ?? '';
    const match = first.match(TEXT_BLOCK);
    if (match?.index === undefined) return null;
    return first.slice(match.index + match[0].length).trim();
}
