import { describe, expect, it } from 'vitest';
import { isModelId } from '../../src/domain';
import {
    boolArg,
    IGNORED_ARGS,
    MODEL_ALIASES,
    parseCommandArgs,
    resolveModel,
} from '../../src/integration/command-args';

describe('boolArg', () => {
    it('anything that is not explicitly false is true (built-in semantics)', () => {
        expect(boolArg('on')).toBe(true);
        expect(boolArg('TRUE')).toBe(true);
        expect(boolArg('yes')).toBe(true);
        expect(boolArg('')).toBe(true);
        expect(boolArg('off')).toBe(false);
        expect(boolArg(' False ')).toBe(false);
        expect(boolArg(false)).toBe(false);
    });
});

describe('resolveModel', () => {
    it('accepts ids and aliases, case-insensitively', () => {
        expect(resolveModel('V4.5')).toBe('nai-diffusion-4-5-full');
        expect(resolveModel('v5-curated')).toBe('nai-diffusion-5-curated');
        expect(resolveModel('nai-diffusion-3')).toBe('nai-diffusion-3');
        expect(resolveModel('sdxl')).toBeUndefined();
    });

    it('every alias points to a known model', () => {
        for (const [alias, id] of Object.entries(MODEL_ALIASES)) expect(isModelId(id), alias).toBe(true);
    });
});

describe('parseCommandArgs', () => {
    it('returns nothing for no arguments and skips internal ones', () => {
        expect(parseCommandArgs({ _scope: {}, _abortController: {}, _parserFlags: {} })).toEqual({
            overrides: {},
            ignored: [],
            invalid: [],
        });
    });

    it('maps built-in and NovelAI arguments to overrides', () => {
        const parsed = parseCommandArgs({
            quiet: 'true',
            gallery: 'false',
            negative: 'blurry',
            extend: 'on',
            edit: 'off',
            multimodal: 'true',
            snap: 'true',
            processing: 'Minimal',
            seed: '42',
            width: '1024',
            height: '1024',
            steps: '28',
            cfg: '6',
            cfgrescale: '0.2',
            samples: '2',
            model: 'v5',
            sampler: 'k_euler',
            scheduler: 'native',
            uc: 'light',
            quality: 'none',
            smea: 'on',
            dyn: 'off',
            variety: 'false',
            decrisper: 'true',
            transparent: 'true',
        });
        expect(parsed.invalid).toEqual([]);
        expect(parsed.ignored).toEqual([]);
        expect(parsed.overrides).toEqual({
            quiet: true,
            gallery: false,
            negative: 'blurry',
            extend: true,
            edit: false,
            multimodal: true,
            snap: true,
            minimalProcessing: true,
            generation: {
                seed: 42,
                width: 1024,
                height: 1024,
                steps: 28,
                scale: 6,
                cfgRescale: 0.2,
                samples: 2,
                model: 'nai-diffusion-5-full',
                sampler: 'k_euler',
                noiseSchedule: 'native',
                ucPreset: 'light',
                qualityPreset: 'none',
                smea: true,
                smeaDyn: false,
                varietyBoost: false,
                decrisper: true,
                transparentBackground: true,
                autoSmea: false,
            },
        });
    });

    it('processing=standard turns minimal processing off', () => {
        expect(parseCommandArgs({ processing: 'standard' }).overrides).toEqual({ minimalProcessing: false });
    });

    it('collects SD-only arguments as ignored', () => {
        const args = Object.fromEntries(IGNORED_ARGS.map((name) => [name, '1']));
        const parsed = parseCommandArgs(args);
        expect(parsed.ignored).toEqual([...IGNORED_ARGS]);
        expect(parsed.overrides).toEqual({});
    });

    it('reports invalid values and leaves them out', () => {
        const parsed = parseCommandArgs({
            processing: 'weird',
            seed: 'abc',
            steps: '',
            model: 'sdxl',
            sampler: 'euler',
            uc: 'x',
            width: '832',
        });
        expect(parsed.invalid).toEqual(['processing', 'seed', 'steps', 'model', 'sampler', 'uc']);
        expect(parsed.overrides).toEqual({ generation: { width: 832 } });
    });
});
