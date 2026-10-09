// Passports written from the description (v0.8): the card's description, personality, scenario and
// first message, or the persona description, go to the language backend; the answer becomes
// passports for the user to review before saving. Since v0.12 also one passport of a lorebook entry
// for another extension (NAI_STUDIO_API.generatePassport); nothing is saved.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import {
    PASSPORT_GEN_SCHEMA,
    parseGeneratedPassports,
    passportGenMessages,
    sentencesNaming,
    withoutUnstatedSpecies,
} from '../../domain';
import type { EntryPassportKind, Passport, PassportGenOptions, PassportSource, PassportTarget } from '../../domain';
import { askLlm } from '../language/llm';
import { loadCharacter } from './passport-store';

/**
 * Answer budget per target: a card has many passports; a persona passport has its outfits (since 0.15
 * room for 5-6 of them); one tracker character or lore entry is short. NovelAI's text route through the
 * plugin allows up to 4096.
 */
const MAX_TOKENS: Record<PassportTarget, number> = { card: 3500, persona: 2000, npc: 1200, entry: 1200 };

async function ask(
    source: PassportSource,
    target: PassportTarget,
    options: PassportGenOptions = {},
): Promise<Passport[]> {
    if (!source.description.trim() && !source.firstMessage?.trim()) {
        throw new NaiError('translation-failed', 'none', { message: 'the description is empty' });
    }
    const { system, user } = passportGenMessages(source, target, options);
    const answer = await askLlm({
        system,
        user,
        schema: PASSPORT_GEN_SCHEMA,
        maxTokens: MAX_TOKENS[target],
    });
    const passports = withoutUnstatedSpecies(parseGeneratedPassports(answer, source.name, options.kind), user);
    if (!passports.length) {
        log.warn('passport generation: no usable passports in', answer.slice(0, 300));
        throw new NaiError('translation-failed', 'none', { message: 'the answer had no usable passports' });
    }
    return passports;
}

/** Passports for every character, the world, places, the scenario and objects of a card. */
export async function generateCardPassports(index: number): Promise<Passport[]> {
    const character = await loadCharacter(index);
    if (!character) throw new NaiError('no-usable-message', 'none');
    const c = ctx();
    const sub = (text: string | undefined) => c.substituteParams(text ?? '');
    const passports = await ask(
        {
            name: character.name,
            description: sub(character.description),
            personality: sub(character.personality),
            scenario: sub(character.scenario),
            firstMessage: sub(character.first_mes),
        },
        'card',
    );
    // The card's own character keeps the card name, so it stays the main passport.
    const own = passports.find((p) => p.kind === 'character' && p.name.toLowerCase() === character.name.toLowerCase());
    if (own) own.name = '';
    return passports;
}

/**
 * One character passport for a character of a scene tracker (Doom's Enhancement Suite, v0.9): their
 * current look from the tracker, and the sentences of the card that name them.
 */
export async function generateTrackerPassport(name: string, look: string, cardIndex: number | null): Promise<Passport> {
    const character = cardIndex === null ? undefined : await loadCharacter(cardIndex);
    const c = ctx();
    const [first] = await ask(
        {
            name,
            description: look,
            // Only what the card says about this character: its other people must not leak in.
            scenario: character ? sentencesNaming(c.substituteParams(character.description ?? ''), [name]) : '',
        },
        'npc',
    );
    const passport = first!;
    passport.kind = 'character';
    passport.name = name;
    return passport;
}

export interface EntryPassportRequest {
    name: string;
    kind: EntryPassportKind;
    /** What the entry says (macros like {{char}} are substituted). */
    description: string;
    /** Language of the story ("ru"): the name as it spells it goes to the aliases. */
    language?: string;
}

/**
 * One passport of a lorebook entry (v0.12, NAI_STUDIO_API.generatePassport): the person, place, item or
 * world of the entry from its text, through the language backend. It keeps the given name (the name
 * the model wrote becomes an alias) and a new id; nothing is saved.
 */
export async function generateEntryPassport(request: EntryPassportRequest): Promise<Passport> {
    const c = ctx();
    const passports = await ask({ name: request.name, description: c.substituteParams(request.description) }, 'entry', {
        kind: request.kind,
        ...(request.language ? { language: request.language } : {}),
    });
    const passport = passports.find((p) => p.kind === request.kind);
    if (!passport) {
        throw new NaiError('translation-failed', 'none', { message: `the answer had no ${request.kind} passport` });
    }
    return named(passport, request.name);
}

/** The given name; the one the model wrote becomes an alias. */
function named(passport: Passport, name: string): Passport {
    const wanted = name.trim();
    passport.aliases = [...new Set([passport.name, ...passport.aliases])].filter(
        (alias) => alias.trim() && alias.trim().toLowerCase() !== wanted.toLowerCase(),
    );
    passport.name = wanted;
    return passport;
}

export interface PersonaPassportRequest {
    name: string;
    /** The description of the persona (or of the character it is made for); macros are substituted. */
    description: string;
    /** Language of the story ("ru"): the name as it spells it goes to the aliases. */
    language?: string;
}

/**
 * One persona passport from a given description (since 0.15, NAI_STUDIO_API.generatePassport with
 * `persona: true`): the persona prompt with its outfits instead of the lore entry one. It keeps the given
 * name (the model's becomes an alias) and a new id; nothing is saved.
 */
export async function generatePersonaPassportFrom(request: PersonaPassportRequest): Promise<Passport> {
    const c = ctx();
    const passports = await ask(
        { name: request.name, description: c.substituteParams(request.description) },
        'persona',
        request.language ? { language: request.language } : {},
    );
    const passport = passports.find((p) => p.kind === 'character');
    if (!passport) {
        throw new NaiError('translation-failed', 'none', { message: 'the answer had no character passport' });
    }
    return named(passport, request.name);
}

/** One character passport from the current persona's description. */
export async function generatePersonaPassport(): Promise<Passport> {
    const c = ctx();
    const description = String(c.powerUserSettings.persona_description ?? '');
    const [first] = await ask({ name: c.name1, description: c.substituteParams(description) }, 'persona');
    const passport = first!;
    passport.kind = 'character';
    passport.name = '';
    return passport;
}
