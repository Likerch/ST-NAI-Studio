// Saved styles (v0.9.5): a style remembers the UC preset; styles saved before keep the current one.
// v0.13: per-style negatives that replace the undesired content or add to the base negative, the
// current fields as the editor's draft and the "changed" state.
import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings, StyleSettings } from '../../src/core/settings-schema';
import {
    activeStyle,
    applyStyle,
    currentNegativeMode,
    currentOwnNegative,
    setBaseNegative,
    setNegativeMode,
    setOwnNegative,
    styleChanged,
    styleFromSettings,
    styleNegative,
    styleUcPreset,
} from '../../src/features/generation/styles';

describe('styles', () => {
    it('fills the fields, makes the style active and switches the UC preset', () => {
        const s = defaultSettings();
        applyStyle(s, { name: 'Manga Ink', prefix: 'manga', suffix: 'ink', negative: 'color', ucPreset: 'light' });
        expect(s.prompts).toMatchObject({ activeStyle: 'Manga Ink', prefix: 'manga', suffix: 'ink' });
        expect(s.generation.negativePrompt).toBe('color');
        expect(s.generation.ucPreset).toBe('light');
    });

    it('keeps the current UC preset for a style without one or with an unknown one', () => {
        const s = defaultSettings();
        s.generation.ucPreset = 'heavy';
        applyStyle(s, { name: 'Old', prefix: 'a', suffix: '', negative: '' });
        expect(s.generation.ucPreset).toBe('heavy');
        applyStyle(s, { name: 'Odd', prefix: 'a', suffix: '', negative: '', ucPreset: 'ultra' });
        expect(s.generation.ucPreset).toBe('heavy');
        expect(styleUcPreset({ name: 'Odd', prefix: '', suffix: '', negative: '', ucPreset: 'ultra' })).toBeUndefined();
    });

    it('saves the current fields with the UC preset', () => {
        const s = defaultSettings();
        s.prompts.prefix = 'oil painting';
        s.generation.negativePrompt = 'anime';
        s.generation.ucPreset = 'none';
        expect(styleFromSettings(s, 'Oil')).toEqual({
            name: 'Oil',
            prefix: 'oil painting',
            suffix: '',
            negative: 'anime',
            ucPreset: 'none',
            negativeMode: 'replace',
        });
    });
});

describe('style negatives (v0.13)', () => {
    const BASE = 'lowres, bad anatomy, watermark';
    const ink: StyleSettings = {
        name: 'Ink',
        prefix: 'ink wash',
        suffix: 'monochrome',
        negative: 'color, Watermark, photo',
        ucPreset: 'light',
        negativeMode: 'append',
    };
    const oil: StyleSettings = { name: 'Oil', prefix: 'oil painting', suffix: '', negative: 'anime, sketch' };

    function withStyles(): NaiStudioSettings {
        const s = defaultSettings();
        s.prompts.baseNegative = BASE;
        s.prompts.styles = [structuredClone(ink), structuredClone(oil)];
        return s;
    }

    it('replaces the undesired content with a style without a mode (styles saved before)', () => {
        const s = withStyles();
        applyStyle(s, s.prompts.styles[1]!);
        expect(s.generation.negativePrompt).toBe('anime, sketch');
        expect(s.prompts.negativeMode).toBe('replace');
        expect(currentNegativeMode(s)).toBe('replace');
        expect(styleNegative(s, oil)).toBe('anime, sketch');
        expect(styleChanged(s)).toBe(false);
    });

    it('adds an "append" style to the base negative without repeats, in order', () => {
        const s = withStyles();
        applyStyle(s, s.prompts.styles[0]!);
        expect(s.generation.negativePrompt).toBe('lowres, bad anatomy, watermark, color, photo');
        expect(s.prompts).toMatchObject({ activeStyle: 'Ink', prefix: 'ink wash', negativeMode: 'append' });
        expect(s.generation.ucPreset).toBe('light');
        expect(activeStyle(s)?.name).toBe('Ink');
        // The style's own part as saved, not the de-duplicated one.
        expect(currentOwnNegative(s)).toBe('color, Watermark, photo');
        expect(styleChanged(s)).toBe(false);
    });

    it('follows the base negative while an "append" style is active, not with a "replace" one', () => {
        const s = withStyles();
        applyStyle(s, s.prompts.styles[0]!);
        setBaseNegative(s, 'lowres, jpeg artifacts');
        expect(s.prompts.baseNegative).toBe('lowres, jpeg artifacts');
        expect(s.generation.negativePrompt).toBe('lowres, jpeg artifacts, color, Watermark, photo');
        // The saved style gives the same with the new base: nothing to save.
        expect(styleChanged(s)).toBe(false);
        applyStyle(s, s.prompts.styles[1]!);
        setBaseNegative(s, 'blurry');
        expect(s.generation.negativePrompt).toBe('anime, sketch');
    });

    it('edits the own negative and the mode of the current fields', () => {
        const s = withStyles();
        applyStyle(s, s.prompts.styles[0]!);
        setOwnNegative(s, 'color, text');
        expect(s.generation.negativePrompt).toBe('lowres, bad anatomy, watermark, color, text');
        expect(styleChanged(s)).toBe(true);
        setNegativeMode(s, 'replace', 'color, text');
        expect(s.generation.negativePrompt).toBe('color, text');
        expect(currentNegativeMode(s)).toBe('replace');
        setNegativeMode(s, 'append');
        expect(s.generation.negativePrompt).toBe('lowres, bad anatomy, watermark, color, text');
    });

    it('saves the current fields as a style with the own part of the negative and the mode', () => {
        const s = withStyles();
        applyStyle(s, s.prompts.styles[0]!);
        // Edited on the Generate tab: the effective negative changes, the own part follows.
        s.generation.negativePrompt = 'lowres, bad anatomy, watermark, color, photo, text';
        expect(styleFromSettings(s, 'Ink 2')).toEqual({
            name: 'Ink 2',
            prefix: 'ink wash',
            suffix: 'monochrome',
            negative: 'color, photo, text',
            ucPreset: 'light',
            negativeMode: 'append',
        });
        // What the editor shows is kept when it gives the same undesired content.
        expect(styleFromSettings(s, 'Ink 3', 'Color, lowres, photo, text').negative).toBe('Color, lowres, photo, text');
        // Without an active style the fields are the common ones: the whole negative, "replace".
        s.prompts.activeStyle = '';
        expect(styleFromSettings(s, 'Plain')).toMatchObject({
            negative: 'lowres, bad anatomy, watermark, color, photo, text',
            negativeMode: 'replace',
        });
        expect(currentOwnNegative(s)).toBe(s.generation.negativePrompt);
    });

    it('is changed when a field differs from the saved style', () => {
        const fresh = () => {
            const s = withStyles();
            applyStyle(s, s.prompts.styles[0]!);
            return s;
        };
        expect(styleChanged(defaultSettings())).toBe(false);
        let s = fresh();
        s.prompts.prefix = 'ink';
        expect(styleChanged(s)).toBe(true);
        s = fresh();
        s.prompts.suffix = '';
        expect(styleChanged(s)).toBe(true);
        s = fresh();
        s.prompts.negativeMode = 'replace';
        expect(styleChanged(s)).toBe(true);
        s = fresh();
        // Spaces and case only: the same undesired content.
        s.generation.negativePrompt = 'LOWRES,bad anatomy,  watermark, color, photo';
        expect(styleChanged(s)).toBe(false);
        s.generation.negativePrompt = 'lowres, watermark, color, photo';
        expect(styleChanged(s)).toBe(true);
        s = fresh();
        s.generation.ucPreset = 'heavy';
        expect(styleChanged(s)).toBe(true);
        // A UC preset the model does not offer cannot be chosen: not a change.
        s = fresh();
        s.prompts.styles[0]!.ucPreset = 'furryFocus';
        s.generation.model = 'nai-diffusion-4-full';
        expect(styleChanged(s)).toBe(false);
        // A style without a UC preset keeps the current one.
        s = withStyles();
        applyStyle(s, s.prompts.styles[1]!);
        s.generation.ucPreset = 'none';
        expect(styleChanged(s)).toBe(false);
    });

    it('finds the active style by its exact name, else ignoring case; a deleted one is none', () => {
        const s = withStyles();
        s.prompts.activeStyle = 'ink';
        expect(activeStyle(s)?.name).toBe('Ink');
        s.prompts.activeStyle = 'Gone';
        expect(activeStyle(s)).toBeUndefined();
        expect(currentNegativeMode(s)).toBe('replace');
    });
});
