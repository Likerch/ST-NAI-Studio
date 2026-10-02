// Gallery records (TZ Phase 3): every generation gets a record with its parameters and a small
// thumbnail in IndexedDB. Full images come from the inline blob or the /user/images file.
import { ctx, requestHeaders } from '../../core/context';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { galleryStore, imageStore } from '../../core/storage';
import type { GalleryRecord } from '../../domain';
import type { GenerationOutcome, Produced } from '../generation/pipeline';
import { base64ToBlob, thumbnail } from '../images/image-utils';

function characterName(): string {
    const c = ctx();
    if (c.groupId) return c.groups.find((g) => g.id === c.groupId)?.name ?? String(c.groupId);
    return c.name2 ?? '';
}

/** Pipeline observer: one record per generated image. Failures never break a generation. */
export function recordGeneration(produced: Produced, outcome: GenerationOutcome): void {
    if (!settings().gallery.enabled) return;
    void (async () => {
        for (const [i, image] of produced.images.entries()) {
            const id = ctx().uuidv4();
            const thumbKey = `thumb:${id}`;
            try {
                await imageStore().setItem(
                    thumbKey,
                    await thumbnail(base64ToBlob(image.base64, image.mime), settings().gallery.thumbSize),
                );
            } catch (error) {
                log.warn('thumbnail failed', error);
            }
            const record: GalleryRecord = {
                id,
                createdAt: produced.meta.createdAt,
                chatId: produced.chatId ?? '',
                characterName: characterName(),
                target: outcome.target === 'inline' ? 'inline' : outcome.target,
                filePath: outcome.paths[i] ?? '',
                blobKey: outcome.blobKeys?.[i] ?? '',
                thumbKey,
                mime: image.mime,
                meta: { ...produced.meta, seed: image.seed ?? produced.meta.seed + i },
                favorite: false,
                tags: [],
            };
            if (outcome.inlineId) record.inlineId = outcome.inlineId;
            await galleryStore().setItem(id, record);
        }
    })().catch((error: unknown) => log.warn('gallery record failed', error));
}

export async function listRecords(): Promise<GalleryRecord[]> {
    const store = galleryStore();
    const keys = await store.keys();
    const records = await Promise.all(keys.map((key) => store.getItem<GalleryRecord>(key)));
    return records.filter((r): r is GalleryRecord => r !== null && typeof r === 'object');
}

export async function saveRecord(record: GalleryRecord): Promise<void> {
    await galleryStore().setItem(record.id, record);
}

export async function thumbBlob(record: GalleryRecord): Promise<Blob | null> {
    try {
        return await imageStore().getItem<Blob>(record.thumbKey);
    } catch {
        return null;
    }
}

/** Full image: browser copy, then the server file, then the thumbnail as a last resort. */
export async function fullBlob(record: GalleryRecord): Promise<Blob | null> {
    if (record.blobKey) {
        const blob = await imageStore()
            .getItem<Blob>(record.blobKey)
            .catch(() => null);
        if (blob) return blob;
    }
    if (record.filePath) {
        const response = await fetch(record.filePath).catch(() => null);
        if (response?.ok) return await response.blob();
    }
    return await thumbBlob(record);
}

/**
 * Deletes records and their thumbnails. With `deleteFiles`, server files are deleted too
 * (POST /api/images/delete); inline images in chats then fall back to their browser copy.
 */
export async function deleteRecords(records: readonly GalleryRecord[], deleteFiles: boolean): Promise<number> {
    let filesDeleted = 0;
    for (const record of records) {
        await galleryStore().removeItem(record.id);
        await imageStore().removeItem(record.thumbKey);
        if (deleteFiles && record.filePath) {
            const response = await fetch('/api/images/delete', {
                method: 'POST',
                headers: requestHeaders(),
                body: JSON.stringify({ path: record.filePath }),
            }).catch(() => null);
            if (response?.ok) filesDeleted++;
        }
    }
    return filesDeleted;
}

export async function storageUsage(): Promise<{ usage: number; quota: number } | null> {
    try {
        const estimate = await navigator.storage.estimate();
        return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
    } catch {
        return null;
    }
}
