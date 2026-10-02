// Local tag list (src/data/tags.json: the 20 000 most used Danbooru tags with counts and aliases)
// and Russian aliases (src/data/tags-ru.json), loaded on first use; NovelAI's suggestions through
// the plugin as a second source.
import { extensionBaseUrl, requestHeaders } from '../../core/context';
import { log } from '../../core/logger';
import { buildTagIndex } from '../../domain';
import type { TagIndex, TagRow } from '../../domain';
import { fetchTagSuggestions } from '../../transport';
import type { RemoteTagSuggestion } from '../../transport';

let index: Promise<TagIndex | null> | null = null;
let loaded: TagIndex | null = null;
const remoteCache = new Map<string, RemoteTagSuggestion[]>();

async function fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${extensionBaseUrl()}/${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return (await response.json()) as T;
}

export function tagIndex(): Promise<TagIndex | null> {
    if (!index) {
        index = Promise.all([
            fetchJson<TagRow[]>('src/data/tags.json'),
            fetchJson<Record<string, string>>('src/data/tags-ru.json'),
        ])
            .then(([rows, ru]) => {
                loaded = buildTagIndex(rows, ru);
                log.info('tag list ready:', rows.length, 'tags');
                return loaded;
            })
            .catch((error: unknown) => {
                log.warn('tag list unavailable:', error);
                index = null;
                return null;
            });
    }
    return index;
}

export function readyTagIndex(): TagIndex | null {
    return loaded;
}

/** NovelAI suggestions for a fragment (cached per model and fragment). */
export async function remoteTagSuggestions(
    model: string,
    fragment: string,
    signal?: AbortSignal,
): Promise<RemoteTagSuggestion[]> {
    const key = `${model}\u0000${fragment.toLowerCase()}`;
    const cached = remoteCache.get(key);
    if (cached) return cached;
    const tags = await fetchTagSuggestions(
        { fetch: (input, init) => fetch(input, init), headers: () => requestHeaders() },
        model,
        fragment,
        signal,
    );
    if (remoteCache.size > 500) remoteCache.clear();
    remoteCache.set(key, tags);
    return tags;
}
