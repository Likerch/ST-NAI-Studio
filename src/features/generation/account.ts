import type { AccountState } from '../../domain';
import type { NaiSubscription } from '../../shared/nai-wire';

export interface AccountView extends AccountState {
    /** V5 usage percent as the web client shows it: isNegative ? 0 : clamp(0..100). */
    usagePercent: number | null;
}

/** Subscription -> what the cost guard needs (RECON §3.11). */
export function accountFromSubscription(sub: NaiSubscription): AccountView {
    const steps = sub.trainingStepsLeft;
    const usage = sub.usage;
    return {
        tier: Number(sub.tier) || 0,
        active: sub.active === true,
        usageNegative: usage?.isNegative === true,
        anlas: (steps?.fixedTrainingStepsLeft ?? 0) + (steps?.purchasedTrainingSteps ?? 0),
        usagePercent: usage ? (usage.isNegative ? 0 : Math.min(100, Math.max(0, usage.percent))) : null,
    };
}

/** Used before the balance is known: treat as a non-Opus account so nothing is assumed free. */
export const UNKNOWN_ACCOUNT: AccountView = {
    tier: 0,
    active: false,
    usageNegative: false,
    anlas: 0,
    usagePercent: null,
};
