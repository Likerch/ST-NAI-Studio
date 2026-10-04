// Scene hints of other extensions (v0.10, NAI_STUDIO_API.registerSceneProvider): where the scene of a
// reply takes place and who is there. Several providers may answer; the one with the highest priority
// wins each field on its own, and the scene falls back to NAI Studio's own sources for the rest. Pure.

export interface SceneHint {
    /** Stable id of the place (Maestro place id); location continuity binds to it. */
    locationId?: string;
    /** Name of the place as the story calls it. */
    locationName?: string;
    /** Setting tags (comma-separated) for every picture of the scene. */
    tags?: string;
    /** Names of the characters present. */
    characters?: string[];
}

const HINT_FIELDS = ['locationId', 'locationName', 'tags', 'characters'] as const;

function text(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
}

/** Defensive parse of what a provider returned; null when it says nothing usable. */
export function normalizeSceneHint(raw: unknown): SceneHint | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const source = raw as Record<string, unknown>;
    const hint: SceneHint = {};
    const locationId = text(source.locationId);
    if (locationId) hint.locationId = locationId;
    const locationName = text(source.locationName);
    if (locationName) hint.locationName = locationName;
    const tags = Array.isArray(source.tags)
        ? text(source.tags.filter((t): t is string => typeof t === 'string').join(', '))
        : text(source.tags);
    if (tags) hint.tags = tags;
    if (Array.isArray(source.characters)) {
        const seen = new Set<string>();
        const names = source.characters.map(text).filter((name): name is string => {
            if (!name || seen.has(name.toLowerCase())) return false;
            seen.add(name.toLowerCase());
            return true;
        });
        if (names.length) hint.characters = names;
    }
    return HINT_FIELDS.some((field) => hint[field] !== undefined) ? hint : null;
}

/** Hints in priority order (best first): each field from the first hint that has it. */
export function mergeSceneHints(ordered: readonly (SceneHint | null | undefined)[]): SceneHint {
    const result: SceneHint = {};
    for (const hint of ordered) {
        if (!hint) continue;
        if (result.locationId === undefined && hint.locationId) result.locationId = hint.locationId;
        if (result.locationName === undefined && hint.locationName) result.locationName = hint.locationName;
        if (result.tags === undefined && hint.tags) result.tags = hint.tags;
        if (result.characters === undefined && hint.characters?.length) result.characters = [...hint.characters];
    }
    return result;
}

/** Providers sorted by priority, highest first; equal priorities keep their registration order. */
export function byPriority<T extends { priority: number }>(providers: readonly T[]): T[] {
    return providers
        .map((provider, index) => ({ provider, index }))
        .sort((a, b) => b.provider.priority - a.provider.priority || a.index - b.index)
        .map(({ provider }) => provider);
}
