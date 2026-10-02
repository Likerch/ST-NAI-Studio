import { describe, expect, it } from 'vitest';
import {
    DEFAULT_TEMPLATES,
    isMultimodal,
    matchInteractiveTrigger,
    MODE,
    modeDimensions,
    quietPromptFor,
    resolveMode,
    TEMPLATE_MODES,
    TRIGGER_WORDS,
    usesCharacterPrefix,
    WAND_MODES,
    textModeOf,
} from '../../src/domain';

const plain = { multimodal: false, freeExtend: false };

describe('mode ids', () => {
    it('match the built-in generationMode numbers (media generation_type compatibility)', () => {
        expect(MODE).toEqual({
            TOOL: -2,
            MESSAGE: -1,
            CHARACTER: 0,
            USER: 1,
            SCENARIO: 2,
            RAW_LAST: 3,
            NOW: 4,
            FACE: 5,
            FREE: 6,
            BACKGROUND: 7,
            CHARACTER_MULTIMODAL: 8,
            USER_MULTIMODAL: 9,
            FACE_MULTIMODAL: 10,
            FREE_EXTENDED: 11,
        });
    });

    it('every template mode has a default template and FREE has none', () => {
        for (const mode of TEMPLATE_MODES) expect(DEFAULT_TEMPLATES[String(mode)], String(mode)).toBeTruthy();
        expect(TEMPLATE_MODES).not.toContain(MODE.FREE);
        expect(DEFAULT_TEMPLATES[String(MODE.FREE)]).toBeUndefined();
    });

    it('every wand mode has a trigger word', () => {
        for (const mode of WAND_MODES) expect(TRIGGER_WORDS[mode], String(mode)).toBeTruthy();
    });
});

describe('resolveMode', () => {
    it('maps trigger words case-insensitively, everything else is free', () => {
        expect(resolveMode('you', plain)).toBe(MODE.CHARACTER);
        expect(resolveMode(' YOU ', plain)).toBe(MODE.CHARACTER);
        expect(resolveMode('me', plain)).toBe(MODE.USER);
        expect(resolveMode('scene', plain)).toBe(MODE.SCENARIO);
        expect(resolveMode('raw_last', plain)).toBe(MODE.RAW_LAST);
        expect(resolveMode('last', plain)).toBe(MODE.NOW);
        expect(resolveMode('face', plain)).toBe(MODE.FACE);
        expect(resolveMode('background', plain)).toBe(MODE.BACKGROUND);
        expect(resolveMode('a cat on a roof', plain)).toBe(MODE.FREE);
        expect(resolveMode('you and me', plain)).toBe(MODE.FREE);
    });

    it('switches avatar modes to multimodal variants', () => {
        const options = { multimodal: true, freeExtend: false };
        expect(resolveMode('you', options)).toBe(MODE.CHARACTER_MULTIMODAL);
        expect(resolveMode('me', options)).toBe(MODE.USER_MULTIMODAL);
        expect(resolveMode('face', options)).toBe(MODE.FACE_MULTIMODAL);
        expect(resolveMode('scene', options)).toBe(MODE.SCENARIO);
    });

    it('extends only free prompts', () => {
        const options = { multimodal: false, freeExtend: true };
        expect(resolveMode('a cat', options)).toBe(MODE.FREE_EXTENDED);
        expect(resolveMode('you', options)).toBe(MODE.CHARACTER);
    });

    it('isMultimodal', () => {
        expect([8, 9, 10].every((m) => isMultimodal(m as 8 | 9 | 10))).toBe(true);
        expect(isMultimodal(MODE.CHARACTER)).toBe(false);
        expect(isMultimodal(MODE.FREE_EXTENDED)).toBe(false);
    });
});

describe('matchInteractiveTrigger', () => {
    it('returns null when no picture is requested', () => {
        expect(matchInteractiveTrigger('hello there')).toBeNull();
        expect(matchInteractiveTrigger('I like this picture')).toBeNull();
    });

    it('maps special phrases to trigger words', () => {
        expect(matchInteractiveTrigger('Send me a picture of you')).toBe('you');
        expect(matchInteractiveTrigger('draw a picture of yourself')).toBe('you');
        expect(matchInteractiveTrigger('show me a pic of me')).toBe('me');
        expect(matchInteractiveTrigger('send me a picture of your face')).toBe('face');
        expect(matchInteractiveTrigger('Take a selfie? No — send me a photo of a selfie')).toBe('face');
        expect(matchInteractiveTrigger('generate an image of the scene')).toBe('background');
        expect(matchInteractiveTrigger('show me a pic of the whole story')).toBe('scene');
        expect(matchInteractiveTrigger('make a drawing of the last message')).toBe('last');
    });

    it('returns the free subject otherwise', () => {
        expect(matchInteractiveTrigger('Can you show me a photo of the beach at night?')).toBe('beach at night?');
    });
});

describe('usesCharacterPrefix', () => {
    it('skips the character prefix for free, background and user modes', () => {
        expect(usesCharacterPrefix(MODE.FREE, false, true)).toBe(false);
        expect(usesCharacterPrefix(MODE.FREE_EXTENDED, false, true)).toBe(false);
        expect(usesCharacterPrefix(MODE.BACKGROUND, false, true)).toBe(false);
        expect(usesCharacterPrefix(MODE.USER, false, true)).toBe(false);
        expect(usesCharacterPrefix(MODE.USER_MULTIMODAL, false, true)).toBe(false);
        expect(usesCharacterPrefix(MODE.CHARACTER, false, false)).toBe(true);
        expect(usesCharacterPrefix(MODE.NOW, false, false)).toBe(true);
    });

    it('always uses it for image swipes in 1:1 chats', () => {
        expect(usesCharacterPrefix(MODE.FREE, true, true)).toBe(true);
        expect(usesCharacterPrefix(MODE.FREE, true, false)).toBe(false);
    });
});

describe('modeDimensions', () => {
    it('forces portrait for faces and landscape for backgrounds', () => {
        expect(modeDimensions(MODE.FACE, 1024, 1024, false)).toEqual({ width: 1024, height: 1536 });
        expect(modeDimensions(MODE.FACE_MULTIMODAL, 1216, 832, false)).toEqual({ width: 1216, height: 1856 });
        expect(modeDimensions(MODE.FACE, 832, 1216, false)).toEqual({ width: 832, height: 1216 });
        expect(modeDimensions(MODE.BACKGROUND, 832, 1216, false)).toEqual({ width: 2176, height: 1216 });
        expect(modeDimensions(MODE.BACKGROUND, 1216, 832, false)).toEqual({ width: 1216, height: 832 });
        expect(modeDimensions(MODE.NOW, 1024, 1024, false)).toEqual({ width: 1024, height: 1024 });
    });

    it('snap keeps the pixel count and picks the closest preset', () => {
        expect(modeDimensions(MODE.FACE, 1024, 1024, true)).toEqual({ width: 832, height: 1280 });
        const presets = [
            { width: 832, height: 1216 },
            { width: 1024, height: 1024 },
            { width: 1216, height: 832 },
        ];
        expect(modeDimensions(MODE.FACE, 1024, 1024, true, presets)).toEqual({ width: 832, height: 1216 });
        expect(modeDimensions(MODE.BACKGROUND, 832, 1216, true, presets)).toEqual({ width: 1216, height: 832 });
        expect(modeDimensions(MODE.NOW, 832, 1216, true, presets)).toEqual({ width: 832, height: 1216 });
    });
});

describe('quietPromptFor', () => {
    it('free mode returns the trigger itself', () => {
        expect(quietPromptFor(MODE.FREE, 'a cat', {})).toBe('a cat');
    });

    it('uses overrides first, then defaults, and fills {0}', () => {
        expect(quietPromptFor(MODE.FREE_EXTENDED, 'a cat', {})).toContain('"a cat"');
        expect(quietPromptFor(MODE.CHARACTER, 'you', { '0': 'X {0} {0}' })).toBe('X you you');
        expect(quietPromptFor(MODE.CHARACTER, 'you', {})).toBe(DEFAULT_TEMPLATES['0']);
    });
});

describe('textModeOf', () => {
    it('gives the text mode of a multimodal one and leaves others alone', () => {
        expect(textModeOf(MODE.CHARACTER_MULTIMODAL)).toBe(MODE.CHARACTER);
        expect(textModeOf(MODE.USER_MULTIMODAL)).toBe(MODE.USER);
        expect(textModeOf(MODE.FACE_MULTIMODAL)).toBe(MODE.FACE);
        expect(textModeOf(MODE.FREE)).toBe(MODE.FREE);
    });
});
