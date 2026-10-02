// Saved styles (v0.9.5): prefix, suffix, undesired content and the UC preset. A style without a UC
// preset (saved before v0.9.5) leaves the current one as it is.
import type { NaiStudioSettings, StyleSettings } from '../../core/settings-schema';
import { UC_PRESETS } from '../../domain';
import type { UcPresetId } from '../../domain';

/** The style's UC preset when it is a known one. */
export function styleUcPreset(style: StyleSettings): UcPresetId | undefined {
    const preset = style.ucPreset;
    return preset && (UC_PRESETS as readonly string[]).includes(preset) ? (preset as UcPresetId) : undefined;
}

/** Puts a style into the fields it fills and makes it the active one. */
export function applyStyle(s: NaiStudioSettings, style: StyleSettings): void {
    s.prompts.activeStyle = style.name;
    s.prompts.prefix = style.prefix;
    s.prompts.suffix = style.suffix;
    s.generation.negativePrompt = style.negative;
    const preset = styleUcPreset(style);
    if (preset) s.generation.ucPreset = preset;
}

/** The current fields as a style under this name. */
export function styleFromSettings(s: NaiStudioSettings, name: string): StyleSettings {
    return {
        name,
        prefix: s.prompts.prefix,
        suffix: s.prompts.suffix,
        negative: s.generation.negativePrompt,
        ucPreset: s.generation.ucPreset,
    };
}
