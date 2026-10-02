// Settings export / import (TZ Phase 6): everything in one JSON file with the schema version; an
// import is checked for the format and refused when it comes from a newer schema.

export const SETTINGS_FORMAT = 'nai-studio-settings';

export interface SettingsExport {
    format: typeof SETTINGS_FORMAT;
    schemaVersion: number;
    appVersion: string;
    exportedAt: string;
    settings: Record<string, unknown>;
    /** Vibe reference images (IndexedDB key → base64 PNG), so vibes work after a clean install. */
    images?: Record<string, string>;
}

export type ImportCheck =
    | { ok: true; schemaVersion: number; settings: Record<string, unknown>; images: Record<string, string> }
    | { ok: false; reason: 'not-json' | 'wrong-format' | 'newer-schema' | 'invalid'; schemaVersion?: number };

export function buildSettingsExport(
    settings: Record<string, unknown>,
    schemaVersion: number,
    appVersion: string,
    images: Record<string, string> = {},
    now = new Date(),
): SettingsExport {
    return {
        format: SETTINGS_FORMAT,
        schemaVersion,
        appVersion,
        exportedAt: now.toISOString(),
        settings: JSON.parse(JSON.stringify(settings)) as Record<string, unknown>,
        ...(Object.keys(images).length ? { images } : {}),
    };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function checkSettingsImport(text: string, currentSchema: number): ImportCheck {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return { ok: false, reason: 'not-json' };
    }
    if (!isObject(data) || data.format !== SETTINGS_FORMAT) return { ok: false, reason: 'wrong-format' };
    const schemaVersion = Number(data.schemaVersion);
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1 || !isObject(data.settings)) {
        return { ok: false, reason: 'invalid' };
    }
    if (schemaVersion > currentSchema) return { ok: false, reason: 'newer-schema', schemaVersion };
    const images: Record<string, string> = {};
    if (isObject(data.images)) {
        for (const [key, value] of Object.entries(data.images)) {
            if (typeof value === 'string' && /^vibe(thumb)?:/.test(key)) images[key] = value;
        }
    }
    return { ok: true, schemaVersion, settings: { ...data.settings, schemaVersion }, images };
}
