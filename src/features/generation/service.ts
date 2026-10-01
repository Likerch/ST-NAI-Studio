// Orchestrates one generation: settings -> request -> free-only clamp -> payload -> override ->
// cost guard -> transport -> result. Everything shown in the inspector comes from `Prepared`.
import { NaiError, toNaiError } from '../../core/errors';
import type { NaiStudioSettings } from '../../core/settings-schema';
import { log } from '../../core/logger';
import {
    applyOverride,
    buildPayload,
    clampToFree,
    estimateGenerationCost,
    getCapabilities,
    parseOverride,
} from '../../domain';
import type {
    BuildResult,
    CostEstimate,
    FreeClampChange,
    GenerationRequest,
    ModelCapabilities,
    NotFreeReason,
} from '../../domain';
import type { NaiImageRequest } from '../../shared/nai-wire';
import type { EffectiveRequest, GenerateResult, Transport } from '../../transport';
import type { AccountView } from './account';
import { requestFromSettings, resolveSeed } from './form';

export interface Prepared {
    request: GenerationRequest;
    caps: ModelCapabilities;
    build: BuildResult;
    /** Body actually handed to the transport (after raw override). */
    body: NaiImageRequest;
    overridePaths: string[];
    effective: EffectiveRequest;
    cost: CostEstimate;
    clampChanges: FreeClampChange[];
    /** Why the request must not be sent (empty = may be sent). */
    blockers: Blocker[];
    transportId: Transport['id'];
}

export type Blocker =
    | { kind: 'free-only'; reasons: NotFreeReason[]; cost: number }
    | { kind: 'invalid-price' }
    | { kind: 'override'; message: string };

export interface PrepareInput {
    settings: NaiStudioSettings;
    transport: Transport;
    account: AccountView;
    random?: () => number;
}

export function prepareGeneration({ settings, transport, account, random }: PrepareInput): Prepared {
    const seed = resolveSeed(settings.generation.seed, random);
    let request = requestFromSettings(settings.generation, seed);
    const caps = getCapabilities(request.model);
    let clampChanges: FreeClampChange[] = [];
    if (settings.anlas.freeOnly) {
        const clamp = clampToFree(request, account);
        request = clamp.request;
        clampChanges = clamp.changes;
    }

    const build = buildPayload(request, caps);
    const blockers: Blocker[] = [];
    let body = build.body;
    let overridePaths: string[] = [];
    if (settings.rawOverride.enabled) {
        try {
            const result = applyOverride(build.body, parseOverride(settings.rawOverride.json));
            body = result.body;
            overridePaths = result.paths;
        } catch (error) {
            blockers.push({ kind: 'override', message: toNaiError(error).text });
        }
    }

    const cost = estimateGenerationCost(build.request, account);
    if (cost.invalid) blockers.push({ kind: 'invalid-price' });
    if (settings.anlas.freeOnly && cost.total > 0) {
        blockers.push({ kind: 'free-only', reasons: cost.notFreeReasons, cost: cost.total });
    }

    return {
        request: build.request,
        caps,
        build,
        body,
        overridePaths,
        effective: transport.effectiveRequest(body, overridePaths),
        cost,
        clampChanges,
        blockers,
        transportId: transport.id,
    };
}

/** Sends a prepared request. Blocked requests never reach the transport. */
export async function sendPrepared(
    prepared: Prepared,
    transport: Transport,
    account: AccountView,
    signal?: AbortSignal,
): Promise<GenerateResult> {
    const freeOnly = prepared.blockers.find((b) => b.kind === 'free-only');
    if (freeOnly) {
        throw new NaiError('free-only-blocked', 'none', { cost: freeOnly.cost });
    }
    const overrideBlocker = prepared.blockers.find((b) => b.kind === 'override');
    if (overrideBlocker) {
        throw new NaiError('invalid-override', 'open-inspector', {
            reason: overrideBlocker.kind === 'override' ? overrideBlocker.message : '',
        });
    }
    if (prepared.blockers.some((b) => b.kind === 'invalid-price')) {
        throw new NaiError('price-too-high', 'none', { perImage: prepared.cost.perImage });
    }
    if (prepared.overridePaths.length > 0) {
        log.warn('raw override applied to this generation:', prepared.overridePaths.join(', '));
    }
    try {
        return await transport.generate(prepared.body, {
            endpoint: prepared.build.endpoint,
            signal,
            retryable: prepared.cost.total === 0,
        });
    } catch (error) {
        throw toNaiError(error, {
            model: prepared.request.model,
            family: prepared.caps.family,
            transport: transport.id,
            cost: prepared.cost.total,
            balance: account.anlas,
        });
    }
}
