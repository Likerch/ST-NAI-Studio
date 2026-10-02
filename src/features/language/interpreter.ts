// Human language → NovelAI prompt (TZ Phase 7, docs/research §6). Russian or English prose (or a
// mix with tags) goes through the chosen LLM backend — the main chat model, a separate connection
// profile, or NovelAI's own text model via the plugin — then the tags are checked against the local
// list and the prompt is assembled for the model family. Results are cached; `text:` blocks are kept
// as typed. When the LLM fails, a dictionary pass (tags + Russian aliases) keeps generation going.
import { ctx, requestHeaders } from '../../core/context';
import { NaiError } from '../../core/errors';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { store } from '../../core/storage';
import {
    applyGlossary,
    assembleInterpretation,
    COMPLETION_INTERPRET_PREFILL,
    DEFAULT_MODEL,
    getCapabilities,
    hasCyrillic,
    INTERPRET_SCHEMA,
    interpretCacheSource,
    interpretCompletion,
    interpretMessages,
    isModelId,
    looksLikeChatter,
    looksLikeTags,
    matchTag,
    matchTags,
    needsInterpretation,
    parseInterpretation,
    tagName,
    textBlockOf,
    withoutNegated,
    withoutTextBlocks,
} from '../../domain';
import type { Interpretation, MatchedTags, ModelFamily, ModelId, TagIndex } from '../../domain';
import { novelAiText } from '../../transport';
import type { PromptInterpreter } from '../generation/pipeline';
import { tagIndex } from '../prompt-tools/tag-db';
import { sha256Hex } from '../vibes/vibe-library';

export type InterpretBackend = 'main' | 'profile' | 'novelai';

export interface Interpreted {
    prompt: string;
    negative: string;
    cached: boolean;
    via: InterpretBackend | 'dictionary';
    unmatched: string[];
}

const memory = new Map<string, Interpretation>();
let warnedFallback = false;

async function callMain(text: string): Promise<unknown> {
    const c = ctx();
    const glossary = settings().translate.glossary;
    if (c.mainApi === 'openai') {
        const { system, prompt } = interpretMessages(text, glossary);
        return await c.generateRaw({ prompt, systemPrompt: system, responseLength: 500, jsonSchema: INTERPRET_SCHEMA });
    }
    return await c.generateRaw({
        prompt: [{ role: 'system', content: interpretCompletion(text, glossary) }],
        prefill: COMPLETION_INTERPRET_PREFILL,
        responseLength: 250,
    });
}

async function callProfile(text: string): Promise<unknown> {
    const service = ctx().ConnectionManagerRequestService;
    const id = settings().language.profileId;
    if (!id) throw new NaiError('translation-failed', 'none', { message: 'no connection profile selected' });
    const glossary = settings().translate.glossary;
    const profile = service.getProfile(id);
    const chat = service.validateProfile(profile).selected === 'openai';
    const result = chat
        ? await service.sendRequest(
              id,
              [
                  { role: 'system', content: interpretMessages(text, glossary).system },
                  { role: 'user', content: text },
              ],
              500,
              { stream: false, extractData: true, includePreset: false },
              { json_schema: INTERPRET_SCHEMA },
          )
        : await service.sendRequest(
              id,
              `${interpretCompletion(text, glossary)}\n${COMPLETION_INTERPRET_PREFILL}`,
              250,
              {
                  stream: false,
                  extractData: true,
                  includePreset: true,
                  includeInstruct: false,
              },
          );
    return result && typeof result === 'object' && 'content' in result
        ? (result as { content: unknown }).content
        : result;
}

async function callNovelAi(text: string): Promise<unknown> {
    const { system } = interpretMessages(text, settings().translate.glossary);
    return await novelAiText(
        { fetch: (input, init) => fetch(input, init), headers: () => requestHeaders() },
        {
            model: settings().language.novelaiModel,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: text },
            ],
            maxTokens: 500,
        },
    );
}

const BACKENDS: Record<InterpretBackend, (text: string) => Promise<unknown>> = {
    main: callMain,
    profile: callProfile,
    novelai: callNovelAi,
};

function matchAll(index: TagIndex | null, tags: string[]): MatchedTags {
    return index ? matchTags(index, tags) : { tags: tags.map((t) => tagName(t)).filter(Boolean), unmatched: [] };
}

/** Without an LLM: every comma-separated piece through the tag list and the Russian aliases. */
export function dictionaryInterpretation(index: TagIndex | null, text: string): Interpretation {
    const pieces = text
        .split(/[,.;\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
    const tags: string[] = [];
    const rest: string[] = [];
    for (const piece of pieces) {
        const hit = index ? matchTag(index, piece) : null;
        if (hit) tags.push(hit.tag);
        else if (!hasCyrillic(piece)) rest.push(piece);
    }
    return { tags: [...tags, ...rest], sentence: '', text: '', negative: [] };
}

function finish(
    interp: Interpretation,
    index: TagIndex | null,
    family: ModelFamily,
    block: string | null,
    asNegative = false,
): Omit<Interpreted, 'cached' | 'via'> {
    const matched = matchAll(index, interp.tags);
    const negative = matchAll(index, interp.negative);
    const negativeTags = [...negative.tags, ...negative.unmatched.filter((n) => !hasCyrillic(n))];
    if (asNegative) {
        // A negative field lists what must not appear: everything named becomes a tag.
        const all = [...matched.tags, ...matched.unmatched.filter((n) => !hasCyrillic(n)), ...negativeTags];
        return { prompt: [...new Set(all)].join(', '), negative: '', unmatched: matched.unmatched };
    }
    const withText = block && !interp.text ? { ...interp, text: block } : interp;
    const kept = withoutNegated(matched, negativeTags);
    return {
        prompt: assembleInterpretation(withText, kept, family),
        negative: negativeTags.join(', '),
        unmatched: kept.unmatched,
    };
}

/**
 * The NovelAI prompt for a text and model, or null when the text needs no interpretation (already
 * tags, or prose the model reads as is). `force` interprets anything that is not a tag list.
 */
export async function interpretForModel(
    text: string,
    model: string,
    options: { force?: boolean; strict?: boolean; cyrillicOnly?: boolean; negative?: boolean } = {},
): Promise<Interpreted | null> {
    const s = settings().language;
    const id: ModelId = isModelId(model) ? model : DEFAULT_MODEL;
    const asNegative = options.negative === true;
    // A negative is assembled as tags on every model (and its cache entry is shared with V3).
    const family: ModelFamily = asNegative ? 'v3' : getCapabilities(id).family;
    if (options.cyrillicOnly && !hasCyrillic(text)) return null;
    const index = await tagIndex();
    const mode = options.force ? 'always' : s.mode;
    if (!needsInterpretation(text, family, mode, index, s.russianOnV5)) return null;
    const glossary = settings().translate.glossary;
    const block = textBlockOf(text);
    const prepared = applyGlossary(block === null ? text : withoutTextBlocks(text), glossary).trim();
    if (!prepared) return null;
    if (!hasCyrillic(prepared) && looksLikeTags(index, prepared)) {
        return {
            ...finish(dictionaryInterpretation(index, prepared), index, family, block, asNegative),
            cached: false,
            via: 'dictionary',
        };
    }
    const key = `int:${await sha256Hex(interpretCacheSource(prepared, family, glossary))}`;
    const hit = memory.get(key) ?? (await store().getItem<Interpretation>(key));
    if (hit) {
        memory.set(key, hit);
        return { ...finish(hit, index, family, block, asNegative), cached: true, via: s.backend };
    }
    let interp: Interpretation | null = null;
    try {
        const raw = await BACKENDS[s.backend](prepared);
        interp = parseInterpretation(raw);
        const flat = interp ? [...interp.tags, interp.sentence].join(' ') : '';
        if (!interp || looksLikeChatter(flat, prepared) || hasCyrillic(interp.tags.join(' '))) {
            log.warn(
                'interpretation not usable:',
                String(typeof raw === 'string' ? raw : JSON.stringify(raw)).slice(0, 200),
            );
            interp = null;
        }
    } catch (error) {
        log.warn('interpretation failed:', error);
        if (options.strict)
            throw error instanceof NaiError
                ? error
                : new NaiError('translation-failed', 'none', { message: String((error as Error)?.message ?? error) });
    }
    if (!interp) {
        if (options.strict) throw new NaiError('translation-failed', 'none', { message: 'the answer was not usable' });
        if (!warnedFallback) {
            warnedFallback = true;
            toastr.warning(t('naist.interpret.fallback'), t('naist.interpret.title'));
        }
        return {
            ...finish(dictionaryInterpretation(index, prepared), index, family, block, asNegative),
            cached: false,
            via: 'dictionary',
        };
    }
    memory.set(key, interp);
    await store().setItem(key, interp);
    log.info('prompt interpreted via', s.backend, 'for', family);
    return { ...finish(interp, index, family, block, asNegative), cached: false, via: s.backend };
}

/** English text → Russian original, for prompts converted by hand in a field (kept for the session). */
const originals = new Map<string, string>();

export function rememberSource(prompt: string, original: string): void {
    if (originals.size > 200) originals.clear();
    originals.set(prompt.trim(), original);
}

/** Pipeline hook: every generation's scene and character prompts. */
export const languageInterpreter: PromptInterpreter = {
    async interpret(text, context) {
        const result = await interpretForModel(text, context.model, {
            cyrillicOnly: context.cyrillicOnly,
            negative: context.negative,
        });
        return result ? { prompt: result.prompt, negative: result.negative } : null;
    },
    original(text) {
        const trimmed = text.trim();
        for (const [prompt, original] of originals) if (prompt && trimmed.includes(prompt)) return original;
        return undefined;
    },
};
