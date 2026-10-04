// NAI_STUDIO_API (v0.10): the public interface for other extensions (Maestro, its plan §16). Read and
// write passports in the card or for the current chat only, switch outfits and states, listen to
// "passports saved" and "image ready", and register scene providers and (v0.11) quality gates.
// v0.12: passport providers (lore entries in scenes), passports written from a description and
// backgrounds of places. Installed on activation, removed on disable. Version 1: within a version
// members are only added, never changed.
import { ctx } from '../core/context';
import { toNaiError } from '../core/errors';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { ENTRY_PASSPORT_KINDS, newPassportId, normalizePassport } from '../domain';
import type { EntryPassportKind, Passport, SceneHint } from '../domain';
import type { BackgroundService } from '../features/backgrounds/background-service';
import { generateEntryPassport } from '../features/characters/passport-generator';
import {
    cardIndexByAvatar,
    chatCardIndexes,
    chatPassportData,
    clearChatOverride,
    currentPersonaKey,
    knownPersonaKey,
    loadCharacter,
    locatePassport,
    resolvedCardPassports,
    resolvedPersonaPassport,
    saveCardPassport,
    saveChatPassport,
    savePassportIn,
    savePersonaPassport,
} from '../features/characters/passport-store';
import type { LocatedPassport, PassportWhere } from '../features/characters/passport-store';
import { emitStudioEvent, onStudioEvent, STUDIO_EVENTS } from '../features/events/studio-events';
import type { StudioEventName, StudioEvents, StudioRequestKind } from '../features/events/studio-events';
import { registerQualityGate } from '../features/quality/quality-gate';
import type { QualityGate } from '../features/quality/quality-gate';
import { registerScenePassportProvider } from '../features/scene/passport-providers';
import { registerSceneHintProvider } from '../features/scene/scene-providers';
import type { SceneHintContext } from '../features/scene/scene-providers';

export type {
    ImageReadyDetail,
    ImageReadyKind,
    PassportsSavedDetail,
    RequestFailedDetail,
    StudioEventName,
    StudioRequestKind,
} from '../features/events/studio-events';
export type { SceneHint } from '../domain';
export type { SceneHintContext } from '../features/scene/scene-providers';
export type { QualityGate, QualityGateDetail } from '../features/quality/quality-gate';

export const API_GLOBAL = 'NAI_STUDIO_API';
export const API_VERSION = 1;

/** Which passports to list; several flags add up, none lists everything of the current chat. */
export interface PassportScopeFilter {
    /** One card by its avatar file ("Alice.png"; the extension may be left out). */
    avatar?: string;
    /** The current persona's passport. */
    persona?: boolean;
    /** Passports that exist only in the current chat. */
    chat?: boolean;
}

/** Where a passport lives when its id alone does not say (a new passport, ids shared by legacy cards). */
export interface PassportTarget {
    avatar?: string;
    persona?: boolean;
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
    kind: EntryPassportKind;
    /** The text describing it (a lorebook entry); macros like {{char}} are substituted. */
    description: string;
    /** Language of the story ("ru", "Russian"): the name as it spells it goes to the aliases. */
    language?: string;
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
    /** A saved style of NAI Studio by name, else style tags. */
    style?: string;
}

export interface NaiStudioApi {
    readonly version: 1;
    /** Passports as the current chat sees them (chat overrides applied), as copies. */
    passports(scope?: PassportScopeFilter): Passport[];
    /** One passport of the current chat (its cards, the persona, the chat's own) by id; null when absent. */
    getPassport(id: string): Passport | null;
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
}

/** Unsubscriptions of everything registered through the API (dropped on disable). */
const registrations = new Set<() => void>();
/** Draws backgrounds (set on activation; null before). */
let backgrounds: BackgroundService | null = null;

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
    const result: Passport[] = [];
    let cards: number[] = [];
    if (all) cards = chatCardIndexes();
    else if (filter.avatar !== undefined) cards = [cardIndexByAvatar(filter.avatar)].filter((i) => i >= 0);
    for (const index of cards) result.push(...resolvedCardPassports(ctx().characters[index], data));
    if (all || filter.persona) {
        const persona = resolvedPersonaPassport(knownPersonaKey(), data);
        if (persona) result.push(persona);
    }
    if (all || filter.chat) result.push(...data.extra);
    return structuredClone(result);
}

async function savePassport(raw: Passport, scopeValue: PassportSaveScope, target?: PassportTarget): Promise<void> {
    const scope = requireScope(scopeValue);
    const passport = normalizePassport(raw) ?? fail('passport must be an object');
    const rawId = (raw as { id?: unknown }).id;
    passport.id = typeof rawId === 'string' && rawId.trim() ? rawId.trim() : newPassportId();
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
    const kind = input.kind;
    if (!(ENTRY_PASSPORT_KINDS as readonly unknown[]).includes(kind))
        fail(`kind must be one of ${ENTRY_PASSPORT_KINDS.join(', ')}`);
    if (typeof input.description !== 'string') fail('description must be a string');
    const language = optionalText(input, 'language');
    try {
        return await generateEntryPassport({
            name,
            kind,
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

function createApi(): NaiStudioApi {
    return Object.freeze({
        version: API_VERSION as 1,
        passports: (scope?: PassportScopeFilter) => list(scope),
        getPassport: (id: string) => {
            const found = typeof id === 'string' && id.trim() ? locatePassport(id.trim()) : null;
            return found ? structuredClone(found.resolved) : null;
        },
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
    });
}

let installed: NaiStudioApi | null = null;

/** Services the API needs from the running extension (activation passes them; enabling again keeps them). */
export interface PublicApiServices {
    backgrounds?: BackgroundService;
}

/** Publishes globalThis.NAI_STUDIO_API (activation). */
export function installPublicApi(services: PublicApiServices = {}): NaiStudioApi {
    if (services.backgrounds) backgrounds = services.backgrounds;
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
