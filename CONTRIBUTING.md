# Contributing

Thanks for helping improve Resource Monitor.

## Ground Rules

- Target branch: `develop`.
- Keep changes focused and small when possible.
- Keep behavior and UI aligned with GNOME conventions.
- Update documentation when behavior changes.

## Local Validation

Run before opening a pull request:

```bash
make validate
```

For translation changes, also run:

```bash
make po-update
```

## GNOME-Oriented Guidelines

- Prefer GNOME platform APIs (`Gio`, `GLib`, `GObject`) over external tools when possible.
- Keep panel text concise and readable.
- Keep preferences consistent with GTK4 and Libadwaita patterns.
- Mark all user-visible strings for gettext.

## Pull Requests

- Use the pull request template.
- Describe motivation and user-facing impact.
- List the GNOME Shell versions you tested.
- Include screenshots for visible UI changes.
