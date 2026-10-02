import { describe, expect, it } from 'vitest';
import { compareMeta, emptyQuery, facets, filterRecords, matchesQuery, promptTags } from '../../src/domain';
import type { GalleryRecord, InlineGenerationMeta } from '../../src/domain';

function meta(over: Partial<InlineGenerationMeta> = {}): InlineGenerationMeta {
    return {
        scenePrompt: 'red fox in snow',
        prompt: 'red fox in snow, very aesthetic',
        negativePrompt: 'lowres',
        negative: '',
        mode: 6,
        model: 'nai-diffusion-4-5-full',
        seed: 111,
        width: 832,
        height: 1216,
        steps: 23,
        scale: 5,
        cfgRescale: 0,
        sampler: 'k_euler_ancestral',
        noiseSchedule: 'karras',
        ucPreset: 'heavy',
        qualityPreset: 'standard',
        requestType: 'txt2img',
        characters: [],
        transport: 'plugin',
        cost: 0,
        createdAt: '2026-10-01T10:00:00.000Z',
        ...over,
    };
}

function record(
    id: string,
    over: Partial<GalleryRecord> = {},
    metaOver: Partial<InlineGenerationMeta> = {},
): GalleryRecord {
    return {
        id,
        createdAt: '2026-10-01T10:00:00.000Z',
        chatId: 'chat-1',
        characterName: 'Seraphina',
        target: 'inline',
        filePath: '',
        blobKey: '',
        thumbKey: '',
        mime: 'image/webp',
        meta: meta(metaOver),
        favorite: false,
        tags: [],
        ...over,
    };
}

describe('gallery search', () => {
    const records = [
        record('a', { createdAt: '2026-10-01T10:00:00.000Z' }),
        record(
            'b',
            { createdAt: '2026-10-02T10:00:00.000Z', favorite: true, characterName: 'Alice', chatId: 'chat-2' },
            {
                scenePrompt: 'castle at night',
                prompt: 'castle at night',
                model: 'nai-diffusion-5-full',
                seed: 222,
            },
        ),
        record('c', { createdAt: '2026-09-30T10:00:00.000Z', tags: ['winter'] }, { sourcePrompt: 'рыжая лиса' }),
    ];

    it('matches every word in prompt, tags, seed, character and the original prompt', () => {
        expect(filterRecords(records, { ...emptyQuery(), text: 'fox snow' }).map((r) => r.id)).toEqual(['a', 'c']);
        expect(filterRecords(records, { ...emptyQuery(), text: '222' }).map((r) => r.id)).toEqual(['b']);
        expect(filterRecords(records, { ...emptyQuery(), text: 'winter' }).map((r) => r.id)).toEqual(['c']);
        expect(filterRecords(records, { ...emptyQuery(), text: 'лиса' }).map((r) => r.id)).toEqual(['c']);
        expect(filterRecords(records, { ...emptyQuery(), text: 'alice' }).map((r) => r.id)).toEqual(['b']);
    });

    it('filters by model, character, chat, dates and favorites; sorts', () => {
        const q = emptyQuery();
        expect(filterRecords(records, q).map((r) => r.id)).toEqual(['b', 'a', 'c']);
        expect(filterRecords(records, { ...q, sort: 'oldest' }).map((r) => r.id)).toEqual(['c', 'a', 'b']);
        expect(filterRecords(records, { ...q, model: 'nai-diffusion-5-full' }).map((r) => r.id)).toEqual(['b']);
        expect(filterRecords(records, { ...q, character: 'Seraphina' }).map((r) => r.id)).toEqual(['a', 'c']);
        expect(filterRecords(records, { ...q, chatId: 'chat-2' }).map((r) => r.id)).toEqual(['b']);
        expect(filterRecords(records, { ...q, from: '2026-10-01' }).map((r) => r.id)).toEqual(['b', 'a']);
        expect(filterRecords(records, { ...q, to: '2026-10-01' }).map((r) => r.id)).toEqual(['a', 'c']);
        expect(filterRecords(records, { ...q, favoritesOnly: true }).map((r) => r.id)).toEqual(['b']);
        expect(matchesQuery(records[0]!, { ...q, text: '   ' })).toBe(true);
    });

    it('lists facets for the filter dropdowns', () => {
        expect(facets(records)).toEqual({
            models: ['nai-diffusion-4-5-full', 'nai-diffusion-5-full'],
            characters: ['Alice', 'Seraphina'],
            chats: ['chat-1', 'chat-2'],
        });
    });

    it('extracts prompt tags without weights and brackets', () => {
        expect(promptTags('{red fox}, 1.2::snow::, [blurry], (tree:1.1) | sky\nNight')).toEqual([
            'red fox',
            'snow',
            'blurry',
            'tree',
            'sky',
            'night',
        ]);
    });

    it('lists the differing parameters of two generations', () => {
        expect(compareMeta(meta(), meta({ seed: 5, steps: 28 }))).toEqual(['seed', 'steps']);
        expect(compareMeta(meta(), meta())).toEqual([]);
    });
});
