// Settings schema, defaults and migrations. Pure (no host access) so it can be unit-tested.
// Lives in extensionSettings.nai_studio. Never store tokens or image blobs here (TZ rules 2 and 4).
import type { LogLevel } from './logger';

/** Vibe library entry (images live in IndexedDB; same shape as domain VibeItem). */
export interface GlossarySettings {
    from: string;
    to: string;
}

export interface VibeItemSettings {
    id: string;
    name: string;
    imageHash: string;
    imageKey: string;
    thumbKey: string;
    createdAt: string;
}

/** Named vibe set (same shape as domain VibeSet). */
export interface VibeSetSettings {
    id: string;
    name: string;
    enabled: boolean;
    global: boolean;
    entries: { vibeId: string; strength: number; informationExtracted: number; enabled: boolean }[];
    bindings: { characters: string[]; chats: string[]; styles: string[] };
}

/** Custom pose preset (same shape as domain PosePreset; core must not import domain). */
export interface CustomPoseSettings {
    id: string;
    category: string;
    tags: string;
    keywords: string[];
    /** Display name (custom poses are not localized). */
    name: string;
}

export const CURRENT_SCHEMA_VERSION = 9;

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
    /** V5: quoted phrases become the in-image text block (web client autoText). */
    autoText?: boolean;
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
        /** Vision API for the multimodal modes ('' = the Image Captioning settings of SillyTavern). */
        multimodalApi: string;
        /** Its model ('' = the API's starting model). */
        multimodalModel: string;
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
    /** Inline images in message text (TZ Phase 3). */
    inline: {
        /** Save every inline image to /user/images too (needed for chat export and other browsers). */
        saveToServer: boolean;
        /** Keep the full image in IndexedDB (fast rendering, survives Data Maid cleaning the file). */
        keepBrowserCopy: boolean;
        defaultWidth: number;
        defaultWidthUnit: '%' | 'px';
        defaultAlign: 'left' | 'center' | 'right';
        defaultRadius: number;
        defaultLayout: 'grid' | 'carousel' | 'list';
        /** How placeholders reach the LLM: a short "[image: …]" description or nothing. */
        llmText: 'describe' | 'remove';
        /** Reading mode: no inline images anywhere (global). */
        readingMode: boolean;
        variationStrength: number;
        variationNoise: number;
        /** Mode used by the insert dialog by default (free prompt or a trigger word). */
        insertMode: string;
        /** Show placeholders to display regexes as <img> (HTML widgets that embed an <img> keep working). */
        regexCompat: boolean;
    };
    /** Image markers the chat model writes in its reply (TZ Phase 7). */
    markers: {
        enabled: boolean;
        /** Add the instruction about markers to normal replies. */
        inject: boolean;
        preset: 'natural' | 'tags' | 'custom';
        /** Instruction text of the custom preset. */
        template: string;
        depth: number;
        role: 'system' | 'user' | 'assistant';
        min: number;
        max: number;
        /** Start generating as soon as a marker is complete, while the reply is still streaming. */
        earlyStart: boolean;
        /** Language of image captions, written into the instruction. */
        captionLanguage: string;
        /** Accept older marker formats (microservice URL, sillyimages, Auto Illustrator). */
        legacy: boolean;
        /** Fewer markers than the minimum: illustrate the reply automatically. */
        autoFill: boolean;
        /** Paid marker images are allowed up to maxCost each (free-only mode still wins). */
        allowPaid: boolean;
        maxCost: number;
    };
    /** Doom's Enhancement Suite integration (v0.9); works only while DES is installed and on. */
    des: {
        enabled: boolean;
        /** Time of day, weather, indoors / outdoors and the location from the tracker. */
        sceneTags: boolean;
        /** Characters of the tracker take part in pictures with their current look. */
        characters: boolean;
        /** A new character without a passport gets one written from the tracker. */
        autoPassports: boolean;
        /** NAI Studio draws the DES portraits (DES's own auto portraits are off meanwhile). */
        portraits: boolean;
        portraitPolicy: 'missing' | 'state' | 'every';
        /** Framing tags of a portrait. */
        portraitTags: string;
        /** Emotions of another character of a card go to characters/<name>, where DES looks. */
        emotionsToDes: boolean;
        /** NAI Studio items in the DES portrait menu, a Workshop button. */
        menu: boolean;
        /** "Illustrate" on DES scene banners. */
        banners: boolean;
        /** DES auto-portrait settings kept while NAI Studio draws the portraits. */
        saved: { autoPortraitMode: string; autoGenerateAvatars: boolean } | null;
    };
    /** Human language (Russian / English prose) to NovelAI prompts (TZ Phase 7). */
    language: {
        mode: 'auto' | 'always' | 'off';
        backend: 'main' | 'profile' | 'novelai';
        /** Connection profile for the "profile" backend. */
        profileId: string;
        /** NovelAI text model for the "novelai" backend. */
        novelaiModel: 'glm-4-6' | 'xialong-v1';
        /** Send Russian to V5 as is (experimental: V5 officially supports English and Japanese). */
        russianOnV5: boolean;
    };
    gallery: {
        /** Record every generation in the gallery (thumbnail + parameters). */
        enabled: boolean;
        thumbSize: number;
    };
    png: {
        /** Remove all metadata from images saved to the server and to disk. */
        stripMetadata: boolean;
    };
    poses: {
        custom: CustomPoseSettings[];
        favorites: string[];
    };
    /** Vibe library (TZ Phase 5): metadata only, images in IndexedDB, encodings on the plugin disk. */
    vibes: {
        items: VibeItemSettings[];
        sets: VibeSetSettings[];
        /** Encoding costs 2 Anlas per vibe and model: ask first (free-only skips unencoded vibes). */
        confirmEncoding: boolean;
    };
    stream: {
        /** Step previews on the plugin transport (V4+). */
        enabled: boolean;
        /** The one-time hint about what the plugin adds was shown. */
        hintShown: boolean;
    };
    /** Director Tools, inpaint, upscale and Enhance defaults (TZ Phase 5). */
    tools: {
        defry: number;
        emotion: string;
        inpaintStrength: number;
        keepOriginal: boolean;
        brushSize: number;
        enhanceScale: number;
        enhanceStrength: number;
        enhanceNoise: number;
    };
    /** RU -> EN prompt translation through the user's LLM (TZ Phase 6). */
    translate: {
        /** Translate Cyrillic prompts before every generation. */
        auto: boolean;
        glossary: GlossarySettings[];
    };
    /** Tag autocomplete, unknown-tag warning, token counter, weight syntax conversion (TZ Phase 6). */
    promptTools: {
        autocomplete: boolean;
        /** Also ask NovelAI's tag suggestions (through the plugin). */
        remoteSuggest: boolean;
        warnUnknown: boolean;
        counter: boolean;
        /** Convert numeric weights to braces when switching to V3. */
        convertWeights: boolean;
    };
    /** Expressions sprite generator (TZ Phase 6). */
    sprites: {
        /** director: one base sprite, emotions by Director Tools; seed: every sprite drawn with one seed. */
        mode: 'director' | 'seed';
        transparent: boolean;
        /** Labels to generate; empty = the 28 default Expressions labels. */
        labels: string[];
    };
    /** Comic mode for V5 (TZ Phase 6). */
    comic: {
        layout: string;
        pageWidth: number;
        pageHeight: number;
        gutter: number;
        style: string;
    };
    /** Scene continuity: last image of a location as the img2img base or a vibe (TZ Phase 6). */
    continuity: {
        enabled: boolean;
        mode: 'img2img' | 'vibe';
        strength: number;
        /** Bind every new picture to the current location. */
        autoBind: boolean;
    };
    /** Scene composer (TZ Phase 4). */
    scene: {
        framing: string;
        camera: string;
        distance: string;
        /** The NSFW layer of passports is used only with this switch on. */
        allowNsfw: boolean;
        /** Let the LLM describe the location for the base prompt of an automatic scene. */
        llmBase: boolean;
        useCoords: boolean;
        /** Where a composed scene goes: a new message or inline into the last message. */
        target: 'message' | 'inline';
        /** Appearance passports of user personas, keyed by persona avatar file. */
        personaPassports: Record<string, unknown>;
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
        autoText: true,
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
        modes: {
            refine: false,
            multimodal: false,
            multimodalApi: '',
            multimodalModel: '',
            freeExtend: false,
            snap: false,
            minimalProcessing: false,
        },
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
        inline: {
            saveToServer: true,
            keepBrowserCopy: true,
            defaultWidth: 60,
            defaultWidthUnit: '%',
            defaultAlign: 'center',
            defaultRadius: 8,
            defaultLayout: 'grid',
            llmText: 'describe',
            readingMode: false,
            variationStrength: 0.5,
            variationNoise: 0.1,
            insertMode: 'free',
            regexCompat: true,
        },
        markers: {
            enabled: false,
            inject: true,
            preset: 'natural',
            template: '',
            depth: 1,
            role: 'system',
            min: 1,
            max: 3,
            earlyStart: true,
            captionLanguage: 'Russian',
            legacy: true,
            autoFill: false,
            allowPaid: false,
            maxCost: 5,
        },
        language: { mode: 'auto', backend: 'main', profileId: '', novelaiModel: 'glm-4-6', russianOnV5: false },
        des: {
            enabled: true,
            sceneTags: true,
            characters: true,
            autoPassports: true,
            portraits: true,
            portraitPolicy: 'state',
            portraitTags: 'portrait, upper body, looking at viewer',
            emotionsToDes: true,
            menu: true,
            banners: true,
            saved: null,
        },
        gallery: { enabled: true, thumbSize: 256 },
        png: { stripMetadata: false },
        poses: { custom: [], favorites: [] },
        vibes: { items: [], sets: [], confirmEncoding: true },
        stream: { enabled: true, hintShown: false },
        tools: {
            defry: 0,
            emotion: 'happy',
            inpaintStrength: 1,
            keepOriginal: true,
            brushSize: 40,
            enhanceScale: 1.5,
            enhanceStrength: 0.45,
            enhanceNoise: 0,
        },
        translate: { auto: false, glossary: [] },
        promptTools: {
            autocomplete: true,
            remoteSuggest: true,
            warnUnknown: true,
            counter: true,
            convertWeights: true,
        },
        sprites: { mode: 'director', transparent: true, labels: [] },
        comic: { layout: 'grid-4', pageWidth: 1024, pageHeight: 1536, gutter: 16, style: 'comic, manga style' },
        continuity: { enabled: false, mode: 'img2img', strength: 0.6, autoBind: true },
        scene: {
            framing: 'auto',
            camera: 'auto',
            distance: 'auto',
            allowNsfw: false,
            llmBase: false,
            useCoords: true,
            target: 'message',
            personaPassports: {},
        },
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
    {
        // v3: inline images, gallery and PNG metadata sections; defaults are filled by the merge.
        to: 3,
        migrate(settings) {
            return { ...settings, schemaVersion: 3 };
        },
    },
    {
        // v4: pose library and scene composer sections; defaults are filled by the merge.
        to: 4,
        migrate(settings) {
            return { ...settings, schemaVersion: 4 };
        },
    },
    {
        // v5: vibe library, streaming and tool defaults; defaults are filled by the merge.
        to: 5,
        migrate(settings) {
            return { ...settings, schemaVersion: 5 };
        },
    },
    {
        // v6: translation, prompt tools, sprites, comic and continuity; defaults are filled by the merge.
        to: 6,
        migrate(settings) {
            return { ...settings, schemaVersion: 6 };
        },
    },
    {
        // v7: image markers and human language; "translate automatically" becomes the language mode.
        to: 7,
        migrate(settings) {
            const translate = isObject(settings.translate) ? settings.translate : {};
            const language = isObject(settings.language) ? settings.language : {};
            const next: Raw = { ...settings, schemaVersion: 7 };
            if (translate.auto === true && language.mode === undefined) next.language = { ...language, mode: 'auto' };
            return next;
        },
    },
    {
        // v8: Doom's Enhancement Suite integration; defaults are filled by the merge.
        to: 8,
        migrate(settings) {
            return { ...settings, schemaVersion: 8 };
        },
    },
    {
        // v9: vision API of the multimodal modes; defaults are filled by the merge.
        to: 9,
        migrate(settings) {
            return { ...settings, schemaVersion: 9 };
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
    const poses = isObject(raw.poses) ? raw.poses : {};
    settings.poses.custom = (Array.isArray(poses.custom) ? poses.custom : []) as CustomPoseSettings[];
    settings.poses.favorites = (Array.isArray(poses.favorites) ? poses.favorites : []) as string[];
    const vibes = isObject(raw.vibes) ? raw.vibes : {};
    settings.vibes.items = (Array.isArray(vibes.items) ? vibes.items : []) as VibeItemSettings[];
    settings.vibes.sets = (Array.isArray(vibes.sets) ? vibes.sets : []) as VibeSetSettings[];
    const translate = isObject(raw.translate) ? raw.translate : {};
    settings.translate.glossary = (Array.isArray(translate.glossary) ? translate.glossary : []) as GlossarySettings[];
    const sprites = isObject(raw.sprites) ? raw.sprites : {};
    if (Array.isArray(sprites.labels)) settings.sprites.labels = sprites.labels as string[];
    const takeover = isObject(raw.takeover) ? raw.takeover : {};
    settings.takeover.migrationReport = (
        Array.isArray(takeover.migrationReport) ? takeover.migrationReport : []
    ) as string[];
    settings.schemaVersion = CURRENT_SCHEMA_VERSION;
    return { settings, fromVersion, migrated: fromVersion !== CURRENT_SCHEMA_VERSION };
}
