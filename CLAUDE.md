# Development Notes

This GNOME Shell extension was developed with assistance from Claude Code.

## Extension Structure

- `extension.js` - Main extension code with repository listing and fuzzy search
- `prefs.js` - Preferences window for configuration
- `stylesheet.css` - Custom styling for the extension UI
- `metadata.json` - Extension metadata and compatibility info
- `schemas/` - GSettings schema for configuration persistence

## Key Features

- Fuzzy search algorithm inspired by fzf
- Three action buttons per repository (editor, folder, terminal)
- Configurable repository directory path
- Configurable editor command with `{path}` placeholder
- Real-time search filtering

## GNOME Shell Version Support

- GNOME Shell 45+
- Tested on GNOME Shell 46

## Development Commands

```bash
# Install locally
cp -r . ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/

# Compile schemas
glib-compile-schemas ~/.local/share/gnome-shell/extensions/repocode@gigli.com.br/schemas/

# Enable/disable
gnome-extensions enable repocode@gigli.com.br
gnome-extensions disable repocode@gigli.com.br

# View logs
journalctl --user -b 0 -g "repocode"
```

## Architecture

### RepoItem Class
Individual repository list items with:
- Label for repository name
- Folder button (opens file manager)
- Terminal button (opens terminal in repo directory)
- Click handler for opening in configured editor

### RepoIndicator Class
Main panel button and menu containing:
- Search entry with fuzzy matching
- Scrollable repository list
- Repository loading and filtering logic

### Fuzzy Search Algorithm
Implements character-by-character matching with scoring:
- Consecutive matches score higher
- Pattern must match in order but not necessarily consecutive
- Results sorted by score (higher = better match)

## Configuration

Settings stored in GSettings:
- `repo-path` - Directory to search for Git repositories
- `open-command` - Command template to open repositories

Default values:
- Repository path: `~/ghorg/openinfer`
- Open command: `code {path}`
