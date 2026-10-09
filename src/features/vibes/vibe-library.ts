// Vibe library (TZ Phase 5): reference images in IndexedDB, metadata and sets in settings,
// encodings cached in the browser and on the plugin disk. Re-using a vibe never costs Anlas:
// the encoding is looked up locally, then in the plugin cache, and only then paid for (2 Anlas).
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { saveSettings, settings } from '../../core/settings';
import { imageStore, store } from '../../core/storage';
import { encodingCacheKey, planVibes, vibeAvailability } from '../../domain';
import type {
    ModelCapabilities,
    PlannedVibe,
    VibeAvailability,
    VibeContext,
    VibeItem,
    VibeReference,
} from '../../domain';
import type { Transport } from '../../transport';
import { avatarKey } from '../characters/character-prompts';
import { blobToBase64, thumbnail, toPngBlob } from '../images/image-utils';
import type { VibePrepareOptions, VibeProvider } from '../generation/pipeline';
import { generationQueue } from '../generation/queue';
import type { QueueJob } from '../generation/queue';
import type { CostConfirm } from '../tools/tool-common';

/** Encoding one vibe for one model (RECON §3.12). */
export const ENCODE_PRICE = 2;

export async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function vibeItems(): VibeItem[] {
    return settings().vibes.items;
}

export async function addVibe(file: Blob, name: string): Promise<VibeItem> {
    const png = await toPngBlob(file);
    const base64 = await blobToBase64(png);
    const id = ctx().uuidv4();
    const item: VibeItem = {
        id,
        name: name.trim() || `vibe-${id.slice(0, 4)}`,
        imageHash: await sha256Hex(base64),
        imageKey: `vibe:${id}`,
        thumbKey: `vibethumb:${id}`,
        createdAt: new Date().toISOString(),
    };
    await imageStore().setItem(item.imageKey, png);
    await imageStore().setItem(item.thumbKey, await thumbnail(png, 160));
    settings().vibes.items.push(item);
    saveSettings();
    return item;
}

export async function removeVibe(id: string): Promise<void> {
    const s = settings().vibes;
    const item = s.items.find((i) => i.id === id);
    if (!item) return;
    s.items = s.items.filter((i) => i.id !== id);
    for (const set of s.sets) set.entries = set.entries.filter((e) => e.vibeId !== id);
    saveSettings();
    await imageStore().removeItem(item.imageKey);
    await imageStore().removeItem(item.thumbKey);
    const keys = (await store().keys()).filter((k) => k.startsWith(`vibeenc:${item.imageHash}:`));
    await Promise.all(keys.map((k) => store().removeItem(k)));
}

export async function vibeImage(item: VibeItem): Promise<Blob | null> {
    return await imageStore().getItem<Blob>(item.imageKey);
}

export async function vibeThumb(item: VibeItem): Promise<Blob | null> {
    return await imageStore().getItem<Blob>(item.thumbKey);
}

/** Characters, chat and style the vibe bindings are matched against. */
export function vibeContext(): VibeContext {
    const c = ctx();
    const characters: string[] = [];
    if (c.groupId) {
        for (const avatar of c.groups.find((g) => g.id === c.groupId)?.members ?? [])
            characters.push(avatarKey(avatar));
    } else if (c.characterId !== undefined && c.characterId !== null && c.characterId !== '') {
        characters.push(avatarKey(c.characters[Number(c.characterId)]?.avatar));
    }
    return { characters, chatId: c.getCurrentChatId() ?? '', style: settings().prompts.activeStyle };
}

let extraVibes: () => PlannedVibe[] = () => [];

/** Vibes added by other features (scene continuity in vibe mode). */
export function setExtraVibes(source: () => PlannedVibe[]): void {
    extraVibes = source;
}

export function activeVibes(): PlannedVibe[] {
    const planned = planVibes(settings().vibes.sets, settings().vibes.items, vibeContext());
    const extra = extraVibes().filter((e) => !planned.some((p) => p.item.id === e.item.id));
    return [...planned, ...extra];
}

export type VibeNotice =
    | { kind: 'unavailable'; reason: VibeAvailability; count: number }
    | { kind: 'skipped'; count: number; reason: 'free-only' | 'declined' | 'no-plugin' }
    | { kind: 'encoded'; count: number; cost: number }
    | { kind: 'missing-image'; name: string };

/** Pipeline vibe provider: plans the active vibes and makes sure each has an encoding. */
export class VibeLibraryProvider implements VibeProvider {
    private noticed = new Set<string>();

    constructor(
        private readonly confirm: CostConfirm,
        private readonly notify: (notice: VibeNotice) => void,
    ) {}

    private notifyOnce(key: string, notice: VibeNotice): void {
        if (this.noticed.has(key)) return;
        this.noticed.add(key);
        this.notify(notice);
    }

    async prepare(
        caps: ModelCapabilities,
        transport: Transport,
        signal?: AbortSignal,
        extra: PlannedVibe[] = [],
        queue: Pick<QueueJob, 'priority' | 'chatId'> = {},
        options: VibePrepareOptions = {},
    ): Promise<VibeReference[]> {
        const active = activeVibes();
        const planned = [...active, ...extra.filter((e) => !active.some((a) => a.item.id === e.item.id))];
        if (!planned.length) return [];
        const availability = vibeAvailability(caps, transport.features.vibes);
        if (availability !== 'ok') {
            this.notifyOnce(`${availability}:${caps.model}`, {
                kind: 'unavailable',
                reason: availability,
                count: planned.length,
            });
            return [];
        }
        if (caps.vibeKind === 'raw') return await this.raw(planned);
        return await this.encoded(planned, caps.model, transport, signal, queue, options.encode !== false);
    }

    /** V3: the reference image itself, 448x448 PNG (RECON §3.4). */
    private async raw(planned: PlannedVibe[]): Promise<VibeReference[]> {
        const refs: VibeReference[] = [];
        for (const p of planned) {
            const blob = await vibeImage(p.item);
            if (!blob) {
                this.notify({ kind: 'missing-image', name: p.item.name });
                continue;
            }
            refs.push({
                data: await blobToBase64(await toPngBlob(blob, { width: 448, height: 448 })),
                strength: p.strength,
                informationExtracted: p.informationExtracted,
            });
        }
        return refs;
    }

    private async encoded(
        planned: PlannedVibe[],
        model: string,
        transport: Transport,
        signal?: AbortSignal,
        queue: Pick<QueueJob, 'priority' | 'chatId'> = {},
        encode = true,
    ): Promise<VibeReference[]> {
        const extras = transport.extras;
        const encodings = new Map<string, string>();
        const keyOf = (p: PlannedVibe) => encodingCacheKey(p.item.imageHash, model, p.informationExtracted);
        for (const p of planned) {
            const local = await store().getItem<string>(keyOf(p));
            if (local) encodings.set(keyOf(p), local);
        }
        let missing = planned.filter((p) => !encodings.has(keyOf(p)));
        if (missing.length && extras) {
            const found = await extras.lookupVibes(
                missing.map((p) => ({
                    imageHash: p.item.imageHash,
                    model,
                    informationExtracted: p.informationExtracted,
                })),
                signal,
            );
            for (const [i, encoding] of found.entries()) {
                const p = missing[i];
                if (p && encoding) {
                    encodings.set(keyOf(p), encoding);
                    await store().setItem(keyOf(p), encoding);
                }
            }
            missing = missing.filter((p) => !encodings.has(keyOf(p)));
        }
        if (missing.length && !encode) {
            // A request that must stay free (since 0.15): the vibes not encoded yet are left out quietly.
            log.info(`vibes: ${missing.length} not encoded for ${model} yet, left out of a free-only request`);
        } else if (missing.length) {
            const cost = missing.length * ENCODE_PRICE;
            const reason = settings().anlas.freeOnly
                ? 'free-only'
                : !extras
                  ? 'no-plugin'
                  : settings().vibes.confirmEncoding && !(await this.confirm(cost, 'vibes'))
                    ? 'declined'
                    : null;
            if (reason) {
                this.notify({ kind: 'skipped', count: missing.length, reason });
            } else {
                let paid = 0;
                for (const p of missing) {
                    const blob = await vibeImage(p.item);
                    if (!blob) {
                        this.notify({ kind: 'missing-image', name: p.item.name });
                        continue;
                    }
                    // The stored PNG goes as-is: its base64 is what imageHash was computed from, so
                    // the plugin's disk cache key matches the lookup key.
                    const image = await blobToBase64(blob);
                    // An encoding is a NovelAI request too: it waits for its turn in the one queue.
                    const result = await generationQueue.run(
                        { ...queue, kind: 'vibe', ...(signal ? { signal } : {}) },
                        (jobSignal) =>
                            extras!.encodeVibe(
                                { image, model, informationExtracted: p.informationExtracted },
                                jobSignal,
                            ),
                    );
                    if (!result.cached) paid++;
                    encodings.set(keyOf(p), result.encoding);
                    await store().setItem(keyOf(p), result.encoding);
                }
                if (paid) this.notify({ kind: 'encoded', count: paid, cost: paid * ENCODE_PRICE });
                log.info(`encoded ${paid} vibe(s) for ${model}`);
            }
        }
        return planned
            .filter((p) => encodings.has(keyOf(p)))
            .map((p) => ({
                data: encodings.get(keyOf(p)) ?? '',
                strength: p.strength,
                informationExtracted: p.informationExtracted,
            }));
    }
}
