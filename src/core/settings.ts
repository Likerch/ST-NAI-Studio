import { ctx, libs, MODULE_NAME } from './context';
import { log, setLogLevel } from './logger';
import { defaultSettings, migrateAndFill } from './settings-schema';
import type { NaiStudioSettings } from './settings-schema';
import { backupSettings } from './storage';

let current: NaiStudioSettings = defaultSettings();
const externalListeners = new Set<() => void>();

/** The panel re-reads its controls when settings change outside of it (slash commands, migration). */
export function onExternalChange(listener: () => void): () => void {
    externalListeners.add(listener);
    return () => externalListeners.delete(listener);
}

export function notifyExternalChange(): void {
    for (const listener of externalListeners) listener();
}

/** Loads extensionSettings.nai_studio, backs it up before a migration, fills new defaults. */
export async function loadSettings(): Promise<NaiStudioSettings> {
    const root = ctx().extensionSettings;
    const stored = root[MODULE_NAME];
    const result = migrateAndFill(stored, libs().lodash.merge);
    if (result.migrated && stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
        try {
            const key = await backupSettings(stored, result.fromVersion);
            log.info('settings backed up before migration', key);
        } catch (error) {
            log.warn('settings backup failed', error);
        }
    }
    root[MODULE_NAME] = result.settings;
    current = result.settings;
    setLogLevel(current.log.level);
    if (result.migrated) {
        ctx().saveSettingsDebounced();
    }
    return current;
}

export function settings(): NaiStudioSettings {
    return current;
}

export function saveSettings(): void {
    ctx().saveSettingsDebounced();
}

/** Replaces the settings in place (the object referenced by extensionSettings stays the same). */
export function replaceSettings(next: NaiStudioSettings): void {
    for (const key of Object.keys(current)) {
        delete (current as unknown as Record<string, unknown>)[key];
    }
    Object.assign(current, structuredClone(next));
    ctx().saveSettingsDebounced();
    notifyExternalChange();
}

/** Lifecycle "clean": drop our key from extensionSettings. */
export function resetSettings(): void {
    const root = ctx().extensionSettings;
    delete root[MODULE_NAME];
    current = defaultSettings();
    ctx().saveSettingsDebounced();
}
