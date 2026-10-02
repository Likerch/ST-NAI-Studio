// Per-character prompt prefixes (built-in "Character-specific prompt prefix", RECON §2.1.7).
// Local copy lives in extensionSettings.nai_studio.prompts.characterPrompts[avatarKey]; a shared
// copy can travel with the card in character.data.extensions.nai_studio.characterPrompt. Cards shared
// by the built-in (data.extensions.sd_character_prompt) are read as a fallback, never written.
import { ctx } from '../../core/context';
import { settings, saveSettings } from '../../core/settings';
import type { CharacterPromptSettings } from '../../core/settings-schema';

export const CARD_FIELD = 'nai_studio';
/** Card field the built-in writes when its "Shareable" box is checked (RECON §2.1.7). */
export const BUILTIN_CARD_FIELD = 'sd_character_prompt';

const EMPTY: CharacterPromptSettings = { positive: '', negative: '' };

/** Avatar file name without extension: the key the built-in uses (getCharaFilename). */
export function avatarKey(avatar: string | undefined): string {
    return (avatar ?? '').replace(/\.[^/.]+$/, '');
}

/** Index of the character of a 1:1 chat, undefined in groups or with no character selected. */
export function soloCharacterIndex(): number | undefined {
    const c = ctx();
    if (c.groupId || c.characterId === undefined || c.characterId === null || c.characterId === '') return undefined;
    const index = Number(c.characterId);
    return Number.isInteger(index) && c.characters[index] ? index : undefined;
}

function asPrompt(value: unknown): CharacterPromptSettings | null {
    if (!value || typeof value !== 'object') return null;
    const prompt = value as Partial<CharacterPromptSettings>;
    return { positive: String(prompt.positive ?? ''), negative: String(prompt.negative ?? '') };
}

/** The card's shared prompt: ours first, then the built-in's. `own` = stored in our field. */
function cardPrompt(character: STCharacter | undefined): { prompt: CharacterPromptSettings; own: boolean } | null {
    const extensions = character?.data?.extensions;
    const own = asPrompt((extensions?.[CARD_FIELD] as { characterPrompt?: unknown } | undefined)?.characterPrompt);
    if (own) return { prompt: own, own: true };
    const builtIn = asPrompt(extensions?.[BUILTIN_CARD_FIELD]);
    return builtIn ? { prompt: builtIn, own: false } : null;
}

/** Local values win; empty local values fall back to the card (same precedence as the built-in). */
export function readCharacterPrompt(character: STCharacter | undefined): CharacterPromptSettings & { shared: boolean } {
    if (!character) return { ...EMPTY, shared: false };
    const local = settings().prompts.characterPrompts[avatarKey(character.avatar)] ?? EMPTY;
    const card = cardPrompt(character);
    return {
        positive: local.positive || card?.prompt.positive || '',
        negative: local.negative || card?.prompt.negative || '',
        shared: card?.own === true,
    };
}

/** Prompt of the current 1:1 character (empty in groups, like the built-in). */
export function currentCharacterPrompt(): CharacterPromptSettings {
    const index = soloCharacterIndex();
    return index === undefined ? EMPTY : readCharacterPrompt(ctx().characters[index]);
}

/** Free mode `char` prefix: current character, or in groups the last character who spoke. */
export function lastSpeakerPrompt(): CharacterPromptSettings {
    const c = ctx();
    const index = soloCharacterIndex();
    if (index !== undefined) return readCharacterPrompt(c.characters[index]);
    for (let i = c.chat.length - 1; i >= 0; i--) {
        const message = c.chat[i];
        const avatar = message?.original_avatar;
        if (message && !message.is_user && !message.is_system && typeof avatar === 'string') {
            return readCharacterPrompt(c.characters.find((ch) => ch.avatar === avatar));
        }
    }
    return EMPTY;
}

export async function saveCharacterPrompt(
    index: number,
    value: CharacterPromptSettings,
    share: boolean,
): Promise<void> {
    const c = ctx();
    const character = c.characters[index];
    if (!character) return;
    settings().prompts.characterPrompts[avatarKey(character.avatar)] = { ...value };
    saveSettings();
    const existing = (character.data?.extensions?.[CARD_FIELD] as Record<string, unknown> | undefined) ?? {};
    if (share) {
        await c.writeExtensionField(index, CARD_FIELD, { ...existing, characterPrompt: { ...value } });
    } else if (existing.characterPrompt) {
        await c.writeExtensionField(index, CARD_FIELD, { ...existing, characterPrompt: null });
    }
}
