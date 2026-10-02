// Explicit scenes (v0.9.4). The NSFW layer of a passport joins automatic scenes (image markers, the
// LLM tool) only when the scene itself is explicit: "allow NSFW" permits the layer, it does not force
// it into every picture. Danbooru tags and Russian words as whole words, Russian stems at a word start.
import words from '../data/explicit-words.json';

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WHOLE = new RegExp(`(^|[^\\p{L}\\p{N}])(${words.tags.map(escape).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu');
const STEMS = new RegExp(`(^|[^\\p{L}\\p{N}])(${words.stems.map(escape).join('|')})`, 'iu');

/** True when the text of a scene asks for nudity or sex. */
export function isExplicitScene(text: string): boolean {
    const normalized = text.replace(/_/g, ' ');
    return WHOLE.test(normalized) || STEMS.test(normalized);
}

/** Undesired content of every explicit scene: no childlike looks. */
export const EXPLICIT_NEGATIVE = 'child, loli, shota, underage';

/**
 * An explicit scene (v0.9.8) gets "nsfw" in its prompt, so NovelAI's UC preset leaves it out of the
 * undesired content as the website does, and EXPLICIT_NEGATIVE. Null for other scenes.
 */
export function explicitScene(
    scene: string,
    characterPrompts: readonly string[],
): { scene: string; negative: string } | null {
    if (!isExplicitScene([scene, ...characterPrompts].join(', '))) return null;
    const hasTag = /(^|[^a-z])nsfw([^a-z]|$)/i.test(scene);
    return { scene: hasTag ? scene : scene.trim() ? `nsfw, ${scene}` : 'nsfw', negative: EXPLICIT_NEGATIVE };
}
