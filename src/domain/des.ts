// Doom's Enhancement Suite tracker data (v0.9), pure: the tracker of a reply read from the
// message (DES stores JSON strings per swipe) or straight from the reply text (DES asks the model to
// start every reply with one JSON object), the characters with their current looks, and the scene
// as image tags (time of day, weather, indoors / outdoors). Words in Russian and English.
import words from '../data/des-words.json';

export interface DesCharacter {
    name: string;
    /** Current looks from the tracker fields (appearance, outfit, state), as written by the model. */
    look: string;
}

export interface DesScene {
    location: string;
    time: string;
    weather: string;
    /** Image tags for the scene: time of day, weather, indoors / outdoors. */
    tags: string[];
}

export interface DesTracker {
    scene: DesScene | null;
    characters: DesCharacter[];
}

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);

function text(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (isObject(value)) {
        for (const key of ['value', 'forecast', 'text', 'content', 'name']) {
            if (typeof value[key] === 'string' && value[key]) return (value[key] as string).trim();
        }
    }
    return '';
}

/** JSON as DES's models write it: tolerate trailing commas. */
function parseLoose(json: string): unknown {
    try {
        return JSON.parse(json);
    } catch {
        try {
            return JSON.parse(json.replace(/,\s*([}\]])/g, '$1'));
        } catch {
            return null;
        }
    }
}

/** Balanced top-level {…} of a text (strings respected), like DES's own scanner. */
export function jsonObjectsIn(source: string, limit = 50000): string[] {
    const found: string[] = [];
    const end = Math.min(source.length, limit);
    let i = 0;
    while (i < end) {
        if (source[i] !== '{') {
            i++;
            continue;
        }
        let depth = 1;
        let j = i + 1;
        let inString = false;
        let escape = false;
        while (j < end && depth > 0) {
            const ch = source[j];
            if (escape) escape = false;
            else if (ch === '\\') escape = true;
            else if (ch === '"') inString = !inString;
            else if (!inString) {
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            j++;
        }
        if (depth === 0) {
            found.push(source.slice(i, j));
            i = j;
        } else i++;
    }
    return found;
}

/** The DES tracker object in a reply text (the first object with quests, infoBox or characters). */
export function trackerFromText(reply: string): DesTracker | null {
    const cleaned = reply.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');
    for (const json of jsonObjectsIn(cleaned)) {
        const data = parseLoose(json);
        if (isObject(data) && ('infoBox' in data || 'characters' in data || 'quests' in data)) {
            return normalizeTracker(data.infoBox, data.characters);
        }
    }
    return null;
}

/** The tracker DES saved for a message swipe (`extra.dooms_tracker_swipes`, JSON strings). */
export function trackerFromSwipe(extra: unknown, swipeId = 0): DesTracker | null {
    const store = isObject(extra) ? extra.dooms_tracker_swipes : undefined;
    const entry = Array.isArray(store) ? store[swipeId] : isObject(store) ? store[String(swipeId)] : undefined;
    if (!isObject(entry)) return null;
    const read = (value: unknown) => (typeof value === 'string' ? parseLoose(value) : value);
    const infoBox = read(entry.infoBox);
    const thoughts = read(entry.characterThoughts);
    if (!infoBox && !thoughts) return null;
    return normalizeTracker(infoBox, thoughts);
}

function normalizeTracker(infoBox: unknown, characters: unknown): DesTracker {
    // characterThoughts can be the list, {characters: [...]}, or the whole unified object.
    const list = Array.isArray(characters)
        ? characters
        : isObject(characters) && Array.isArray(characters.characters)
          ? characters.characters
          : [];
    const box = isObject(infoBox) && isObject(infoBox.infoBox) ? infoBox.infoBox : infoBox;
    return {
        scene: isObject(box) ? sceneFromInfoBox(box) : null,
        characters: list.map(characterOf).filter(Boolean) as DesCharacter[],
    };
}

const has = (haystack: string, stems: readonly string[]) => stems.some((stem) => haystack.includes(stem));

function characterOf(raw: unknown): DesCharacter | null {
    if (!isObject(raw)) return null;
    const name = text(raw.name);
    if (!name) return null;
    const details = isObject(raw.details) ? raw.details : {};
    const fields: [string, string][] = [
        ...Object.entries(details).map(([k, v]) => [k.toLowerCase(), text(v)] as [string, string]),
        ...(['appearance', 'outfit', 'clothing', 'status', 'effects'] as const).map(
            (k) => [k, text(raw[k])] as [string, string],
        ),
    ];
    const pick = (stems: readonly string[]) => fields.filter(([k, v]) => v && has(k, stems)).map(([, v]) => v);
    const look = [...new Set([...pick(words.appearanceKeys), ...pick(words.stateKeys)])].join('; ');
    return { name, look };
}

/** Hour of a time text ("14:20", "Evening, 19:40"), or null. */
export function hourOf(time: string): number | null {
    const match = time.match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return null;
    const hour = Number(match[1]);
    return hour >= 0 && hour < 24 ? hour : null;
}

function timeOfDay(time: string): string {
    const lower = time.toLowerCase();
    for (const [part, stems] of Object.entries(words.time)) if (has(lower, stems)) return part;
    const hour = hourOf(time);
    if (hour === null) return '';
    if (hour >= 4 && hour < 6) return 'dawn';
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

const TIME_TAGS: Record<string, string[]> = {
    dawn: ['sunrise'],
    morning: ['morning'],
    day: ['day'],
    sunset: ['sunset'],
    evening: ['evening'],
    night: ['night'],
};

const EMOJI_WEATHER: [RegExp, string][] = [
    [/⛈|🌩/u, 'storm'],
    [/❄|🌨|☃/u, 'snow'],
    [/🌧|☔|🌦/u, 'rain'],
    [/🌫/u, 'fog'],
    [/☁|🌥/u, 'cloudy'],
    [/🌬/u, 'wind'],
    [/☀|🌤/u, 'clear'],
];

function weatherOf(forecast: string, emoji: string): string {
    const lower = forecast.toLowerCase();
    for (const [kind, stems] of Object.entries(words.weather)) if (has(lower, stems)) return kind;
    for (const [pattern, kind] of EMOJI_WEATHER) if (pattern.test(emoji)) return kind;
    return '';
}

/** Image tags of a time of day as a tracker writes it ("late evening", "Evening, 19:40", Russian words too); empty when unknown. */
export function timeTags(time: string): string[] {
    return [...(TIME_TAGS[timeOfDay(time)] ?? [])];
}

/**
 * Image tags of the weather as a tracker writes it (words or an emoji); empty when unknown. A clear sky
 * needs the time of day (`time`): blue by day, a night sky in the evening and at night.
 */
export function weatherTags(forecast: string, emoji = '', time = ''): string[] {
    const kind = weatherOf(forecast, emoji);
    if (kind === 'storm') return ['storm', 'lightning'];
    if (kind === 'snow') return ['snow', 'snowing'];
    if (kind === 'rain' || kind === 'fog' || kind === 'wind') return [kind];
    if (kind === 'cloudy') return ['cloudy sky'];
    const part = timeOfDay(time);
    if (kind === 'clear' && part) return [part === 'night' || part === 'evening' ? 'night sky' : 'blue sky'];
    return [];
}

/** Scene of a DES info box with its image tags. */
export function sceneFromInfoBox(box: Raw): DesScene {
    const location = text(box.location);
    const timeRaw = box.time;
    const time = isObject(timeRaw) ? text(timeRaw.end) || text(timeRaw.start) || text(timeRaw) : text(timeRaw);
    const weatherRaw = box.weather;
    const weather = text(weatherRaw);
    const emoji = isObject(weatherRaw) ? text(weatherRaw.emoji) : '';
    const context = [weather, location, text(box.conditions), text(box.terrain)].join(' ').toLowerCase();
    const indoors = has(context, words.indoors);
    const outdoors = !indoors && has(context, words.outdoors);
    const tags = timeTags(time);
    if (indoors) tags.push('indoors');
    else {
        if (outdoors) tags.push('outdoors');
        tags.push(...weatherTags(weather, emoji, time));
    }
    return { location, time, weather, tags: [...new Set(tags)] };
}

const COUNT_TAG = /^(?:\d+\+?\s?(?:girls?|boys?|others?)|solo|solo focus|multiple (?:girls|boys|others)|no humans)$/i;

/**
 * A converted look without subject-count tags ("1girl", "solo"): who the character is comes from
 * their passport; a converter guessing the count from a clothing description is often wrong.
 */
export function withoutCountTags(prompt: string): string {
    const cut = prompt.search(/\.\s/);
    const head = cut >= 0 ? prompt.slice(0, cut) : prompt;
    const tail = cut >= 0 ? prompt.slice(cut) : '';
    const tags = head
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag && !COUNT_TAG.test(tag));
    return `${tags.join(', ')}${tail}`.trim();
}
