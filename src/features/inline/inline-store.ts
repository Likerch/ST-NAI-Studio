// Inline image blobs in IndexedDB, keyed per chat so a chat's unreferenced blobs can be freed by
// comparing with every message and every message swipe (RECON §2.3 items 5, 6: no "before delete"
// event, swipes keep their own `extra` copies).
import { ctx } from '../../core/context';
import { log } from '../../core/logger';
import { imageStore } from '../../core/storage';
import { entryBlobKeys, readEntries } from '../../domain';

const PREFIX = 'img:';

/** Keys written but not yet referenced by a saved message (excluded from garbage collection). */
const pending = new Set<string>();

export function chatKey(): string {
    return (ctx().getCurrentChatId() ?? 'nochat').replace(/:/g, '_');
}

export function newBlobKey(imageId: string): string {
    return `${PREFIX}${chatKey()}:${imageId}:${ctx().uuidv4().slice(0, 8)}`;
}

export async function putBlob(key: string, blob: Blob): Promise<void> {
    pending.add(key);
    await imageStore().setItem(key, blob);
}

/** Call once the entry that references the key is in the chat. */
export function settle(keys: readonly string[]): void {
    for (const key of keys) pending.delete(key);
}

export async function getBlob(key: string): Promise<Blob | null> {
    if (!key) return null;
    try {
        return await imageStore().getItem<Blob>(key);
    } catch {
        return null;
    }
}

export async function removeBlobs(keys: readonly string[]): Promise<void> {
    await Promise.all(keys.filter(Boolean).map((key) => imageStore().removeItem(key)));
}

interface SwipeInfo {
    extra?: unknown;
}

/** Every blob key referenced by any message or any message swipe of a chat. */
export function referencedKeys(chat: readonly STChatMessage[]): Set<string> {
    const keys = new Set<string>();
    const add = (extra: unknown) => {
        for (const entry of readEntries(extra)) for (const key of entryBlobKeys(entry)) keys.add(key);
    };
    for (const message of chat) {
        add(message.extra);
        const swipes = message.swipe_info;
        if (Array.isArray(swipes)) for (const info of swipes as SwipeInfo[]) add(info?.extra);
    }
    return keys;
}

/** Frees blobs of the current chat that nothing references any more. Returns how many. */
export async function collectGarbage(): Promise<number> {
    const prefix = `${PREFIX}${chatKey()}:`;
    let keys: string[];
    try {
        keys = (await imageStore().keys()).filter((k) => k.startsWith(prefix));
    } catch (error) {
        log.warn('image store unavailable', error);
        return 0;
    }
    const used = referencedKeys(ctx().chat);
    const unused = keys.filter((k) => !used.has(k) && !pending.has(k));
    await removeBlobs(unused);
    if (unused.length) log.info(`freed ${unused.length} inline image blob(s)`);
    return unused.length;
}

/** All inline blob keys stored for the current chat (for tests and the gallery's usage view). */
export async function chatBlobKeys(): Promise<string[]> {
    const prefix = `${PREFIX}${chatKey()}:`;
    return (await imageStore().keys()).filter((k) => k.startsWith(prefix));
}
