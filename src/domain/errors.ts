export type DomainErrorCode =
    'size-too-large' | 'invalid-seed' | 'missing-image' | 'missing-mask' | 'unsupported-mode' | 'invalid-override';

/** Thrown by the domain for requests that cannot be built at all. Mapped to i18n in core/errors. */
export class DomainError extends Error {
    readonly code: DomainErrorCode;
    readonly params: Record<string, string | number>;

    constructor(code: DomainErrorCode, params: Record<string, string | number> = {}) {
        super(code);
        this.name = 'DomainError';
        this.code = code;
        this.params = params;
    }
}
