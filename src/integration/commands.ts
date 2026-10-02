// Slash commands (TZ Phase 2, task 4). /nai always; /imagine with aliases /sd /img /image only
// once the built-in is disabled, so SillyTavern never logs duplicate registrations (RECON §2.9).
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { notifyExternalChange, saveSettings, settings } from '../core/settings';
import { MODEL_IDS, NOISE_SCHEDULES, QUALITY_PRESETS, SAMPLERS, TRIGGER_WORDS, UC_PRESETS } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';
import { IGNORED_ARGS, MODEL_ALIASES, parseCommandArgs } from './command-args';

interface AbortLike {
    addEventListener(type: 'abort', listener: () => void): void;
}

function namedArguments(): unknown[] {
    const { SlashCommandNamedArgument: Arg, ARGUMENT_TYPE: T } = ctx();
    const named = (name: string, type: string, enumList?: readonly string[], defaultValue?: string) =>
        Arg.fromProps({
            name,
            description: t(`naist.command.arg.${name}`),
            typeList: [type],
            isRequired: false,
            ...(enumList ? { enumList: [...enumList] } : {}),
            ...(defaultValue !== undefined ? { defaultValue } : {}),
        });
    return [
        named('quiet', T.BOOLEAN ?? 'bool', undefined, 'false'),
        named('gallery', T.BOOLEAN ?? 'bool', undefined, 'true'),
        named('negative', T.STRING ?? 'string'),
        named('extend', T.BOOLEAN ?? 'bool'),
        named('edit', T.BOOLEAN ?? 'bool'),
        named('multimodal', T.BOOLEAN ?? 'bool'),
        named('snap', T.BOOLEAN ?? 'bool'),
        named('processing', T.STRING ?? 'string', ['standard', 'minimal']),
        named('seed', T.NUMBER ?? 'number'),
        named('width', T.NUMBER ?? 'number'),
        named('height', T.NUMBER ?? 'number'),
        named('steps', T.NUMBER ?? 'number'),
        named('cfg', T.NUMBER ?? 'number'),
        named('cfgrescale', T.NUMBER ?? 'number'),
        named('samples', T.NUMBER ?? 'number'),
        named('model', T.STRING ?? 'string', [...MODEL_IDS, ...Object.keys(MODEL_ALIASES)]),
        named('sampler', T.STRING ?? 'string', SAMPLERS),
        named('scheduler', T.STRING ?? 'string', NOISE_SCHEDULES),
        named('uc', T.STRING ?? 'string', UC_PRESETS),
        named('quality', T.STRING ?? 'string', QUALITY_PRESETS),
        named('smea', T.BOOLEAN ?? 'bool'),
        named('dyn', T.BOOLEAN ?? 'bool'),
        named('variety', T.BOOLEAN ?? 'bool'),
        named('decrisper', T.BOOLEAN ?? 'bool'),
        named('transparent', T.BOOLEAN ?? 'bool'),
        ...IGNORED_ARGS.map((name) => named(name, T.STRING ?? 'string')),
    ];
}

function imagineCallback(pipeline: Pipeline) {
    return async (args: Record<string, unknown>, value: unknown): Promise<string> => {
        const parsed = parseCommandArgs(args);
        if (parsed.ignored.length) log.info('ignored (not applicable to NovelAI):', parsed.ignored.join(', '));
        if (parsed.invalid.length) toastr.warning(t('naist.command.invalidArgs', { args: parsed.invalid.join(', ') }));
        const controller = new AbortController();
        (args._abortController as AbortLike | undefined)?.addEventListener?.('abort', () => controller.abort());
        try {
            const result = await pipeline.generatePicture({
                initiator: 'command',
                trigger: String(value ?? ''),
                overrides: parsed.overrides,
                signal: controller.signal,
            });
            return result?.path ?? '';
        } catch (error) {
            reportGenerationError(error);
            return '';
        }
    };
}

function styleCallback() {
    return async (_args: Record<string, unknown>, value: unknown): Promise<string> => {
        const name = String(value ?? '').trim();
        const prompts = settings().prompts;
        if (!name) return prompts.activeStyle;
        const style = prompts.styles.find((s) => s.name.toLowerCase() === name.toLowerCase());
        if (!style) {
            toastr.warning(t('naist.command.styleMissing', { name }));
            return prompts.activeStyle;
        }
        prompts.activeStyle = style.name;
        prompts.prefix = style.prefix;
        prompts.suffix = style.suffix;
        settings().generation.negativePrompt = style.negative;
        saveSettings();
        notifyExternalChange();
        return style.name;
    };
}

export function registerCommands(pipeline: Pipeline, compat: boolean): void {
    const c = ctx();
    const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, ARGUMENT_TYPE: T } = c;
    const triggerArg = () =>
        Arg.fromProps({
            description: t('naist.command.trigger'),
            typeList: [T.STRING ?? 'string'],
            isRequired: false,
            enumList: Object.values(TRIGGER_WORDS),
        });
    const imagine = (name: string, aliases: string[]) =>
        Command.fromProps({
            name,
            aliases,
            callback: imagineCallback(pipeline),
            returns: t('naist.command.returns'),
            namedArgumentList: namedArguments(),
            unnamedArgumentList: [triggerArg()],
            helpString: t('naist.command.help'),
        });

    parser.addCommandObject(imagine('nai', ['nai-imagine']));
    const styleAliases = compat ? ['sd-style', 'img-style', 'nai-style'] : [];
    parser.addCommandObject(
        Command.fromProps({
            name: compat ? 'imagine-style' : 'nai-style',
            aliases: styleAliases,
            callback: styleCallback(),
            returns: t('naist.command.styleReturns'),
            unnamedArgumentList: [
                Arg.fromProps({
                    description: t('naist.command.styleName'),
                    typeList: [T.STRING ?? 'string'],
                    isRequired: false,
                }),
            ],
            helpString: t('naist.command.styleHelp'),
        }),
    );
    if (!compat) return;

    parser.addCommandObject(imagine('imagine', ['sd', 'img', 'image']));
    parser.addCommandObject(
        Command.fromProps({
            name: 'imagine-source',
            aliases: ['sd-source', 'img-source'],
            callback: async (_args: Record<string, unknown>, value: unknown) => {
                if (String(value ?? '').trim() && String(value).trim() !== 'novel') {
                    toastr.info(t('naist.command.sourceFixed'));
                }
                return 'novel';
            },
            returns: t('naist.command.sourceReturns'),
            unnamedArgumentList: [
                Arg.fromProps({
                    description: t('naist.command.sourceName'),
                    typeList: [T.STRING ?? 'string'],
                    isRequired: false,
                }),
            ],
            helpString: t('naist.command.sourceHelp'),
        }),
    );
}
