// "Replace built-in" tab: status, one-time migration report, disabling/enabling the built-in.
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import { settings } from '../../core/settings';
import {
    disableBuiltIn,
    enableBuiltIn,
    isBuiltInActive,
    needsMigration,
    runMigration,
} from '../../features/takeover/takeover';
import { $id, render } from '../components/dom';
import template from '../templates/tab-takeover.html?raw';

export class TakeoverTab {
    private root!: HTMLElement;

    constructor(private readonly onMigrated: () => void) {}

    mount(container: HTMLElement): void {
        container.innerHTML = render(template);
        this.root = container;
        localize(container);
        $id(container, 'naist_takeover_disable').addEventListener('click', () => void this.disable());
        $id(container, 'naist_takeover_enable').addEventListener('click', () => void this.enable());
        $id(container, 'naist_migration_run').addEventListener('click', () => void this.migrate());
        this.refresh();
    }

    refresh(): void {
        const active = isBuiltInActive();
        $id(this.root, 'naist_takeover_state').textContent = t(
            active ? 'naist.takeover.builtInActive' : 'naist.takeover.builtInDisabled',
        );
        $id(this.root, 'naist_takeover_commands').textContent = t(
            active ? 'naist.takeover.commandsBuiltIn' : 'naist.takeover.commandsOurs',
        );
        $id(this.root, 'naist_takeover_disable').classList.toggle('naist-hidden', !active);
        $id(this.root, 'naist_takeover_enable').classList.toggle('naist-hidden', active);
        const migratedAt = settings().takeover.migratedAt;
        $id(this.root, 'naist_migration_state').textContent = migratedAt
            ? t('naist.takeover.migratedAt', { date: new Date(migratedAt).toLocaleString() })
            : t('naist.takeover.notMigrated');
        $id(this.root, 'naist_migration_run').classList.toggle('naist-hidden', Boolean(migratedAt));
        const report = $id(this.root, 'naist_migration_report');
        report.innerHTML = '';
        for (const line of settings().takeover.migrationReport) {
            const li = document.createElement('li');
            li.textContent = line;
            report.append(li);
        }
    }

    async migrate(): Promise<void> {
        const report = await runMigration();
        this.refresh();
        this.onMigrated();
        await showReport(report);
    }

    private async disable(): Promise<void> {
        const c = ctx();
        const ok = await c.callGenericPopup(t('naist.takeover.disableConfirm'), c.POPUP_TYPE.CONFIRM, '', {
            okButton: t('naist.takeover.disableOk'),
            cancelButton: t('naist.inspector.cancel'),
        });
        if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
        if (needsMigration()) await runMigration();
        await disableBuiltIn();
    }

    private async enable(): Promise<void> {
        const c = ctx();
        const ok = await c.callGenericPopup(t('naist.takeover.enableConfirm'), c.POPUP_TYPE.CONFIRM);
        if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
        await enableBuiltIn();
    }
}

export async function showReport(lines: string[]): Promise<void> {
    const c = ctx();
    const root = document.createElement('div');
    root.innerHTML = `<h3 data-i18n="naist.takeover.reportTitle"></h3><ul class="naist-list naist-report"></ul>`;
    localize(root);
    const list = root.querySelector('ul');
    for (const line of lines) {
        const li = document.createElement('li');
        li.textContent = line;
        list?.append(li);
    }
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', { wide: true });
}
