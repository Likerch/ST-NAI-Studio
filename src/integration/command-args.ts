// /imagine (/sd) named arguments -> per-call overrides. Accepts every argument of the built-in
// command so existing STscripts keep working; ones that make no sense for NovelAI are ignored.
import type { GenerationSettings } from '../core/settings-schema';
import { isModelId, NOISE_SCHEDULES, QUALITY_PRESETS, SAMPLERS, UC_PRESETS } from '../domain';
import type { CallOverrides } from '../features/generation/pipeline';

/** Built-in arguments without a NovelAI meaning (SD-WebUI/ComfyUI specific). */
export const IGNORED_ARGS = ['skip', 'vae', 'upscaler', 'hires', 'scale', 'denoise', '2ndpass', 'faces'] as const;

export const MODEL_ALIASES: Readonly<Record<string, string>> = {
    v5: 'nai-diffusion-5-full',
    'v5-full': 'nai-diffusion-5-full',
    'v5-curated': 'nai-diffusion-5-curated',
    'v4.5': 'nai-diffusion-4-5-full',
    'v4.5-full': 'nai-diffusion-4-5-full',
    'v4.5-curated': 'nai-diffusion-4-5-curated',
    v4: 'nai-diffusion-4-full',
    'v4-full': 'nai-diffusion-4-full',
    'v4-curated': 'nai-diffusion-4-curated-preview',
    v3: 'nai-diffusion-3',
    'anime-v3': 'nai-diffusion-3',
    furry: 'nai-diffusion-furry-3',
    'furry-v3': 'nai-diffusion-furry-3',
};

/** Same coercion as the built-in: anything that is not explicitly false counts as true. */
export function boolArg(value: unknown): boolean {
    const text = String(value).trim().toLowerCase();
    if (['on', 'true'].includes(text)) return true;
    return !['off', 'false'].includes(text);
}

function numberArg(value: unknown): number | undefined {
    const n = Number(value);
    return value === undefined || value === '' || !Number.isFinite(n) ? undefined : n;
}

export function resolveModel(value: string): string | undefined {
    const key = value.trim().toLowerCase();
    const id = MODEL_ALIASES[key] ?? key;
    return isModelId(id) ? id : undefined;
}

export interface ParsedArgs {
    overrides: CallOverrides;
    /** Arguments that were given but have no effect on NovelAI. */
    ignored: string[];
    /** Arguments with a value NAI Studio does not understand. */
    invalid: string[];
}

export function parseCommandArgs(args: Record<string, unknown>): ParsedArgs {
    const has = (name: string): boolean => args[name] !== undefined && !name.startsWith('_');
    const overrides: CallOverrides = {};
    const generation: Partial<GenerationSettings> = {};
    const ignored: string[] = [];
    const invalid: string[] = [];

    if (has('quiet')) overrides.quiet = boolArg(args.quiet);
    if (has('gallery')) overrides.gallery = boolArg(args.gallery);
    if (has('negative')) overrides.negative = String(args.negative);
    if (has('extend')) overrides.extend = boolArg(args.extend);
    if (has('edit')) overrides.edit = boolArg(args.edit);
    if (has('multimodal')) overrides.multimodal = boolArg(args.multimodal);
    if (has('snap')) overrides.snap = boolArg(args.snap);
    if (has('processing')) {
        const value = String(args.processing).toLowerCase();
        if (value.includes('minimal')) overrides.minimalProcessing = true;
        else if (value.includes('standard')) overrides.minimalProcessing = false;
        else invalid.push('processing');
    }

    const numbers: [string, keyof GenerationSettings][] = [
        ['seed', 'seed'],
        ['width', 'width'],
        ['height', 'height'],
        ['steps', 'steps'],
        ['cfg', 'scale'],
        ['cfgrescale', 'cfgRescale'],
        ['samples', 'samples'],
    ];
    for (const [name, key] of numbers) {
        if (!has(name)) continue;
        const value = numberArg(args[name]);
        if (value === undefined) invalid.push(name);
        else (generation as Record<string, unknown>)[key] = value;
    }

    if (has('model')) {
        const model = resolveModel(String(args.model));
        if (model) generation.model = model;
        else invalid.push('model');
    }
    const enums: [string, keyof GenerationSettings, readonly string[]][] = [
        ['sampler', 'sampler', SAMPLERS],
        ['scheduler', 'noiseSchedule', NOISE_SCHEDULES],
        ['uc', 'ucPreset', UC_PRESETS],
        ['quality', 'qualityPreset', QUALITY_PRESETS],
    ];
    for (const [name, key, allowed] of enums) {
        if (!has(name)) continue;
        const value = String(args[name]);
        if (allowed.includes(value)) (generation as Record<string, unknown>)[key] = value;
        else invalid.push(name);
    }
    const flags: [string, keyof GenerationSettings][] = [
        ['smea', 'smea'],
        ['dyn', 'smeaDyn'],
        ['variety', 'varietyBoost'],
        ['decrisper', 'decrisper'],
        ['transparent', 'transparentBackground'],
    ];
    for (const [name, key] of flags) {
        if (has(name)) (generation as Record<string, unknown>)[key] = boolArg(args[name]);
    }
    if (has('smea')) generation.autoSmea = false;

    for (const name of IGNORED_ARGS) {
        if (has(name)) ignored.push(name);
    }
    if (Object.keys(generation).length > 0) overrides.generation = generation;
    return { overrides, ignored, invalid };
}
