// Image markers in the chat model's reply (TZ Phase 7): every accepted format, loose JSON,
// figure/figcaption, streaming tails, sizes within the free limit, model aliases.
import { describe, expect, it } from 'vitest';
import {
    decodeHtmlEntities,
    findMarkers,
    limitMarkers,
    markerDimensions,
    markerModel,
    parseLooseJson,
    parseRatio,
    partialMarkerStart,
    replaceMarkers,
} from '../../src/domain';

describe('marker formats', () => {
    it('reads the NAI Studio marker with JSON in data-nai, inside a figure with a caption', () => {
        const text =
            'Intro.\n<figure class="story-img">\n<img data-nai=\'{"prompt": "a girl by the campfire", "chars": ["Lyra", {"name": "Bram", "pos": "right"}], "ratio": "landscape", "seed": 42}\'>\n<figcaption>Evening by the fire</figcaption>\n</figure>\nMore text.';
        const [m] = findMarkers(text);
        expect(m).toMatchObject({
            format: 'nai',
            params: {
                prompt: 'a girl by the campfire',
                chars: [{ name: 'Lyra' }, { name: 'Bram', pos: 'right' }],
                ratio: 'landscape',
                seed: 42,
                caption: 'Evening by the fire',
            },
        });
        expect(text.slice(m!.start, m!.end).startsWith('<figure')).toBe(true);
        expect(text.slice(m!.end)).toBe('\nMore text.');
    });

    it('survives single quotes, trailing commas, entities and broken JSON', () => {
        expect(parseLooseJson("{'prompt': 'cat', 'size': '2K',}")).toEqual({ prompt: 'cat', size: '2K' });
        expect(parseLooseJson('{&quot;prompt&quot;: &quot;dog&quot;}')).toEqual({ prompt: 'dog' });
        expect(parseLooseJson('{"prompt": "she says "hi" loudly", "ratio": "square"}')).toMatchObject({
            ratio: 'square',
        });
        expect(decodeHtmlEntities('a &amp; b &#39;c&#39; &#x41;')).toBe("a & b 'c' A");
        const [m] = findMarkers(
            `<img data-nai="{&quot;prompt&quot;:&quot;rainy street&quot;,&quot;text&quot;:&quot;OPEN&quot;}">`,
        );
        expect(m?.params).toEqual({ prompt: 'rainy street', text: 'OPEN' });
        expect(findMarkers('<img data-nai="just a plain description">')[0]?.params.prompt).toBe(
            'just a plain description',
        );
    });

    it('converts the old microservice URL, ignoring the token', () => {
        const url =
            'https://example.test/gen?token=SECRET&style=masterpiece,best_quality&prompt=1girl,white_hair,golden_eyes&ratio=portrait&size=2K&seed=7&negative=bad_hands';
        const [m] = findMarkers(
            `<figure class="story-img">\n<img src="${url}">\n<figcaption>Портрет</figcaption>\n</figure>`,
        );
        expect(m?.format).toBe('legacy-url');
        expect(m?.params).toEqual({
            prompt: '1girl, white hair, golden eyes',
            style: 'masterpiece, best quality',
            negative: 'bad hands',
            ratio: 'portrait',
            size: '2K',
            seed: 7,
            caption: 'Портрет',
        });
        expect(JSON.stringify(m)).not.toContain('SECRET');
    });

    it('reads sillyimages and Auto Illustrator markers', () => {
        const iig = findMarkers(
            `<img data-iig-instruction='{"style":"anime","prompt":"a fox","aspect_ratio":"16:9","image_size":"2K"}' src="[IMG:GEN]">`,
        )[0];
        expect(iig?.params).toEqual({ prompt: 'a fox', style: 'anime', ratio: '16:9', size: '2K' });
        const legacy = findMarkers('Text [IMG:GEN:{"prompt":"castle {old}","style":"x"}] end')[0];
        expect(legacy?.params).toMatchObject({ prompt: 'castle {old}', style: 'x' });
        const comment = findMarkers('a <!--img-prompt="1girl, \\"smile\\""--> b')[0];
        expect(comment).toMatchObject({ format: 'comment', params: { prompt: '1girl, "smile"' } });
    });

    it('leaves ordinary images and incomplete markers alone, keeps order', () => {
        expect(findMarkers('<img src="/user/images/a.png" alt="x">')).toEqual([]);
        expect(findMarkers('<img data-nai=\'{"prompt": "unfinished')).toEqual([]);
        const text = `<img data-nai='{"prompt":"one"}'> and <!--img-prompt="two"--> and <img data-nai='{"prompt":"three"}'>`;
        expect(findMarkers(text).map((m) => m.params.prompt)).toEqual(['one', 'two', 'three']);
        expect(replaceMarkers(text, findMarkers(text), (_m, i) => `[${i}]`)).toBe('[0] and [1] and [2]');
    });
});

describe('streaming', () => {
    it('finds where an unfinished marker starts', () => {
        expect(partialMarkerStart('Text <img data-nai=\'{"prompt": "a gi')).toBe(5);
        expect(partialMarkerStart('Text <figure class="story-img">\n<img data-nai=\'{}\'>')).toBe(5);
        expect(partialMarkerStart('Text <fig')).toBe(5);
        expect(partialMarkerStart('Text <!--img-prompt="x')).toBe(5);
        expect(partialMarkerStart('Text [IMG:GEN:{"prompt":"x"')).toBe(5);
        expect(partialMarkerStart('Done <img data-nai=\'{"prompt":"x"}\'> text')).toBe(-1);
        expect(partialMarkerStart('Plain text.')).toBe(-1);
    });
});

describe('sizes and models', () => {
    it('keeps 1K within the free limit and never overshoots it in free-only mode', () => {
        expect(markerDimensions('portrait', undefined, true)).toEqual({ width: 832, height: 1216 });
        expect(markerDimensions('landscape', '1K', true)).toEqual({ width: 1216, height: 832 });
        expect(markerDimensions('square', '1K', true)).toEqual({ width: 1024, height: 1024 });
        const big = markerDimensions('portrait', '2K', true);
        expect(big.width * big.height).toBeLessThanOrEqual(1048576);
        const paid = markerDimensions('portrait', '2K', false);
        expect(paid.width * paid.height).toBeGreaterThan(1048576);
        expect(paid.width * paid.height).toBeLessThanOrEqual(2097152);
        expect(markerDimensions('portrait', '1000x1000', false)).toEqual({ width: 1024, height: 1024 });
        expect(markerDimensions(undefined, '3:4', true).width % 64).toBe(0);
    });

    it('parses ratios and model aliases', () => {
        expect(parseRatio('16:9')).toEqual([16, 9]);
        expect(parseRatio('2x3')).toEqual([2, 3]);
        expect(parseRatio('nonsense')).toEqual([2, 3]);
        expect(markerModel('V5')).toBe('nai-diffusion-5-full');
        expect(markerModel('v4.5c')).toBe('nai-diffusion-4-5-curated');
        expect(markerModel('nai-diffusion-3')).toBe('nai-diffusion-3');
        expect(markerModel('dall-e')).toBeUndefined();
    });

    it('limits markers per reply', () => {
        const markers = findMarkers(
            `<img data-nai='{"prompt":"a"}'><img data-nai='{"prompt":"b"}'><img data-nai='{"prompt":"c"}'>`,
        );
        const { keep, drop } = limitMarkers(markers, 2);
        expect(keep.map((m) => m.params.prompt)).toEqual(['a', 'b']);
        expect(drop.map((m) => m.params.prompt)).toEqual(['c']);
    });
});
