# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Release identifiers (`21`, `22`, ...) follow GNOME Extensions package versions.

## [Unreleased]

### Added

- Decimal precision and step-based rendering controls for all indicators.

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
- Support for AMD and Intel GPU telemetry backends via sysfs.
- Multi-panel display mode with Dash to Panel integration.
- Customizable secondary metric separators (Minimal Dot, Slash, Brackets).
- Multi-language support infrastructure (`gettext` domain/schema alignment, translation catalogs, and packaging workflow).
- Italian translation (`it` locale).

### Changed

- Refactored the codebase into modular `runtime/`, `services/`, `panel/`, and `prefs/` layers.
- Migrated preferences to native GTK4/Libadwaita pages and models.
- Aligned extension metadata and GSettings schema naming with GNOME extension conventions.
- Refreshed symbolic icons and modernized repository tooling (validation, packaging, translations).

### Removed

- Legacy compatibility paths.
- Legacy `prefs.ui` file after migration to code-built preferences.

### Fixed

- Network unit-of-measure selection in bps mode.
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

- Custom peripheral name support.

### Changed

- Adjusted width with scale factor for better sizing.
- Improved preferences UI.

### Removed

- Deprecated `TreeView` component.

### Fixed

- Multiple bug fixes.

## [23] - 2024-10-18

### Added

- Support for GNOME Shell 47.
- RAM and swap memory alerts.
- CPU frequency monitoring based on highest core frequency.
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

- Left-click custom program behavior.
- Multiple bug fixes.

[Unreleased]: https://github.com/0ry0n/Resource_Monitor/compare/27...develop
[27]: https://github.com/0ry0n/Resource_Monitor/compare/26...27
[26]: https://github.com/0ry0n/Resource_Monitor/compare/25...26
[25]: https://github.com/0ry0n/Resource_Monitor/compare/24...25
[24]: https://github.com/0ry0n/Resource_Monitor/compare/23...24
[23]: https://github.com/0ry0n/Resource_Monitor/compare/22...23
[22]: https://github.com/0ry0n/Resource_Monitor/compare/21...22
[21]: https://github.com/0ry0n/Resource_Monitor/compare/19...21
