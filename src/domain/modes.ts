// Generation modes of SillyTavern's built-in Image Generation (RECON §2.1.1), kept with the same
// numeric ids so migrated templates and media attachments (`generation_type`) stay compatible.
// Default templates are taken from SillyTavern (AGPL-3.0), public/scripts/extensions/stable-diffusion.

export const MODE = {
    TOOL: -2,
    MESSAGE: -1,
    CHARACTER: 0,
    USER: 1,
    SCENARIO: 2,
    RAW_LAST: 3,
    NOW: 4,
    FACE: 5,
    FREE: 6,
    BACKGROUND: 7,
    CHARACTER_MULTIMODAL: 8,
    USER_MULTIMODAL: 9,
    FACE_MULTIMODAL: 10,
    FREE_EXTENDED: 11,
} as const;

export type ModeId = (typeof MODE)[keyof typeof MODE];

/** Modes that have an editable template (everything except FREE). */
export const TEMPLATE_MODES: readonly ModeId[] = [
    MODE.MESSAGE,
    MODE.TOOL,
    MODE.CHARACTER,
    MODE.FACE,
    MODE.USER,
    MODE.SCENARIO,
    MODE.NOW,
    MODE.RAW_LAST,
    MODE.BACKGROUND,
    MODE.CHARACTER_MULTIMODAL,
    MODE.FACE_MULTIMODAL,
    MODE.USER_MULTIMODAL,
    MODE.FREE_EXTENDED,
];

/** Modes offered in the wand menu, with the trigger word each one answers to. */
export const TRIGGER_WORDS: Readonly<Partial<Record<ModeId, string>>> = {
    [MODE.CHARACTER]: 'you',
    [MODE.USER]: 'me',
    [MODE.SCENARIO]: 'scene',
    [MODE.RAW_LAST]: 'raw_last',
    [MODE.NOW]: 'last',
    [MODE.FACE]: 'face',
    [MODE.BACKGROUND]: 'background',
};

export const WAND_MODES: readonly ModeId[] = [
    MODE.CHARACTER,
    MODE.FACE,
    MODE.USER,
    MODE.SCENARIO,
    MODE.NOW,
    MODE.RAW_LAST,
    MODE.BACKGROUND,
];

const MULTIMODAL: Partial<Record<ModeId, ModeId>> = {
    [MODE.CHARACTER]: MODE.CHARACTER_MULTIMODAL,
    [MODE.USER]: MODE.USER_MULTIMODAL,
    [MODE.FACE]: MODE.FACE_MULTIMODAL,
};

/** Trigger text -> mode, as `/sd` resolves it (exact trigger word, case-insensitive; otherwise FREE). */
export function resolveMode(trigger: string, options: { multimodal: boolean; freeExtend: boolean }): ModeId {
    const word = trigger.trim().toLowerCase();
    let mode: ModeId = MODE.FREE;
    for (const [id, value] of Object.entries(TRIGGER_WORDS)) {
        if (value === word) {
            mode = Number(id) as ModeId;
            break;
        }
    }
    const multimodal = MULTIMODAL[mode];
    if (options.multimodal && multimodal !== undefined) {
        mode = multimodal;
    }
    if (mode === MODE.FREE && options.freeExtend) {
        mode = MODE.FREE_EXTENDED;
    }
    return mode;
}

/** The text mode a multimodal mode stands for (character, user, face); other modes unchanged. */
export function textModeOf(mode: ModeId): ModeId {
    const entry = Object.entries(MULTIMODAL).find(([, multimodal]) => multimodal === mode);
    return entry ? (Number(entry[0]) as ModeId) : mode;
}

export function isMultimodal(mode: ModeId): boolean {
    return mode === MODE.CHARACTER_MULTIMODAL || mode === MODE.USER_MULTIMODAL || mode === MODE.FACE_MULTIMODAL;
}

/** Interactive mode trigger ("send me a picture of ..."), built-in regex. */
const ACTIVATION =
    /\b(send|mail|imagine|generate|make|create|draw|paint|render|show)\b.{0,10}\b(pic|picture|image|drawing|painting|photo|photograph)\b(?:\s+of)?(?:\s+(?:a|an|the|this|that|those|your)?\s+)?(.+)/i;

const SPECIAL_CASES: [ModeId, string[]][] = [
    [MODE.CHARACTER, ['you', 'yourself']],
    [MODE.USER, ['me', 'myself']],
    [MODE.SCENARIO, ['story', 'scenario', 'whole story']],
    [MODE.NOW, ['last message']],
    [MODE.FACE, ['face', 'portrait', 'selfie']],
    [MODE.BACKGROUND, ['background', 'scene background', 'scene', 'scenery', 'surroundings', 'environment']],
];

/** Returns the trigger for a user message in interactive mode, or null when it does not ask for a picture. */
export function matchInteractiveTrigger(message: string): string | null {
    const match = message.toLowerCase().match(ACTIVATION);
    const subject = match?.[3]?.trim();
    if (!subject) {
        return null;
    }
    for (const [mode, phrases] of SPECIAL_CASES) {
        if (phrases.includes(subject)) {
            return TRIGGER_WORDS[mode] ?? subject;
        }
    }
    return subject;
}

/** Modes that skip the character prompt prefix (except image swipes in 1:1 chats). */
const NO_CHARACTER_PREFIX: readonly ModeId[] = [
    MODE.FREE,
    MODE.BACKGROUND,
    MODE.USER,
    MODE.USER_MULTIMODAL,
    MODE.FREE_EXTENDED,
];

export function usesCharacterPrefix(mode: ModeId, isSwipe: boolean, isCharacterChat: boolean): boolean {
    if (isSwipe && isCharacterChat) return true;
    return !NO_CHARACTER_PREFIX.includes(mode);
}

/**
 * Faces are forced to portrait and backgrounds to landscape; with `snap` the pixel count is kept.
 * Mirrors setTypeSpecificDimensions() of the built-in extension.
 */
export function modeDimensions(
    mode: ModeId,
    width: number,
    height: number,
    snap: boolean,
    presets: readonly { width: number; height: number }[] = [],
): { width: number; height: number } {
    let w = width;
    let h = height;
    const aspect = width / height;
    if ((mode === MODE.FACE || mode === MODE.FACE_MULTIMODAL) && aspect >= 1) {
        h = Math.round((w * 1.5) / 64) * 64;
    } else if (mode === MODE.BACKGROUND && aspect <= 1) {
        w = Math.round((h * 1.8) / 64) * 64;
    }
    if (snap && w * h !== width * height) {
        const ratio = Math.sqrt((width * height) / (w * h));
        w = Math.round((w * ratio) / 64) * 64;
        h = Math.round((h * ratio) / 64) * 64;
        const target = w / h;
        let best: { width: number; height: number } | null = null;
        for (const preset of presets) {
            if (
                !best ||
                Math.abs(preset.width / preset.height - target) < Math.abs(best.width / best.height - target)
            ) {
                best = preset;
            }
        }
        if (best) {
            w = best.width;
            h = best.height;
        }
    }
    return { width: w, height: h };
}

/** Default prompt templates by mode (keys are mode ids as strings, like the built-in settings). */
export const DEFAULT_TEMPLATES: Readonly<Record<string, string>> = {
    [MODE.MESSAGE]: '[{{char}} sends a picture that contains: {{prompt}}].',
    [MODE.TOOL]:
        'The text prompt used to generate the image. Must represent an exhaustive description of the desired image that will allow an artist or a photographer to perfectly recreate it.',
    [MODE.CHARACTER]:
        "In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'",
    [MODE.FACE]:
        "In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, facial features and expressions, occupation, hair and hair accessories (if any), what they are wearing on their upper body (if anything). Do not describe anything below their neck. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'close up facial portrait,'",
    [MODE.USER]:
        "Ignore previous instructions and provide a detailed description of {{user}}'s physical appearance from the perspective of {{char}} in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'. Ignore the rest of the story when crafting this description. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
    [MODE.SCENARIO]:
        "Ignore previous instructions and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not reply as {{char}} while writing this description.",
    [MODE.NOW]: `Ignore previous instructions. Your next response must be formatted as a single comma-delimited list of concise keywords.  The list will describe of the visual details included in the last chat message.

    Only mention characters by using pronouns ('he','his','she','her','it','its') or neutral nouns ('male', 'the man', 'female', 'the woman').

    Ignore non-visible things such as feelings, personality traits, thoughts, and spoken dialog.

    Add keywords in this precise order:
    a keyword to describe the location of the scene,
    a keyword to mention how many characters of each gender or type are present in the scene (minimum of two characters:
    {{user}} and {{char}}, example: '2 men ' or '1 man 1 woman ', '1 man 3 robots'),

    keywords to describe the relative physical positioning of the characters to each other (if a commonly known term for the positioning is known use it instead of describing the positioning in detail) + 'POV',

    a single keyword or phrase to describe the primary act taking place in the last chat message,

    keywords to describe {{char}}'s physical appearance and facial expression,
    keywords to describe {{char}}'s actions,
    keywords to describe {{user}}'s physical appearance and actions.

    If character actions involve direct physical interaction with another character, mention specifically which body parts interacting and how.

    A correctly formatted example response would be:
    '(location),(character list by gender),(primary action), (relative character position) POV, (character 1's description and actions), (character 2's description and actions)'`,
    [MODE.RAW_LAST]:
        'Ignore previous instructions and provide ONLY the last chat message string back to me verbatim. Do not write anything after the string. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.',
    [MODE.BACKGROUND]:
        "Ignore previous instructions and provide a detailed description of {{char}}'s surroundings in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: location, time of day, weather, lighting, and any other relevant details. Do not include descriptions of characters and non-visual qualities such as names, personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'background,'. Ignore the rest of the story when crafting this description. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
    [MODE.FACE_MULTIMODAL]:
        'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "close-up portrait".',
    [MODE.CHARACTER_MULTIMODAL]:
        'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
    [MODE.USER_MULTIMODAL]:
        'Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with "full body portrait".',
    [MODE.FREE_EXTENDED]:
        'Ignore previous instructions and provide an exhaustive comma-separated list of tags describing the appearance of "{0}" in great detail. Start with {{charPrefix}} (sic) if the subject is associated with {{char}}.',
};

/** Fills `{0}` with the trigger like the built-in stringFormat(); FREE returns the trigger itself. */
export function quietPromptFor(mode: ModeId, trigger: string, templates: Readonly<Record<string, string>>): string {
    if (mode === MODE.FREE) {
        return trigger;
    }
    const template = templates[String(mode)] ?? DEFAULT_TEMPLATES[String(mode)] ?? '';
    return template.replace(/\{0\}/g, trigger);
}
