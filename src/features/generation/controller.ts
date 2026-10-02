// UI-agnostic state of the studio: active transport, account balance, generation in flight.
import { NaiError, toNaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import type { GenerationSettings } from '../../core/settings-schema';
import { selectTransport } from '../../transport';
import type { GenerateResult, TransportEnv, TransportSelection } from '../../transport';
import { accountFromSubscription, UNKNOWN_ACCOUNT } from './account';
import type { AccountView } from './account';
import { prepareGeneration, sendPrepared } from './service';
import type { Prepared } from './service';

export interface StudioState {
    selection: TransportSelection | null;
    account: AccountView;
    accountError: NaiError | null;
    busy: boolean;
}

type Listener = (state: StudioState) => void;

export class StudioController {
    readonly state: StudioState = { selection: null, account: UNKNOWN_ACCOUNT, accountError: null, busy: false };
    private readonly listeners = new Set<Listener>();
    private abort: AbortController | null = null;

    constructor(private readonly env: TransportEnv) {}

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
    prepare(overrides?: Partial<GenerationSettings>): Prepared {
        const transport = this.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        try {
            return prepareGeneration({ settings: settings(), transport, account: this.state.account, overrides });
        } catch (error) {
            throw toNaiError(error);
        }
    }

    /** Sends a prepared request. One generation at a time; blocked requests never leave. */
    async send(prepared: Prepared, signal?: AbortSignal): Promise<GenerateResult> {
        const transport = this.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        if (this.state.busy) throw new NaiError('busy', 'none');
        this.abort = new AbortController();
        const onAbort = () => this.abort?.abort();
        signal?.addEventListener('abort', onAbort, { once: true });
        this.state.busy = true;
        this.emit();
        try {
            return await sendPrepared(prepared, transport, this.state.account, this.abort.signal);
        } finally {
            signal?.removeEventListener('abort', onAbort);
            this.state.busy = false;
            this.abort = null;
            this.emit();
            void this.refreshAccount();
        }
    }

    cancel(): void {
        this.abort?.abort();
    }
}
