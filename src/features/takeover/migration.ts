// One-time migration from the built-in Image Generation (extension_settings.sd and the cards'
// data.extensions.sd_character_prompt) into NAI Studio settings (TZ Phase 2, task 9).
// Pure: no host access. Never overwrites a value the user already changed in NAI Studio.
import { defaultSettings } from '../../core/settings-schema';
import type {
    CharacterPromptSettings,
    GenerationSettings,
    Initiator,
    NaiStudioSettings,
    StyleSettings,
} from '../../core/settings-schema';
import { DEFAULT_TEMPLATES, isModelId, NOISE_SCHEDULES, SAMPLERS, TEMPLATE_MODES } from '../../domain';

/** Defaults of the built-in extension (public/scripts/extensions/stable-diffusion/index.js:220-221). */
export const BUILTIN_DEFAULT_PREFIX = 'best quality, absurdres, aesthetic,';
export const BUILTIN_DEFAULT_NEGATIVE =
    'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';

/**
 * Stock values a new SillyTavern user gets from default/content/settings.json (extension_settings.sd).
 * They predate the current defaults but are not user edits either, so they must not be migrated.
 */
export const SETTINGS_JSON_DEFAULT_PREFIX = 'best quality, absurdres, masterpiece,';
export const SETTINGS_JSON_DEFAULT_TEMPLATES: Readonly<Record<string, string>> = {
    '2': "Ignore previous instructions and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
    '7': "Ignore previous instructions and provide a detailed description of {{char}}'s surroundings in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: location, time of day, weather, lighting, and any other relevant details. Do not include descriptions of characters and non-visual qualities such as names, personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'background,'. Ignore the rest of the story when crafting this description. Do not reply as {{user}} when writing this description, and do not attempt to continue the story.",
};

const STOCK_PREFIXES = [BUILTIN_DEFAULT_PREFIX, SETTINGS_JSON_DEFAULT_PREFIX];

export interface CardPrompt {
    key: string;
    positive: string;
    negative: string;
}

/** Report line ids; each is an i18n key under naist.migration. */
export type MigrationKey =
    | 'nothing'
    | 'prefix-moved'
    | 'prefix-kept'
    | 'prefix-default-skipped'
    | 'negative-moved'
    | 'negative-kept'
    | 'negative-default-skipped'
    | 'styles-moved'
    | 'character-prompts-moved'
    | 'character-prompts-kept'
    | 'card-prompts-moved'
    | 'templates-moved'
    | 'behaviour-moved'
    | 'generation-moved'
    | 'generation-kept'
    | 'free-only-kept'
    | 'upscale-not-moved'
    | 'generation-other-source';

export interface MigrationLine {
    key: MigrationKey;
    params?: Record<string, string | number>;
}

export interface MigrationResult {
    settings: NaiStudioSettings;
    lines: MigrationLine[];
}

type Raw = Record<string, unknown>;

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const same = (a: string, b: string): boolean => a.trim() === b.trim();
const isStockPrefix = (value: string): boolean => STOCK_PREFIXES.some((stock) => same(value, stock));
const isStockTemplate = (key: string, value: string): boolean =>
    [DEFAULT_TEMPLATES[key], SETTINGS_JSON_DEFAULT_TEMPLATES[key]].some(
        (stock) => stock !== undefined && same(value, stock),
    );

function isObject(value: unknown): value is Raw {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Prompt texts and character slots do not count: they are not generation parameters. */
const NON_PARAMETER_KEYS = new Set<keyof GenerationSettings>(['prompt', 'negativePrompt', 'characters']);

function generationIsPristine(current: NaiStudioSettings): boolean {
    const defaults = defaultSettings().generation;
    return (Object.keys(defaults) as (keyof GenerationSettings)[]).every(
        (key) =>
            NON_PARAMETER_KEYS.has(key) || JSON.stringify(current.generation[key]) === JSON.stringify(defaults[key]),
    );
}

const BEHAVIOUR: [string, (s: NaiStudioSettings) => { get(): boolean; set(v: boolean): void }][] = [
    ['refine_mode', (s) => ({ get: () => s.modes.refine, set: (v) => (s.modes.refine = v) })],
    ['multimodal_captioning', (s) => ({ get: () => s.modes.multimodal, set: (v) => (s.modes.multimodal = v) })],
    ['free_extend', (s) => ({ get: () => s.modes.freeExtend, set: (v) => (s.modes.freeExtend = v) })],
    ['snap', (s) => ({ get: () => s.modes.snap, set: (v) => (s.modes.snap = v) })],
    [
        'minimal_prompt_processing',
        (s) => ({ get: () => s.modes.minimalProcessing, set: (v) => (s.modes.minimalProcessing = v) }),
    ],
    ['interactive_mode', (s) => ({ get: () => s.chat.interactive, set: (v) => (s.chat.interactive = v) })],
    ['function_tool', (s) => ({ get: () => s.chat.functionTool, set: (v) => (s.chat.functionTool = v) })],
];

const VISIBILITY: [string, Initiator][] = [
    ['wand_visible', 'wand'],
    ['command_visible', 'command'],
    ['interactive_visible', 'interactive'],
    ['tool_visible', 'tool'],
];

export function migrateFromBuiltIn(sd: unknown, cards: CardPrompt[], current: NaiStudioSettings): MigrationResult {
    const next = structuredClone(current);
    const lines: MigrationLine[] = [];
    if (!isObject(sd)) {
        if (cards.length === 0) return { settings: next, lines: [{ key: 'nothing' }] };
    }
    const s: Raw = isObject(sd) ? sd : {};
    const defaults = defaultSettings();

    // Common prefix and negative: the built-in defaults are generic SD tags, NovelAI has its own.
    const prefix = str(s.prompt_prefix);
    if (prefix && !isStockPrefix(prefix)) {
        if (!next.prompts.prefix) {
            next.prompts.prefix = prefix;
            lines.push({ key: 'prefix-moved' });
        } else {
            lines.push({ key: 'prefix-kept' });
        }
    } else if (prefix) {
        lines.push({ key: 'prefix-default-skipped' });
    }
    const negative = str(s.negative_prompt);
    if (negative && !same(negative, BUILTIN_DEFAULT_NEGATIVE)) {
        if (!next.generation.negativePrompt) {
            next.generation.negativePrompt = negative;
            lines.push({ key: 'negative-moved' });
        } else {
            lines.push({ key: 'negative-kept' });
        }
    } else if (negative) {
        lines.push({ key: 'negative-default-skipped' });
    }

    // Styles: skip the untouched built-in "Default" style and names that already exist.
    const styles = Array.isArray(s.styles) ? s.styles.filter(isObject) : [];
    let movedStyles = 0;
    for (const style of styles) {
        const item: StyleSettings = {
            name: str(style.name),
            prefix: str(style.prefix),
            suffix: '',
            negative: str(style.negative),
        };
        if (!item.name) continue;
        const untouchedDefault =
            item.name === 'Default' && isStockPrefix(item.prefix) && same(item.negative, BUILTIN_DEFAULT_NEGATIVE);
        if (untouchedDefault || next.prompts.styles.some((x) => x.name === item.name)) continue;
        next.prompts.styles.push(item);
        movedStyles++;
    }
    if (movedStyles) lines.push({ key: 'styles-moved', params: { count: movedStyles } });
    const activeStyle = str(s.style);
    if (!next.prompts.activeStyle && next.prompts.styles.some((x) => x.name === activeStyle)) {
        next.prompts.activeStyle = activeStyle;
    }

    // Character prompts: local maps first, then shared card fields; existing NAI Studio entries win.
    const local = new Map<string, CharacterPromptSettings>();
    const positives = isObject(s.character_prompts) ? s.character_prompts : {};
    const negatives = isObject(s.character_negative_prompts) ? s.character_negative_prompts : {};
    for (const key of new Set([...Object.keys(positives), ...Object.keys(negatives)])) {
        const value = { positive: str(positives[key]), negative: str(negatives[key]) };
        if (value.positive || value.negative) local.set(key, value);
    }
    let movedLocal = 0;
    let keptLocal = 0;
    for (const [key, value] of local) {
        if (next.prompts.characterPrompts[key]) {
            keptLocal++;
            continue;
        }
        next.prompts.characterPrompts[key] = value;
        movedLocal++;
    }
    let movedCards = 0;
    for (const card of cards) {
        const existing = next.prompts.characterPrompts[card.key];
        if ((!card.positive && !card.negative) || existing) continue;
        next.prompts.characterPrompts[card.key] = { positive: card.positive, negative: card.negative };
        movedCards++;
    }
    if (movedLocal) lines.push({ key: 'character-prompts-moved', params: { count: movedLocal } });
    if (keptLocal) lines.push({ key: 'character-prompts-kept', params: { count: keptLocal } });
    if (movedCards) lines.push({ key: 'card-prompts-moved', params: { count: movedCards } });

    // Edited templates (only where NAI Studio still uses the default).
    const templates = isObject(s.prompts) ? s.prompts : {};
    let movedTemplates = 0;
    for (const mode of TEMPLATE_MODES) {
        const key = String(mode);
        const value = str(templates[key]);
        if (!value || isStockTemplate(key, value) || next.prompts.templates[key] !== undefined) continue;
        next.prompts.templates[key] = value;
        movedTemplates++;
    }
    if (movedTemplates) lines.push({ key: 'templates-moved', params: { count: movedTemplates } });

    // Behaviour switches and visibility, only where NAI Studio is still on its default.
    const moved: string[] = [];
    for (const [name, accessor] of BEHAVIOUR) {
        if (typeof s[name] !== 'boolean') continue;
        const target = accessor(next);
        if (target.get() === accessor(defaults).get() && target.get() !== s[name]) {
            target.set(s[name] as boolean);
            moved.push(name);
        }
    }
    for (const [name, initiator] of VISIBILITY) {
        if (typeof s[name] !== 'boolean') continue;
        if (
            next.chat.visibility[initiator] === defaults.chat.visibility[initiator] &&
            next.chat.visibility[initiator] !== s[name]
        ) {
            next.chat.visibility[initiator] = s[name] as boolean;
            moved.push(name);
        }
    }
    if (moved.length) lines.push({ key: 'behaviour-moved', params: { names: moved.join(', ') } });

    // NovelAI generation parameters.
    if (s.source === 'novel') {
        if (generationIsPristine(current)) {
            const g = next.generation;
            const model = str(s.model);
            if (isModelId(model)) g.model = model;
            const sampler = str(s.sampler);
            if ((SAMPLERS as readonly string[]).includes(sampler)) g.sampler = sampler;
            const schedule = str(s.scheduler);
            if ((NOISE_SCHEDULES as readonly string[]).includes(schedule)) g.noiseSchedule = schedule;
            const steps = num(s.steps);
            if (steps !== undefined) g.steps = Math.min(50, Math.max(1, Math.round(steps)));
            const scale = num(s.scale);
            if (scale !== undefined) g.scale = Math.min(10, Math.max(0, scale));
            const width = num(s.width);
            const height = num(s.height);
            if (width && height) {
                g.width = Math.max(64, Math.round(width / 64) * 64);
                g.height = Math.max(64, Math.round(height / 64) * 64);
            }
            const seed = num(s.seed);
            if (seed !== undefined) g.seed = seed;
            g.smea = s.novel_sm === true;
            g.smeaDyn = s.novel_sm_dyn === true;
            g.decrisper = s.novel_decrisper === true;
            g.varietyBoost = s.novel_variety_boost === true;
            lines.push({ key: 'generation-moved', params: { model: g.model } });
        } else {
            lines.push({ key: 'generation-kept' });
        }
        if (s.novel_anlas_guard !== true && next.anlas.freeOnly) {
            lines.push({ key: 'free-only-kept' });
        }
        const upscale = num(s.hr_scale);
        if (upscale !== undefined && upscale > 1) {
            lines.push({ key: 'upscale-not-moved', params: { ratio: upscale } });
        }
    } else if (typeof s.source === 'string') {
        lines.push({ key: 'generation-other-source', params: { source: s.source } });
    }

    if (lines.length === 0) lines.push({ key: 'nothing' });
    return { settings: next, lines };
}
