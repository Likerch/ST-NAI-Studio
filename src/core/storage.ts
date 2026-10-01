// localforage (IndexedDB) for blobs and caches — never extensionSettings (TZ rule 4).
import { libs } from './context';

let instance: STLocalForage | null = null;

export function store(): STLocalForage {
    instance ??= libs().localforage.createInstance({ name: 'NAIStudio', storeName: 'data' });
    return instance;
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
    await store().clear();
}
