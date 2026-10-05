// Every failure becomes a readable message plus a concrete action (TZ "Error handling").
// Maps by shape (name/kind/status/code) so core does not import domain or transport classes.
import { t } from './i18n';

export type ErrorAction =
    | 'open-inspector'
    | 'open-token-help'
    | 'enable-free-only'
    | 'retry'
    | 'switch-to-v45'
    | 'install-plugin'
    | 'check-st-log'
    | 'none';

export type NaiErrorCode =
    | 'unauthorized'
    | 'token-missing'
    | 'insufficient-anlas'
    | 'forbidden'
    | 'rate-limited'
    | 'build-error-v4'
    | 'server-error'
    | 'unavailable'
    | 'validation'
    | 'native-opaque'
    | 'plugin-unavailable'
    | 'v5-usage-exhausted'
    | 'invalid-response'
    | 'free-only-blocked'
    | 'price-too-high'
    | 'busy'
    | 'no-usable-message'
    | 'multimodal-failed'
    | 'prompt-generation-failed'
    | 'aborted'
    | 'size-too-large'
    | 'invalid-seed'
    | 'missing-image'
    | 'missing-mask'
    | 'unsupported-mode'
    | 'invalid-override'
    | 'image-not-found'
    | 'image-load-failed'
    | 'feature-unavailable'
    | 'translation-failed'
    | 'import-failed'
    | 'unknown';

export interface ErrorContext {
    model?: string;
    family?: string;
    transport?: 'plugin' | 'native';
    cost?: number;
    balance?: number;
}

/** A user-facing error. `message` never contains the NovelAI token (it never reaches the client). */
export class NaiError extends Error {
    readonly code: NaiErrorCode;
    readonly action: ErrorAction;
    readonly params: Record<string, string | number>;
    readonly status: number | undefined;

    constructor(
        code: NaiErrorCode,
        action: ErrorAction,
        params: Record<string, string | number> = {},
        status?: number,
    ) {
        super(code);
        this.name = 'NaiError';
        this.code = code;
        this.action = action;
        this.params = params;
        this.status = status;
    }

    get title(): string {
        return t(`naist.error.${this.code}.title`, this.params);
    }

    get text(): string {
        return t(`naist.error.${this.code}.text`, this.params);
    }
}

interface ErrorShape {
    name?: string;
    kind?: string;
    status?: number;
    code?: string;
    message?: string;
    serverMessage?: string;
    bodyPreview?: string;
    /** Seconds NovelAI asked to wait before a retry (Retry-After), when it said so. */
    retryAfter?: number;
    params?: Record<string, string | number>;
}

const DOMAIN_CODES: readonly string[] = [
    'size-too-large',
    'invalid-seed',
    'missing-image',
    'missing-mask',
    'unsupported-mode',
    'invalid-override',
];

function fromHttp(status: number, shape: ErrorShape, context: ErrorContext): NaiError {
    const server = shape.serverMessage ?? '';
    const params = {
        status,
        server,
        model: context.model ?? '',
        cost: context.cost ?? 0,
        balance: context.balance ?? 0,
        ...(shape.retryAfter ? { retryAfter: shape.retryAfter } : {}),
    };
    if (status === 401) return new NaiError('unauthorized', 'open-token-help', params, status);
    if (status === 402 || /not enough anlas|training steps/i.test(server))
        return new NaiError('insufficient-anlas', 'enable-free-only', params, status);
    if (status === 403) return new NaiError('forbidden', 'none', params, status);
    if (status === 429) return new NaiError('rate-limited', 'retry', params, status);
    if (status === 400) return new NaiError('validation', 'open-inspector', params, status);
    if (status === 500 && context.transport === 'native')
        return new NaiError('native-opaque', 'check-st-log', params, status);
    if (status === 500 && (context.family === 'v4' || context.family === 'v4_5' || context.family === 'v5')) {
        return new NaiError('build-error-v4', 'open-inspector', params, status);
    }
    if (status === 504 || status === 520 || status === 522 || status === 502 || status === 503) {
        return new NaiError('unavailable', 'retry', params, status);
    }
    if (status >= 500) return new NaiError('server-error', 'open-inspector', params, status);
    return new NaiError('unknown', 'none', params, status);
}

/** Converts anything thrown during generation into a NaiError. */
export function toNaiError(error: unknown, context: ErrorContext = {}): NaiError {
    if (error instanceof NaiError) return error;
    const shape = (typeof error === 'object' && error !== null ? error : {}) as ErrorShape;

    if (shape.name === 'DomainError' && shape.code && DOMAIN_CODES.includes(shape.code)) {
        return new NaiError(
            shape.code as NaiErrorCode,
            shape.code === 'invalid-override' ? 'open-inspector' : 'none',
            shape.params ?? {},
        );
    }
    if (shape.name === 'TransportError') {
        switch (shape.kind) {
            case 'aborted':
                return new NaiError('aborted', 'none');
            case 'timeout':
            case 'network':
                return new NaiError('unavailable', 'retry', { status: 0, server: shape.message ?? '' });
            case 'plugin-unavailable':
                return new NaiError('plugin-unavailable', 'install-plugin');
            case 'token-missing':
                return new NaiError('token-missing', 'open-token-help');
            case 'invalid-response':
                return new NaiError('invalid-response', 'open-inspector', { preview: shape.bodyPreview ?? '' });
            case 'http':
                return fromHttp(shape.status ?? 0, shape, context);
            default:
                break;
        }
    }
    return new NaiError('unknown', 'none', { server: shape.message ?? String(error) });
}
