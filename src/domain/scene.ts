// Character placement on the canvas (RECON §3.6).
import type { ModelCapabilities } from './capabilities';
import type { Point } from './types';

/** 5x5 grid of V4/V4.5 (bundle:_app@3545303). */
export const GRID_STEPS = [0.1, 0.3, 0.5, 0.7, 0.9] as const;

function snapAxis(value: number): number {
    const index = Math.min(4, Math.max(0, Math.floor(5 * value)));
    return GRID_STEPS[index] ?? 0.5;
}

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

/** Grid models snap to the 5x5 grid; V5 keeps free coordinates rounded to 3 decimals. */
export function placeOnCanvas(point: Point, caps: Pick<ModelCapabilities, 'positioning'>): Point {
    const x = clamp01(point.x);
    const y = clamp01(point.y);
    if (caps.positioning === 'grid') {
        return { x: snapAxis(x), y: snapAxis(y) };
    }
    return { x: round3(x), y: round3(y) };
}

/** Default slot order for new characters along y = 0.5 (bundle:5285@546734). */
const DEFAULT_SLOTS_X = [0.5, 0.3, 0.7, 0.1, 0.9] as const;

export function defaultCenter(index: number): Point {
    const x = DEFAULT_SLOTS_X[index];
    if (x !== undefined) {
        return { x, y: 0.5 };
    }
    // Remaining grid cells ordered by distance from the centre.
    const cells: Point[] = [];
    for (const y of GRID_STEPS) {
        for (const cx of GRID_STEPS) {
            if (y !== 0.5) {
                cells.push({ x: cx, y });
            }
        }
    }
    cells.sort((a, b) => Math.hypot(a.x - 0.5, a.y - 0.5) - Math.hypot(b.x - 0.5, b.y - 0.5));
    return cells[(index - DEFAULT_SLOTS_X.length) % cells.length] ?? { x: 0.5, y: 0.5 };
}
