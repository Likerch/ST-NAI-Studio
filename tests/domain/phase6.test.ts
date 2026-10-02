// Phase 6 domain: tokenizers and the token counter, V5 in-image text, weights, tags, translation,
// Expressions sprites, comic layout, scene continuity, settings export/import.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
    adjustWeight,
    applyAutoText,
    applyGlossary,
    braceLevels,
    buildPayload,
    buildSettingsExport,
    buildTagIndex,
    ByteBpeTokenizer,
    checkSettingsImport,
    ClipTokenizer,
    comicLayout,
    COMIC_LAYOUTS,
    convertWeights,
    countPromptTokens,
    currentFragment,
    detectLocation,
    EXPRESSION_DIRECTOR,
    EXPRESSION_LABELS,
    EXPRESSION_TAGS,
    getCapabilities,
    hasCyrillic,
    insertTag,
    labelFromFileName,
    locationKey,
    panelPixels,
    panelPrompt,
    panelRequestSize,
    parseTranslation,
    promptSegments,
    quotedPhrases,
    spriteFileName,
    spritePrompt,
    suggestTags,
    T5Tokenizer,
    t5UnsupportedChars,
    textBlockOf,
    tokenizerKind,
    tokenLimit,
    translationKeySource,
    translationPrompt,
    unknownTags,
    DIRECTOR_EMOTIONS,
    defaultRequest,
} from '../../src/domain';
import type { TagRow } from '../../src/domain';

describe('tokenizers', () => {
    it('byte-level BPE merges by rank and counts special tokens as one', () => {
        const bpe = new ByteBpeTokenizer({
            vocab: { a: 0, b: 1, c: 2, ab: 3, Ġ: 4, Ġab: 5, '<|x|>': 6 },
            merges: [
                ['a', 'b'],
                ['Ġ', 'ab'],
            ],
            specialTokens: ['<|x|>'],
            config: { splitRegex: ' ?\\p{L}+| ?\\p{N}+|\\s+', normalization: 'NFC' },
        });
        expect(bpe.count('ab ab')).toBe(2);
        expect(bpe.count('abc')).toBe(2);
        expect(bpe.count('<|x|>ab')).toBe(2);
        expect(bpe.count('')).toBe(0);
    });

    it('CLIP lowercases, drops braces and ends words with </w>', () => {
        const clip = new ClipTokenizer('#version: 0.2\na b</w>\na b');
        expect(clip.count('ab')).toBe(1);
        expect(clip.count('{AB} [ab]')).toBe(2);
        expect(clip.count('abc')).toBe(2);
        expect(clip.count('a&amp;b')).toBe(3);
    });

    it('T5 strips weights, adds the metaspace prefix and one </s>', () => {
        const t5 = new T5Tokenizer({
            model: {
                unk_id: 2,
                vocab: [
                    ['<pad>', 0],
                    ['</s>', 0],
                    ['<unk>', 0],
                    ['▁', -2],
                    ['▁a', -1],
                    ['b', -3],
                    ['▁ab', -1.5],
                ],
            },
        });
        expect(t5.count('ab')).toBe(2);
        expect(t5.count('')).toBe(1);
        expect(t5.count('{ab}')).toBe(2);
        expect(t5.count('1.2::ab::')).toBe(2);
        expect(t5.count('ax')).toBe(3);
        expect(t5.count('ab ab')).toBe(3);
    });

    // Optional check against the real NovelAI files (set NAIST_TOKENIZER_DIR to a folder with
    // clip/t5/qwen35 *.def). Expected numbers come from the Hugging Face `tokenizers` reference.
    const dir = process.env.NAIST_TOKENIZER_DIR;
    it.skipIf(!dir)('matches the reference counts on the real tokenizer files', () => {
        const load = (name: string) =>
            JSON.parse(zlib.inflateRawSync(fs.readFileSync(`${dir}/${name}.def`)).toString('utf8'));
        const qwen = new ByteBpeTokenizer(load('qwen35'));
        const t5 = new T5Tokenizer(load('t5'));
        const clip = new ClipTokenizer(load('clip').text);
        const prompt = '1girl, solo, long hair, red hair, school uniform, smile, looking at viewer';
        expect([qwen.count(prompt), t5.count(prompt), clip.count(prompt)]).toEqual([19, 20, 19]);
        const weighted = 'masterpiece, best quality, {{{blue eyes}}}, [[sketch]], 1.2::sunset::, -0.8::feet::';
        expect([qwen.count(weighted), t5.count(weighted), clip.count(weighted)]).toEqual([32, 14, 24]);
    });
});

describe('token counter', () => {
    const counter = { count: (text: string) => text.split(/\s+/).filter(Boolean).length };

    it('picks the tokenizer and limit of the web client', () => {
        expect(tokenizerKind('nai-diffusion-5-full')).toBe('qwen');
        expect(tokenizerKind('nai-diffusion-4-5-curated')).toBe('t5');
        expect(tokenizerKind('nai-diffusion-3')).toBe('clip');
        expect(tokenLimit('nai-diffusion-5-full')).toBe(1471);
        expect(tokenLimit('nai-diffusion-5-curated')).toBe(703);
        expect(tokenLimit('nai-diffusion-4-full')).toBe(512);
        expect(tokenLimit('nai-diffusion-furry-3')).toBe(225);
    });

    it('adds base and characters on V4+, counts the V5 text block separately', () => {
        const v45 = countPromptTokens(counter, 'nai-diffusion-4-5-full', 'a b | c', ['d e', '']);
        expect(v45).toMatchObject({ base: 3, characters: [2], total: 5, limit: 512, text: null, over: false });
        const v5 = countPromptTokens(counter, 'nai-diffusion-5-full', 'girl, text: Hello there');
        expect(v5.text).toBe(2);
        expect(v5.total).toBe(4);
    });

    it('takes the longest segment on V3 and flags the overflow', () => {
        const long = Array.from({ length: 230 }, (_, i) => `t${i}`).join(' ');
        const v3 = countPromptTokens(counter, 'nai-diffusion-3', `a b | ${long}`);
        expect(v3.segments).toEqual([2, 230]);
        expect(v3).toMatchObject({ total: 230, over: true });
    });

    it('warns about characters T5 cannot read', () => {
        expect(t5UnsupportedChars('girl, smile')).toEqual([]);
        expect(t5UnsupportedChars('девушка \u{1F600}')).toContain('\u{1F600}');
        expect(t5UnsupportedChars('да')).toEqual(['д', 'а']);
    });
});

describe('V5 in-image text (autoText)', () => {
    it('finds quoted phrases; apostrophes only open after a boundary', () => {
        expect(quotedPhrases("girl, \"Hello!\" and “Bye”, girl's hat, 'ok'")).toEqual(['Hello!', 'Bye', 'ok']);
        expect(quotedPhrases('unclosed "quote')).toEqual([]);
    });

    it('appends teXt: with base phrases first, characters in reading order', () => {
        const chars = [
            { prompt: 'boy, "Right"', center: { x: 0.9, y: 0.5 } },
            { prompt: 'girl, "Left"', center: { x: 0.1, y: 0.5 } },
        ];
        expect(applyAutoText('sign "OPEN", street,', chars, true)).toBe(
            'sign "OPEN", street, teXt: OPEN\n\nLeft\n\nRight',
        );
        expect(applyAutoText('sign "OPEN"', chars, false)).toBe('sign "OPEN", teXt: OPEN\n\nRight\n\nLeft');
        expect(applyAutoText('a | b "x"', [], false)).toBe('a | b "x"');
        expect(applyAutoText('text: manual, "x"', [], false)).toBe('text: manual, "x"');
    });

    it('keeps random choices intact when splitting segments', () => {
        expect(promptSegments('a ||b|c|| d | e')).toEqual(['a ||b|c|| d ', ' e']);
        expect(textBlockOf('girl, text: Hi | other')).toBe('Hi');
        expect(textBlockOf('girl')).toBeNull();
    });

    it('goes into the V5 request before the quality tags, not into V4.5', () => {
        const req = { ...defaultRequest('nai-diffusion-5-full'), prompt: 'cafe sign "OPEN"' };
        const v5 = buildPayload(req, getCapabilities('nai-diffusion-5-full'));
        expect(v5.body.input).toMatch(/^cafe sign "OPEN", .*teXt: OPEN$/);
        const off = buildPayload({ ...req, autoText: false }, getCapabilities('nai-diffusion-5-full'));
        expect(off.body.input).not.toContain('teXt:');
        const v45req = { ...defaultRequest('nai-diffusion-4-5-full'), prompt: 'cafe sign "OPEN"' };
        expect(buildPayload(v45req, getCapabilities('nai-diffusion-4-5-full')).body.input).not.toContain('teXt:');
    });
});

describe('weights', () => {
    it('converts numeric weights to braces for V3 and reports what cannot be expressed', () => {
        expect(braceLevels(1.2)).toBe(4);
        expect(braceLevels(0.9)).toBe(-2);
        const result = convertWeights('cat, 1.1::red hair::, 0.9::hat::, -1::feet::, 0::blur::, dog', false);
        expect(result.text).toBe('cat, {{red hair}}, [[hat]], dog');
        expect(result.lossy).toEqual(['-1::feet', '0::blur']);
        expect(convertWeights('1.2::a::', true)).toEqual({ text: '1.2::a::', lossy: [], changed: false });
    });

    it('raises and lowers the tag under the cursor in the model syntax', () => {
        const up = adjustWeight('cat, red hair, dog', 7, 7, 1, true);
        expect(up.text).toBe('cat, 1.05::red hair::, dog');
        const again = adjustWeight(up.text, up.start, up.end, 1, true);
        expect(again.text).toBe('cat, 1.1::red hair::, dog');
        const back = adjustWeight(adjustWeight(again.text, again.start, again.end, -1, true).text, 12, 12, -1, true);
        expect(back.text).toBe('cat, red hair, dog');
        const v3 = adjustWeight('cat, red hair', 6, 6, 1, false);
        expect(v3.text).toBe('cat, {red hair}');
        expect(adjustWeight(v3.text, v3.start, v3.end, -1, false).text).toBe('cat, red hair');
        expect(adjustWeight('cat, [hat]', 7, 7, 1, false).text).toBe('cat, hat');
    });
});

describe('tags', () => {
    const rows: TagRow[] = [
        ['1girl', 0, 6000000, '1girls,sole_female'],
        ['long_hair', 0, 4000000, '/lh,longhair'],
        ['red_hair', 0, 900000],
        ['hair_ribbon', 0, 500000],
        ['^_^', 0, 40000],
        ['hakurei_reimu', 4, 300000, 'reimu'],
    ];
    const ru = { девушка: '1girl', 'рыжие волосы': 'red hair' };
    const index = buildTagIndex(rows, ru);

    it('suggests by name, alias and Russian word, most used first', () => {
        expect(suggestTags(index, 'hai').map((s) => s.entry.name)).toEqual(['hair ribbon', 'long hair', 'red hair']);
        expect(suggestTags(index, 'longh')[0]).toMatchObject({ entry: { name: 'long hair' }, via: 'longhair' });
        expect(suggestTags(index, 'дев')[0]?.entry.name).toBe('1girl');
        expect(suggestTags(index, 'r')).toEqual([]);
        expect(index.byName.has('^_^')).toBe(true);
    });

    it('finds the fragment at the cursor and inserts a tag', () => {
        expect(currentFragment('cat, {lon', 9)).toEqual({ start: 6, fragment: 'lon' });
        expect(currentFragment('1.2::red h', 10)).toEqual({ start: 5, fragment: 'red h' });
        expect(insertTag('cat, lon', 5, 8, 'long hair')).toEqual({ text: 'cat, long hair, ', cursor: 16 });
        expect(insertTag('cat, lon, dog', 5, 8, 'long hair')).toEqual({ text: 'cat, long hair, dog', cursor: 14 });
    });

    it('reports unknown tags but not sentences, prefixes, counts or text blocks', () => {
        const prompt =
            '1girl, {long hair}, 1.1::reimu::, blorptag, artist:someone, 3girls, a girl walking in the rain, text: Hello';
        expect(unknownTags(index, prompt)).toEqual(['blorptag']);
    });
});

describe('translation', () => {
    const glossary = [
        { from: 'рыжие волосы', to: 'red hair' },
        { from: 'волосы', to: 'hair' },
    ];

    it('detects Cyrillic and applies the glossary longest-first, whole words only', () => {
        expect(hasCyrillic('girl')).toBe(false);
        expect(hasCyrillic('девушка')).toBe(true);
        expect(applyGlossary('Рыжие волосы, волосынки', glossary)).toBe('red hair, волосынки');
    });

    it('builds the instruction with the glossary terms that occur in the text', () => {
        const p = translationPrompt('рыжие волосы', glossary);
        expect(p.system).toContain('red hair');
        expect(p.prompt).toContain('рыжие');
    });

    it('reads the answer from JSON, fenced JSON, an object or a loose field', () => {
        expect(parseTranslation('{"prompt": "red hair, smile"}')).toBe('red hair, smile');
        expect(parseTranslation('```json\n{"prompt":"cat"}\n```')).toBe('cat');
        expect(parseTranslation('Sure! {"prompt": "dog"} hope it helps')).toBe('dog');
        expect(parseTranslation({ prompt: ' sky ' })).toBe('sky');
        expect(parseTranslation('"prompt": "a \\"b\\""')).toBe('a "b"');
        expect(parseTranslation('nothing')).toBeNull();
    });

    it('keys the cache by text and glossary', () => {
        expect(translationKeySource('x', glossary)).not.toBe(translationKeySource('x', []));
        expect(translationKeySource(' x ', [])).toBe(translationKeySource('x', []));
    });
});

describe('Expressions sprites', () => {
    it('covers the 28 default labels with tags; Director emotions exist', () => {
        expect(EXPRESSION_LABELS).toHaveLength(28);
        for (const label of EXPRESSION_LABELS) expect(EXPRESSION_TAGS[label]).toBeTruthy();
        for (const emotion of Object.values(EXPRESSION_DIRECTOR)) expect(DIRECTOR_EMOTIONS).toContain(emotion);
    });

    it('names files so Expressions reads the label back', () => {
        for (const label of EXPRESSION_LABELS) expect(labelFromFileName(spriteFileName(label))).toBe(label);
        expect(spriteFileName('Happy-Face')).toBe('happyface.png');
    });

    it('builds the sprite prompt from appearance, emotion and framing', () => {
        expect(spritePrompt('1girl, red hair,', 'joy')).toBe(
            `1girl, red hair, ${EXPRESSION_TAGS.joy}, solo, upper body, looking at viewer, simple background`,
        );
        expect(spritePrompt('1girl', 'smirk_custom')).toContain('smirk custom');
    });
});

describe('comic', () => {
    it('lays out panels with gutters inside the page', () => {
        const rects = panelPixels(comicLayout('grid-4'), { width: 1000, height: 1500 }, 20);
        expect(rects).toHaveLength(4);
        expect(rects[0]).toEqual({ x: 20, y: 20, width: 470, height: 720 });
        expect(rects[3]).toEqual({ x: 510, y: 760, width: 470, height: 720 });
        expect(comicLayout('nope').id).toBe('grid-4');
        for (const layout of COMIC_LAYOUTS) {
            const area = layout.panels.reduce((s, p) => s + p.w * p.h, 0);
            expect(area).toBeCloseTo(1, 5);
        }
    });

    it('sizes panel requests to the panel aspect within 1 MP, multiples of 64', () => {
        const wide = panelRequestSize({ width: 960, height: 360 });
        expect(wide.width % 64).toBe(0);
        expect(wide.height % 64).toBe(0);
        expect(wide.width * wide.height).toBeLessThanOrEqual(1048576);
        expect(wide.width / wide.height).toBeGreaterThan(2);
    });

    it('puts the text block last in the panel prompt', () => {
        expect(panelPrompt('comic, manga style', { prompt: 'girl waves,', text: ['Hi!', ' ', 'Bye'] })).toBe(
            'comic, manga style, girl waves, text: Hi!\n\nBye',
        );
        expect(panelPrompt('', { prompt: 'cat', text: [] })).toBe('cat');
    });
});

describe('continuity', () => {
    it('normalizes keys and finds the longest known location in the text', () => {
        expect(locationKey('  Old   Tavern ')).toBe('old tavern');
        expect(detectLocation('They enter the old tavern at night', ['tavern', 'old tavern', 'forest'])).toBe(
            'old tavern',
        );
        expect(detectLocation('a tavernkeeper', ['tavern'])).toBeNull();
    });
});

describe('settings export / import', () => {
    it('round-trips settings and vibe images and refuses newer schemas', () => {
        const exported = buildSettingsExport(
            { a: 1, nested: { b: [1, 2] } },
            6,
            '0.6.0',
            { 'vibe:1': 'AAA' },
            new Date(0),
        );
        const text = JSON.stringify(exported);
        const check = checkSettingsImport(text, 6);
        expect(check).toEqual({
            ok: true,
            schemaVersion: 6,
            settings: { a: 1, nested: { b: [1, 2] }, schemaVersion: 6 },
            images: { 'vibe:1': 'AAA' },
        });
        expect(checkSettingsImport(text, 5)).toEqual({ ok: false, reason: 'newer-schema', schemaVersion: 6 });
        expect(checkSettingsImport('{', 6)).toEqual({ ok: false, reason: 'not-json' });
        expect(checkSettingsImport('{"format":"x"}', 6)).toEqual({ ok: false, reason: 'wrong-format' });
        expect(checkSettingsImport('{"format":"nai-studio-settings","schemaVersion":0,"settings":{}}', 6)).toEqual({
            ok: false,
            reason: 'invalid',
        });
        const foreign = checkSettingsImport(
            JSON.stringify({ ...exported, images: { 'img:x': 'B', 'vibethumb:1': 'C' } }),
            6,
        );
        expect(foreign.ok && foreign.images).toEqual({ 'vibethumb:1': 'C' });
    });
});

describe('tag index with NovelAI tags', () => {
    it('knows NovelAI quality tags and Russian alias targets that are not Danbooru tags', () => {
        const index = buildTagIndex([['1girl', 0, 10]], { 'x-ru': 'my_custom_tag' });
        expect(
            unknownTags(index, 'masterpiece, best quality, very aesthetic, year 2024, my custom tag, 1girl'),
        ).toEqual([]);
    });
});

describe('translation for text completion APIs', () => {
    it('builds a few-shot continuation and reads the first line of the answer', async () => {
        const { completionPrompt, parseCompletion, needsTranslation, withoutTextBlocks } =
            await import('../../src/domain');
        const prompt = completionPrompt(
            '\u0434\u0435\u0432\u0443\u0448\u043a\u0430\n\u0441 \u043a\u043e\u0442\u043e\u043c',
            [],
        );
        expect(
            prompt.endsWith(
                'Russian: \u0434\u0435\u0432\u0443\u0448\u043a\u0430 \u0441 \u043a\u043e\u0442\u043e\u043c',
            ),
        ).toBe(true);
        expect(prompt.startsWith('{ ')).toBe(true);
        expect(prompt.split('\nEnglish: ').length).toBeGreaterThan(3);
        expect(parseCompletion(' 1girl, cat, holding cat\nRussian: next')).toBe('1girl, cat, holding cat');
        expect(parseCompletion('English: "1girl"')).toBe('1girl');
        expect(parseCompletion('{"prompt": "dog"}')).toBe('dog');
        expect(parseCompletion('\n\n')).toBeNull();
        expect(needsTranslation('girl, text: \u041f\u0440\u0438\u0432\u0435\u0442')).toBe(false);
        expect(needsTranslation('\u0434\u0435\u0432\u0443\u0448\u043a\u0430, text: Hi')).toBe(true);
        expect(withoutTextBlocks('a, text: x | b')).toBe('a, | b');
        const { looksLikeChatter } = await import('../../src/domain');
        expect(looksLikeChatter('I would like to request an English translation', 'x')).toBe(true);
        expect(looksLikeChatter('1girl, red hair', 'x')).toBe(false);
    });
});
