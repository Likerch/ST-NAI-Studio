// "GenerateImage" function tool for the LLM (built-in parity; TZ Phase 6 extends the arguments).
// Behind the Anlas guard (the pipeline) and a cooldown between calls.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { settings } from '../core/settings';
import { DEFAULT_TEMPLATES, MODE } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';

export const TOOL_NAME = 'GenerateImage';

let lastCall = 0;

export function syncFunctionTool(pipeline: Pipeline, compat: boolean): void {
    const c = ctx();
    const s = settings();
    if (!compat || !s.chat.functionTool) {
        c.unregisterFunctionTool(TOOL_NAME);
        return;
    }
    const description = s.prompts.templates[String(MODE.TOOL)] ?? DEFAULT_TEMPLATES[String(MODE.TOOL)] ?? '';
    c.registerFunctionTool({
        name: TOOL_NAME,
        displayName: t('naist.tool.displayName'),
        description:
            'Generate an image from a given text prompt. Use when a user asks to generate an image, imagine a concept or an item, send a picture of a scene, a selfie, etc.',
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: { prompt: { type: 'string', description } },
            required: ['prompt'],
        },
        formatMessage: () => t('naist.tool.running'),
        action: async (args) => {
            const prompt = typeof args?.prompt === 'string' ? args.prompt : '';
            if (!prompt) throw new Error('Missing prompt');
            const cooldown = settings().chat.toolCooldownSeconds * 1000;
            if (Date.now() - lastCall < cooldown) {
                throw new Error(
                    `Image generation is on cooldown, try again in ${Math.ceil((cooldown - (Date.now() - lastCall)) / 1000)} s.`,
                );
            }
            lastCall = Date.now();
            const result = await pipeline.generatePicture({ initiator: 'tool', trigger: prompt });
            return result ? encodeURI(result.path) : '';
        },
    });
}
