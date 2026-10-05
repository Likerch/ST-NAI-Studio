// UI-agnostic state of the studio: active transport, account balance, generation in flight.
import { NaiError, toNaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import type { GenerationSettings } from '../../core/settings-schema';
import type { GenerationRequest } from '../../domain';
import { selectTransport } from '../../transport';
import type { GenerateResult, StreamFrame, TransportEnv, TransportSelection } from '../../transport';
import { accountFromSubscription, UNKNOWN_ACCOUNT } from './account';
import type { AccountView } from './account';
import { generationQueue } from './queue';
import type { GenerationQueue, QueueJob } from './queue';
import { prepareGeneration, sendPrepared } from './service';
import type { Prepared } from './service';

export interface StudioState {
    selection: TransportSelection | null;
    account: AccountView;
    accountError: NaiError | null;
    /** A NovelAI request is in flight (any of the queue, v0.13.1). */
    busy: boolean;
}

type Listener = (state: StudioState) => void;

export class StudioController {
    readonly state: StudioState = { selection: null, account: UNKNOWN_ACCOUNT, accountError: null, busy: false };
    private readonly listeners = new Set<Listener>();

    constructor(
        private readonly env: TransportEnv,
        readonly queue: GenerationQueue = generationQueue,
    ) {
        queue.subscribe(() => {
            if (this.state.busy === queue.busy) return;
            this.state.busy = queue.busy;
            this.emit();
        });
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(): void {
        for (const listener of this.listeners) listener(this.state);
    }

    async refreshTransport(): Promise<void> {
        this.state.selection = await selectTransport(settings().transport.mode, this.env);
        const health = this.state.selection.health;
        log.info('transport:', this.state.selection.transport.id, health ? `plugin ${health.version}` : 'no plugin');
        this.emit();
        await this.refreshAccount();
    }

    async refreshAccount(): Promise<void> {
        const transport = this.state.selection?.transport;
        if (!transport) return;
        try {
            this.state.account = accountFromSubscription(await transport.subscription());
            this.state.accountError = null;
        } catch (error) {
            this.state.account = UNKNOWN_ACCOUNT;
            this.state.accountError = toNaiError(error, { transport: transport.id });
            log.warn('subscription unavailable', this.state.accountError.code);
        }
        this.emit();
    }

    /** Builds everything the inspector shows. Throws NaiError for requests that cannot be built. */
    prepare(overrides?: Partial<GenerationSettings>, requestPatch?: Partial<GenerationRequest>): Prepared {
        const transport = this.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        try {
            return prepareGeneration({
                settings: settings(),
                transport,
                account: this.state.account,
                overrides,
                requestPatch,
            });
        } catch (error) {
            throw toNaiError(error);
        }
    }

    /**
     * Sends a prepared request through the one NovelAI queue (v0.13.1): it waits for its turn, goes
     * alone and is sent again when NovelAI answers that another generation is running. The cost was
     * confirmed before; a retry asks nothing. Blocked requests never leave.
     */
    async send(
        prepared: Prepared,
        signal?: AbortSignal,
        onProgress?: (frame: StreamFrame) => void,
        job: QueueJob = {},
    ): Promise<GenerateResult> {
        if (!this.state.selection?.transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        let sent = false;
        try {
            return await this.queue.run({ ...job, ...(signal ? { signal } : {}) }, async (jobSignal) => {
                const transport = this.state.selection?.transport;
                if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
                sent = true;
                return await sendPrepared(prepared, transport, this.state.account, jobSignal, onProgress);
            });
        } finally {
            if (sent) void this.refreshAccount();
        }
    }

    /** Aborts the NovelAI request in flight. */
    cancel(): void {
        this.queue.cancelRunning();
    }
}
