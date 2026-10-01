// UI-agnostic state of the studio: active transport, account balance, generation in flight.
import { ctx } from '../../core/context';
import { NaiError, toNaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { selectTransport } from '../../transport';
import type { TransportEnv, TransportSelection } from '../../transport';
import { accountFromSubscription, UNKNOWN_ACCOUNT } from './account';
import type { AccountView } from './account';
import { imageFolder, postToChat, saveImages } from './output';
import { prepareGeneration, sendPrepared } from './service';
import type { Prepared } from './service';

export interface StudioState {
    selection: TransportSelection | null;
    account: AccountView;
    accountError: NaiError | null;
    busy: boolean;
}

type Listener = (state: StudioState) => void;

export interface GenerationOutcome {
    messageId: number | null;
    images: number;
    /** The chat changed while the request was running: images were saved but not posted. */
    chatChanged: boolean;
}

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
        log.info(
            'transport:',
            this.state.selection.transport.id,
            this.state.selection.health ? `plugin ${this.state.selection.health.version}` : 'no plugin',
        );
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
    prepare(): Prepared {
        const transport = this.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        try {
            return prepareGeneration({ settings: settings(), transport, account: this.state.account });
        } catch (error) {
            throw toNaiError(error);
        }
    }

    async generate(prepared: Prepared): Promise<GenerationOutcome> {
        const transport = this.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        if (this.state.busy) throw new NaiError('rate-limited', 'none');
        const chatId = ctx().getCurrentChatId();
        this.abort = new AbortController();
        this.state.busy = true;
        this.emit();
        try {
            const result = await sendPrepared(prepared, transport, this.state.account, this.abort.signal);
            const saved = await saveImages(result.images, imageFolder());
            const meta = {
                prompt: prepared.body.input,
                model: prepared.body.model,
                seed: prepared.request.seed,
                transport: transport.id,
                cost: prepared.cost.total,
                correlationId: result.correlationId,
            };
            if (ctx().getCurrentChatId() !== chatId) {
                return { messageId: null, images: saved.length, chatChanged: true };
            }
            const messageId = await postToChat(saved, meta, settings().output.hiddenFromPrompt);
            log.info('generated', meta.model, `seed ${meta.seed}`, `cost ${meta.cost}`, result.correlationId ?? '');
            return { messageId, images: saved.length, chatChanged: false };
        } finally {
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
