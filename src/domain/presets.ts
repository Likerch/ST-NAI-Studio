// UC presets and quality tags that the NovelAI web client appends itself (RECON §3.7).
// The server only receives the final strings plus numeric tag hints.
import type { ModelId } from './models';
import type { QualityPresetId, UcPresetId } from './types';

const V5_V45F_HEAVY =
    'lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
const FURRY_FOCUS_V45_V5 =
    '{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic';
const HUMAN_FOCUS_SUFFIX_V45_V5 = ', @_@, mismatched pupils, glowing eyes, bad anatomy';
const V3_HEAVY =
    'lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]';

type UcTable = Partial<Record<UcPresetId, string>>;

const UC_TEXTS: Record<ModelId, UcTable> = {
    'nai-diffusion-5-full': {
        heavy: V5_V45F_HEAVY,
        light: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::',
        furryFocus: FURRY_FOCUS_V45_V5,
        humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
        none: '',
    },
    'nai-diffusion-5-curated': {
        heavy: V5_V45F_HEAVY,
        light: 'lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::',
        furryFocus: FURRY_FOCUS_V45_V5,
        humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
        none: '',
    },
    'nai-diffusion-4-5-full': {
        heavy: V5_V45F_HEAVY,
        light: 'lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page',
        furryFocus: FURRY_FOCUS_V45_V5,
        humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
        none: '',
    },
    'nai-diffusion-4-5-curated': {
        heavy: 'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page',
        light: 'blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page',
        humanFocus:
            'blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page',
        none: '',
    },
    'nai-diffusion-4-full': {
        heavy: 'blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page',
        light: 'blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, white blank page, blank page',
        none: '',
    },
    'nai-diffusion-4-curated-preview': {
        heavy: 'blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts, white blank page, blank page',
        light: 'blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature, white blank page, blank page',
        none: '',
    },
    'nai-diffusion-3': {
        heavy: V3_HEAVY,
        light: 'lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing',
        humanFocus: V3_HEAVY + ', bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes',
        none: 'lowres',
    },
    'nai-diffusion-furry-3': {
        heavy: '{{worst quality}}, [displeasing], {unusual pupils}, guide lines, {{unfinished}}, {bad}, url, artist name, {{tall image}}, mosaic, {sketch page}, comic panel, impact (font), [dated], {logo}, ych, {what}, {where is your god now}, {distorted text}, repeated text, {floating head}, {1994}, {widescreen}, absolutely everyone, sequence, {compression artifacts}, hard translated, {cropped}, {commissioner name}, unknown text, high contrast',
        light: '{worst quality}, guide lines, unfinished, bad, url, tall image, widescreen, compression artifacts, unknown text',
        none: 'lowres',
    },
};

const QUALITY_TEXTS: Record<ModelId, Partial<Record<QualityPresetId, string>>> = {
    'nai-diffusion-5-full': {
        standard: 'very aesthetic, masterpiece, no text',
        light: 'very aesthetic, amazing quality, no text',
    },
    'nai-diffusion-5-curated': {
        standard: 'very aesthetic, masterpiece, no text',
        light: 'very aesthetic, amazing quality, no text',
    },
    'nai-diffusion-4-5-full': { standard: 'very aesthetic, masterpiece, no text' },
    'nai-diffusion-4-5-curated': { standard: 'very aesthetic, masterpiece, no text, -0.8::feet::, rating:general' },
    'nai-diffusion-4-full': { standard: 'no text, best quality, very aesthetic, absurdres' },
    'nai-diffusion-4-curated-preview': { standard: 'rating:general, best quality, very aesthetic, absurdres' },
    'nai-diffusion-3': { standard: 'best quality, amazing quality, very aesthetic, absurdres' },
    'nai-diffusion-furry-3': { standard: '{best quality}, {amazing quality}' },
};

/** Numeric ids sent as tag_hint_qt / tag_hint_uc_preset (bundle:_app@332363). */
export const TAG_HINT_IDS: Record<UcPresetId | QualityPresetId, number> = {
    none: 0,
    standard: 1,
    heavy: 2,
    light: 3,
    humanFocus: 4,
    furryFocus: 5,
};

export function getUcPresetText(model: ModelId, preset: UcPresetId): string {
    return UC_TEXTS[model][preset] ?? '';
}

export function getQualityText(model: ModelId, preset: QualityPresetId): string {
    if (preset === 'none') {
        return '';
    }
    return QUALITY_TEXTS[model][preset] ?? QUALITY_TEXTS[model].standard ?? '';
}
