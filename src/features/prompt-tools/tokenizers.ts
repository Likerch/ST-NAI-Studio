// Tokenizers for the live token counter (TZ Phase 6): the web client's own definition files,
// fetched once through the plugin (or ST's CORS proxy), kept in IndexedDB, built lazily per kind.
// Without any route the counter falls back to an estimate and says so.
import { requestHeaders } from '../../core/context';
import { log } from '../../core/logger';
import { store } from '../../core/storage';
import { approximateTokens, ByteBpeTokenizer, ClipTokenizer, T5Tokenizer, TOKENIZER_FILES } from '../../domain';
import type { TokenCounter, TokenizerKind } from '../../domain';
import { fetchTokenizerDefinition } from '../../transport';
import type { TransportEnv } from '../../transport';

const env: TransportEnv = { fetch: (input, init) => fetch(input, init), headers: () => requestHeaders() };
const loading = new Map<TokenizerKind, Promise<TokenCounter | null>>();
const ready = new Map<TokenizerKind, TokenCounter>();

export const APPROXIMATE: TokenCounter = { count: approximateTokens };

async function inflateRaw(data: ArrayBuffer): Promise<string> {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
}

function build(kind: TokenizerKind, json: unknown): TokenCounter {
    if (kind === 'clip') return new ClipTokenizer((json as { text: string }).text);
    if (kind === 't5') return new T5Tokenizer(json as ConstructorParameters<typeof T5Tokenizer>[0]);
    return new ByteBpeTokenizer(json as ConstructorParameters<typeof ByteBpeTokenizer>[0]);
}

async function load(kind: TokenizerKind): Promise<TokenCounter | null> {
    const file = TOKENIZER_FILES[kind];
    const key = `tokdef:${file}`;
    let data = await store().getItem<ArrayBuffer>(key);
    if (!data) {
        data = await fetchTokenizerDefinition(env, file);
        if (!data) {
            log.warn('tokenizer unavailable, counting approximately:', file);
            return null;
        }
        await store().setItem(key, data);
    }
    const counter = build(kind, JSON.parse(await inflateRaw(data)));
    ready.set(kind, counter);
    log.info('tokenizer ready:', file);
    return counter;
}

/** Starts loading (once) and resolves with the tokenizer, or null when it cannot be had. */
export function loadTokenizer(kind: TokenizerKind): Promise<TokenCounter | null> {
    let promise = loading.get(kind);
    if (!promise) {
        promise = load(kind).catch((error: unknown) => {
            log.warn('tokenizer failed to load:', error);
            loading.delete(kind);
            return null;
        });
        loading.set(kind, promise);
    }
    return promise;
}

/** The tokenizer if it is already built (synchronous, for typing). */
export function readyTokenizer(kind: TokenizerKind): TokenCounter | null {
    return ready.get(kind) ?? null;
}
