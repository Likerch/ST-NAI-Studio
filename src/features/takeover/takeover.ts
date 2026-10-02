// Replacing the built-in Image Generation (TZ Phase 2, tasks 9-10): one-time migration with a
// report, and disabling the built-in with the user's confirmation (RECON §2.10).
import { ctx } from '../../core/context';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { replaceSettings, settings } from '../../core/settings';
import { avatarKey } from '../characters/character-prompts';
import { migrateFromBuiltIn } from './migration';
import type { CardPrompt, MigrationLine } from './migration';

/** Internal name of the built-in extension in extension_settings.disabledExtensions. */
export const BUILTIN_NAME = 'stable-diffusion';

export function isBuiltInActive(): boolean {
    const disabled = ctx().extensionSettings.disabledExtensions;
    return !(Array.isArray(disabled) && disabled.includes(BUILTIN_NAME));
}

export function builtInSettings(): unknown {
    return ctx().extensionSettings.sd;
}

/** Built-in commands, macros, tool and interactive mode are owned by NAI Studio only after takeover. */
export function ownsCompatSurface(): boolean {
    return !isBuiltInActive();
}

/** Shared per-character prompts of the built-in, read from every card (lazy cards are loaded). */
export async function collectCardPrompts(): Promise<CardPrompt[]> {
    const c = ctx();
    const result: CardPrompt[] = [];
    for (let i = 0; i < c.characters.length; i++) {
        let character = c.characters[i];
        if (!character) continue;
        if (character.shallow) {
            try {
                await c.unshallowCharacter(i);
                character = ctx().characters[i] ?? character;
            } catch (error) {
                log.warn('could not load character card', character.avatar, error);
                continue;
            }
        }
        const shared = character.data?.extensions?.sd_character_prompt as
            { positive?: unknown; negative?: unknown } | null | undefined;
        if (shared && typeof shared === 'object') {
            result.push({
                key: avatarKey(character.avatar),
                positive: typeof shared.positive === 'string' ? shared.positive : '',
                negative: typeof shared.negative === 'string' ? shared.negative : '',
            });
        }
    }
    return result;
}

export function needsMigration(): boolean {
    return !settings().takeover.migratedAt && builtInSettings() !== undefined;
}

export function describe(lines: MigrationLine[]): string[] {
    return lines.map((line) => t(`naist.migration.${line.key}`, line.params));
}

/** Runs the migration once and stores the localized report. Returns the report lines. */
export async function runMigration(now: Date = new Date()): Promise<string[]> {
    const cards = await collectCardPrompts();
    const result = migrateFromBuiltIn(builtInSettings(), cards, settings());
    const report = describe(result.lines);
    result.settings.takeover = { migratedAt: now.toISOString(), migrationReport: report };
    replaceSettings(result.settings);
    log.info('migration from the built-in Image Generation done', report);
    return report;
}

/** Disables the built-in extension; SillyTavern reloads the page. */
export async function disableBuiltIn(): Promise<void> {
    await ctx().executeSlashCommandsWithOptions(`/extension-disable ${BUILTIN_NAME}`);
}

export async function enableBuiltIn(): Promise<void> {
    await ctx().executeSlashCommandsWithOptions(`/extension-enable ${BUILTIN_NAME}`);
}
