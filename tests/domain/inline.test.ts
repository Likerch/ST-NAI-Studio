import { describe, expect, it } from 'vitest';
import {
    activeSwipe,
    addSwipe,
    createInlineImage,
    defaultDisplay,
    displayStyle,
    entryBlobKeys,
    findPlaceholders,
    insertPlaceholder,
    movePlaceholder,
    placeholder,
    placeholderIds,
    placeholderRuns,
    readEntries,
    reconcile,
    removePlaceholder,
    removeSwipe,
    setActiveSwipe,
    textForPrompt,
} from '../../src/domain';
import type { InlineGenerationMeta, InlineImage, InlineSwipe } from '../../src/domain';

const A = 'aaaaaaaa-1111';
const B = 'bbbbbbbb-2222';
const C = 'cccccccc-3333';

function meta(seed = 1, scenePrompt = 'a cat'): InlineGenerationMeta {
    return {
        scenePrompt,
        prompt: `${scenePrompt}, very aesthetic`,
        negativePrompt: 'lowres',
        negative: '',
        mode: 6,
        model: 'nai-diffusion-4-5-full',
        seed,
        width: 832,
        height: 1216,
        steps: 23,
        scale: 5,
        cfgRescale: 0,
        sampler: 'k_euler_ancestral',
        noiseSchedule: 'karras',
        ucPreset: 'heavy',
        qualityPreset: 'standard',
        requestType: 'txt2img',
        characters: [],
        transport: 'plugin',
        cost: 0,
        createdAt: '2026-10-02T00:00:00.000Z',
    };
}

function swipe(n: number): InlineSwipe {
    return { blobKey: `blob-${n}`, filePath: `/user/images/x/${n}.webp`, mime: 'image/webp', meta: meta(n) };
}

function entry(id: string, swipes = 1): InlineImage {
    const e = createInlineImage(id, swipe(0), defaultDisplay());
    for (let i = 1; i < swipes; i++) addSwipe(e, swipe(i));
    return e;
}

describe('placeholders', () => {
    it('formats and finds placeholders', () => {
        const text = `Hello ${placeholder(A)} and ${placeholder(B)}.`;
        expect(placeholder(A)).toBe('[nai:img:aaaaaaaa-1111]');
        expect(placeholderIds(text)).toEqual([A, B]);
        expect(findPlaceholders(text)[0]).toEqual({ id: A, index: 6, length: placeholder(A).length });
        expect(placeholderIds('[nai:img:x] [nai:img:] [img:abcdefgh]')).toEqual([]);
    });

    it('inserts at an offset with sensible spacing and never splits a placeholder', () => {
        expect(insertPlaceholder('', A)).toBe(placeholder(A));
        expect(insertPlaceholder('Hello world', A, 5)).toBe(`Hello ${placeholder(A)} world`);
        expect(insertPlaceholder('Hello world', A, 6)).toBe(`Hello ${placeholder(A)} world`);
        expect(insertPlaceholder('Hello', A)).toBe(`Hello ${placeholder(A)}`);
        expect(insertPlaceholder('Hello', A, 0)).toBe(`${placeholder(A)} Hello`);
        expect(insertPlaceholder('x(y)', A, 1)).toBe(`x ${placeholder(A)} (y)`);
        expect(insertPlaceholder('text', A, 999)).toBe(`text ${placeholder(A)}`);
        const withB = `a ${placeholder(B)} b`;
        expect(insertPlaceholder(withB, A, 5)).toBe(`a ${placeholder(B)} ${placeholder(A)} b`);
    });

    it('removes placeholders without leaving doubled or dangling spaces', () => {
        expect(removePlaceholder(`Hello ${placeholder(A)} world`, A)).toBe('Hello world');
        expect(removePlaceholder(`${placeholder(A)} Hello`, A)).toBe('Hello');
        expect(removePlaceholder(`Hello ${placeholder(A)}`, A)).toBe('Hello');
        expect(removePlaceholder(`line 1\n${placeholder(A)}\nline 2`, A)).toBe('line 1\n\nline 2');
        expect(removePlaceholder(`a${placeholder(A)}b`, A)).toBe('ab');
        expect(removePlaceholder(`keep ${placeholder(B)}`, A)).toBe(`keep ${placeholder(B)}`);
    });

    it('moves a placeholder inside a text', () => {
        const text = `${placeholder(A)} ${placeholder(B)} ${placeholder(C)}`;
        expect(placeholderIds(movePlaceholder(text, C, A))).toEqual([C, A, B]);
        expect(placeholderIds(movePlaceholder(text, A, null))).toEqual([B, C, A]);
        expect(movePlaceholder(text, A, A)).toBe(text);
        expect(movePlaceholder(text, 'zzzzzzzz', A)).toBe(text);
        expect(placeholderIds(movePlaceholder(text, A, 'missing-id'))).toEqual([B, C, A]);
    });

    it('groups runs separated only by whitespace (not by a blank line)', () => {
        const text = `Intro ${placeholder(A)} ${placeholder(B)}\n${placeholder(C)}\n\n${placeholder('dddddddd')} end`;
        expect(placeholderRuns(text)).toEqual([[A, B, C], ['dddddddd']]);
        expect(placeholderRuns(`x ${placeholder(A)} y ${placeholder(B)}`)).toEqual([[A], [B]]);
        expect(placeholderRuns('no images')).toEqual([]);
    });
});

describe('reconcile', () => {
    it('keeps matching entries, drops entries without a placeholder and orphaned placeholders', () => {
        const text = `One ${placeholder(A)} two ${placeholder(C)} three`;
        const result = reconcile(text, [entry(A), entry(B)]);
        expect(result.entries.map((e) => e.id)).toEqual([A]);
        expect(result.removedEntries.map((e) => e.id)).toEqual([B]);
        expect(result.removedPlaceholders).toEqual([C]);
        expect(result.text).toBe(`One ${placeholder(A)} two three`);
    });

    it('editing the text around placeholders keeps every image', () => {
        const before = `Old ${placeholder(A)} text ${placeholder(B)}`;
        const edited = `New *edited* ${placeholder(A)} wording, more ${placeholder(B)}!`;
        const result = reconcile(edited, [entry(A), entry(B)]);
        expect(result.removedEntries).toEqual([]);
        expect(result.text).toBe(edited);
        expect(reconcile(before, [entry(A), entry(B)]).entries).toHaveLength(2);
    });
});

describe('swipes', () => {
    it('mirrors the active swipe into the TZ fields', () => {
        const e = entry(A, 3);
        expect(e.activeSwipe).toBe(2);
        expect(e.blobKey).toBe('blob-2');
        expect(e.filePath).toBe('/user/images/x/2.webp');
        setActiveSwipe(e, -1);
        expect(e.activeSwipe).toBe(2);
        setActiveSwipe(e, 3);
        expect(e.activeSwipe).toBe(0);
        expect(activeSwipe(e)?.meta.seed).toBe(0);
        expect(entryBlobKeys(e)).toEqual(['blob-0', 'blob-1', 'blob-2']);
    });

    it('removes a swipe and keeps a valid active index; the last swipe stays', () => {
        const e = entry(A, 3);
        setActiveSwipe(e, 2);
        expect(removeSwipe(e, 0)?.blobKey).toBe('blob-0');
        expect(e.activeSwipe).toBe(1);
        expect(e.blobKey).toBe('blob-2');
        expect(removeSwipe(e, 1)?.blobKey).toBe('blob-2');
        expect(e.activeSwipe).toBe(0);
        expect(removeSwipe(e, 0)).toBeNull();
        expect(removeSwipe(e, 5)).toBeNull();
    });

    it('drops the file path mirror for a swipe without a server copy', () => {
        const e = entry(A);
        addSwipe(e, { ...swipe(9), filePath: '' });
        expect(e.filePath).toBeUndefined();
    });
});

describe('reading entries and prompt text', () => {
    it('reads extra.nai_images defensively', () => {
        expect(readEntries(undefined)).toEqual([]);
        expect(readEntries({ nai_images: 'x' })).toEqual([]);
        const good = entry(A);
        expect(readEntries({ nai_images: [good, { id: 1 }, { id: B, swipes: [] }, null] })).toEqual([good]);
    });

    it('replaces placeholders for the LLM with a description or nothing', () => {
        const e = entry(A);
        e.display.caption = 'Our picnic';
        const b = entry(B);
        const text = `We ate. ${placeholder(A)} Then ${placeholder(B)} rain ${placeholder(C)}.`;
        expect(textForPrompt(text, [e, b], 'describe')).toBe('We ate. [image: Our picnic] Then [image: a cat] rain .');
        expect(textForPrompt(text, [e, b], 'remove')).toBe('We ate. Then rain .');
        expect(textForPrompt('plain', [], 'remove')).toBe('plain');
    });
});

describe('display style', () => {
    it('computes width, alignment, wrapping and radius', () => {
        expect(displayStyle(defaultDisplay())).toEqual({
            width: '60%',
            'border-radius': '8px',
            'margin-left': 'auto',
            'margin-right': 'auto',
        });
        expect(
            displayStyle(defaultDisplay({ width: 320, widthUnit: 'px', align: 'left', wrap: true, radius: 0 })),
        ).toEqual({
            width: '320px',
            'border-radius': '0px',
            float: 'left',
            margin: '0 12px 8px 0',
        });
        expect(displayStyle(defaultDisplay({ width: 150, align: 'right' }))).toMatchObject({
            width: '100%',
            'margin-left': 'auto',
        });
        expect(displayStyle(defaultDisplay({ align: 'right', wrap: true })).float).toBe('right');
        expect(displayStyle(defaultDisplay({ align: 'left' })).float).toBeUndefined();
    });
});
