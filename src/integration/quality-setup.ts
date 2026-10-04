// Quality gates wiring (v0.11): a reply swiped, deleted or left with its chat while its drawings wait
// for the gates gets them cancelled; a new generation forgets settled verdicts (a continued reply is
// checked again) and cancels the ones of a reply that never completed.
import { ctx } from '../core/context';
import { qualityGenerationStarted, revalidateVerdicts } from '../features/quality/quality-gate';

export function setupQualityGates(): void {
    const c = ctx();
    const on = (name: string, handler: (...args: unknown[]) => unknown) => {
        const event = c.eventTypes[name];
        if (event) c.eventSource.on(event, handler);
    };
    for (const name of ['MESSAGE_SWIPED', 'MESSAGE_DELETED', 'MESSAGE_SWIPE_DELETED', 'CHAT_CHANGED']) {
        on(name, () => revalidateVerdicts());
    }
    on('GENERATION_STARTED', (type, _options, dryRun) => {
        if (!dryRun && type !== 'quiet') qualityGenerationStarted();
    });
}
