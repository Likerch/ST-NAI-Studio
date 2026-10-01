import { describe, expect, it } from 'vitest';
import { buildPayload, DomainError, defaultRequest, getCapabilities, varietyFactor } from '../../src/domain';
import type { GenerationRequest, ModelId } from '../../src/domain';
import { FAKE_IMAGE } from '../helpers/captures';

function build(model: ModelId, patch: Partial<GenerationRequest> = {}) {
    const req = { ...defaultRequest(model), prompt: 'cat', seed: 1, ...patch };
    return buildPayload(req, getCapabilities(model));
}

describe('sanitize: model capabilities', () => {
    it('drops SMEA on V4.5/V5 and marks it user-set when asked for', () => {
        const result = build('nai-diffusion-5-full', { smea: true, smeaDyn: true });
        expect(result.body.parameters.sm).toBeUndefined();
        expect(result.body.parameters.sm_dyn).toBeUndefined();
        expect(result.dropped).toContainEqual({ path: 'parameters.sm', reason: 'unsupported-by-model', userSet: true });
        expect(result.dropped).toContainEqual({
            path: 'parameters.sm_dyn',
            reason: 'unsupported-by-model',
            userSet: true,
        });
    });

    it('keeps SMEA and DYN on V3 when requested without auto SMEA', () => {
        const result = build('nai-diffusion-3', { smea: true, smeaDyn: true, autoSmea: false });
        expect(result.body.parameters.sm).toBe(true);
        expect(result.body.parameters.sm_dyn).toBe(true);
    });

    it('auto SMEA on V3 turns on above the area threshold only', () => {
        // Threshold is 2166785 px: 1472x1472 (2166784) stays off, 1536x1472 turns on.
        expect(build('nai-diffusion-3', { width: 1472, height: 1472 }).body.parameters.sm).toBe(false);
        expect(build('nai-diffusion-3', { width: 1536, height: 1472 }).body.parameters.sm).toBe(true);
        expect(build('nai-diffusion-3', { width: 832, height: 1216, smea: true }).body.parameters.sm).toBe(false);
    });

    it('turns SMEA off when a source image is present (V3 img2img)', () => {
        const result = build('nai-diffusion-3', { mode: 'img2img', image: FAKE_IMAGE, smea: true, autoSmea: false });
        expect(result.body.parameters.sm).toBe(false);
        expect(result.body.parameters.sm_dyn).toBe(false);
    });

    it('forces karras on V5 and warns when another schedule was chosen', () => {
        const result = build('nai-diffusion-5-curated', { noiseSchedule: 'exponential' });
        expect(result.body.parameters.noise_schedule).toBe('karras');
        expect(result.warnings).toContainEqual({
            code: 'noise-schedule-forced',
            params: { from: 'exponential', to: 'karras' },
        });
    });

    it('replaces native schedule on V4.5 (not offered there)', () => {
        const result = build('nai-diffusion-4-5-full', { noiseSchedule: 'native' });
        expect(result.body.parameters.noise_schedule).toBe('karras');
    });

    it('keeps native on V3 and then skips the Euler Ancestral flags', () => {
        const params = build('nai-diffusion-3', { noiseSchedule: 'native' }).body.parameters;
        expect(params.noise_schedule).toBe('native');
        expect(params.deliberate_euler_ancestral_bug).toBeUndefined();
        expect(params.prefer_brownian).toBeUndefined();
    });

    it('removes noise_schedule for ddim_v3', () => {
        const result = build('nai-diffusion-3', { sampler: 'ddim_v3' });
        expect(result.body.parameters.noise_schedule).toBeUndefined();
        expect(result.dropped.map((d) => d.path)).toContain('parameters.noise_schedule');
    });

    it('replaces samplers the model does not offer', () => {
        const result = build('nai-diffusion-4-5-full', { sampler: 'ddim_v3' });
        expect(result.body.parameters.sampler).toBe('k_euler_ancestral');
        expect(result.warnings.map((w) => w.code)).toContain('sampler-replaced');
    });

    it('scales Variety Boost sigma with resolution and drops it on V5', () => {
        expect(
            build('nai-diffusion-4-5-full', { varietyBoost: true }).body.parameters.skip_cfg_above_sigma,
        ).toBeCloseTo(58);
        expect(
            build('nai-diffusion-4-full', { varietyBoost: true, width: 1024, height: 1024 }).body.parameters
                .skip_cfg_above_sigma,
        ).toBeCloseTo(19 * varietyFactor(1024, 1024));
        const v5 = build('nai-diffusion-5-full', { varietyBoost: true });
        expect(v5.body.parameters.skip_cfg_above_sigma).toBeUndefined();
        expect(v5.dropped).toContainEqual({
            path: 'parameters.skip_cfg_above_sigma',
            reason: 'unsupported-by-model',
            userSet: true,
        });
    });

    it('disables decrisper outside V3 with a warning', () => {
        const result = build('nai-diffusion-4-5-full', { decrisper: true });
        expect(result.body.parameters.dynamic_thresholding).toBe(false);
        expect(result.warnings.map((w) => w.code)).toContain('decrisper-disabled');
        expect(build('nai-diffusion-3', { decrisper: true }).body.parameters.dynamic_thresholding).toBe(true);
    });

    it('sends the transparency hint only on V5 when requested', () => {
        const on = build('nai-diffusion-5-full', { transparentBackground: true });
        expect(on.body.parameters.tag_hint_transparent_background).toBe(true);
        expect(on.body.input).toContain('transparent background, very aesthetic');
        const v45 = build('nai-diffusion-4-5-full', { transparentBackground: true });
        expect(v45.body.parameters.tag_hint_transparent_background).toBeUndefined();
        expect(v45.body.parameters.straight_alpha).toBeUndefined();
        expect(v45.dropped).toContainEqual({
            path: 'parameters.tag_hint_transparent_background',
            reason: 'unsupported-by-model',
            userSet: true,
        });
    });

    it('allows legacy UC only on V4', () => {
        expect(build('nai-diffusion-4-full', { legacyUc: true }).body.parameters.legacy_uc).toBe(true);
        const v45 = build('nai-diffusion-4-5-full', { legacyUc: true });
        expect(v45.body.parameters.legacy_uc).toBe(false);
        expect(v45.warnings.map((w) => w.code)).toContain('legacy-uc-disabled');
    });

    it('omits image_format for PNG', () => {
        expect(build('nai-diffusion-4-5-full', { imageFormat: 'png' }).body.parameters.image_format).toBeUndefined();
    });
});

describe('characters and positions', () => {
    const chars = Array.from({ length: 8 }, (_, i) => ({
        prompt: `1girl, c${i}`,
        negative: '',
        center: { x: 0.41, y: 0.62 },
        enabled: true,
    }));

    it('limits V4.5 to 6 characters and records the extras', () => {
        const result = build('nai-diffusion-4-5-full', { characters: chars });
        expect(result.body.parameters.characterPrompts).toHaveLength(6);
        expect(result.dropped.filter((d) => d.reason === 'exceeds-model-limit')).toHaveLength(2);
    });

    it('allows up to 32 characters on V5', () => {
        const many = Array.from({ length: 33 }, (_, i) => ({
            prompt: `p${i}`,
            negative: '',
            center: { x: 0.5, y: 0.5 },
            enabled: true,
        }));
        const result = build('nai-diffusion-5-full', { characters: many });
        expect(result.body.parameters.characterPrompts).toHaveLength(32);
    });

    it('snaps to the grid on V4.5 and keeps free coordinates on V5', () => {
        const v45 = build('nai-diffusion-4-5-full', { characters: chars.slice(0, 2), useCoords: true });
        expect(v45.body.parameters.characterPrompts?.[0]?.center).toEqual({ x: 0.5, y: 0.7 });
        const v5 = build('nai-diffusion-5-full', { characters: chars.slice(0, 1), useCoords: true });
        expect(v5.body.parameters.characterPrompts?.[0]?.center).toEqual({ x: 0.41, y: 0.62 });
        expect(v5.body.parameters.v4_prompt?.use_coords).toBe(true);
    });

    it('rewrites the first 1girl in character prompts', () => {
        const result = build('nai-diffusion-5-full', { characters: chars.slice(0, 1) });
        expect(result.body.parameters.characterPrompts?.[0]?.prompt).toBe('girl, c0');
    });

    it('disables coordinates for a single character on V4.5', () => {
        const result = build('nai-diffusion-4-5-full', { characters: chars.slice(0, 1), useCoords: true });
        expect(result.body.parameters.use_coords).toBe(false);
        expect(result.warnings).toContainEqual({ code: 'coords-disabled', params: { characters: 1, minimum: 2 } });
    });

    it('skips disabled and empty character slots', () => {
        const result = build('nai-diffusion-5-full', {
            characters: [
                { prompt: '  ', negative: '', center: { x: 0.5, y: 0.5 }, enabled: true },
                { prompt: 'boy', negative: '', center: { x: 0.5, y: 0.5 }, enabled: false },
            ],
        });
        expect(result.body.parameters.characterPrompts).toEqual([]);
    });

    it('drops character prompts on V3', () => {
        const result = build('nai-diffusion-3', { characters: chars.slice(0, 1) });
        expect(result.body.parameters.characterPrompts).toEqual([]);
        expect(result.dropped).toContainEqual({
            path: 'parameters.characterPrompts',
            reason: 'unsupported-by-model',
            userSet: true,
        });
    });
});

describe('references', () => {
    const vibe = { data: FAKE_IMAGE, strength: 0.6, informationExtracted: 0.8 };
    const ref = {
        image: FAKE_IMAGE,
        description: 'character' as const,
        strength: 0.9,
        fidelity: 0.75,
        informationExtracted: 1,
    };

    it('drops vibes on V5 as a disabled feature flag', () => {
        const result = build('nai-diffusion-5-full', { vibes: [vibe] });
        expect(result.body.parameters.reference_image_multiple).toBeUndefined();
        expect(result.dropped).toContainEqual({
            path: 'parameters.reference_image_multiple',
            reason: 'feature-flag-off',
            userSet: true,
        });
    });

    it('sends raw vibes with information extracted on V3', () => {
        const params = build('nai-diffusion-3', { vibes: [vibe] }).body.parameters;
        expect(params.reference_information_extracted_multiple).toEqual([0.8]);
        expect(params.reference_strength_multiple).toEqual([0.6]);
    });

    it('normalizes encoded vibe strengths when their sum exceeds 1', () => {
        const params = build('nai-diffusion-4-5-full', { vibes: [vibe, { ...vibe, strength: 0.9 }] }).body.parameters;
        expect(params.reference_strength_multiple).toEqual([0.6 / 1.5, 0.9 / 1.5]);
        const raw = build('nai-diffusion-4-5-full', {
            vibes: [vibe, { ...vibe, strength: 0.9 }],
            normalizeVibeStrength: false,
        }).body.parameters;
        expect(raw.reference_strength_multiple).toEqual([0.6, 0.9]);
    });

    it('caps vibes at 16', () => {
        const result = build('nai-diffusion-4-5-full', { vibes: Array.from({ length: 18 }, () => vibe) });
        expect(result.body.parameters.reference_image_multiple).toHaveLength(16);
        expect(result.dropped.filter((d) => d.reason === 'exceeds-model-limit')).toHaveLength(2);
    });

    it('skips vibes for inpaint and when character references are present', () => {
        const inpaint = build('nai-diffusion-4-5-full', {
            mode: 'inpaint',
            image: FAKE_IMAGE,
            mask: FAKE_IMAGE,
            vibes: [vibe],
        });
        expect(inpaint.dropped).toContainEqual({
            path: 'parameters.reference_image_multiple',
            reason: 'not-applicable-to-mode',
            userSet: true,
        });
        const both = build('nai-diffusion-4-5-full', { vibes: [vibe], characterReferences: [ref] });
        expect(both.body.parameters.director_reference_images).toHaveLength(1);
        expect(both.dropped).toContainEqual({
            path: 'parameters.reference_image_multiple',
            reason: 'superseded',
            userSet: true,
        });
    });

    it('maps fidelity to the secondary strength', () => {
        const params = build('nai-diffusion-4-5-curated', { characterReferences: [ref] }).body.parameters;
        expect(params.director_reference_secondary_strength_values).toEqual([0.25]);
        expect(params.director_reference_descriptions).toEqual([
            { caption: { base_caption: 'character', char_captions: [] }, legacy_uc: false },
        ]);
    });

    it('drops character references where unsupported', () => {
        expect(build('nai-diffusion-5-full', { characterReferences: [ref] }).dropped[0]?.reason).toBe(
            'feature-flag-off',
        );
        expect(build('nai-diffusion-4-full', { characterReferences: [ref] }).dropped.map((d) => d.reason)).toContain(
            'unsupported-by-model',
        );
        expect(build('nai-diffusion-3', { characterReferences: [ref] }).dropped.map((d) => d.path)).toContain(
            'parameters.director_reference_images',
        );
    });

    it('caps character references at 16', () => {
        const result = build('nai-diffusion-4-5-full', { characterReferences: Array.from({ length: 17 }, () => ref) });
        expect(result.body.parameters.director_reference_images).toHaveLength(16);
    });
});

describe('modes and models', () => {
    it('maps V5 Curated inpaint to the V4.5 Curated inpainting model and its capabilities', () => {
        const result = build('nai-diffusion-5-curated', {
            mode: 'inpaint',
            image: FAKE_IMAGE,
            mask: FAKE_IMAGE,
            noiseSchedule: 'exponential',
        });
        expect(result.body.model).toBe('nai-diffusion-4-5-curated-inpainting');
        expect(result.body.action).toBe('infill');
        expect(result.body.parameters.straight_alpha).toBeUndefined();
        expect(result.body.parameters.noise_schedule).toBe('exponential');
        expect(result.warnings).toContainEqual({
            code: 'inpaint-model-fallback',
            params: { model: 'nai-diffusion-4-5-curated-inpainting' },
        });
    });

    it('adds img2img strength for V4+ inpaint below full strength', () => {
        const params = build('nai-diffusion-4-5-full', {
            mode: 'inpaint',
            image: FAKE_IMAGE,
            mask: FAKE_IMAGE,
            inpaintStrength: 0.6,
        }).body.parameters;
        expect(params.img2img).toEqual({ strength: 0.6, color_correct: true });
    });

    it('V3 inpaint uses the V3 inpainting model without img2img block', () => {
        const result = build('nai-diffusion-3', {
            mode: 'inpaint',
            image: FAKE_IMAGE,
            mask: FAKE_IMAGE,
            inpaintStrength: 0.6,
            seed: 0,
        });
        expect(result.body.model).toBe('nai-diffusion-3-inpainting');
        expect(result.body.parameters.img2img).toBeUndefined();
        expect(result.body.parameters.extra_noise_seed).toBe(0);
    });

    it('rejects a mismatched capabilities object', () => {
        expect(() =>
            buildPayload({ ...defaultRequest('nai-diffusion-3'), seed: 1 }, getCapabilities('nai-diffusion-5-full')),
        ).toThrow();
    });
});

describe('normalization', () => {
    it('rounds sizes to multiples of 64 and warns', () => {
        const result = build('nai-diffusion-4-5-full', { width: 830, height: 1220 });
        expect(result.body.parameters.width).toBe(832);
        expect(result.body.parameters.height).toBe(1216);
        expect(result.warnings.map((w) => w.code)).toContain('size-rounded');
    });

    it('clamps steps and samples', () => {
        const result = build('nai-diffusion-4-5-full', { steps: 80, samples: 9 });
        expect(result.body.parameters.steps).toBe(50);
        expect(result.body.parameters.n_samples).toBe(4);
        expect(result.warnings.map((w) => w.code)).toEqual(
            expect.arrayContaining(['steps-clamped', 'samples-clamped']),
        );
    });

    it('falls back to supported presets', () => {
        const result = build('nai-diffusion-4-full', { ucPreset: 'furryFocus', qualityPreset: 'light' });
        expect(result.body.parameters.ucPresetId).toBe('heavy');
        expect(result.body.parameters.qualityPresetId).toBe('standard');
    });

    it.each([
        [{ seed: -1 }, 'invalid-seed'],
        [{ seed: 1.5 }, 'invalid-seed'],
        [{ width: 2048, height: 2048 }, 'size-too-large'],
        [{ mode: 'img2img' as const }, 'missing-image'],
        [{ mode: 'inpaint' as const, image: FAKE_IMAGE }, 'missing-mask'],
    ])('throws %o -> %s', (patch, code) => {
        try {
            build('nai-diffusion-4-5-full', patch);
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(DomainError);
            expect((error as DomainError).code).toBe(code);
        }
    });
});
