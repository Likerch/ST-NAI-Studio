// Tag autocomplete (TZ Phase 6): a local Danbooru tag list with post counts and aliases, plus
// Russian aliases; suggestions while typing and a warning about unknown tags. Pure.

/** [name, category, post count, "alias1,alias2"?] — the compact form of src/data/tags.json. */
export type TagRow = [string, number, number, string?];

export const TAG_CATEGORIES: Record<number, string> = {
    0: 'general',
    1: 'artist',
    3: 'copyright',
    4: 'character',
    5: 'meta',
};

export interface TagEntry {
    /** As NovelAI expects it: spaces instead of underscores (emoticons such as `^_^` kept). */
    name: string;
    category: number;
    count: number;
    aliases: string[];
}

export interface TagIndex {
    entries: TagEntry[];
    byName: Map<string, TagEntry>;
    /** Danbooru aliases and Russian aliases → entry. */
    byAlias: Map<string, TagEntry>;
    russian: { word: string; entry: TagEntry }[];
}

export interface TagSuggestion {
    entry: TagEntry;
    /** The alias that matched, when it was not the name itself. */
    via?: string;
}

/** NovelAI's own quality, aesthetic and dataset tags (not Danbooru tags, but known to the models). */
export const NOVELAI_TAGS = [
    'masterpiece',
    'best quality',
    'amazing quality',
    'great quality',
    'good quality',
    'normal quality',
    'bad quality',
    'worst quality',
    'very aesthetic',
    'aesthetic',
    'displeasing',
    'very displeasing',
    'no text',
    'detailed',
    'detailed background',
    'location',
    'fur dataset',
    'background dataset',
    'artistic error',
    'jpeg artifacts',
    'lowres',
    'bad anatomy',
    'bad hands',
    'white haze',
    'sepia',
];

const EMOTICON = /^[^a-z0-9]*[a-z0-9]?_[a-z0-9]?[^a-z0-9]*$/i;

export function tagName(raw: string): string {
    const lower = raw.trim().toLowerCase();
    return lower.length <= 4 && EMOTICON.test(lower) ? lower : lower.replace(/_/g, ' ');
}

const key = (text: string) => tagName(text).replace(/\s+/g, ' ');

export function buildTagIndex(
    rows: TagRow[],
    russian: Record<string, string> = {},
    known: readonly string[] = NOVELAI_TAGS,
): TagIndex {
    const entries: TagEntry[] = rows.map(([name, category, count, aliases]) => ({
        name: tagName(name),
        category,
        count,
        aliases: aliases
            ? aliases
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
            : [],
    }));
    const byName = new Map(entries.map((e) => [e.name, e]));
    const ensure = (name: string): TagEntry => {
        const k = key(name);
        let entry = byName.get(k);
        if (!entry) {
            entry = { name: k, category: 0, count: 0, aliases: [] };
            byName.set(k, entry);
        }
        return entry;
    };
    known.forEach(ensure);
    const byAlias = new Map<string, TagEntry>();
    for (const entry of entries) {
        for (const alias of entry.aliases) {
            const k = key(alias.replace(/^\//, ''));
            if (k && !byName.has(k) && !byAlias.has(k)) byAlias.set(k, entry);
        }
    }
    const ru: TagIndex['russian'] = [];
    for (const [word, target] of Object.entries(russian)) {
        const entry = ensure(target);
        ru.push({ word: word.toLowerCase(), entry });
        byAlias.set(word.toLowerCase(), entry);
    }
    return { entries, byName, byAlias, russian: ru };
}

/** Prefix matches by post count: names first, then aliases and Russian words. */
export function suggestTags(index: TagIndex, query: string, limit = 8): TagSuggestion[] {
    const q = key(query);
    if (q.length < 2) return [];
    const out: TagSuggestion[] = [];
    const seen = new Set<string>();
    const add = (entry: TagEntry, via?: string) => {
        if (seen.has(entry.name) || out.length >= limit) return;
        seen.add(entry.name);
        out.push(via ? { entry, via } : { entry });
    };
    // entries are sorted by count in the data file, so the first matches are the most used.
    for (const entry of index.entries) {
        if (entry.name.startsWith(q)) add(entry);
        if (out.length >= limit) return out;
    }
    for (const r of index.russian) if (r.word.startsWith(q)) add(r.entry, r.word);
    for (const entry of index.entries) {
        if (out.length >= limit) break;
        const alias = entry.aliases.find((a) => key(a.replace(/^\//, '')).startsWith(q));
        if (alias) add(entry, alias);
    }
    if (out.length < limit && q.length >= 3) {
        for (const entry of index.entries) {
            if (out.length >= limit) break;
            if (entry.name.includes(q)) add(entry);
        }
    }
    return out;
}

/** The word being typed at the cursor (from the last comma, `|`, newline or brace). */
export function currentFragment(text: string, cursor: number): { start: number; fragment: string } {
    let start = cursor;
    const stop = (i: number) => /[,|\n{}[\]]/.test(text[i] as string) || (text[i] === ':' && text[i - 1] === ':');
    while (start > 0 && !stop(start - 1)) start--;
    const raw = text.slice(start, cursor);
    const lead = raw.length - raw.trimStart().length;
    return { start: start + lead, fragment: raw.trimStart() };
}

/** Plain tags of a prompt: weights, braces, `text:` blocks and quoted phrases removed. */
export function tagsOfPrompt(prompt: string): string[] {
    const withoutText = prompt.replace(/(?:^|[\s,])te?xt:[\s\S]*$/i, '');
    return withoutText
        .split(/[,|\n]/)
        .map((t) =>
            t
                .replace(/-?\d*\.?\d+::/g, '')
                .replace(/::/g, '')
                .replace(/[{}[\]]/g, '')
                .replace(/"[^"]*"/g, '')
                .trim(),
        )
        .filter(Boolean);
}

/** Tags that are neither in the list nor aliases; sentences and `artist:`-style prefixes are skipped. */
export function unknownTags(index: TagIndex, prompt: string): string[] {
    const unknown = new Set<string>();
    for (const tag of tagsOfPrompt(prompt)) {
        const k = key(tag);
        if (k.split(' ').length > 4) continue;
        if (/^[a-z]+:/.test(k)) continue;
        if (/^\d+(girl|boy|other)s?$/.test(k) || /^year \d{4}$/.test(k)) continue;
        if (index.byName.has(k) || index.byAlias.has(k)) continue;
        unknown.add(tag);
    }
    return [...unknown];
}

/** Replaces the fragment at the cursor with a tag and a separator; returns the new text and cursor. */
export function insertTag(text: string, start: number, cursor: number, tag: string): { text: string; cursor: number } {
    const after = text.slice(cursor);
    const nextIsSeparator = /^\s*[,|]/.test(after);
    const insert = nextIsSeparator ? tag : `${tag}, `;
    const result = text.slice(0, start) + insert + after.replace(/^[^\s,|{}[\]:]*/, '');
    return { text: result, cursor: start + insert.length };
}
