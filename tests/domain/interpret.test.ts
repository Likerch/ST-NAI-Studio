// Human language → NovelAI prompt (TZ Phase 7): tag matching ladder, assembly per model family,
// when to call the LLM at all, parsing of JSON and line answers.
import { describe, expect, it } from 'vitest';
import {
    assembleInterpretation,
    buildTagIndex,
    interpretCompletion,
    interpretMessages,
    looksLikeTags,
    matchTag,
    matchTags,
    needsInterpretation,
    parseInterpretation,
    withoutNegated,
} from '../../src/domain';
import type { TagRow } from '../../src/domain';

const rows: TagRow[] = [
    ['1girl', 0, 6000000],
    ['red_hair', 0, 900000],
    ['smile', 0, 3000000],
    ['crop_top', 0, 200000],
    ['holding_book', 0, 100000],
    ['reading', 0, 150000],
    ['window', 0, 400000],
    ['rain', 0, 300000],
    ['blonde_hair', 0, 1000000, 'blonde,blond_hair'],
    ['boots', 0, 600000],
    ['apple', 0, 90000, 'red_apple'],
    ['hakurei_reimu', 4, 300000],
];
const index = buildTagIndex(rows, { 'рыжие волосы': 'red hair' });

describe('tag matching', () => {
    it('walks the ladder: exact, alias, word form, part of a phrase, fuzzy', () => {
        expect(matchTag(index, 'red_hair')).toEqual({ tag: 'red hair', kind: 'exact' });
        expect(matchTag(index, 'Blonde')).toEqual({ tag: 'blonde hair', kind: 'alias' });
        expect(matchTag(index, 'рыжие волосы')).toEqual({ tag: 'red hair', kind: 'alias' });
        expect(matchTag(index, 'smiling')).toEqual({ tag: 'smile', kind: 'form' });
        expect(matchTag(index, 'boot')).toBeNull();
        expect(matchTag(index, 'black crop top')).toEqual({ tag: 'crop top', kind: 'part', rest: 'black' });
        expect(matchTag(index, 'holdng book')).toEqual({ tag: 'holding book', kind: 'fuzzy' });
        expect(matchTag(index, 'glowing aura of doom')).toBeNull();
        expect(matchTag(index, '1.2::rain::')).toEqual({ tag: '1.2::rain::', kind: 'exact' });
        expect(matchTag(index, '3girls')).toEqual({ tag: '3girls', kind: 'exact' });
    });

    it('keeps an alias phrase that says more than its tag (red apple -> apple)', () => {
        expect(matchTag(index, 'red apple')).toEqual({ tag: 'apple', kind: 'alias' });
        expect(matchTags(index, ['red_apple', 'blonde', 'рыжие волосы'])).toEqual({
            tags: ['apple', 'blonde hair', 'red hair'],
            unmatched: ['red apple'],
        });
    });

    it('drops tags that contradict the negative, keeps real no-tags', () => {
        expect(
            withoutNegated(
                { tags: ['1girl', 'helmet', 'no humans'], unmatched: ['no helmet', 'without hat', 'cozy mood'] },
                ['helmet', 'hat'],
            ),
        ).toEqual({ tags: ['1girl', 'no humans'], unmatched: ['cozy mood'] });
    });

    it('dedupes, keeps order and reports what it could not match', () => {
        expect(matchTags(index, ['1girl', 'red hair', 'Red_Hair', 'black crop top', 'glowing aura'])).toEqual({
            tags: ['1girl', 'red hair', 'crop top'],
            unmatched: ['black crop top', 'glowing aura'],
        });
    });
});

describe('assembly per model family', () => {
    const p = { tags: [], sentence: 'a girl reads by the window', text: 'OPEN', negative: ['glasses'] };
    const m = { tags: ['1girl', 'reading', 'window'], unmatched: ['cozy mood'] };

    it('V3 gets tags only', () => {
        expect(assembleInterpretation(p, m, 'v3')).toBe('1girl, reading, window');
    });

    it('V4.5 and V5 get tags, phrases, a sentence and the text block last', () => {
        expect(assembleInterpretation(p, m, 'v4_5')).toBe(
            '1girl, reading, window, cozy mood. A girl reads by the window. Text: OPEN',
        );
        expect(assembleInterpretation({ ...p, text: '' }, m, 'v5')).toBe(
            '1girl, reading, window, cozy mood. A girl reads by the window.',
        );
        expect(assembleInterpretation({ ...p, text: '' }, { tags: [], unmatched: [] }, 'v5')).toBe(
            'A girl reads by the window.',
        );
        expect(assembleInterpretation({ ...p, sentence: '' }, { tags: ['1girl', 'sign'], unmatched: [] }, 'v4_5')).toBe(
            '1girl, sign. Text: OPEN',
        );
        expect(assembleInterpretation({ ...p, sentence: '' }, { tags: [], unmatched: [] }, 'v5')).toBe('Text: OPEN');
    });
});

describe('when to interpret', () => {
    it('recognises tag lists', () => {
        expect(looksLikeTags(index, '1girl, red hair, smile, 1.2::rain::')).toBe(true);
        expect(looksLikeTags(index, 'a girl with red hair is reading a book next to the window')).toBe(false);
        expect(looksLikeTags(index, 'девушка, smile')).toBe(false);
        expect(looksLikeTags(null, 'cat, sleeping, window')).toBe(true);
    });

    it('interprets Russian always, English prose except on V5, nothing in off mode', () => {
        const ru = 'девушка читает';
        const prose = 'a girl with red hair reading a book next to the rainy window';
        expect(needsInterpretation(ru, 'v5', 'auto', index)).toBe(true);
        expect(needsInterpretation(ru, 'v5', 'auto', index, true)).toBe(false);
        expect(needsInterpretation(ru, 'v4_5', 'auto', index, true)).toBe(true);
        expect(needsInterpretation(prose, 'v4_5', 'auto', index)).toBe(true);
        expect(needsInterpretation(prose, 'v5', 'auto', index)).toBe(false);
        expect(needsInterpretation(prose, 'v5', 'always', index)).toBe(true);
        expect(needsInterpretation('1girl, smile', 'v3', 'always', index)).toBe(false);
        expect(needsInterpretation(ru, 'v3', 'off', index)).toBe(false);
    });
});

describe('LLM answers', () => {
    it('reads JSON (also wrapped in text) and the line format', () => {
        expect(
            parseInterpretation(
                '{"tags": ["1girl", "smile"], "sentence": "She smiles.", "text": "", "negative": ["hat"]}',
            ),
        ).toEqual({
            tags: ['1girl', 'smile'],
            sentence: 'She smiles.',
            text: '',
            negative: ['hat'],
        });
        expect(parseInterpretation({ tags: 'cat, window', sentence: '', text: 'HI', negative: '' })).toEqual({
            tags: ['cat', 'window'],
            sentence: '',
            text: 'HI',
            negative: [],
        });
        expect(
            parseInterpretation(
                ' 1girl, rain, umbrella\nSentence: A girl walks in the rain.\nText:\nNegative: hat, glasses\nDescription: next',
            ),
        ).toEqual({
            tags: ['1girl', 'rain', 'umbrella'],
            sentence: 'A girl walks in the rain.',
            text: '',
            negative: ['hat', 'glasses'],
        });
        expect(parseInterpretation('I cannot help with that')).toEqual({
            tags: ['I cannot help with that'],
            sentence: '',
            text: '',
            negative: [],
        });
        expect(parseInterpretation('{"tags": [], "sentence": ""}')).toBeNull();
    });

    it('builds the chat and completion prompts with glossary terms', () => {
        const glossary = [{ from: 'сакура', to: 'cherry blossoms' }];
        const chat = interpretMessages('сакура весной', glossary);
        expect(chat.system).toContain('cherry blossoms');
        const completion = interpretCompletion('сакура\nвесной', glossary);
        expect(completion.startsWith('{ ')).toBe(true);
        expect(completion.endsWith('Description: сакура весной')).toBe(true);
        expect(completion).toContain('Tags: cherry blossoms');
    });
});
