// Maestro's place registry (v0.10): when globalThis.MAESTRO_PLACES (version 1) is there, location
// continuity binds references to place ids instead of names, and follows the place the story enters.
// Without it nothing changes.
import { log } from '../../core/logger';
import { normalizePlace } from '../../domain';
import type { PlaceInfo } from '../../domain';

export const PLACES_GLOBAL = 'MAESTRO_PLACES';
export const PLACES_VERSION = 1;
/** Fired on window by Maestro when MAESTRO_PLACES appears. */
export const PLACES_READY_EVENT = 'maestro-places-ready';

/** MAESTRO_PLACES, version 1 (the members NAI Studio uses). */
export interface MaestroPlacesV1 {
    version: number;
    current(): unknown;
    resolve(label: string): unknown;
    list(): unknown;
    onEnter(listener: (place: unknown, previous?: unknown) => void): unknown;
}

const METHODS = ['current', 'resolve', 'list', 'onEnter'] as const;

/** The published registry when it is version 1 with every method; null otherwise. */
export function maestroPlaces(): MaestroPlacesV1 | null {
    const value = (globalThis as Record<string, unknown>)[PLACES_GLOBAL];
    if (typeof value !== 'object' || value === null) return null;
    const api = value as Record<string, unknown>;
    if (api.version !== PLACES_VERSION) return null;
    return METHODS.every((method) => typeof api[method] === 'function') ? (value as MaestroPlacesV1) : null;
}

function safe<T>(run: () => T, fallback: T): T {
    try {
        return run();
    } catch (error) {
        log.warn('MAESTRO_PLACES failed', error);
        return fallback;
    }
}

/** The place a label names (name, alias or case form); null without the registry or a match. */
export function resolvePlace(label: string): PlaceInfo | null {
    const api = maestroPlaces();
    if (!api || !label.trim()) return null;
    return safe(() => normalizePlace(api.resolve(label.trim())), null);
}

/** A place by id from the registry's list; null when absent. */
export function placeById(id: string): PlaceInfo | null {
    const api = maestroPlaces();
    if (!api) return null;
    const list = safe(() => api.list(), [] as unknown);
    const places = Array.isArray(list) ? list.map(normalizePlace) : [];
    return places.find((place) => place?.id === id) ?? null;
}

let subscribed: { api: MaestroPlacesV1; unsubscribe: () => void } | null = null;

/**
 * Follows the place the story enters (once per registry object; a new registry after a reload of
 * Maestro is subscribed again). Called whenever continuity is used, so a late Maestro is picked up.
 */
export function followPlaces(onEnter: (place: PlaceInfo) => void): void {
    const api = maestroPlaces();
    if (!api || subscribed?.api === api) return;
    unfollowPlaces();
    const result = safe(
        () =>
            api.onEnter((raw: unknown) => {
                const place = normalizePlace(raw);
                if (place) onEnter(place);
            }),
        undefined as unknown,
    );
    subscribed = { api, unsubscribe: typeof result === 'function' ? (result as () => void) : () => {} };
}

export function unfollowPlaces(): void {
    if (!subscribed) return;
    const { unsubscribe } = subscribed;
    subscribed = null;
    safe(() => unsubscribe(), undefined);
}
