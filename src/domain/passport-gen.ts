// Passports written by an LLM from a character card or a persona description (v0.8). Pure: the
// prompt, the JSON schema for Chat Completion and a forgiving parser of the answer.
import { defaultPassport, joinTags, newPassportId, PASSPORT_KINDS, PASSPORT_SLOTS, splitTags } from './passport';
import { mentionIndex } from './scene-assembly';
import type { Passport, PassportKind } from './passport';

export interface PassportSource {
    name: string;
    description: string;
    personality?: string;
    scenario?: string;
    firstMessage?: string;
}

const LIMITS = { description: 6000, personality: 1500, scenario: 1500, firstMessage: 2500 };

const FIELDS = ['base', 'hair', 'eyes', 'body', 'skin', 'clothing', 'accessories'] as const;

const SYSTEM_CARD = [
    'You read a roleplay character card and write visual "passports" for an image generator (NovelAI, Danbooru tags).',
    'Answer only with JSON: {"passports": [...]}, one entry per thing that can be drawn:',
    '- kind "character": every person or creature whose appearance the text describes (the main character and the others). Fields: name, aliases (short names, nicknames, and the name written in Cyrillic as a Russian text would spell it), base (count tag and what they are: "1girl, elf, adult", "1boy, demon", "1other, slime girl"), hair, eyes, body (build, height, figure, notable features), skin, clothing (usual outfit), accessories, outfits (other named outfits as {"name","tags"}), nsfw (explicit body details only if the text gives them), negative (what must never be drawn for them).',
    '- kind "world": the setting as a whole (era, technology, magic, overall look) in "tags".',
    '- kind "location": a recurring named place, how it looks, in "tags".',
    '- kind "scenario": only when the card is a scenario or a narrator rather than one character; the visual tags of the situation in "tags".',
    '- kind "object": an important item or vehicle, how it looks, in "tags".',
    'Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent; leave a field empty when unknown. Keep names as written in the card. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives ("blue or grey coat"); every other outfit of the text goes to "outfits".',
].join('\n');

const SYSTEM_PERSONA = [
    "You read the description of the player's persona in a roleplay and write one visual passport for an image generator (NovelAI, Danbooru tags).",
    'Answer only with JSON: {"passports": [ one entry of kind "character" ]} with the fields name, aliases, base (count tag and what they are: "1girl, adult", "1boy, elf"), hair, eyes, body, skin, clothing, accessories, outfits ({"name","tags"}), nsfw (explicit body details only if given), negative.',
    'Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent; leave a field empty when unknown. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives ("blue or grey coat"); every other outfit of the text goes to "outfits".',
].join('\n');

const SYSTEM_NPC = [
    'You read how a roleplay scene tracker describes a character right now, and the story card they come from, and write one visual passport for an image generator (NovelAI, Danbooru tags).',
    'Answer only with JSON: {"passports": [ one entry of kind "character" ]} with the fields name, aliases, base (count tag and what they are: "1girl, elf, adult", "1boy, orc"), hair, eyes, body, skin, clothing (what they wear in the tracker), accessories, outfits, nsfw (explicit body details only if given), negative.',
    'Permanent features (species, body, face, hair, eyes, skin) go to their fields; temporary states (wet, wounded, blushing) are left out.',
    'The story card describes the world and other characters: take from it only what it says about this character by name, never the traits of anyone else (race, hair, clothes).',
    'Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the texts say or clearly imply about this character, never invent; leave a field empty when unknown. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives ("blue or grey coat"); every other outfit of the text goes to "outfits".',
].join('\n');

const str = { type: 'string' };
export const PASSPORT_GEN_SCHEMA = {
    name: 'nai_passports',
    description: 'Visual passports of the characters, world, locations, scenario and objects of a card',
    strict: false,
    value: {
        type: 'object',
        properties: {
            passports: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        kind: { type: 'string', enum: [...PASSPORT_KINDS] },
                        name: str,
                        aliases: { type: 'array', items: str },
                        ...Object.fromEntries(FIELDS.map((f) => [f, str])),
                        outfits: {
                            type: 'array',
                            items: { type: 'object', properties: { name: str, tags: str }, required: ['name', 'tags'] },
                        },
                        nsfw: str,
                        negative: str,
                        tags: str,
                    },
                    required: ['kind', 'name'],
                },
            },
        },
        required: ['passports'],
    },
};

function clip(text: string | undefined, max: number): string {
    const value = (text ?? '').trim();
    return value.length > max ? `${value.slice(0, max)}…` : value;
}

export type PassportTarget = 'card' | 'persona' | 'npc';

const SYSTEMS: Record<PassportTarget, string> = { card: SYSTEM_CARD, persona: SYSTEM_PERSONA, npc: SYSTEM_NPC };
const LABELS: Record<PassportTarget, string> = { card: 'Card', persona: 'Persona', npc: 'Character' };

/** System and user messages for a card, a persona or one character of a scene tracker. */
export function passportGenMessages(source: PassportSource, target: PassportTarget): { system: string; user: string } {
    const parts = [
        `${LABELS[target]}: ${source.name}`,
        `${target === 'npc' ? 'Tracker' : 'Description'}:\n${clip(source.description, LIMITS.description)}`,
    ];
    if (source.personality?.trim()) parts.push(`Personality:\n${clip(source.personality, LIMITS.personality)}`);
    if (source.scenario?.trim())
        parts.push(
            `${target === 'npc' ? 'Story card' : 'Scenario'}:\n${clip(source.scenario, target === 'npc' ? LIMITS.description : LIMITS.scenario)}`,
        );
    if (source.firstMessage?.trim()) parts.push(`First message:\n${clip(source.firstMessage, LIMITS.firstMessage)}`);
    return { system: SYSTEMS[target], user: parts.join('\n\n') };
}

/** The first JSON value in a text (code fences, chatter around it). */
export function extractJson(text: string): unknown {
    const cleaned = text.replace(/```(?:json)?/gi, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        // look for the outermost object or array
    }
    const start = cleaned.search(/[[{]/);
    if (start < 0) return null;
    const open = cleaned[start];
    const close = open === '{' ? '}' : ']';
    const end = cleaned.lastIndexOf(close);
    if (end <= start) return null;
    try {
        return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
        return null;
    }
}

const asText = (value: unknown): string =>
    typeof value === 'string'
        ? value
        : Array.isArray(value)
          ? value.filter((v) => typeof v === 'string').join(', ')
          : '';

/** Palette and quality words that belong to the art style, not to a passport. */
const STYLE_TAG =
    /^(?:(?:pastel|vibrant|muted|vivid|bright|dark|soft|warm|cool|earth|neutral|light) colou?rs?|colou?rful|monochrome|limited palette|masterpiece|best quality|high quality|amazing quality|very aesthetic|absurdres|highres)$/i;

/** Danbooru tags as NovelAI reads them: spaces, not underscores; duplicates and style words dropped. */
function tags(value: unknown): string {
    return joinTags(
        splitTags(asText(value).replace(/_/g, ' '))
            .filter((tag) => !STYLE_TAG.test(tag))
            .join(', '),
    );
}

/** Passports from the answer; entries without a name or anything visual are dropped. */
export function parseGeneratedPassports(raw: unknown, fallbackName = ''): Passport[] {
    const data = typeof raw === 'string' ? extractJson(raw) : raw;
    const list = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray((data as { passports?: unknown }).passports)
          ? (data as { passports: unknown[] }).passports
          : [];
    const result: Passport[] = [];
    for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const kind = (PASSPORT_KINDS as readonly string[]).includes(String(o.kind))
            ? (o.kind as PassportKind)
            : 'character';
        const name = asText(o.name).trim() || (kind === 'character' ? fallbackName : '');
        if (!name) continue;
        const passport = defaultPassport(kind, name, newPassportId());
        passport.aliases = (Array.isArray(o.aliases) ? o.aliases.map(asText) : asText(o.aliases).split(','))
            .map((a) => a.trim())
            .filter((a) => a && a.toLowerCase() !== name.toLowerCase());
        if (kind === 'character') {
            for (const field of FIELDS) passport.slots[field] = tags(o[field]);
            passport.outfits = (Array.isArray(o.outfits) ? o.outfits : [])
                .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
                .map((x) => ({ name: asText(x.name).trim(), tags: tags(x.tags) }))
                .filter((x) => x.name && x.tags);
            passport.nsfw = { enabled: false, tags: tags(o.nsfw) };
            // Only named outfits: the first one is worn by default.
            if (!passport.slots.clothing && passport.outfits[0]) passport.activeOutfit = passport.outfits[0].name;
        } else {
            passport.tags = tags(o.tags);
        }
        passport.negative = tags(o.negative);
        const visual =
            kind === 'character'
                ? PASSPORT_SLOTS.some((slot) => passport.slots[slot]) || passport.outfits.length > 0
                : passport.tags !== '';
        if (visual) result.push(passport);
    }
    return result;
}

/** Sentences of a text that name a character (any spelling the name matcher accepts), joined. */
export function sentencesNaming(text: string, names: readonly string[]): string {
    return text
        .split(/(?<=[.!?…])\s+|\n+/)
        .filter((sentence) => sentence.trim() && mentionIndex(sentence, names) >= 0)
        .join(' ')
        .trim();
}
