// What a DES portrait was drawn from (v0.13.2), pure. The "state" policy redraws a portrait only when the
// drawn identity changes:
// - a character with a passport: the passport id, its tags, the active outfit and the enabled states (what
//   Maestro's wardrobe changes). The tracker's wording of the look is left out: the model rewrites it almost
//   every reply, and a portrait per rewording was a new picture every turn;
// - a character without a passport: the tracker look, compared as a normalised word set (lower case,
//   punctuation and spaces collapsed, Russian / English stop words out, a Russian ending or an English plural
//   "s" off, words cut to five letters, sorted); it has to change by more than a threshold (word-set Jaccard
//   below 0.6) against the look of the last portrait.
// Records live in chatMetadata.nai_studio.desPortraits by character name; a record written before 0.13.2
// (a bare hash) or none at all for a portrait DES drew counts as current: no redraw, it becomes the baseline.
// Since v0.14 a record also keeps the chat's own portrait image (a file path, never a data URL): DES keeps
// one portrait per name for every chat, so NAI Studio puts the chat's own back when the chat opens, and a
// character without a card passport has a portrait in a chat only when that chat recorded one.
import words from '../data/look-words.json';
import { lookKey, passportTags } from './passport';
import type { Passport } from './passport';
import { hasCyrillic } from './translate';

export type PortraitPolicy = 'missing' | 'state' | 'every';

/** Word-set similarity (Jaccard) below which a look without a passport counts as a new look. */
export const PORTRAIT_LOOK_THRESHOLD = 0.6;
/** Words are cut to this many letters (after the ending): the wording changes word forms. */
const STEM_LENGTH = 5;
/** An ending is taken off only when this many letters stay. */
const MIN_STEM = 3;
/** A stored look longer than this is cut. */
const MAX_STORED_LOOK = 1000;

export interface DesPortraitRecord {
    /** Hash of the drawn identity (the passport part, or "look" for a character without a passport). */
    hash: string;
    /** The tracker look the portrait was drawn with, as written. */
    look?: string;
    /** The portrait of this chat (v0.14): a file path or URL, never a data URL. */
    image?: string;
}

const STOP_WORDS = new Set([...words.stop.en, ...words.stop.ru].map(lookKey));
/** Russian endings of adjectives, nouns and participles, longest first. */
const RU_ENDINGS = words.endings.ru.map(lookKey).sort((a, b) => b.length - a.length);

/** A word without its ending (a Russian case ending, an English plural "s"), cut to a stem. */
function stem(word: string): string {
    let base = word;
    if (hasCyrillic(word)) {
        const ending = RU_ENDINGS.find((end) => word.endsWith(end) && [...word].length - [...end].length >= MIN_STEM);
        if (ending) base = word.slice(0, -ending.length);
    } else if (/^[a-z]{4,}$/.test(word) && /[^su]s$/.test(word)) {
        base = word.slice(0, -1);
    }
    return [...base].slice(0, STEM_LENGTH).join('');
}

function textHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    return (hash >>> 0).toString(16);
}

/** The normalised words of a look: no stop words, stems, no duplicates, sorted. */
export function lookTokens(look: string): string[] {
    const tokens = new Set<string>();
    for (const word of lookKey(look).split(' ')) {
        if ([...word].length < 2 || STOP_WORDS.has(word)) continue;
        tokens.add(stem(word));
    }
    return [...tokens].sort();
}

/** Similarity of two looks by their normalised words (Jaccard); two empty looks are the same. */
export function lookSimilarity(a: string, b: string): number {
    const x = new Set(lookTokens(a));
    const y = new Set(lookTokens(b));
    if (!x.size && !y.size) return 1;
    let common = 0;
    for (const token of x) if (y.has(token)) common++;
    return common / (x.size + y.size - common);
}

/** A look changed enough for a new portrait of a character without a passport. */
export function lookChanged(before: string, now: string): boolean {
    return lookSimilarity(before, now) < PORTRAIT_LOOK_THRESHOLD;
}

/** The identity a portrait is drawn from: the passport part, or only "look" without a passport. */
export function portraitIdentity(passport: Passport | null | undefined): string {
    if (!passport) return 'look';
    const states = passport.states
        .filter((state) => state.enabled)
        .map((state) => state.id)
        .sort()
        .join(',');
    return ['passport', passport.id, passportTags(passport, { allowNsfw: false }), passport.activeOutfit, states].join(
        '|',
    );
}

/** The record of a portrait drawn now. */
export function portraitRecord(passport: Passport | null | undefined, look: string): DesPortraitRecord {
    return { hash: textHash(portraitIdentity(passport)), look: look.trim().slice(0, MAX_STORED_LOOK) };
}

/** A stored record; null for none and for records written before 0.13.2 (a bare hash string). */
export function readPortraitRecord(raw: unknown): DesPortraitRecord | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const source = raw as Record<string, unknown>;
    if (typeof source.hash !== 'string') return null;
    return {
        hash: source.hash,
        ...(typeof source.look === 'string' ? { look: source.look } : {}),
        ...(typeof source.image === 'string' && source.image && !isDataUrl(source.image)
            ? { image: source.image }
            : {}),
    };
}

/** draw: a new portrait; keep: the portrait stays; adopt: it stays and the current record becomes its record. */
export type PortraitDecision = 'draw' | 'keep' | 'adopt';

export interface PortraitCheck {
    policy: PortraitPolicy;
    /** The character has a portrait now. */
    exists: boolean;
    /** What the chat keeps for the character's portrait (a record, an old hash, nothing). */
    stored: unknown;
    /** The record a portrait drawn now would get. */
    current: DesPortraitRecord;
    /** The character has a passport (else the look is compared). */
    passport: boolean;
}

/** Whether an automatic portrait is due (the menu's "new portrait" always draws). */
export function portraitDecision(check: PortraitCheck): PortraitDecision {
    if (!check.exists || check.policy === 'every') return 'draw';
    if (check.policy !== 'state') return 'keep';
    const before = readPortraitRecord(check.stored);
    // No record, or one whose drawn identity is unknown (a pre-0.13.2 hash given its image in v0.14).
    if (!before?.hash) return 'adopt';
    if (before.hash !== check.current.hash) return 'draw';
    if (check.passport) return 'keep';
    if (before.look === undefined) return 'adopt';
    return lookChanged(before.look, check.current.look ?? '') ? 'draw' : 'keep';
}

// ---- per-chat portraits (v0.14) -------------------------------------------------------------------

/** The folder of DES's own portrait files: DES deletes them when nothing of its own points at them. */
const DES_PORTRAIT_FOLDER = '/user/images/des-portraits/';

export function isDataUrl(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith('data:');
}

/** A portrait file DES manages (and may delete): a copy keeps it for the chat. */
export function isDesManagedPortrait(value: unknown): boolean {
    return typeof value === 'string' && value.includes(DES_PORTRAIT_FOLDER);
}

/** A portrait value without its cache-busting query: DES re-saves a file under the same name with "?t=". */
export function portraitKey(value: unknown): string {
    if (typeof value !== 'string' || !value) return '';
    if (isDataUrl(value)) return value;
    const cut = value.search(/[?#]/);
    return cut < 0 ? value : value.slice(0, cut);
}

export function samePortrait(a: unknown, b: unknown): boolean {
    return portraitKey(a) === portraitKey(b);
}

/**
 * A portrait some /sd call drew (NAI Studio's and the built-in one save into /user/images) or a chat's
 * copy of one: not something the user uploaded in DES (DES keeps uploads in its own folder or as data).
 */
export function isDrawnPortrait(value: unknown): boolean {
    const key = portraitKey(value);
    return !isDataUrl(key) && key.startsWith('/user/images/') && !key.startsWith(DES_PORTRAIT_FOLDER);
}

/** A record with the chat's image; a bare pre-0.13.2 hash keeps "identity unknown" (an empty hash). */
export function recordWithImage(raw: unknown, image: string): DesPortraitRecord {
    return { ...(readPortraitRecord(raw) ?? { hash: '' }), image };
}

/** File name (without the extension) of a chat's copy of a portrait: the same source gives the same name. */
export function portraitFileName(name: string, source: string): string {
    const slug = name.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'npc';
    return `${slug}-${textHash(portraitKey(source))}`;
}

/**
 * Whose a character's portrait is: "card" for a character with a card passport (the one portrait DES keeps
 * serves every chat, as before v0.14), "chat" for a character whose passport is the chat's own, a passport
 * provider's, excluded in this chat or absent (the portrait belongs to the chat that drew or recorded it).
 */
export type PortraitScope = 'card' | 'chat';

export interface PortraitPresence {
    scope: PortraitScope;
    /** DES's current portrait for the name. */
    avatar: string | undefined;
    /** What this chat keeps for the name (a record, an old hash, nothing). */
    stored: unknown;
    /** DES's portrait for the name when the chat was opened (after its own portraits were put back). */
    baseline: string | undefined;
}

/**
 * Whether the character has a portrait in this chat. A "chat" character counts only with a record of
 * this chat; a portrait that appeared or changed while the chat is open (the Workshop, DES's own menu) is
 * the chat's and is adopted; what another chat left in DES is missing here.
 */
export function portraitPresence(input: PortraitPresence): { exists: boolean; adopt: boolean } {
    if (!input.avatar) return { exists: false, adopt: false };
    if (input.scope === 'card' || input.stored) return { exists: true, adopt: false };
    return samePortrait(input.avatar, input.baseline) ? { exists: false, adopt: false } : { exists: true, adopt: true };
}

/** A record written before v0.14 (a bare hash, or a record without an image). */
export function isLegacyRecord(raw: unknown): boolean {
    if (typeof raw === 'string') return raw.length > 0;
    const record = readPortraitRecord(raw);
    return record !== null && !record.image;
}

export interface PortraitRestore {
    name: string;
    image: string;
    /** The record had no image: the snapshot taken when v0.14 started becomes its image. */
    backfill: boolean;
}

/**
 * The portraits to put back into DES when a chat opens: each record's image, and for a record from before
 * v0.14 the portrait DES held for that name when v0.14 first started (what every chat saw then). Only
 * names whose DES portrait differs, plus records that get their image now.
 */
export function portraitsToRestore(
    records: Readonly<Record<string, unknown>>,
    legacy: Readonly<Record<string, string>> | null | undefined,
    avatars: Readonly<Record<string, unknown>> | null | undefined,
): PortraitRestore[] {
    const result: PortraitRestore[] = [];
    for (const [name, raw] of Object.entries(records)) {
        const own = readPortraitRecord(raw)?.image;
        const backfill = !own && isLegacyRecord(raw) && typeof legacy?.[name] === 'string' && legacy[name] !== '';
        const image = own ?? (backfill ? legacy![name]! : '');
        if (!image) continue;
        if (backfill || !samePortrait(avatars?.[name], image)) result.push({ name, image, backfill });
    }
    return result;
}

/** DES's portraits as a snapshot for chats recorded before v0.14: file paths only, no data URLs. */
export function legacyPortraitSnapshot(
    avatars: Readonly<Record<string, unknown>> | null | undefined,
): Record<string, string> {
    const snapshot: Record<string, string> = {};
    for (const [name, value] of Object.entries(avatars ?? {})) {
        if (typeof value === 'string' && value && !isDataUrl(value)) snapshot[name] = value;
    }
    return snapshot;
}
