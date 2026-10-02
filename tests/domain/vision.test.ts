// Vision APIs of the multimodal modes (v0.9.1): key detection in SillyTavern's secret state and the
// model sent when none is chosen.
import { describe, expect, it } from 'vitest';
import { hasSecret, visionApi, visionModel } from '../../src/domain';

describe('vision APIs', () => {
    it('reads a saved key as a flag or a list of keys', () => {
        expect(hasSecret({ api_key_openrouter: true }, 'api_key_openrouter')).toBe(true);
        expect(hasSecret({ api_key_openrouter: [{ id: 'a' }] }, 'api_key_openrouter')).toBe(true);
        expect(hasSecret({ api_key_openai: [] }, 'api_key_openai')).toBe(false);
        expect(hasSecret({ api_key_openai: false }, 'api_key_openai')).toBe(false);
        expect(hasSecret(undefined, 'api_key_openai')).toBe(false);
    });

    it('sends the chosen model, else the API starting model', () => {
        expect(visionModel('openrouter', '')).toBe('google/gemini-2.5-flash');
        expect(visionModel('openrouter', ' openai/gpt-4o-mini ')).toBe('openai/gpt-4o-mini');
        expect(visionModel('unknown', '')).toBe('');
        expect(visionApi('anthropic')?.secret).toBe('api_key_claude');
    });
});
