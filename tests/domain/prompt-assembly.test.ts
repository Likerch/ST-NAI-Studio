import { describe, expect, it } from 'vitest';
import { applyFreeModeCharacter, assemblePrompt, combinePrefixes, processReply, rawLastPrompt } from '../../src/domain';

describe('combinePrefixes', () => {
    it('returns the first string untouched when the second is empty', () => {
        expect(combinePrefixes('a, b,', '')).toBe('a, b,');
    });

    it('trims spaces and edge commas and joins with ", "', () => {
        expect(combinePrefixes(' a, ', ' ,b ')).toBe('a, b');
        expect(combinePrefixes('', 'cat')).toBe('cat');
    });

    it('replaces the macro when the first string contains it', () => {
        expect(combinePrefixes('best, {prompt}, detailed', 'cat', '{prompt}')).toBe('best, cat, detailed');
        expect(combinePrefixes('best', 'cat', '{prompt}')).toBe('best, cat');
    });
});

describe('processReply', () => {
    it('returns an empty string for an empty reply', () => {
        expect(processReply('', false)).toBe('');
        expect(processReply('', true)).toBe('');
    });

    it('minimal processing only collapses whitespace', () => {
        expect(processReply('  {"a": 1}\n\n b!  ', true)).toBe('{"a": 1} b!');
    });

    it('removes leaked chat-template tokens in both modes', () => {
        const reply = '(7), <|response_mba16fe0|m195a73b0|e7f3dd91> full body portrait, Seraphina<|eot_id|>';
        expect(processReply(reply, false)).toBe('(7), full body portrait, Seraphina');
        expect(processReply(reply, true)).toBe('(7), full body portrait, Seraphina');
        expect(processReply('a | b, <lora:x>', false)).toBe('a | b, <lora:x>');
    });

    it('standard processing produces a clean tag list', () => {
        expect(processReply('"Hello", world\nfoo  bar!', false)).toBe('Hello, world, foo bar');
        expect(processReply(', , a,,b', false)).toBe('a, b');
        expect(processReply('café “quoted”', false)).toBe('cafe quoted');
        expect(processReply('(tag:1.2), [x] {y} <lora> a/b c-d e|f #g', false)).toBe(
            '(tag:1.2), [x] {y} <lora> a/b c-d e|f #g',
        );
    });
});

describe('rawLastPrompt', () => {
    it('uses the message alone without a character', () => {
        expect(rawLastPrompt('A cat.')).toBe('A cat.');
    });

    it('weights the message above scenario and description', () => {
        expect(rawLastPrompt('A cat.', { scenario: 'park', description: 'tall' })).toBe(
            '((A cat.)), (park:0.7), (tall:0.5)',
        );
        expect(rawLastPrompt('A cat.', {})).toBe('((A cat.)), (:0.7), (:0.5)');
    });
});

describe('applyFreeModeCharacter', () => {
    const character = { positive: '1girl, red hair', negative: 'bad hands' };

    it('replaces a leading "char," with the character prompt and returns its negative', () => {
        expect(applyFreeModeCharacter('char, smiling', character)).toEqual({
            prompt: '1girl, red hair, smiling',
            negative: 'bad hands',
        });
    });

    it('replaces {{charPrefix}} anywhere (same output as the built-in)', () => {
        expect(applyFreeModeCharacter('{{charPrefix}}, rain', character).prompt).toBe('1girl, red hair, rain');
        expect(applyFreeModeCharacter('char smiling', character).prompt).toBe('1girl, red hair,smiling');
    });

    it('drops the marker when the character has no prompt and leaves other text alone', () => {
        expect(applyFreeModeCharacter('char, smiling', { positive: '', negative: '' })).toEqual({
            prompt: ' smiling',
            negative: '',
        });
        expect(applyFreeModeCharacter('charming cat', character)).toEqual({ prompt: 'charming cat', negative: '' });
    });
});

describe('assemblePrompt', () => {
    const base = {
        scene: 'cat',
        prefix: 'masterpiece',
        suffix: '4k',
        negative: 'blurry',
        characterPositive: '1girl',
        characterNegative: 'bad hands',
        additionalNegative: 'text',
        useCharacterPrefix: true,
    };

    it('adds the character prompt to prefix and negative when the mode uses it', () => {
        expect(assemblePrompt(base)).toEqual({
            prompt: 'masterpiece, 1girl, cat, 4k',
            negative: 'text, blurry, bad hands',
        });
    });

    it('skips the character prompt otherwise', () => {
        expect(assemblePrompt({ ...base, useCharacterPrefix: false })).toEqual({
            prompt: 'masterpiece, cat, 4k',
            negative: 'text, blurry',
        });
    });

    it('places the scene into {prompt}', () => {
        expect(
            assemblePrompt({ ...base, prefix: 'best, {prompt}, detailed', suffix: '', useCharacterPrefix: false })
                .prompt,
        ).toBe('best, cat, detailed');
        expect(assemblePrompt({ ...base, prefix: '{prompt}, best', suffix: '' }).prompt).toBe('cat, best, 1girl');
    });

    it('handles empty parts', () => {
        expect(
            assemblePrompt({
                scene: 'cat',
                prefix: '',
                suffix: '',
                negative: '',
                characterPositive: '',
                characterNegative: '',
                additionalNegative: '',
                useCharacterPrefix: true,
            }),
        ).toEqual({ prompt: 'cat', negative: '' });
    });
});
