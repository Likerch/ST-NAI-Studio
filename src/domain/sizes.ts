// Size rules (RECON §3.4): multiples of 64, area limits, sample caps by area.

export const SIZE_STEP = 64;
export const MIN_SIDE = 64;

export function roundToStep(value: number): number {
    return Math.max(MIN_SIDE, Math.round(value / SIZE_STEP) * SIZE_STEP);
}

/** Largest size with the same aspect ratio, multiples of 64, whose area does not exceed `maxPixels`. */
export function fitArea(width: number, height: number, maxPixels: number): { width: number; height: number } {
    if (width * height <= maxPixels) {
        return { width, height };
    }
    const ratio = Math.sqrt(maxPixels / (width * height));
    let w = Math.max(MIN_SIDE, Math.floor((width * ratio) / SIZE_STEP) * SIZE_STEP);
    let h = Math.max(MIN_SIDE, Math.floor((height * ratio) / SIZE_STEP) * SIZE_STEP);
    while (w * h > maxPixels) {
        if (w >= h && w > MIN_SIDE) {
            w -= SIZE_STEP;
        } else if (h > MIN_SIDE) {
            h -= SIZE_STEP;
        } else {
            break;
        }
    }
    // Flooring both sides can lose a whole step on one of them (1088x1216 -> 960x1024); take the
    // candidate that still fits and keeps the aspect ratio best, the larger one on a tie.
    const aspect = Math.log(width / height);
    let best = { width: w, height: h };
    for (const [dw, dh] of [
        [SIZE_STEP, 0],
        [0, SIZE_STEP],
        [SIZE_STEP, SIZE_STEP],
    ] as const) {
        const candidate = { width: w + dw, height: h + dh };
        if (candidate.width * candidate.height > maxPixels) continue;
        const error = Math.abs(Math.log(candidate.width / candidate.height) - aspect);
        const bestError = Math.abs(Math.log(best.width / best.height) - aspect);
        if (
            error < bestError - 1e-9 ||
            (Math.abs(error - bestError) <= 1e-9 && candidate.width * candidate.height > best.width * best.height)
        ) {
            best = candidate;
        }
    }
    return best;
}

/** n_samples cap by pixel count (bundle:1601@55499). */
export function maxSamplesForArea(width: number, height: number): number {
    const pixels = width * height;
    if (pixels <= 360448) {
        return 8;
    }
    if (pixels <= 409600) {
        return 6;
    }
    return 4;
}
