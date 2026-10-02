// Doom's Enhancement Suite tracker data (v0.9): the tracker from a reply text and from the saved
// swipe data, characters' current looks, scene tags from time, weather and indoors / outdoors.
import { describe, expect, it } from 'vitest';
import {
    hourOf,
    jsonObjectsIn,
    sceneFromInfoBox,
    trackerFromSwipe,
    trackerFromText,
    withoutCountTags,
} from '../../src/domain';

const tracker = {
    quests: { main: { title: 'Find the key' } },
    infoBox: {
        time: { start: '21:10', end: '21:40' },
        location: { value: 'Лес у старой мельницы' },
        weather: { emoji: '🌧️', forecast: 'дождь' },
    },
    characters: [
        {
            name: 'Мира',
            details: { appearance: 'чёрные волосы, мокрый плащ', demeanor: 'спокойна' },
            thoughts: { content: '…' },
        },
        { name: 'Bob', details: { vneshnost: 'big beard', sostoyanie: 'limping' } },
        { name: 'Ghost', details: { mood: 'sad' } },
    ],
};

describe('DES tracker', () => {
    it('finds the tracker object in a reply, ignoring marker JSON and thinking', () => {
        const reply = `<think>{"x":1}</think>\`\`\`json\n${JSON.stringify(tracker)}\n\`\`\`\nОна идёт. <img data-nai='{"prompt":"лес"}'>`;
        expect(jsonObjectsIn(reply).length).toBe(3);
        const found = trackerFromText(reply)!;
        expect(found.characters.map((c) => [c.name, c.look])).toEqual([
            ['Мира', 'чёрные волосы, мокрый плащ'],
            ['Bob', 'big beard; limping'],
            ['Ghost', ''],
        ]);
        expect(found.scene).toMatchObject({
            location: 'Лес у старой мельницы',
            time: '21:40',
            weather: 'дождь',
            tags: ['night', 'rain'],
        });
        expect(trackerFromText('no tracker here {"a": 1}')).toBeNull();
    });

    it('reads the JSON strings DES saves per swipe, list or keyed store', () => {
        const swipe = {
            infoBox: JSON.stringify(tracker.infoBox),
            characterThoughts: JSON.stringify(tracker.characters),
        };
        expect(trackerFromSwipe({ dooms_tracker_swipes: [swipe] }, 0)?.characters).toHaveLength(3);
        const keyed = trackerFromSwipe(
            { dooms_tracker_swipes: { 1: { characterThoughts: JSON.stringify({ characters: tracker.characters }) } } },
            1,
        );
        expect(keyed?.characters[0]?.name).toBe('Мира');
        expect(keyed?.scene).toBeNull();
        expect(trackerFromSwipe({}, 0)).toBeNull();
    });
});

describe('scene tags', () => {
    it('turns time words, hours, weather and indoors into tags', () => {
        expect(sceneFromInfoBox({ time: { value: 'Вечер, 19:40' }, weather: { forecast: 'ясно' } }).tags).toEqual([
            'evening',
            'night sky',
        ]);
        expect(sceneFromInfoBox({ time: '08:15', weather: 'snowfall' }).tags).toEqual(['morning', 'snow', 'snowing']);
        expect(
            sceneFromInfoBox({ time: '13:00', weather: { forecast: 'в помещении' }, location: 'Таверна' }).tags,
        ).toEqual(['day', 'indoors']);
        expect(sceneFromInfoBox({ time: 'полночь', weather: { emoji: '⛈️', forecast: '' } }).tags).toEqual([
            'night',
            'storm',
            'lightning',
        ]);
        expect(sceneFromInfoBox({ location: 'Somewhere' }).tags).toEqual([]);
    });

    it('reads the hour of a time text', () => {
        expect(hourOf('Вечер, 19:40')).toBe(19);
        expect(hourOf('7.05')).toBe(7);
        expect(hourOf('late')).toBeNull();
    });
});

describe('converted looks', () => {
    it('drop subject-count tags, keep the rest and the sentence', () => {
        expect(withoutCountTags('1girl, apron, holding hammer. She is wet.')).toBe(
            'apron, holding hammer. She is wet.',
        );
        expect(withoutCountTags('solo, 2boys, red scarf, no humans')).toBe('red scarf');
        expect(withoutCountTags('wet cloak')).toBe('wet cloak');
    });
});
