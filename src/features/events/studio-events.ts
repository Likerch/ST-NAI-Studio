// Events for other extensions (v0.10, NAI_STUDIO_API.on): passports were saved, an image was generated
// and attached to a message. A listener's failure never reaches the code that emitted the event.
import { log } from '../../core/logger';

/** Where a passport save went: the card (or persona settings) or the current chat only. */
export interface PassportsSavedDetail {
    ids: string[];
    scope: 'card' | 'chat';
    /** Avatar file of the card that was saved (card scope). */
    avatar?: string;
    /** The persona passport was saved (card scope). */
    persona?: boolean;
}

/**
 * How the image got into the chat: a new message, an image inserted into a message, an image of a
 * marker in a reply, a new swipe of an existing image, or the result of an image tool.
 */
export type ImageReadyKind = 'message' | 'inline' | 'marker' | 'swipe' | 'tool';

export interface ImageReadyDetail {
    messageIndex: number;
    kind: ImageReadyKind;
    /** Passports drawn in the picture (a scene built from passports); empty otherwise. */
    passportIds: string[];
}

export interface StudioEvents {
    passportsSaved: PassportsSavedDetail;
    imageReady: ImageReadyDetail;
}

export type StudioEventName = keyof StudioEvents;

export const STUDIO_EVENTS: readonly StudioEventName[] = ['passportsSaved', 'imageReady'];

const listeners: { [K in StudioEventName]: Set<(detail: StudioEvents[K]) => void> } = {
    passportsSaved: new Set(),
    imageReady: new Set(),
};

export function onStudioEvent<K extends StudioEventName>(
    event: K,
    listener: (detail: StudioEvents[K]) => void,
): () => void {
    const set = listeners[event] as Set<(detail: StudioEvents[K]) => void>;
    set.add(listener);
    return () => {
        set.delete(listener);
    };
}

export function emitStudioEvent<K extends StudioEventName>(event: K, detail: StudioEvents[K]): void {
    for (const listener of [...(listeners[event] as Set<(detail: StudioEvents[K]) => void>)]) {
        try {
            const result = (listener as (d: StudioEvents[K]) => unknown)(structuredClone(detail));
            if (result instanceof Promise)
                result.catch((error: unknown) => log.warn(`${event} listener failed`, error));
        } catch (error) {
            log.warn(`${event} listener failed`, error);
        }
    }
}

/** An image was attached to a message (after the chat was saved). */
export function imageReady(messageIndex: number, kind: ImageReadyKind, passportIds: readonly string[] = []): void {
    emitStudioEvent('imageReady', { messageIndex, kind, passportIds: [...passportIds] });
}
