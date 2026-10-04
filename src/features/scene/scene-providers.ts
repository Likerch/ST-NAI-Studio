// Scene providers of other extensions (v0.10, NAI_STUDIO_API.registerSceneProvider): the scene
// assembly asks them first (highest priority first, the first answer wins each field on its own) and
// falls back to its own sources (Doom's Enhancement Suite, names in the text) for the rest. Without
// a registered provider nothing changes.
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { byPriority, mergeSceneHints, normalizeSceneHint } from '../../domain';
import type { SceneHint } from '../../domain';

export interface SceneHintContext {
    /** Message the scene is about (the reply of a marker, or the last message). */
    messageIndex: number;
    /** Its text as written (a tracker may still be in it). */
    text: string;
}

export interface SceneHintProvider {
    id: string;
    /** Higher answers first. */
    priority: number;
    describe(context: SceneHintContext): Promise<SceneHint | null> | SceneHint | null;
}

/** A provider that does not answer in time is skipped for this scene. */
export const PROVIDER_TIMEOUT_MS = 3000;
/** Answers are reused for the same message and text this long (one picture asks several times). */
const CACHE_MS = 1500;

let providers: SceneHintProvider[] = [];
let cache: { key: string; at: number; hint: Promise<SceneHint> } | null = null;

/** Registers a provider; one with the same id is replaced. Returns the unregistration. */
export function registerSceneHintProvider(provider: SceneHintProvider): () => void {
    providers = [...providers.filter((p) => p.id !== provider.id), provider];
    cache = null;
    return () => {
        if (!providers.includes(provider)) return;
        providers = providers.filter((p) => p !== provider);
        cache = null;
    };
}

export function sceneHintProviders(): SceneHintProvider[] {
    return byPriority(providers);
}

export function clearSceneHintProviders(): void {
    providers = [];
    cache = null;
}

/** The message a scene query is about: the given one, else the last message that is not a system one. */
export function hintContext(query: { messageId?: number; text?: string }): SceneHintContext {
    const chat = (ctx().chat ?? []) as STChatMessage[];
    let messageIndex = query.messageId ?? -1;
    if (messageIndex < 0) {
        messageIndex = chat.length - 1;
        while (messageIndex >= 0 && chat[messageIndex]?.is_system) messageIndex--;
    }
    return { messageIndex, text: query.text ?? chat[messageIndex]?.mes ?? '' };
}

/**
 * The answer of another extension's provider, or `fallback` when it throws or does not answer within
 * PROVIDER_TIMEOUT_MS (scene providers, passport providers of v0.12).
 */
export async function askInTime<T>(label: string, call: () => Promise<T> | T, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const timeout = new Promise<T>((resolve) => {
            timer = setTimeout(() => {
                log.warn(`${label}: no answer in ${PROVIDER_TIMEOUT_MS} ms`);
                resolve(fallback);
            }, PROVIDER_TIMEOUT_MS);
        });
        return await Promise.race([Promise.resolve(call()), timeout]);
    } catch (error) {
        log.warn(`${label} failed`, error);
        return fallback;
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

async function ask(provider: SceneHintProvider, context: SceneHintContext): Promise<SceneHint | null> {
    const answer = await askInTime<unknown>(
        `scene provider ${provider.id}`,
        () => provider.describe({ ...context }),
        null,
    );
    return normalizeSceneHint(answer);
}

/** The merged hint of every provider for a scene; empty without providers. */
export async function sceneHint(query: { messageId?: number; text?: string } = {}): Promise<SceneHint> {
    const ordered = sceneHintProviders();
    if (!ordered.length) return {};
    const context = hintContext(query);
    const key = `${context.messageIndex}\u0000${context.text}`;
    const now = Date.now();
    if (cache && cache.key === key && now - cache.at < CACHE_MS) return structuredClone(await cache.hint);
    const hint = Promise.all(ordered.map((provider) => ask(provider, context))).then(mergeSceneHints);
    cache = { key, at: now, hint };
    return structuredClone(await hint);
}
