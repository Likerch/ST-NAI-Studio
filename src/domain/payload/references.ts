// Vibe transfer and character (director) references (RECON §2.5 of bundle analysis, §3.12).
import type { NaiDirectorReferenceDescription, NaiParameters } from '../../shared/nai-wire';
import type { ModelCapabilities } from '../capabilities';
import type { GenerationRequest } from '../types';
import type { BuildContext } from './context';

export const MAX_VIBES = 16;
export const MAX_CHARACTER_REFERENCES = 16;

function normalizedStrengths(strengths: number[], normalize: boolean): number[] {
    const total = strengths.reduce((sum, s) => sum + Math.abs(s), 0);
    if (!normalize || strengths.length < 2 || total <= 1) {
        return strengths;
    }
    return strengths.map((s) => s / total);
}

function unsupportedReason(caps: ModelCapabilities): 'feature-flag-off' | 'unsupported-by-model' {
    return caps.family === 'v5' ? 'feature-flag-off' : 'unsupported-by-model';
}

/** Returns true when character references were applied (vibes are then suppressed). */
export function applyCharacterReferences(
    params: NaiParameters,
    req: GenerationRequest,
    caps: ModelCapabilities,
    ctx: BuildContext,
): boolean {
    const refs = req.characterReferences;
    if (refs.length === 0) {
        return false;
    }
    if (!caps.characterReference) {
        ctx.drop('parameters.director_reference_images', unsupportedReason(caps), true);
        return false;
    }
    if (req.mode === 'inpaint' && !caps.characterReferenceInpaint) {
        ctx.drop('parameters.director_reference_images', 'not-applicable-to-mode', true);
        return false;
    }
    const used = refs.slice(0, MAX_CHARACTER_REFERENCES);
    refs.slice(MAX_CHARACTER_REFERENCES).forEach((_, i) =>
        ctx.drop(`parameters.director_reference_images[${MAX_CHARACTER_REFERENCES + i}]`, 'exceeds-model-limit', true),
    );
    params.director_reference_images = used.map((r) => r.image);
    params.director_reference_descriptions = used.map((r): NaiDirectorReferenceDescription => ({
        caption: { base_caption: r.description, char_captions: [] },
        legacy_uc: false,
    }));
    params.director_reference_information_extracted = used.map((r) => r.informationExtracted);
    params.director_reference_strength_values = used.map((r) => r.strength);
    params.director_reference_secondary_strength_values = used.map((r) => 1 - r.fidelity);
    return true;
}

export function applyVibes(
    params: NaiParameters,
    req: GenerationRequest,
    caps: ModelCapabilities,
    ctx: BuildContext,
    characterReferencesApplied: boolean,
): void {
    const vibes = req.vibes;
    if (vibes.length === 0) {
        return;
    }
    if (!caps.vibeTransfer || caps.vibeKind === 'none') {
        ctx.drop('parameters.reference_image_multiple', unsupportedReason(caps), true);
        return;
    }
    if (req.mode === 'inpaint') {
        ctx.drop('parameters.reference_image_multiple', 'not-applicable-to-mode', true);
        return;
    }
    if (characterReferencesApplied) {
        ctx.drop('parameters.reference_image_multiple', 'superseded', true);
        return;
    }
    const used = vibes.slice(0, MAX_VIBES);
    vibes
        .slice(MAX_VIBES)
        .forEach((_, i) =>
            ctx.drop(`parameters.reference_image_multiple[${MAX_VIBES + i}]`, 'exceeds-model-limit', true),
        );
    params.reference_image_multiple = used.map((v) => v.data);
    if (caps.vibeKind === 'raw') {
        params.reference_information_extracted_multiple = used.map((v) => v.informationExtracted);
        params.reference_strength_multiple = used.map((v) => v.strength);
    } else {
        params.reference_strength_multiple = normalizedStrengths(
            used.map((v) => v.strength),
            req.normalizeVibeStrength,
        );
    }
}
