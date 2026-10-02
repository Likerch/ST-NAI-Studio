// Settings schema, defaults and migrations. Pure (no host access) so it can be unit-tested.
// Lives in extensionSettings.nai_studio. Never store tokens or image blobs here (TZ rules 2 and 4).
import type { LogLevel } from './logger';

export const CURRENT_SCHEMA_VERSION = 2;

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
    /** Free prompt used by the panel's Generate button. */
    prompt: string;
    /** Common undesired content for every mode. */
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

export interface StyleSettings {
    name: string;
    prefix: string;
    suffix: string;
    negative: string;
}

export interface CharacterPromptSettings {
    positive: string;
    negative: string;
}

/** Initiators of a generation; each has its own visibility of the result message. */
export type Initiator = 'panel' | 'command' | 'wand' | 'interactive' | 'tool' | 'auto' | 'message';

export interface NaiStudioSettings {
    schemaVersion: number;
    transport: { mode: TransportMode };
    generation: GenerationSettings;
    prompts: {
        /** Common prefix; may contain {prompt} to place the scene prompt inside it. */
        prefix: string;
        suffix: string;
        /** Template overrides by mode id ("-2".."11"); missing keys use the defaults. */
        templates: Record<string, string>;
        styles: StyleSettings[];
        activeStyle: string;
        /** Per-character prompt prefixes keyed by avatar file name without extension. */
        characterPrompts: Record<string, CharacterPromptSettings>;
    };
    modes: {
        /** Show the prompt for editing before every generation (built-in "Edit prompts before generation"). */
        refine: boolean;
        /** Caption avatars with the multimodal model for "you", "me", "face". */
        multimodal: boolean;
        /** Let the LLM extend free prompts. */
        freeExtend: boolean;
        /** Keep the pixel count when a mode forces portrait/landscape. */
        snap: boolean;
        /** Only collapse whitespace in LLM replies instead of turning them into a tag list. */
        minimalProcessing: boolean;
    };
    chat: {
        /** true = the result message is visible to the LLM; false = system message (hidden from the prompt). */
        visibility: Record<Initiator, boolean>;
        /** Author of a visible result message. */
        author: 'character' | 'user';
        /** Hide the message text and show only the image. */
        hidePrompt: boolean;
        /** Regex triggers in user messages ("send me a picture of ..."). */
        interactive: boolean;
        /** Register the GenerateImage function tool for the LLM. */
        functionTool: boolean;
        /** Minimum seconds between two tool calls. */
        toolCooldownSeconds: number;
    };
    auto: {
        enabled: boolean;
        /** Mode used for automatic generation (default: last message). */
        mode: number;
        everyMessages: number;
        keywords: string;
        sceneChange: boolean;
        sceneMarkers: string;
        cooldownMessages: number;
        cooldownSeconds: number;
        /** Allow auto generation to spend Anlas when free-only is off. Off by default. */
        allowPaid: boolean;
    };
    takeover: {
        /** ISO date of the one-time migration from the built-in Image Generation, null if not run. */
        migratedAt: string | null;
        migrationReport: string[];
    };
    anlas: {
        /** "Free only": never send a request that would spend Anlas. On by default (Opus users). */
        freeOnly: boolean;
        /** Ask for confirmation when a request costs more than this (0 = always ask when paid). */
        confirmAbove: number;
    };
    inspector: { openBeforeSend: boolean };
    rawOverride: { enabled: boolean; json: string };
    log: { level: LogLevel };
}

export function defaultGeneration(): GenerationSettings {
    return {
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
    };
}

export function defaultSettings(): NaiStudioSettings {
    return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        transport: { mode: 'auto' },
        generation: defaultGeneration(),
        prompts: { prefix: '', suffix: '', templates: {}, styles: [], activeStyle: '', characterPrompts: {} },
        modes: { refine: false, multimodal: false, freeExtend: false, snap: false, minimalProcessing: false },
        chat: {
            visibility: {
                panel: false,
                command: false,
                wand: false,
                interactive: false,
                tool: false,
                auto: false,
                message: false,
            },
            author: 'character',
            hidePrompt: true,
            interactive: false,
            functionTool: false,
            toolCooldownSeconds: 30,
        },
        auto: {
            enabled: false,
            mode: 4,
            everyMessages: 0,
            keywords: '',
            sceneChange: false,
            sceneMarkers: '***, ---, ⁂',
            cooldownMessages: 3,
            cooldownSeconds: 60,
            allowPaid: false,
        },
        takeover: { migratedAt: null, migrationReport: [] },
        anlas: { freeOnly: true, confirmAbove: 0 },
        inspector: { openBeforeSend: false },
        rawOverride: { enabled: false, json: '' },
        log: { level: 'info' },
    };
}

type Raw = Record<string, unknown>;

export interface Migration {
    /** Version the settings have after this migration. */
    to: number;
    migrate(settings: Raw): Raw;
}

function isObject(value: unknown): value is Raw {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Ordered migrations. Each one is a separate function with its own test (TZ "Versioning").
 * v1: first schema. Settings saved before versioning (no schemaVersion) start from here.
 * v2: `output.hiddenFromPrompt` became the per-initiator visibility map `chat.visibility`.
 */
export const MIGRATIONS: readonly Migration[] = [
    {
        to: 1,
        migrate(settings) {
            return { ...settings, schemaVersion: 1 };
        },
    },
    {
        to: 2,
        migrate(settings) {
            const { output, ...rest } = settings;
            const next: Raw = { ...rest, schemaVersion: 2 };
            if (isObject(output) && output.hiddenFromPrompt === false) {
                const chat = isObject(rest.chat) ? rest.chat : {};
                next.chat = {
                    ...chat,
                    visibility: { ...(isObject(chat.visibility) ? chat.visibility : {}), panel: true },
                };
            }
            return next;
        },
    },
];

export type DeepMerge = <T extends object>(target: T, ...sources: unknown[]) => T;

export interface LoadResult {
    settings: NaiStudioSettings;
    fromVersion: number;
    migrated: boolean;
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
    // Arrays are data, not defaults: merge would combine index-wise, so take stored arrays as they are.
    const generation = isObject(raw.generation) ? raw.generation : {};
    settings.generation.characters = (
        Array.isArray(generation.characters) ? generation.characters : []
    ) as CharacterSlotSettings[];
    const prompts = isObject(raw.prompts) ? raw.prompts : {};
    settings.prompts.styles = (Array.isArray(prompts.styles) ? prompts.styles : []) as StyleSettings[];
    const takeover = isObject(raw.takeover) ? raw.takeover : {};
    settings.takeover.migrationReport = (
        Array.isArray(takeover.migrationReport) ? takeover.migrationReport : []
    ) as string[];
    settings.schemaVersion = CURRENT_SCHEMA_VERSION;
    return { settings, fromVersion, migrated: fromVersion !== CURRENT_SCHEMA_VERSION };
}
