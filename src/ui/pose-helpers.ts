// Localized pose names and the pose <select> (library + custom presets, favorites first).
import { t } from '../core/i18n';
import { settings } from '../core/settings';
import { POSE_CATEGORIES } from '../domain';
import { poseLibrary } from '../features/scene/scene-service';
import { escapeHtml } from './components/dom';

export function poseLabel(id: string): string {
    const custom = settings().poses.custom.find((p) => p.id === id);
    if (custom) return custom.name || custom.tags;
    return t(`naist.pose.${id}`);
}

/** Grouped options: favorites, then each category; custom poses keep their own names. */
export function poseSelectOptions(current: string, emptyKey = 'naist.passport.noPose'): string {
    const library = poseLibrary();
    const favorites = settings().poses.favorites;
    const option = (id: string) =>
        `<option value="${escapeHtml(id)}"${id === current ? ' selected' : ''}>${escapeHtml(poseLabel(id))}</option>`;
    const groups: string[] = [`<option value="">${escapeHtml(t(emptyKey))}</option>`];
    const favs = library.filter((p) => favorites.includes(p.id));
    if (favs.length) {
        groups.push(
            `<optgroup label="★ ${escapeHtml(t('naist.pose.favorites'))}">${favs.map((p) => option(p.id)).join('')}</optgroup>`,
        );
    }
    for (const category of POSE_CATEGORIES) {
        const list = library.filter((p) => p.category === category);
        if (list.length) {
            groups.push(
                `<optgroup label="${escapeHtml(t(`naist.poseCat.${category}`))}">${list.map((p) => option(p.id)).join('')}</optgroup>`,
            );
        }
    }
    return groups.join('');
}
