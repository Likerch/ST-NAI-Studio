// NAI_STUDIO_API (v0.10): the public interface for other extensions (Maestro, its plan §16). Read and
// write passports in the card or for the current chat only, switch outfits and states, listen to
// "passports saved" and "image ready", and register scene providers and (v0.11) quality gates.
// v0.12: passport providers (lore entries in scenes), passports written from a description and
// backgrounds of places. v0.14: a passport excluded from the current chat, a DES portrait redrawn on
// request, `features` to detect what the running version has. Since 0.15 ("personaKeys"): any persona
// by its avatar file key, current or not: its passport read and saved, a persona passport written from
// a description, and a free avatar drawn from its passport and set without a popup. Installed on
// activation, removed on disable. Version 1: within a version members are only added, never changed.
import { ctx } from '../core/context';
import { toNaiError } from '../core/errors';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { ENTRY_PASSPORT_KINDS, isPassportEmpty, newPassportId, normalizePassport } from '../domain';
import type { EntryPassportKind, Passport, SceneHint } from '../domain';
import type { BackgroundService } from '../features/backgrounds/background-service';
import { generateEntryPassport, generatePersonaPassportFrom } from '../features/characters/passport-generator';
import {
    cardIndexByAvatar,
    chatCardIndexes,
    chatOpen,
    chatOwnPassports,
    chatPassportData,
    clearChatOverride,
    currentPersonaKey,
    knownPersonaKey,
    loadCharacter,
    locatePassport,
    ownerId,
    passportExcluded,
    personaPassport,
    resolvedCardPassports,
    resolvedPersonaPassport,
    saveCardPassport,
    saveChatPassport,
    savePassportIn,
    savePersonaPassport,
    setPassportExcluded,
} from '../features/characters/passport-store';
import type { LocatedPassport, PassportWhere } from '../features/characters/passport-store';
import { generatePersonaAvatarFile } from '../features/characters/persona-avatar';
import type { PersonaAvatarResult } from '../features/characters/persona-avatar';
import { emitStudioEvent, onStudioEvent, STUDIO_EVENTS } from '../features/events/studio-events';
import type { StudioEventName, StudioEvents, StudioRequestKind } from '../features/events/studio-events';
import type { Pipeline } from '../features/generation/pipeline';
import { registerQualityGate } from '../features/quality/quality-gate';
import type { QualityGate } from '../features/quality/quality-gate';
import { registerScenePassportProvider } from '../features/scene/passport-providers';
import { registerSceneHintProvider } from '../features/scene/scene-providers';
import type { SceneHintContext } from '../features/scene/scene-providers';

export type {
    ImageReadyDetail,
    ImageReadyKind,
    PassportExcludedChangedDetail,
    PassportsSavedDetail,
    RequestFailedDetail,
    StudioEventName,
    StudioRequestKind,
} from '../features/events/studio-events';
export type { SceneHint } from '../domain';
export type { PersonaAvatarResult } from '../features/characters/persona-avatar';
export type { SceneHintContext } from '../features/scene/scene-providers';
export type { QualityGate, QualityGateDetail } from '../features/quality/quality-gate';

export const API_GLOBAL = 'NAI_STUDIO_API';
export const API_VERSION = 1;

/**
 * What this version has beyond the members a consumer checks with `typeof` (v0.14): "excludePassport"
 * (setPassportExcluded, isPassportExcluded, the "passportExcludedChanged" event, `includeExcluded`),
 * "requestDesPortrait", "chatNpcPassports" (passports of new DES characters go to the chat by default and
 * carry origin "auto-des"), "chatPortraits" (DES portraits remembered per chat). Since 0.15 "personaKeys"
 * (getPersonaPassport, savePassport's `personaKey`, generatePassport's `persona`, generatePersonaAvatar,
 * `personaKey` in "passportsSaved").
 */
export const API_FEATURES = [
    'excludePassport',
    'requestDesPortrait',
    'chatNpcPassports',
    'chatPortraits',
    'personaKeys',
] as const;
export type ApiFeature = (typeof API_FEATURES)[number];

/** Which passports to list; several flags add up, none lists everything of the current chat. */
export interface PassportScopeFilter {
    /** One card by its avatar file ("Alice.png"; the extension may be left out). */
    avatar?: string;
    /** The current persona's passport. */
    persona?: boolean;
    /** Passports that exist only in the current chat. */
    chat?: boolean;
    /** Since 0.14: also the passports the current chat excludes (left out otherwise). */
    includeExcluded?: boolean;
}

/** Since 0.14: whether a reader of the current chat sees the passports it excludes. */
export interface ExcludedFilter {
    includeExcluded?: boolean;
}

/** Since 0.14: why a DES portrait is redrawn (logged). */
export interface DesPortraitRequest {
    reason?: string;
}

/** Where a passport lives when its id alone does not say (a new passport, ids shared by legacy cards). */
export interface PassportTarget {
    avatar?: string;
    /** The current persona. */
    persona?: boolean;
    /**
     * Since 0.15: any persona by its avatar file key (ST `user_avatar`, "1728000000000-Anna.png"), current
     * or not, existing in ST yet or not. The passport replaces that persona's stored passport whatever the
     * scope (no chat override); one without an id keeps the id of the passport it replaces. Wins over
     * `persona`; rejects with `avatar`.
     */
    personaKey?: string;
}

export type PassportSaveScope = 'card' | 'chat';

export interface ExternalSceneProvider {
    id: string;
    /** Higher answers first; the first answer wins each field on its own. */
    priority: number;
    describe(context: SceneHintContext): Promise<SceneHint | null> | SceneHint | null;
}

/** v0.12: passports of a scene from another extension (Maestro: lore entries activated or mentioned). */
export interface ExternalPassportProvider {
    id: string;
    /** Higher first: its passport wins a name another provider also gives (0 when absent). */
    priority?: number;
    passports(context: SceneHintContext): Promise<Passport[]> | Passport[];
}

/** v0.12: what `generatePassport` writes a passport for. */
export interface PassportGenerationInput {
    name: string;
    /** With `persona`: "character" (or left out); any other kind rejects. */
    kind: EntryPassportKind;
    /** The text describing it (a lorebook entry); macros like {{char}} are substituted. */
    description: string;
    /** Language of the story ("ru", "Russian"): the name as it spells it goes to the aliases. */
    language?: string;
    /**
     * Since 0.15: a persona passport (a persona made for a character): NAI Studio's persona prompt with
     * its outfits instead of the lore entry one, and room for 5-6 outfits in the answer.
     */
    persona?: boolean;
}

/** Since 0.15: the persona whose avatar `generatePersonaAvatar` draws. */
export interface PersonaAvatarRequest {
    /** The persona's avatar file key (ST `user_avatar`, "1728000000000-Anna.png"): the file it writes. */
    personaKey: string;
    /** Drawn from this passport instead of the persona's stored one. */
    passport?: Passport;
    /** Aborts it while it is prepared, waits in the queue or is drawn; nothing is uploaded after it. */
    signal?: AbortSignal;
}

/** v0.12: the background `generateBackground` draws. */
export interface BackgroundInput {
    locationName: string;
    /** Extra tags (the state of the place). */
    tags?: string;
    /** A location (or world) passport of the chat or of a passport provider. */
    passportId?: string;
    /** As a tracker writes it ("evening", "19:40", Russian words too). */
    timeOfDay?: string;
    /** As a tracker writes it ("rain, wind", Russian words too). */
    weather?: string;
    /** A saved style of NAI Studio by name (it replaces the active style for this picture), else style tags. */
    style?: string;
}

export interface NaiStudioApi {
    readonly version: 1;
    /** Since 0.14 (absent before): names of what this version has; see API_FEATURES. */
    readonly features: readonly string[];
    /**
     * Passports as the current chat sees them (chat overrides applied), as copies. Since 0.14 the ones the
     * chat excludes are left out unless `includeExcluded`.
     */
    passports(scope?: PassportScopeFilter): Passport[];
    /**
     * One passport of the current chat (its cards, the persona, the chat's own) by id; null when absent.
     * Since 0.14 null for a passport the chat excludes unless `includeExcluded`.
     */
    getPassport(id: string, options?: ExcludedFilter): Passport | null;
    /**
     * "card": into the card (or the persona settings), replacing the passport with that id or adding it.
     * "chat": for the current chat only — over a card or persona passport as the fields that differ,
     * else as a passport of the chat itself. A passport without an id gets a new one.
     */
    savePassport(passport: Passport, scope: PassportSaveScope, target?: PassportTarget): Promise<void>;
    /** Active outfit by name ('' = the clothing slot); "chat" by default. */
    setOutfit(passportId: string, outfit: string, scope?: PassportSaveScope): Promise<void>;
    /** Switches a state (preset or own; an unknown one is added when switched on); "chat" by default. */
    setState(passportId: string, stateId: string, enabled: boolean, scope?: PassportSaveScope): Promise<void>;
    /** Drops the chat's override (the card value comes back) and a passport of the chat with that id. */
    clearChatOverride(passportId: string): Promise<void>;
    on<K extends StudioEventName>(event: K, listener: (detail: StudioEvents[K]) => void): () => void;
    registerSceneProvider(provider: ExternalSceneProvider): () => void;
    /**
     * Since 0.11 (absent before: check that it is a function). Before NAI Studio draws on its own for an
     * assistant reply — its image markers (also the ones found while it streams), automatic illustrations
     * and generation, DES portraits after it — it awaits every gate in parallel, once per reply swipe, at
     * most `quality.gateTimeoutMs` (20 s) from the end of the reply. Any false: nothing is drawn for that
     * reply swipe (marker placeholders stay, "Try again" or a new swipe draws them); all true or no answer in
     * time: drawn as before. A gate that throws counts as true; a reply swiped away or deleted while
     * waiting gets nothing. Manual generation is never gated. Returns the unregistration.
     */
    registerQualityGate(gate: QualityGate): () => void;
    /**
     * Since 0.12 (absent before: check that it is a function). Passports of a scene: wherever NAI Studio
     * resolves passports for scene images and image markers it adds the provider's passports after the
     * ones of the cards, the persona and the chat — people as scene participants, locations and the world
     * as the setting, objects whose tags join a picture that names them; one named like a passport the
     * chat has (name or alias) is left out, the chat's wins. The DES integration uses a provider's
     * character passport before writing a new one into the card. Providers have 3 s; one that throws or
     * is silent is skipped. A provider with the same id replaces the previous one. Returns the
     * unregistration.
     */
    registerPassportProvider(provider: ExternalPassportProvider): () => void;
    /**
     * Since 0.12. NAI Studio's passport generator for one person, place, item or the world from its text,
     * through the language backend chosen in NAI Studio (it costs what that backend costs; no image).
     * Nothing is saved. A full passport with a new id and the given name, or null when generation failed
     * (a "requestFailed" event says why). Invalid input rejects.
     */
    generatePassport(input: PassportGenerationInput): Promise<Passport | null>;
    /**
     * Since 0.12. One background for a place: no people, 16:9 at about 1 MP, the place's passport tags
     * (or its name), `tags`, the time of day and the weather as tags, through NAI Studio's normal pipeline
     * and Anlas guards (free-only mode refuses a request that would cost Anlas; otherwise the usual
     * confirmation). The image goes into SillyTavern's backgrounds library as
     * `maestro-<slug>-<timestamp>.png`; the background is NOT set. The stored file name, or null (a toast
     * and a "requestFailed" event say why; a cancelled confirmation is code "aborted").
     */
    generateBackground(input: BackgroundInput): Promise<{ file: string } | null>;
    /**
     * Since 0.14 (absent before: check that it is a function). Excludes a passport (of a card of the chat,
     * the persona, the chat itself, or a passport provider's by id) from the current chat only, or uses it
     * again: a flag in the chat's overrides, the card stays as it is. An excluded passport is absent in that
     * chat for every feature (scenes, markers, the composer, DES lines and portraits, emotions, backgrounds,
     * `passports()` and `getPassport()` unless `includeExcluded`); a DES character of that name has no
     * passport there. "passportExcludedChanged" `{ id, excluded }` follows a change. Rejects without a chat.
     */
    setPassportExcluded(passportId: string, excluded: boolean): Promise<void>;
    /** Since 0.14. The current chat excludes this passport (false without a chat). */
    isPassportExcluded(passportId: string): boolean;
    /**
     * Since 0.14. Redraws the portrait of a DES character now through NAI Studio's portrait queue (after the
     * pictures of the reply), from its passport as the chat sees it (active outfit and states too), at most
     * what an image marker may cost (free-only mode: free only), without a confirmation. The portrait
     * becomes the current chat's. True when queued (or one for that character is already on its way);
     * false when it cannot be: no DES, the DES integration or its portraits off, a name DES does not know,
     * the user's or a card's own character, nothing to draw from.
     */
    requestDesPortrait(name: string, options?: DesPortraitRequest): Promise<boolean>;
    /**
     * Since 0.15 (`features` has "personaKeys"). The stored passport of any persona by its avatar file key
     * (ST `user_avatar` id such as "1728000000000-Anna.png"), current or not, as a copy without chat
     * overrides; null when it has none (or the key is not a non-empty string).
     */
    getPersonaPassport(personaKey: string): Passport | null;
    /**
     * Since 0.15. Draws a portrait of a persona from its stored passport (or the given one) and makes it
     * that persona's avatar, current or not. Free only: the free area, at most 28 steps, no vibe encoded
     * for it; a request that would still cost Anlas resolves `{ ok: false, error: 'cost' }` before anything
     * is sent. No cost question, no crop popup. It waits in NAI Studio's one queue as a portrait (after
     * the pictures of a reply; another chat does not drop it). The image goes to `/api/avatars/upload`
     * with `overwrite_name` = personaKey and ST's default crop (centred 2:3, resized by ST; none when ST
     * never resizes avatars); ST's persona list is rendered again. `{ ok: true, path }` with the file
     * name the server stored, or `{ ok: false, error }`: "cost", "aborted", "no-passport" (none stored and
     * none given, or an empty one), "inactive" (NAI Studio not running), "upload", or NAI Studio's error
     * code of a failed generation ("unauthorized", "rate-limited", ...). Invalid input rejects.
     */
    generatePersonaAvatar(options: PersonaAvatarRequest): Promise<PersonaAvatarResult>;
}

/** Unsubscriptions of everything registered through the API (dropped on disable). */
const registrations = new Set<() => void>();
/** Draws backgrounds (set on activation; null before). */
let backgrounds: BackgroundService | null = null;
/** Redraws DES portraits (the DES integration, set on activation; null before). */
let desPortraits: DesPortraitRequester | null = null;
/** Draws persona avatars (since 0.15; set on activation, null before). */
let pipeline: Pipeline | null = null;

function fail(message: string): never {
    throw new Error(`NAI Studio API: ${message}`);
}

function requireId(value: unknown, what = 'passport id'): string {
    if (typeof value !== 'string' || !value.trim()) fail(`${what} must be a non-empty string`);
    return value.trim();
}

function requireScope(value: unknown): PassportSaveScope {
    if (value !== 'card' && value !== 'chat') fail(`scope must be "card" or "chat"`);
    return value;
}

/** A persona's avatar file key: a file name SillyTavern accepts as `overwrite_name` (no path). */
function requirePersonaKey(value: unknown): string {
    const key = requireId(value, 'personaKey');
    if (/[/\\\0]/.test(key) || key === '.' || key === '..') fail('personaKey must be a file name');
    return key;
}

/** The persona and the cards of the chat are loaded before an async call looks for a passport. */
async function prepare(): Promise<void> {
    await currentPersonaKey();
    for (const index of chatCardIndexes()) await loadCharacter(index);
}

function whereOf(target: PassportTarget | undefined): PassportWhere | null {
    if (target?.persona) return { persona: knownPersonaKey() };
    if (target?.avatar !== undefined) {
        const index = cardIndexByAvatar(target.avatar);
        if (index < 0) fail(`no card "${target.avatar}"`);
        return { index };
    }
    return null;
}

function located(passportId: string): LocatedPassport {
    return locatePassport(passportId) ?? fail(`no passport "${passportId}" in this chat`);
}

/** The view a change starts from: the chat's view for the chat scope, the stored passport for the card. */
function viewFor(found: LocatedPassport, scope: PassportSaveScope): Passport {
    if (scope === 'chat') return structuredClone(found.resolved);
    return found.base ? structuredClone(found.base) : fail('a passport of the chat itself has no card');
}

function list(filter?: PassportScopeFilter): Passport[] {
    const data = chatPassportData();
    const all = !filter || (filter.avatar === undefined && !filter.persona && !filter.chat);
    const options = { includeExcluded: filter?.includeExcluded === true };
    const result: Passport[] = [];
    let cards: number[] = [];
    if (all) cards = chatCardIndexes();
    else if (filter.avatar !== undefined) cards = [cardIndexByAvatar(filter.avatar)].filter((i) => i >= 0);
    for (const index of cards) result.push(...resolvedCardPassports(ctx().characters[index], data, options));
    if (all || filter.persona) {
        const persona = resolvedPersonaPassport(knownPersonaKey(), data, options);
        if (persona) result.push(persona);
    }
    if (all || filter.chat) result.push(...chatOwnPassports(data, options));
    return structuredClone(result);
}

function getPassport(id: string, options?: ExcludedFilter): Passport | null {
    const found = typeof id === 'string' && id.trim() ? locatePassport(id.trim()) : null;
    if (!found || (found.excluded && options?.includeExcluded !== true)) return null;
    return structuredClone(found.resolved);
}

async function excludePassport(passportId: string, excluded: boolean): Promise<void> {
    const id = requireId(passportId);
    if (typeof excluded !== 'boolean') fail('excluded must be a boolean');
    if (!chatOpen()) fail('no chat is open');
    await prepare();
    // The owner keeps the flag to the right passport where legacy cards share an id ("main").
    const found = locatePassport(id);
    await setPassportExcluded(id, excluded, found ? ownerId(found.owner) : undefined);
}

function isExcluded(passportId: string): boolean {
    if (typeof passportId !== 'string' || !passportId.trim() || !chatOpen()) return false;
    const id = passportId.trim();
    const found = locatePassport(id);
    return passportExcluded(id, found ? ownerId(found.owner) : undefined);
}

async function requestDesPortrait(name: string, options?: DesPortraitRequest): Promise<boolean> {
    const wanted = requireId(name, 'name');
    if (options !== undefined && (typeof options !== 'object' || options === null)) fail('options must be an object');
    const reason = options ? optionalText(options, 'reason') : undefined;
    if (!desPortraits) return false;
    try {
        return await desPortraits(wanted, reason);
    } catch (error) {
        log.warn(`${API_GLOBAL}: portrait of "${wanted}" not requested`, error);
        return false;
    }
}

async function savePassport(raw: Passport, scopeValue: PassportSaveScope, target?: PassportTarget): Promise<void> {
    const scope = requireScope(scopeValue);
    const passport = normalizePassport(raw) ?? fail('passport must be an object');
    const rawId = (raw as { id?: unknown }).id;
    const givenId = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : '';
    if (target?.personaKey !== undefined) {
        // Any persona by its key (since 0.15): its stored passport, whatever the scope.
        const key = requirePersonaKey(target.personaKey);
        if (target.avatar !== undefined) fail('target.avatar and target.personaKey exclude each other');
        passport.id = givenId || personaPassport(key)?.id || newPassportId();
        savePersonaPassport(key, passport);
        return;
    }
    passport.id = givenId || newPassportId();
    await prepare();
    const where = whereOf(target);
    const found = where ? locatePassport(passport.id, where) : locatePassport(passport.id);
    if (scope === 'chat') {
        if (found?.base) await savePassportIn(found, passport, 'chat');
        else await saveChatPassport(null, passport);
        return;
    }
    const owner = found?.owner;
    if (target?.persona) {
        savePersonaPassport(knownPersonaKey(), passport);
        return;
    }
    if (!where && owner?.type === 'persona') {
        savePersonaPassport(owner.key, passport);
        return;
    }
    let index: number;
    if (where?.index !== undefined) index = where.index;
    else if (owner?.type === 'card') index = owner.index;
    else {
        const cards = chatCardIndexes();
        if (cards.length !== 1) fail('name the card of a new passport (target.avatar)');
        index = cards[0]!;
    }
    await saveCardPassport(index, passport);
    // A passport of the chat itself moved into the card: the chat's copy goes.
    if (owner?.type === 'chat') await clearChatOverride(passport.id);
}

async function setOutfit(passportId: string, outfit: string, scopeValue: PassportSaveScope = 'chat'): Promise<void> {
    const id = requireId(passportId);
    const scope = requireScope(scopeValue);
    if (typeof outfit !== 'string') fail('outfit must be a string');
    await prepare();
    const found = located(id);
    const edited = viewFor(found, scope);
    const wanted = outfit.trim().toLowerCase();
    const match = wanted ? edited.outfits.find((o) => o.name.trim().toLowerCase() === wanted) : undefined;
    if (wanted && !match) fail(`passport "${id}" has no outfit "${outfit}"`);
    edited.activeOutfit = match?.name ?? '';
    await savePassportIn(found, edited, scope);
}

async function setState(
    passportId: string,
    stateId: string,
    enabled: boolean,
    scopeValue: PassportSaveScope = 'chat',
): Promise<void> {
    const id = requireId(passportId);
    const state = requireId(stateId, 'state id');
    const scope = requireScope(scopeValue);
    await prepare();
    const found = located(id);
    const edited = viewFor(found, scope);
    const existing =
        edited.states.find((s) => s.id === state) ??
        edited.states.find((s) => s.id.toLowerCase() === state.toLowerCase());
    if (existing) existing.enabled = enabled === true;
    else if (enabled === true) edited.states.push({ id: state, tags: state, enabled: true });
    else return;
    await savePassportIn(found, edited, scope);
}

function on<K extends StudioEventName>(event: K, listener: (detail: StudioEvents[K]) => void): () => void {
    if (!STUDIO_EVENTS.includes(event)) fail(`unknown event "${String(event)}"`);
    if (typeof listener !== 'function') fail('listener must be a function');
    const off = onStudioEvent(event, listener);
    const unsubscribe = () => {
        off();
        registrations.delete(unsubscribe);
    };
    registrations.add(unsubscribe);
    return unsubscribe;
}

function registerSceneProvider(provider: ExternalSceneProvider): () => void {
    if (typeof provider !== 'object' || provider === null) fail('provider must be an object');
    const id = requireId(provider.id, 'provider id');
    if (typeof provider.describe !== 'function') fail('provider.describe must be a function');
    const priority = Number.isFinite(provider.priority) ? Number(provider.priority) : 0;
    const off = registerSceneHintProvider({ id, priority, describe: (context) => provider.describe(context) });
    const unregister = () => {
        off();
        registrations.delete(unregister);
    };
    registrations.add(unregister);
    return unregister;
}

function registerGate(gate: QualityGate): () => void {
    if (typeof gate !== 'function') fail('gate must be a function');
    const off = registerQualityGate((detail) => gate(detail));
    const unregister = () => {
        off();
        registrations.delete(unregister);
    };
    registrations.add(unregister);
    return unregister;
}

function registerPassportProvider(provider: ExternalPassportProvider): () => void {
    if (typeof provider !== 'object' || provider === null) fail('provider must be an object');
    const id = requireId(provider.id, 'provider id');
    if (typeof provider.passports !== 'function') fail('provider.passports must be a function');
    const priority = Number.isFinite(provider.priority) ? Number(provider.priority) : 0;
    const off = registerScenePassportProvider({ id, priority, passports: (context) => provider.passports(context) });
    const unregister = () => {
        off();
        registrations.delete(unregister);
    };
    registrations.add(unregister);
    return unregister;
}

/** An optional string field of an input object. */
function optionalText(input: object, field: string): string | undefined {
    const value = (input as Record<string, unknown>)[field];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') fail(`${field} must be a string`);
    return value.trim() || undefined;
}

/** A request of another extension failed: logged and reported with the "requestFailed" event. */
function requestFailed(request: StudioRequestKind, name: string, error: unknown) {
    const naiError = toNaiError(error);
    log.warn(`${API_GLOBAL}: ${request} for "${name}" failed:`, naiError.code, naiError.text);
    emitStudioEvent('requestFailed', { request, name, code: naiError.code, message: naiError.text });
    return naiError;
}

async function generatePassport(input: PassportGenerationInput): Promise<Passport | null> {
    if (typeof input !== 'object' || input === null) fail('input must be an object');
    const name = requireId(input.name, 'name');
    const persona = (input as { persona?: unknown }).persona;
    if (persona !== undefined && typeof persona !== 'boolean') fail('persona must be a boolean');
    const kind = input.kind as unknown;
    if (persona === true) {
        if (kind !== undefined && kind !== 'character') fail('a persona passport is of kind "character"');
    } else if (!(ENTRY_PASSPORT_KINDS as readonly unknown[]).includes(kind))
        fail(`kind must be one of ${ENTRY_PASSPORT_KINDS.join(', ')}`);
    if (typeof input.description !== 'string') fail('description must be a string');
    const language = optionalText(input, 'language');
    try {
        if (persona === true) {
            return await generatePersonaPassportFrom({
                name,
                description: input.description,
                ...(language ? { language } : {}),
            });
        }
        return await generateEntryPassport({
            name,
            kind: kind as EntryPassportKind,
            description: input.description,
            ...(language ? { language } : {}),
        });
    } catch (error) {
        requestFailed('passport', name, error);
        return null;
    }
}

async function generateBackground(input: BackgroundInput): Promise<{ file: string } | null> {
    if (typeof input !== 'object' || input === null) fail('input must be an object');
    const locationName = requireId(input.locationName, 'locationName');
    const request = { locationName };
    for (const field of ['tags', 'passportId', 'timeOfDay', 'weather', 'style'] as const) {
        const value = optionalText(input, field);
        if (value) Object.assign(request, { [field]: value });
    }
    const service = backgrounds;
    if (!service) {
        requestFailed('background', locationName, new Error('NAI Studio is not active'));
        return null;
    }
    try {
        return await service.generate(request);
    } catch (error) {
        const naiError = requestFailed('background', locationName, error);
        if (naiError.code !== 'aborted') {
            toastr.error(t('naist.background.failed', { name: locationName, reason: naiError.text }), naiError.title);
        }
        return null;
    }
}

function getPersonaPassport(personaKey: string): Passport | null {
    if (typeof personaKey !== 'string' || !personaKey.trim()) return null;
    const stored = personaPassport(personaKey.trim());
    return stored ? structuredClone(stored) : null;
}

/** An AbortSignal of any realm. */
function isSignal(value: unknown): value is AbortSignal {
    const signal = value as Partial<AbortSignal> | null;
    return (
        typeof signal === 'object' &&
        signal !== null &&
        typeof signal.aborted === 'boolean' &&
        typeof signal.addEventListener === 'function'
    );
}

async function generatePersonaAvatar(options: PersonaAvatarRequest): Promise<PersonaAvatarResult> {
    if (typeof options !== 'object' || options === null) fail('options must be an object');
    const key = requirePersonaKey(options.personaKey);
    const given = options.passport as unknown;
    const passport =
        given === undefined || given === null
            ? personaPassport(key)
            : (normalizePassport(given) ?? fail('passport must be an object'));
    const signal = options.signal as unknown;
    if (signal !== undefined && !isSignal(signal)) fail('signal must be an AbortSignal');
    if (!passport || isPassportEmpty(passport)) return { ok: false, error: 'no-passport' };
    if (!pipeline) return { ok: false, error: 'inactive' };
    return await generatePersonaAvatarFile(pipeline, key, passport, signal);
}

function createApi(): NaiStudioApi {
    return Object.freeze({
        version: API_VERSION as 1,
        features: Object.freeze([...API_FEATURES]),
        passports: (scope?: PassportScopeFilter) => list(scope),
        getPassport,
        savePassport,
        setOutfit,
        setState,
        clearChatOverride: async (passportId: string) => {
            await clearChatOverride(requireId(passportId));
        },
        on,
        registerSceneProvider,
        registerQualityGate: registerGate,
        registerPassportProvider,
        generatePassport,
        generateBackground,
        setPassportExcluded: excludePassport,
        isPassportExcluded: isExcluded,
        requestDesPortrait,
        getPersonaPassport,
        generatePersonaAvatar,
    });
}

let installed: NaiStudioApi | null = null;

/** Redraws a DES portrait on request (v0.14): true when queued, false when it cannot be. */
export type DesPortraitRequester = (name: string, reason?: string) => Promise<boolean>;

/** Services the API needs from the running extension (activation passes them; enabling again keeps them). */
export interface PublicApiServices {
    backgrounds?: BackgroundService;
    desPortraits?: DesPortraitRequester;
    /** Draws persona avatars (since 0.15). */
    pipeline?: Pipeline;
}

/** Publishes globalThis.NAI_STUDIO_API (activation). */
export function installPublicApi(services: PublicApiServices = {}): NaiStudioApi {
    if (services.backgrounds) backgrounds = services.backgrounds;
    if (services.desPortraits) desPortraits = services.desPortraits;
    if (services.pipeline) pipeline = services.pipeline;
    installed ??= createApi();
    (globalThis as Record<string, unknown>)[API_GLOBAL] = installed;
    // The persona key is read synchronously by passports(): load it now.
    void currentPersonaKey();
    log.info(`${API_GLOBAL} version ${API_VERSION} published`);
    return installed;
}

/** Removes the API and everything registered through it (lifecycle "disable" / "delete"). */
export function uninstallPublicApi(): void {
    const root = globalThis as Record<string, unknown>;
    if (installed && root[API_GLOBAL] === installed) delete root[API_GLOBAL];
    installed = null;
    for (const unregister of [...registrations]) unregister();
}
