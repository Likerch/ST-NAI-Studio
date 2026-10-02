// Auto-generation rules (TZ Phase 2, task 7): every N messages, by keywords, on scene change,
// always behind a cooldown. Pure decision logic; the Anlas guard is enforced by the caller.

export interface AutoRules {
    enabled: boolean;
    /** Fire on every N-th AI message (0 = off). */
    everyMessages: number;
    /** Comma-separated words or phrases; matched case-insensitively as whole words. */
    keywords: string;
    sceneChange: boolean;
    /** Comma-separated markers that mean a new scene (e.g. "***", "---", "Meanwhile"). */
    sceneMarkers: string;
    /** Minimum AI messages between two auto generations. */
    cooldownMessages: number;
    /** Minimum seconds between two auto generations. */
    cooldownSeconds: number;
}

export interface AutoState {
    /** AI messages since the last auto generation. */
    messagesSince: number;
    /** Unix ms of the last auto generation, 0 if never. */
    lastAt: number;
}

export type AutoReason = 'every-messages' | 'keyword' | 'scene-change';

export interface AutoDecision {
    fire: boolean;
    reason?: AutoReason;
    /** Why it did not fire although a rule matched. */
    blockedBy?: 'cooldown-messages' | 'cooldown-seconds';
    state: AutoState;
}

function list(text: string): string[] {
    return text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function matchesKeyword(message: string, keywords: string): boolean {
    return list(keywords).some((word) =>
        new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(word)}($|[^\\p{L}\\p{N}])`, 'iu').test(message),
    );
}

export function isSceneChange(message: string, markers: string): boolean {
    return list(markers).some((marker) => {
        const pattern = /^[\p{L}\p{N}]/u.test(marker)
            ? new RegExp(`(^|\\n)\\s*${escapeRegExp(marker)}\\b`, 'iu')
            : new RegExp(escapeRegExp(marker));
        return pattern.test(message);
    });
}

/** Called for every new AI message. Returns the decision and the updated counters. */
export function evaluateAuto(rules: AutoRules, state: AutoState, message: string, now: number): AutoDecision {
    const next: AutoState = { messagesSince: state.messagesSince + 1, lastAt: state.lastAt };
    if (!rules.enabled) {
        return { fire: false, state: next };
    }
    let reason: AutoReason | undefined;
    if (rules.everyMessages > 0 && next.messagesSince >= rules.everyMessages) {
        reason = 'every-messages';
    } else if (rules.keywords.trim() && matchesKeyword(message, rules.keywords)) {
        reason = 'keyword';
    } else if (rules.sceneChange && isSceneChange(message, rules.sceneMarkers)) {
        reason = 'scene-change';
    }
    if (!reason) {
        return { fire: false, state: next };
    }
    if (state.lastAt > 0 && next.messagesSince < Math.max(1, rules.cooldownMessages)) {
        return { fire: false, reason, blockedBy: 'cooldown-messages', state: next };
    }
    if (state.lastAt > 0 && now - state.lastAt < rules.cooldownSeconds * 1000) {
        return { fire: false, reason, blockedBy: 'cooldown-seconds', state: next };
    }
    return { fire: true, reason, state: { messagesSince: 0, lastAt: now } };
}

/**
 * Maximum Anlas an automatic generation may spend. Free-only mode always means 0, and paid
 * auto generation additionally needs an explicit opt-in (TZ Phase 2 acceptance).
 */
export function autoBudget(freeOnly: boolean, allowPaid: boolean): number {
    return !freeOnly && allowPaid ? Number.POSITIVE_INFINITY : 0;
}
