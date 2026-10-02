// Automatic generation by rules (TZ Phase 2, task 7). Counters live in chatMetadata; every
// automatic request goes through a hard spending cap: 0 in free-only mode (TZ acceptance).
import { ctx } from '../../core/context';
import { toNaiError } from '../../core/errors';
import type { NaiErrorCode } from '../../core/errors';
import { log } from '../../core/logger';
import { reportGenerationError } from '../../core/notify';
import { settings } from '../../core/settings';
import { autoBudget, evaluateAuto, MODE, TRIGGER_WORDS } from '../../domain';
import type { AutoState, ModeId } from '../../domain';
import type { StudioController } from '../generation/controller';
import type { Pipeline } from '../generation/pipeline';

const SKIPPED_TYPES = new Set(['extension', 'command', 'first_message', 'impersonate', 'quiet']);
const GUARD_CODES = new Set<NaiErrorCode>(['free-only-blocked', 'price-too-high', 'busy']);

interface ChatAutoMeta {
    auto?: AutoState;
}

function chatState(): ChatAutoMeta {
    const metadata = ctx().chatMetadata;
    const existing = metadata.nai_studio;
    if (existing && typeof existing === 'object') return existing as ChatAutoMeta;
    const created: ChatAutoMeta = {};
    metadata.nai_studio = created;
    return created;
}

export class AutoGenerator {
    constructor(
        private readonly controller: StudioController,
        private readonly pipeline: Pipeline,
    ) {}

    attach(): void {
        const c = ctx();
        c.eventSource.on(c.eventTypes.CHARACTER_MESSAGE_RENDERED ?? 'character_message_rendered', (id, type) => {
            void this.onMessage(Number(id), String(type ?? ''));
        });
    }

    private async onMessage(id: number, type: string): Promise<void> {
        const rules = settings().auto;
        if (!rules.enabled || SKIPPED_TYPES.has(type)) return;
        const message = ctx().chat[id];
        if (!message || message.is_user || message.is_system || message.extra?.nai_studio) return;

        const meta = chatState();
        const previous = meta.auto ?? { messagesSince: 0, lastAt: 0 };
        const decision = evaluateAuto(rules, previous, message.mes, Date.now());
        // A fired rule resets the counters only once a generation really starts; a skipped one
        // (busy, over budget) must not start the cooldown.
        meta.auto = decision.fire
            ? { messagesSince: previous.messagesSince + 1, lastAt: previous.lastAt }
            : decision.state;
        void ctx().saveMetadata();
        if (!decision.fire) {
            if (decision.blockedBy) log.debug('auto generation held by', decision.blockedBy);
            return;
        }
        if (this.controller.state.busy) {
            log.info('auto generation skipped: another generation is running');
            return;
        }

        const budget = autoBudget(settings().anlas.freeOnly, rules.allowPaid);
        // Check the price before spending LLM tokens on a prompt that could not be sent anyway.
        try {
            const preview = this.controller.prepare();
            if (preview.cost.total > budget) {
                log.info(`auto generation skipped: would cost ${preview.cost.total} Anlas (budget ${budget})`);
                return;
            }
        } catch (error) {
            log.warn('auto generation skipped:', toNaiError(error).code);
            return;
        }

        meta.auto = decision.state;
        void ctx().saveMetadata();
        const mode = rules.mode as ModeId;
        const trigger = TRIGGER_WORDS[mode] ?? TRIGGER_WORDS[MODE.NOW] ?? 'last';
        try {
            await this.pipeline.generatePicture({
                initiator: 'auto',
                trigger,
                message: mode === MODE.RAW_LAST ? message.mes : undefined,
                maxCost: budget,
                // Paid auto generation was opted into in advance; with budget 0 a paid request is refused anyway.
                skipCostConfirm: true,
            });
            log.info('auto generation fired by', decision.reason);
        } catch (error) {
            // The Anlas guard refusing a paid request is the expected outcome, not an error to show.
            const naiError = toNaiError(error);
            log.warn('auto generation failed:', naiError.code);
            if (!GUARD_CODES.has(naiError.code)) reportGenerationError(naiError);
        }
    }
}
