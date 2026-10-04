// Scene continuity (TZ Phase 6): "location -> reference image" in the chat metadata. With the
// switch on, a plain generation at a known location starts from its last image (img2img), or the
// image joins the vibes (vibe mode, through the vibe library and its Anlas rules). New pictures
// re-bind the current location when auto-bind is on. A location named in the text becomes current.
// Since v0.10 a place with a stable id (Maestro's MAESTRO_PLACES, or a scene provider's location id)
// keeps its reference under "place:<id>"; references bound under the name before are still found and
// move to the id key on the next save.
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { clampContinuityStrength, detectLocation, locationKey, locationKeys, placeKey } from '../../domain';
import type { LocationRef, PlaceInfo, PlannedVibe } from '../../domain';
import type { ContinuityProvider, GenerationObserver } from '../generation/pipeline';
import { blobToBase64, toPngBlob } from '../images/image-utils';
import { addVibe, removeVibe } from '../vibes/vibe-library';
import { followPlaces, placeById, resolvePlace, unfollowPlaces } from './places';

const META_KEY = 'nai_studio';

export interface StoredLocation extends LocationRef {
    /** Vibe library item made from the reference (vibe mode). */
    vibeId?: string;
    /** Stable place id of a reference kept under "place:<id>". */
    placeId?: string;
}

export interface ContinuityData {
    current: string;
    /** Place id of the current location, when it has one. */
    currentPlace?: string;
    locations: Record<string, StoredLocation>;
}

function data(): ContinuityData {
    const meta = ctx().chatMetadata;
    const root = (meta[META_KEY] ??= {}) as Record<string, unknown>;
    const value = root.continuity as Partial<ContinuityData> | undefined;
    if (!value || typeof value !== 'object') {
        root.continuity = { current: '', locations: {} };
    } else {
        value.current ??= '';
        value.locations ??= {};
    }
    return root.continuity as ContinuityData;
}

export function continuityData(): ContinuityData {
    return structuredClone(data());
}

/** The place of a location: the given id (with the registry's name and aliases), else the registry's match. */
function placeOf(label: string, placeId?: string): PlaceInfo | null {
    if (placeId?.trim()) {
        const id = placeId.trim();
        return placeById(id) ?? { id, name: label.trim(), aliases: [], parent: null };
    }
    return resolvePlace(label);
}

/** The place of the current location (its stored id first). */
function currentPlace(d: ContinuityData): PlaceInfo | null {
    return d.current ? placeOf(d.current, d.currentPlace) : null;
}

/** Reference of a location: under the place id, else under a name key of the label, the place or its aliases. */
function findReference(d: ContinuityData, label: string, place: PlaceInfo | null): [string, StoredLocation] | null {
    for (const key of locationKeys(label, place)) {
        const found = d.locations[key];
        if (found) return [key, found];
    }
    return null;
}

/** A reference found under a name key moves to the place id key (no reference there yet). */
function migrate(d: ContinuityData, label: string, place: PlaceInfo | null): void {
    if (!place) return;
    const target = placeKey(place.id);
    if (d.locations[target]) return;
    const found = findReference(d, label, place);
    if (!found || found[0] === target) return;
    d.locations[target] = { ...found[1], placeId: place.id };
    delete d.locations[found[0]];
    log.info(`continuity: reference of ${found[1].name} moved to ${target}`);
}

/** The reference of the current location, if any (the panel shows it). */
export function currentReference(d: ContinuityData = data()): StoredLocation | null {
    return d.current ? (findReference(d, d.current, currentPlace(d))?.[1] ?? null) : null;
}

function followMaestro(): void {
    followPlaces((place) => {
        if (!settings().continuity.enabled || !ctx().getCurrentChatId()) return;
        void setCurrentLocation(place.name || place.id, place.id).catch((error: unknown) =>
            log.warn('continuity: place not set', error),
        );
    });
}

/** `placeId`: the stable id of the place, when the caller knows it (a scene provider). */
export async function setCurrentLocation(name: string, placeId?: string): Promise<void> {
    followMaestro();
    const d = data();
    d.current = name.trim();
    const place = d.current ? placeOf(d.current, placeId) : null;
    if (place) d.currentPlace = place.id;
    else delete d.currentPlace;
    migrate(d, d.current, place);
    await ctx().saveMetadata();
}

export async function forgetLocation(name: string): Promise<void> {
    const d = data();
    const place = locationKey(name) === locationKey(d.current) ? currentPlace(d) : placeOf(name);
    const keys = locationKeys(name, place);
    const removed = keys.map((key) => d.locations[key]).filter((l): l is StoredLocation => Boolean(l));
    for (const key of keys) delete d.locations[key];
    if (locationKey(d.current) === locationKey(name)) {
        d.current = '';
        delete d.currentPlace;
    }
    await ctx().saveMetadata();
    for (const old of removed) if (old.vibeId) await removeVibe(old.vibeId);
}

/** Makes the image the reference of the location; in vibe mode also a vibe library item. */
export async function bindLocation(
    name: string,
    ref: Omit<LocationRef, 'name' | 'updatedAt'>,
    placeId?: string,
): Promise<void> {
    const d = data();
    const label = name.trim();
    if (!locationKey(label)) return;
    const place = placeOf(
        label,
        placeId ?? (locationKey(label) === locationKey(d.current) ? d.currentPlace : undefined),
    );
    const keys = locationKeys(label, place);
    const key = keys[0]!;
    const previous = keys.map((k) => d.locations[k]).filter((l): l is StoredLocation => Boolean(l));
    const stored: StoredLocation = { ...ref, name: label, updatedAt: new Date().toISOString() };
    if (place) stored.placeId = place.id;
    if (settings().continuity.mode === 'vibe') {
        try {
            const response = await fetch(ref.filePath);
            if (response.ok) stored.vibeId = (await addVibe(await response.blob(), `@${label}`)).id;
        } catch (error) {
            log.warn('continuity vibe not created:', error);
        }
    }
    // The old name keys of a place give way to its id key.
    for (const old of keys.slice(1)) delete d.locations[old];
    d.locations[key] = stored;
    if (!d.current) {
        d.current = label;
        if (place) d.currentPlace = place.id;
    }
    await ctx().saveMetadata();
    for (const old of previous) if (old.vibeId && old.vibeId !== stored.vibeId) await removeVibe(old.vibeId);
}

export class ContinuityService implements ContinuityProvider {
    private follow(text: string): ContinuityData {
        followMaestro();
        const d = data();
        const detected = detectLocation(
            text,
            Object.values(d.locations).map((l) => l.name),
        );
        if (detected && locationKey(detected) !== locationKey(d.current)) {
            const stored = Object.values(d.locations).find((l) => locationKey(l.name) === locationKey(detected));
            d.current = detected;
            const place = placeOf(detected, stored?.placeId);
            if (place) d.currentPlace = place.id;
            else delete d.currentPlace;
            migrate(d, detected, place);
            void ctx().saveMetadata();
            log.info('continuity: location', detected);
        }
        return d;
    }

    async prepare(input: Parameters<ContinuityProvider['prepare']>[0]): ReturnType<ContinuityProvider['prepare']> {
        const s = settings().continuity;
        if (!s.enabled) return null;
        const d = this.follow(input.text);
        if (s.mode !== 'img2img' || !d.current) return null;
        const ref = currentReference(d);
        if (!ref?.filePath) return null;
        const response = await fetch(ref.filePath, { signal: input.signal });
        if (!response.ok) return null;
        const png = await toPngBlob(await response.blob(), input.size);
        log.info('continuity: img2img from', ref.name);
        return { image: await blobToBase64(png), strength: clampContinuityStrength(s.strength) };
    }

    /** Vibe mode: the reference of the current location as an extra vibe. */
    vibes(): PlannedVibe[] {
        const s = settings().continuity;
        if (!s.enabled || s.mode !== 'vibe' || !ctx().getCurrentChatId()) return [];
        const vibeId = currentReference(data())?.vibeId;
        const item = vibeId ? settings().vibes.items.find((i) => i.id === vibeId) : undefined;
        return item ? [{ item, strength: 0.6, informationExtracted: 1 }] : [];
    }

    /** Auto-bind: plain generations (not tool results) become the reference of the current location. */
    readonly observe: GenerationObserver = (produced, outcome) => {
        const s = settings().continuity;
        if (!s.enabled || !s.autoBind || produced.meta.tool) return;
        if (produced.meta.requestType !== 'txt2img' && produced.meta.requestType !== 'img2img') return;
        if (produced.chatId !== ctx().getCurrentChatId()) return;
        const d = data();
        const path = outcome.paths[0];
        if (!d.current || !path) return;
        void bindLocation(
            d.current,
            {
                filePath: path,
                width: produced.meta.width,
                height: produced.meta.height,
                model: produced.meta.model,
                seed: produced.meta.seed,
                prompt: produced.meta.scenePrompt,
            },
            d.currentPlace,
        ).catch((error: unknown) => log.warn('continuity bind failed:', error));
    };
}

/** Starts following Maestro's places (app ready; continuity calls it too, so a late Maestro is found). */
export function startPlaceFollowing(): void {
    followMaestro();
}

export function stopPlaceFollowing(): void {
    unfollowPlaces();
}
