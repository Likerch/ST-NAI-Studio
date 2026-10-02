// Appearance passport (TZ Phase 4): a character's permanent tags, stored in the card
// (data.extensions.nai_studio.passport) so it travels with export/import. Pure.

export const PASSPORT_SLOTS = ['base', 'hair', 'eyes', 'body', 'skin', 'clothing', 'accessories', 'style'] as const;
export type PassportSlot = (typeof PASSPORT_SLOTS)[number];

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

export function defaultPassport(): Passport {
    return {
        version: 1,
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
    const result = defaultPassport();
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
    const states = passport.states.filter((s) => s.enabled || options.states?.includes(s.id)).map((s) => s.tags);
    const nsfw = options.allowNsfw && passport.nsfw.enabled ? passport.nsfw.tags : '';
    return joinTags(
        passport.slots.base,
        passport.slots.hair,
        passport.slots.eyes,
        passport.slots.body,
        passport.slots.skin,
        clothingTags(passport, options.outfit),
        passport.slots.accessories,
        ...states,
        nsfw,
        passport.slots.style,
    );
}

export function isPassportEmpty(passport: Passport | null): boolean {
    if (!passport) return true;
    return (
        PASSPORT_SLOTS.every((slot) => !passport.slots[slot].trim()) &&
        !passport.outfits.length &&
        !passport.nsfw.tags.trim()
    );
}
