// Server plugin 0.4.2 (NAI Studio 0.13.1): a 429 of NovelAI waits as long as its Retry-After says,
// the streaming endpoint retries a 429 before anything is streamed, and a final 429 reaches the
// browser with the Retry-After so the extension's queue can wait as long.
import { describe, expect, it } from 'vitest';
import { createNovelAiClient, retryAfterSeconds } from '../../server/lib/novelai.js';

const TOKEN = 'pst-test-token-not-real-0000000000000000000000000000000000000000';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function busy(retryAfter?: string): Response {
    return new Response(JSON.stringify({ statusCode: 429, message: 'Concurrent generation is locked' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...(retryAfter ? { 'Retry-After': retryAfter } : {}) },
    });
}

function client(answers: (() => Response)[], options: { maxRetries?: number } = {}) {
    const urls: string[] = [];
    const fetch = (async (url: string) => {
        urls.push(url);
        const next = answers.shift();
        if (!next) throw new Error('no more answers');
        return next();
    }) as unknown as typeof globalThis.fetch;
    const nai = createNovelAiClient({ fetch, baseUrl: 'https://nai.test', backoffMs: 1, ...options });
    return { nai, urls };
}

const request = { input: 'cat', model: 'nai-diffusion-4-5-full', action: 'generate', parameters: {} };

describe('Retry-After and 429 on the server plugin', () => {
    it('reads Retry-After as seconds or as a date', () => {
        const now = Date.parse('2026-10-05T10:00:00Z');
        const at = (value: string) => new Response('', { status: 429, headers: { 'Retry-After': value } });
        expect(retryAfterSeconds(at('3'), now)).toBe(3);
        expect(retryAfterSeconds(at('Mon, 05 Oct 2026 10:00:07 GMT'), now)).toBe(7);
        expect(retryAfterSeconds(at('Mon, 05 Oct 2026 09:59:00 GMT'), now)).toBe(0);
        expect(retryAfterSeconds(at('soon'), now)).toBeUndefined();
        expect(retryAfterSeconds(new Response('', { status: 429 }), now)).toBeUndefined();
    });

    it('waits at least the Retry-After before the next attempt', async () => {
        const { nai, urls } = client([
            () => busy('0'),
            () => new Response(JSON.stringify({ images: [{ image: PNG_B64, index: 0 }] }), { status: 200 }),
        ]);
        const result = await nai.generateImage({ request, token: TOKEN });
        expect(result.images).toHaveLength(1);
        expect(urls).toHaveLength(2);
    });

    it('passes a final 429 on with its Retry-After', async () => {
        const { nai } = client([() => busy('9')], { maxRetries: 0 });
        await expect(nai.generateImage({ request, token: TOKEN })).rejects.toMatchObject({
            kind: 'http',
            status: 429,
            retryAfter: 9,
            message: 'Concurrent generation is locked',
        });
    });

    it('retries a 429 of the streaming endpoint before streaming', async () => {
        const chunks: string[] = [];
        const { nai, urls } = client([
            () => busy(),
            () =>
                new Response('event: final\ndata: {"event_type":"final"}\n\n', {
                    status: 200,
                    headers: { 'Content-Type': 'text/event-stream' },
                }),
        ]);
        await nai.generateStream({
            request,
            token: TOKEN,
            signal: undefined,
            onChunk: (chunk: Buffer) => chunks.push(chunk.toString()),
        });
        expect(urls).toEqual([
            'https://nai.test/ai/generate-image-stream',
            'https://nai.test/ai/generate-image-stream',
        ]);
        expect(chunks.join('')).toContain('event: final');
        const failing = client([() => busy(), () => busy()], { maxRetries: 1 });
        await expect(
            failing.nai.generateStream({ request, token: TOKEN, signal: undefined, onChunk: () => undefined }),
        ).rejects.toMatchObject({ status: 429 });
        expect(failing.urls).toHaveLength(2);
    });
});
