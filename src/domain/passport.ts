// Appearance passport (TZ Phase 4): a character's permanent tags, stored in the card
// (data.extensions.nai_studio) so it travels with export/import. Pure.
// A card can carry several passports (v0.8): every character it describes, and the world,
// locations, the scenario or objects (their visual tags), because a card is not always one person.

export const PASSPORT_SLOTS = ['base', 'hair', 'eyes', 'body', 'skin', 'clothing', 'accessories', 'style'] as const;
export type PassportSlot = (typeof PASSPORT_SLOTS)[number];

/** What a passport describes; only characters take part in scenes, the rest add setting tags. */
export const PASSPORT_KINDS = ['character', 'world', 'location', 'scenario', 'object'] as const;
export type PassportKind = (typeof PASSPORT_KINDS)[number];

/** Id of the passport kept by versions before 0.8 (one passport per card). */
export const LEGACY_PASSPORT_ID = 'main';

/** Built-in state modifiers (names are localized as naist.state.<id>). */
export const STATE_PRESETS: Readonly<Record<string, string>> = {
    wet: 'wet, wet hair, wet clothes',
    messy: 'messy hair, disheveled',
    tears: 'tears, crying',
    blush: 'blush, embarrassed',
    injured: 'injury, bandages, bruise',
    sleepy: 'sleepy, half-closed eyes',
    angry: 'angry, frown',
    happy: 'smile, happy',
};

export interface Outfit {
    name: string;
    tags: string;
}

export interface PassportState {
    /** Preset id (STATE_PRESETS) or a custom name. */
    id: string;
    tags: string;
    enabled: boolean;
}

export interface Passport {
    version: 1;
    /** Stable id inside the card. */
    id: string;
    kind: PassportKind;
    /** Who or what it is; '' means the card (or persona) itself. */
    name: string;
    /** Other names the text uses (nicknames, short names, names in other languages). */
    aliases: string[];
    /** Visual tags of a world, location, scenario or object (characters use the slots). */
    tags: string;
    slots: Record<PassportSlot, string>;
    nsfw: { enabled: boolean; tags: string };
    outfits: Outfit[];
    /** Name of the active outfit; '' uses the "clothing" slot. */
    activeOutfit: string;
    states: PassportState[];
    /** Personal undesired content of the character. */
    negative: string;
    /** Default pose preset id ('' = none) and extra pose tags. */
    pose: { preset: string; custom: string };
    /** Default canvas position, null = automatic layout. */
    position: { x: number; y: number } | null;
}

export function newPassportId(): string {
    return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultPassport(kind: PassportKind = 'character', name = '', id = newPassportId()): Passport {
    return {
        version: 1,
        id,
        kind,
        name,
        aliases: [],
        tags: '',
        slots: { base: '', hair: '', eyes: '', body: '', skin: '', clothing: '', accessories: '', style: '' },
        nsfw: { enabled: false, tags: '' },
        outfits: [],
        activeOutfit: '',
        states: Object.entries(STATE_PRESETS).map(([id, tags]) => ({ id, tags, enabled: false })),
        negative: '',
        pose: { preset: '', custom: '' },
        position: null,
    };
}

function str(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function obj(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function unit(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

/** Defensive parse of a stored passport (hand-edited cards, older versions). Null when absent. */
export function normalizePassport(raw: unknown): Passport | null {
    if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const source = obj(raw);
    const kind = (PASSPORT_KINDS as readonly string[]).includes(str(source.kind))
        ? (source.kind as PassportKind)
        : 'character';
    const result = defaultPassport(kind, str(source.name).trim(), str(source.id).trim() || LEGACY_PASSPORT_ID);
    result.aliases = (Array.isArray(source.aliases) ? source.aliases.map(str) : str(source.aliases).split(','))
        .map((a) => a.trim())
        .filter(Boolean);
    result.tags = str(source.tags);
    const slots = obj(source.slots);
    for (const slot of PASSPORT_SLOTS) result.slots[slot] = str(slots[slot]);
    const nsfw = obj(source.nsfw);
    result.nsfw = { enabled: nsfw.enabled === true, tags: str(nsfw.tags) };
    result.outfits = (Array.isArray(source.outfits) ? source.outfits : [])
        .map(obj)
        .map((o) => ({ name: str(o.name).trim(), tags: str(o.tags) }))
        .filter((o) => o.name);
    result.activeOutfit = result.outfits.some((o) => o.name === str(source.activeOutfit))
        ? str(source.activeOutfit)
        : '';
    if (Array.isArray(source.states)) {
        const stored = source.states
            .map(obj)
            .map((s) => ({ id: str(s.id).trim(), tags: str(s.tags), enabled: s.enabled === true }));
        const byId = new Map(stored.filter((s) => s.id).map((s) => [s.id, s]));
        result.states = [
            ...result.states.map((preset) => byId.get(preset.id) ?? preset),
            ...stored.filter((s) => s.id && !(s.id in STATE_PRESETS)),
        ];
    }
    result.negative = str(source.negative);
    const pose = obj(source.pose);
    result.pose = { preset: str(pose.preset), custom: str(pose.custom) };
    const position = obj(source.position);
    result.position =
        source.position && typeof source.position === 'object'
            ? { x: unit(position.x, 0.5), y: unit(position.y, 0.5) }
            : null;
    return result;
}

/**
 * The passports of a card: the list (v0.8) or the single legacy passport. Ids are made unique so
 * every passport can be addressed.
 */
export function normalizePassportList(list: unknown, legacy?: unknown): Passport[] {
    const raw = Array.isArray(list) ? list : legacy !== undefined && legacy !== null ? [legacy] : [];
    const result: Passport[] = [];
    const ids = new Set<string>();
    for (const item of raw) {
        const passport = normalizePassport(item);
        if (!passport) continue;
        let id = passport.id;
        for (let n = 2; ids.has(id); n++) id = `${passport.id}-${n}`;
        passport.id = id;
        ids.add(id);
        result.push(passport);
    }
    return result;
}

/** The passport that stands for the card itself: unnamed or named like the card, else the first character. */
export function primaryPassport(list: readonly Passport[], cardName: string): Passport | null {
    const people = list.filter((p) => p.kind === 'character');
    const name = cardName.trim().toLowerCase();
    return people.find((p) => !p.name || p.name.trim().toLowerCase() === name) ?? people[0] ?? null;
}

/** Splits a tag string, trims, drops empties and case-insensitive duplicates (first wins). */
export function splitTags(text: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of text.split(/,|\n/)) {
        const tag = raw.trim();
        const key = tag.toLowerCase();
        if (!tag || seen.has(key)) continue;
        seen.add(key);
        result.push(tag);
    }
    return result;
}

export function joinTags(...parts: string[]): string {
    return splitTags(parts.filter(Boolean).join(', ')).join(', ');
}

export interface PassportOptions {
    /** Outfit name override; undefined uses the passport's active outfit. */
    outfit?: string;
    /** State ids to force on in addition to the enabled ones. */
    states?: string[];
    /** Global permission for the NSFW layer (the passport switch must be on too). */
    allowNsfw: boolean;
    /** Leave out clothing and outfits (the current look comes from elsewhere, e.g. a tracker). */
    withoutClothing?: boolean;
}

/** Tags of the clothing slot or the chosen outfit. */
export function clothingTags(passport: Passport, outfit?: string): string {
    const name = outfit ?? passport.activeOutfit;
    const found = passport.outfits.find((o) => o.name === name);
    return found ? found.tags : passport.slots.clothing;
}

/**
 * The passport as one tag list in a stable order: base, hair, eyes, body, skin, clothing/outfit,
 * accessories, states, NSFW layer, art style.
 */
export function passportTags(passport: Passport, options: PassportOptions): string {
    if (passport.kind !== 'character') return joinTags(passport.tags);
    const states = passport.states.filter((s) => s.enabled || options.states?.includes(s.id)).map((s) => s.tags);
    const nsfw = options.allowNsfw && passport.nsfw.enabled ? passport.nsfw.tags : '';
    return joinTags(
        passport.slots.base,
        passport.slots.hair,
        passport.slots.eyes,
        passport.slots.body,
        passport.slots.skin,
        options.withoutClothing ? '' : clothingTags(passport, options.outfit),
        passport.slots.accessories,
        ...states,
        nsfw,
        passport.slots.style,
    );
}

export function isPassportEmpty(passport: Passport | null): boolean {
    if (!passport) return true;
    if (passport.kind !== 'character') return !passport.tags.trim();
    return (
        PASSPORT_SLOTS.every((slot) => !passport.slots[slot].trim()) &&
        !passport.outfits.length &&
        !passport.nsfw.tags.trim()
    );
}
