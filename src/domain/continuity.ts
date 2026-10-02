// Scene continuity (TZ Phase 6): the last image of a location becomes the img2img base or a vibe
// for the next picture there; the binding "location → reference" lives in the chat metadata.

export interface LocationRef {
    /** Display name as the user typed it. */
    name: string;
    /** Image in /user/images. */
    filePath: string;
    width: number;
    height: number;
    model: string;
    seed: number;
    prompt: string;
    updatedAt: string;
}

export type ContinuityMode = 'img2img' | 'vibe';

export function locationKey(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The known location named in the text (whole words, case-insensitive; the longest name wins). */
export function detectLocation(text: string, names: string[]): string | null {
    const sorted = [...names].filter((n) => n.trim()).sort((a, b) => b.length - a.length);
    for (const name of sorted) {
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(name.trim())}($|[^\\p{L}\\p{N}])`, 'iu');
        if (pattern.test(text)) return name;
    }
    return null;
}

/** Strength for img2img continuity: low keeps the place, high follows the new prompt. */
export function clampContinuityStrength(value: number): number {
    return Number.isFinite(value) ? Math.min(0.95, Math.max(0.1, value)) : 0.6;
}
