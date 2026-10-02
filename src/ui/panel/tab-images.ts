// "Images" tab (TZ Phase 3): inline image defaults, chat visibility and reading mode, gallery,
// PNG metadata (strip on save, import parameters from a NovelAI PNG/WebP).
import { localize, t } from '../../core/i18n';
import { reportGenerationError } from '../../core/notify';
import { settings } from '../../core/settings';
import { applyImportedParams, readImportedParams } from '../../features/images/png-io';
import { bindSettings, readFromSettings } from '../components/bind';
import { $id, render } from '../components/dom';
import template from '../templates/tab-images.html?raw';

export interface ImageActions {
    openGallery(): void;
    setVisibility(state: 'show' | 'hide' | 'reading-on' | 'reading-off'): Promise<void> | void;
    chatHidden(): boolean;
}

/** Reads NovelAI parameters from a dropped or chosen file and fills the panel. */
export async function importPngFile(file: Blob): Promise<void> {
    try {
        const params = await readImportedParams(file);
        if (!params) {
            toastr.warning(t('naist.images.importNone'));
            return;
        }
        const applied = applyImportedParams(params);
        toastr.success(t('naist.images.importDone', { count: applied.length, model: params.model ?? '—' }));
    } catch (error) {
        reportGenerationError(error);
    }
}

export class ImagesTab {
    private root!: HTMLElement;

    constructor(private readonly actions: ImageActions) {}

    mount(container: HTMLElement): void {
        container.innerHTML = render(template);
        this.root = container;
        localize(container);
        bindSettings(container);
        const file = $id<HTMLInputElement>(container, 'naist_img_import_file');
        $id(container, 'naist_img_import').addEventListener('click', () => file.click());
        file.addEventListener('change', () => {
            const chosen = file.files?.[0];
            file.value = '';
            if (chosen) void importPngFile(chosen);
        });
        $id(container, 'naist_img_open_gallery').addEventListener('click', () => this.actions.openGallery());
        $id(container, 'naist_img_toggle_chat').addEventListener('click', () => {
            void Promise.resolve(this.actions.setVisibility(this.actions.chatHidden() ? 'show' : 'hide')).then(() =>
                this.refresh(),
            );
        });
        $id<HTMLInputElement>(container, 'naist_img_reading').addEventListener('change', (event) => {
            const on = (event.target as HTMLInputElement).checked;
            void Promise.resolve(this.actions.setVisibility(on ? 'reading-on' : 'reading-off'));
        });
        this.refresh();
    }

    refresh(): void {
        if (!this.root) return;
        readFromSettings(this.root);
        $id(this.root, 'naist_img_toggle_chat').textContent = t(
            this.actions.chatHidden() ? 'naist.images.showChat' : 'naist.images.hideChat',
        );
        $id<HTMLInputElement>(this.root, 'naist_img_reading').checked = settings().inline.readingMode;
    }
}
