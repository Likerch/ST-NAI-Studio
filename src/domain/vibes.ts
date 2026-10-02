// Vibe library (TZ Phase 5): vibes (reference images) and named sets bound to characters, chats
// or styles; each set entry has its own strength and information-extracted value. Pure: images
// and encodings live in IndexedDB / the plugin's disk cache.
import type { ModelCapabilities } from './capabilities';
import type { ModelId } from './models';

export interface VibeItem {
    id: string;
    name: string;
    /** SHA-256 of the base64 image (same value the plugin cache uses). */
    imageHash: string;
    /** Keys in IndexedDB. */
    imageKey: string;
    thumbKey: string;
    createdAt: string;
}

export interface VibeSetEntry {
    vibeId: string;
    strength: number;
    informationExtracted: number;
    enabled: boolean;
}

export interface VibeSet {
    id: string;
    name: string;
    enabled: boolean;
    /** Applies everywhere when true; otherwise only where a binding matches. */
    global: boolean;
    entries: VibeSetEntry[];
    bindings: { characters: string[]; chats: string[]; styles: string[] };
}

export interface VibeContext {
    /** Avatar keys of the characters in the current chat. */
    characters: string[];
    chatId: string;
    style: string;
}

/** Defaults of the web client (RECON §3.12): strength 0.6, information extracted 1 (0.7 on V4.5 Full). */
export function defaultVibeEntry(vibeId: string, model?: ModelId): VibeSetEntry {
    return { vibeId, strength: 0.6, informationExtracted: model === 'nai-diffusion-4-5-full' ? 0.7 : 1, enabled: true };
}

export function setApplies(set: VibeSet, ctx: VibeContext): boolean {
    if (!set.enabled) return false;
    if (set.global) return true;
    return (
        set.bindings.characters.some((c) => ctx.characters.includes(c)) ||
        (ctx.chatId !== '' && set.bindings.chats.includes(ctx.chatId)) ||
        (ctx.style !== '' && set.bindings.styles.includes(ctx.style))
    );
}

export interface PlannedVibe {
    item: VibeItem;
    strength: number;
    informationExtracted: number;
}

/**
 * Vibes for a generation: enabled entries of every applicable set, first occurrence of a vibe
 * wins, capped at 16 (the web client's maximum).
 */
export function planVibes(sets: readonly VibeSet[], items: readonly VibeItem[], ctx: VibeContext): PlannedVibe[] {
    const byId = new Map(items.map((i) => [i.id, i]));
    const seen = new Set<string>();
    const result: PlannedVibe[] = [];
    for (const set of sets) {
        if (!setApplies(set, ctx)) continue;
        for (const entry of set.entries) {
            const item = byId.get(entry.vibeId);
            if (!entry.enabled || !item || seen.has(item.id)) continue;
            seen.add(item.id);
            result.push({
                item,
                strength: clamp(entry.strength, -1, 1),
                informationExtracted: clamp(entry.informationExtracted, 0.01, 1),
            });
        }
    }
    return result.slice(0, 16);
}

function clamp(value: number, min: number, max: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : max;
}

/** Why vibes cannot be used right now (the UI says it explicitly instead of hiding the feature). */
export type VibeAvailability = 'ok' | 'feature-flag-off' | 'not-supported' | 'transport';

export function vibeAvailability(
    caps: Pick<ModelCapabilities, 'vibeTransfer' | 'vibeKind' | 'family'>,
    transportSupportsVibes: boolean,
): VibeAvailability {
    if (caps.family === 'v5')
        return caps.vibeTransfer ? (transportSupportsVibes ? 'ok' : 'transport') : 'feature-flag-off';
    if (!caps.vibeTransfer || caps.vibeKind === 'none') return 'not-supported';
    return transportSupportsVibes ? 'ok' : 'transport';
}

/** Client-side encoding cache key (the plugin keeps its own disk cache with a hashed key). */
export function encodingCacheKey(imageHash: string, model: string, informationExtracted: number): string {
    return `vibeenc:${imageHash}:${model}:${(Math.round(informationExtracted * 100) / 100).toFixed(2)}`;
}
