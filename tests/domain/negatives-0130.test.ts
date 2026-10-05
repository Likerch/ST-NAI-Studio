// Style negatives (v0.13): replace vs append to the base negative, de-duplication that keeps the
// order and never splits weight groups, the style's own part of an effective negative, and the
// style suffix that goes before an in-image text block.
import { describe, expect, it } from 'vitest';
import {
    assemblePrompt,
    effectiveNegative,
    insertBeforeTextBlock,
    mergeNegatives,
    negativeMode,
    negativeTags,
    NEGATIVE_MODES,
    ownNegative,
    sameNegative,
    subtractNegatives,
} from '../../src/domain';

describe('negative tags', () => {
    it('splits at commas and newlines, trims and drops empty parts', () => {
        expect(negativeTags(' lowres,  bad hands ,\n\nblurry,, ')).toEqual(['lowres', 'bad hands', 'blurry']);
        expect(negativeTags('')).toEqual([]);
    });

    it('keeps brackets and weight groups whole', () => {
        expect(negativeTags('{bad hands, extra digits}, [blurry, jpeg], (a, b), c')).toEqual([
            '{bad hands, extra digits}',
            '[blurry, jpeg]',
            '(a, b)',
            'c',
        ]);
        expect(negativeTags('1.5::bad hands, missing fingers::, -1::text::, lowres')).toEqual([
            '1.5::bad hands, missing fingers::',
            '-1::text::',
            'lowres',
        ]);
        // An unclosed group runs to the end, like NovelAI reads it; a stray closing bracket is ignored.
        expect(negativeTags('a}, 2::b, c')).toEqual(['a}', '2::b, c']);
    });

    it('reads stored modes, anything unknown is "replace"', () => {
        expect(NEGATIVE_MODES).toEqual(['replace', 'append']);
        expect(negativeMode('append')).toBe('append');
        expect(negativeMode('replace')).toBe('replace');
        expect(negativeMode(undefined)).toBe('replace');
        expect(negativeMode('weird')).toBe('replace');
    });
});

describe('merging negatives', () => {
    it('drops repeated tags ignoring case and spaces, the first one wins and the order stays', () => {
        expect(mergeNegatives('lowres, bad anatomy, Text', 'blurry, text,  BAD   anatomy, watermark')).toBe(
            'lowres, bad anatomy, Text, blurry, watermark',
        );
        expect(mergeNegatives('', 'a, a, b')).toBe('a, b');
        expect(mergeNegatives('', '')).toBe('');
    });

    it('subtracts the tags of another negative', () => {
        expect(subtractNegatives('lowres, blurry, {bad hands, extra digits}, Text', 'text, LOWRES')).toBe(
            'blurry, {bad hands, extra digits}',
        );
        expect(subtractNegatives('a, b', '')).toBe('a, b');
    });

    it('compares negatives by their tags in order', () => {
        expect(sameNegative('lowres,blurry', ' LOWRES ,  blurry ')).toBe(true);
        expect(sameNegative('lowres, blurry', 'blurry, lowres')).toBe(false);
        expect(sameNegative('lowres', 'lowres, blurry')).toBe(false);
        expect(sameNegative('', ' , ')).toBe(true);
    });
});

describe('effective negative of a style', () => {
    const base = 'lowres, bad anatomy, watermark';

    it('replaces the undesired content as typed in the "replace" mode', () => {
        expect(effectiveNegative(base, 'color,  photo', 'replace')).toBe('color,  photo');
        expect(effectiveNegative(base, '', 'replace')).toBe('');
    });

    it('adds the style after the base without repeats in the "append" mode', () => {
        expect(effectiveNegative(base, 'color, Watermark, photo', 'append')).toBe(
            'lowres, bad anatomy, watermark, color, photo',
        );
        expect(effectiveNegative('', 'color', 'append')).toBe('color');
        expect(effectiveNegative(base, '', 'append')).toBe(base);
    });

    it('finds the style part of an effective negative', () => {
        const effective = 'lowres, bad anatomy, watermark, color, photo';
        // "replace": all of it.
        expect(ownNegative(effective, base, 'replace', ['x'])).toBe(effective);
        // A candidate that gives exactly this negative wins, even with tags of the base in it.
        expect(ownNegative(effective, base, 'append', [undefined, 'color, lowres, photo'])).toBe(
            'color, lowres, photo',
        );
        expect(ownNegative(effective, base, 'append', ['color'])).toBe('color, photo');
        expect(ownNegative(effective, base, 'append')).toBe('color, photo');
        // The base tags removed by hand: what is left after the base.
        expect(ownNegative('lowres, color', base, 'append', ['color'])).toBe('color');
    });
});

describe('suffix and the in-image text block', () => {
    const parts = {
        prefix: 'masterpiece',
        negative: '',
        characterPositive: '',
        characterNegative: '',
        additionalNegative: '',
        useCharacterPrefix: false,
    };

    it('puts the suffix before the text block, which must stay last', () => {
        expect(
            assemblePrompt({ ...parts, scene: 'girl holding a sign, text: OPEN', suffix: 'monochrome, ' }).prompt,
        ).toBe('masterpiece, girl holding a sign, monochrome, text: OPEN');
        expect(assemblePrompt({ ...parts, scene: 'girl', suffix: 'monochrome' }).prompt).toBe(
            'masterpiece, girl, monochrome',
        );
        expect(assemblePrompt({ ...parts, scene: 'girl, text: HI', suffix: ' ' }).prompt).toBe(
            'masterpiece, girl, text: HI',
        );
    });

    it('inserts only into the first segment', () => {
        expect(insertBeforeTextBlock('text: HELLO', 'ink')).toBe('ink, text: HELLO');
        expect(insertBeforeTextBlock('a, text: HI | b', 'ink')).toBe('a, ink, text: HI | b');
        expect(insertBeforeTextBlock('a | b, text: HI', 'ink')).toBeNull();
        expect(insertBeforeTextBlock('context: x', 'ink')).toBeNull();
    });
});
