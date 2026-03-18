[ego]: https://extensions.gnome.org/extension/1634/resource-monitor/

# Resource_Monitor GNOME Shell Extension [<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="right">][ego]

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)

Resource_Monitor is a GNOME Shell extension that provides real-time monitoring of key system resources directly in the GNOME Shell top bar. It tracks CPU usage, load average, and temperature; RAM and swap usage; disk stats and space; GPU usage, memory, and temperature; and network activity for both WLAN and Ethernet connections.

| Main View                      |
| ------------------------------ |
| ![Main View](/images/main.png) |

## GNOME Shell versions supported

**45, 46, 47, 48, 49**

The repository currently declares support only for the GNOME Shell versions that have been explicitly validated in this branch. GNOME Shell 50 is not advertised yet in `metadata.json` and should be added only after verification on a stable release.

- For older GNOME versions see the [gnome-3.28-3.38](../../tree/gnome-3.28-3.38) or [gnome-40-44](../../tree/gnome-40-44) branch.

## How-To Install

### From GNOME Extensions

- Visit [GNOME Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/) and install from there.

### Using the Latest Release

1. Download the latest [Release](../../releases/latest) from GitHub.
2. Unzip `Resource_Monitor@Ory0n.zip`.
3. Move the `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/`.
4. Activate the extension using GNOME Extensions.

## Development

The repository now includes a small maintenance workflow for local development.

- `make schema`
  Compiles the GSettings schema locally.
- `make test`
  Runs runtime smoke tests for parsers and data-format conversions.
- `make pot`
  Regenerates the gettext template at `po/Resource_Monitor@Ory0n.pot`.
- `make po-update`
  Updates language catalogs from the template.
- `make validate`
  Runs schema compilation, runtime smoke tests, gettext template refresh, and translation format checks.
- `make package`
  Builds a distributable zip archive in `build/` including compiled translations.
- `make install`
  Installs the extension into `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n/` including compiled translations.

## Project Conventions

- The extension follows the modern GNOME Shell extension layout with `metadata.json`, `extension.js`, `prefs.js`, GTK4/Libadwaita preferences, and a dedicated GSettings schema.
- The GSettings schema id used by the project is `org.gnome.shell.extensions.resource-monitor`, aligned with GNOME extension conventions.
- User-visible strings are localized through gettext (`gettext-domain` in metadata) with catalogs in `po/` and compiled `.mo` files included at package/install time.
- Supported GNOME Shell versions must stay synchronized between `metadata.json`, release notes, and this README.
- New compatibility claims should only be added after validation on the corresponding stable GNOME Shell release.

## Release Workflow

GitHub Actions now includes:

- `Validate`
  Compiles schemas, runs smoke tests, refreshes gettext template, and validates translation catalogs on pushes and pull requests.
- `Release`
  Builds the extension zip (including compiled translations) on demand and automatically attaches it to GitHub releases for tags matching `v*`.

## Preferences

| Global Preferences                        | CPU Preferences                     | RAM Preferences                     |
| ----------------------------------------- | ----------------------------------- | ----------------------------------- |
| ![Global Preferences](/images/global.png) | ![CPU Preferences](/images/cpu.png) | ![RAM Preferences](/images/ram.png) |

| SWAP Preferences                      | DISK Preferences                      | NET Preferences                     |
| ------------------------------------- | ------------------------------------- | ----------------------------------- |
| ![SWAP Preferences](/images/swap.png) | ![DISK Preferences](/images/disk.png) | ![NET Preferences](/images/net.png) |

| THERMAL Preferences                         | GPU Preferences                     |
| ------------------------------------------- | ----------------------------------- |
| ![THERMAL Preferences](/images/thermal.png) | ![GPU Preferences](/images/gpu.png) |

## About Units

Resource_Monitor supports both data scaling standards:

- SI (`1000`): `KB`, `MB`, `GB`, ...
- IEC (`1024`): `KiB`, `MiB`, `GiB`, ...

You can choose the preferred base in `Preferences -> Global -> Data Unit Base`.

## Runtime Dependencies

- CPU frequency and CPU thermal discovery use direct sysfs access and do not require `bash`.
- Disk space updates in the panel use filesystem queries through Gio instead of calling `df`.
- NVIDIA GPU monitoring still relies on `nvidia-smi`, because that command is the source for the required GPU telemetry on supported systems.

## Bug Reporting

To report issues or request features, please use the [GitHub Issues](../../issues) tracker. Include relevant details to help us understand and address the problem efficiently.

## Change Log

**Version 26 (Sep 11, 2025)**

- Add option to show device name in disk statistics.
- Added support for GNOME 48 and 49.
- Other bug fixes.

**Version 25 (Nov 5, 2024)**

- Cleanup code.
- Other bug fixes.

**Version 24 (Oct 28, 2024)**

- Removed deprecated TreeView component.
- Added custom peripheral name support.
- Adjusted width with scale factor for better sizing.
- Enhanced UI for improved user experience.
- Other bug fixes.

**Version 23 (Oct 18, 2024)**

- Added support for GNOME 47.
- Introduced memory alerts for RAM and SWAP usage to enhance monitoring capabilities.
- Improved CPU frequency monitoring by reading all CPU core frequencies and displaying the highest value.
- Added color coding for all items to enhance visual clarity and differentiation.
- Integrated Zenpower thermal sensors; thanks to @mclvren for the contribution.
- Fixed issues with CPU temperature reading.
- Other bug fixes.

**Version 22 (Jun 3, 2024)**

- Added support for GNOME 46: thanks to @DanielusG.

**Version 21 (Jan 2, 2024)**

- Added support for GNOME 45.
- Fixed left-click custom-program functionality.
- Other bug fixes.

## Authors

- **Giuseppe Silvestro** - _Initial work_ - [0ry0n](https://github.com/0ry0n)

## License

This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](/LICENSE) file for details.
