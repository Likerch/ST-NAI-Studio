// Pure parts of v0.12 (Maestro stage 10): passports of passport providers (normalization, names, what
// NAI Studio does not know yet), passports of lorebook entries (prompt and parser), backgrounds of places
// (prompt, time of day and weather, file name), the DES scene tags they share.
import { describe, expect, it } from 'vitest';
import {
    BACKGROUND_NEGATIVE,
    backgroundFileName,
    backgroundPrompt,
    backgroundSlug,
    backgroundWeatherTags,
    defaultPassport,
    languageName,
    latinLetters,
    markerDimensions,
    BACKGROUND_RATIO,
    normalizeProvidedPassports,
    parseGeneratedPassports,
    passportGenMessages,
    passportGroup,
    sameNamed,
    sceneFromInfoBox,
    timeOfDayTags,
    timeTags,
    unknownPassports,
    weatherTags,
} from '../../src/domain';
import type { Passport } from '../../src/domain';

const RU = {
    lateEvening: 'Поздний вечер',
    rainWind: 'Дождь, ветер',
    clear: 'Ясно',
    tavern: 'Таверна «Ржавый якорь»',
    lira: 'Лиру',
};

function place(name: string, tags: string, kind: Passport['kind'] = 'location', aliases: string[] = []): Passport {
    const p = defaultPassport(kind, name, `id-${name}`);
    p.tags = tags;
    p.aliases = aliases;
    return p;
}

describe('provided passports', () => {
    it('groups kinds as a scene uses them', () => {
        expect(passportGroup('character')).toBe('character');
        expect(passportGroup('world')).toBe('setting');
        expect(passportGroup('scenario')).toBe('setting');
        expect(passportGroup('location')).toBe('location');
        expect(passportGroup('object')).toBe('object');
    });

    it('reads a provider answer: junk, empty and nameless passports out, ids kept or made stable', () => {
        const list = normalizeProvidedPassports(
            [
                { id: 'lore-1', kind: 'location', name: 'Harbor', tags: 'harbor, ships' },
                { kind: 'object', name: 'Sun Blade', tags: 'golden sword' },
                { kind: 'world', name: '', tags: 'steampunk' },
                { kind: 'character', name: 'Bram', slots: { hair: 'red hair' } },
                { kind: 'character', name: '', slots: { hair: 'x' } },
                { kind: 'location', name: 'Empty', tags: '' },
                'junk',
                null,
            ],
            'maestro',
        );
        expect(list.map((p) => [p.id, p.kind, p.name])).toEqual([
            ['lore-1', 'location', 'Harbor'],
            ['maestro:object:sun blade', 'object', 'Sun Blade'],
            ['maestro:world:2', 'world', ''],
            ['maestro:character:bram', 'character', 'Bram'],
        ]);
        expect(normalizeProvidedPassports('junk', 'm')).toEqual([]);
        expect(normalizeProvidedPassports(null, 'm')).toEqual([]);
    });

    it('matches names, aliases and declined forms; nameless never match', () => {
        expect(sameNamed({ name: 'Lyra Vale', aliases: [] }, { name: 'Lyra', aliases: [] })).toBe(true);
        expect(sameNamed({ name: 'Bram', aliases: [] }, { name: 'Old Smith', aliases: ['Bram'] })).toBe(true);
        expect(sameNamed({ name: RU.lira, aliases: [] }, { name: 'Lyra', aliases: [] })).toBe(true);
        expect(sameNamed({ name: 'Harbor', aliases: [] }, { name: 'Market', aliases: [] })).toBe(false);
        expect(sameNamed({ name: '', aliases: [] }, { name: '', aliases: [] })).toBe(false);
    });

    it('keeps only what is not known yet, the first provider passport of a name wins', () => {
        const provided = [
            place('Harbor', 'lore harbor'),
            place('Night Market', 'stalls'),
            place('Market', 'second market'),
            place('Docks', 'docks', 'location', ['Harbor']),
        ];
        const kept = unknownPassports(provided, [{ name: 'Harbor', aliases: [] }]);
        expect(kept.map((p) => p.name)).toEqual(['Night Market']);
        const nameless = [place('', 'a', 'world'), place('', 'b', 'world')];
        expect(unknownPassports(nameless, [{ name: 'World', aliases: [] }])).toHaveLength(2);
    });
});

describe('passports of lorebook entries', () => {
    it('asks for one passport of the kind, with the story language for aliases', () => {
        const location = passportGenMessages({ name: 'Harbor', description: 'A grey harbor.' }, 'entry', {
            kind: 'location',
            language: 'ru',
        });
        expect(location.system).toContain('about one place');
        expect(location.system).toContain('one entry of kind "location"');
        expect(location.system).toContain('the name as a Russian text spells it');
        expect(location.system).toContain('no names, history');
        expect(location.user).toBe('Entry: Harbor\n\nDescription:\nA grey harbor.\n\nStory language: Russian');
        const person = passportGenMessages({ name: 'Bram', description: 'A smith.' }, 'entry');
        expect(person.system).toContain('one entry of kind "character"');
        expect(person.system).toContain('written in Cyrillic');
        expect(person.system).toContain('futanari');
        expect(person.user).not.toContain('Story language');
        expect(passportGenMessages({ name: 'X', description: 'y' }, 'card').system).toContain('character card');
    });

    it('gives the persona prompt the story language for aliases when there is one (0.15)', () => {
        const plain = passportGenMessages({ name: 'Anna', description: 'Silver hair.' }, 'persona');
        expect(plain.system).toContain("player's persona");
        expect(plain.system).not.toContain('text spells it');
        expect(plain.user).toBe('Persona: Anna\n\nDescription:\nSilver hair.');
        const russian = passportGenMessages({ name: 'Anna', description: 'Silver hair.' }, 'persona', {
            language: 'ru',
        });
        expect(russian.system.startsWith(plain.system)).toBe(true);
        expect(russian.system).toContain('aliases: short names, nicknames and the name as a Russian text spells it.');
        expect(russian.user).toBe('Persona: Anna\n\nDescription:\nSilver hair.\n\nStory language: Russian');
        // The other targets do not take a language.
        expect(passportGenMessages({ name: 'X', description: 'y' }, 'npc', { language: 'ru' }).user).not.toContain(
            'Story language',
        );
    });

    it('names languages by code and keeps anything else', () => {
        expect(languageName('ru-RU')).toBe('Russian');
        expect(languageName('EN')).toBe('English');
        expect(languageName('Klingon')).toBe('Klingon');
    });

    it('reads an entry without a kind as the asked kind, with the fallback name', () => {
        const [harbor] = parseGeneratedPassports({ passports: [{ tags: 'harbor, ships' }] }, 'Harbor', 'location');
        expect(harbor).toMatchObject({ kind: 'location', name: 'Harbor', tags: 'harbor, ships' });
        // The card default stays: no kind is a character, a nameless location is dropped.
        expect(parseGeneratedPassports({ passports: [{ kind: 'location', tags: 'x' }] }, 'Card')).toEqual([]);
        expect(parseGeneratedPassports({ passports: [{ hair: 'red hair' }] }, 'Card')[0]).toMatchObject({
            kind: 'character',
            name: 'Card',
        });
    });
});

describe('backgrounds', () => {
    it('reads the time of day and the weather like the DES scene, unknown words as given', () => {
        expect(timeOfDayTags('evening')).toBe('evening');
        expect(timeOfDayTags(RU.lateEvening)).toBe('evening');
        expect(timeOfDayTags('19:40')).toBe('evening');
        expect(timeOfDayTags('03:10')).toBe('night');
        expect(timeOfDayTags('teatime')).toBe('teatime');
        expect(timeOfDayTags('  ')).toBe('');
        expect(backgroundWeatherTags(RU.rainWind)).toBe('rain');
        expect(backgroundWeatherTags('storm')).toBe('storm, lightning');
        expect(backgroundWeatherTags(RU.clear)).toBe('blue sky');
        expect(backgroundWeatherTags('clear', 'night')).toBe('night sky');
        expect(backgroundWeatherTags('balmy')).toBe('balmy');
        expect(backgroundWeatherTags('')).toBe('');
        expect(timeTags('dawn')).toEqual(['sunrise']);
        expect(weatherTags('snow')).toEqual(['snow', 'snowing']);
        expect(weatherTags('cloudy')).toEqual(['cloudy sky']);
        expect(weatherTags('clear')).toEqual([]);
        expect(weatherTags('', '☀', '12:00')).toEqual(['blue sky']);
    });

    it('keeps the DES scene tags as before', () => {
        expect(sceneFromInfoBox({ time: '22:00', weather: { forecast: 'clear' }, location: 'Field' }).tags).toEqual([
            'night',
            'night sky',
        ]);
        expect(sceneFromInfoBox({ time: 'noon', weather: 'fog', location: 'kitchen' }).tags).toEqual([
            'day',
            'indoors',
        ]);
    });

    it('builds a prompt without people from the passport, the tags, the time and the weather', () => {
        expect(
            backgroundPrompt({
                locationName: 'Harbor',
                placeTags: 'harbor, ships, pier',
                tags: 'ruins, ships',
                timeOfDay: 'evening',
                weather: 'rain',
            }),
        ).toBe('no humans, scenery, harbor, ships, pier, ruins, evening, rain');
        // Nothing says how it looks: the name stands in (Russian is converted by the pipeline).
        expect(backgroundPrompt({ locationName: ` ${RU.tavern} ` })).toBe(`no humans, scenery, ${RU.tavern}`);
        expect(BACKGROUND_NEGATIVE).toContain('1girl');
        expect(markerDimensions(BACKGROUND_RATIO, undefined, true)).toEqual({ width: 1344, height: 768 });
    });

    it('names the file after the place in Latin letters', () => {
        expect(latinLetters(RU.lira)).toBe('liru');
        expect(backgroundSlug(RU.tavern)).toBe('taverna-rzhavyy-yakor');
        expect(backgroundSlug('Café de la Paix!')).toBe('cafe-de-la-paix');
        expect(backgroundSlug('***')).toBe('place');
        expect(backgroundSlug('a'.repeat(39) + ' b')).toBe('a'.repeat(39));
        expect(backgroundFileName('Old Mill', 1759600000123.7)).toBe('maestro-old-mill-1759600000123.png');
        expect(backgroundFileName('x', -5)).toBe('maestro-x-0.png');
    });
});
