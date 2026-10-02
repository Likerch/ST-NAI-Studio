// Incremental text/event-stream parser for generate-image-stream (RECON §3.2, §3.15). Fed with
// decoded text chunks as they arrive; returns complete events. Pure.

export interface SseEvent {
    event: string;
    data: string;
}

export class SseParser {
    private buffer = '';

    /** Adds a chunk and returns the events completed by it (blank line terminates an event). */
    feed(chunk: string): SseEvent[] {
        this.buffer += chunk.replace(/\r\n?/g, '\n');
        const events: SseEvent[] = [];
        let boundary = this.buffer.indexOf('\n\n');
        while (boundary >= 0) {
            const block = this.buffer.slice(0, boundary);
            this.buffer = this.buffer.slice(boundary + 2);
            const event = parseBlock(block);
            if (event) events.push(event);
            boundary = this.buffer.indexOf('\n\n');
        }
        return events;
    }

    /** Remaining partial event at the end of the stream (servers may omit the last blank line). */
    flush(): SseEvent[] {
        const rest = this.buffer.trim();
        this.buffer = '';
        const event = rest ? parseBlock(rest) : null;
        return event ? [event] : [];
    }
}

function parseBlock(block: string): SseEvent | null {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
        if (!line || line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'event') event = value;
        else if (field === 'data') data.push(value);
    }
    return data.length ? { event, data: data.join('\n') } : null;
}

export interface StreamFrame {
    kind: 'intermediate' | 'final' | 'error';
    sampleIndex: number;
    step?: number;
    /** base64 preview (intermediate) or the finished image (final). */
    image?: string;
    message?: string;
}

/** NovelAI stream event -> frame. Unknown events are ignored (null). */
export function toFrame(event: SseEvent): StreamFrame | null {
    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(event.data) as Record<string, unknown>;
    } catch {
        return null;
    }
    const type = String(payload.event_type ?? event.event);
    const sampleIndex = typeof payload.samp_ix === 'number' ? payload.samp_ix : 0;
    if (type === 'intermediate') {
        return {
            kind: 'intermediate',
            sampleIndex,
            step: typeof payload.step_ix === 'number' ? payload.step_ix : undefined,
            image: typeof payload.image === 'string' ? payload.image : undefined,
        };
    }
    if (type === 'final') {
        return { kind: 'final', sampleIndex, image: typeof payload.image === 'string' ? payload.image : undefined };
    }
    if (type === 'error') {
        return { kind: 'error', sampleIndex, message: String(payload.message ?? payload.kind ?? 'stream error') };
    }
    return null;
}
