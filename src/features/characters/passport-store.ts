// Passports (TZ Phase 4, several per card since v0.8): characters keep theirs in the card
// (data.extensions.nai_studio.passports, travels with export/import; the single "passport" of
// older versions is still read); user personas have no card, so theirs live in our settings.
import { ctx, importHost } from '../../core/context';
import { saveSettings, settings } from '../../core/settings';
import { normalizePassport, normalizePassportList, primaryPassport } from '../../domain';
import type { Passport } from '../../domain';
import { CARD_FIELD } from './character-prompts';

interface PersonasModule {
    user_avatar: string;
}

const savedListeners = new Set<(index: number, passports: Passport[]) => void>();

/** Called after the passports of a card are saved (integrations keep their copies in sync). */
export function onPassportsSaved(listener: (index: number, passports: Passport[]) => void): void {
    savedListeners.add(listener);
}

function cardField(character: STCharacter | undefined): { passport?: unknown; passports?: unknown } | undefined {
    return character?.data?.extensions?.[CARD_FIELD] as { passport?: unknown; passports?: unknown } | undefined;
}

/** Every passport of the card (characters, world, locations, scenario, objects). */
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
}

/** Replaces one passport of the card by id (or adds it). */
export async function saveCardPassport(index: number, passport: Passport): Promise<void> {
    const list = cardPassports(await loadCharacter(index));
    const at = list.findIndex((p) => p.id === passport.id);
    if (at >= 0) list[at] = passport;
    else list.push(passport);
    await saveCardPassports(index, list);
}

export async function currentPersonaKey(): Promise<string> {
    try {
        const personas = await importHost<PersonasModule>('/scripts/personas.js');
        return personas.user_avatar || 'default';
    } catch {
        return 'default';
    }
}

export function personaPassport(key: string): Passport | null {
    return normalizePassport(settings().scene.personaPassports[key]);
}

export function savePersonaPassport(key: string, passport: Passport): void {
    settings().scene.personaPassports[key] = passport;
    saveSettings();
}
