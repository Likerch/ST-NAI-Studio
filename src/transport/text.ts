// NovelAI's own text model through the plugin (TZ Phase 7, "novelai" language backend):
// https://text.novelai.net/oa/v1/chat/completions, GLM-4.6 on every tier, Xialong on Opus. Text
// generation is part of the subscription and does not spend Anlas.
import { PLUGIN_BASE } from './plugin';
import type { TransportEnv } from './types';
import { TransportError } from './types';

export interface TextRequest {
    model: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    maxTokens: number;
}

export async function novelAiText(env: TransportEnv, request: TextRequest, signal?: AbortSignal): Promise<string> {
    const response = await env.fetch(`${PLUGIN_BASE}/text`, {
        method: 'POST',
        headers: env.headers(),
        body: JSON.stringify({ model: request.model, messages: request.messages, max_tokens: request.maxTokens }),
        signal,
    });
    if (response.status === 404) throw new TransportError('plugin-unavailable', { status: 404 });
    const body = (await response.json().catch(() => ({}))) as {
        content?: string;
        error?: { kind?: string; status?: number; message?: string };
    };
    if (!response.ok || typeof body.content !== 'string') {
        throw new TransportError('http', {
            status: body.error?.status ?? response.status,
            serverMessage: body.error?.message,
        });
    }
    return body.content;
}
