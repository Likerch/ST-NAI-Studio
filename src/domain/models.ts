// Registry of NovelAI image models (RECON §3.3). Ids are the exact strings the API accepts.

export const MODEL_IDS = [
    'nai-diffusion-5-full',
    'nai-diffusion-5-curated',
    'nai-diffusion-4-5-full',
    'nai-diffusion-4-5-curated',
    'nai-diffusion-4-full',
    'nai-diffusion-4-curated-preview',
    'nai-diffusion-3',
    'nai-diffusion-furry-3',
] as const;

export type ModelId = (typeof MODEL_IDS)[number];

export type ModelFamily = 'v3' | 'v4' | 'v4_5' | 'v5';

export interface ModelInfo {
    id: ModelId;
    family: ModelFamily;
    /** i18n key of the display name. */
    nameKey: string;
    /** Curated models never get the automatic `nsfw, ` UC prefix (bundle:_app@1651942). */
    curated: boolean;
    /** Model id used for `action: "infill"` (bundle:_app@1652880). */
    inpaintModel: string;
    /** Family whose capabilities apply to the inpaint model (V5 Curated inpaints with V4.5 Curated). */
    inpaintFamily: ModelFamily;
    /** Base model whose capabilities govern an inpaint request. */
    inpaintBase: ModelId;
    /** The web client groups these under "Legacy: no longer recommended". */
    legacy: boolean;
}

export const MODELS: readonly ModelInfo[] = [
    {
        id: 'nai-diffusion-5-full',
        family: 'v5',
        nameKey: 'naist.model.v5Full',
        curated: false,
        inpaintModel: 'nai-diffusion-5-full-inpainting',
        inpaintFamily: 'v5',
        inpaintBase: 'nai-diffusion-5-full',
        legacy: false,
    },
    {
        id: 'nai-diffusion-5-curated',
        family: 'v5',
        nameKey: 'naist.model.v5Curated',
        curated: true,
        // nai-diffusion-5-curated-inpainting is rejected by the server (RECON c16).
        inpaintModel: 'nai-diffusion-4-5-curated-inpainting',
        inpaintFamily: 'v4_5',
        inpaintBase: 'nai-diffusion-4-5-curated',
        legacy: false,
    },
    {
        id: 'nai-diffusion-4-5-full',
        family: 'v4_5',
        nameKey: 'naist.model.v45Full',
        curated: false,
        inpaintModel: 'nai-diffusion-4-5-full-inpainting',
        inpaintFamily: 'v4_5',
        inpaintBase: 'nai-diffusion-4-5-full',
        legacy: true,
    },
    {
        id: 'nai-diffusion-4-5-curated',
        family: 'v4_5',
        nameKey: 'naist.model.v45Curated',
        curated: true,
        inpaintModel: 'nai-diffusion-4-5-curated-inpainting',
        inpaintFamily: 'v4_5',
        inpaintBase: 'nai-diffusion-4-5-curated',
        legacy: true,
    },
    {
        id: 'nai-diffusion-4-full',
        family: 'v4',
        nameKey: 'naist.model.v4Full',
        curated: false,
        inpaintModel: 'nai-diffusion-4-full-inpainting',
        inpaintFamily: 'v4',
        inpaintBase: 'nai-diffusion-4-full',
        legacy: true,
    },
    {
        id: 'nai-diffusion-4-curated-preview',
        family: 'v4',
        nameKey: 'naist.model.v4Curated',
        curated: true,
        inpaintModel: 'nai-diffusion-4-curated-inpainting',
        inpaintFamily: 'v4',
        inpaintBase: 'nai-diffusion-4-curated-preview',
        legacy: true,
    },
    {
        id: 'nai-diffusion-3',
        family: 'v3',
        nameKey: 'naist.model.v3Anime',
        curated: false,
        inpaintModel: 'nai-diffusion-3-inpainting',
        inpaintFamily: 'v3',
        inpaintBase: 'nai-diffusion-3',
        legacy: true,
    },
    {
        id: 'nai-diffusion-furry-3',
        family: 'v3',
        nameKey: 'naist.model.v3Furry',
        curated: false,
        inpaintModel: 'nai-diffusion-furry-3-inpainting',
        inpaintFamily: 'v3',
        inpaintBase: 'nai-diffusion-furry-3',
        legacy: true,
    },
];

export const DEFAULT_MODEL: ModelId = 'nai-diffusion-4-5-full';

export function isModelId(value: unknown): value is ModelId {
    return typeof value === 'string' && (MODEL_IDS as readonly string[]).includes(value);
}

export function getModel(id: ModelId): ModelInfo {
    const model = MODELS.find((m) => m.id === id);
    if (!model) {
        throw new Error(`Unknown model id: ${id}`);
    }
    return model;
}
