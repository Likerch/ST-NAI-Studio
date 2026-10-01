// Capability matrix (RECON §3.4). The UI hides unsupported controls from it and sanitize.ts
// drops unsupported fields from the payload. Source of flags: PE(model) in the NovelAI web client.
import { getModel } from './models';
import type { ModelFamily, ModelId } from './models';
import type { NoiseSchedule, QualityPresetId, Sampler, UcPresetId } from './types';

/**
 * Features NovelAI announced for V5 but has not released yet. Flip to true once the API
 * accepts them: the payload code for both already exists (vibes, director references).
 */
export const FEATURE_FLAGS = {
    v5VibeTransfer: false,
    v5CharacterReference: false,
} as const;

export interface SizePreset {
    category: 'normal' | 'large' | 'wallpaper' | 'small';
    orientation: 'portrait' | 'landscape' | 'square';
    width: number;
    height: number;
}

export type Tokenizer = 'clip' | 't5' | 'qwen';

export interface ModelCapabilities {
    model: ModelId;
    family: ModelFamily;
    curated: boolean;
    /** Max character prompts; 0 = no multi-character support (V3). */
    maxCharacters: number;
    positioning: 'none' | 'grid' | 'freeform';
    canPositionSingleCharacter: boolean;
    /** v4_prompt / v4_negative_prompt are mandatory (missing -> HTTP 500, RECON c11). */
    v4Prompt: boolean;
    promptTokenLimit: number;
    tokenizer: Tokenizer;
    img2img: boolean;
    inpaint: boolean;
    inpaintModel: string;
    inpaintFamily: ModelFamily;
    inpaintBase: ModelId;
    vibeTransfer: boolean;
    vibeKind: 'encoded' | 'raw' | 'none';
    characterReference: boolean;
    characterReferenceInpaint: boolean;
    transparency: boolean;
    smea: boolean;
    smeaDyn: boolean;
    /** Pixel count from which the web client turns SMEA on automatically; null = no auto SMEA. */
    autoSmeaThreshold: number | null;
    decrisper: boolean;
    varietyBoost: boolean;
    varietySigma: number;
    noiseSchedules: readonly NoiseSchedule[];
    /** Schedule the API always receives regardless of the user's choice (V5: karras). */
    forcedNoiseSchedule: NoiseSchedule | null;
    cfgRescale: boolean;
    samplers: readonly Sampler[];
    ucPresets: readonly UcPresetId[];
    qualityPresets: readonly QualityPresetId[];
    legacyUc: boolean;
    furryMode: boolean;
    textInImage: boolean;
    /** Opus V5 usage limit: free generations also require usage.isNegative === false. */
    usageLimit: boolean;
    priceMultiplier: number;
    scaleMax: number;
    maxSteps: number;
    maxPixels: number;
    freePixels: number;
    defaults: { width: number; height: number; steps: number; scale: number };
    sizePresets: readonly SizePreset[];
}

const MODERN_SAMPLERS: readonly Sampler[] = [
    'k_euler_ancestral',
    'k_euler',
    'k_dpmpp_2s_ancestral',
    'k_dpmpp_2m_sde',
    'k_dpmpp_2m',
    'k_dpmpp_sde',
];
const V3_SAMPLERS: readonly Sampler[] = [...MODERN_SAMPLERS, 'ddim_v3'];

// bundle:1601@44303 — the same list serves V4, V4.5 and V5.
const SIZE_PRESETS: readonly SizePreset[] = [
    { category: 'normal', orientation: 'portrait', width: 832, height: 1216 },
    { category: 'normal', orientation: 'landscape', width: 1216, height: 832 },
    { category: 'normal', orientation: 'square', width: 1024, height: 1024 },
    { category: 'large', orientation: 'portrait', width: 1024, height: 1536 },
    { category: 'large', orientation: 'landscape', width: 1536, height: 1024 },
    { category: 'large', orientation: 'square', width: 1472, height: 1472 },
    { category: 'wallpaper', orientation: 'portrait', width: 1088, height: 1920 },
    { category: 'wallpaper', orientation: 'landscape', width: 1920, height: 1088 },
    { category: 'small', orientation: 'portrait', width: 512, height: 768 },
    { category: 'small', orientation: 'landscape', width: 768, height: 512 },
    { category: 'small', orientation: 'square', width: 640, height: 640 },
];

const COMMON = {
    img2img: true,
    inpaint: true,
    cfgRescale: true,
    scaleMax: 10,
    maxSteps: 50,
    maxPixels: 3145728,
    freePixels: 1048576,
    sizePresets: SIZE_PRESETS,
} as const;

type FamilyCaps = Omit<
    ModelCapabilities,
    'model' | 'curated' | 'inpaintModel' | 'inpaintFamily' | 'inpaintBase' | 'ucPresets' | 'defaults'
> & {
    scaleDefault: number;
};

const FAMILY: Record<ModelFamily, FamilyCaps> = {
    v5: {
        ...COMMON,
        family: 'v5',
        maxCharacters: 32,
        positioning: 'freeform',
        canPositionSingleCharacter: true,
        v4Prompt: true,
        promptTokenLimit: 1471,
        tokenizer: 'qwen',
        vibeTransfer: FEATURE_FLAGS.v5VibeTransfer,
        vibeKind: FEATURE_FLAGS.v5VibeTransfer ? 'encoded' : 'none',
        characterReference: FEATURE_FLAGS.v5CharacterReference,
        characterReferenceInpaint: false,
        transparency: true,
        smea: false,
        smeaDyn: false,
        autoSmeaThreshold: null,
        decrisper: false,
        varietyBoost: false,
        varietySigma: 58,
        noiseSchedules: [],
        forcedNoiseSchedule: 'karras',
        samplers: MODERN_SAMPLERS,
        qualityPresets: ['standard', 'light', 'none'],
        legacyUc: false,
        furryMode: true,
        textInImage: true,
        usageLimit: true,
        priceMultiplier: 1.5,
        scaleDefault: 7,
    },
    v4_5: {
        ...COMMON,
        family: 'v4_5',
        maxCharacters: 6,
        positioning: 'grid',
        canPositionSingleCharacter: false,
        v4Prompt: true,
        promptTokenLimit: 512,
        tokenizer: 't5',
        vibeTransfer: true,
        vibeKind: 'encoded',
        characterReference: true,
        characterReferenceInpaint: true,
        transparency: false,
        smea: false,
        smeaDyn: false,
        autoSmeaThreshold: null,
        decrisper: false,
        varietyBoost: true,
        varietySigma: 58,
        noiseSchedules: ['karras', 'exponential', 'polyexponential'],
        forcedNoiseSchedule: null,
        samplers: MODERN_SAMPLERS,
        qualityPresets: ['standard', 'none'],
        legacyUc: false,
        furryMode: true,
        textInImage: true,
        usageLimit: false,
        priceMultiplier: 1,
        scaleDefault: 5,
    },
    v4: {
        ...COMMON,
        family: 'v4',
        maxCharacters: 6,
        positioning: 'grid',
        canPositionSingleCharacter: false,
        v4Prompt: true,
        promptTokenLimit: 512,
        tokenizer: 't5',
        vibeTransfer: true,
        vibeKind: 'encoded',
        characterReference: false,
        characterReferenceInpaint: false,
        transparency: false,
        smea: false,
        smeaDyn: false,
        autoSmeaThreshold: null,
        decrisper: false,
        varietyBoost: true,
        varietySigma: 19,
        noiseSchedules: ['karras', 'exponential', 'polyexponential'],
        forcedNoiseSchedule: null,
        samplers: MODERN_SAMPLERS,
        qualityPresets: ['standard', 'none'],
        legacyUc: true,
        furryMode: true,
        textInImage: true,
        usageLimit: false,
        priceMultiplier: 1,
        scaleDefault: 5.5,
    },
    v3: {
        ...COMMON,
        family: 'v3',
        maxCharacters: 0,
        positioning: 'none',
        canPositionSingleCharacter: false,
        v4Prompt: false,
        promptTokenLimit: 225,
        tokenizer: 'clip',
        vibeTransfer: true,
        vibeKind: 'raw',
        characterReference: false,
        characterReferenceInpaint: false,
        transparency: false,
        smea: true,
        smeaDyn: true,
        autoSmeaThreshold: 2166785,
        decrisper: true,
        varietyBoost: true,
        varietySigma: 19,
        noiseSchedules: ['native', 'karras', 'exponential', 'polyexponential'],
        forcedNoiseSchedule: null,
        samplers: V3_SAMPLERS,
        qualityPresets: ['standard', 'none'],
        legacyUc: false,
        furryMode: false,
        textInImage: false,
        usageLimit: false,
        priceMultiplier: 1,
        scaleDefault: 5,
    },
};

// Available UC presets per model (legacy ucPreset index order, bundle:_app@753819).
const UC_PRESETS_BY_MODEL: Record<ModelId, readonly UcPresetId[]> = {
    'nai-diffusion-5-full': ['heavy', 'light', 'furryFocus', 'humanFocus', 'none'],
    'nai-diffusion-5-curated': ['heavy', 'light', 'furryFocus', 'humanFocus', 'none'],
    'nai-diffusion-4-5-full': ['heavy', 'light', 'furryFocus', 'humanFocus', 'none'],
    'nai-diffusion-4-5-curated': ['heavy', 'light', 'humanFocus', 'none'],
    'nai-diffusion-4-full': ['heavy', 'light', 'none'],
    'nai-diffusion-4-curated-preview': ['heavy', 'light', 'none'],
    'nai-diffusion-3': ['heavy', 'light', 'humanFocus', 'none'],
    'nai-diffusion-furry-3': ['heavy', 'light', 'none'],
};

const SCALE_DEFAULT_OVERRIDE: Partial<Record<ModelId, number>> = {
    'nai-diffusion-furry-3': 6.2,
};

// bundle:_app@1665651 — V5 Curated has a smaller prompt budget than V5 Full.
const PROMPT_LIMIT_OVERRIDE: Partial<Record<ModelId, number>> = {
    'nai-diffusion-5-curated': 703,
};

export function getCapabilities(id: ModelId): ModelCapabilities {
    const model = getModel(id);
    const { scaleDefault, ...family } = FAMILY[model.family];
    return {
        ...family,
        model: id,
        curated: model.curated,
        inpaintModel: model.inpaintModel,
        inpaintFamily: model.inpaintFamily,
        inpaintBase: model.inpaintBase,
        ucPresets: UC_PRESETS_BY_MODEL[id],
        promptTokenLimit: PROMPT_LIMIT_OVERRIDE[id] ?? family.promptTokenLimit,
        defaults: { width: 832, height: 1216, steps: 23, scale: SCALE_DEFAULT_OVERRIDE[id] ?? scaleDefault },
    };
}

/** Capabilities of the model that actually serves an inpaint request (V5 Curated -> V4.5 Curated). */
export function getInpaintCapabilities(id: ModelId): ModelCapabilities {
    return getCapabilities(getModel(id).inpaintBase);
}

/** Samplers that take no noise schedule (the client deletes `noise_schedule` for them). */
export const SAMPLERS_WITHOUT_SCHEDULE: readonly string[] = [
    'ddim',
    'ddim_v3',
    'plms',
    'k_lms',
    'k_dpm_fast',
    'nai_smea',
    'nai_smea_dyn',
];
