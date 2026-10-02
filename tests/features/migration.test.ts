import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import { DEFAULT_TEMPLATES } from '../../src/domain';
import {
    BUILTIN_DEFAULT_NEGATIVE,
    BUILTIN_DEFAULT_PREFIX,
    migrateFromBuiltIn,
    SETTINGS_JSON_DEFAULT_PREFIX,
    SETTINGS_JSON_DEFAULT_TEMPLATES,
} from '../../src/features/takeover/migration';

const keys = (lines: { key: string }[]) => lines.map((l) => l.key);

describe('migrateFromBuiltIn', () => {
    it('reports nothing when there is nothing to migrate and does not mutate the input', () => {
        const current = defaultSettings();
        const snapshot = structuredClone(current);
        expect(migrateFromBuiltIn(undefined, [], current)).toEqual({ settings: snapshot, lines: [{ key: 'nothing' }] });
        expect(migrateFromBuiltIn({}, [], current).lines).toEqual([{ key: 'nothing' }]);
        expect(current).toEqual(snapshot);
    });

    it('skips the default Stable Diffusion prefix and negative', () => {
        const { settings, lines } = migrateFromBuiltIn(
            { prompt_prefix: BUILTIN_DEFAULT_PREFIX, negative_prompt: ` ${BUILTIN_DEFAULT_NEGATIVE} ` },
            [],
            defaultSettings(),
        );
        expect(keys(lines)).toEqual(['prefix-default-skipped', 'negative-default-skipped']);
        expect(settings.prompts.prefix).toBe('');
        expect(settings.generation.negativePrompt).toBe('');
    });

    it('treats the stock values of a new SillyTavern user (default/content/settings.json) as defaults', () => {
        const sd = {
            prompt_prefix: SETTINGS_JSON_DEFAULT_PREFIX,
            negative_prompt: BUILTIN_DEFAULT_NEGATIVE,
            prompts: { ...SETTINGS_JSON_DEFAULT_TEMPLATES, '4': DEFAULT_TEMPLATES['4'] },
            styles: [{ name: 'Default', prefix: SETTINGS_JSON_DEFAULT_PREFIX, negative: BUILTIN_DEFAULT_NEGATIVE }],
        };
        const { settings, lines } = migrateFromBuiltIn(sd, [], defaultSettings());
        expect(keys(lines)).toEqual(['prefix-default-skipped', 'negative-default-skipped']);
        expect(settings.prompts.templates).toEqual({});
        expect(settings.prompts.styles).toEqual([]);
    });

    it('moves a custom prefix and negative only where NAI Studio has none', () => {
        const sd = { prompt_prefix: 'anime style', negative_prompt: 'lowres' };
        const moved = migrateFromBuiltIn(sd, [], defaultSettings());
        expect(keys(moved.lines)).toEqual(['prefix-moved', 'negative-moved']);
        expect(moved.settings.prompts.prefix).toBe('anime style');
        expect(moved.settings.generation.negativePrompt).toBe('lowres');

        const current = defaultSettings();
        current.prompts.prefix = 'mine';
        current.generation.negativePrompt = 'my negative';
        const kept = migrateFromBuiltIn(sd, [], current);
        expect(keys(kept.lines)).toEqual(['prefix-kept', 'negative-kept']);
        expect(kept.settings.prompts.prefix).toBe('mine');
        expect(kept.settings.generation.negativePrompt).toBe('my negative');
    });

    it('moves styles except the untouched default and existing names, and the active style', () => {
        const current = defaultSettings();
        current.prompts.styles.push({ name: 'Existing', prefix: 'mine', suffix: '', negative: '' });
        const sd = {
            style: 'Ink',
            styles: [
                { name: 'Default', prefix: BUILTIN_DEFAULT_PREFIX, negative: BUILTIN_DEFAULT_NEGATIVE },
                { name: 'Ink', prefix: 'ink', negative: 'color' },
                { name: 'Existing', prefix: 'theirs', negative: '' },
                { name: '', prefix: 'nameless' },
                'garbage',
            ],
        };
        const { settings, lines } = migrateFromBuiltIn(sd, [], current);
        expect(lines).toEqual([{ key: 'styles-moved', params: { count: 1 } }]);
        expect(settings.prompts.styles).toEqual([
            { name: 'Existing', prefix: 'mine', suffix: '', negative: '' },
            { name: 'Ink', prefix: 'ink', suffix: '', negative: 'color' },
        ]);
        expect(settings.prompts.activeStyle).toBe('Ink');
    });

    it('moves character prompts from settings and cards; existing entries win', () => {
        const current = defaultSettings();
        current.prompts.characterPrompts.bob = { positive: 'mine', negative: '' };
        const sd = {
            character_prompts: { alice: 'red hair', bob: 'tall' },
            character_negative_prompts: { alice: 'blurry', carol: '' },
        };
        const cards = [
            { key: 'alice', positive: 'card alice', negative: '' },
            { key: 'dave', positive: 'x', negative: 'y' },
            { key: 'erin', positive: '', negative: '' },
        ];
        const { settings, lines } = migrateFromBuiltIn(sd, cards, current);
        expect(lines).toEqual([
            { key: 'character-prompts-moved', params: { count: 1 } },
            { key: 'character-prompts-kept', params: { count: 1 } },
            { key: 'card-prompts-moved', params: { count: 1 } },
        ]);
        expect(settings.prompts.characterPrompts).toEqual({
            alice: { positive: 'red hair', negative: 'blurry' },
            bob: { positive: 'mine', negative: '' },
            dave: { positive: 'x', negative: 'y' },
        });
    });

    it('takes card prompts even without built-in settings', () => {
        const { lines } = migrateFromBuiltIn(null, [{ key: 'a', positive: 'p', negative: '' }], defaultSettings());
        expect(lines).toEqual([{ key: 'card-prompts-moved', params: { count: 1 } }]);
    });

    it('moves edited templates only', () => {
        const current = defaultSettings();
        current.prompts.templates['5'] = 'my face';
        const sd = { prompts: { '0': 'custom you', '4': DEFAULT_TEMPLATES['4'], '5': 'their face', '7': '' } };
        const { settings, lines } = migrateFromBuiltIn(sd, [], current);
        expect(lines).toEqual([{ key: 'templates-moved', params: { count: 1 } }]);
        expect(settings.prompts.templates).toEqual({ '0': 'custom you', '5': 'my face' });
    });

    it('moves behaviour switches and visibility only where NAI Studio is on its default', () => {
        const current = defaultSettings();
        current.chat.visibility.command = true;
        const sd = {
            refine_mode: true,
            interactive_mode: true,
            function_tool: false,
            snap: 'yes',
            wand_visible: true,
            tool_visible: false,
            command_visible: false,
        };
        const { settings, lines } = migrateFromBuiltIn(sd, [], current);
        expect(lines).toEqual([
            { key: 'behaviour-moved', params: { names: 'refine_mode, interactive_mode, wand_visible' } },
        ]);
        expect(settings.modes.refine).toBe(true);
        expect(settings.chat.interactive).toBe(true);
        expect(settings.modes.snap).toBe(false);
        expect(settings.chat.visibility.wand).toBe(true);
        expect(settings.chat.visibility.command).toBe(true);
    });

    it('moves NovelAI generation parameters into pristine settings, clamped to NovelAI ranges', () => {
        const current = defaultSettings();
        current.generation.prompt = 'a free prompt does not count';
        const sd = {
            source: 'novel',
            model: 'nai-diffusion-3',
            sampler: 'k_euler',
            scheduler: 'native',
            steps: 60,
            scale: 12,
            width: 1000,
            height: 700,
            seed: 42,
            novel_sm: true,
            novel_sm_dyn: true,
            novel_decrisper: true,
            novel_variety_boost: false,
            novel_anlas_guard: true,
        };
        const { settings, lines } = migrateFromBuiltIn(sd, [], current);
        expect(lines).toEqual([{ key: 'generation-moved', params: { model: 'nai-diffusion-3' } }]);
        expect(settings.generation).toMatchObject({
            model: 'nai-diffusion-3',
            sampler: 'k_euler',
            noiseSchedule: 'native',
            steps: 50,
            scale: 10,
            width: 1024,
            height: 704,
            seed: 42,
            smea: true,
            smeaDyn: true,
            decrisper: true,
            varietyBoost: false,
            prompt: 'a free prompt does not count',
        });
    });

    it('ignores unknown values and keeps defaults for them', () => {
        const { settings } = migrateFromBuiltIn(
            {
                source: 'novel',
                model: 'stable-xl',
                sampler: 'euler',
                scheduler: 'linear',
                steps: 'x',
                width: 1000,
                novel_anlas_guard: true,
            },
            [],
            defaultSettings(),
        );
        const defaults = defaultSettings().generation;
        expect(settings.generation.model).toBe(defaults.model);
        expect(settings.generation.sampler).toBe(defaults.sampler);
        expect(settings.generation.noiseSchedule).toBe(defaults.noiseSchedule);
        expect(settings.generation.steps).toBe(defaults.steps);
        expect(settings.generation.width).toBe(defaults.width);
    });

    it('keeps generation settings the user already changed', () => {
        const current = defaultSettings();
        current.generation.steps = 28;
        const { settings, lines } = migrateFromBuiltIn(
            { source: 'novel', model: 'nai-diffusion-3', novel_anlas_guard: true },
            [],
            current,
        );
        expect(keys(lines)).toEqual(['generation-kept']);
        expect(settings.generation.model).toBe(defaultSettings().generation.model);
    });

    it('never turns free-only off and reports upscaling as not moved', () => {
        const { settings, lines } = migrateFromBuiltIn(
            { source: 'novel', novel_anlas_guard: false, hr_scale: 2 },
            [],
            defaultSettings(),
        );
        expect(keys(lines)).toEqual(['generation-moved', 'free-only-kept', 'upscale-not-moved']);
        expect(lines[2]?.params).toEqual({ ratio: 2 });
        expect(settings.anlas.freeOnly).toBe(true);
    });

    it('does not move generation parameters of another source', () => {
        const { settings, lines } = migrateFromBuiltIn(
            { source: 'comfy', model: 'nai-diffusion-3', steps: 10 },
            [],
            defaultSettings(),
        );
        expect(lines).toEqual([{ key: 'generation-other-source', params: { source: 'comfy' } }]);
        expect(settings.generation).toEqual(defaultSettings().generation);
    });
});
