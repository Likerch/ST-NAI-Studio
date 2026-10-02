// Image markers wiring (TZ Phase 7): ST events drive the marker service (early start while the
// reply streams, inline images when it is finished), the instruction for the chat model goes in as
// an extension prompt, and a formatter hook (before display regexes) shows complete markers as
// placeholders, hides one still being written, and gives widget regexes an <img> for every image.
import { ctx } from '../core/context';
import { log } from '../core/logger';
import { settings } from '../core/settings';
import {
    markerDimensions,
    markerInstruction,
    partialMarkerStart,
    PLACEHOLDER_PATTERN,
    replaceMarkers,
} from '../domain';
import type { MarkerParams } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';
import type { InlineImages } from '../features/inline/inline-service';
import { MarkerService } from '../features/markers/marker-service';
import type { SceneService } from '../features/scene/scene-service';
import { sceneCandidates } from '../features/scene/scene-service';
import { escapeHtml } from '../ui/components/dom';
import { IMG_ATTR, PIXEL, WIDGET_SRC_MARK } from './inline-render';
import { inlineRenderer } from './inline-setup';
import { registerCharactersMacro } from './macros';

const PROMPT_KEY = 'nai_studio_markers';
/** extension_prompt_types.IN_CHAT and extension_prompt_roles in public/script.js. */
const IN_CHAT = 1;
const ROLES = { system: 0, user: 1, assistant: 2 } as const;
const NO_INSTRUCTION = new Set(['impersonate', 'quiet']);

let service: MarkerService | null = null;
/** Names for {{nai_characters}}, refreshed with the instruction. */
let knownCharacters = '';

export function markerService(): MarkerService | null {
    return service;
}

/** Placeholder as <img> for display regexes; the id is in the attribute and in the src fragment. */
function compatImage(id: string): string {
    return `<img ${IMG_ATTR}="${id}" class="naist-compat" src="${PIXEL}${WIDGET_SRC_MARK}${id}" alt="">`;
}

/** A complete marker while the reply streams: an <img> box (widgets keep their layout). */
function streamingImage(params: MarkerParams): string {
    const size = markerDimensions(params.ratio, params.size, true);
    const label = escapeHtml((params.caption || params.prompt).slice(0, 200));
    return `<img class="naist-marker-stream" src="${PIXEL}#naist-stream" width="${size.width}" height="${size.height}" alt="${label}" title="${label}">`;
}

function formatHook(mes: string, info: STMessageFormattingInfo): string {
    const s = settings();
    let out = mes;
    if (s.markers.enabled && service && !info.isUser) {
        if (service.generating && info.messageId === ctx().chat.length - 1) {
            const cut = partialMarkerStart(out);
            if (cut >= 0) out = out.slice(0, cut);
        }
        const markers = service.markersIn(out);
        if (markers.length) out = replaceMarkers(out, markers, (m) => streamingImage(m.params));
    }
    if (s.inline.regexCompat && out.includes('[nai:img:')) {
        out = out.replace(new RegExp(PLACEHOLDER_PATTERN.source, 'g'), (_m, id: string) => compatImage(id));
    }
    return out;
}

/** Puts the current instruction in place (or clears it); called on settings and chat changes. */
export async function refreshMarkerInstruction(): Promise<void> {
    const c = ctx();
    const s = settings().markers;
    let value = '';
    let chars: string[] = [];
    if (s.enabled) {
        try {
            chars = (await sceneCandidates())
                .filter((cand) => !cand.isUser && (cand.passport || cand.currentLook?.trim()))
                .map((cand) => cand.name);
        } catch (error) {
            log.warn('marker instruction: characters not available', error);
        }
    }
    knownCharacters = chars.join(', ');
    if (s.enabled && s.inject) {
        value = markerInstruction(s.preset, s.template, {
            min: s.min,
            max: s.max,
            captionLanguage: s.captionLanguage,
            chars,
        });
    }
    c.setExtensionPrompt(PROMPT_KEY, value, IN_CHAT, Math.max(0, s.depth), false, ROLES[s.role] ?? 0, () => {
        const now = settings().markers;
        return now.enabled && now.inject && !NO_INSTRUCTION.has(service?.currentType ?? '');
    });
}

export function setupMarkers(pipeline: Pipeline, inline: InlineImages, scenes: SceneService): MarkerService {
    const c = ctx();
    const markers = new MarkerService(pipeline, inline, scenes);
    service = markers;
    c.messageFormatter.addHook(formatHook, { stage: 'beforeRegex' });
    try {
        registerCharactersMacro(() => knownCharacters);
    } catch (error) {
        log.warn('{{nai_characters}} macro not registered', error);
    }
    const renderer = inlineRenderer();
    renderer?.setMarkerHooks({
        isRunning: (id) => markers.isRunning(id),
        retry: (messageId, imageId) => markers.retry(messageId, imageId),
    });
    markers.onRunningChange((id) => renderer?.refreshImage(id));

    const on = (name: string, handler: (...args: unknown[]) => unknown) => {
        const event = c.eventTypes[name];
        if (event) c.eventSource.on(event, handler);
    };
    // Awaited by ST before the prompt is built, so the instruction is current.
    on('GENERATION_STARTED', async (type, _options, dryRun) => {
        keepFirst();
        markers.generationStarted(String(type ?? ''), Boolean(dryRun));
        if (!dryRun) await refreshMarkerInstruction();
    });
    on('STREAM_TOKEN_RECEIVED', () => markers.streamProgress());
    // First of all listeners: the markers become placeholders before anyone else reads the reply.
    // Doom's Enhancement Suite parses every balanced {…} of the reply in the same event and loses
    // its info box and quests when a marker's JSON is a second object.
    const received = (id: unknown, type: unknown) => {
        void markers
            .finalize(Number(id), typeof type === 'string' ? type : undefined)
            .catch((error) => log.warn('markers', error));
    };
    const receivedEvent = c.eventTypes.MESSAGE_RECEIVED;
    if (receivedEvent && c.eventSource.makeFirst) c.eventSource.makeFirst(receivedEvent, received);
    else on('MESSAGE_RECEIVED', received);
    // Another extension may put itself first later (the DES-RU add-on does): take the place back
    // before every generation, while no reply is being handled.
    const keepFirst = () => {
        const list = receivedEvent
            ? (c.eventSource as { events?: Record<string, unknown[]> }).events?.[receivedEvent]
            : undefined;
        const at = Array.isArray(list) ? list.indexOf(received) : -1;
        if (list && at > 0) list.unshift(...list.splice(at, 1));
    };
    for (const name of ['GENERATION_ENDED', 'GENERATION_STOPPED']) {
        on(name, () => {
            // After MESSAGE_RECEIVED handlers: only a reply that did not get one is finalized.
            setTimeout(() => void markers.generationEnded().catch((error) => log.warn('markers', error)), 150);
        });
    }
    on('CHAT_CHANGED', () => {
        markers.chatChanged();
        void refreshMarkerInstruction();
    });
    void refreshMarkerInstruction();
    return markers;
}

/** Settings that change how messages are formatted: re-render the chat. */
export function onMarkerSettingChange(path: string): void {
    if (path.startsWith('markers.')) void refreshMarkerInstruction();
    if (path === 'markers.enabled' || path === 'markers.legacy' || path === 'inline.regexCompat') {
        const c = ctx();
        c.chat.forEach((m, id) => {
            if (document.querySelector(`#chat .mes[mesid="${id}"]`)) c.updateMessageBlock(id, m);
        });
    }
}
