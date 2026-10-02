// Public NovelAI files without the token (TZ Phase 6): tokenizer definitions for the token counter
// and tag suggestions. Through the plugin (0.3.0+); tokenizers also through ST's CORS proxy when
// the server has it enabled. Network goes only to NovelAI (TZ rule).
import { PLUGIN_BASE } from './plugin';
import type { TransportEnv } from './types';

export const TOKENIZER_STATIC_URL = 'https://novelai.net/tokenizer/compressed';

/** Raw-deflate tokenizer JSON as NovelAI serves it, or null when no route can deliver it. */
export async function fetchTokenizerDefinition(
    env: TransportEnv,
    file: string,
    signal?: AbortSignal,
): Promise<ArrayBuffer | null> {
    const urls = [
        `${PLUGIN_BASE}/tokenizer/${encodeURIComponent(file)}`,
        `/proxy/${encodeURIComponent(`${TOKENIZER_STATIC_URL}/${file}?v=2&static=true`)}`,
    ];
    for (const url of urls) {
        try {
            const response = await env.fetch(url, { method: 'GET', headers: env.headers(), signal });
            const type = response.headers.get('Content-Type') ?? '';
            // The proxy answers an HTML page when it is disabled; only binary bodies count.
            if (response.ok && !type.includes('text/html') && !type.includes('application/json')) {
                return await response.arrayBuffer();
            }
        } catch (error) {
            if (signal?.aborted) throw error;
        }
    }
    return null;
}

export interface RemoteTagSuggestion {
    tag: string;
    count: number;
    confidence: number;
}

/** NovelAI's own suggestions for the fragment being typed; empty when the plugin cannot ask. */
export async function fetchTagSuggestions(
    env: TransportEnv,
    model: string,
    prompt: string,
    signal?: AbortSignal,
): Promise<RemoteTagSuggestion[]> {
    try {
        const query = new URLSearchParams({ model, prompt, lang: 'en' });
        const response = await env.fetch(`${PLUGIN_BASE}/suggest-tags?${query}`, {
            method: 'GET',
            headers: env.headers(),
            signal,
        });
        if (!response.ok) return [];
        const body = (await response.json()) as { tags?: RemoteTagSuggestion[] };
        return Array.isArray(body.tags) ? body.tags : [];
    } catch {
        return [];
    }
}
