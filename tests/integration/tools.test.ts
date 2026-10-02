// Function tool (TZ Phase 6): structured arguments become a prompt when no character is named.
import { describe, expect, it } from 'vitest';
import { toolPrompt } from '../../src/integration/tools';

describe('GenerateImage tool arguments', () => {
    it('joins the structured fields in a stable order and ignores non-strings', () => {
        expect(
            toolPrompt({ action: 'drinking tea', mood: 'calm', location: 'cafe', shot: 'upper body', prompt: 'girl' }),
        ).toBe('girl, drinking tea, calm, cafe, upper body');
        expect(toolPrompt({ prompt: '  cat  ', mood: 42, characters: ['Lyra'] })).toBe('cat');
        expect(toolPrompt({})).toBe('');
    });
});
