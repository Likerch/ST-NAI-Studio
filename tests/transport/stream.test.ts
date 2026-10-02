import { describe, expect, it } from 'vitest';
import { pluginFeatures, PLUGIN_FEATURES, SseParser, toFrame } from '../../src/transport';
import { createPluginTransport } from '../../src/transport/plugin';
import type { StreamFrame, TransportEnv } from '../../src/transport';
import type { NaiImageRequest } from '../../src/shared/nai-wire';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAE';

function body(): NaiImageRequest {
    return {
        input: 'x',
        model: 'nai-diffusion-4-5-full',
        action: 'generate',
        use_new_shared_trial: true,
        parameters: {
            width: 64,
            height: 64,
            seed: 100,
            n_samples: 1,
            steps: 1,
            scale: 1,
            sampler: 'k_euler',
            negative_prompt: '',
            stream: 'sse',
        },
    };
}

function sseResponse(chunks: string[]): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
            controller.close();
        },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function env(
    handler: (url: string, init: RequestInit) => Response,
): TransportEnv & { calls: { url: string; body: unknown }[] } {
    const calls: { url: string; body: unknown }[] = [];
    return {
        calls,
        headers: () => ({ 'Content-Type': 'application/json' }),
        fetch: async (input, init) => {
            const url = String(input);
            calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
            return handler(url, init ?? {});
        },
    };
}

describe('SSE parser', () => {
    it('assembles events split across chunks, joins data lines, skips comments', () => {
        const parser = new SseParser();
        expect(parser.feed('event: inter')).toEqual([]);
        expect(parser.feed('mediate\ndata: {"a":1}\n\n: comment\n\ndata: x\ndata: y\n\n')).toEqual([
            { event: 'intermediate', data: '{"a":1}' },
            { event: 'message', data: 'x\ny' },
        ]);
        expect(parser.feed('event: final\r\ndata: z')).toEqual([]);
        expect(parser.flush()).toEqual([{ event: 'final', data: 'z' }]);
        expect(parser.flush()).toEqual([]);
    });

    it('turns NovelAI events into frames', () => {
        expect(
            toFrame({
                event: 'intermediate',
                data: '{"event_type":"intermediate","samp_ix":0,"step_ix":4,"image":"abc"}',
            }),
        ).toEqual({
            kind: 'intermediate',
            sampleIndex: 0,
            step: 4,
            image: 'abc',
        });
        expect(toFrame({ event: 'final', data: '{"samp_ix":1,"image":"img"}' })).toEqual({
            kind: 'final',
            sampleIndex: 1,
            image: 'img',
        });
        expect(toFrame({ event: 'error', data: '{"kind":"http","message":"boom"}' })?.message).toBe('boom');
        expect(toFrame({ event: 'x', data: 'not json' })).toBeNull();
        expect(toFrame({ event: 'ping', data: '{}' })).toBeNull();
    });
});

describe('plugin streaming and extras', () => {
    it('streams previews to onProgress and returns the final images with seeds', async () => {
        const e = env(() =>
            sseResponse([
                'event: intermediate\ndata: {"event_type":"intermediate","samp_ix":0,"step_ix":1,"image":"p1"}\n\n',
                'event: intermediate\ndata: {"event_type":"intermediate","samp_ix":0,"step_ix":2,"image":"p2"}\n\nevent: fin',
                `al\ndata: {"event_type":"final","samp_ix":0,"image":"${PNG}"}\n\n`,
            ]),
        );
        const frames: StreamFrame[] = [];
        const result = await createPluginTransport(e, '0.2.0').generate(body(), {
            endpoint: 'generate-stream',
            retryable: true,
            onProgress: (f) => frames.push(f),
        });
        expect(e.calls[0]?.url).toBe('/api/plugins/nai-studio/generate-stream');
        expect(frames.map((f) => `${f.kind}:${f.step ?? ''}`)).toEqual(['intermediate:1', 'intermediate:2', 'final:']);
        expect(result.images).toEqual([{ base64: PNG, mime: 'image/png', seed: 100, index: 0 }]);
    });

    it('fails on a stream error event or a stream without a final image', async () => {
        const failing = env(() =>
            sseResponse(['event: error\ndata: {"kind":"http","message":"Validation error"}\n\n']),
        );
        await expect(
            createPluginTransport(failing).generate(body(), { endpoint: 'generate-stream', retryable: false }),
        ).rejects.toMatchObject({ kind: 'http', serverMessage: 'Validation error' });
        const empty = env(() =>
            sseResponse(['event: intermediate\ndata: {"event_type":"intermediate","image":"p"}\n\n']),
        );
        await expect(
            createPluginTransport(empty).generate(body(), { endpoint: 'generate-stream', retryable: false }),
        ).rejects.toMatchObject({ kind: 'invalid-response' });
        const http = env(
            () =>
                new Response(JSON.stringify({ error: { kind: 'http', status: 400, message: 'bad' } }), { status: 502 }),
        );
        await expect(
            createPluginTransport(http).generate(body(), { endpoint: 'generate-stream', retryable: false }),
        ).rejects.toMatchObject({ status: 400 });
    });

    it('calls the vibe, Director and upscale routes', async () => {
        const e = env((url) => {
            if (url.endsWith('/encode-vibe')) return new Response(JSON.stringify({ encoding: 'enc', cached: true }));
            if (url.endsWith('/encode-vibe/lookup'))
                return new Response(JSON.stringify({ results: [{ encoding: 'enc' }, { encoding: null }] }));
            if (url.endsWith('/augment')) return new Response(JSON.stringify({ zip: 'UEsDBA==' }));
            if (url.endsWith('/upscale'))
                return new Response(JSON.stringify({ images: [{ image: 'UklGRxx', index: 0 }] }));
            return new Response('', { status: 404 });
        });
        const extras = createPluginTransport(e).extras!;
        expect(await extras.encodeVibe({ image: 'i', model: 'm', informationExtracted: 1 })).toEqual({
            encoding: 'enc',
            cached: true,
        });
        expect(await extras.lookupVibes([{ imageHash: 'h', model: 'm', informationExtracted: 1 }])).toEqual([
            'enc',
            null,
        ]);
        expect(await extras.augment({ req_type: 'lineart' }, { retryable: true })).toBe('UEsDBA==');
        expect(e.calls.at(-1)?.body).toEqual({ body: { req_type: 'lineart' }, retryable: true });
        expect(await extras.upscale({ image: 'i', width: 64, height: 64 })).toEqual([
            { base64: 'UklGRxx', mime: 'image/webp', index: 0 },
        ]);
        const missing = createPluginTransport(env(() => new Response('', { status: 404 }))).extras!;
        await expect(missing.encodeVibe({ image: 'i', model: 'm', informationExtracted: 1 })).rejects.toMatchObject({
            kind: 'plugin-unavailable',
        });
    });

    it('an older plugin keeps generation but loses the Phase 5 routes', () => {
        expect(pluginFeatures('0.2.0')).toEqual(PLUGIN_FEATURES);
        expect(pluginFeatures('0.10.1')).toEqual(PLUGIN_FEATURES);
        expect(pluginFeatures(null)).toEqual(PLUGIN_FEATURES);
        const old = pluginFeatures('0.1.0');
        expect(old.stream || old.director || old.upscale || old.vibes).toBe(false);
        expect(old.img2img && old.inpaint && old.characters).toBe(true);
        expect(
            createPluginTransport(
                env(() => new Response('')),
                '0.1.0',
            ).features.director,
        ).toBe(false);
    });
});
