// Gallery of every generation (TZ Phase 3): records, search and filters. Pure.
import type { InlineGenerationMeta } from './inline';

export interface GalleryRecord {
    id: string;
    createdAt: string;
    /** Chat the image was made in ('' = panel / no chat). */
    chatId: string;
    /** Character name or group name at generation time. */
    characterName: string;
    /** Where the image went: chat message, inline image, panel. */
    target: 'message' | 'inline' | 'panel' | 'other';
    /** Path in /user/images ('' when not saved on the server). */
    filePath: string;
    /** Full image in IndexedDB ('' when not kept). */
    blobKey: string;
    /** Small preview in IndexedDB. */
    thumbKey: string;
    mime: string;
    meta: InlineGenerationMeta;
    favorite: boolean;
    /** User tags in addition to the prompt tags. */
    tags: string[];
    /** Inline image id, when the record belongs to one. */
    inlineId?: string;
}

export interface GalleryQuery {
    text: string;
    model: string;
    character: string;
    chatId: string;
    /** ISO dates (inclusive), '' = open. */
    from: string;
    to: string;
    favoritesOnly: boolean;
    sort: 'newest' | 'oldest';
}

export function emptyQuery(): GalleryQuery {
    return { text: '', model: '', character: '', chatId: '', from: '', to: '', favoritesOnly: false, sort: 'newest' };
}

/** Prompt tags (comma-separated, weights and braces removed) for search and the tag filter. */
export function promptTags(prompt: string): string[] {
    return prompt
        .split(/[,|\n]/)
        .map((t) =>
            t
                .replace(/-?\d+(\.\d+)?::/g, '')
                .replace(/::/g, '')
                .replace(/[{}[\]()]/g, '')
                .trim()
                .replace(/:\s*[\d.]+$/, '')
                .toLowerCase(),
        )
        .filter(Boolean);
}

function haystack(record: GalleryRecord): string {
    const m = record.meta;
    return [
        m.scenePrompt,
        m.prompt,
        m.sourcePrompt ?? '',
        m.negative,
        record.characterName,
        record.tags.join(' '),
        String(m.seed),
        m.model,
        m.tool ?? '',
    ]
        .join('\n')
        .toLowerCase();
}

/** Every word of the query must appear somewhere (prompt, tags, seed, character, model). */
export function matchesQuery(record: GalleryRecord, query: GalleryQuery): boolean {
    if (query.favoritesOnly && !record.favorite) return false;
    if (query.model && record.meta.model !== query.model) return false;
    if (query.character && record.characterName !== query.character) return false;
    if (query.chatId && record.chatId !== query.chatId) return false;
    const day = record.createdAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    const words = query.text.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const text = haystack(record);
    return words.every((w) => text.includes(w));
}

export function filterRecords(records: readonly GalleryRecord[], query: GalleryQuery): GalleryRecord[] {
    const list = records.filter((r) => matchesQuery(r, query));
    list.sort((a, b) => (query.sort === 'oldest' ? 1 : -1) * a.createdAt.localeCompare(b.createdAt));
    return list;
}

/** Distinct values for the filter dropdowns. */
export function facets(records: readonly GalleryRecord[]): { models: string[]; characters: string[]; chats: string[] } {
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
        models: unique(records.map((r) => r.meta.model)),
        characters: unique(records.map((r) => r.characterName)),
        chats: unique(records.map((r) => r.chatId)),
    };
}

/** Field-by-field differences of two generations, for the side-by-side comparison. */
export function compareMeta(a: InlineGenerationMeta, b: InlineGenerationMeta): (keyof InlineGenerationMeta)[] {
    const keys: (keyof InlineGenerationMeta)[] = [
        'model',
        'seed',
        'width',
        'height',
        'steps',
        'scale',
        'cfgRescale',
        'sampler',
        'noiseSchedule',
        'ucPreset',
        'qualityPreset',
        'prompt',
        'negativePrompt',
    ];
    return keys.filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}
