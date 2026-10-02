// "GenerateImage" function tool for the LLM (built-in parity, extended in TZ Phase 6 with
// structured arguments: who is in the frame, what happens, mood, framing, location). With named
// characters the scene is assembled from their passports (Phase 4 composer logic). Behind the
// Anlas guard (the pipeline) and a cooldown between calls.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { settings } from '../core/settings';
import { DEFAULT_TEMPLATES, MODE } from '../domain';
import type { Pipeline, PictureResult } from '../features/generation/pipeline';
import type { SceneService } from '../features/scene/scene-service';

export const TOOL_NAME = 'GenerateImage';

const SHOTS: Record<string, { framing?: string; distance?: string }> = {
    portrait: { framing: 'portrait' },
    'upper body': { framing: 'upper_body' },
    'cowboy shot': { framing: 'cowboy_shot' },
    'full body': { framing: 'full_body' },
    'close-up': { distance: 'close_up' },
    'wide shot': { distance: 'wide_shot' },
};

let lastCall = 0;
let scenes: SceneService | null = null;

/** Phase 4 scene assembly for calls that name characters (set once the scene feature is up). */
export function setToolScenes(service: SceneService): void {
    scenes = service;
}

export interface ToolArgs {
    prompt?: unknown;
    characters?: unknown;
    action?: unknown;
    mood?: unknown;
    shot?: unknown;
    location?: unknown;
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Flat prompt from the structured arguments (used when no character is named). */
export function toolPrompt(args: ToolArgs): string {
    const parts = [text(args.prompt), text(args.action), text(args.mood), text(args.location), text(args.shot)];
    return parts.filter(Boolean).join(', ');
}

async function generate(pipeline: Pipeline, args: ToolArgs): Promise<string> {
    const names = Array.isArray(args.characters) ? args.characters.map(text).filter(Boolean) : [];
    if (names.length && scenes) {
        const action = text(args.action) || text(args.prompt);
        const { spec } = await scenes.autoSpec(`${names.join(', ')}. ${action}`);
        if (spec.participants.length) {
            spec.base = [text(args.location), action, text(args.mood)].filter(Boolean).join(', ');
            const shot = SHOTS[text(args.shot).toLowerCase()];
            if (shot?.framing) spec.framing = shot.framing;
            if (shot?.distance) spec.distance = shot.distance;
            const result = await scenes.generate(spec, 'message', { auto: true });
            return result && typeof result === 'object' ? encodeURI((result as PictureResult).path) : '';
        }
    }
    const prompt = toolPrompt(args);
    if (!prompt) throw new Error('Missing prompt');
    const result = await pipeline.generatePicture({ initiator: 'tool', trigger: prompt });
    return result ? encodeURI(result.path) : '';
}

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
            'Generate an image. Use when a user asks to generate an image, imagine a concept or an item, send a picture of a scene, a selfie, etc. ' +
            'Name the characters in the frame and describe what happens; or give a free prompt.',
        parameters: {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                prompt: { type: 'string', description },
                characters: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Names of the characters in the frame',
                },
                action: { type: 'string', description: 'What is happening, as short English tags' },
                mood: { type: 'string', description: 'Mood and atmosphere, as short English tags' },
                shot: { type: 'string', enum: Object.keys(SHOTS), description: 'Framing of the picture' },
                location: { type: 'string', description: 'Where it takes place, as short English tags' },
            },
            required: [],
        },
        formatMessage: () => t('naist.tool.running'),
        action: async (args: ToolArgs) => {
            const cooldown = settings().chat.toolCooldownSeconds * 1000;
            if (Date.now() - lastCall < cooldown) {
                throw new Error(
                    `Image generation is on cooldown, try again in ${Math.ceil((cooldown - (Date.now() - lastCall)) / 1000)} s.`,
                );
            }
            lastCall = Date.now();
            return await generate(pipeline, args ?? {});
        },
    });
}
