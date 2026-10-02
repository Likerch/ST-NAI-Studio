// RU -> EN translation (TZ Phase 6) through the user's current LLM: `generateRaw` with a JSON
// schema on Chat Completion (structured output works only there, RECON §2.14), a strict
// instruction on other APIs. The glossary applies first; results are cached in IndexedDB.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { store } from '../../core/storage';
import {
    applyGlossary,
    COMPLETION_PREFILL,
    completionPrompt,
    looksLikeChatter,
    needsTranslation,
    parseCompletion,
    parseTranslation,
    TRANSLATION_SCHEMA,
    translationKeySource,
    translationPrompt,
} from '../../domain';
import type { PromptTranslator } from '../generation/pipeline';
import { sha256Hex } from '../vibes/vibe-library';

const memory = new Map<string, string>();
/** English text -> Russian original, for prompts translated by hand (kept for the session). */
const originals = new Map<string, string>();

export function rememberOriginal(english: string, original: string): void {
    if (originals.size > 200) originals.clear();
    originals.set(english.trim(), original);
}

export interface Translation {
    text: string;
    cached: boolean;
}

export async function translatePrompt(text: string): Promise<Translation> {
    if (!needsTranslation(text)) return { text, cached: false };
    const glossary = settings().translate.glossary;
    const prepared = applyGlossary(text, glossary);
    if (!needsTranslation(prepared)) return { text: prepared, cached: false };
    const key = `tr:${await sha256Hex(translationKeySource(prepared, glossary))}`;
    const hit = memory.get(key) ?? (await store().getItem<string>(key));
    if (hit && !needsTranslation(hit) && !looksLikeChatter(hit, prepared)) {
        memory.set(key, hit);
        return { text: hit, cached: true };
    }
    if (hit) {
        // An unusable answer cached by an older version: drop it and ask again.
        memory.delete(key);
        await store().removeItem(key);
    }
    const c = ctx();
    const structured = c.mainApi === 'openai';
    let raw: string;
    try {
        if (structured) {
            const { system, prompt } = translationPrompt(prepared, glossary);
            raw = await c.generateRaw({
                prompt,
                systemPrompt: system,
                responseLength: 400,
                jsonSchema: TRANSLATION_SCHEMA,
            });
        } else {
            raw = await c.generateRaw({
                prompt: [{ role: 'system', content: completionPrompt(prepared, glossary) }],
                prefill: COMPLETION_PREFILL,
                responseLength: 150,
            });
        }
    } catch (error) {
        throw new NaiError('translation-failed', 'none', { message: String((error as Error)?.message ?? error) });
    }
    const result = structured ? parseTranslation(raw) : parseCompletion(raw);
    if (!result || needsTranslation(result) || looksLikeChatter(result, prepared)) {
        log.warn('translation answer not usable:', String(raw).slice(0, 200));
        throw new NaiError('translation-failed', 'none', { message: String(raw).slice(0, 120) });
    }
    memory.set(key, result);
    await store().setItem(key, result);
    log.info('prompt translated', structured ? '(structured output)' : '(few-shot)');
    return { text: result, cached: false };
}

/** Pipeline hook: translates Cyrillic prompts before every generation when auto mode is on. */
export const autoTranslator: PromptTranslator = {
    enabled: () => settings().translate.auto,
    async translate(text) {
        return needsTranslation(text) ? (await translatePrompt(text)).text : null;
    },
    original(text) {
        // A prompt may get a prefix or suffix around the translated part: match by containment.
        const trimmed = text.trim();
        for (const [english, original] of originals) if (english && trimmed.includes(english)) return original;
        return undefined;
    },
};
