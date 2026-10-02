// Prompt assembly helpers mirroring SillyTavern's built-in Image Generation (RECON §2.1.7):
// prefix/{prompt} combination, LLM reply cleanup, raw-last-message prompt, free-mode `char` prefix.

/** Trims spaces and edge commas, joins with ", " or replaces `macro` in the first string. */
export function combinePrefixes(first: string, second: string, macro = ''): string {
    const clean = (s: string): string => s.trim().replace(/^,|,$/g, '').trim();
    if (!second) {
        return first;
    }
    const a = clean(first);
    const b = clean(second);
    const combined = macro && a.includes(macro) ? a.replace(macro, b) : `${a}, ${b},`;
    return clean(combined);
}

/**
 * Chat-template tokens some models leak into replies (`<|eot_id|>`, `<|response_…|…>`). Not in the
 * built-in: their `|` would split the NovelAI prompt into segments, so they are always removed.
 */
const SPECIAL_TOKENS = /<\|[^>]*>/g;

/** Cleans an LLM reply into a tag list (standard) or just collapses whitespace (minimal). */
export function processReply(text: string, minimal: boolean): string {
    if (!text) {
        return '';
    }
    const cleaned = text.replace(SPECIAL_TOKENS, ' ');
    if (minimal) {
        return cleaned.normalize('NFD').replace(/\s+/g, ' ').trim();
    }
    return cleaned
        .replaceAll('"', '')
        .replaceAll('“', '')
        .replaceAll('\n', ', ')
        .normalize('NFD')
        .replace(/[^a-zA-Z0-9.,:_(){}<>[\]/\-'|#]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part)
        .join(', ');
}

/** RAW_LAST without an LLM: the last message weighted above scenario and description. */
export function rawLastPrompt(message: string, character?: { scenario?: string; description?: string }): string {
    const mes = processReply(message, false);
    if (!character) {
        return mes;
    }
    return `((${mes})), (${processReply(character.scenario ?? '', false)}:0.7), (${processReply(character.description ?? '', false)}:0.5)`;
}

/**
 * Free mode: a leading `char ` / `char,` or `{{charPrefix}}` is replaced by the character prompt.
 * Returns the prompt and the character negative that has to be added to the negatives.
 */
export function applyFreeModeCharacter(
    trigger: string,
    character: { positive: string; negative: string },
): { prompt: string; negative: string } {
    let negative = '';
    const prompt = trigger.replace(/^char(\s|,)|{{charPrefix}}/gi, (_match, suffix: string | undefined) => {
        const value = character.positive.trim();
        if (character.negative.trim()) {
            negative = character.negative.trim();
        }
        return value ? combinePrefixes(value, suffix ?? '') : '';
    });
    return { prompt, negative };
}

export interface AssembledPrompt {
    prompt: string;
    negative: string;
}

/**
 * Final positive and negative strings before UC presets and quality tags are added by the payload
 * builder: prefix (+ character prefix) with `{prompt}` support, then suffix; negatives combined.
 */
export function assemblePrompt(input: {
    scene: string;
    prefix: string;
    suffix: string;
    negative: string;
    characterPositive: string;
    characterNegative: string;
    additionalNegative: string;
    useCharacterPrefix: boolean;
}): AssembledPrompt {
    const prefix = input.useCharacterPrefix ? combinePrefixes(input.prefix, input.characterPositive) : input.prefix;
    const withScene = combinePrefixes(prefix, input.scene, '{prompt}');
    const prompt = combinePrefixes(withScene, input.suffix);
    const commonNegative = input.useCharacterPrefix
        ? combinePrefixes(input.negative, input.characterNegative)
        : input.negative;
    const negative = combinePrefixes(input.additionalNegative, commonNegative);
    return { prompt, negative };
}
