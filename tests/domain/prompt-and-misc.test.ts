import { describe, expect, it } from 'vitest';
import {
    applyDatasetPrefix,
    applyOverride,
    applyQualityTags,
    applyUcPreset,
    composePrompts,
    defaultCenter,
    defaultRequest,
    DomainError,
    fitArea,
    getCapabilities,
    getInpaintCapabilities,
    getModel,
    getQualityText,
    getUcPresetText,
    isModelId,
    maxSamplesForArea,
    MODEL_IDS,
    normalizeCharacterPrompt,
    parseOverride,
    placeOnCanvas,
    roundToStep,
} from '../../src/domain';

describe('quality tags', () => {
    const v5 = getCapabilities('nai-diffusion-5-full');
    const v3 = getCapabilities('nai-diffusion-3');

    it('appends to the first | segment only', () => {
        expect(applyQualityTags('a | b', v5, 'standard', false)).toBe('a , very aesthetic, masterpiece, no text| b');
    });

    it('inserts before an in-image text block on text models (client joins verbatim)', () => {
        expect(applyQualityTags('girl. Text: hello', v5, 'light', false)).toBe(
            'girl., very aesthetic, amazing quality, no text Text: hello',
        );
        expect(applyQualityTags('sign, text: hi', v5, 'standard', false)).toBe(
            'sign,, very aesthetic, masterpiece, no text text: hi',
        );
    });

    it('handles empty prompts and the none preset', () => {
        expect(applyQualityTags('', v3, 'standard', false)).toBe(
            'best quality, amazing quality, very aesthetic, absurdres',
        );
        expect(applyQualityTags('cat', v5, 'none', false)).toBe('cat');
        expect(applyQualityTags('cat', v5, 'none', true)).toBe('cat, transparent background');
    });

    it('knows texts for every model', () => {
        for (const id of MODEL_IDS) {
            expect(getQualityText(id, 'standard')).not.toBe('');
            expect(getUcPresetText(id, 'heavy')).not.toBe('');
        }
        expect(getQualityText('nai-diffusion-4-5-full', 'light')).toBe('very aesthetic, masterpiece, no text');
        expect(getUcPresetText('nai-diffusion-4-full', 'humanFocus')).toBe('');
    });
});

describe('UC preset', () => {
    it('V4+: preset first, nsfw prefix only for non-curated models', () => {
        const full = getCapabilities('nai-diffusion-5-full');
        const curated = getCapabilities('nai-diffusion-5-curated');
        expect(applyUcPreset('', full, 'light', 'cat')).toMatch(/^nsfw, lowres, bad hands/);
        expect(applyUcPreset('blue', curated, 'light', 'cat')).toMatch(/^lowres, bad hands.*0::ai-generated::, blue$/);
        expect(applyUcPreset('a|b', full, 'none', 'cat')).toBe('a|b');
        expect(applyUcPreset('', full, 'heavy', 'NSFW cat')).not.toMatch(/^nsfw/);
    });

    it('V3: none preset still yields "lowres" without user UC', () => {
        const v3 = getCapabilities('nai-diffusion-3');
        expect(applyUcPreset('', v3, 'none', 'cat')).toBe('lowres');
        expect(applyUcPreset('bad', v3, 'none', 'cat')).toBe('bad');
        expect(applyUcPreset('bad', v3, 'light', 'cat')).toBe(
            'nsfw, lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing, bad',
        );
    });

    it('composePrompts applies dataset prefix after quality', () => {
        const req = {
            ...defaultRequest('nai-diffusion-4-5-curated'),
            prompt: 'wolf',
            dataset: 'fur' as const,
            seed: 1,
        };
        const { prompt, negative } = composePrompts(req, getCapabilities(req.model));
        expect(prompt.startsWith('fur dataset, wolf, very aesthetic')).toBe(true);
        expect(negative.startsWith('blurry, lowres')).toBe(true);
    });
});

describe('dataset prefix and character prompts', () => {
    const caps = getCapabilities('nai-diffusion-4-5-full');
    it('adds the prefix once and only on V4+', () => {
        expect(applyDatasetPrefix('cat', caps, 'background')).toBe('background dataset, cat');
        expect(applyDatasetPrefix('fur dataset, cat', caps, 'fur')).toBe('fur dataset, cat');
        expect(applyDatasetPrefix('cat', caps, 'none')).toBe('cat');
        expect(applyDatasetPrefix('cat', getCapabilities('nai-diffusion-3'), 'fur')).toBe('cat');
    });

    it('rewrites only the first 1girl and 1boy', () => {
        expect(normalizeCharacterPrompt('1girl, 1girl, 1boy')).toBe('girl, 1girl, boy');
    });
});

describe('scene', () => {
    it('places points on the grid or freely', () => {
        expect(placeOnCanvas({ x: 0.05, y: 0.99 }, { positioning: 'grid' })).toEqual({ x: 0.1, y: 0.9 });
        expect(placeOnCanvas({ x: -1, y: 0.12345 }, { positioning: 'freeform' })).toEqual({ x: 0, y: 0.123 });
    });

    it('hands out default slots in the client order', () => {
        expect([0, 1, 2, 3, 4].map((i) => defaultCenter(i).x)).toEqual([0.5, 0.3, 0.7, 0.1, 0.9]);
        const next = defaultCenter(5);
        expect(next.y).not.toBe(0.5);
        expect(defaultCenter(100)).toBeDefined();
    });
});

describe('sizes', () => {
    it('rounds to 64 with a minimum', () => {
        expect(roundToStep(10)).toBe(64);
        expect(roundToStep(1250)).toBe(1280);
    });

    it('fits an area keeping the aspect ratio', () => {
        expect(fitArea(832, 1216, 1048576)).toEqual({ width: 832, height: 1216 });
        const fitted = fitArea(1536, 2048, 1048576);
        expect(fitted.width * fitted.height).toBeLessThanOrEqual(1048576);
        expect(fitted.width % 64).toBe(0);
        expect(fitArea(64, 64, 100)).toEqual({ width: 64, height: 64 });
        expect(fitArea(4096, 64, 65536)).toEqual({ width: 1024, height: 64 });
    });

    it('caps samples by area', () => {
        expect(maxSamplesForArea(512, 512)).toBe(8);
        expect(maxSamplesForArea(640, 640)).toBe(6);
        expect(maxSamplesForArea(832, 1216)).toBe(4);
    });
});

describe('models and capabilities', () => {
    it('resolves every model and rejects unknown ids', () => {
        for (const id of MODEL_IDS) {
            expect(getCapabilities(id).model).toBe(id);
        }
        expect(() => getModel('nope' as never)).toThrow();
        expect(isModelId('nai-diffusion-3')).toBe(true);
        expect(isModelId('nai-diffusion-5-curated-inpainting')).toBe(false);
    });

    it('matches the RECON matrix on key points', () => {
        expect(getCapabilities('nai-diffusion-5-full').maxCharacters).toBe(32);
        expect(getCapabilities('nai-diffusion-4-5-full').maxCharacters).toBe(6);
        expect(getCapabilities('nai-diffusion-3').maxCharacters).toBe(0);
        expect(getCapabilities('nai-diffusion-5-curated').promptTokenLimit).toBe(703);
        expect(getCapabilities('nai-diffusion-furry-3').defaults.scale).toBe(6.2);
        expect(getInpaintCapabilities('nai-diffusion-5-curated').model).toBe('nai-diffusion-4-5-curated');
        expect(getCapabilities('nai-diffusion-5-full').transparency).toBe(true);
        expect(getCapabilities('nai-diffusion-4-5-full').transparency).toBe(false);
    });
});

describe('raw override', () => {
    it('parses JSON objects and rejects everything else', () => {
        expect(parseOverride('  ')).toBeNull();
        expect(parseOverride('{"a":1}')).toEqual({ a: 1 });
        expect(() => parseOverride('[1]')).toThrow(DomainError);
        expect(() => parseOverride('{oops')).toThrow(DomainError);
    });

    it('deep-merges objects, replaces arrays, does not mutate the input', () => {
        const body = {
            input: 'a',
            model: 'm',
            action: 'generate' as const,
            use_new_shared_trial: true,
            parameters: {
                width: 1,
                height: 1,
                seed: 1,
                n_samples: 1,
                steps: 1,
                scale: 1,
                sampler: 's',
                negative_prompt: '',
                characterPrompts: [],
            },
        };
        const { body: merged, paths } = applyOverride(body, {
            parameters: { steps: 9, characterPrompts: [{ x: 1 }] },
            extra: { deep: true },
        });
        expect(merged.parameters.steps).toBe(9);
        expect(merged.parameters.characterPrompts).toEqual([{ x: 1 }]);
        expect(paths).toEqual(['parameters.steps', 'parameters.characterPrompts', 'extra']);
        expect(body.parameters.steps).toBe(1);
        expect(applyOverride(body, null).paths).toEqual([]);
    });
});
