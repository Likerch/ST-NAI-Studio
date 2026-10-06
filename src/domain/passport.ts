// Appearance passport (TZ Phase 4): a character's permanent tags, stored in the card
// (data.extensions.nai_studio) so it travels with export/import. Pure.
// A card can carry several passports (v0.8): every character it describes, and the world,
// locations, the scenario or objects (their visual tags), because a card is not always one person.
// Since v0.14 a passport NAI Studio wrote on its own from the DES tracker says so (`origin`).

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
    /**
     * Wordings of a scene tracker (DES) known to mean this outfit, any language, newest last (v0.12.1;
     * Maestro's wardrobe writes them): a current look that says one of them draws this outfit instead.
     */
    looks?: string[];
}

/** At most this many tracker wordings per outfit (the newest are kept). */
export const MAX_OUTFIT_LOOKS = 12;
/** A tracker wording longer than this is cut. */
export const MAX_LOOK_LENGTH = 300;
/** Word-set similarity (Jaccard) from which a current look counts as a recorded wording. */
export const LOOK_MATCH_THRESHOLD = 0.75;

export interface PassportState {
    /** Preset id (STATE_PRESETS) or a custom name. */
    id: string;
    tags: string;
    enabled: boolean;
}

/** Who made a passport when NAI Studio made it on its own (v0.14): "auto-des" = from the DES tracker. */
export const PASSPORT_ORIGINS = ['auto-des'] as const;
export type PassportOrigin = (typeof PASSPORT_ORIGINS)[number];

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
    /**
     * Absent for passports people wrote (v0.14); "auto-des" for one NAI Studio wrote by itself for a new
     * character of the DES tracker. Kept through saves, chat overrides and moves into the card.
     */
    origin?: PassportOrigin;
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

/** The Cyrillic "yo" and "ye" (U+0451, U+0435): a tracker writes either. */
const YO = new RegExp(String.fromCharCode(0x451), 'g');
const YE = String.fromCharCode(0x435);

/**
 * A wording reduced for comparison: lower case, "yo" as "ye", punctuation (quotes, dashes, Russian
 * ones too) and runs of spaces as one space.
 */
export function lookKey(text: string): string {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replace(YO, YE)
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

/** Defensive parse of an outfit's tracker wordings: strings, trimmed, cut, no duplicates, the newest kept. */
export function normalizeOutfitLooks(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of raw) {
        if (typeof item !== 'string') continue;
        const look = item.trim().slice(0, MAX_LOOK_LENGTH).trim();
        const key = lookKey(look);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(look);
    }
    return result.slice(-MAX_OUTFIT_LOOKS);
}

/** Defensive parse of a stored outfit; `looks` only when there are some. */
export function normalizeOutfit(raw: unknown): Outfit {
    const source = obj(raw);
    const looks = normalizeOutfitLooks(source.looks);
    return { name: str(source.name).trim(), tags: str(source.tags), ...(looks.length ? { looks } : {}) };
}

/** Words of a reduced wording (two letters or more). */
function lookWords(key: string): Set<string> {
    return new Set(key.split(' ').filter((word) => [...word].length >= 2));
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
    if (!a.size || !b.size) return 0;
    let common = 0;
    for (const item of a) if (b.has(item)) common++;
    return common / (a.size + b.size - common);
}

/**
 * The outfit a current look of a scene tracker stands for (v0.12.1): the outfit whose recorded wordings
 * (`looks`) say the same, exactly after lookKey first, else by word sets (Jaccard >= 0.75). A tracker
 * joins several fields into one look ("appearance; outfit; status"), so the look and each of its parts
 * are compared. '' when none fits, or for a passport that is not a character.
 */
export function outfitForLook(passport: Passport | null | undefined, look: string | null | undefined): string {
    if (!passport || passport.kind !== 'character' || typeof look !== 'string' || !look.trim()) return '';
    const outfits = passport.outfits.filter((o) => o.name && o.looks?.length);
    if (!outfits.length) return '';
    const parts = look.split(/[;\n]+/);
    const keys = [...new Set([look, ...(parts.length > 1 ? parts : [])].map(lookKey).filter(Boolean))];
    for (const outfit of outfits) {
        const recorded = new Set((outfit.looks ?? []).map(lookKey));
        if (keys.some((key) => recorded.has(key))) return outfit.name;
    }
    const words = keys.map(lookWords);
    let best = '';
    let bestScore = 0;
    for (const outfit of outfits) {
        for (const wording of outfit.looks ?? []) {
            const recorded = lookWords(lookKey(wording));
            for (const set of words) {
                const score = jaccard(set, recorded);
                if (score >= LOOK_MATCH_THRESHOLD && score > bestScore) {
                    best = outfit.name;
                    bestScore = score;
                }
            }
        }
    }
    return best;
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
    result.outfits = (Array.isArray(source.outfits) ? source.outfits : []).map(normalizeOutfit).filter((o) => o.name);
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
    if ((PASSPORT_ORIGINS as readonly unknown[]).includes(source.origin))
        result.origin = source.origin as PassportOrigin;
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

/** Explicit anatomy (v0.9.8): it belongs to the NSFW layer and stays out of other scenes. */
const EXPLICIT_ANATOMY =
    /(^|\s)(futanari|futa|dickgirl|penis|testicles?|erection|flaccid|foreskin|pussy|vagina|clitoris|nipples?|areolae?|pubic hair)(\s|$)/i;

export function isExplicitAnatomy(tag: string): boolean {
    return EXPLICIT_ANATOMY.test(tag);
}

/** A futanari: the tag in the NSFW layer or in any slot. */
export function isFutanari(passport: Passport): boolean {
    const all = [passport.nsfw.tags, ...PASSPORT_SLOTS.map((slot) => passport.slots[slot])].join(', ');
    return splitTags(all).some((tag) => /^(futanari|futa|dickgirl)$/i.test(tag));
}

/** Moves explicit anatomy from the slots and outfits into the NSFW layer. */
export function moveExplicitAnatomy(passport: Passport): void {
    const moved: string[] = [];
    const keep = (text: string) =>
        splitTags(text)
            .filter((tag) => (isExplicitAnatomy(tag) ? (moved.push(tag), false) : true))
            .join(', ');
    for (const slot of PASSPORT_SLOTS) if (slot !== 'style') passport.slots[slot] = keep(passport.slots[slot]);
    passport.outfits = passport.outfits.map((o) => ({ ...o, tags: keep(o.tags) }));
    if (moved.length) passport.nsfw = { ...passport.nsfw, tags: joinTags(passport.nsfw.tags, ...moved) };
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
    const layer = options.allowNsfw && passport.nsfw.enabled;
    const nsfw = layer ? passport.nsfw.tags : '';
    const tags = joinTags(
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
    // Without the NSFW layer explicit anatomy stays out, wherever it was written.
    return layer
        ? tags
        : splitTags(tags)
              .filter((tag) => !isExplicitAnatomy(tag))
              .join(', ');
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
