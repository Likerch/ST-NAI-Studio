// Minimal typing of the SillyTavern 1.19 host API used by NAI Studio (RECON §2.4, §2.14).
// Only what we call is declared; everything comes from SillyTavern.getContext() / SillyTavern.libs.

export {};

declare global {
    interface STEventSource {
        on(event: string, listener: (...args: unknown[]) => unknown): void;
        removeListener(event: string, listener: (...args: unknown[]) => unknown): void;
        emit(event: string, ...args: unknown[]): Promise<void>;
    }

    interface STMediaAttachment {
        url: string;
        type: 'image' | 'video' | 'audio';
        title?: string;
        source?: 'api' | 'upload' | 'generated' | 'captioned';
        width?: number;
        height?: number;
    }

    interface STChatMessage {
        name: string;
        is_user: boolean;
        is_system: boolean;
        send_date: string;
        mes: string;
        extra?: Record<string, unknown> & {
            media?: STMediaAttachment[];
            media_display?: 'list' | 'gallery';
            media_index?: number;
            inline_image?: boolean;
        };
        [key: string]: unknown;
    }

    interface STCharacter {
        name: string;
        avatar: string;
        data?: { extensions?: Record<string, unknown> };
    }

    interface STPopupStatic {
        new (
            content: string | HTMLElement,
            type: number,
            inputValue?: string,
            options?: Record<string, unknown>,
        ): {
            show(): Promise<unknown>;
            dlg: HTMLDialogElement;
        };
    }

    interface STContext {
        chat: STChatMessage[];
        characters: STCharacter[];
        characterId: string | number | undefined;
        groupId: string | null;
        name1: string;
        name2: string;
        chatId?: string;
        extensionSettings: Record<string, unknown>;
        saveSettingsDebounced(): void;
        chatMetadata: Record<string, unknown>;
        saveMetadata(): Promise<void>;
        eventSource: STEventSource;
        eventTypes: Record<string, string>;
        getRequestHeaders(options?: { omitContentType?: boolean }): Record<string, string>;
        addOneMessage(message: STChatMessage, options?: Record<string, unknown>): void;
        saveChat(): Promise<void>;
        getCurrentChatId(): string | undefined;
        callGenericPopup(
            content: string | HTMLElement,
            type: number,
            inputValue?: string,
            options?: Record<string, unknown>,
        ): Promise<unknown>;
        Popup: STPopupStatic;
        POPUP_TYPE: { TEXT: number; CONFIRM: number; INPUT: number; DISPLAY: number };
        POPUP_RESULT: { AFFIRMATIVE: number; NEGATIVE: number; CANCELLED: null };
        translate(text: string, key?: string | null): string;
        getCurrentLocale(): string;
        uuidv4(): string;
        humanizedDateTime(timestamp?: number): string;
        substituteParams(content: string): string;
        getThumbnailUrl(type: string, file: string): string;
        isMobile(): boolean;
    }

    interface STLibs {
        lodash: typeof import('lodash');
        localforage: {
            createInstance(options: { name: string; storeName?: string }): STLocalForage;
        };
        DOMPurify: { sanitize(dirty: string, config?: Record<string, unknown>): string };
        Handlebars: { compile(template: string): (data: unknown) => string };
        moment: (input?: unknown) => { format(fmt?: string): string; fromNow(): string };
    }

    interface STLocalForage {
        getItem<T>(key: string): Promise<T | null>;
        setItem<T>(key: string, value: T): Promise<T>;
        removeItem(key: string): Promise<void>;
        keys(): Promise<string[]>;
        clear(): Promise<void>;
    }

    interface Window {
        SillyTavern: {
            getContext(): STContext;
            libs: STLibs;
        };
    }

    var SillyTavern: Window['SillyTavern'];
    var toastr: {
        success(message: string, title?: string, options?: Record<string, unknown>): void;
        info(message: string, title?: string, options?: Record<string, unknown>): void;
        warning(message: string, title?: string, options?: Record<string, unknown>): void;
        error(message: string, title?: string, options?: Record<string, unknown>): void;
    };
}
