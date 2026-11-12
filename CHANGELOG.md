# Changelog

Notable changes to Resource Monitor are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Releases use integer version names and do not follow Semantic Versioning. GNOME Extensions assigns submission version numbers separately.

## [Unreleased]

## [30] - 2026-11-12

### Changed

- Replaced the custom translation script with GNU gettext commands.
- Made the latest official PyPI release of Shexli the only automated check in the validation and release workflows.
- Standardized documentation, interface wording and translations.
- Kept the Resource Monitor name unchanged in all translations.

### Removed

- Removed the smoke tests and custom translation script.

### Fixed

- Corrected the ZIP layout, included the GPL license and excluded compiled schemas.
- Made GPU discovery and mounted filesystem reads asynchronous and cancellable.
- Stopped monitoring subprocesses on cancellation and removed the pending preferences callback when the window closes.
- Released the cached NetworkManager import when disabling the extension.

## [29] - 2026-11-06

### Added

- GNOME Shell 51 support.
- Simplified Chinese translation (`zh_CN` locale).

### Changed

- Unified panel and preferences icons using bundled GNOME symbolic artwork.

### Fixed

- Prevented asynchronous callbacks from updating destroyed indicators, including after NetworkManager cancellation (#135).
- Restored preferences icons on systems without the corresponding theme icons (#141).
- Removed invisible SVG canvas rectangles that became solid squares during panel icon recoloring.

## [28] - 2026-05-13

### Added

- Decimal places and rounding controls for all indicators.

### Changed

- Refined wording across preferences, schema metadata, and translation templates for a more consistent UI.
- Simplified modern GNOME/GTK/GJS code paths by removing obsolete compatibility fallbacks.
- Refactored panel group visibility and retrieval logic for easier maintenance.

### Fixed

- Indicator click handling on GNOME Shell 50.
- Empty monitor groups no longer leave unused spacing in the panel.
- Icon-less panel layouts no longer introduce alignment and spacing issues.
- GPU icon visibility now matches the actual set of visible GPU metrics.

## [27] - 2026-03-20

### Added

- Support for GNOME Shell 50.
- Support for AMD and Intel GPU monitoring via sysfs.
- Multi-panel display mode with Dash to Panel integration.
- A choice of dot, slash or brackets to separate secondary metrics.
- Translation support using gettext catalogs and compiled translations in release packages.
- Italian translation (`it` locale).

### Changed

- Refactored the codebase into modular `runtime/`, `services/`, `panel/`, and `prefs/` layers.
- Migrated preferences to native GTK 4 and libadwaita pages and models.
- Aligned extension metadata and GSettings schema naming with GNOME extension conventions.
- Refreshed symbolic icons and modernized repository tooling (validation, packaging, translations).

### Removed

- Older compatibility paths.
- Older `prefs.ui` file after migration to code-built preferences.

### Fixed

- Corrected network unit selection when displaying bits per second.
- Disk device naming instability across reboots by introducing stable identifiers.
- Additional stability and regression fixes during the refactor series.

## [26] - 2025-09-11

### Added

- Option to show the device name in disk statistics.
- Support for GNOME Shell 48 and 49.

### Fixed

- Multiple bug fixes.

## [25] - 2024-11-05

### Changed

- Internal code cleanup.

### Fixed

- Multiple bug fixes.

## [24] - 2024-10-28

### Added

- Custom device names.

### Changed

- Adjusted indicator widths to match the display scale.
- Improved the preferences interface.

### Removed

- Deprecated `TreeView` component.

### Fixed

- Multiple bug fixes.

## [23] - 2024-10-18

### Added

- Support for GNOME Shell 47.
- RAM and swap memory alerts.
- CPU frequency monitoring using the highest core frequency.
- Color customization for all metrics.
- Zenpower thermal sensor support.

### Fixed

- CPU temperature reading issues.
- Multiple bug fixes.

## [22] - 2024-06-03

### Added

- Support for GNOME Shell 46 (contribution by @DanielusG).

## [21] - 2024-01-03

### Added

- Support for GNOME Shell 45.

### Fixed

- Corrected the behavior of custom commands launched with a left-click.
- Multiple bug fixes.

[Unreleased]: https://github.com/0ry0n/Resource_Monitor/compare/30...develop
[30]: https://github.com/0ry0n/Resource_Monitor/compare/29...30
[29]: https://github.com/0ry0n/Resource_Monitor/compare/28...29
[28]: https://github.com/0ry0n/Resource_Monitor/compare/27...28
[27]: https://github.com/0ry0n/Resource_Monitor/compare/26...27
[26]: https://github.com/0ry0n/Resource_Monitor/compare/25...26
[25]: https://github.com/0ry0n/Resource_Monitor/compare/24...25
[24]: https://github.com/0ry0n/Resource_Monitor/compare/23...24
[23]: https://github.com/0ry0n/Resource_Monitor/compare/22...23
[22]: https://github.com/0ry0n/Resource_Monitor/compare/21...22
[21]: https://github.com/0ry0n/Resource_Monitor/compare/19...21
