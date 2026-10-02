// Human language → NovelAI prompt (TZ Phase 7, docs/research §6). An LLM extracts tags, a short
// English sentence, in-image text and exclusions from Russian or English prose; the tags are
// checked against the local tag list (exact → alias → word form → part of a phrase → fuzzy); the
// prompt is then assembled for the model family: V3 tags only, V4.x tags + sentence, V5 tags +
// prose. Pure.
import examples from '../data/interpret-examples.json';
import type { ModelFamily } from './models';
import type { TagEntry, TagIndex } from './tags';
import { tagName } from './tags';
import { hasCyrillic } from './translate';
import type { GlossaryEntry } from './translate';

export interface Interpretation {
    tags: string[];
    /** 1–3 short English sentences for what tags cannot say (empty for V3). */
    sentence: string;
    /** Words written in the picture. */
    text: string;
    negative: string[];
}

export interface MatchedTags {
    tags: string[];
    /** Candidates that are not known tags (kept as phrases on V4+, dropped on V3). */
    unmatched: string[];
}

export const INTERPRET_SCHEMA = {
    name: 'nai_image_prompt',
    description: 'NovelAI image prompt extracted from a description',
    strict: true,
    value: {
        type: 'object',
        properties: {
            tags: { type: 'array', items: { type: 'string' }, description: 'English Danbooru tags' },
            sentence: { type: 'string', description: 'One to three short plain English sentences' },
            text: { type: 'string', description: 'Exact words written in the picture, or empty' },
            negative: { type: 'array', items: { type: 'string' }, description: 'Things that must not appear' },
        },
        required: ['tags', 'sentence', 'text', 'negative'],
        additionalProperties: false,
    },
};

const RULES = [
    'Convert an image description (Russian or English, prose or tags) into a NovelAI image prompt.',
    'tags: English Danbooru tags in lowercase with spaces (not underscores): subject count (1girl, 2boys, 1boy 1girl, no humans), appearance, clothing, expression, pose and action, place, time and light, camera and framing; keep tags the user already wrote.',
    'Count people by gender: a woman, girl, witch, queen or princess is a girl, a man or boy is a boy, unless the description says otherwise.',
    'sentence: one to three short plain English sentences only for what tags cannot say (who is where, interactions, mood).',
    'text: the exact words written in the picture (signs, speech), empty if none.',
    'negative: things that must not appear (from "no", "without", "\u0431\u0435\u0437", "\u043d\u0435").',
    'What must not appear goes only to negative, never to tags (no "no ..." tags for it).',
    'Do not invent details. Do not add quality or style tags. Do not use names of original characters; use a Danbooru character tag only for well-known characters.',
].join('\n');

export function interpretMessages(description: string, glossary: GlossaryEntry[]): { system: string; prompt: string } {
    const used = glossary.filter(
        (g) => g.from.trim() && g.to.trim() && description.toLowerCase().includes(g.from.trim().toLowerCase()),
    );
    const terms = used.length
        ? `\nAlways translate these terms this way:\n${used.map((g) => `- ${g.from} => ${g.to}`).join('\n')}`
        : '';
    return {
        system: `${RULES}${terms}\nAnswer only with JSON: {"tags": [...], "sentence": "...", "text": "...", "negative": [...]}`,
        prompt: description,
    };
}

/** Few-shot continuation for text completion models (no JSON schema there). */
export function interpretCompletion(description: string, glossary: GlossaryEntry[]): string {
    const shot = (e: { description: string; tags: string; sentence: string; text: string; negative: string }) =>
        `Description: ${e.description}\nTags: ${e.tags}\nSentence: ${e.sentence}\nText: ${e.text}\nNegative: ${e.negative}`;
    const used = glossary.filter(
        (g) => g.from.trim() && g.to.trim() && description.toLowerCase().includes(g.from.trim().toLowerCase()),
    );
    return [
        '{ Convert image descriptions into NovelAI prompts: English Danbooru tags, a short English sentence, in-image text and things to avoid. }',
        ...(examples as Parameters<typeof shot>[0][]).map(shot),
        ...used.map((g) => `Description: ${g.from.trim()}\nTags: ${g.to.trim()}\nSentence:\nText:\nNegative:`),
        `Description: ${description.replace(/\s*\n\s*/g, ' ').trim()}`,
    ].join('\n');
}

export const COMPLETION_INTERPRET_PREFILL = 'Tags:';

const list = (v: unknown): string[] =>
    (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map((x) => String(x).trim()).filter(Boolean);

/** Reads either the JSON answer or the "Tags: / Sentence: / Text: / Negative:" lines. */
export function parseInterpretation(raw: unknown): Interpretation | null {
    let source: unknown = raw;
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        const json = trimmed.match(/\{[\s\S]*\}/)?.[0];
        if (json) {
            try {
                source = JSON.parse(json) as unknown;
            } catch {
                source = trimmed;
            }
        }
    }
    if (source && typeof source === 'object') {
        const o = source as Record<string, unknown>;
        const tags = list(o.tags);
        if (!tags.length && !String(o.sentence ?? '').trim()) return null;
        return {
            tags,
            sentence: String(o.sentence ?? '').trim(),
            text: String(o.text ?? '').trim(),
            negative: list(o.negative),
        };
    }
    if (typeof source !== 'string') return null;
    // Line format; the prefill "Tags:" may be missing from the answer itself.
    const text = /^\s*tags\s*:/i.test(source) ? source : `Tags: ${source}`;
    const field = (name: string) => {
        const m = text.match(new RegExp(`^\\s*${name}\\s*:[ \\t]*(.*)$`, 'im'));
        return (m?.[1] ?? '').trim();
    };
    const cut = text.split(/\n\s*description\s*:/i)[0] as string;
    const tags = list(cut.match(/^\s*tags\s*:[ \t]*(.*)$/im)?.[1] ?? '');
    if (!tags.length) return null;
    return { tags, sentence: field('sentence'), text: field('text'), negative: list(field('negative')) };
}

// ---- tag matching ---------------------------------------------------------------------------

const normalize = (t: string) => tagName(t).replace(/\s+/g, ' ').trim();

function lookup(index: TagIndex, candidate: string): TagEntry | undefined {
    return index.byName.get(candidate) ?? index.byAlias.get(candidate);
}

/** Simple English word forms: plurals, -ing, -ed (smiling → smile, holding → hold, boots → boot). */
function wordForms(word: string): string[] {
    const forms = new Set<string>();
    if (word.endsWith('ies')) forms.add(`${word.slice(0, -3)}y`);
    if (word.endsWith('es')) forms.add(word.slice(0, -2));
    if (word.endsWith('s') && !word.endsWith('ss')) forms.add(word.slice(0, -1));
    if (word.endsWith('ing')) {
        const stem = word.slice(0, -3);
        forms.add(stem);
        forms.add(`${stem}e`);
        if (/(.)\1$/.test(stem)) forms.add(stem.slice(0, -1));
    }
    if (word.endsWith('ed')) {
        forms.add(word.slice(0, -2));
        forms.add(word.slice(0, -1));
    }
    return [...forms];
}

function editDistance(a: string, b: string, limit: number): number {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const row = [i];
        let best = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const value = Math.min((prev[j] as number) + 1, (row[j - 1] as number) + 1, (prev[j - 1] as number) + cost);
            row.push(value);
            best = Math.min(best, value);
        }
        if (best > limit) return limit + 1;
        prev = row;
    }
    return prev[b.length] as number;
}

export type MatchKind = 'exact' | 'alias' | 'form' | 'part' | 'fuzzy';

/** The known tag for a candidate, or null. Weighted or braced tags are passed through untouched. */
export function matchTag(index: TagIndex, raw: string): { tag: string; kind: MatchKind; rest?: string } | null {
    const candidate = normalize(raw);
    if (!candidate) return null;
    if (/::|[{}[\]]/.test(raw) || /^\d+(girl|boy|other)s?$/.test(candidate) || /^[a-z]+:/.test(candidate)) {
        return { tag: raw.trim(), kind: 'exact' };
    }
    const direct = index.byName.get(candidate);
    if (direct) return { tag: direct.name, kind: 'exact' };
    const alias = index.byAlias.get(candidate);
    if (alias) return { tag: alias.name, kind: 'alias' };
    const words = candidate.split(' ');
    const last = words.at(-1) as string;
    for (const form of wordForms(last)) {
        const hit = lookup(index, [...words.slice(0, -1), form].join(' '));
        if (hit) return { tag: hit.name, kind: 'form' };
    }
    // The longest known ending of a phrase ("black crop top" → "crop top"); the rest goes to the sentence.
    for (let i = 1; i < words.length; i++) {
        const hit = lookup(index, words.slice(i).join(' '));
        if (hit) return { tag: hit.name, kind: 'part', rest: words.slice(0, i).join(' ') };
    }
    if (candidate.length >= 5 && !hasCyrillic(candidate)) {
        const limit = candidate.length >= 9 ? 2 : 1;
        let best: TagEntry | null = null;
        for (const entry of index.entries) {
            if (entry.name[0] !== candidate[0] || Math.abs(entry.name.length - candidate.length) > limit) continue;
            if (editDistance(entry.name, candidate, limit) <= limit && (!best || entry.count > best.count))
                best = entry;
        }
        if (best) return { tag: best.name, kind: 'fuzzy' };
    }
    return null;
}

/**
 * A Danbooru alias that is the tag plus more words ("red apple" -> apple): the extra words are
 * lost in the tag, so the phrase is kept as well (V4+ reads it).
 */
function aliasAddsWords(raw: string, tag: string): boolean {
    if (hasCyrillic(raw)) return false;
    const words = tagName(raw).split(/\s+/).filter(Boolean);
    const tagWords = tag.split(/\s+/);
    return words.length > tagWords.length && tagWords.every((w) => words.includes(w));
}

export function matchTags(index: TagIndex, candidates: string[]): MatchedTags {
    const tags: string[] = [];
    const unmatched: string[] = [];
    const seen = new Set<string>();
    for (const raw of candidates) {
        const hit = matchTag(index, raw);
        if (!hit) {
            if (raw.trim()) unmatched.push(raw.trim());
            continue;
        }
        if (!seen.has(hit.tag)) {
            seen.add(hit.tag);
            tags.push(hit.tag);
        }
        if (hit.rest) unmatched.push(`${hit.rest} ${hit.tag}`);
        else if (hit.kind === 'alias' && aliasAddsWords(raw, hit.tag)) unmatched.push(tagName(raw));
    }
    return { tags, unmatched };
}

/**
 * Tags that contradict the negative: the negated thing itself and "no X" / "without X" for it.
 * Real tags like "no humans" stay unless their subject is in the negative.
 */
export function withoutNegated(matched: MatchedTags, negative: readonly string[]): MatchedTags {
    const banned = new Set(negative.map((n) => tagName(n)).filter(Boolean));
    if (!banned.size) return matched;
    const keep = (tag: string) => {
        const name = tagName(tag);
        const subject = name.match(/^(?:no|without)\s+(.+)$/)?.[1];
        return !banned.has(name) && !(subject && banned.has(subject));
    };
    return { tags: matched.tags.filter(keep), unmatched: matched.unmatched.filter(keep) };
}

// ---- assembly -------------------------------------------------------------------------------

const sentenceCase = (s: string) => {
    const t = s.trim();
    if (!t) return '';
    const capital = t[0]!.toUpperCase() + t.slice(1);
    return /[.!?]$/.test(capital) ? capital : `${capital}.`;
};

/** The prompt for one model family; the in-image text block goes last. */
export function assembleInterpretation(p: Interpretation, matched: MatchedTags, family: ModelFamily): string {
    const tags = [...matched.tags];
    if (family === 'v3') return tags.join(', ');
    const phrases = matched.unmatched.filter((u) => !hasCyrillic(u));
    const head = [...tags, ...phrases].join(', ');
    const sentence = sentenceCase(p.sentence);
    let prompt = sentence ? (head ? `${head}. ${sentence}` : sentence) : head;
    // The text block comes last, after a finished sentence (NovelAI's own prompts end with ". Text:").
    if (p.text)
        prompt = prompt ? `${/[.!?]$/.test(prompt) ? prompt : `${prompt}.`} Text: ${p.text}` : `Text: ${p.text}`;
    return prompt;
}

/** True when the text is already a tag list the model reads as is (no LLM needed). */
export function looksLikeTags(index: TagIndex | null, text: string): boolean {
    if (hasCyrillic(text)) return false;
    const pieces = text
        .split(/[,|\n]/)
        .map((t) => t.replace(/-?\d*\.?\d+::|::|[{}[\]]/g, '').trim())
        .filter(Boolean);
    if (!pieces.length) return true;
    if (pieces.some((p) => p.split(/\s+/).length > 5)) return false;
    if (!index) return pieces.every((p) => p.split(/\s+/).length <= 3);
    const known = pieces.filter(
        (p) => matchTag(index, p)?.kind === 'exact' || matchTag(index, p)?.kind === 'alias',
    ).length;
    return known / pieces.length >= 0.6;
}

export type LanguageMode = 'auto' | 'always' | 'off';

/**
 * Whether a text should go through the interpreter: Russian always (V4.x cannot read it, V5 does not
 * officially support it, unless the user allows Russian on V5); English prose on V3 and V4.x (tags
 * work better there); English prose on V5 is sent as is in auto mode.
 */
export function needsInterpretation(
    text: string,
    family: ModelFamily,
    mode: LanguageMode,
    index: TagIndex | null,
    russianOnV5 = false,
): boolean {
    if (mode === 'off' || !text.trim()) return false;
    const tags = looksLikeTags(index, text);
    if (mode === 'always') return !tags;
    if (hasCyrillic(text)) return !(family === 'v5' && russianOnV5);
    if (tags) return false;
    return family !== 'v5';
}

export function interpretCacheSource(text: string, family: ModelFamily, glossary: GlossaryEntry[]): string {
    const terms = glossary
        .filter((g) => g.from.trim() && g.to.trim())
        .map((g) => `${g.from.trim().toLowerCase()}=${g.to.trim()}`)
        .sort()
        .join(';');
    return `${family}\u0000${text.trim()}\u0000${terms}`;
}
