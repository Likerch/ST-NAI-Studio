// Marker helpers (TZ Phase 7): character positions, the generation identity that survives a
// growing marker, display options, the reply excerpt for auto illustrations and the instruction.
import { describe, expect, it } from 'vitest';
import {
    findMarkers,
    MARKER_TEMPLATES,
    markerDisplay,
    markerGenerationKey,
    markerInstruction,
    markerPosition,
    replyExcerpt,
} from '../../src/domain';

describe('markerPosition', () => {
    it('reads the NovelAI grid, words and coordinates', () => {
        expect(markerPosition('C3')).toEqual({ x: 0.5, y: 0.5 });
        expect(markerPosition('a1')).toEqual({ x: 0.1, y: 0.1 });
        expect(markerPosition('E5')).toEqual({ x: 0.9, y: 0.9 });
        expect(markerPosition('left')).toEqual({ x: 0.3, y: 0.5 });
        expect(markerPosition('far-right')).toEqual({ x: 0.9, y: 0.5 });
        expect(markerPosition('top left')).toEqual({ x: 0.3, y: 0.3 });
        expect(markerPosition('bottom center')).toEqual({ x: 0.5, y: 0.7 });
        expect(markerPosition('0.2, 0.8')).toEqual({ x: 0.2, y: 0.8 });
        expect(markerPosition('somewhere')).toBeNull();
        expect(markerPosition('leftish')).toBeNull();
        expect(markerPosition(undefined)).toBeNull();
    });
});

describe('markerGenerationKey', () => {
    it('ignores display-only parameters, so a caption arriving later starts no second generation', () => {
        const streaming = '<figure><img data-nai=\'{"prompt": "a cat", "ratio": "square"}\'>';
        const finished = `${streaming}<figcaption>Our cat</figcaption></figure>`;
        const [early] = findMarkers(streaming);
        const [late] = findMarkers(finished);
        expect(late!.params.caption).toBe('Our cat');
        expect(markerGenerationKey(early!.params)).toBe(markerGenerationKey(late!.params));
        expect(markerGenerationKey({ prompt: 'a cat', seed: 1 })).not.toBe(
            markerGenerationKey({ prompt: 'a cat', seed: 2 }),
        );
    });
});

describe('markerDisplay', () => {
    it('maps caption, spoiler, alignment and width', () => {
        expect(markerDisplay({ prompt: 'p', caption: 'C', spoiler: true, align: 'Right', width: 40 })).toEqual({
            caption: 'C',
            alt: 'C',
            spoiler: true,
            align: 'right',
            width: 40,
            widthUnit: '%',
        });
        expect(markerDisplay({ prompt: 'a long prompt', width: 512, align: 'middle' })).toEqual({
            alt: 'a long prompt',
            width: 512,
            widthUnit: 'px',
        });
    });
});

describe('replyExcerpt', () => {
    it('drops HTML, markers, placeholders and markdown, and cuts at a sentence', () => {
        const text =
            '<div class="x">*She smiles.*</div> [nai:img:abc] <img data-nai=\'{"prompt":"q"}\'> The rain stops. <style>p{}</style>';
        expect(replyExcerpt(text)).toBe('She smiles. The rain stops.');
        const long = `${'Word '.repeat(30)}end. ${'More '.repeat(30)}`;
        expect(replyExcerpt(long, 200)).toBe(`${'Word '.repeat(30)}end.`.trim());
    });
});

describe('markerInstruction', () => {
    const vars = { min: 1, max: 3, captionLanguage: 'Russian', chars: ['Alice', ' Bob '] };

    it('fills the standard texts with the limits, caption language and known characters', () => {
        const natural = markerInstruction('natural', '', vars);
        expect(natural).toContain('Use 1 to 3 pictures per reply.');
        expect(natural).toContain('in Russian');
        expect(natural).toContain('(known characters: Alice, Bob)');
        expect(natural).toContain(`<img data-nai='{"prompt"`);
        expect(natural).not.toContain('{{');
        expect(markerInstruction('tags', '', { ...vars, chars: [] })).toContain('Danbooru-style tags');
        expect(markerInstruction('tags', '', { ...vars, chars: [] })).not.toContain('known characters');
    });

    it('words the count for zero, one and fixed limits', () => {
        expect(markerInstruction('natural', '', { ...vars, min: 0, max: 1 })).toContain(
            'Use at most 1 picture per reply, none when nothing fits.',
        );
        expect(markerInstruction('natural', '', { ...vars, min: 2, max: 2 })).toContain(
            'Use exactly 2 pictures per reply.',
        );
        expect(markerInstruction('natural', '', { ...vars, min: 0, max: 0 })).toContain('Do not add pictures.');
    });

    it('uses a custom text with variables, an empty one falls back', () => {
        expect(markerInstruction('custom', 'Max {{max}} for {{chars}}; {{unknown}}', vars)).toBe(
            'Max 3 for Alice, Bob; {{unknown}}',
        );
        expect(markerInstruction('custom', '  ', vars)).toBe(markerInstruction('natural', '', vars));
        expect(MARKER_TEMPLATES.natural).toContain('{{count}}');
    });
});
