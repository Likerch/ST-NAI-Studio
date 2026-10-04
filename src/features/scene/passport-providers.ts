// Passport providers of other extensions (v0.12, NAI_STUDIO_API.registerPassportProvider): Maestro gives
// the passports of the lore entries activated or mentioned in a scene (places, items, creatures, people
// without a card). Scenes, image markers and the DES integration add them after the passports of the
// cards, the persona and the chat, which win by name or alias. Providers are asked in parallel (higher
// priority first in the list), each has 3 s; a failed or silent one is skipped. Without a provider
// nothing changes.
import { byPriority, normalizeProvidedPassports } from '../../domain';
import type { Passport } from '../../domain';
import { askInTime, hintContext } from './scene-providers';
import type { SceneHintContext } from './scene-providers';

export interface ScenePassportProvider {
    id: string;
    /** Higher first: its passport wins a name another provider also gives. */
    priority: number;
    /** Passports in NAI Studio's format (src/domain/passport.ts); anything unusable is skipped. */
    passports(context: SceneHintContext): Promise<unknown> | unknown;
}

/** Answers are reused for the same message and text this long (one picture asks several times). */
const CACHE_MS = 1500;

let providers: ScenePassportProvider[] = [];
let cache: { key: string; at: number; list: Promise<Passport[]> } | null = null;

/** Registers a provider; one with the same id is replaced. Returns the unregistration. */
export function registerScenePassportProvider(provider: ScenePassportProvider): () => void {
    providers = [...providers.filter((p) => p.id !== provider.id), provider];
    cache = null;
    return () => {
        if (!providers.includes(provider)) return;
        providers = providers.filter((p) => p !== provider);
        cache = null;
    };
}

export function scenePassportProviders(): ScenePassportProvider[] {
    return byPriority(providers);
}

export function clearScenePassportProviders(): void {
    providers = [];
    cache = null;
}

async function ask(provider: ScenePassportProvider, context: SceneHintContext): Promise<Passport[]> {
    const answer = await askInTime<unknown>(
        `passport provider ${provider.id}`,
        () => provider.passports({ ...context }),
        null,
    );
    return normalizeProvidedPassports(answer, provider.id);
}

/**
 * Passports every provider gives for a scene (the message of a marker, else the last message), best
 * provider first, as copies; empty without providers.
 */
export async function providedPassports(query: { messageId?: number; text?: string } = {}): Promise<Passport[]> {
    const ordered = scenePassportProviders();
    if (!ordered.length) return [];
    const context = hintContext(query);
    const key = `${context.messageIndex}\u0000${context.text}`;
    const now = Date.now();
    if (cache && cache.key === key && now - cache.at < CACHE_MS) return structuredClone(await cache.list);
    const list = Promise.all(ordered.map((provider) => ask(provider, context))).then((lists) => lists.flat());
    cache = { key, at: now, list };
    return structuredClone(await list);
}
