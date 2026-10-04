// NAI_STUDIO_API (v0.10): the public interface for other extensions (Maestro, its plan §16). Read and
// write passports in the card or for the current chat only, switch outfits and states, listen to
// "passports saved" and "image ready", and register scene providers. Installed on activation,
// removed on disable. Version 1: within a version members are only added, never changed.
import { ctx } from '../core/context';
import { log } from '../core/logger';
import { newPassportId, normalizePassport } from '../domain';
import type { Passport, SceneHint } from '../domain';
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
import { onStudioEvent, STUDIO_EVENTS } from '../features/events/studio-events';
import type { StudioEventName, StudioEvents } from '../features/events/studio-events';
import { registerSceneHintProvider } from '../features/scene/scene-providers';
import type { SceneHintContext } from '../features/scene/scene-providers';

export type {
    ImageReadyDetail,
    ImageReadyKind,
    PassportsSavedDetail,
    StudioEventName,
} from '../features/events/studio-events';
export type { SceneHint } from '../domain';
export type { SceneHintContext } from '../features/scene/scene-providers';

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
}

/** Unsubscriptions of everything registered through the API (dropped on disable). */
const registrations = new Set<() => void>();

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
    });
}

let installed: NaiStudioApi | null = null;

/** Publishes globalThis.NAI_STUDIO_API (activation). */
export function installPublicApi(): NaiStudioApi {
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
