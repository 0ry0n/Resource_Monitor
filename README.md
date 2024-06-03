[ego]: https://extensions.gnome.org/extension/1634/resource-monitor/

# Resource_Monitor GNOME Shell Extension [<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="right">][ego]
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)

Resource_Monitor is a GNOME Shell extension designed to monitor system resources such as CPU, RAM, disk, and network usage, displaying them in the GNOME Shell top bar.

| Main View           |
| ------------------- |
| ![Main View](/images/main.png) |

## GNOME Shell versions supported
**45**
- For older GNOME versions see the [gnome-3.28-3.38](../../tree/gnome-3.28-3.38) or [gnome-40-44](../../tree/gnome-40-44) branch.

## How-To Install

### From GNOME Extensions

- Visit [GNOME Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/) and install from there.

### Using the Latest Release

1. Download the latest [Release](../../releases/latest) from GitHub.
2. Unzip `Resource_Monitor@Ory0n.zip`.
3. Move the `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/`.
4. Activate the extension using GNOME Extensions.

## Preferences

| Global Preferences | CPU Preferences | RAM Preferences |
| ------------------- | --------------- | --------------- |
| ![Global Preferences](/images/global.png) | ![CPU Preferences](/images/cpu.png) | ![RAM Preferences](/images/ram.png) |

| SWAP Preferences | DISK Preferences | NET Preferences |
| ------------------- | ------------------- | ------------------- |
| ![SWAP Preferences](/images/swap.png) | ![DISK Preferences](/images/disk.png) | ![NET Preferences](/images/net.png) |

| THERMAL Preferences | GPU Preferences |
| ------------------- | ------------------- |
| ![THERMAL Preferences](/images/thermal.png) | ![GPU Preferences](/images/gpu.png) |

## About Units

The units displayed in Resource_Monitor are in K, M, ... (powers of 1024), or KB, MB, ... (powers of 1000).

## Bug Reporting

To report issues or request features, please use the [GitHub Issues](../../issues) tracker. Include relevant details to help us understand and address the problem efficiently.

## Change Log

**Version 22 (Jun 3, 2024)**
- Added support for GNOME 46: thanks to @DanielusG.

**Version 21 (Jan 2, 2024)**
- Added support for GNOME 45.
- Fixed left-click custom-program functionality.
- Other bug fixes.

## Authors

- **Giuseppe Silvestro** - *Initial work* - [0ry0n](https://github.com/0ry0n)

## License

This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](/LICENSE) file for details.
