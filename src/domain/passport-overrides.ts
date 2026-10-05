// Chat-level passports (v0.10): a chat may change the passport of a card or persona without touching
// the card (an override keeps only the fields that differ, so later card edits of other fields still
// show through), and may have passports of its own. Stored in chat_metadata.nai_studio.passports. Pure.
import { normalizeOutfit, normalizePassport, normalizePassportList, PASSPORT_KINDS, PASSPORT_SLOTS } from './passport';
import type { Outfit, Passport, PassportKind, PassportSlot, PassportState } from './passport';

/** The fields of a passport a chat changes; absent fields come from the card. */
export interface PassportOverride {
    /**
     * Whose passport it is: the card's avatar file ("Alice.png") or "persona:<avatar>". Absent: any
     * passport with this id (ids are unique inside a card, legacy cards may share "main").
     */
    owner?: string;
    name?: string;
    kind?: PassportKind;
    aliases?: string[];
    tags?: string;
    slots?: Partial<Record<PassportSlot, string>>;
    nsfw?: { enabled?: boolean; tags?: string };
    outfits?: Outfit[];
    activeOutfit?: string;
    /** States changed or added in the chat, by id (a chat cannot remove a state of the card). */
    states?: PassportState[];
    negative?: string;
    pose?: { preset: string; custom: string };
    position?: { x: number; y: number } | null;
}

export interface ChatPassports {
    /** Overrides by passport id. */
    overrides: Record<string, PassportOverride>;
    /** Passports that exist only in this chat. */
    extra: Passport[];
}

export function emptyChatPassports(): ChatPassports {
    return { overrides: {}, extra: [] };
}

function obj(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

const isString = (value: unknown): value is string => typeof value === 'string';

const sameStrings = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((item, i) => item === b[i]);

const sameOutfits = (a: readonly Outfit[], b: readonly Outfit[]) =>
    a.length === b.length &&
    a.every((o, i) => o.name === b[i]?.name && o.tags === b[i]?.tags && sameStrings(o.looks ?? [], b[i]?.looks ?? []));

/** A copy of an outfit (its tracker wordings too, v0.12.1). */
const outfitCopy = (o: Outfit): Outfit => ({ ...o, ...(o.looks ? { looks: [...o.looks] } : {}) });

const samePosition = (a: Passport['position'], b: Passport['position']) =>
    a === null || b === null ? a === b : a.x === b.x && a.y === b.y;

/** The fields of `edited` that differ from `base` (an empty object when nothing changed). */
export function passportDiff(base: Passport, edited: Passport): PassportOverride {
    const diff: PassportOverride = {};
    if (edited.name !== base.name) diff.name = edited.name;
    if (edited.kind !== base.kind) diff.kind = edited.kind;
    if (!sameStrings(edited.aliases, base.aliases)) diff.aliases = [...edited.aliases];
    if (edited.tags !== base.tags) diff.tags = edited.tags;
    const slots: Partial<Record<PassportSlot, string>> = {};
    for (const slot of PASSPORT_SLOTS) if (edited.slots[slot] !== base.slots[slot]) slots[slot] = edited.slots[slot];
    if (Object.keys(slots).length) diff.slots = slots;
    const nsfw: { enabled?: boolean; tags?: string } = {};
    if (edited.nsfw.enabled !== base.nsfw.enabled) nsfw.enabled = edited.nsfw.enabled;
    if (edited.nsfw.tags !== base.nsfw.tags) nsfw.tags = edited.nsfw.tags;
    if (Object.keys(nsfw).length) diff.nsfw = nsfw;
    if (!sameOutfits(edited.outfits, base.outfits)) diff.outfits = edited.outfits.map(outfitCopy);
    if (edited.activeOutfit !== base.activeOutfit) diff.activeOutfit = edited.activeOutfit;
    const states = edited.states.filter((state) => {
        const original = base.states.find((s) => s.id === state.id);
        return !original || original.tags !== state.tags || original.enabled !== state.enabled;
    });
    if (states.length) diff.states = states.map((s) => ({ ...s }));
    if (edited.negative !== base.negative) diff.negative = edited.negative;
    if (edited.pose.preset !== base.pose.preset || edited.pose.custom !== base.pose.custom)
        diff.pose = { ...edited.pose };
    if (!samePosition(edited.position, base.position)) diff.position = edited.position ? { ...edited.position } : null;
    return diff;
}

/** No field is overridden (the owner alone does not count). */
export function isOverrideEmpty(override: PassportOverride | null | undefined): boolean {
    return !override || Object.keys(override).every((key) => key === 'owner');
}

/** The passport as the chat sees it: a new copy, the base untouched. */
export function applyPassportOverride(base: Passport, override?: PassportOverride | null): Passport {
    if (isOverrideEmpty(override)) return normalizePassport(base) ?? base;
    const o = override!;
    const states = base.states.map((s) => ({ ...s }));
    for (const state of o.states ?? []) {
        const at = states.findIndex((s) => s.id === state.id);
        if (at >= 0) states[at] = { ...state };
        else states.push({ ...state });
    }
    const merged = {
        ...base,
        name: o.name ?? base.name,
        kind: o.kind ?? base.kind,
        aliases: o.aliases ?? base.aliases,
        tags: o.tags ?? base.tags,
        slots: { ...base.slots, ...o.slots },
        nsfw: { ...base.nsfw, ...o.nsfw },
        outfits: o.outfits ?? base.outfits,
        activeOutfit: o.activeOutfit ?? base.activeOutfit,
        states,
        negative: o.negative ?? base.negative,
        pose: o.pose ?? base.pose,
        position: 'position' in o ? (o.position ?? null) : base.position,
    };
    const result = normalizePassport(merged) ?? base;
    result.id = base.id;
    return result;
}

/** Defensive parse of a stored override (hand-edited metadata, newer versions); null when unusable. */
export function normalizeOverride(raw: unknown): PassportOverride | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const source = obj(raw);
    const result: PassportOverride = {};
    if (isString(source.owner) && source.owner.trim()) result.owner = source.owner.trim();
    if (isString(source.name)) result.name = source.name;
    if ((PASSPORT_KINDS as readonly unknown[]).includes(source.kind)) result.kind = source.kind as PassportKind;
    if (Array.isArray(source.aliases)) result.aliases = source.aliases.filter(isString);
    if (isString(source.tags)) result.tags = source.tags;
    const slots: Partial<Record<PassportSlot, string>> = {};
    const rawSlots = obj(source.slots);
    for (const slot of PASSPORT_SLOTS) if (isString(rawSlots[slot])) slots[slot] = rawSlots[slot];
    if (Object.keys(slots).length) result.slots = slots;
    const rawNsfw = obj(source.nsfw);
    const nsfw: { enabled?: boolean; tags?: string } = {};
    if (typeof rawNsfw.enabled === 'boolean') nsfw.enabled = rawNsfw.enabled;
    if (isString(rawNsfw.tags)) nsfw.tags = rawNsfw.tags;
    if (Object.keys(nsfw).length) result.nsfw = nsfw;
    if (Array.isArray(source.outfits)) result.outfits = source.outfits.map(normalizeOutfit).filter((o) => o.name);
    if (isString(source.activeOutfit)) result.activeOutfit = source.activeOutfit;
    if (Array.isArray(source.states)) {
        const states = source.states
            .map(obj)
            .filter((s) => isString(s.id) && s.id.trim())
            .map((s) => ({
                id: String(s.id).trim(),
                tags: isString(s.tags) ? s.tags : '',
                enabled: s.enabled === true,
            }));
        if (states.length) result.states = states;
    }
    if (isString(source.negative)) result.negative = source.negative;
    if (typeof source.pose === 'object' && source.pose !== null) {
        const pose = obj(source.pose);
        result.pose = {
            preset: isString(pose.preset) ? pose.preset : '',
            custom: isString(pose.custom) ? pose.custom : '',
        };
    }
    if ('position' in source) {
        const position = obj(source.position);
        const x = Number(position.x);
        const y = Number(position.y);
        result.position =
            source.position && Number.isFinite(x) && Number.isFinite(y)
                ? { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
                : null;
    }
    return result;
}

/** Defensive parse of chat_metadata.nai_studio.passports. */
export function normalizeChatPassports(raw: unknown): ChatPassports {
    const source = obj(raw);
    const overrides: Record<string, PassportOverride> = {};
    for (const [id, value] of Object.entries(obj(source.overrides))) {
        const override = normalizeOverride(value);
        if (id.trim() && override && !isOverrideEmpty(override)) overrides[id] = override;
    }
    return { overrides, extra: normalizePassportList(source.extra) };
}

/**
 * The passport with the chat's override applied, when the override is for it (same id and, when the
 * override names one, the same owner). The base itself when there is none.
 */
export function resolveChatPassport(passport: Passport, owner: string | undefined, data: ChatPassports): Passport {
    const override = Object.prototype.hasOwnProperty.call(data.overrides, passport.id)
        ? data.overrides[passport.id]
        : undefined;
    if (!override || (override.owner && owner && override.owner !== owner)) return passport;
    return applyPassportOverride(passport, override);
}
