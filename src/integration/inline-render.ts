// Renders `[nai:img:<id>]` placeholders in chat messages (TZ Phase 3, RECON §2.3, §2.8).
// 1. messageFormatter hook (non-system messages) turns placeholders into empty data-* spans that
//    survive DOMPurify; a text-node pass does the same for system messages.
// 2. A MutationObserver mounts the image component into every new span (ST rewrites .mes_text
//    on every update, so mounting has to be repeatable).
// 3. Images load lazily through an IntersectionObserver: blobs only for visible images.
// 4. Marker images (TZ Phase 7) show progress, errors and a retry button until they exist; with
//    regex compatibility placeholders reach display regexes as <img> (HTML widgets embed them):
//    an untouched one becomes the normal component, one rebuilt by a widget just gets its source.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import { activeSwipe, displayStyle, markerDimensions, PLACEHOLDER_PATTERN } from '../domain';
import type { InlineImage, InlineSwipe } from '../domain';
import type { InlineImages } from '../features/inline/inline-service';
import { getBlob } from '../features/inline/inline-store';

export const IMG_ATTR = 'data-naist-img';
/** Transparent pixel used by placeholder and streaming <img> tags; the fragment carries the id. */
export const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export const WIDGET_SRC_MARK = '#naist:';
const MOUNTED_ATTR = 'data-naist-mounted';
const DRAG_TYPE = 'application/x-naist-inline';

export interface InlineUi {
    lightbox(messageId: number, imageId: string): void;
    edit(messageId: number, imageId: string): void;
    display(messageId: number, imageId: string): void;
    tools(messageId: number, imageId: string): void;
    confirmDelete(): Promise<boolean>;
}

/** Marker generation state, supplied by the marker service. */
export interface MarkerHooks {
    isRunning(imageId: string): boolean;
    retry(messageId: number, imageId: string): Promise<void>;
}

function messageIdOf(element: Element): number | null {
    const mes = element.closest('.mes');
    const id = Number(mes?.getAttribute('mesid'));
    return Number.isInteger(id) ? id : null;
}

function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    attrs: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
}

function icon(action: string, classes: string, titleKey: string): HTMLElement {
    const node = el('i', `fa-solid ${classes} naist-inline-btn`, { 'data-naist-action': action });
    node.title = t(titleKey);
    return node;
}

export class InlineRenderer {
    private readonly urls = new Map<string, string>();
    private readonly pending = new Set<Element>();
    private scheduled = false;
    private intersection: IntersectionObserver | null = null;
    private busy = new Set<string>();
    /** Images waiting for their source; checked on scroll as well (IO needs a painting page). */
    private readonly waiting = new Set<HTMLImageElement>();
    private lazyTimer: ReturnType<typeof setTimeout> | null = null;
    private markers: MarkerHooks | null = null;

    constructor(
        private readonly service: InlineImages,
        private readonly ui: InlineUi,
    ) {}

    install(): void {
        const c = ctx();
        c.messageFormatter.addHook(
            (mes) =>
                mes.includes('[nai:img:')
                    ? mes.replace(
                          new RegExp(PLACEHOLDER_PATTERN.source, 'g'),
                          (_m, id: string) => `<span ${IMG_ATTR}="${id}"></span>`,
                      )
                    : mes,
            { stage: 'afterMarkdown' },
        );
        const chat = document.getElementById('chat');
        if (!chat) {
            log.warn('chat element not found: inline images will not render');
            return;
        }
        this.intersection = new IntersectionObserver((entries) => this.onVisible(entries), {
            root: null,
            rootMargin: '800px 0px',
        });
        new MutationObserver((records) => {
            for (const record of records) {
                const target = record.target instanceof Element ? record.target : record.target.parentElement;
                if (!target || target.closest(`[${MOUNTED_ATTR}]`)) continue;
                const mes = target.closest('.mes');
                if (mes) this.pending.add(mes);
                for (const node of record.addedNodes) {
                    if (node instanceof Element && node.classList.contains('mes')) this.pending.add(node);
                    else if (node instanceof Element) node.querySelectorAll('.mes').forEach((m) => this.pending.add(m));
                }
            }
            if (this.pending.size) this.schedule();
        }).observe(chat, { childList: true, subtree: true, characterData: true });
        chat.addEventListener('scroll', () => this.scheduleLazyCheck(), { passive: true });
        window.addEventListener('resize', () => this.scheduleLazyCheck(), { passive: true });
        // Scroll and intersection events are delivered with rendering; a slow poll covers the rest.
        setInterval(() => this.scheduleLazyCheck(), 750);
        chat.addEventListener('click', (event) => void this.onClick(event));
        chat.addEventListener('dragstart', (event) => this.onDragStart(event));
        chat.addEventListener('dragover', (event) => this.onDragOver(event));
        chat.addEventListener('drop', (event) => void this.onDrop(event));
        chat.addEventListener('dragend', () => this.clearDropMarks());
        this.service.onChange((messageId) => this.refreshMessage(messageId));
        this.applyVisibility();
        this.renderAll();
    }

    setMarkerHooks(hooks: MarkerHooks): void {
        this.markers = hooks;
    }

    /** Re-renders the message that shows an image (its generation started or ended). */
    refreshImage(imageId: string): void {
        const span = document.querySelector(
            `#chat [${IMG_ATTR}="${imageId}"], #chat img[src$="${WIDGET_SRC_MARK}${imageId}"]`,
        );
        const id = span ? messageIdOf(span) : null;
        if (id !== null) this.refreshMessage(id);
    }

    /** Re-renders every message (chat change, settings change). */
    renderAll(): void {
        document.querySelectorAll('#chat .mes').forEach((m) => this.pending.add(m));
        this.schedule();
    }

    /** Drops cached object URLs (new chat). */
    reset(): void {
        for (const url of this.urls.values()) URL.revokeObjectURL(url);
        this.urls.clear();
    }

    refreshMessage(messageId: number): void {
        const mes = document.querySelector(`#chat .mes[mesid="${messageId}"]`);
        if (!mes) return;
        mes.querySelectorAll(`[${IMG_ATTR}][${MOUNTED_ATTR}]`).forEach((span) => {
            span.removeAttribute(MOUNTED_ATTR);
            span.replaceChildren();
        });
        this.pending.add(mes);
        this.schedule();
    }

    /** Body classes for "hide all images in this chat" and the global reading mode. */
    applyVisibility(): void {
        const meta = ctx().chatMetadata?.nai_studio as { inlineHidden?: boolean } | undefined;
        document.body.classList.toggle('naist-inline-collapsed', meta?.inlineHidden === true);
        document.body.classList.toggle('naist-inline-reading', settings().inline.readingMode);
    }

    // setTimeout, not requestAnimationFrame: rAF stops while the window is not painted.
    private schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;
        setTimeout(() => {
            this.scheduled = false;
            const list = [...this.pending];
            this.pending.clear();
            for (const mes of list) {
                try {
                    this.processMessage(mes);
                } catch (error) {
                    log.warn('inline render failed', error);
                }
            }
            this.scheduleLazyCheck();
        }, 0);
    }

    private scheduleLazyCheck(): void {
        if (this.lazyTimer || !this.waiting.size) return;
        this.lazyTimer = setTimeout(() => {
            this.lazyTimer = null;
            this.lazyCheck();
        }, 120);
    }

    /** Loads images within 800 px of the viewport; the rest stay without a source. */
    private lazyCheck(): void {
        const margin = 800;
        const height = window.innerHeight;
        for (const img of [...this.waiting]) {
            if (!img.isConnected) {
                this.waiting.delete(img);
                continue;
            }
            const rect = img.getBoundingClientRect();
            if (rect.bottom >= -margin && rect.top <= height + margin && rect.width > 0) this.load(img);
        }
    }

    private load(img: HTMLImageElement): void {
        if (!this.waiting.delete(img)) return;
        this.intersection?.unobserve(img);
        void this.resolveUrl(img.dataset.naistKey ?? '', img.dataset.naistPath ?? '').then((url) => {
            if (url) img.src = url;
            else img.closest('.naist-inline')?.classList.add('naist-inline-missing');
        });
    }

    private processMessage(mes: Element): void {
        const text = mes.querySelector('.mes_text');
        if (!text) return;
        const messageId = messageIdOf(mes);
        if (messageId === null) return;
        if (text.textContent?.includes('[nai:img:')) this.replaceTextPlaceholders(text);
        // Placeholders shown to display regexes as <img>: one left in the text gets the full
        // component; one a widget put into its own markup (markdown makes no <div>) keeps the
        // widget's layout and only gets its source.
        text.querySelectorAll<HTMLImageElement>(`img[${IMG_ATTR}]`).forEach((img) => {
            const container = img.parentElement?.closest('div, td, section, article, figure');
            if (container && container !== text && text.contains(container)) img.removeAttribute(IMG_ATTR);
            else img.replaceWith(el('span', '', { [IMG_ATTR]: img.getAttribute(IMG_ATTR) ?? '' }));
        });
        const widgetImages = [...text.querySelectorAll<HTMLImageElement>(`img[src*="${WIDGET_SRC_MARK}"]`)];
        const spans = [...text.querySelectorAll<HTMLElement>(`[${IMG_ATTR}]:not([${MOUNTED_ATTR}])`)];
        if (!spans.length && !widgetImages.length) return;
        const entries = this.service.entries(messageId);
        for (const img of widgetImages) this.fillWidgetImage(img, entries);
        for (const span of spans) this.mount(span, messageId, entries);
        this.groupRuns(text, entries);
    }

    /** System messages skip the formatter hook: replace placeholders in their text nodes. */
    private replaceTextPlaceholders(root: Element): void {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            if (node.data.includes('[nai:img:') && !node.parentElement?.closest(`[${MOUNTED_ATTR}]`)) nodes.push(node);
        }
        for (const node of nodes) {
            const parts = node.data.split(new RegExp(PLACEHOLDER_PATTERN.source, 'g'));
            const fragment = document.createDocumentFragment();
            parts.forEach((part, i) => {
                if (i % 2 === 0) {
                    if (part) fragment.append(part);
                } else {
                    fragment.append(el('span', '', { [IMG_ATTR]: part }));
                }
            });
            node.replaceWith(fragment);
        }
    }

    /** An <img> a widget regex rebuilt around a placeholder: only its source is set. */
    private fillWidgetImage(img: HTMLImageElement, entries: InlineImage[]): void {
        const src = img.getAttribute('src') ?? '';
        const id = src.slice(src.indexOf(WIDGET_SRC_MARK) + WIDGET_SRC_MARK.length);
        const entry = entries.find((e) => e.id === id);
        const active = entry ? activeSwipe(entry) : undefined;
        img.classList.add('naist-widget-img');
        if (!active) {
            // A widget has no room for buttons: a failed or interrupted picture retries on click.
            const failed = entry?.marker !== undefined && !(this.markers?.isRunning(id) ?? false);
            img.classList.toggle('naist-marker-wait', !failed);
            img.classList.toggle('naist-marker-failed', failed);
            if (failed) {
                img.dataset.naistRetry = id;
                img.title = entry?.marker?.error || t('naist.markers.retryHint');
            } else delete img.dataset.naistRetry;
            return;
        }
        img.classList.remove('naist-marker-wait', 'naist-marker-failed');
        delete img.dataset.naistRetry;
        img.dataset.naistKey = active.blobKey;
        img.dataset.naistPath = active.filePath;
        this.waiting.add(img);
        this.intersection?.observe(img);
    }

    /** A marker image that does not exist yet: generating, interrupted or failed. */
    private mountMarker(span: HTMLElement, entry: InlineImage): void {
        const marker = entry.marker!;
        const d = entry.display;
        const running = this.markers?.isRunning(entry.id) ?? false;
        const state = marker.status === 'error' ? 'error' : running ? 'pending' : 'interrupted';
        span.className = `naist-inline naist-marker naist-marker-${state}`;
        span.removeAttribute('style');
        for (const [key, value] of Object.entries(displayStyle(d))) span.style.setProperty(key, value);
        const box = el('span', 'naist-marker-box');
        const size = markerDimensions(marker.params.ratio, marker.params.size, true);
        box.style.aspectRatio = `${size.width} / ${size.height}`;
        const status = el('span', 'naist-marker-status');
        if (state === 'pending') {
            status.append(
                el('i', 'fa-solid fa-spinner fa-spin'),
                document.createTextNode(` ${t('naist.markers.generating')}`),
            );
        } else {
            status.append(
                el('i', `fa-solid ${state === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-pause'}`),
                document.createTextNode(
                    ` ${state === 'error' ? t('naist.markers.failed') : t('naist.markers.interrupted')}`,
                ),
            );
        }
        box.append(status);
        if (marker.error) {
            const reason = el('span', 'naist-marker-reason');
            reason.textContent = marker.error;
            box.append(reason);
        }
        const prompt = el('span', 'naist-marker-prompt');
        const text = marker.params.prompt;
        prompt.textContent = text.length > 160 ? `${text.slice(0, 160)}...` : text;
        box.append(prompt);
        if (state !== 'pending') {
            const actions = el('span', 'naist-marker-actions');
            const retry = el('span', 'menu_button naist-marker-retry', { 'data-naist-action': 'marker-retry' });
            retry.append(el('i', 'fa-solid fa-rotate'), document.createTextNode(` ${t('naist.markers.retry')}`));
            actions.append(retry, icon('delete', 'fa-trash-can', 'naist.inline.delete'));
            box.append(actions);
        }
        span.append(box);
        if (d.caption) {
            const caption = el('span', 'naist-inline-caption');
            caption.textContent = d.caption;
            span.append(caption);
        }
    }

    private mount(span: HTMLElement, messageId: number, entries: InlineImage[]): void {
        const id = span.getAttribute(IMG_ATTR) ?? '';
        span.setAttribute(MOUNTED_ATTR, '1');
        span.replaceChildren();
        const entry = entries.find((e) => e.id === id);
        if (!entry) {
            span.className = 'naist-inline naist-inline-missing';
            span.textContent = t('naist.inline.missing');
            return;
        }
        const swipe = activeSwipe(entry);
        if (!swipe && entry.marker) {
            this.mountMarker(span, entry);
            return;
        }
        const d = entry.display;
        span.className = 'naist-inline';
        span.removeAttribute('style');
        for (const [key, value] of Object.entries(displayStyle(d))) span.style.setProperty(key, value);
        span.classList.toggle('naist-inline-busy', this.busy.has(id));

        const frame = el('span', 'naist-inline-frame', { draggable: 'true' });
        frame.style.borderRadius = `${Math.max(0, d.radius)}px`;
        frame.classList.toggle('naist-inline-border', d.border);
        frame.classList.toggle('naist-inline-spoiler', d.spoiler);
        const img = el('img', 'naist-inline-img', {
            alt: d.alt || d.caption || t('naist.inline.alt'),
            decoding: 'async',
        });
        if (swipe) {
            img.dataset.naistKey = swipe.blobKey;
            img.dataset.naistPath = swipe.filePath;
            const ratio = swipe.meta.width && swipe.meta.height ? `${swipe.meta.width} / ${swipe.meta.height}` : '';
            if (ratio) img.style.aspectRatio = ratio;
        }
        frame.append(img);
        if (d.spoiler) {
            const cover = el('span', 'naist-inline-cover', { 'data-naist-action': 'reveal' });
            cover.append(el('i', 'fa-solid fa-eye-slash'), document.createTextNode(` ${t('naist.inline.spoiler')}`));
            frame.append(cover);
        }
        const toolbar = el('span', 'naist-inline-toolbar');
        if (entry.swipes.length > 1) {
            toolbar.append(icon('prev', 'fa-chevron-left', 'naist.inline.prev'));
            const counter = el('span', 'naist-inline-counter');
            counter.textContent = `${entry.activeSwipe + 1}/${entry.swipes.length}`;
            toolbar.append(counter, icon('next', 'fa-chevron-right', 'naist.inline.next'));
        }
        toolbar.append(
            icon('regenerate', 'fa-rotate', 'naist.inline.regenerate'),
            icon('variation', 'fa-shuffle', 'naist.inline.variation'),
            icon('edit', 'fa-pen-to-square', 'naist.inline.edit'),
            icon('display', 'fa-sliders', 'naist.inline.display'),
            icon('tools', 'fa-wand-magic-sparkles', 'naist.tools.title'),
            icon('lightbox', 'fa-expand', 'naist.inline.lightbox'),
            icon('delete', 'fa-trash-can', 'naist.inline.delete'),
        );
        frame.append(toolbar);
        const spinner = el('span', 'naist-inline-spinner');
        spinner.append(el('i', 'fa-solid fa-spinner fa-spin'));
        frame.append(spinner);
        span.append(frame);
        if (d.caption) {
            const caption = el('span', 'naist-inline-caption');
            caption.textContent = d.caption;
            span.append(caption);
        }
        const chip = el('span', 'naist-inline-chip', { 'data-naist-action': 'show-chat' });
        chip.append(el('i', 'fa-solid fa-image'), document.createTextNode(` ${t('naist.inline.hiddenChip')}`));
        span.append(chip);
        this.waiting.add(img);
        this.intersection?.observe(img);
    }

    /** Wraps consecutive images (only whitespace or <br> between) into one grid/carousel/list. */
    private groupRuns(text: Element, entries: InlineImage[]): void {
        const spans = [...text.querySelectorAll<HTMLElement>(`[${IMG_ATTR}][${MOUNTED_ATTR}]`)].filter(
            (s) => !s.parentElement?.classList.contains('naist-inline-group'),
        );
        const isGap = (node: Node | null) =>
            node !== null &&
            ((node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim()) ||
                (node instanceof HTMLElement && node.tagName === 'BR'));
        const runs: HTMLElement[][] = [];
        for (const span of spans) {
            let prev = span.previousSibling;
            while (isGap(prev)) prev = prev?.previousSibling ?? null;
            const last = runs.at(-1);
            if (last && prev === last.at(-1)) last.push(span);
            else runs.push([span]);
        }
        for (const run of runs) {
            if (run.length < 2) continue;
            const first = run[0];
            if (!first) continue;
            const entry = entries.find((e) => e.id === first.getAttribute(IMG_ATTR));
            const group = el('span', 'naist-inline-group', { 'data-layout': entry?.display.layout ?? 'grid' });
            first.before(group);
            let node: ChildNode | null = first;
            const end = run.at(-1);
            while (node) {
                const next: ChildNode | null = node === end ? null : node.nextSibling;
                if (node instanceof HTMLElement && node.hasAttribute(IMG_ATTR)) {
                    node.style.removeProperty('width');
                    node.style.removeProperty('float');
                    group.append(node);
                } else {
                    node.remove();
                }
                node = next;
            }
        }
    }

    private async resolveUrl(key: string, path: string): Promise<string> {
        if (key) {
            const cached = this.urls.get(key);
            if (cached) return cached;
            const blob = await getBlob(key);
            if (blob) {
                const url = URL.createObjectURL(blob);
                this.urls.set(key, url);
                return url;
            }
        }
        return path ? encodeURI(path) : '';
    }

    private onVisible(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (entry.isIntersecting) this.load(entry.target as HTMLImageElement);
        }
    }

    async run(messageId: number, imageId: string, task: () => Promise<unknown>): Promise<void> {
        if (this.busy.has(imageId)) return;
        this.busy.add(imageId);
        document.querySelectorAll(`[${IMG_ATTR}="${imageId}"]`).forEach((s) => s.classList.add('naist-inline-busy'));
        try {
            await task();
        } catch (error) {
            reportGenerationError(error);
        } finally {
            this.busy.delete(imageId);
            this.refreshMessage(messageId);
        }
    }

    private async onClick(event: Event): Promise<void> {
        const target = event.target as HTMLElement;
        const retryImage = target.closest<HTMLElement>('img[data-naist-retry]');
        if (retryImage) {
            event.preventDefault();
            event.stopPropagation();
            const messageId = messageIdOf(retryImage);
            if (messageId !== null) await this.markers?.retry(messageId, retryImage.dataset.naistRetry ?? '');
            return;
        }
        const span = target.closest<HTMLElement>(`[${IMG_ATTR}][${MOUNTED_ATTR}]`);
        if (!span) return;
        const messageId = messageIdOf(span);
        const imageId = span.getAttribute(IMG_ATTR) ?? '';
        if (messageId === null || !imageId) return;
        const action =
            target.closest<HTMLElement>('[data-naist-action]')?.dataset.naistAction ??
            (target.classList.contains('naist-inline-img') ? 'lightbox' : '');
        if (!action) return;
        event.preventDefault();
        event.stopPropagation();
        const entry = this.service.entries(messageId).find((e) => e.id === imageId);
        switch (action) {
            case 'reveal':
                span.querySelector('.naist-inline-frame')?.classList.remove('naist-inline-spoiler');
                target.closest('.naist-inline-cover')?.remove();
                return;
            case 'show-chat':
                await this.setChatHidden(false);
                return;
            case 'marker-retry':
                await this.markers?.retry(messageId, imageId);
                return;
            case 'prev':
            case 'next':
                if (entry)
                    await this.service.setActive(messageId, imageId, entry.activeSwipe + (action === 'next' ? 1 : -1));
                return;
            case 'regenerate':
                return await this.run(messageId, imageId, () => this.service.regenerate(messageId, imageId));
            case 'variation':
                return await this.run(messageId, imageId, () => this.service.variation(messageId, imageId));
            case 'edit':
                return this.ui.edit(messageId, imageId);
            case 'display':
                return this.ui.display(messageId, imageId);
            case 'tools':
                return this.ui.tools(messageId, imageId);
            case 'lightbox':
                return this.ui.lightbox(messageId, imageId);
            case 'delete': {
                if (!(await this.ui.confirmDelete())) return;
                const multi = (entry?.swipes.length ?? 0) > 1;
                return await this.run(messageId, imageId, () =>
                    multi ? this.service.deleteSwipe(messageId, imageId) : this.service.remove(messageId, imageId),
                );
            }
        }
    }

    async setChatHidden(hidden: boolean): Promise<void> {
        const c = ctx();
        const meta = (c.chatMetadata.nai_studio ??= {}) as { inlineHidden?: boolean };
        meta.inlineHidden = hidden;
        await c.saveMetadata();
        this.applyVisibility();
    }

    isChatHidden(): boolean {
        return (ctx().chatMetadata?.nai_studio as { inlineHidden?: boolean } | undefined)?.inlineHidden === true;
    }

    // ---- drag & drop ----------------------------------------------------------------------------

    private onDragStart(event: DragEvent): void {
        const frame = (event.target as HTMLElement).closest?.('.naist-inline-frame');
        const span = frame?.closest<HTMLElement>(`[${IMG_ATTR}]`);
        if (!span || !event.dataTransfer) return;
        const messageId = messageIdOf(span);
        if (messageId === null) return;
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ messageId, imageId: span.getAttribute(IMG_ATTR) }));
        event.dataTransfer.effectAllowed = 'move';
        span.classList.add('naist-inline-dragging');
    }

    private dropTarget(event: DragEvent): { messageId: number; beforeId: string | null; element: Element } | null {
        const target = event.target as HTMLElement;
        const span = target.closest?.<HTMLElement>(`[${IMG_ATTR}][${MOUNTED_ATTR}]`);
        const text = target.closest?.('.mes_text');
        const element = span ?? text;
        if (!element) return null;
        const messageId = messageIdOf(element);
        if (messageId === null) return null;
        return { messageId, beforeId: span?.getAttribute(IMG_ATTR) ?? null, element };
    }

    private onDragOver(event: DragEvent): void {
        if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
        const drop = this.dropTarget(event);
        if (!drop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        this.clearDropMarks();
        drop.element.classList.add('naist-inline-drop');
    }

    private clearDropMarks(): void {
        document.querySelectorAll('.naist-inline-drop, .naist-inline-dragging').forEach((n) => {
            n.classList.remove('naist-inline-drop', 'naist-inline-dragging');
        });
    }

    private async onDrop(event: DragEvent): Promise<void> {
        const raw = event.dataTransfer?.getData(DRAG_TYPE);
        this.clearDropMarks();
        if (!raw) return;
        const drop = this.dropTarget(event);
        if (!drop) return;
        event.preventDefault();
        const source = JSON.parse(raw) as { messageId: number; imageId: string };
        if (source.imageId === drop.beforeId) return;
        try {
            await this.service.move(source.messageId, source.imageId, drop.messageId, drop.beforeId);
        } catch (error) {
            reportGenerationError(error);
        }
    }

    /** Diagnostics for the console: NAIST_inlineDebug(). */
    debugState(): Record<string, unknown> {
        return {
            waiting: this.waiting.size,
            cachedUrls: this.urls.size,
            pending: this.pending.size,
            busy: [...this.busy],
            lazyTimer: this.lazyTimer !== null,
        };
    }

    /** Object URL or file path for a swipe (lightbox, gallery compare). */
    async urlFor(swipe: InlineSwipe): Promise<string> {
        return await this.resolveUrl(swipe.blobKey, swipe.filePath);
    }
}
