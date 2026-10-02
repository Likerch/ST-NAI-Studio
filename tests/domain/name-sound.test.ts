// Names across alphabets and Russian cases (v0.8): a Latin card name is found in a Russian text,
// declined forms count, words that only start alike do not.
import { describe, expect, it } from 'vitest';
import { mentionIndex, nameSound } from '../../src/domain';

describe('name sounds', () => {
    it('gives Latin and Cyrillic spellings the same sound', () => {
        expect(nameSound('Lyra')).toBe('lira');
        expect(nameSound('Лира')).toBe('lira');
        expect(nameSound('Brom')).toBe('brom');
        expect(nameSound('Бром')).toBe('brom');
        expect(nameSound('Anna')).toBe('ana');
    });

    it('finds a Latin name declined in a Russian sentence', () => {
        expect(mentionIndex('Лира и Бром идут по лесу', ['Brom'])).toBe(7);
        expect(mentionIndex('Она смотрит на Брома', ['Brom'])).toBe(15);
        expect(mentionIndex('рядом с Лирой', ['Lyra'])).toBe(8);
        expect(mentionIndex('подарок для Лиры', ['Lyra'])).toBe(12);
    });

    it('keeps whole words and exact forms', () => {
        expect(mentionIndex('anal play', ['Anna'])).toBe(-1);
        expect(mentionIndex('лирика вечера', ['Lyra'])).toBe(-1);
        expect(mentionIndex('Bob Stone smiles', ['Bob Stone'])).toBe(0);
        expect(mentionIndex('Боб и Стоун', ['Bob Stone'])).toBe(-1);
        expect(mentionIndex('Ли', ['Li'])).toBe(-1);
        expect(mentionIndex('Li', ['Li'])).toBe(0);
    });
});
