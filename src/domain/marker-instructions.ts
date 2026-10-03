// The instruction that teaches the chat model to write image markers (TZ Phase 7). "natural"
// asks for plain-language descriptions (converted to tags by the language backend), "tags" for
// Danbooru tags, "custom" is the user's own text with the same variables.

export type MarkerPreset = 'natural' | 'tags' | 'custom';

export interface InstructionVars {
    min: number;
    max: number;
    captionLanguage: string;
    /** Names of the characters with passports (they can be put in "chars"). */
    chars: string[];
}

const COMMON_TAIL = `- "caption": a few words in {{captionLanguage}} shown under the picture.
- "chars": one entry per person in the picture (up to 4): {"name":"...","look":"...","action":"...","pos":"left|center|right"}. "look" is that one person only: "1girl" / "1boy" / "1other" first, then hair, eyes, body, clothes. Each person gets their own prompt, so looks of different people never mix: never describe people in "prompt".
- Characters whose looks are known{{charsHint}}: their name in "chars" is enough — their appearance is added automatically; "look" only for what they wear differently now.
- Optional keys: "ratio": "portrait", "landscape", "square", "wide" or "tall"; "negative": what must not be in the picture; "text": words written in the picture; "id": a short name for the picture and "ref": the id of an earlier picture to continue its scene; "spoiler": true for a picture that gives too much away.
- Write the marker exactly in this form, inside the reply where the picture belongs. Never write image links or file names, and do not talk about the markers.`;

export const MARKER_TEMPLATES: Record<Exclude<MarkerPreset, 'custom'>, string> = {
    natural: `[Illustrations]
You can show pictures inside your reply. Where a picture really adds something (a new place, an important moment, how someone looks), put an image marker on its own line:
<img data-nai='{"prompt":"what the picture shows, in plain words","caption":"short caption"}'>
- {{count}}
- "prompt": describe the picture in plain words, in any language: how many people and what they do together, the place, the light, the mood and the camera angle. The looks of each person go to "chars". No tag lists, no quality words.
${COMMON_TAIL}`,
    tags: `[Illustrations]
You can show pictures inside your reply. Where a picture really adds something (a new place, an important moment, how someone looks), put an image marker on its own line:
<img data-nai='{"prompt":"1girl, red hair, school uniform, sitting, classroom, evening light","caption":"short caption"}'>
- {{count}}
- "prompt": Danbooru-style tags in English separated by commas (count of people, what they do together, place, light, camera), optionally followed by one short sentence. The looks of each person go to "chars".
${COMMON_TAIL}`,
};

function countRule(min: number, max: number): string {
    const lo = Math.max(0, Math.floor(min));
    const hi = Math.max(lo, Math.floor(max));
    if (hi <= 0) return 'Do not add pictures.';
    if (lo === 0) return `Use at most ${hi} ${hi === 1 ? 'picture' : 'pictures'} per reply, none when nothing fits.`;
    if (lo === hi) return `Use exactly ${hi} ${hi === 1 ? 'picture' : 'pictures'} per reply.`;
    return `Use ${lo} to ${hi} pictures per reply.`;
}

/** The instruction text for a preset; an empty custom text falls back to "natural". */
export function markerInstruction(preset: MarkerPreset, custom: string, vars: InstructionVars): string {
    const template =
        preset === 'custom' && custom.trim() ? custom : MARKER_TEMPLATES[preset === 'tags' ? 'tags' : 'natural'];
    const names = vars.chars.map((n) => n.trim()).filter(Boolean);
    const values: Record<string, string> = {
        count: countRule(vars.min, vars.max),
        min: String(vars.min),
        max: String(vars.max),
        captionLanguage: vars.captionLanguage.trim() || 'the language of the reply',
        chars: names.join(', '),
        charsHint: names.length ? ` (known characters: ${names.join(', ')})` : '',
    };
    return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => values[key] ?? whole).trim();
}
