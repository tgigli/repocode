# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RepoCode is a GNOME Shell extension that provides a quick repository selector with fuzzy search. It's distributed via [extensions.gnome.org](https://extensions.gnome.org/extension/8654/repocode/).

## Development Commands

### Local Installation & Testing
```bash
# Install extension locally (from repository root)
cp -r * ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/

# Compile GSettings schemas (required after schema changes)
glib-compile-schemas ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/schemas/

# Enable/disable extension
gnome-extensions enable repocode@gigli.com.br
gnome-extensions disable repocode@gigli.com.br

# Reload GNOME Shell to apply changes
# X11: Alt+F2, type 'r', press Enter
# Wayland: Log out and log back in

# View extension logs
journalctl --user -b 0 -g "repocode"
```

### Release Process
```bash
# Create and push a new version tag
git tag v1.0.X
git push origin v1.0.X

# GitHub Actions will automatically:
# 1. Update metadata.json version field (extracts major version from tag)
# 2. Build a ZIP file with all necessary files
# 3. Create a GitHub release with auto-generated release notes
```

## Architecture

### Core Components

**extension.js**
- `RepoItem` - Individual repository list item with three action buttons:
  - Label click: Opens in configured editor
  - Folder button: Opens file manager via `xdg-open`
  - Terminal button: Opens `gnome-terminal` in repo directory
- `RepoIndicator` - Main panel button with popup menu containing:
  - Search entry with real-time fuzzy filtering
  - Scrollable repository list
  - Async repository loading using `Gio.Subprocess` (finds `.git` directories)
- `RepoCodeExtension` - Extension lifecycle management (enable/disable)

**prefs.js**
- `RepoCodePreferences` - Preferences window using Adwaita widgets
- Two configurable settings with file picker for repository path
- Pre-populated examples for common editors (VSCode, VSCodium, IntelliJ, etc.)

**schemas/org.gnome.shell.extensions.repocode.gschema.xml**
- GSettings schema defining:
  - `repo-path` (string): Directory to search for Git repositories (default: user's home directory)
  - `open-command` (string): Command template with `{path}` placeholder (default: `code {path}`)

### Fuzzy Search Algorithm

The `_fuzzyMatch()` method implements fzf-style matching:
- Characters must match in order but not necessarily consecutive
- Consecutive matches score higher (cumulative bonus)
- Results sorted by score descending (higher score = better match)
- Returns `null` if pattern doesn't fully match

### Signal Management

The extension properly manages signal lifecycle to prevent memory leaks:
- All signal handlers stored in `_signalHandlers` array
- All disconnected in `destroy()` method
- Critical for GNOME Shell extensions that can be enabled/disabled without restart

## Important Implementation Details

### Icon Handling
- Icon path: `icons/repocode-ico.png`
- Loaded via `Gio.FileIcon` from extension directory
- Must be included in release ZIP

### Default Settings
- Repository path defaults to `GLib.get_home_dir()` (user's home directory)
- Do not hardcode specific paths - extension is distributed to multiple users
- Settings persist via GSettings and survive extension restarts

### Async Repository Loading
- Uses `Gio.Subprocess` with async callbacks instead of sync `spawn_command_line_sync`
- Prevents blocking GNOME Shell during repository search
- Command: `find <repo-path> -type d -name .git`
- Filters out hidden directories (those containing `/.`)

### Keyboard Shortcuts
- Enter: Activates first visible repository item
- Escape: Closes menu
- Search entry automatically focused when menu opens

## GNOME Shell Compatibility

- Supports GNOME Shell 45+
- Uses ES6 modules (`import` syntax, not old `imports` system)
- Must use GObject.registerClass() for custom classes
- Must handle both X11 and Wayland environments
