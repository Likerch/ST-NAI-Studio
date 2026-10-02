// Pose library manager (TZ Phase 4): favorites of built-in poses and custom presets
// (name, category, tags, keywords for automatic detection).
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { saveSettings, settings } from '../core/settings';
import { POSE_CATEGORIES, POSES } from '../domain';
import { escapeHtml } from './components/dom';

export async function openPoseLibrary(): Promise<void> {
    const c = ctx();
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-pose-library';
    const poses = settings().poses;

    const render = () => {
        const custom = poses.custom
            .map(
                (p, i) => `<div class="naist-row naist-custom-pose" data-index="${i}">
                <input class="text_pole naist-cp-name" value="${escapeHtml(p.name)}" placeholder="${escapeHtml(t('naist.poseLib.name'))}">
                <select class="text_pole naist-cp-category">${POSE_CATEGORIES.map((cat) => `<option value="${cat}"${cat === p.category ? ' selected' : ''}>${escapeHtml(t(`naist.poseCat.${cat}`))}</option>`).join('')}</select>
                <input class="text_pole naist-grow naist-cp-tags" value="${escapeHtml(p.tags)}" placeholder="${escapeHtml(t('naist.poseLib.tags'))}">
                <input class="text_pole naist-cp-keywords" value="${escapeHtml(p.keywords.join(', '))}" placeholder="${escapeHtml(t('naist.poseLib.keywords'))}">
                <div class="menu_button fa-solid fa-trash-can naist-cp-remove"></div>
            </div>`,
            )
            .join('');
        const library = POSE_CATEGORIES.map((cat) => {
            const list = POSES.filter((p) => p.category === cat)
                .map(
                    (p) =>
                        `<label class="checkbox_label naist-pose-fav" title="${escapeHtml(p.tags)}"><input type="checkbox" data-fav="${p.id}"${poses.favorites.includes(p.id) ? ' checked' : ''}><span>${escapeHtml(t(`naist.pose.${p.id}`))}</span></label>`,
                )
                .join('');
            return `<div class="naist-section"><b>${escapeHtml(t(`naist.poseCat.${cat}`))}</b><div class="naist-flags">${list}</div></div>`;
        }).join('');
        root.innerHTML = `
            <h3>${escapeHtml(t('naist.poseLib.title'))}</h3>
            <div class="naist-hint">${escapeHtml(t('naist.poseLib.favoritesHint'))}</div>
            ${library}
            <div class="naist-section"><b>${escapeHtml(t('naist.poseLib.custom'))}</b>
                <div class="naist-hint">${escapeHtml(t('naist.poseLib.customHint'))}</div>
                ${custom}
                <div class="menu_button naist-cp-add">${escapeHtml(t('naist.poseLib.add'))}</div>
            </div>`;
        localize(root);
    };

    const read = () => {
        root.querySelectorAll<HTMLElement>('.naist-custom-pose').forEach((row) => {
            const pose = poses.custom[Number(row.dataset.index)];
            if (!pose) return;
            pose.name = row.querySelector<HTMLInputElement>('.naist-cp-name')?.value.trim() ?? '';
            pose.category = row.querySelector<HTMLSelectElement>('.naist-cp-category')?.value ?? 'standing';
            pose.tags = row.querySelector<HTMLInputElement>('.naist-cp-tags')?.value.trim() ?? '';
            pose.keywords = (row.querySelector<HTMLInputElement>('.naist-cp-keywords')?.value ?? '')
                .split(',')
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean);
        });
    };

    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        if (el.classList.contains('naist-cp-add')) {
            read();
            poses.custom.push({
                id: `custom-${c.uuidv4().slice(0, 8)}`,
                category: 'standing',
                tags: '',
                keywords: [],
                name: '',
            });
            render();
        } else if (el.classList.contains('naist-cp-remove')) {
            read();
            const index = Number(el.closest<HTMLElement>('.naist-custom-pose')?.dataset.index);
            const [removed] = poses.custom.splice(index, 1);
            if (removed) poses.favorites = poses.favorites.filter((f) => f !== removed.id);
            render();
        }
    });
    root.addEventListener('change', (event) => {
        const el = event.target as HTMLInputElement;
        const id = el.dataset.fav;
        if (!id) return;
        poses.favorites = el.checked ? [...new Set([...poses.favorites, id])] : poses.favorites.filter((f) => f !== id);
    });

    render();
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', {
        wide: true,
        allowVerticalScrolling: true,
        okButton: t('naist.poseLib.done'),
    });
    read();
    poses.custom = poses.custom.filter((p) => p.tags.trim());
    saveSettings();
}
