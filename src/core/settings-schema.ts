// Settings schema, defaults and migrations. Pure (no host access) so it can be unit-tested.
// Lives in extensionSettings.nai_studio. Never store tokens or image blobs here (TZ rules 2 and 4).
import type { LogLevel } from './logger';

export const CURRENT_SCHEMA_VERSION = 1;

export type TransportMode = 'auto' | 'plugin' | 'native';

export interface CharacterSlotSettings {
    prompt: string;
    negative: string;
    x: number;
    y: number;
    enabled: boolean;
}

export interface GenerationSettings {
    model: string;
    prompt: string;
    negativePrompt: string;
    ucPreset: string;
    qualityPreset: string;
    dataset: string;
    width: number;
    height: number;
    steps: number;
    scale: number;
    cfgRescale: number;
    sampler: string;
    noiseSchedule: string;
    /** -1 = random for every generation. */
    seed: number;
    samples: number;
    smea: boolean;
    smeaDyn: boolean;
    autoSmea: boolean;
    decrisper: boolean;
    varietyBoost: boolean;
    legacyUc: boolean;
    transparentBackground: boolean;
    imageFormat: 'png' | 'webp';
    useCoords: boolean;
    characters: CharacterSlotSettings[];
}

export interface NaiStudioSettings {
    schemaVersion: number;
    transport: { mode: TransportMode };
    generation: GenerationSettings;
    anlas: {
        /** "Free only": never send a request that would spend Anlas. On by default (Opus users). */
        freeOnly: boolean;
        /** Ask for confirmation when a request costs more than this (0 = always ask when paid). */
        confirmAbove: number;
    };
    inspector: { openBeforeSend: boolean };
    rawOverride: { enabled: boolean; json: string };
    output: {
        /** Post the result as a system message (hidden from the LLM prompt), like the built-in default. */
        hiddenFromPrompt: boolean;
    };
    log: { level: LogLevel };
}

export function defaultSettings(): NaiStudioSettings {
    return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        transport: { mode: 'auto' },
        generation: {
            model: 'nai-diffusion-4-5-full',
            prompt: '',
            negativePrompt: '',
            ucPreset: 'heavy',
            qualityPreset: 'standard',
            dataset: 'none',
            width: 832,
            height: 1216,
            steps: 23,
            scale: 5,
            cfgRescale: 0,
            sampler: 'k_euler_ancestral',
            noiseSchedule: 'karras',
            seed: -1,
            samples: 1,
            smea: false,
            smeaDyn: false,
            autoSmea: true,
            decrisper: false,
            varietyBoost: false,
            legacyUc: false,
            transparentBackground: false,
            imageFormat: 'webp',
            useCoords: false,
            characters: [],
        },
        anlas: { freeOnly: true, confirmAbove: 0 },
        inspector: { openBeforeSend: false },
        rawOverride: { enabled: false, json: '' },
        output: { hiddenFromPrompt: true },
        log: { level: 'info' },
    };
}

type Raw = Record<string, unknown>;

export interface Migration {
    /** Version the settings have after this migration. */
    to: number;
    migrate(settings: Raw): Raw;
}

/**
 * Ordered migrations. Each one is a separate function with its own test (TZ "Versioning").
 * v1: first schema. Settings saved before versioning (no schemaVersion) start from here.
 */
export const MIGRATIONS: readonly Migration[] = [
    {
        to: 1,
        migrate(settings) {
            return { ...settings, schemaVersion: 1 };
        },
    },
];

export type DeepMerge = <T extends object>(target: T, ...sources: unknown[]) => T;

export interface LoadResult {
    settings: NaiStudioSettings;
    fromVersion: number;
    migrated: boolean;
}

function isObject(value: unknown): value is Raw {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Applies pending migrations, then fills missing keys from defaults (lodash.merge in the host). */
export function migrateAndFill(stored: unknown, merge: DeepMerge): LoadResult {
    let raw: Raw = isObject(stored) ? structuredClone(stored) : {};
    const fromVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
    if (fromVersion > CURRENT_SCHEMA_VERSION) {
        // Downgrades are not supported; keep the data but do not migrate it.
        const settings = merge(defaultSettings(), raw);
        return { settings, fromVersion, migrated: false };
    }
    for (const migration of MIGRATIONS) {
        if (migration.to > fromVersion) {
            raw = migration.migrate(raw);
        }
    }
    const settings = merge(defaultSettings(), raw);
    // Arrays are data, not defaults: merge would combine index-wise, so take the stored array as is.
    const storedChars =
        isObject(raw.generation) && Array.isArray(raw.generation.characters) ? raw.generation.characters : [];
    settings.generation.characters = storedChars as CharacterSlotSettings[];
    settings.schemaVersion = CURRENT_SCHEMA_VERSION;
    return { settings, fromVersion, migrated: fromVersion !== CURRENT_SCHEMA_VERSION };
}
