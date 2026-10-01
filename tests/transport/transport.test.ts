import { describe, expect, it, vi } from 'vitest';
import { buildPayload, defaultRequest, getCapabilities } from '../../src/domain';
import type { GenerationRequest } from '../../src/domain';
import {
    lostOnNative,
    PLUGIN_BASE,
    probePlugin,
    selectTransport,
    stEffectiveBody,
    toStNativeRequest,
    TransportError,
} from '../../src/transport';
import type { TransportEnv } from '../../src/transport';
import { createNativeTransport } from '../../src/transport/st-native';
import { createPluginTransport } from '../../src/transport/plugin';
import { FAKE_IMAGE, loadCapture, normalizeImages } from '../helpers/captures';

function envWith(
    handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
): TransportEnv & { calls: [string, RequestInit | undefined][] } {
    const calls: [string, RequestInit | undefined][] = [];
    return {
        calls,
        headers: () => ({ 'Content-Type': 'application/json', 'X-CSRF-Token': 't' }),
        fetch: vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            calls.push([String(input), init]);
            return handler(String(input), init);
        }) as unknown as typeof fetch,
    };
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function body(patch: Partial<GenerationRequest> = {}) {
    const req = { ...defaultRequest('nai-diffusion-4-5-full'), prompt: 'cat', seed: 7, ...patch };
    return buildPayload(req, getCapabilities(req.model)).body;
}

describe('ST built-in endpoint', () => {
    it('reproduces the exact body ST sends to NovelAI (capture c08)', () => {
        const effective = stEffectiveBody({
            prompt: '1girl, solo, smile, cherry blossoms, outdoors, upper body',
            model: 'nai-diffusion-4-5-full',
            negative_prompt: 'lowres',
            width: 832,
            height: 1216,
            scale: 5,
            seed: 1234567890,
            sampler: 'k_euler_ancestral',
            scheduler: 'karras',
            steps: 23,
            sm: false,
            sm_dyn: false,
            decrisper: false,
            variety_boost: false,
            upscale_ratio: 1,
        });
        expect(normalizeImages(effective)).toEqual(
            normalizeImages(loadCapture('c08-v45full-txt2img-st-shape').requestBody),
        );
    });

    it('maps our payload onto ST fields, including Variety Boost as a flag', () => {
        const st = toStNativeRequest(body({ varietyBoost: true, negativePrompt: 'blue' }));
        expect(st).toMatchObject({
            model: 'nai-diffusion-4-5-full',
            scheduler: 'karras',
            variety_boost: true,
            upscale_ratio: 1,
        });
        expect(st.negative_prompt).toContain('blue');
        expect(stEffectiveBody(st).parameters).toMatchObject({ skip_cfg_above_sigma: 58 });
        expect(toStNativeRequest(body({ sampler: 'ddim_v3', model: 'nai-diffusion-3' as never }))).toBeDefined();
    });

    it('reports every feature it cannot deliver', () => {
        const rich = body({
            characters: [
                { prompt: 'a', negative: '', center: { x: 0.3, y: 0.5 }, enabled: true },
                { prompt: 'b', negative: '', center: { x: 0.7, y: 0.5 }, enabled: true },
            ],
            useCoords: true,
            samples: 2,
            cfgRescale: 0.2,
            vibes: [{ data: FAKE_IMAGE, strength: 0.5, informationExtracted: 1 }],
            mode: 'img2img',
            image: FAKE_IMAGE,
        });
        expect(lostOnNative(rich, ['parameters.x'])).toEqual([
            'mode',
            'characters',
            'coordinates',
            'samples',
            'source-image',
            'vibes',
            'cfg-rescale',
            'override',
        ]);
        const v5 = buildPayload(
            {
                ...defaultRequest('nai-diffusion-5-full'),
                seed: 1,
                transparentBackground: true,
                mode: 'inpaint',
                image: FAKE_IMAGE,
                mask: FAKE_IMAGE,
            },
            getCapabilities('nai-diffusion-5-full'),
        ).body;
        expect(lostOnNative(v5, [])).toEqual(expect.arrayContaining(['mask', 'transparency']));
        expect(lostOnNative(body(), [])).toEqual([]);
    });

    it('returns the PNG and surfaces ST failure modes', async () => {
        const ok = createNativeTransport(envWith(() => new Response('iVBORw0KGgoAAAA', { status: 200 })));
        await expect(ok.generate(body(), { endpoint: 'generate', retryable: true })).resolves.toMatchObject({
            images: [{ mime: 'image/png', seed: 7 }],
        });

        const missing = createNativeTransport(envWith(() => new Response('Bad Request', { status: 400 })));
        await expect(missing.generate(body(), { endpoint: 'generate', retryable: true })).rejects.toMatchObject({
            kind: 'token-missing',
        });

        const opaque = createNativeTransport(envWith(() => new Response('Internal Server Error', { status: 500 })));
        await expect(opaque.generate(body(), { endpoint: 'generate', retryable: true })).rejects.toMatchObject({
            kind: 'http',
            status: 500,
        });

        const html = createNativeTransport(envWith(() => new Response('<html>oops', { status: 200 })));
        await expect(html.generate(body(), { endpoint: 'generate', retryable: true })).rejects.toMatchObject({
            kind: 'invalid-response',
            bodyPreview: '<html>oops',
        });
    });

    it('reads the subscription through /api/novelai/status', async () => {
        const native = createNativeTransport(envWith(() => json({ tier: 3, active: true })));
        await expect(native.subscription()).resolves.toMatchObject({ tier: 3 });
        await expect(createNativeTransport(envWith(() => json({ error: true }))).subscription()).rejects.toMatchObject({
            kind: 'invalid-response',
        });
        await expect(
            createNativeTransport(envWith(() => new Response('', { status: 400 }))).subscription(),
        ).rejects.toMatchObject({ kind: 'token-missing' });
        await expect(
            createNativeTransport(envWith(() => new Response('nope', { status: 200 }))).subscription(),
        ).rejects.toBeInstanceOf(TransportError);
    });

    it('shows ST-built body and losses as the effective request', () => {
        const native = createNativeTransport(envWith(() => json({})));
        const effective = native.effectiveRequest(body({ samples: 2 }), []);
        expect((effective.body as { parameters: { n_samples: number } }).parameters.n_samples).toBe(1);
        expect(effective.lost).toEqual(['samples']);
    });
});

describe('plugin transport', () => {
    it('probes /health and treats anything else as missing', async () => {
        expect(
            await probePlugin(envWith(() => json({ ok: true, version: '0.1.0', tokenSource: 'st-secrets' }))),
        ).toEqual({
            ok: true,
            version: '0.1.0',
            tokenSource: 'st-secrets',
        });
        expect(await probePlugin(envWith(() => new Response('Not Found', { status: 404 })))).toBeNull();
        expect(await probePlugin(envWith(() => json({ ok: false })))).toBeNull();
        expect(await probePlugin(envWith(() => Promise.reject(new Error('offline'))))).toBeNull();
    });

    it('posts the body unchanged and maps images', async () => {
        const env = envWith(() =>
            json({ images: [{ image: 'UklGRxxx', mime: 'image/webp', seed: 7, index: 0 }], correlationId: 'AbC123' }),
        );
        const plugin = createPluginTransport(env);
        const b = body();
        const result = await plugin.generate(b, { endpoint: 'generate', retryable: true });
        expect(result).toEqual({
            images: [{ base64: 'UklGRxxx', mime: 'image/webp', seed: 7, index: 0 }],
            correlationId: 'AbC123',
        });
        const [url, init] = env.calls[0]!;
        expect(url).toBe(`${PLUGIN_BASE}/generate`);
        expect(JSON.parse(String(init?.body))).toEqual({ request: b, endpoint: 'generate', retryable: true });
        expect(plugin.effectiveRequest(b, ['x'])).toEqual({ body: b, lost: [] });
    });

    it('carries NovelAI status and message from the plugin error body', async () => {
        const plugin = createPluginTransport(
            envWith(() => json({ error: { kind: 'http', status: 402, message: 'Not enough Anlas' } }, 502)),
        );
        await expect(plugin.generate(body(), { endpoint: 'generate', retryable: false })).rejects.toMatchObject({
            kind: 'http',
            status: 402,
            serverMessage: 'Not enough Anlas',
        });
    });

    it('maps 404, non-JSON errors, empty results and network failures', async () => {
        await expect(
            createPluginTransport(envWith(() => new Response('', { status: 404 }))).generate(body(), {
                endpoint: 'generate',
                retryable: true,
            }),
        ).rejects.toMatchObject({ kind: 'plugin-unavailable' });
        await expect(
            createPluginTransport(envWith(() => new Response('<html>', { status: 500 }))).generate(body(), {
                endpoint: 'generate',
                retryable: true,
            }),
        ).rejects.toMatchObject({ kind: 'invalid-response' });
        await expect(
            createPluginTransport(envWith(() => json({ images: [] }))).generate(body(), {
                endpoint: 'generate',
                retryable: true,
            }),
        ).rejects.toMatchObject({ kind: 'invalid-response' });
        await expect(
            createPluginTransport(envWith(() => Promise.reject(new Error('down')))).generate(body(), {
                endpoint: 'generate',
                retryable: true,
            }),
        ).rejects.toMatchObject({ kind: 'network' });
        const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
        await expect(
            createPluginTransport(envWith(() => Promise.reject(abort))).generate(body(), {
                endpoint: 'generate',
                retryable: true,
            }),
        ).rejects.toMatchObject({ kind: 'aborted' });
        await expect(
            createPluginTransport(envWith(() => json({ error: { kind: 'token-missing' } }, 400))).subscription(),
        ).rejects.toMatchObject({ kind: 'token-missing' });
        await expect(createPluginTransport(envWith(() => json({ tier: 3 }))).subscription()).resolves.toMatchObject({
            tier: 3,
        });
    });
});

describe('transport selection', () => {
    const healthy = () =>
        envWith((url) =>
            url.endsWith('/health') ? json({ ok: true, version: '0.1.0', tokenSource: 'config' }) : json({}),
        );
    const missing = () => envWith(() => new Response('', { status: 404 }));

    it('auto prefers the plugin and degrades to the ST endpoint', async () => {
        expect((await selectTransport('auto', healthy())).transport.id).toBe('plugin');
        const degraded = await selectTransport('auto', missing());
        expect(degraded.transport.id).toBe('native');
        expect(degraded.degraded).toBe(true);
    });

    it('honours explicit choices', async () => {
        expect((await selectTransport('native', healthy())).transport.id).toBe('native');
        const forced = await selectTransport('plugin', missing());
        expect(forced.transport.id).toBe('plugin');
        expect(forced.health).toBeNull();
    });
});
