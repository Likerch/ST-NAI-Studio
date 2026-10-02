// Gallery window (TZ Phase 3): every generation with parameters; search by prompt and tags,
// filters (model, character, chat, dates), favorites, side-by-side comparison, "repeat with a
// change", mass delete that frees space.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { compareMeta, emptyQuery, facets, filterRecords, promptTags } from '../domain';
import type { GalleryQuery, GalleryRecord } from '../domain';
import {
    deleteRecords,
    fullBlob,
    listRecords,
    saveRecord,
    storageUsage,
    thumbBlob,
} from '../features/gallery/gallery-store';
import { escapeHtml } from './components/dom';

export interface GalleryActions {
    open(record: GalleryRecord): void;
    repeat(record: GalleryRecord): Promise<void>;
}

function bytes(n: number): string {
    if (n > 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
    if (n > 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(n / 1024)} KB`;
}

function options(values: string[], current: string, emptyKey: string): string {
    return [
        `<option value="">${escapeHtml(t(emptyKey))}</option>`,
        ...values.map(
            (v) => `<option value="${escapeHtml(v)}"${v === current ? ' selected' : ''}>${escapeHtml(v)}</option>`,
        ),
    ].join('');
}

export async function openGallery(actions: GalleryActions): Promise<void> {
    const c = ctx();
    let records = await listRecords();
    const query: GalleryQuery = emptyQuery();
    const selected = new Set<string>();
    const urls: string[] = [];
    const root = document.createElement('div');
    root.className = 'naist-gallery';

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const img = entry.target as HTMLImageElement;
                observer.unobserve(img);
                const record = records.find((r) => r.id === img.dataset.id);
                if (!record) continue;
                void thumbBlob(record).then((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        urls.push(url);
                        img.src = url;
                    } else if (record.filePath) {
                        img.src = encodeURI(record.filePath);
                    }
                });
            }
        },
        { rootMargin: '300px' },
    );

    const toolbar = () => {
        const f = facets(records);
        return `
        <div class="naist-gallery-toolbar">
            <input class="text_pole naist-g-text" type="search" placeholder="${escapeHtml(t('naist.gallery.search'))}" value="${escapeHtml(query.text)}">
            <select class="text_pole naist-g-model">${options(f.models, query.model, 'naist.gallery.allModels')}</select>
            <select class="text_pole naist-g-character">${options(f.characters, query.character, 'naist.gallery.allCharacters')}</select>
            <select class="text_pole naist-g-chat">${options(f.chats, query.chatId, 'naist.gallery.allChats')}</select>
            <input class="text_pole naist-g-from" type="date" value="${escapeHtml(query.from)}" title="${escapeHtml(t('naist.gallery.from'))}">
            <input class="text_pole naist-g-to" type="date" value="${escapeHtml(query.to)}" title="${escapeHtml(t('naist.gallery.to'))}">
            <select class="text_pole naist-g-sort">
                <option value="newest"${query.sort === 'newest' ? ' selected' : ''}>${escapeHtml(t('naist.gallery.newest'))}</option>
                <option value="oldest"${query.sort === 'oldest' ? ' selected' : ''}>${escapeHtml(t('naist.gallery.oldest'))}</option>
            </select>
            <label class="checkbox_label"><input type="checkbox" class="naist-g-fav"${query.favoritesOnly ? ' checked' : ''}><span>${escapeHtml(t('naist.gallery.favoritesOnly'))}</span></label>
        </div>
        <div class="naist-gallery-actions">
            <span class="naist-muted naist-g-count"></span>
            <div class="menu_button naist-g-all">${escapeHtml(t('naist.gallery.selectAll'))}</div>
            <div class="menu_button naist-g-compare">${escapeHtml(t('naist.gallery.compare'))}</div>
            <div class="menu_button naist-g-delete">${escapeHtml(t('naist.gallery.delete'))}</div>
            <span class="naist-muted naist-g-usage"></span>
        </div>
        <div class="naist-gallery-grid"></div>`;
    };

    const renderGrid = () => {
        const grid = root.querySelector('.naist-gallery-grid');
        if (!grid) return;
        observer.disconnect();
        const list = filterRecords(records, query);
        grid.innerHTML = list
            .map(
                (r) => `
            <div class="naist-g-card${selected.has(r.id) ? ' naist-g-selected' : ''}" data-id="${escapeHtml(r.id)}">
                <img data-id="${escapeHtml(r.id)}" alt="" loading="lazy">
                <div class="naist-g-card-bar">
                    <input type="checkbox" class="naist-g-check"${selected.has(r.id) ? ' checked' : ''}>
                    <i class="fa-solid fa-star naist-g-star${r.favorite ? ' naist-g-fav-on' : ''}" title="${escapeHtml(t('naist.gallery.favorite'))}"></i>
                    <i class="fa-solid fa-repeat naist-g-repeat" title="${escapeHtml(t('naist.gallery.repeat'))}"></i>
                    <span class="naist-muted" title="${escapeHtml(r.meta.scenePrompt)}">${escapeHtml(String(r.meta.seed))}</span>
                </div>
                <div class="naist-g-card-text" title="${escapeHtml(r.meta.scenePrompt)}">${escapeHtml(promptTags(r.meta.scenePrompt).slice(0, 6).join(', '))}</div>
            </div>`,
            )
            .join('');
        grid.querySelectorAll<HTMLImageElement>('img[data-id]').forEach((img) => observer.observe(img));
        const count = root.querySelector('.naist-g-count');
        if (count)
            count.textContent = t('naist.gallery.count', {
                shown: list.length,
                total: records.length,
                selected: selected.size,
            });
    };

    const renderAll = () => {
        root.innerHTML = toolbar();
        renderGrid();
        void storageUsage().then((u) => {
            const el = root.querySelector('.naist-g-usage');
            if (el && u) el.textContent = t('naist.gallery.usage', { used: bytes(u.usage), quota: bytes(u.quota) });
        });
    };

    root.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.classList.contains('naist-g-text')) query.text = target.value;
        else if (target.classList.contains('naist-g-from')) query.from = target.value;
        else if (target.classList.contains('naist-g-to')) query.to = target.value;
        else return;
        renderGrid();
    });
    root.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement & HTMLSelectElement;
        if (target.classList.contains('naist-g-model')) query.model = target.value;
        else if (target.classList.contains('naist-g-character')) query.character = target.value;
        else if (target.classList.contains('naist-g-chat')) query.chatId = target.value;
        else if (target.classList.contains('naist-g-sort'))
            query.sort = target.value === 'oldest' ? 'oldest' : 'newest';
        else if (target.classList.contains('naist-g-fav')) query.favoritesOnly = target.checked;
        else if (target.classList.contains('naist-g-check')) {
            const id = target.closest<HTMLElement>('.naist-g-card')?.dataset.id ?? '';
            if (target.checked) selected.add(id);
            else selected.delete(id);
            target.closest('.naist-g-card')?.classList.toggle('naist-g-selected', target.checked);
            const count = root.querySelector('.naist-g-count');
            if (count)
                count.textContent = t('naist.gallery.count', {
                    shown: filterRecords(records, query).length,
                    total: records.length,
                    selected: selected.size,
                });
            return;
        } else return;
        renderGrid();
    });
    root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const card = target.closest<HTMLElement>('.naist-g-card');
        const record = card ? records.find((r) => r.id === card.dataset.id) : undefined;
        if (target.classList.contains('naist-g-star') && record) {
            record.favorite = !record.favorite;
            target.classList.toggle('naist-g-fav-on', record.favorite);
            void saveRecord(record);
        } else if (target.classList.contains('naist-g-repeat') && record) {
            void actions.repeat(record);
        } else if (target.tagName === 'IMG' && record) {
            actions.open(record);
        } else if (target.classList.contains('naist-g-all')) {
            const list = filterRecords(records, query);
            const all = list.every((r) => selected.has(r.id));
            for (const r of list) {
                if (all) selected.delete(r.id);
                else selected.add(r.id);
            }
            renderGrid();
        } else if (target.classList.contains('naist-g-compare')) {
            const pair = records.filter((r) => selected.has(r.id));
            if (pair.length !== 2) {
                toastr.info(t('naist.gallery.compareHint'));
                return;
            }
            void compare(pair[0]!, pair[1]!);
        } else if (target.classList.contains('naist-g-delete')) {
            const list = records.filter((r) => selected.has(r.id));
            if (!list.length) return;
            void (async () => {
                const box = document.createElement('div');
                box.innerHTML = `<p>${escapeHtml(t('naist.gallery.deleteConfirm', { count: list.length }))}</p>
                    <label class="checkbox_label"><input type="checkbox" class="naist-g-del-files"><span>${escapeHtml(t('naist.gallery.deleteFiles'))}</span></label>`;
                const ok = await c.callGenericPopup(box, c.POPUP_TYPE.CONFIRM);
                if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
                const files = box.querySelector<HTMLInputElement>('.naist-g-del-files')?.checked === true;
                const removed = await deleteRecords(list, files);
                toastr.success(t('naist.gallery.deleted', { count: list.length, files: removed }));
                for (const r of list) selected.delete(r.id);
                records = await listRecords();
                renderAll();
            })();
        }
    });

    renderAll();
    localize(root);
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', { wide: true, large: true, allowVerticalScrolling: true });
    observer.disconnect();
    for (const url of urls) URL.revokeObjectURL(url);
}

async function compare(a: GalleryRecord, b: GalleryRecord): Promise<void> {
    const c = ctx();
    const [blobA, blobB] = await Promise.all([fullBlob(a), fullBlob(b)]);
    const urlA = blobA ? URL.createObjectURL(blobA) : encodeURI(a.filePath);
    const urlB = blobB ? URL.createObjectURL(blobB) : encodeURI(b.filePath);
    const diff = new Set(compareMeta(a.meta, b.meta));
    const keys: (keyof GalleryRecord['meta'])[] = [
        'model',
        'seed',
        'width',
        'height',
        'steps',
        'scale',
        'cfgRescale',
        'sampler',
        'noiseSchedule',
        'ucPreset',
        'qualityPreset',
        'prompt',
        'negativePrompt',
    ];
    const root = document.createElement('div');
    root.className = 'naist-compare';
    root.innerHTML = `
        <div class="naist-compare-images"><img alt="" src="${escapeHtml(urlA)}"><img alt="" src="${escapeHtml(urlB)}"></div>
        <table class="naist-meta-table">${keys
            .map(
                (k) =>
                    `<tr class="${diff.has(k) ? 'naist-compare-diff' : ''}"><th>${escapeHtml(String(k))}</th><td>${escapeHtml(String(a.meta[k]))}</td><td>${escapeHtml(String(b.meta[k]))}</td></tr>`,
            )
            .join('')}</table>`;
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', { wide: true, large: true, allowVerticalScrolling: true });
    if (blobA) URL.revokeObjectURL(urlA);
    if (blobB) URL.revokeObjectURL(urlB);
}
