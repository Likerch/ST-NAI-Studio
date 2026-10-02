// Passports (TZ Phase 4): characters keep theirs in the card (data.extensions.nai_studio.passport,
// travels with export/import); user personas have no card, so theirs live in our settings.
import { ctx, importHost } from '../../core/context';
import { saveSettings, settings } from '../../core/settings';
import { normalizePassport } from '../../domain';
import type { Passport } from '../../domain';
import { CARD_FIELD } from './character-prompts';

interface PersonasModule {
    user_avatar: string;
}

export function cardPassport(character: STCharacter | undefined): Passport | null {
    const field = character?.data?.extensions?.[CARD_FIELD] as { passport?: unknown } | undefined;
    return normalizePassport(field?.passport);
}

/** Lazily loaded cards (shallow) have no extensions until unshallowed. */
export async function loadCharacter(index: number): Promise<STCharacter | undefined> {
    const c = ctx();
    const character = c.characters[index];
    if (character?.shallow) await c.unshallowCharacter(index);
    return ctx().characters[index];
}

export async function saveCardPassport(index: number, passport: Passport): Promise<void> {
    const c = ctx();
    const character = await loadCharacter(index);
    if (!character) return;
    const existing = (character.data?.extensions?.[CARD_FIELD] as Record<string, unknown> | undefined) ?? {};
    await c.writeExtensionField(index, CARD_FIELD, { ...existing, passport });
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
