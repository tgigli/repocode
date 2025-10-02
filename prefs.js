import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class RepoCodePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Repository Settings',
            description: 'Configure where to search for repositories and how to open them',
        });
        page.add(group);

        // Repository Directory
        const repoPathRow = new Adw.ActionRow({
            title: 'Repository Directory',
            subtitle: 'Path where to search for Git repositories',
        });
        group.add(repoPathRow);

        const repoPathEntry = new Gtk.Entry({
            text: settings.get_string('repo-path'),
            placeholder_text: GLib.get_home_dir(),
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });

        repoPathEntry.connect('changed', () => {
            settings.set_string('repo-path', repoPathEntry.get_text());
        });

        const repoPathButton = new Gtk.Button({
            icon_name: 'document-open-symbolic',
            valign: Gtk.Align.CENTER,
        });

        repoPathButton.connect('clicked', () => {
            const dialog = new Gtk.FileChooserDialog({
                title: 'Select Repository Directory',
                action: Gtk.FileChooserAction.SELECT_FOLDER,
                transient_for: window,
                modal: true,
            });

            dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
            dialog.add_button('Select', Gtk.ResponseType.ACCEPT);

            dialog.connect('response', (dialog, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                    const file = dialog.get_file();
                    const path = file.get_path();
                    repoPathEntry.set_text(path);
                    settings.set_string('repo-path', path);
                }
                dialog.destroy();
            });

            dialog.show();
        });

        const repoPathBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            valign: Gtk.Align.CENTER,
        });
        repoPathBox.append(repoPathEntry);
        repoPathBox.append(repoPathButton);

        repoPathRow.add_suffix(repoPathBox);

        // Open Command
        const commandRow = new Adw.ActionRow({
            title: 'Open Command',
            subtitle: 'Command to open repositories (use {path} as placeholder)',
        });
        group.add(commandRow);

        const commandEntry = new Gtk.Entry({
            text: settings.get_string('open-command'),
            placeholder_text: 'code {path}',
            valign: Gtk.Align.CENTER,
            hexpand: true,
            width_chars: 30,
        });

        commandEntry.connect('changed', () => {
            settings.set_string('open-command', commandEntry.get_text());
        });

        commandRow.add_suffix(commandEntry);

        // Example commands group
        const examplesGroup = new Adw.PreferencesGroup({
            title: 'Command Examples',
            description: 'Common commands for opening repositories',
        });
        page.add(examplesGroup);

        const examples = [
            {title: 'Visual Studio Code', command: 'code {path}'},
            {title: 'VSCodium', command: 'codium {path}'},
            {title: 'IntelliJ IDEA', command: 'idea {path}'},
            {title: 'Sublime Text', command: 'subl {path}'},
            {title: 'Atom', command: 'atom {path}'},
        ];

        examples.forEach(example => {
            const row = new Adw.ActionRow({
                title: example.title,
                subtitle: example.command,
            });

            const applyButton = new Gtk.Button({
                label: 'Use',
                valign: Gtk.Align.CENTER,
                css_classes: ['suggested-action'],
            });

            applyButton.connect('clicked', () => {
                commandEntry.set_text(example.command);
                settings.set_string('open-command', example.command);
            });

            row.add_suffix(applyButton);
            examplesGroup.add(row);
        });
    }
}
