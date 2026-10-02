// Scene candidates from several passports per card (v0.8): every character passport of a card is
// a participant (the main one keeps the card key), a scenario card is nobody, world / scenario /
// location passports give the setting.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    characters: [] as Record<string, unknown>[],
    characterId: '0' as string | undefined,
    groupId: null as string | null,
    groups: [] as { id: string; members: string[] }[],
}));

vi.mock('../../src/core/settings', () => ({ settings: () => defaultSettings(), saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        characters: state.characters,
        characterId: state.characterId,
        groupId: state.groupId,
        groups: state.groups,
        name1: 'Player',
        unshallowCharacter: vi.fn(),
    }),
    importHost: async () => ({ user_avatar: 'player.png' }),
}));

const { mentionedLocationTags, sceneCandidates, sceneSetting } = await import('../../src/features/scene/scene-service');

const card = (name: string, field: Record<string, unknown>) => ({
    name,
    avatar: `${name}.png`,
    data: { extensions: { nai_studio: field } },
});

beforeEach(() => {
    state.characterId = '0';
    state.groupId = null;
    state.groups = [];
});

describe('scene candidates', () => {
    it('makes every character passport of a card a participant', async () => {
        state.characters = [
            card('Inn', {
                passports: [
                    { id: 'm', kind: 'character', name: '', slots: { hair: 'black hair' } },
                    {
                        id: 'b',
                        kind: 'character',
                        name: 'Bob Stone',
                        aliases: ['Bobby'],
                        slots: { hair: 'blond hair' },
                    },
                    { id: 'e', kind: 'character', name: 'Empty' },
                    { id: 'w', kind: 'world', name: 'World', tags: 'fantasy' },
                ],
            }),
        ];
        const list = await sceneCandidates();
        expect(list.map((c) => [c.key, c.name, c.aliases])).toEqual([
            ['Inn', 'Inn', []],
            ['Inn#b', 'Bob Stone', ['Bobby', 'Bob']],
            ['persona:player.png', 'Player', []],
        ]);
    });

    it('keeps an old card with only a character prompt, and skips a scenario card', async () => {
        state.characters = [card('Lyra', { prompts: { positive: 'elf' } })];
        expect((await sceneCandidates()).map((c) => c.key)).toEqual(['Lyra', 'persona:player.png']);
        state.characters = [
            card('Story', { passports: [{ id: 's', kind: 'scenario', name: 'Story', tags: 'dungeon' }] }),
        ];
        expect((await sceneCandidates()).map((c) => c.key)).toEqual(['persona:player.png']);
    });

    it('collects the setting of every card in a group', async () => {
        state.characterId = undefined;
        state.groupId = 'g';
        state.characters = [
            card('A', { passports: [{ id: 'w', kind: 'world', name: 'W', tags: 'cyberpunk, neon' }] }),
            card('B', {
                passports: [
                    { id: 's', kind: 'scenario', name: 'S', tags: 'rain, neon' },
                    {
                        id: 'l',
                        kind: 'location',
                        name: 'Night Market',
                        aliases: ['market'],
                        tags: 'market stalls, crowd',
                    },
                    { id: 'x', kind: 'location', name: 'Nowhere', tags: '' },
                ],
            }),
        ];
        state.groups = [{ id: 'g', members: ['A.png', 'B.png'] }];
        const setting = await sceneSetting();
        expect(setting.world).toBe('cyberpunk, neon, rain');
        expect(setting.locations.map((l) => l.name)).toEqual(['Night Market']);
        expect(mentionedLocationTags('they walk through the market', setting.locations)).toBe('market stalls, crowd');
        expect(mentionedLocationTags('marketplace', setting.locations)).toBe('');
    });
});
