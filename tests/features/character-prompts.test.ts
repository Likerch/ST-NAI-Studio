import { afterEach, describe, expect, it } from 'vitest';
import { settings } from '../../src/core/settings';
import { avatarKey, readCharacterPrompt } from '../../src/features/characters/character-prompts';

function character(extensions: Record<string, unknown> = {}): STCharacter {
    return { name: 'Alice', avatar: 'alice.png', data: { extensions } } as unknown as STCharacter;
}

afterEach(() => {
    settings().prompts.characterPrompts = {};
});

describe('readCharacterPrompt', () => {
    it('uses the avatar file name without extension as the key', () => {
        expect(avatarKey('alice.png')).toBe('alice');
        expect(avatarKey('my.char.webp')).toBe('my.char');
        expect(avatarKey(undefined)).toBe('');
    });

    it('returns empty values for no character or no prompt', () => {
        expect(readCharacterPrompt(undefined)).toEqual({ positive: '', negative: '', shared: false });
        expect(readCharacterPrompt(character())).toEqual({ positive: '', negative: '', shared: false });
    });

    it('reads a card shared by the built-in, but does not treat it as ours', () => {
        const card = character({ sd_character_prompt: { positive: 'red hair', negative: 'blurry' } });
        expect(readCharacterPrompt(card)).toEqual({ positive: 'red hair', negative: 'blurry', shared: false });
    });

    it('prefers our card field over the built-in one', () => {
        const card = character({
            nai_studio: { characterPrompt: { positive: 'ours', negative: '' } },
            sd_character_prompt: { positive: 'theirs', negative: 'theirs-neg' },
        });
        expect(readCharacterPrompt(card)).toEqual({ positive: 'ours', negative: '', shared: true });
    });

    it('local values win over the card, empty local values fall back to it', () => {
        settings().prompts.characterPrompts.alice = { positive: 'local', negative: '' };
        const card = character({ nai_studio: { characterPrompt: { positive: 'card', negative: 'card-neg' } } });
        expect(readCharacterPrompt(card)).toEqual({ positive: 'local', negative: 'card-neg', shared: true });
    });

    it('a null card field (sharing turned off) counts as not shared', () => {
        const card = character({ nai_studio: { characterPrompt: null }, sd_character_prompt: null });
        expect(readCharacterPrompt(card)).toEqual({ positive: '', negative: '', shared: false });
    });
});
