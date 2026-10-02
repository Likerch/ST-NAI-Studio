// Passports written from the description (v0.8): the card's description, personality, scenario and
// first message, or the persona description, go to the language backend; the answer becomes
// passports for the user to review before saving.
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
import type { Passport, PassportSource, PassportTarget } from '../../domain';
import { askLlm } from '../language/llm';
import { loadCharacter } from './passport-store';

async function ask(source: PassportSource, target: PassportTarget): Promise<Passport[]> {
    if (!source.description.trim() && !source.firstMessage?.trim()) {
        throw new NaiError('translation-failed', 'none', { message: 'the description is empty' });
    }
    const { system, user } = passportGenMessages(source, target);
    const answer = await askLlm({
        system,
        user,
        schema: PASSPORT_GEN_SCHEMA,
        maxTokens: target === 'card' ? 3500 : 1200,
    });
    const passports = withoutUnstatedSpecies(parseGeneratedPassports(answer, source.name), user);
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
