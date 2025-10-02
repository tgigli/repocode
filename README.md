# RepoCode

Quick repository selector with fuzzy search for GNOME Shell.

![RepoCode Settings](screenshots/settings.png)

## Features

- 🔍 **Fuzzy Search** - Find repositories quickly with fzf-style fuzzy matching
- 💻 **Multiple Actions** - Open in editor, terminal, or file manager
- ⚙️ **Configurable** - Set custom repository directory and editor command
- 🎯 **Fast Access** - Access from top bar with a single click

## Usage

Click the extension icon in the top bar to open the repository selector.

For each repository you can:
- **Click the name** - Opens in your configured editor (VSCode, VSCodium, etc.)
- **Click folder icon** - Opens in file manager
- **Click terminal icon** - Opens terminal in repository directory

## Configuration

Access preferences via Extensions app:
- **Repository Directory** - Path where to search for Git repositories
- **Open Command** - Command to open repositories (use `{path}` as placeholder)

## Installation

### From GNOME Extensions (Recommended)

Install directly from [extensions.gnome.org](https://extensions.gnome.org/extension/8654/repocode/)

### From Release

1. Download the latest release from [Releases](https://github.com/tgigli/repocode/releases)
2. Extract the ZIP file:
   ```bash
   unzip repocode-v*.zip -d ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/
   ```
3. Restart GNOME Shell:
   - X11: Press `Alt+F2`, type `r`, press `Enter`
   - Wayland: Log out and log back in
4. Enable the extension:
   ```bash
   gnome-extensions enable repocode@gigli.com.br
   ```

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/tgigli/repocode.git
   cd repocode
   ```
2. Copy to extensions directory:
   ```bash
   cp -r * ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/
   ```
3. Compile schemas:
   ```bash
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/schemas/
   ```
4. Restart GNOME Shell and enable the extension

## Requirements

- GNOME Shell 45+
- Git repositories to manage

## License

GPL-2.0-or-later
