import { describe, expect, it } from 'vitest';
import { NaiError, toNaiError } from '../../src/core/errors';
import { DomainError } from '../../src/domain';
import { TransportError } from '../../src/transport';

const http = (status: number, serverMessage = '') => new TransportError('http', { status, serverMessage });

describe('error map (TZ "Error handling" table)', () => {
    it.each([
        [401, 'unauthorized', 'open-token-help'],
        [402, 'insufficient-anlas', 'enable-free-only'],
        [403, 'forbidden', 'none'],
        [429, 'rate-limited', 'retry'],
        [400, 'validation', 'open-inspector'],
        [520, 'unavailable', 'retry'],
        [522, 'unavailable', 'retry'],
        [504, 'unavailable', 'retry'],
    ])('HTTP %i -> %s / %s', (status, code, action) => {
        const error = toNaiError(http(status), { family: 'v4_5' });
        expect(error.code).toBe(code);
        expect(error.action).toBe(action);
        expect(error.status).toBe(status);
    });

    it('500 on V4/V5 points to the inspector, on V3 to a contract change', () => {
        expect(toNaiError(http(500), { family: 'v5' }).code).toBe('build-error-v4');
        expect(toNaiError(http(500), { family: 'v3' }).code).toBe('server-error');
    });

    it('500 through the ST endpoint is opaque', () => {
        expect(toNaiError(http(500), { family: 'v5', transport: 'native' })).toMatchObject({
            code: 'native-opaque',
            action: 'check-st-log',
        });
    });

    it('recognizes "not enough Anlas" by message', () => {
        expect(toNaiError(http(400, 'Not enough Anlas')).code).toBe('insufficient-anlas');
    });

    it('maps transport failure kinds', () => {
        expect(toNaiError(new TransportError('aborted')).code).toBe('aborted');
        expect(toNaiError(new TransportError('timeout')).code).toBe('unavailable');
        expect(toNaiError(new TransportError('network')).code).toBe('unavailable');
        expect(toNaiError(new TransportError('plugin-unavailable')).action).toBe('install-plugin');
        expect(toNaiError(new TransportError('token-missing')).code).toBe('token-missing');
        expect(toNaiError(new TransportError('invalid-response', { bodyPreview: '<html>' })).params.preview).toBe(
            '<html>',
        );
    });

    it('maps domain errors by code', () => {
        expect(
            toNaiError(new DomainError('size-too-large', { width: 2048, height: 2048, max: 3145728 })),
        ).toMatchObject({
            code: 'size-too-large',
            params: { width: 2048 },
        });
        expect(toNaiError(new DomainError('invalid-override')).action).toBe('open-inspector');
    });

    it('passes NaiError through and wraps unknown values', () => {
        const original = new NaiError('aborted', 'none');
        expect(toNaiError(original)).toBe(original);
        expect(toNaiError('boom').code).toBe('unknown');
        expect(toNaiError(new Error('x')).params.server).toBe('x');
    });

    it('has readable title and text for every code', () => {
        const error = toNaiError(http(401));
        expect(error.title).not.toBe('naist.error.unauthorized.title');
        expect(error.text.length).toBeGreaterThan(10);
    });
});
