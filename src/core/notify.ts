// Error toast for generations started from chat surfaces (commands, wand, buttons, triggers, auto).
import { NaiError, toNaiError } from './errors';

/** Shows a localized error toast; a user-initiated abort is not an error. */
export function reportGenerationError(error: unknown): NaiError {
    const naiError = error instanceof NaiError ? error : toNaiError(error);
    if (naiError.code !== 'aborted') toastr.error(naiError.text, naiError.title);
    return naiError;
}
