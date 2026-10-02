// Scene continuity (TZ Phase 6): "location -> reference image" in the chat metadata. With the
// switch on, a plain generation at a known location starts from its last image (img2img), or the
// image joins the vibes (vibe mode, through the vibe library and its Anlas rules). New pictures
// re-bind the current location when auto-bind is on. A location named in the text becomes current.
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { clampContinuityStrength, detectLocation, locationKey } from '../../domain';
import type { LocationRef, PlannedVibe } from '../../domain';
import type { ContinuityProvider, GenerationObserver } from '../generation/pipeline';
import { blobToBase64, toPngBlob } from '../images/image-utils';
import { addVibe, removeVibe } from '../vibes/vibe-library';

const META_KEY = 'nai_studio';

export interface StoredLocation extends LocationRef {
    /** Vibe library item made from the reference (vibe mode). */
    vibeId?: string;
}

export interface ContinuityData {
    current: string;
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

export async function setCurrentLocation(name: string): Promise<void> {
    data().current = name.trim();
    await ctx().saveMetadata();
}

export async function forgetLocation(name: string): Promise<void> {
    const d = data();
    const key = locationKey(name);
    const old = d.locations[key];
    delete d.locations[key];
    if (locationKey(d.current) === key) d.current = '';
    await ctx().saveMetadata();
    if (old?.vibeId) await removeVibe(old.vibeId);
}

/** Makes the image the reference of the location; in vibe mode also a vibe library item. */
export async function bindLocation(name: string, ref: Omit<LocationRef, 'name' | 'updatedAt'>): Promise<void> {
    const d = data();
    const key = locationKey(name);
    if (!key) return;
    const previous = d.locations[key];
    const stored: StoredLocation = { ...ref, name: name.trim(), updatedAt: new Date().toISOString() };
    if (settings().continuity.mode === 'vibe') {
        try {
            const response = await fetch(ref.filePath);
            if (response.ok) stored.vibeId = (await addVibe(await response.blob(), `@${name.trim()}`)).id;
        } catch (error) {
            log.warn('continuity vibe not created:', error);
        }
    }
    d.locations[key] = stored;
    d.current ||= name.trim();
    await ctx().saveMetadata();
    if (previous?.vibeId && previous.vibeId !== stored.vibeId) await removeVibe(previous.vibeId);
}

export class ContinuityService implements ContinuityProvider {
    private follow(text: string): ContinuityData {
        const d = data();
        const detected = detectLocation(
            text,
            Object.values(d.locations).map((l) => l.name),
        );
        if (detected && locationKey(detected) !== locationKey(d.current)) {
            d.current = detected;
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
        const ref = d.locations[locationKey(d.current)];
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
        const d = data();
        const vibeId = d.locations[locationKey(d.current)]?.vibeId;
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
        void bindLocation(d.current, {
            filePath: path,
            width: produced.meta.width,
            height: produced.meta.height,
            model: produced.meta.model,
            seed: produced.meta.seed,
            prompt: produced.meta.scenePrompt,
        }).catch((error: unknown) => log.warn('continuity bind failed:', error));
    };
}
