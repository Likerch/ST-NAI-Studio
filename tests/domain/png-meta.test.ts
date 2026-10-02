import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    buildNovelAIText,
    crc32,
    encodeUtf8,
    isPng,
    isWebp,
    modelFromSource,
    parseNovelAIMetadata,
    readExifUserComment,
    readPngChunks,
    readPngText,
    readWebpText,
    splitQualityTags,
    splitUcPreset,
    stripPngMetadata,
    writePngChunks,
    writePngText,
} from '../../src/domain';

const FIXTURES = path.resolve(__dirname, '../fixtures/meta');
const png = new Uint8Array(fs.readFileSync(path.join(FIXTURES, 'v45-png-meta.png')));
const webp = new Uint8Array(fs.readFileSync(path.join(FIXTURES, 'v5-multichar-exif.webp')));

describe('binary helpers', () => {
    it('crc32 matches the PNG reference value', () => {
        expect(crc32(encodeUtf8('IEND'))).toBe(0xae426082);
    });

    it('detects formats', () => {
        expect(isPng(png)).toBe(true);
        expect(isWebp(webp)).toBe(true);
        expect(isPng(webp)).toBe(false);
        expect(() => readPngChunks(webp)).toThrow();
    });
});

describe('PNG text chunks (NovelAI web client file)', () => {
    it('reads the NovelAI keywords', () => {
        const { text, compressed } = readPngText(png);
        expect(compressed).toEqual([]);
        expect(text.Software).toBe('NovelAI');
        expect(text.Source).toBe('NovelAI Diffusion V4.5 4BDE2A90');
        expect(JSON.parse(text.Comment ?? '{}').seed).toBe(1234567891);
    });

    it('writes, replaces and strips text chunks without touching pixels', () => {
        const written = writePngText(png, { Description: 'новый промпт', Extra: 'latin' });
        const { text } = readPngText(written);
        expect(text.Description).toBe('новый промпт');
        expect(text.Extra).toBe('latin');
        expect(text.Source).toBe('NovelAI Diffusion V4.5 4BDE2A90');
        const types = readPngChunks(written).map((c) => c.type);
        expect(types.at(-1)).toBe('IEND');
        expect(types.filter((t) => t === 'iTXt')).toHaveLength(1);
        const stripped = stripPngMetadata(written);
        expect(readPngText(stripped).text).toEqual({});
        const idat = (bytes: Uint8Array) => readPngChunks(bytes).find((c) => c.type === 'IDAT')?.data;
        expect(idat(stripped)).toEqual(idat(png));
    });

    it('returns compressed text for the caller to inflate', () => {
        const ztxt = { type: 'zTXt', data: new Uint8Array([...encodeUtf8('Comment'), 0, 0, 1, 2, 3]) };
        const chunks = readPngChunks(png);
        chunks.splice(chunks.length - 1, 0, ztxt);
        const bytes = writePngChunks(chunks);
        expect(readPngText(bytes).compressed).toEqual([{ keyword: 'Comment', data: new Uint8Array([1, 2, 3]) }]);
    });
});

describe('WebP EXIF (NovelAI API file)', () => {
    it('reads the JSON user comment as a text map', () => {
        const text = readWebpText(webp);
        expect(text.Source).toBe('NovelAI Diffusion V5 0ADF9AB7');
        expect(text.Software).toBe('NovelAI');
        expect(JSON.parse(text.Comment ?? '{}').seed).toBe(42424242);
    });

    it('returns nothing for a WebP without EXIF and handles other comment encodings', () => {
        const bare = new Uint8Array([...encodeUtf8('RIFF'), 4, 0, 0, 0, ...encodeUtf8('WEBP')]);
        expect(readWebpText(bare)).toEqual({});
        expect(readWebpText(png)).toEqual({});
        expect(readExifUserComment(encodeUtf8('XX'))).toBeNull();
        expect(readExifUserComment(encodeUtf8('II*\0junk {"prompt":"x"} tail'))).toBe('{"prompt":"x"}');
    });
});

describe('NovelAI parameters', () => {
    it('V4.5 PNG: strips quality tags and the UC preset, keeps every parameter', () => {
        const params = parseNovelAIMetadata(readPngText(png).text);
        expect(params).toMatchObject({
            prompt: '1girl, solo, smile, cherry blossoms, outdoors, upper body',
            negative: '',
            model: 'nai-diffusion-4-5-full',
            qualityPreset: 'standard',
            ucPreset: 'heavy',
            seed: 1234567891,
            steps: 23,
            scale: 5,
            cfgRescale: 0,
            width: 832,
            height: 1216,
            sampler: 'k_euler_ancestral',
            noiseSchedule: 'karras',
            smea: false,
            varietyBoost: false,
            useCoords: false,
            characters: [],
        });
    });

    it('V5 multi-character WebP: characters with their own UC and coordinates', () => {
        const params = parseNovelAIMetadata(readWebpText(webp));
        expect(params?.model).toBe('nai-diffusion-5-full');
        expect(params?.prompt).toBe('2girls, park, bench, daytime');
        expect(params?.useCoords).toBe(true);
        expect(params?.characters).toEqual([
            {
                prompt: 'girl, red hair, long hair, green eyes, white dress, waving',
                negative: 'blue hair',
                x: 0.3,
                y: 0.5,
            },
            {
                prompt: 'girl, black hair, short hair, glasses, school uniform, reading book',
                negative: '',
                x: 0.7,
                y: 0.5,
            },
        ]);
    });

    it('rejects non-NovelAI and broken metadata, uses the fallback model', () => {
        expect(parseNovelAIMetadata({})).toBeNull();
        expect(parseNovelAIMetadata({ Comment: 'not json' })).toBeNull();
        expect(parseNovelAIMetadata({ Comment: '{"req_type":"lineart"}' })).toBeNull();
        const params = parseNovelAIMetadata({ Comment: '{"prompt":"a, b","uc":"x"}' }, 'nai-diffusion-3');
        expect(params).toMatchObject({
            model: 'nai-diffusion-3',
            prompt: 'a, b',
            negative: 'x',
            qualityPreset: 'none',
        });
        expect(parseNovelAIMetadata({ Comment: '{"prompt":"a"}' })?.model).toBeUndefined();
    });

    it('detects the model from Source', () => {
        expect(modelFromSource('NovelAI Diffusion V5 657484A5')).toBe('nai-diffusion-5-full');
        expect(modelFromSource('NovelAI Diffusion V5 12345678')).toBe('nai-diffusion-5-curated');
        expect(modelFromSource('NovelAI Diffusion V4.5 4BDE2A90')).toBe('nai-diffusion-4-5-full');
        expect(modelFromSource('NovelAI Diffusion V4 37442FCA')).toBe('nai-diffusion-4-full');
        expect(modelFromSource('Stable Diffusion XL 7BCCAA2C')).toBe('nai-diffusion-3');
        expect(modelFromSource('Stable Diffusion XL Furry')).toBe('nai-diffusion-furry-3');
        expect(modelFromSource('Something else')).toBeUndefined();
        expect(modelFromSource(undefined)).toBeUndefined();
    });

    it('splits quality tags and UC presets per model', () => {
        expect(splitQualityTags('cat, very aesthetic, amazing quality, no text', 'nai-diffusion-5-full')).toEqual({
            prompt: 'cat',
            preset: 'light',
        });
        expect(splitQualityTags('cat, very aesthetic, masterpiece, no text | dog', 'nai-diffusion-4-5-full')).toEqual({
            prompt: 'cat| dog',
            preset: 'standard',
        });
        expect(splitQualityTags('cat', 'nai-diffusion-4-5-full')).toEqual({ prompt: 'cat', preset: 'none' });
        const light =
            'nsfw, lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page, blue hair';
        expect(splitUcPreset(light, 'nai-diffusion-4-5-full')).toEqual({ negative: 'blue hair', preset: 'light' });
        expect(splitUcPreset('only mine', 'nai-diffusion-4-5-full')).toEqual({ negative: 'only mine', preset: 'none' });
    });

    it('builds NovelAI text chunks that parse back', () => {
        const text = buildNovelAIText({
            prompt: 'cat, very aesthetic, masterpiece, no text',
            negativePrompt: 'lowres',
            model: 'nai-diffusion-4-5-full',
            seed: 7,
            width: 832,
            height: 1216,
            steps: 23,
            scale: 5,
            cfgRescale: 0,
            sampler: 'k_euler',
            noiseSchedule: 'karras',
            characters: [{ prompt: 'girl', negative: 'x', x: 0.3, y: 0.5 }],
            requestType: 'PromptGenerateRequest',
        });
        expect(text.Software).toBe('NovelAI');
        const params = parseNovelAIMetadata(text);
        expect(params).toMatchObject({ prompt: 'cat', model: 'nai-diffusion-4-5-full', seed: 7, sampler: 'k_euler' });
        expect(params?.characters).toEqual([{ prompt: 'girl', negative: 'x', x: 0.3, y: 0.5 }]);
        const v3 = buildNovelAIText({
            ...JSON.parse(JSON.stringify({ a: 1 })),
            prompt: 'p',
            negativePrompt: '',
            model: 'nai-diffusion-3',
            seed: 1,
            width: 64,
            height: 64,
            steps: 1,
            scale: 1,
            cfgRescale: 0,
            sampler: 's',
            noiseSchedule: 'n',
            characters: [],
            requestType: 'r',
        });
        expect(JSON.parse(v3.Comment ?? '{}').v4_prompt).toBeUndefined();
        expect(v3.Source).toBe('Stable Diffusion XL 7BCCAA2C');
    });
});
