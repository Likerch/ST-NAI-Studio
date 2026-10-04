// Backgrounds of places (v0.12, NAI_STUDIO_API.generateBackground, Maestro M29). Pure: the prompt of a
// background (nobody in it, the place's passport and tags, the time of day and the weather as tags —
// read like the DES tracker's scene), its undesired content and file name.
import { timeTags, weatherTags } from './des';
import { joinTags } from './passport';
import { latinLetters } from './scene-assembly';

export interface BackgroundPromptInput {
    /** Name of the place; drawn from only when nothing else says how it looks. */
    locationName: string;
    /** Tags of the place's passport. */
    placeTags?: string;
    /** Tags the caller adds (state of the place, decorations). */
    tags?: string;
    timeOfDay?: string;
    weather?: string;
}

/** Undesired content of every background: nobody in the picture. */
export const BACKGROUND_NEGATIVE = '1girl, 1boy, multiple girls, multiple boys, people, crowd';

/** Background ratio (16:9); within the free pixel budget it is 1344×768, free on Opus. */
export const BACKGROUND_RATIO = 'wide';

/** Tags of a time of day as a tracker writes it ("late evening", "19:40", Russian words too); unknown words as given. */
export function timeOfDayTags(value: string): string {
    const text = value.trim();
    return text ? joinTags(...timeTags(text)) || text : '';
}

/**
 * Tags of the weather as a tracker writes it ("rain", "clear", Russian words too); unknown words as given. A clear sky is
 * blue unless the time of day says evening or night.
 */
export function backgroundWeatherTags(value: string, timeOfDay = ''): string {
    const text = value.trim();
    return text ? joinTags(...weatherTags(text, '', timeOfDay.trim() || 'noon')) || text : '';
}

/** Positive prompt of a background: scenery without people, how the place looks, the time and weather. */
export function backgroundPrompt(input: BackgroundPromptInput): string {
    const looks = joinTags(input.placeTags ?? '', input.tags ?? '');
    const time = input.timeOfDay ?? '';
    return joinTags(
        'no humans',
        'scenery',
        looks || input.locationName.trim(),
        timeOfDayTags(time),
        backgroundWeatherTags(input.weather ?? '', time),
    );
}

/** A place name as a file name part: Latin letters and digits joined by "-", at most 40 characters. */
export function backgroundSlug(name: string): string {
    const slug = latinLetters(name)
        .normalize('NFKD')
        .replace(/\p{M}+/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+/, '')
        .slice(0, 40)
        .replace(/-+$/, '');
    return slug || 'place';
}

/** File name of a background in SillyTavern's library: `maestro-<slug>-<timestamp>.png`. */
export function backgroundFileName(locationName: string, timestamp: number): string {
    return `maestro-${backgroundSlug(locationName)}-${Math.max(0, Math.floor(timestamp))}.png`;
}
