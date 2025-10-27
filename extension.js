import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

class RepoItem extends PopupMenu.PopupBaseMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(repoName, fullPath, openCommand, menuToClose) {
        super();
        this._repoName = repoName;
        this._fullPath = fullPath;
        this._openCommand = openCommand;
        this._menuToClose = menuToClose;

        const label = new St.Label({
            text: repoName,
            style_class: 'repo-item-label',
            x_expand: true,
        });

        this.add_child(label);

        // Add file manager icon button
        const folderIcon = new St.Icon({
            icon_name: 'folder-symbolic',
            style_class: 'popup-menu-icon',
            icon_size: 16,
        });

        const folderButton = new St.Button({
            child: folderIcon,
            style_class: 'repo-action-button',
            x_align: Clutter.ActorAlign.END,
        });

        folderButton.connect('clicked', () => {
            GLib.spawn_command_line_async(`xdg-open "${this._fullPath}"`);
            if (this._menuToClose) {
                this._menuToClose.close();
            }
        });

        this.add_child(folderButton);

        // Add terminal icon button
        const terminalIcon = new St.Icon({
            icon_name: 'utilities-terminal-symbolic',
            style_class: 'popup-menu-icon',
            icon_size: 16,
        });

        const terminalButton = new St.Button({
            child: terminalIcon,
            style_class: 'repo-action-button',
            x_align: Clutter.ActorAlign.END,
        });

        terminalButton.connect('clicked', () => {
            GLib.spawn_command_line_async(`gnome-terminal --working-directory="${this._fullPath}"`);
            if (this._menuToClose) {
                this._menuToClose.close();
            }
        });

        this.add_child(terminalButton);

        // Add copy path icon button
        const copyIcon = new St.Icon({
            icon_name: 'edit-copy-symbolic',
            style_class: 'popup-menu-icon',
            icon_size: 16,
        });

        const copyButton = new St.Button({
            child: copyIcon,
            style_class: 'repo-action-button',
            x_align: Clutter.ActorAlign.END,
        });

        copyButton.connect('clicked', () => {
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, this._fullPath);
            if (this._menuToClose) {
                this._menuToClose.close();
            }
        });

        this.add_child(copyButton);
    }

    activate(event) {
        super.activate(event);
        // Open with configured editor
        const command = this._openCommand.replace('{path}', `"${this._fullPath}"`);
        GLib.spawn_command_line_async(command);
        if (this._menuToClose) {
            this._menuToClose.close();
        }
    }

    get repoName() {
        return this._repoName;
    }
}

class RepoIndicator extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor(settings, extension) {
        super(0.0, 'Repository Selector');
        this._settings = settings;
        this._extension = extension;

        // Icon in the panel
        const iconFile = this._extension.dir.get_child('icons').get_child('repocode-ico.png');

        const icon = new St.Icon({
            gicon: new Gio.FileIcon({ file: iconFile }),
            style_class: 'system-status-icon',
        });
        this.add_child(icon);

        // Search entry
        this._searchEntry = new St.Entry({
            style_class: 'repo-search-entry',
            can_focus: true,
            hint_text: 'Search repositories...',
            track_hover: true,
            x_expand: true,
        });

        this._searchEntry.clutter_text.set_activatable(false);

        const entryItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            activate: () => { },
        });
        entryItem.add_child(this._searchEntry);
        this.menu.addMenuItem(entryItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Scroll view for repos
        this._scrollView = new St.ScrollView({
            style_class: 'repo-scroll-view',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
        });

        this._repoBox = new St.BoxLayout({
            vertical: true,
            style_class: 'repo-list-box',
        });

        this._scrollView.set_child(this._repoBox);

        const scrollItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });
        scrollItem.add_child(this._scrollView);
        this.menu.addMenuItem(scrollItem);

        // Store all repos
        this._allRepos = [];
        this._repoItems = [];
        this._signalHandlers = [];

        // Connect search
        const textChangedId = this._searchEntry.clutter_text.connect('text-changed', () => {
            this._filterRepos();
        });
        this._signalHandlers.push({ object: this._searchEntry.clutter_text, id: textChangedId });

        const keyPressId = this._searchEntry.clutter_text.connect('key-press-event', (actor, event) => {
            const symbol = event.get_key_symbol();

            // Handle Enter key
            if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
                const visibleItems = this._repoItems.filter(item => item.visible);
                if (visibleItems.length > 0) {
                    visibleItems[0].activate(event);
                    this.menu.close();
                }
                return Clutter.EVENT_STOP;
            }

            // Handle Escape key
            if (symbol === Clutter.KEY_Escape) {
                this.menu.close();
                return Clutter.EVENT_STOP;
            }

            return Clutter.EVENT_PROPAGATE;
        });
        this._signalHandlers.push({ object: this._searchEntry.clutter_text, id: keyPressId });

        // Focus search when menu opens
        const menuOpenId = this.menu.connect('open-state-changed', (menu, open) => {
            if (open) {
                this._searchEntry.set_text('');
                this._loadRepos();
                // Focus after menu is fully opened
                GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                    global.stage.set_key_focus(this._searchEntry.clutter_text);
                    return GLib.SOURCE_REMOVE;
                });
            }
        });
        this._signalHandlers.push({ object: this.menu, id: menuOpenId });

        this._loadRepos();
    }

    _loadRepos() {
        try {
            let reposPath = this._settings.get_string('repo-path');
            if (!reposPath) {
                reposPath = GLib.get_home_dir();
            }

            // Use async subprocess instead of sync spawn
            const proc = Gio.Subprocess.new(
                ['find', reposPath, '-type', 'd', '-name', '.git'],
                Gio.SubprocessFlags.STDOUT_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    const [, stdout] = proc.communicate_utf8_finish(res);

                    if (!stdout || !stdout.trim()) {
                        this._updateRepoList();
                        return;
                    }

                    const gitDirs = stdout.trim().split('\n');
                    this._allRepos = [];

                    gitDirs.forEach(gitDir => {
                        const repoPath = gitDir.replace(/\/\.git$/, '');
                        const repoName = repoPath.replace(reposPath + '/', '');

                        // Skip hidden directories
                        if (repoName.includes('/.')) return;

                        this._allRepos.push({
                            name: repoName,
                            path: repoPath,
                        });
                    });

                    this._allRepos.sort((a, b) => a.name.localeCompare(b.name));
                    this._updateRepoList();

                } catch (e) {
                    logError(e, 'Failed to process repository list');
                }
            });

        } catch (e) {
            logError(e, 'Failed to load repositories');
        }
    }

    _updateRepoList() {
        // Clear existing items
        this._repoItems.forEach(item => item.destroy());
        this._repoItems = [];

        const openCommand = this._settings.get_string('open-command') || 'code {path}';

        // Add all repos
        this._allRepos.forEach(repo => {
            const item = new RepoItem(repo.name, repo.path, openCommand, this.menu);
            this._repoItems.push(item);
            this._repoBox.add_child(item);
        });
    }

    _fuzzyMatch(pattern, text) {
        // Fuzzy matching algorithm like fzf
        pattern = pattern.toLowerCase().replace(/\s+/g, '');  // Remove spaces from pattern
        text = text.toLowerCase();

        let patternIdx = 0;
        let score = 0;
        let consecutiveMatches = 0;
        const matchPositions = [];

        // Try to match each character in pattern
        for (let textIdx = 0; textIdx < text.length && patternIdx < pattern.length; textIdx++) {
            if (pattern[patternIdx] === text[textIdx]) {
                // Bonus for consecutive matches
                score += 1 + consecutiveMatches;
                consecutiveMatches++;
                matchPositions.push(textIdx);
                patternIdx++;
            } else {
                consecutiveMatches = 0;
            }
        }

        // Return null if not all pattern characters matched
        if (patternIdx !== pattern.length) {
            return null;
        }

        // Bonus for matches at word boundaries
        matchPositions.forEach(pos => {
            if (pos === 0 || text[pos - 1] === '-' || text[pos - 1] === '_' || text[pos - 1] === '/') {
                score += 5;
            }
        });

        return score;
    }

    _filterRepos() {
        const searchText = this._searchEntry.get_text();

        if (!searchText) {
            // Show all repos
            this._repoItems.forEach(item => {
                item.visible = true;
            });
            return;
        }

        // Score and filter repos
        const scored = this._repoItems.map(item => ({
            item: item,
            score: this._fuzzyMatch(searchText, item.repoName),
        })).filter(x => x.score !== null);

        // Sort by score (higher is better)
        scored.sort((a, b) => b.score - a.score);

        // Hide non-matching items and reorder visible ones
        this._repoItems.forEach(item => {
            item.visible = false;
        });

        scored.forEach(({ item }) => {
            item.visible = true;
        });
    }

    destroy() {
        // Disconnect all signal handlers
        if (this._signalHandlers) {
            this._signalHandlers.forEach(handler => {
                if (handler.object && handler.id) {
                    handler.object.disconnect(handler.id);
                }
            });
            this._signalHandlers = [];
        }

        // Destroy repo items
        if (this._repoItems) {
            this._repoItems.forEach(item => item.destroy());
            this._repoItems = [];
        }

        super.destroy();
    }
}

export default class RepoCodeExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = new RepoIndicator(this._settings, this);
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._settings = null;
    }
}
