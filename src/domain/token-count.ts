// Prompt token counting like the NovelAI web client (RECON §3.16, decision P-12): V5 — Qwen,
// 1471 (Full) / 703 (Curated); V4/V4.5 — T5, 512; V3 — CLIP, 225. On V4+ the base prompt and all
// characters add up; on V3 every `|` segment is counted on its own. Exceeding is only a warning.
import { getCapabilities } from './capabilities';
import type { ModelId } from './models';
import { promptSegments, textBlockOf } from './text-block';

export type TokenizerKind = 'qwen' | 't5' | 'clip';

export interface TokenCounter {
    count(text: string): number;
}

export function tokenizerKind(model: ModelId): TokenizerKind {
    const family = getCapabilities(model).family;
    if (family === 'v5') return 'qwen';
    if (family === 'v4' || family === 'v4_5') return 't5';
    return 'clip';
}

export const TOKENIZER_FILES: Record<TokenizerKind, string> = {
    qwen: 'qwen35_tokenizer.def',
    t5: 't5_tokenizer.def',
    clip: 'clip_tokenizer.def',
};

export function tokenLimit(model: ModelId): number {
    if (model === 'nai-diffusion-5-full') return 1471;
    if (model === 'nai-diffusion-5-curated') return 703;
    return tokenizerKind(model) === 't5' ? 512 : 225;
}

export interface PromptTokens {
    /** What is compared with the limit: V4+ base + characters; V3 the longest segment. */
    total: number;
    limit: number;
    base: number;
    characters: number[];
    /** V3 only: tokens per `|` segment. */
    segments: number[];
    /** V5 only: tokens of the in-image text block (part of the total). */
    text: number | null;
    over: boolean;
}

export function countPromptTokens(
    counter: TokenCounter,
    model: ModelId,
    prompt: string,
    characters: string[] = [],
): PromptTokens {
    const caps = getCapabilities(model);
    const limit = tokenLimit(model);
    const segments = promptSegments(prompt).map((s) => counter.count(s));
    if (!caps.v4Prompt) {
        const total = segments.length ? Math.max(...segments) : 0;
        return { total, limit, base: total, characters: [], segments, text: null, over: total > limit };
    }
    const base = segments.reduce((sum, n) => sum + n, 0);
    const chars = characters.filter((c) => c.trim()).map((c) => counter.count(c));
    const total = base + chars.reduce((sum, n) => sum + n, 0);
    const block = caps.family === 'v5' ? textBlockOf(prompt) : null;
    return {
        total,
        limit,
        base,
        characters: chars,
        segments: [],
        text: block === null ? null : counter.count(block),
        over: total > limit,
    };
}

/** Characters T5 cannot represent (V4.x): Cyrillic, CJK, emoji and other non-Latin scripts. */
export function t5UnsupportedChars(text: string): string[] {
    const found = new Set<string>();
    for (const ch of text) {
        if (
            /\p{Extended_Pictographic}/u.test(ch) ||
            /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(ch)
        ) {
            found.add(ch);
        }
    }
    return [...found];
}

/** Rough count when the tokenizer file is not available (no plugin, no proxy): ~4 characters a token. */
export function approximateTokens(text: string): number {
    return text.trim() ? Math.ceil(text.trim().length / 4) : 0;
}
