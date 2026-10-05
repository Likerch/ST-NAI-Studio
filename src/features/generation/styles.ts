// Saved styles: prefix, suffix, undesired content and the UC preset (v0.9.5). A style without a UC
// preset (saved before v0.9.5) leaves the current one as it is. Since v0.13 a style's negative either
// replaces the undesired content or is added after the base negative of all styles; the current
// fields (`generation.negativePrompt`) always hold the effective undesired content, so every
// generation path that reads them gets it.
import type { NaiStudioSettings, StyleSettings } from '../../core/settings-schema';
import {
    DEFAULT_MODEL,
    effectiveNegative,
    getCapabilities,
    isModelId,
    negativeMode,
    ownNegative,
    sameNegative,
    UC_PRESETS,
} from '../../domain';
import type { NegativeMode, UcPresetId } from '../../domain';

/** The style's UC preset when it is a known one. */
export function styleUcPreset(style: StyleSettings): UcPresetId | undefined {
    const preset = style.ucPreset;
    return preset && (UC_PRESETS as readonly string[]).includes(preset) ? (preset as UcPresetId) : undefined;
}

/** A saved style by name, ignoring case and spaces around it. */
export function findStyle(s: NaiStudioSettings, name: string): StyleSettings | undefined {
    const wanted = name.trim().toLowerCase();
    return wanted ? s.prompts.styles.find((style) => style.name.trim().toLowerCase() === wanted) : undefined;
}

/** The active style, if it still exists. */
export function activeStyle(s: NaiStudioSettings): StyleSettings | undefined {
    const name = s.prompts.activeStyle;
    if (!name) return undefined;
    return s.prompts.styles.find((style) => style.name === name) ?? findStyle(s, name);
}

/** How the style's negative works ("replace" for styles saved before v0.13). */
export function styleNegativeMode(style: StyleSettings): NegativeMode {
    return negativeMode(style.negativeMode);
}

/** The undesired content a style gives: its negative, or the base negative and then its negative. */
export function styleNegative(s: NaiStudioSettings, style: StyleSettings): string {
    return effectiveNegative(s.prompts.baseNegative, style.negative, styleNegativeMode(style));
}

/** Negative mode of the current fields: the editor's with an active style, else "replace". */
export function currentNegativeMode(s: NaiStudioSettings): NegativeMode {
    return activeStyle(s) ? negativeMode(s.prompts.negativeMode) : 'replace';
}

/** The style's own part of the current undesired content (`typed`: what the editor shows). */
export function currentOwnNegative(s: NaiStudioSettings, typed?: string): string {
    return ownNegative(s.generation.negativePrompt, s.prompts.baseNegative, currentNegativeMode(s), [
        typed,
        activeStyle(s)?.negative,
    ]);
}

/** Sets the style's own negative of the current fields; the undesired content follows its mode. */
export function setOwnNegative(s: NaiStudioSettings, own: string): void {
    s.generation.negativePrompt = effectiveNegative(s.prompts.baseNegative, own, currentNegativeMode(s));
}

/** Switches the negative mode of the current fields, keeping the style's own negative. */
export function setNegativeMode(s: NaiStudioSettings, mode: NegativeMode, own = currentOwnNegative(s)): void {
    s.prompts.negativeMode = mode;
    setOwnNegative(s, own);
}

/** Changes the base negative; the undesired content of an active "append" style follows it. */
export function setBaseNegative(s: NaiStudioSettings, base: string, own = currentOwnNegative(s)): void {
    s.prompts.baseNegative = base;
    if (currentNegativeMode(s) === 'append') setOwnNegative(s, own);
}

/** Puts a style into the fields it fills and makes it the active one. */
export function applyStyle(s: NaiStudioSettings, style: StyleSettings): void {
    s.prompts.activeStyle = style.name;
    s.prompts.prefix = style.prefix;
    s.prompts.suffix = style.suffix;
    s.prompts.negativeMode = styleNegativeMode(style);
    s.generation.negativePrompt = styleNegative(s, style);
    const preset = styleUcPreset(style);
    if (preset) s.generation.ucPreset = preset;
}

/** The current fields as a style under this name (`typed`: the own negative the editor shows). */
export function styleFromSettings(s: NaiStudioSettings, name: string, typed?: string): StyleSettings {
    return {
        name,
        prefix: s.prompts.prefix,
        suffix: s.prompts.suffix,
        negative: currentOwnNegative(s, typed),
        ucPreset: s.generation.ucPreset,
        negativeMode: currentNegativeMode(s),
    };
}

/**
 * The current fields differ from the saved style: prefix, suffix, negative mode, the undesired content
 * it gives, or its UC preset (when it has one the current model offers).
 */
export function styleChanged(s: NaiStudioSettings, style: StyleSettings | undefined = activeStyle(s)): boolean {
    if (!style) return false;
    if (s.prompts.prefix !== style.prefix || s.prompts.suffix !== style.suffix) return true;
    if (negativeMode(s.prompts.negativeMode) !== styleNegativeMode(style)) return true;
    if (!sameNegative(s.generation.negativePrompt, styleNegative(s, style))) return true;
    const preset = styleUcPreset(style);
    if (!preset || preset === s.generation.ucPreset) return false;
    const model = s.generation.model;
    return getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).ucPresets.includes(preset);
}
