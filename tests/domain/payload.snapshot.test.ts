// Snapshot tests: the builder must reproduce, structurally, the request bodies that the NovelAI
// server accepted in Phase 0 (docs/captures, built from the web client logic; RECON §3.0, §3.5).
import { describe, expect, it } from 'vitest';
import { applyOverride, buildPayload, defaultRequest, getCapabilities } from '../../src/domain';
import type { GenerationRequest, ModelId } from '../../src/domain';
import { FAKE_IMAGE, loadCapture, normalizeImages } from '../helpers/captures';

const BASE = '1girl, solo, smile, cherry blossoms, outdoors, upper body';
const TWO_GIRLS = '2girls, park, bench, daytime';
const CHARACTERS = [
    {
        prompt: 'girl, red hair, long hair, green eyes, white dress, waving',
        negative: 'blue hair',
        center: { x: 0.3, y: 0.5 },
        enabled: true,
    },
    {
        prompt: 'girl, black hair, short hair, glasses, school uniform, reading book',
        negative: '',
        center: { x: 0.7, y: 0.5 },
        enabled: true,
    },
];

function request(model: ModelId, patch: Partial<GenerationRequest>): GenerationRequest {
    return { ...defaultRequest(model), ...patch };
}

function expectMatchesCapture(name: string, req: GenerationRequest): void {
    const result = buildPayload(req, getCapabilities(req.model));
    const capture = loadCapture(name);
    expect(normalizeImages(result.body)).toEqual(normalizeImages(capture.requestBody));
}

describe('payload builder reproduces Phase 0 captures', () => {
    it('V4.5 Full txt2img (c02)', () => {
        expectMatchesCapture(
            'c02-v45full-txt2img-webclient',
            request('nai-diffusion-4-5-full', { prompt: BASE, seed: 1234567890 }),
        );
    });

    it('V4.5 Full txt2img as PNG, no image_format (c09)', () => {
        expectMatchesCapture(
            'c09-v45full-accept-json',
            request('nai-diffusion-4-5-full', { prompt: BASE, seed: 1234567891, imageFormat: 'png' }),
        );
    });

    it('V5 Full txt2img (c03)', () => {
        expectMatchesCapture(
            'c03-v5full-txt2img-webclient',
            request('nai-diffusion-5-full', { prompt: BASE, seed: 1234567890 }),
        );
    });

    it('V5 Full multi-character with custom positions (c04)', () => {
        expectMatchesCapture(
            'c04-v5full-multichar-coords',
            request('nai-diffusion-5-full', {
                prompt: TWO_GIRLS,
                characters: CHARACTERS,
                useCoords: true,
                seed: 42424242,
            }),
        );
    });

    it('V4.5 Full multi-character on the grid (c05)', () => {
        expectMatchesCapture(
            'c05-v45full-multichar-grid',
            request('nai-diffusion-4-5-full', {
                prompt: TWO_GIRLS,
                characters: CHARACTERS,
                useCoords: true,
                seed: 42424242,
            }),
        );
    });

    it('V4.5 Full img2img (c06)', () => {
        expectMatchesCapture(
            'c06-v45full-img2img',
            request('nai-diffusion-4-5-full', { mode: 'img2img', prompt: BASE, image: FAKE_IMAGE, seed: 777000111 }),
        );
    });

    it('V4.5 Full inpaint (c07)', () => {
        expectMatchesCapture(
            'c07-v45full-inpaint',
            request('nai-diffusion-4-5-full', {
                mode: 'inpaint',
                prompt: `${BASE}, hair flower`,
                image: FAKE_IMAGE,
                mask: FAKE_IMAGE,
                seed: 555000222,
            }),
        );
    });

    it('V5 Full inpaint (c17)', () => {
        expectMatchesCapture(
            'c17-v5full-inpaint',
            request('nai-diffusion-5-full', {
                mode: 'inpaint',
                prompt: `${BASE}, hair flower`,
                image: FAKE_IMAGE,
                mask: FAKE_IMAGE,
                seed: 555000224,
            }),
        );
    });

    it('Anime V3 txt2img (c12)', () => {
        expectMatchesCapture(
            'c12-v3-txt2img-webclient',
            request('nai-diffusion-3', { prompt: BASE, seed: 1234567890 }),
        );
    });

    it.each([
        ['c13-v45full-stream-msgpack', 'msgpack'],
        ['c13-v45full-stream-sse', 'sse'],
    ] as const)('V4.5 Full streaming (%s)', (name, stream) => {
        const req = request('nai-diffusion-4-5-full', { prompt: BASE, seed: 1234567894, stream });
        const result = buildPayload(req, getCapabilities(req.model));
        expect(result.endpoint).toBe('generate-stream');
        expectMatchesCapture(name, req);
    });

    it('V4.5 Full over-long prompt is sent as is (c15)', () => {
        const long = Array.from({ length: 160 }, (_, i) => `detailed background element number ${i}`).join(', ');
        expectMatchesCapture(
            'c15-v45full-overlong-prompt',
            request('nai-diffusion-4-5-full', { prompt: `${BASE}, ${long}`, seed: 1234567895 }),
        );
    });

    it('V4.5 Full with an encoded vibe (p3)', () => {
        expectMatchesCapture(
            'p3-v45full-vibe-reuse',
            request('nai-diffusion-4-5-full', {
                prompt: '1girl, solo, smile, night, city lights, upper body',
                seed: 31337001,
                vibes: [{ data: FAKE_IMAGE, strength: 0.6, informationExtracted: 1 }],
            }),
        );
    });

    it('V4.5 Full with a character reference (p4)', () => {
        expectMatchesCapture(
            'p4-v45full-charref',
            request('nai-diffusion-4-5-full', {
                prompt: '1girl, solo, standing, library, bookshelves, full body',
                seed: 31337002,
                width: 512,
                height: 768,
                characterReferences: [
                    {
                        image: FAKE_IMAGE,
                        description: 'character&style',
                        strength: 1,
                        fidelity: 1,
                        informationExtracted: 1,
                    },
                ],
            }),
        );
    });

    it('raw override of an unknown field yields the c10 body', () => {
        const req = request('nai-diffusion-4-5-full', { prompt: BASE, seed: 1234567892 });
        const built = buildPayload(req, getCapabilities(req.model));
        const { body, paths } = applyOverride(built.body, { parameters: { nai_studio_probe_unknown_field: true } });
        expect(paths).toEqual(['parameters.nai_studio_probe_unknown_field']);
        expect(normalizeImages(body)).toEqual(normalizeImages(loadCapture('c10-v45full-unknown-field').requestBody));
    });

    it('omitting v4_prompt reproduces the c11 body the server answered with HTTP 500', () => {
        const req = request('nai-diffusion-4-5-full', { prompt: BASE, seed: 1234567893 });
        const body = structuredClone(buildPayload(req, getCapabilities(req.model)).body);
        delete body.parameters.v4_prompt;
        delete body.parameters.v4_negative_prompt;
        const capture = loadCapture('c11-v45full-no-v4prompt');
        expect(normalizeImages(body)).toEqual(normalizeImages(capture.requestBody));
        expect(capture.response.status).toBe(500);
    });
});
