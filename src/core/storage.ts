// localforage (IndexedDB) for blobs and caches — never extensionSettings (TZ rule 4).
import { libs } from './context';

const instances = new Map<string, STLocalForage>();

function instance(storeName: string): STLocalForage {
    let found = instances.get(storeName);
    if (!found) {
        found = libs().localforage.createInstance({ name: 'NAIStudio', storeName });
        instances.set(storeName, found);
    }
    return found;
}

/** Settings backups and small caches. */
export function store(): STLocalForage {
    return instance('data');
}

/** Full images and thumbnails (Blob values). */
export function imageStore(): STLocalForage {
    return instance('images');
}

/** Gallery records (one per generated image). */
export function galleryStore(): STLocalForage {
    return instance('gallery');
}

const BACKUP_PREFIX = 'settings-backup:';

/** Snapshot of settings taken before a migration, keyed by date. */
export async function backupSettings(settings: unknown, fromVersion: number): Promise<string> {
    const key = `${BACKUP_PREFIX}v${fromVersion}:${new Date().toISOString()}`;
    await store().setItem(key, structuredClone(settings));
    return key;
}

/** Removes everything NAI Studio stored in IndexedDB (lifecycle "clean"). */
export async function clearStorage(): Promise<void> {
    await Promise.all([store().clear(), imageStore().clear(), galleryStore().clear()]);
}
