# Bundled GNOME symbolic icons

The bundled icons are by GNOME contributors and come from the
[GNOME Icon Development Kit](https://gitlab.gnome.org/Teams/Design/icon-development-kit),
revision `dcd904f52cf1c49fa8c1ca39ff1f3c2d96759193`, file `src/icons.svg`.
They use the CC0 1.0 Universal dedication; see [COPYING-CC0.txt](COPYING-CC0.txt).

The icons were exported from the original 16 px monochrome artwork. Shapes and
transforms are preserved, editor metadata is removed, and each icon has its own
viewport. Filenames use the `resource-monitor-` prefix to avoid theme conflicts.

Invisible canvas rectangles were removed because symbolic recoloring can
replace `fill:none` and obscure the artwork. The `hicolor/scalable/actions`
layout allows GTK to recognize and recolor the symbolic icons.

## Source artwork

Each entry identifies the bundled file and its source group in `src/icons.svg`.

- `resource-monitor-cpu-symbolic.svg`: `processor` (group `g5609`).
- `resource-monitor-ram-symbolic.svg`: `memory` (group `g7112`).
- `resource-monitor-swap-symbolic.svg`: `vertical-arrows` (group `g23`).
- `resource-monitor-disk-stats-symbolic.svg`: `harddisk` (group `g3943`).
- `resource-monitor-disk-space-symbolic.svg`: `harddisk` (group `g3943`).
- `resource-monitor-eth-symbolic.svg`: `network-computer` (group `g386`).
- `resource-monitor-wlan-symbolic.svg`: `radiowaves-1` (group `g325107`).
- `resource-monitor-gpu-symbolic.svg`: `display` (group `g3781-5`).
- `resource-monitor-global-symbolic.svg`: `settings` (group `g15931`).
- `resource-monitor-network-symbolic.svg`: `network-workgroup` (group `g33661`).
- `resource-monitor-thermal-symbolic.svg`: `thermometer` (group `g7653`).
- `resource-monitor-add-symbolic.svg`: `plus` (group `g31988`).
- `resource-monitor-delete-symbolic.svg`: `user-trash` (group `g40070`).
- `resource-monitor-up-symbolic.svg`: `arrow1-up` (group `g7540`).
- `resource-monitor-down-symbolic.svg`: `arrow1-down` (group `g7550`).
