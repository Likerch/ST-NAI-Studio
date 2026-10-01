import { ctx, libs, MODULE_NAME } from './context';
import { log, setLogLevel } from './logger';
import { defaultSettings, migrateAndFill } from './settings-schema';
import type { NaiStudioSettings } from './settings-schema';
import { backupSettings } from './storage';

let current: NaiStudioSettings = defaultSettings();

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

/** Lifecycle "clean": drop our key from extensionSettings. */
export function resetSettings(): void {
    const root = ctx().extensionSettings;
    delete root[MODULE_NAME];
    current = defaultSettings();
    ctx().saveSettingsDebounced();
}
