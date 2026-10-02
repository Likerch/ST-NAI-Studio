// Wires NAI Studio into SillyTavern. The parts that share names with the built-in Image Generation
// (/sd, /imagine, macros, GenerateImage tool, interactive mode, overswipe) are active only once the
// built-in is disabled; /nai, the wand item, the message button and the card menu always work.
import { ctx } from '../core/context';
import { log } from '../core/logger';
import type { Pipeline } from '../features/generation/pipeline';
import { ownsCompatSurface } from '../features/takeover/takeover';
import { installCharacterCardMenu } from './character-card';
import { registerCommands } from './commands';
import { installInterceptor } from './interceptor';
import { registerMacros } from './macros';
import { installMessageButtons } from './message-buttons';
import { syncFunctionTool } from './tools';
import { installWandMenu } from './wand';

export function setupIntegrations(pipeline: Pipeline): void {
    const compat = ownsCompatSurface();
    installInterceptor(pipeline);
    installWandMenu(pipeline);
    installMessageButtons(pipeline);
    installCharacterCardMenu(pipeline);
    // Commands are registered once the app is ready, after every extension's init() ran.
    const c = ctx();
    c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', () => {
        registerCommands(pipeline, compat);
        if (compat) registerMacros();
        syncFunctionTool(pipeline, compat);
        log.info(
            compat
                ? 'took over /sd, /imagine, macros and the GenerateImage tool'
                : 'built-in Image Generation is active: only /nai is registered',
        );
    });
}
