// Passports other extensions give for a scene (v0.12, NAI_STUDIO_API.registerPassportProvider): Maestro
// gives the passports of the lore entries activated or mentioned in the scene — places, items,
// creatures, people without a card. Pure: a provider's answer as passports, and the ones NAI Studio
// does not know yet by name or alias (the passports it has — cards, persona, chat — win).
import { isPassportEmpty, normalizePassport } from './passport';
import type { Passport, PassportKind } from './passport';
import { mentionIndex } from './scene-assembly';

/** Anything with a name and other names (a passport, a scene candidate, a location). */
export interface Named {
    name: string;
    aliases: readonly string[];
}

/** Where a passport counts in a scene: a person, the setting (world, scenario), a place or an item. */
export type PassportGroup = 'character' | 'setting' | 'location' | 'object';

export function passportGroup(kind: PassportKind): PassportGroup {
    return kind === 'world' || kind === 'scenario' ? 'setting' : kind;
}

/**
 * The same one under two entries: one name (or alias) is a whole word of the other's name, also in a
 * declined Russian form (the matcher of scene participants). Nameless entries are never the same.
 */
export function sameNamed(a: Named, b: Named): boolean {
    if (!a.name.trim() || !b.name.trim()) return false;
    return mentionIndex(a.name, [b.name, ...b.aliases]) >= 0 || mentionIndex(b.name, [a.name, ...a.aliases]) >= 0;
}

/**
 * A provider's answer as passports: junk, empty passports and nameless ones (except a world or a
 * scenario) are left out; a passport without an id gets a stable one from the provider, kind and name.
 */
export function normalizeProvidedPassports(raw: unknown, providerId: string): Passport[] {
    if (!Array.isArray(raw)) return [];
    const result: Passport[] = [];
    for (const item of raw) {
        const passport = normalizePassport(item);
        if (!passport || isPassportEmpty(passport)) continue;
        if (!passport.name && passportGroup(passport.kind) !== 'setting') continue;
        const id = (item as { id?: unknown }).id;
        if (typeof id !== 'string' || !id.trim()) {
            passport.id = `${providerId}:${passport.kind}:${passport.name.toLowerCase() || result.length}`;
        }
        result.push(passport);
    }
    return result;
}

/**
 * Provider passports (best first) NAI Studio does not have yet: one named like a known entry or like an
 * earlier provider passport is left out. Pass passports and known entries of one group.
 */
export function unknownPassports(provided: readonly Passport[], known: readonly Named[]): Passport[] {
    const kept: Passport[] = [];
    for (const passport of provided) {
        const same = (other: Named) => sameNamed(passport, other);
        if (known.some(same) || kept.some(same)) continue;
        kept.push(passport);
    }
    return kept;
}
