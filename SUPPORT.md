# Support

## Before reporting a problem

1. Check that the installed release supports the GNOME Shell version in use. See [Compatibility](README.md#compatibility) for this branch.
2. Check for an extension update and search [existing issues](https://github.com/0ry0n/Resource_Monitor/issues).
3. Note whether the problem occurs with Dash to Panel or other extensions enabled.

GPU and temperature readings depend on the hardware and drivers. NVIDIA readings require `nvidia-smi`; AMD and Intel readings use the metrics exposed by the driver in sysfs.

## Bug reports

Open a [bug report](https://github.com/0ry0n/Resource_Monitor/issues/new?template=bug_report.md) and include:

- Resource Monitor and GNOME Shell versions
- Distribution and version
- Session type: Wayland or X11
- Installation source: GNOME Extensions, GitHub release or local build
- Steps to reproduce the problem
- Expected and actual behavior
- Relevant logs or screenshots

Report security vulnerabilities privately as described in [Security](SECURITY.md).

## Logs

To inspect the extension in Looking Glass, press `Alt+F2`, enter `lg`, and open the Extensions tab.

To read GNOME Shell logs from the current session:

```bash
journalctl --user -b _COMM=gnome-shell
```

Include the entries around the time of the problem. Remove personal information before sharing logs.
