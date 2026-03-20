[ego]: https://extensions.gnome.org/extension/1634/resource-monitor/

# Resource Monitor (GNOME Shell Extension) [<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="right">][ego]

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

Resource Monitor is a GNOME Shell extension that shows live system metrics directly in the top bar.

It can display CPU load and temperature, RAM and swap usage, disk activity and free space, GPU usage and temperature, and network traffic.

Multi-panel mode is supported through Dash to Panel. Without Dash to Panel, the indicator is shown on the primary panel only.

Current stable release: `27` (`2026-03-20`).

![Resource Monitor main view](images/main.png)

## Supported GNOME Shell Versions

- `45`, `46`, `47`, `48`, `49`, `50`

For older releases, use the dedicated maintenance branches:

- [gnome-3.28-3.38](../../tree/gnome-3.28-3.38)
- [gnome-40-44](../../tree/gnome-40-44)

## Installation

### GNOME Extensions (recommended)

Install from [extensions.gnome.org](https://extensions.gnome.org/extension/1634/resource-monitor/).

### Manual installation from GitHub release

1. Download the latest [GitHub release](../../releases/latest).
2. Extract `Resource_Monitor@Ory0n.zip`.
3. Move `Resource_Monitor@Ory0n` to `~/.local/share/gnome-shell/extensions/`.
4. Enable the extension from the GNOME Extensions app.

## Development

Common local tasks:

- `make schema` compiles GSettings schemas.
- `make test` runs runtime smoke tests.
- `make pot` regenerates `po/Resource_Monitor@Ory0n.pot`.
- `make po-update` updates translations from the template.
- `make validate` runs schema, tests, POT refresh, and PO checks.
- `make package` builds `build/Resource_Monitor@Ory0n.zip`.
- `make install` installs into `~/.local/share/gnome-shell/extensions/`.

## Project Documentation

- [Contributing guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Support](SUPPORT.md)
- [Security policy](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)

## Reporting Bugs

Use [GitHub Issues](../../issues) and choose the bug template.
Please include GNOME Shell version, distribution, clear reproduction steps, and logs when available.

## License

GPL-3.0. See [LICENSE](LICENSE).
