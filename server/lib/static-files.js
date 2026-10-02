// Public NovelAI files the extension needs without a token: tokenizer definitions for the token
// counter (novelai.net/tokenizer/compressed/*.def, RECON §3.16) and tag suggestions
// (image.novelai.net/ai/generate-image/suggest-tags, RECON §3.1). Tokenizers are kept on disk.
import fs from 'node:fs';
import path from 'node:path';

export const TOKENIZER_FILES = new Set(['clip_tokenizer.def', 't5_tokenizer.def', 'qwen35_tokenizer.def']);
export const DEFAULT_STATIC_URL = 'https://novelai.net';

export class FileCache {
    /** @param {string} dir */
    constructor(dir) {
        this.dir = dir;
        fs.mkdirSync(dir, { recursive: true });
    }

    /** @param {string} name */
    get(name) {
        try {
            return fs.readFileSync(path.join(this.dir, name));
        } catch {
            return null;
        }
    }

    /** @param {string} name @param {Buffer} data */
    set(name, data) {
        const file = path.join(this.dir, name);
        fs.writeFileSync(`${file}.tmp`, data);
        fs.renameSync(`${file}.tmp`, file);
    }
}

async function fetchWithTimeout(fetchImpl, url, timeoutMs, signal) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
        return await fetchImpl(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
}

/**
 * Tokenizer definition (raw-deflate JSON, passed to the browser as is), from the disk cache or
 * downloaded once. Only the three known file names are accepted.
 */
export async function loadTokenizer({
    name,
    cache,
    fetchImpl,
    baseUrl = DEFAULT_STATIC_URL,
    timeoutMs = 60000,
    signal,
}) {
    if (!TOKENIZER_FILES.has(name)) throw Object.assign(new Error('Unknown tokenizer'), { status: 404 });
    const cached = cache?.get(name);
    if (cached) return { data: cached, cached: true };
    const response = await fetchWithTimeout(
        fetchImpl,
        `${baseUrl}/tokenizer/compressed/${name}?v=2&static=true`,
        timeoutMs,
        signal,
    );
    if (!response.ok) throw Object.assign(new Error(`NovelAI answered ${response.status}`), { status: 502 });
    const data = Buffer.from(await response.arrayBuffer());
    cache?.set(name, data);
    return { data, cached: false };
}

/** NovelAI tag suggestions; the endpoint needs no authorization. */
export async function suggestTags({ model, prompt, lang = 'en', fetchImpl, baseUrl, timeoutMs = 10000, signal }) {
    const query = new URLSearchParams({
        model: String(model),
        prompt: String(prompt),
        lang: lang === 'jp' ? 'jp' : 'en',
    });
    const response = await fetchWithTimeout(
        fetchImpl,
        `${baseUrl}/ai/generate-image/suggest-tags?${query}`,
        timeoutMs,
        signal,
    );
    if (!response.ok) throw Object.assign(new Error(`NovelAI answered ${response.status}`), { status: 502 });
    const data = await response.json();
    const tags = Array.isArray(data?.tags) ? data.tags : [];
    return tags
        .filter((t) => t && typeof t.tag === 'string')
        .map((t) => ({ tag: t.tag, count: Number(t.count) || 0, confidence: Number(t.confidence) || 0 }));
}
