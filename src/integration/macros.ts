// {{charPrefix}} / {{charNegativePrefix}} macros of the built-in, now backed by NAI Studio's
// character prompts. Registered only after takeover so the two never fight over the names.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { currentCharacterPrompt } from '../features/characters/character-prompts';

export function registerMacros(): void {
    const c = ctx();
    const positive = () => currentCharacterPrompt().positive;
    const negative = () => currentCharacterPrompt().negative;
    const engine = c.powerUserSettings.experimental_macro_engine !== false;
    if (engine && c.macros) {
        const category = c.macros.category?.PROMPTS;
        c.macros.register('charPrefix', { category, description: t('naist.macro.charPrefix'), handler: positive });
        c.macros.register('charNegativePrefix', {
            category,
            description: t('naist.macro.charNegativePrefix'),
            handler: negative,
        });
    } else if (c.registerMacro) {
        c.registerMacro('charPrefix', positive, t('naist.macro.charPrefix'));
        c.registerMacro('charNegativePrefix', negative, t('naist.macro.charNegativePrefix'));
    }
}

/** {{nai_characters}}: characters of the chat with a passport (their looks are added by name). */
export function registerCharactersMacro(names: () => string): void {
    const c = ctx();
    const engine = c.powerUserSettings.experimental_macro_engine !== false;
    if (engine && c.macros) {
        c.macros.register('nai_characters', {
            category: c.macros.category?.PROMPTS,
            description: t('naist.macro.characters'),
            handler: names,
        });
    } else if (c.registerMacro) {
        c.registerMacro('nai_characters', names, t('naist.macro.characters'));
    }
}
