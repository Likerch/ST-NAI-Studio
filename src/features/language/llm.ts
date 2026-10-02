// One request to the language backend chosen in "Human language" (v0.8): the chat model, a
// connection profile or NovelAI's text model through the plugin. Used where an answer is JSON
// (passport generation); the schema is sent where the API supports structured output.
import { ctx, requestHeaders } from '../../core/context';
import { NaiError } from '../../core/errors';
import { settings } from '../../core/settings';
import { novelAiText } from '../../transport';

export interface LlmRequest {
    system: string;
    user: string;
    /** `{name, description, strict, value}` like generateRaw's jsonSchema. */
    schema?: object;
    maxTokens: number;
}

const asText = (value: unknown): string =>
    typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'content' in value
          ? asText((value as { content: unknown }).content)
          : value === undefined || value === null
            ? ''
            : JSON.stringify(value);

async function viaMain(req: LlmRequest): Promise<string> {
    const c = ctx();
    if (c.mainApi === 'openai') {
        return asText(
            await c.generateRaw({
                prompt: req.user,
                systemPrompt: req.system,
                responseLength: req.maxTokens,
                ...(req.schema ? { jsonSchema: req.schema } : {}),
            }),
        );
    }
    // Text completion: one instruction block and an opened JSON object to continue.
    const answer = asText(
        await c.generateRaw({
            prompt: [{ role: 'system', content: `${req.system}\n\n${req.user}` }],
            prefill: '{',
            responseLength: req.maxTokens,
        }),
    );
    return answer.trimStart().startsWith('{') ? answer : `{${answer}`;
}

async function viaProfile(req: LlmRequest): Promise<string> {
    const service = ctx().ConnectionManagerRequestService;
    const id = settings().language.profileId;
    if (!id) throw new NaiError('translation-failed', 'none', { message: 'no connection profile selected' });
    const chat = service.validateProfile(service.getProfile(id)).selected === 'openai';
    const result = chat
        ? await service.sendRequest(
              id,
              [
                  { role: 'system', content: req.system },
                  { role: 'user', content: req.user },
              ],
              req.maxTokens,
              { stream: false, extractData: true, includePreset: false },
              req.schema ? { json_schema: req.schema } : {},
          )
        : await service.sendRequest(id, `${req.system}\n\n${req.user}\n{`, req.maxTokens, {
              stream: false,
              extractData: true,
              includePreset: true,
              includeInstruct: false,
          });
    const text = asText(result);
    return chat || text.trimStart().startsWith('{') ? text : `{${text}`;
}

async function viaNovelAi(req: LlmRequest): Promise<string> {
    return await novelAiText(
        { fetch: (input, init) => fetch(input, init), headers: () => requestHeaders() },
        {
            model: settings().language.novelaiModel,
            messages: [
                { role: 'system', content: req.system },
                { role: 'user', content: req.user },
            ],
            maxTokens: req.maxTokens,
        },
    );
}

export async function askLlm(req: LlmRequest): Promise<string> {
    try {
        const backend = settings().language.backend;
        if (backend === 'profile') return await viaProfile(req);
        if (backend === 'novelai') return await viaNovelAi(req);
        return await viaMain(req);
    } catch (error) {
        if (error instanceof NaiError) throw error;
        throw new NaiError('translation-failed', 'none', { message: String((error as Error)?.message ?? error) });
    }
}
