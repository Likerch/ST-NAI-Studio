// RU -> EN prompt translation (TZ Phase 6): the user's glossary first, then the user's own LLM with
// structured output (Chat Completion) or a few-shot continuation (text completion APIs, which do
// not follow JSON instructions reliably), cached by text. In-image text blocks stay as typed.
import examples from '../data/translate-examples.json';

export interface GlossaryEntry {
    from: string;
    to: string;
}

const CYRILLIC = /[\u0400-\u04FF]/;

export function hasCyrillic(text: string): boolean {
    return CYRILLIC.test(text);
}

/** The prompt without its `text:` blocks (in-image text is kept in the language it was typed in). */
export function withoutTextBlocks(text: string): string {
    return text
        .split('|')
        .map((segment) => segment.replace(/(^|[\s,.])te?xt:[\s\S]*$/i, '$1'))
        .join('|');
}

/** True when the prompt has Russian outside its in-image text. */
export function needsTranslation(text: string): boolean {
    return hasCyrillic(withoutTextBlocks(text));
}

export interface TranslationExample {
    ru: string;
    en: string;
}

export const TRANSLATION_EXAMPLES: readonly TranslationExample[] = examples;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whole-word, case-insensitive replacement; longer phrases first so they win over their parts. */
export function applyGlossary(text: string, glossary: GlossaryEntry[]): string {
    const entries = glossary.filter((g) => g.from.trim() && g.to.trim()).sort((a, b) => b.from.length - a.from.length);
    let result = text;
    for (const { from, to } of entries) {
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp(from.trim())}(?=$|[^\\p{L}\\p{N}_])`, 'giu');
        result = result.replace(pattern, (_m, lead: string) => `${lead}${to.trim()}`);
    }
    return result;
}

export const TRANSLATION_SCHEMA = {
    name: 'nai_prompt_translation',
    description: 'English image prompt translated from the user text',
    strict: true,
    value: {
        type: 'object',
        properties: { prompt: { type: 'string', description: 'The translated prompt' } },
        required: ['prompt'],
        additionalProperties: false,
    },
};

export function translationPrompt(text: string, glossary: GlossaryEntry[]): { system: string; prompt: string } {
    const used = glossary.filter(
        (g) => g.from.trim() && g.to.trim() && text.toLowerCase().includes(g.from.trim().toLowerCase()),
    );
    const terms = used.length
        ? `\nAlways use these translations:\n${used.map((g) => `- ${g.from} => ${g.to}`).join('\n')}`
        : '';
    return {
        system:
            'You translate prompts for the NovelAI image generator from Russian to English. ' +
            'Output comma-separated English Danbooru-style tags and short phrases. ' +
            'Keep English words, numbers, names, weight syntax ({ }, [ ], 1.2::...::), "|" and "text:" blocks unchanged. ' +
            'Do not add anything that is not in the input. Answer only with JSON: {"prompt": "..."}.' +
            terms,
        prompt: `Translate this prompt:\n${text}`,
    };
}

/**
 * Few-shot continuation for text completion models. Sent as a system message (no user name
 * prefix) with "English:" as the prefill; the instruction sits in `{ }` so NovelAI's instruction
 * wrapping leaves the examples as they are.
 */
export function completionPrompt(text: string, glossary: GlossaryEntry[]): string {
    const used = glossary.filter(
        (g) => g.from.trim() && g.to.trim() && text.toLowerCase().includes(g.from.trim().toLowerCase()),
    );
    const pair = (ru: string, en: string) => `Russian: ${ru}\nEnglish: ${en}`;
    return [
        '{ Translate Russian image prompts into English Danbooru tags for NovelAI. Keep weights, "|" and text: blocks as they are. }',
        ...TRANSLATION_EXAMPLES.map((e) => pair(e.ru, e.en)),
        ...used.map((g) => pair(g.from.trim(), g.to.trim())),
        `Russian: ${text.replace(/\s*\n\s*/g, ' ').trim()}`,
    ].join('\n');
}

export const COMPLETION_PREFILL = 'English:';

/** An answer that talks about the task instead of doing it ("I would like to translate..."). */
export function looksLikeChatter(result: string, source: string): boolean {
    const talk = /\b(translat\w*|russian|english|sure|here is|i would|i will|i can)\b/i;
    return talk.test(result) && !talk.test(source);
}

/** Takes `{"prompt": ...}` from a model answer; tolerates code fences and text around the JSON. */
export function parseTranslation(raw: unknown): string | null {
    if (raw && typeof raw === 'object' && typeof (raw as { prompt?: unknown }).prompt === 'string') {
        return (raw as { prompt: string }).prompt.trim() || null;
    }
    if (typeof raw !== 'string') return null;
    const text = raw.trim();
    const candidates = [text, text.replace(/^```(?:json)?\s*|\s*```$/g, ''), text.match(/\{[\s\S]*\}/)?.[0] ?? ''];
    for (const candidate of candidates) {
        try {
            const value = JSON.parse(candidate) as { prompt?: unknown };
            if (typeof value.prompt === 'string' && value.prompt.trim()) return value.prompt.trim();
        } catch {
            // next candidate
        }
    }
    const loose = text.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (loose?.[1]) return loose[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    return null;
}

/** The continuation answer: the first non-empty line, without a repeated "English:" label or quotes. */
export function parseCompletion(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const json = raw.includes('"prompt"') ? parseTranslation(raw) : null;
    if (json) return json;
    const line = raw
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean);
    if (!line) return null;
    const cleaned = line
        .replace(/^english\s*:\s*/i, '')
        .replace(/^["'\u201c]|["'\u201d]$/g, '')
        .trim();
    return cleaned || null;
}

/** Cache key material: the text and the glossary (a changed glossary must not reuse old results). */
export function translationKeySource(text: string, glossary: GlossaryEntry[]): string {
    const terms = glossary
        .filter((g) => g.from.trim() && g.to.trim())
        .map((g) => `${g.from.trim().toLowerCase()}=${g.to.trim()}`)
        .sort()
        .join(';');
    return `${text.trim()}\u0000${terms}`;
}
