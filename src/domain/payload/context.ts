import type { DropReason, DroppedField, Warning, WarningCode } from '../types';

/** Collects what the builder removed or coerced, for the payload inspector. */
export class BuildContext {
    readonly dropped: DroppedField[] = [];
    readonly warnings: Warning[] = [];

    drop(path: string, reason: DropReason, userSet: boolean): void {
        this.dropped.push({ path, reason, userSet });
    }

    warn(code: WarningCode, params?: Record<string, string | number>): void {
        this.warnings.push(params ? { code, params } : { code });
    }
}

/** Deletes `key` from `params` and records it if it was present. */
export function dropParam(
    ctx: BuildContext,
    params: Record<string, unknown>,
    key: string,
    reason: DropReason,
    userSet: boolean,
): void {
    if (Object.hasOwn(params, key)) {
        delete params[key];
        ctx.drop(`parameters.${key}`, reason, userSet);
    }
}
