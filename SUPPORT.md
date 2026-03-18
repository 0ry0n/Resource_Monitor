# Support

## Before Opening an Issue

1. Confirm you are using a supported GNOME Shell version (`45` to `50`).
2. Confirm you are on the latest extension release.
3. Check the existing issues for duplicates.

## Information to Include

- GNOME Shell version
- Linux distribution and version
- Session type (Wayland or X11)
- Extension install source (EGO or manual release zip)
- Reproduction steps
- Expected vs actual behavior

## Useful Diagnostics

- Looking Glass: `Alt+F2`, type `lg`, open the Extensions tab.
- Shell logs:

```bash
journalctl --user -b --grep gnome-shell
```

Attach only the relevant log section for the problem.
