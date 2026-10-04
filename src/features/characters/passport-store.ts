// Passports (TZ Phase 4, several per card since v0.8): characters keep theirs in the card
// (data.extensions.nai_studio.passports, travels with export/import; the single "passport" of
// older versions is still read); user personas have no card, so theirs live in our settings.
// Since v0.10 a chat may override them (chat_metadata.nai_studio.passports: the fields that differ,
// by passport id) and have passports of its own; prompts and markers use the passports as the chat
// sees them, the card stays the default.
import { ctx, importHost } from '../../core/context';
import { saveSettings, settings } from '../../core/settings';
import {
    emptyChatPassports,
    isOverrideEmpty,
    normalizeChatPassports,
    normalizePassport,
    normalizePassportList,
    passportDiff,
    primaryPassport,
    resolveChatPassport,
} from '../../domain';
import type { ChatPassports, Passport } from '../../domain';
import { emitStudioEvent } from '../events/studio-events';
import { avatarKey, CARD_FIELD } from './character-prompts';

interface PersonasModule {
    user_avatar: string;
}

/** Key of chat_metadata where NAI Studio keeps its chat data. */
const META_KEY = 'nai_studio';
/** Prefix of the owner of a persona passport ("persona:<avatar>"), also the persona candidate key. */
export const PERSONA_OWNER_PREFIX = 'persona:';

const savedListeners = new Set<(index: number, passports: Passport[]) => void>();

/** Called after the passports of a card are saved (integrations keep their copies in sync). */
export function onPassportsSaved(listener: (index: number, passports: Passport[]) => void): void {
    savedListeners.add(listener);
}

function cardField(character: STCharacter | undefined): { passport?: unknown; passports?: unknown } | undefined {
    return character?.data?.extensions?.[CARD_FIELD] as { passport?: unknown; passports?: unknown } | undefined;
}

/** Every passport of the card (characters, world, locations, scenario, objects), as stored. */
export function cardPassports(character: STCharacter | undefined): Passport[] {
    const field = cardField(character);
    return normalizePassportList(field?.passports, field?.passport);
}

/** The passport of the card's own character (the composer, sprites and tools use it). */
export function cardPassport(character: STCharacter | undefined): Passport | null {
    return primaryPassport(cardPassports(character), character?.name ?? '');
}

/** Lazily loaded cards (shallow) have no extensions until unshallowed. */
export async function loadCharacter(index: number): Promise<STCharacter | undefined> {
    const c = ctx();
    const character = c.characters[index];
    if (character?.shallow) await c.unshallowCharacter(index);
    return ctx().characters[index];
}

/** Card indexes of the current chat: the 1:1 character or every group member. */
export function chatCardIndexes(): number[] {
    const c = ctx();
    if (c.groupId) {
        const members = c.groups?.find((g) => g.id === c.groupId)?.members ?? [];
        return members.map((avatar) => c.characters.findIndex((ch) => ch.avatar === avatar)).filter((i) => i >= 0);
    }
    if (c.characterId !== undefined && c.characterId !== null && c.characterId !== '') {
        const index = Number(c.characterId);
        return Number.isInteger(index) && c.characters[index] ? [index] : [];
    }
    return [];
}

/** Index of a card by its avatar file, with or without the extension; -1 when absent. */
export function cardIndexByAvatar(avatar: string): number {
    const characters = ctx().characters;
    const exact = characters.findIndex((ch) => ch.avatar === avatar);
    return exact >= 0 ? exact : characters.findIndex((ch) => avatarKey(ch.avatar) === avatarKey(avatar));
}

export async function saveCardPassports(index: number, passports: Passport[]): Promise<void> {
    const c = ctx();
    const character = await loadCharacter(index);
    if (!character) return;
    const existing = (character.data?.extensions?.[CARD_FIELD] as Record<string, unknown> | undefined) ?? {};
    // "passport" keeps the main character readable for versions before 0.8.
    const main = primaryPassport(passports, character.name);
    await c.writeExtensionField(index, CARD_FIELD, { ...existing, passports, passport: main ?? undefined });
    for (const listener of savedListeners) {
        try {
            listener(index, passports);
        } catch {
            // a listener's failure must not fail the save
        }
    }
    emitStudioEvent('passportsSaved', { ids: passports.map((p) => p.id), scope: 'card', avatar: character.avatar });
}

/** Replaces one passport of the card by id (or adds it). */
export async function saveCardPassport(index: number, passport: Passport): Promise<void> {
    const list = cardPassports(await loadCharacter(index));
    const at = list.findIndex((p) => p.id === passport.id);
    if (at >= 0) list[at] = passport;
    else list.push(passport);
    await saveCardPassports(index, list);
}

// ---- persona -------------------------------------------------------------------------------

let personas: PersonasModule | null = null;

export async function currentPersonaKey(): Promise<string> {
    try {
        personas ??= await importHost<PersonasModule>('/scripts/personas.js');
        return personas.user_avatar || 'default';
    } catch {
        return 'default';
    }
}

/** The current persona without waiting: its module is loaded once (`user_avatar` is a live binding). */
export function knownPersonaKey(): string {
    return personas?.user_avatar || 'default';
}

export function personaPassport(key: string): Passport | null {
    return normalizePassport(settings().scene.personaPassports[key]);
}

export function savePersonaPassport(key: string, passport: Passport): void {
    settings().scene.personaPassports[key] = passport;
    saveSettings();
    emitStudioEvent('passportsSaved', { ids: [passport.id], scope: 'card', persona: true });
}

export function personaOwner(key: string): string {
    return `${PERSONA_OWNER_PREFIX}${key}`;
}

// ---- chat level (v0.10) ----------------------------------------------------------------------

/** A chat is open (chat-scope passports can be saved). */
export function chatOpen(): boolean {
    try {
        return Boolean(ctx().getCurrentChatId?.());
    } catch {
        return false;
    }
}

/** Overrides and passports of the current chat (a copy; empty without a chat). */
export function chatPassportData(): ChatPassports {
    const meta = ctx().chatMetadata as Record<string, unknown> | undefined;
    const root = meta?.[META_KEY] as Record<string, unknown> | undefined;
    return root?.passports ? normalizeChatPassports(root.passports) : emptyChatPassports();
}

async function writeChatPassports(data: ChatPassports): Promise<void> {
    const c = ctx();
    const root = (c.chatMetadata[META_KEY] ??= {}) as Record<string, unknown>;
    if (!Object.keys(data.overrides).length && !data.extra.length) delete root.passports;
    else root.passports = data;
    await c.saveMetadata();
}

function requireChat(): void {
    if (!chatOpen()) throw new Error('NAI Studio: no chat is open');
}

/** The passports of a card as the current chat sees them. */
export function resolvedCardPassports(character: STCharacter | undefined, data = chatPassportData()): Passport[] {
    const owner = character?.avatar;
    return cardPassports(character).map((p) => resolveChatPassport(p, owner, data));
}

/** The persona passport as the current chat sees it. */
export function resolvedPersonaPassport(key: string, data = chatPassportData()): Passport | null {
    const passport = personaPassport(key);
    return passport ? resolveChatPassport(passport, personaOwner(key), data) : null;
}

/**
 * Saves a passport for this chat only: over a card or persona passport (`base`) as the fields that
 * differ (no difference removes the override), or as a passport of the chat itself (`base` null).
 */
export async function saveChatPassport(base: Passport | null, edited: Passport, owner?: string): Promise<void> {
    requireChat();
    const data = chatPassportData();
    if (base) {
        const diff = passportDiff(base, { ...edited, id: base.id });
        if (isOverrideEmpty(diff)) delete data.overrides[base.id];
        else data.overrides[base.id] = owner ? { owner, ...diff } : diff;
    } else {
        const at = data.extra.findIndex((p) => p.id === edited.id);
        if (at >= 0) data.extra[at] = edited;
        else data.extra.push(edited);
    }
    await writeChatPassports(data);
    emitStudioEvent('passportsSaved', { ids: [base?.id ?? edited.id], scope: 'chat' });
}

/**
 * Drops the chat's override of a passport (the card value comes back) and a passport of the chat
 * itself with that id. False when there was nothing to drop.
 */
export async function clearChatOverride(id: string): Promise<boolean> {
    requireChat();
    const data = chatPassportData();
    const had = Object.prototype.hasOwnProperty.call(data.overrides, id) || data.extra.some((p) => p.id === id);
    if (!had) return false;
    delete data.overrides[id];
    data.extra = data.extra.filter((p) => p.id !== id);
    await writeChatPassports(data);
    emitStudioEvent('passportsSaved', { ids: [id], scope: 'chat' });
    return true;
}

/** The chat has an override for this passport of this owner. */
export function hasChatOverride(id: string, owner: string | undefined, data = chatPassportData()): boolean {
    const override = Object.prototype.hasOwnProperty.call(data.overrides, id) ? data.overrides[id] : undefined;
    return Boolean(override && !(override.owner && owner && override.owner !== owner));
}

// ---- where a passport lives ------------------------------------------------------------------

export type PassportOwner =
    { type: 'card'; index: number; avatar: string } | { type: 'persona'; key: string } | { type: 'chat' };

export function ownerId(owner: PassportOwner): string | undefined {
    if (owner.type === 'card') return owner.avatar;
    return owner.type === 'persona' ? personaOwner(owner.key) : undefined;
}

export interface LocatedPassport {
    owner: PassportOwner;
    /** As stored in the card or the persona settings; null for a passport of the chat itself. */
    base: Passport | null;
    /** As the current chat sees it. */
    resolved: Passport;
    /** The chat changes it (an override, or a passport of the chat itself). */
    overridden: boolean;
}

export interface PassportWhere {
    /** Card index (searched first). */
    index?: number;
    /** Persona key to search instead of the cards. */
    persona?: string;
}

/**
 * Finds a passport by id: in the given card or persona, else in the cards of the chat, the current
 * persona and the passports of the chat itself. Synchronous: lazily loaded cards that were never
 * opened have no passports yet.
 */
export function locatePassport(
    id: string,
    where: PassportWhere = {},
    data = chatPassportData(),
): LocatedPassport | null {
    const c = ctx();
    const inCard = (index: number): LocatedPassport | null => {
        const character = c.characters[index];
        const base = cardPassports(character).find((p) => p.id === id);
        if (!character || !base) return null;
        const owner: PassportOwner = { type: 'card', index, avatar: character.avatar };
        return {
            owner,
            base,
            resolved: resolveChatPassport(base, character.avatar, data),
            overridden: hasChatOverride(id, character.avatar, data),
        };
    };
    const inPersona = (key: string): LocatedPassport | null => {
        const base = personaPassport(key);
        if (!base || base.id !== id) return null;
        return {
            owner: { type: 'persona', key },
            base,
            resolved: resolveChatPassport(base, personaOwner(key), data),
            overridden: hasChatOverride(id, personaOwner(key), data),
        };
    };
    if (where.persona !== undefined) return inPersona(where.persona);
    if (where.index !== undefined) return inCard(where.index);
    for (const index of chatCardIndexes()) {
        const found = inCard(index);
        if (found) return found;
    }
    const persona = inPersona(knownPersonaKey());
    if (persona) return persona;
    const own = data.extra.find((p) => p.id === id);
    return own ? { owner: { type: 'chat' }, base: null, resolved: own, overridden: true } : null;
}

/** Saves an edited passport where it lives ("card": the card or persona settings) or for this chat. */
export async function savePassportIn(
    located: LocatedPassport,
    edited: Passport,
    scope: 'card' | 'chat',
): Promise<void> {
    const passport = { ...edited, id: located.base?.id ?? located.resolved.id };
    if (scope === 'chat') {
        await saveChatPassport(located.base, passport, ownerId(located.owner));
        return;
    }
    const owner = located.owner;
    if (owner.type === 'card') await saveCardPassport(owner.index, passport);
    else if (owner.type === 'persona') savePersonaPassport(owner.key, passport);
    else throw new Error('NAI Studio: a passport of the chat has no card');
}

/** The chat's view of a passport after a save (an override of the card applied again). */
export function resolvedAfterSave(located: LocatedPassport, saved: Passport, scope: 'card' | 'chat'): Passport {
    if (scope === 'chat' || !located.base) return saved;
    const data = chatPassportData();
    return resolveChatPassport(saved, ownerId(located.owner), data);
}
