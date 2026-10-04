// Scene continuity (TZ Phase 6): the last image of a location becomes the img2img base or a vibe
// for the next picture there; the binding "location → reference" lives in the chat metadata.

export interface LocationRef {
    /** Display name as the user typed it. */
    name: string;
    /** Image in /user/images. */
    filePath: string;
    width: number;
    height: number;
    model: string;
    seed: number;
    prompt: string;
    updatedAt: string;
}

export type ContinuityMode = 'img2img' | 'vibe';

export function locationKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The known location named in the text (whole words, case-insensitive; the longest name wins). */
export function detectLocation(text: string, names: string[]): string | null {
    const sorted = [...names].filter((n) => n.trim()).sort((a, b) => b.length - a.length);
    for (const name of sorted) {
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(name.trim())}($|[^\\p{L}\\p{N}])`, 'iu');
        if (pattern.test(text)) return name;
    }
    return null;
}

/** Prefix of the continuity keys of places with a stable id (Maestro places, v0.10). */
export const PLACE_KEY_PREFIX = 'place:';

export function placeKey(id: string): string {
    return `${PLACE_KEY_PREFIX}${id.trim()}`;
}

/** A place of Maestro's place registry (MAESTRO_PLACES version 1), the fields continuity uses. */
export interface PlaceInfo {
    id: string;
    name: string;
    aliases: string[];
    parent: string | null;
}

/** Defensive parse of a place another extension returned; null when it has no id. */
export function normalizePlace(raw: unknown): PlaceInfo | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const source = raw as Record<string, unknown>;
    const id = typeof source.id === 'string' ? source.id.trim() : '';
    if (!id) return null;
    return {
        id,
        name: typeof source.name === 'string' ? source.name.trim() : '',
        aliases: Array.isArray(source.aliases)
            ? source.aliases.filter((a): a is string => typeof a === 'string' && a.trim() !== '').map((a) => a.trim())
            : [],
        parent: typeof source.parent === 'string' && source.parent ? source.parent : null,
    };
}

/**
 * Keys under which the reference of a location may be stored, best first: the place id, then the
 * name keys of the label, the place's name and its aliases (references bound before place ids).
 * Without a place: the name key of the label only (the behaviour before v0.10).
 */
export function locationKeys(label: string, place: PlaceInfo | null): string[] {
    const keys = place
        ? [placeKey(place.id), ...[label, place.name, ...place.aliases].map(locationKey)]
        : [locationKey(label)];
    return [...new Set(keys.filter(Boolean))];
}

/** Strength for img2img continuity: low keeps the place, high follows the new prompt. */
export function clampContinuityStrength(value: number): number {
    return Number.isFinite(value) ? Math.min(0.95, Math.max(0.1, value)) : 0.6;
}
