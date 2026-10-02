// v0.9.4: explicit scenes gate the NSFW layer of automatic scenes, count tags can be left out, rooms
// are indoors for the DES scene, generated passports carry one default outfit and no palette tags.
import { describe, expect, it } from 'vitest';
import {
    buildScene,
    defaultPassport,
    isExplicitScene,
    parseGeneratedPassports,
    passportGenMessages,
    sceneFromInfoBox,
    withoutUnstatedSpecies,
} from '../../src/domain';
import type { SceneParticipant, SceneSpec } from '../../src/domain';

describe('isExplicitScene', () => {
    it('finds nudity and sex as whole words, in English tags and Russian text', () => {
        expect(isExplicitScene('1girl, nude, on bed')).toBe(true);
        expect(isExplicitScene('sex from behind')).toBe(true);
        expect(isExplicitScene('breasts_out, smile')).toBe(true);
        expect(isExplicitScene('она стоит обнажённая у окна')).toBe(true);
        expect(isExplicitScene('Голая Клэр')).toBe(true);
    });

    it('leaves ordinary scenes alone, including words that only contain an explicit one', () => {
        expect(isExplicitScene('maid in frilly uniform, holding a silver tea tray, upper body shot')).toBe(false);
        expect(isExplicitScene('a moral dilemma, cucumber salad, analysis of a map')).toBe(false);
        expect(isExplicitScene('sexy maid, сексуальная горничная')).toBe(false);
        expect(isExplicitScene('кончик носа, соскользнула с края')).toBe(false);
    });
});

describe('buildScene options', () => {
    const caps = { maxCharacters: 6, positioning: 'grid', canPositionSingleCharacter: true, v4Prompt: true } as const;
    const arthur = defaultPassport('character', 'Arthur');
    arthur.slots.base = '1boy, adult';
    arthur.slots.hair = 'white hair';
    arthur.nsfw = { enabled: true, tags: 'large penis' };
    const participant = {
        key: 'persona',
        name: 'Arthur',
        enabled: true,
        passport: arthur,
        fallbackPrompt: '',
        fallbackNegative: '',
        outfit: '',
        states: [],
        pose: '',
        poseTags: '',
        negative: '',
        position: { x: 0.5, y: 0.5 },
    } as unknown as SceneParticipant;
    const spec: SceneSpec = {
        base: 'hallway',
        framing: '',
        camera: '',
        distance: '',
        pair: null,
        participants: [participant],
        useCoords: false,
    };

    it('drops the count tags on request and keeps them by default', () => {
        expect(buildScene(spec, caps, { allowNsfw: false }).prompt).toBe('1boy, hallway');
        expect(buildScene(spec, caps, { allowNsfw: false, counts: false }).prompt).toBe('hallway');
    });

    it('adds the NSFW layer only when allowed', () => {
        expect(buildScene(spec, caps, { allowNsfw: false }).characters[0]?.prompt).not.toContain('large penis');
        expect(buildScene(spec, caps, { allowNsfw: true }).characters[0]?.prompt).toContain('large penis');
    });
});

describe('DES rooms', () => {
    it('treats a hall of a manor as indoors: no sky from the weather', () => {
        const scene = sceneFromInfoBox({
            time: { start: '16:20', end: '16:45' },
            location: { value: 'Главный холл Клеймор-Мэнор' },
            weather: { emoji: '☀️', forecast: 'ясно' },
        });
        expect(scene.tags).toContain('indoors');
        expect(scene.tags).not.toContain('blue sky');
    });

    it('keeps a bay outdoors although it contains the word for a hall', () => {
        const scene = sceneFromInfoBox({ time: '12:00', location: 'Берег залива', weather: 'ясно' });
        expect(scene.tags).not.toContain('indoors');
    });
});

describe('generated passports', () => {
    it('asks for one default outfit and no palette tags', () => {
        const { system } = passportGenMessages({ name: 'Arthur', description: 'x' }, 'persona');
        expect(system).toContain('ONE default outfit');
        expect(system).toContain('colour palette');
    });

    it('drops palette and quality tags and wears the first outfit when no default is given', () => {
        const [passport] = parseGeneratedPassports({
            passports: [
                {
                    kind: 'character',
                    name: 'Arthur',
                    base: '1boy, adult',
                    clothing: '',
                    accessories: 'silver ring, pastel colors, masterpiece',
                    outfits: [
                        { name: 'everyday', tags: 'linen shirt, pastel colors, loose trousers' },
                        { name: 'outerwear', tags: 'long coat' },
                    ],
                },
            ],
        });
        expect(passport?.slots.accessories).toBe('silver ring');
        expect(passport?.outfits[0]?.tags).toBe('linen shirt, loose trousers');
        expect(passport?.activeOutfit).toBe('everyday');
    });
});

describe('species of generated passports (v0.9.7)', () => {
    const passport = (base: string) => {
        const p = defaultPassport('character', 'Florence Claymore');
        p.slots.base = base;
        p.slots.body = 'slim, pointy ears';
        return p;
    };

    it('drops a species the text never names', () => {
        const [p] = withoutUnstatedSpecies(
            [passport('1girl, adult, noblewoman, elf')],
            'A regency era nation called Flora. Florence is fond of charity work.',
        );
        expect(p?.slots.base).toBe('1girl, adult, noblewoman');
        expect(p?.slots.body).toBe('slim');
    });

    it('keeps it when the text names it, in English or Russian, but not inside another word', () => {
        expect(withoutUnstatedSpecies([passport('1girl, elf')], 'She is an elven archer.')[0]?.slots.base).toBe(
            '1girl, elf',
        );
        expect(withoutUnstatedSpecies([passport('1girl, elf')], 'Она эльфийка.')[0]?.slots.base).toBe('1girl, elf');
        expect(withoutUnstatedSpecies([passport('1girl, elf')], 'She keeps to herself.')[0]?.slots.base).toBe('1girl');
    });
});
