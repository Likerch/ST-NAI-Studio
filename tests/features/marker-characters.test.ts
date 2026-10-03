// Characters of an image marker in their own prompts (v0.9.10): a passport gives the looks of a
// known character ("look" replaces only the clothes), anyone else gets a slot from their "look".
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import { normalizeParams } from '../../src/domain';

const state = vi.hoisted(() => ({ characters: [] as Record<string, unknown>[] }));

vi.mock('../../src/core/settings', () => ({ settings: () => defaultSettings(), saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: '0',
        groupId: null,
        groups: [],
        name1: 'Player',
        unshallowCharacter: vi.fn(),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));

const { SceneService } = await import('../../src/features/scene/scene-service');

beforeEach(() => {
    state.characters = [
        {
            name: 'Your Wives',
            avatar: 'wives.png',
            data: {
                extensions: {
                    nai_studio: {
                        passports: [
                            {
                                id: 'f',
                                kind: 'character',
                                name: 'Florence Claymore',
                                aliases: ['Florence'],
                                slots: { base: '1girl, adult', hair: 'long blonde hair', clothing: 'white sundress' },
                            },
                        ],
                    },
                },
            },
        },
    ];
});

describe('marker characters', () => {
    it('reads "look" from the marker JSON', () => {
        expect(
            normalizeParams({
                prompt: 'hallway',
                chars: [{ name: 'Clare', look: '1girl, short brown hair, maid uniform', pos: 'right' }],
            })?.chars,
        ).toEqual([{ name: 'Clare', look: '1girl, short brown hair, maid uniform', pos: 'right' }]);
    });

    it('gives a known character and someone without a passport their own prompts', async () => {
        const service = new SceneService({} as never, {} as never);
        const built = await service.markerScene(
            'two women talk in a grand hallway, afternoon light',
            [
                { name: 'Florence', look: 'black evening gown', pos: 'left' },
                {
                    name: 'Clare',
                    look: '1girl, short brown hair, maid uniform',
                    action: 'holding a tea tray',
                    pos: 'right',
                },
                { name: 'Nobody' },
            ],
            {},
            { counts: true },
        );
        expect(built?.prompt).toBe('2girls, two women talk in a grand hallway, afternoon light');
        const [florence, clare] = built?.characters ?? [];
        expect(florence?.prompt).toContain('long blonde hair');
        expect(florence?.prompt).toContain('black evening gown');
        expect(florence?.prompt).not.toContain('white sundress');
        expect(clare?.prompt).toBe('1girl, short brown hair, maid uniform, holding a tea tray');
        expect(florence?.prompt).not.toContain('maid');
        expect(built?.characters).toHaveLength(2);
        expect(built?.useCoords).toBe(true);
    });
});
