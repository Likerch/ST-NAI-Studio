import { describe, expect, it } from 'vitest';
import {
    applyPairLayout,
    autoLayout,
    buildPayload,
    buildScene,
    countTags,
    defaultPassport,
    defaultRequest,
    detectPairInText,
    detectParticipants,
    getCapabilities,
    mentionIndex,
    participantFrom,
    resolveOverlaps,
} from '../../src/domain';
import type { Passport, SceneCandidate, SceneSpec } from '../../src/domain';

function passport(base: string, hair: string, negative = '', pose = ''): Passport {
    const p = defaultPassport();
    p.slots.base = base;
    p.slots.hair = hair;
    p.negative = negative;
    p.pose = { preset: pose, custom: '' };
    return p;
}

const candidates: SceneCandidate[] = [
    {
        key: 'alice',
        name: 'Alice',
        aliases: ['Ali'],
        passport: passport('1girl, human', 'red hair', 'blue hair', 'standing'),
        fallbackPrompt: '',
        fallbackNegative: '',
        isUser: false,
    },
    {
        key: 'bob',
        name: 'Bob',
        aliases: [],
        passport: passport('1boy, human', 'black hair', 'beard'),
        fallbackPrompt: '',
        fallbackNegative: '',
        isUser: false,
    },
    {
        key: 'cat',
        name: 'Мурка',
        aliases: ['Murka'],
        passport: null,
        fallbackPrompt: 'cat girl, 1girl, animal ears',
        fallbackNegative: 'extra tails',
        isUser: false,
    },
    {
        key: 'persona:me',
        name: 'Max',
        aliases: [],
        passport: null,
        fallbackPrompt: '',
        fallbackNegative: '',
        isUser: true,
    },
];

const v5 = getCapabilities('nai-diffusion-5-full');
const v45 = getCapabilities('nai-diffusion-4-5-full');
const v3 = getCapabilities('nai-diffusion-3');

describe('who is in the frame', () => {
    it('finds whole-word mentions of names and aliases, Unicode included', () => {
        expect(mentionIndex('Then Alice smiled', ['Alice'])).toBe(4);
        expect(mentionIndex('Malice is not a name', ['Alice'])).toBe(-1);
        expect(mentionIndex('Мурка мурлычет', ['Мурка'])).toBe(0);
        expect(mentionIndex('x', ['A'])).toBe(-1);
    });

    it('orders participants by first mention, falls back to the speaker, respects the limit', () => {
        const text = 'Bob waves. Мурка jumps on the table while Ali laughs.';
        expect(detectParticipants(text, candidates, { max: 6 }).map((c) => c.key)).toEqual(['bob', 'cat', 'alice']);
        expect(
            detectParticipants('Nobody named.', candidates, { speakerKey: 'alice', max: 6 }).map((c) => c.key),
        ).toEqual(['alice']);
        expect(detectParticipants(text, candidates, { max: 2 }).map((c) => c.key)).toEqual(['bob', 'cat']);
        expect(detectParticipants(text, candidates, { max: 0 })).toEqual([]);
    });
});

describe('pair poses from text', () => {
    const people = [{ name: 'Lyra' }, { name: 'Bram' }, { name: 'Seraphina' }];

    it('the sentence with the action decides source and target', () => {
        const text = 'Lyra sits by the fire. Bram crosses his arms. Seraphina hugs Lyra from the side.';
        expect(detectPairInText(text, people)).toEqual({ pose: 'hug', a: 2, b: 0 });
        expect(detectPairInText('Бран и Лира держатся за руки.', [{ name: 'Лира' }, { name: 'Бран' }])).toEqual({
            pose: 'holding_hands',
            a: 1,
            b: 0,
        });
    });

    it('falls back to the other participant or the first two; needs two people', () => {
        expect(detectPairInText('She hugs Bram.', [{ name: 'Lyra' }, { name: 'Bram' }])).toEqual({
            pose: 'hug',
            a: 1,
            b: 0,
        });
        expect(detectPairInText('Everyone hugs.', people)).toEqual({ pose: 'hug', a: 0, b: 1 });
        expect(detectPairInText('Lyra hugs Bram.', [{ name: 'Lyra' }])).toBeNull();
        expect(detectPairInText('Nothing here.', people)).toBeNull();
    });
});

describe('layout', () => {
    it('spreads one row of up to five, then rows; grid models snap', () => {
        expect(autoLayout(1, v5)).toEqual([{ x: 0.5, y: 0.5 }]);
        expect(autoLayout(3, v5)).toEqual([
            { x: 0.25, y: 0.5 },
            { x: 0.5, y: 0.5 },
            { x: 0.75, y: 0.5 },
        ]);
        expect(autoLayout(3, v45)).toEqual([
            { x: 0.3, y: 0.5 },
            { x: 0.5, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ]);
        const many = autoLayout(12, v5);
        expect(many).toHaveLength(12);
        expect(new Set(many.map((p) => p.y)).size).toBe(3);
        expect(autoLayout(2, v45, [{ x: 0.95, y: 0.05 }, null])).toEqual([
            { x: 0.9, y: 0.1 },
            { x: 0.7, y: 0.5 },
        ]);
    });
});

describe('count tags', () => {
    it('counts girls, boys and others from base tags', () => {
        expect(countTags(['1girl, elf', 'girl', '1boy'])).toBe('2girls, 1boy');
        expect(countTags(['woman', 'other'])).toBe('1girl, 1other');
        expect(countTags(['cat', ''])).toBe('');
    });
});

function sceneOf(keys: string[], text = ''): SceneSpec {
    const list = keys.map((k) => candidates.find((c) => c.key === k)!);
    const positions = autoLayout(list.length, v45);
    return {
        base: 'tavern, night, warm lighting',
        framing: 'cowboy_shot',
        camera: 'from_side',
        distance: 'auto',
        pair: null,
        participants: list.map((c, i) => participantFrom(c, positions[i]!)),
        useCoords: true,
        ...(text ? {} : {}),
    };
}

describe('buildScene', () => {
    it('three characters: own tags, pose and UC each; positions as coordinates; valid v4_prompt with three blocks', () => {
        const spec = sceneOf(['alice', 'bob', 'cat']);
        spec.participants[1]!.pose = 'sitting';
        spec.participants[2]!.negative = 'collar';
        const built = buildScene(spec, v45, { allowNsfw: false });
        expect(built.prompt).toBe('2girls, 1boy, tavern, night, warm lighting, cowboy shot, from side');
        expect(built.withoutPassport).toEqual(['Мурка']);
        expect(built.useCoords).toBe(true);
        expect(built.characters).toEqual([
            { prompt: '1girl, human, red hair, standing', negative: 'blue hair', x: 0.3, y: 0.5, enabled: true },
            { prompt: '1boy, human, black hair, sitting', negative: 'beard', x: 0.5, y: 0.5, enabled: true },
            { prompt: 'cat girl, 1girl, animal ears', negative: 'extra tails, collar', x: 0.7, y: 0.5, enabled: true },
        ]);

        const request = {
            ...defaultRequest('nai-diffusion-4-5-full'),
            prompt: built.prompt,
            useCoords: built.useCoords,
            seed: 1,
            characters: built.characters.map((c) => ({
                prompt: c.prompt,
                negative: c.negative,
                center: { x: c.x, y: c.y },
                enabled: c.enabled,
            })),
        };
        const { body } = buildPayload(request, v45);
        const v4 = body.parameters.v4_prompt!;
        expect(v4.caption.char_captions).toHaveLength(3);
        expect(v4.use_coords).toBe(true);
        expect(v4.caption.char_captions.map((c) => c.centers[0])).toEqual([
            { x: 0.3, y: 0.5 },
            { x: 0.5, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ]);
        expect(v4.caption.char_captions[1]?.char_caption).toContain('black hair, sitting');
        const negatives = body.parameters.v4_negative_prompt!.caption.char_captions.map((c) => c.char_caption);
        expect(negatives).toEqual(['blue hair', 'beard', 'extra tails, collar']);
    });

    it('pair pose: source/target tags and its layout', () => {
        const spec = sceneOf(['alice', 'bob']);
        spec.pair = { pose: 'hug', a: 0, b: 1 };
        applyPairLayout(spec, v45);
        const built = buildScene(spec, v45, { allowNsfw: false });
        expect(built.characters[0]?.prompt).toContain('source#hug');
        expect(built.characters[1]?.prompt).toContain('target#hug');
        expect(built.characters.map((c) => [c.x, c.y])).toEqual([
            [0.5, 0.5],
            [0.7, 0.5],
        ]);
        expect(applyPairLayout({ ...spec, pair: { pose: 'nope', a: 0, b: 1 } }, v45)).toBeTruthy();
    });

    it('a pair layout never puts a third participant on the same spot', () => {
        const spec = sceneOf(['alice', 'bob', 'cat']);
        spec.pair = { pose: 'hug', a: 2, b: 0 };
        applyPairLayout(spec, v45);
        const spots = spec.participants.map((p) => `${p.position.x},${p.position.y}`);
        expect(new Set(spots).size).toBe(3);
        expect(spec.participants[1]!.position.y).toBe(0.5);
        const crowded = sceneOf(['alice', 'bob']);
        crowded.participants.forEach((p) => (p.position = { x: 0.5, y: 0.5 }));
        resolveOverlaps(crowded, v5);
        expect(crowded.participants[1]!.position).not.toEqual(crowded.participants[0]!.position);
    });

    it('V5 takes more than six characters, V4.5 drops the rest; V3 merges everything into one prompt', () => {
        const many: SceneSpec = {
            ...sceneOf([]),
            participants: Array.from({ length: 8 }, (_, i) =>
                participantFrom({ ...candidates[0]!, key: `c${i}`, name: `C${i}` }, { x: 0.5, y: 0.5 }),
            ),
        };
        expect(buildScene(many, v5, { allowNsfw: false }).characters).toHaveLength(8);
        const limited = buildScene(many, v45, { allowNsfw: false });
        expect(limited.characters).toHaveLength(6);
        expect(limited.dropped).toEqual(['C6', 'C7']);
        const flat = buildScene(sceneOf(['alice', 'bob']), v3, { allowNsfw: false });
        expect(flat.characters).toEqual([]);
        expect(flat.prompt).toContain('red hair');
        expect(flat.prompt).toContain('black hair');
        expect(flat.useCoords).toBe(false);
    });

    it('a single character is positioned only where the model allows it; disabled ones are skipped', () => {
        const one = sceneOf(['alice']);
        expect(buildScene(one, v45, { allowNsfw: false }).useCoords).toBe(false);
        expect(buildScene(one, v5, { allowNsfw: false }).useCoords).toBe(true);
        const two = sceneOf(['alice', 'bob']);
        two.participants[1]!.enabled = false;
        expect(buildScene(two, v45, { allowNsfw: false }).characters).toHaveLength(1);
        two.useCoords = false;
        expect(buildScene(two, v5, { allowNsfw: false }).useCoords).toBe(false);
    });
});
