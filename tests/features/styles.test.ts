// Saved styles (v0.9.5): a style remembers the UC preset; styles saved before keep the current one.
import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import { applyStyle, styleFromSettings, styleUcPreset } from '../../src/features/generation/styles';

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
        });
    });
});
