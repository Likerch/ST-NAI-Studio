// Settings export / import (TZ Phase 6): settings, presets, styles, poses, glossary and vibe sets
// in one JSON file with the schema version; vibe reference images optionally embedded. An import
// is checked, the current settings are backed up first, older schemas are migrated.
import { libs } from '../../core/context';
import { NaiError } from '../../core/errors';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { replaceSettings, settings } from '../../core/settings';
import { CURRENT_SCHEMA_VERSION, migrateAndFill } from '../../core/settings-schema';
import { backupSettings, imageStore } from '../../core/storage';
import { buildSettingsExport, checkSettingsImport } from '../../domain';
import { version as APP_VERSION } from '../../../package.json';
import { base64ToBlob, blobToBase64, downloadBlob } from '../images/image-utils';

export async function exportSettingsFile(includeImages: boolean): Promise<string> {
    const s = settings();
    const images: Record<string, string> = {};
    if (includeImages) {
        for (const item of s.vibes.items) {
            for (const key of [item.imageKey, item.thumbKey]) {
                const blob = await imageStore().getItem<Blob>(key);
                if (blob) images[key] = await blobToBase64(blob);
            }
        }
    }
    const data = buildSettingsExport(
        s as unknown as Record<string, unknown>,
        CURRENT_SCHEMA_VERSION,
        APP_VERSION,
        images,
    );
    const name = `nai-studio-settings-${data.exportedAt.slice(0, 10)}.json`;
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), name);
    return name;
}

export async function importSettingsText(text: string): Promise<{ fromVersion: number; images: number }> {
    const check = checkSettingsImport(text, CURRENT_SCHEMA_VERSION);
    if (!check.ok) {
        throw new NaiError('import-failed', 'none', {
            reason: t(`naist.io.reason.${check.reason}`, {
                version: check.schemaVersion ?? '',
                current: CURRENT_SCHEMA_VERSION,
            }),
        });
    }
    try {
        const key = await backupSettings(settings(), settings().schemaVersion);
        log.info('settings backed up before import', key);
    } catch (error) {
        log.warn('settings backup before import failed', error);
    }
    const { settings: next } = migrateAndFill(check.settings, libs().lodash.merge);
    let images = 0;
    for (const [key, value] of Object.entries(check.images)) {
        await imageStore().setItem(key, base64ToBlob(value, 'image/png'));
        images++;
    }
    replaceSettings(next);
    log.info('settings imported from schema', check.schemaVersion, `${images} image(s)`);
    return { fromVersion: check.schemaVersion, images };
}
