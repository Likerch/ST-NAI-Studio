// v0.9.8: explicit scenes get "nsfw" in the prompt; a futanari's anatomy lives in the NSFW layer,
// a bulge shows in ordinary scenes, explicit ones get a composition hint.
import { describe, expect, it } from 'vitest';
import {
    buildScene,
    defaultPassport,
    EXPLICIT_NEGATIVE,
    explicitScene,
    parseGeneratedPassports,
    passportTags,
} from '../../src/domain';
import type { Passport, SceneParticipant, SceneSpec } from '../../src/domain';

const caps = { maxCharacters: 6, positioning: 'grid', canPositionSingleCharacter: true, v4Prompt: true } as const;

function futa(): Passport {
    const p = defaultPassport('character', 'Yuna');
    p.slots.base = '1girl, adult';
    p.slots.hair = 'black hair';
    p.slots.clothing = 'school uniform';
    p.nsfw = { enabled: true, tags: 'futanari, large penis' };
    return p;
}

function man(): Passport {
    const p = defaultPassport('character', 'Arthur');
    p.slots.base = '1boy, adult';
    return p;
}

const participant = (passport: Passport, x: number) =>
    ({
        key: passport.name,
        name: passport.name,
        enabled: true,
        passport,
        fallbackPrompt: '',
        fallbackNegative: '',
        outfit: '',
        states: [],
        pose: '',
        poseTags: '',
        negative: '',
        position: { x, y: 0.5 },
    }) as unknown as SceneParticipant;

const spec = (base: string): SceneSpec => ({
    base,
    framing: '',
    camera: '',
    distance: '',
    pair: null,
    participants: [participant(futa(), 0.3), participant(man(), 0.7)],
    useCoords: false,
});

describe('explicitScene', () => {
    it('puts nsfw into the prompt of an explicit scene and keeps childlike looks out', () => {
        expect(explicitScene('bedroom, sex', [])).toEqual({ scene: 'nsfw, bedroom, sex', negative: EXPLICIT_NEGATIVE });
        expect(explicitScene('nsfw, bedroom', ['1girl, nude'])?.scene).toBe('nsfw, bedroom');
        expect(explicitScene('a walk in the park', ['1girl, smile'])).toBeNull();
    });
});

describe('futanari in scenes', () => {
    it('is an ordinary girl with a bulge in an ordinary scene', () => {
        const built = buildScene(spec('classroom, talking'), caps, { allowNsfw: false });
        const yuna = built.characters[0]?.prompt ?? '';
        expect(yuna).toContain('bulge');
        expect(yuna).not.toMatch(/futanari|penis/);
        expect(built.prompt).toBe('1girl, 1boy, classroom, talking');
    });

    it('gets her anatomy in her own slot and a composition hint in an explicit scene', () => {
        const built = buildScene(spec('nsfw, bedroom, sex'), caps, { allowNsfw: true });
        expect(built.characters[0]?.prompt).toContain('futanari, large penis');
        expect(built.characters[0]?.prompt).not.toContain('bulge');
        expect(built.characters[1]?.prompt).not.toMatch(/futanari|penis/);
        expect(built.prompt).toBe('1girl, 1boy, futa with male, nsfw, bedroom, sex');
    });

    it('keeps explicit anatomy written into an ordinary slot out of ordinary scenes', () => {
        const p = futa();
        p.slots.base = '1girl, futanari, adult';
        expect(passportTags(p, { allowNsfw: false })).not.toContain('futanari');
        expect(passportTags(p, { allowNsfw: true })).toContain('futanari');
    });
});

describe('generated futanari passports', () => {
    it('moves the anatomy into the NSFW layer and switches it on', () => {
        const [p] = parseGeneratedPassports({
            passports: [
                {
                    kind: 'character',
                    name: 'Azura',
                    base: '1girl, futanari, demon',
                    body: 'tall, large breasts, huge penis',
                    clothing: 'armor',
                },
            ],
        });
        expect(p?.slots.base).toBe('1girl, demon');
        expect(p?.slots.body).toBe('tall, large breasts');
        expect(p?.nsfw).toEqual({ enabled: true, tags: 'futanari, huge penis' });
    });

    it('moves anatomy of anyone else too but leaves their layer off', () => {
        const [p] = parseGeneratedPassports({
            passports: [{ kind: 'character', name: 'Mira', base: '1girl', body: 'slim, pink nipples' }],
        });
        expect(p?.slots.body).toBe('slim');
        expect(p?.nsfw).toEqual({ enabled: false, tags: 'pink nipples' });
    });
});
