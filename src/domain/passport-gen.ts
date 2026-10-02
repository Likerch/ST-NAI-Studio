// Passports written by an LLM from a character card or a persona description (v0.8). Pure: the
// prompt, the JSON schema for Chat Completion and a forgiving parser of the answer.
import { defaultPassport, joinTags, newPassportId, PASSPORT_KINDS, PASSPORT_SLOTS } from './passport';
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
    'Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent; leave a field empty when unknown. Keep names as written in the card. No quality or art style tags.',
].join('\n');

const SYSTEM_PERSONA = [
    "You read the description of the player's persona in a roleplay and write one visual passport for an image generator (NovelAI, Danbooru tags).",
    'Answer only with JSON: {"passports": [ one entry of kind "character" ]} with the fields name, aliases, base (count tag and what they are: "1girl, adult", "1boy, elf"), hair, eyes, body, skin, clothing, accessories, outfits ({"name","tags"}), nsfw (explicit body details only if given), negative.',
    'Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent; leave a field empty when unknown. No quality or art style tags.',
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

/** System and user messages for a card or a persona. */
export function passportGenMessages(
    source: PassportSource,
    target: 'card' | 'persona',
): { system: string; user: string } {
    const parts = [
        `${target === 'card' ? 'Card' : 'Persona'}: ${source.name}`,
        `Description:\n${clip(source.description, LIMITS.description)}`,
    ];
    if (source.personality?.trim()) parts.push(`Personality:\n${clip(source.personality, LIMITS.personality)}`);
    if (source.scenario?.trim()) parts.push(`Scenario:\n${clip(source.scenario, LIMITS.scenario)}`);
    if (source.firstMessage?.trim()) parts.push(`First message:\n${clip(source.firstMessage, LIMITS.firstMessage)}`);
    return { system: target === 'card' ? SYSTEM_CARD : SYSTEM_PERSONA, user: parts.join('\n\n') };
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

/** Danbooru tags as NovelAI reads them: spaces, not underscores; duplicates dropped. */
function tags(value: unknown): string {
    return joinTags(asText(value).replace(/_/g, ' '));
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
