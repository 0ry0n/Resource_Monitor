# Contributing

Open pull requests against `develop`. Keep changes focused and describe the problem they solve and the resulting behavior.

## Setup

Building the package requires `make`, `zip` and GNU gettext. Validation also requires Python 3.12 or later with virtual environment support, and Shexli.

Install the latest official [Shexli release from PyPI](https://pypi.org/project/shexli/). The validation and release workflows use the same installation command:

```bash
python3 -m venv /tmp/resource-monitor-shexli
/tmp/resource-monitor-shexli/bin/python -m pip install --upgrade --index-url https://pypi.org/simple shexli
```

## Build and validation

| Command | Result |
| --- | --- |
| `make package` | Builds `build/Resource_Monitor@Ory0n.zip` |
| `make validate` | Builds the ZIP and checks it with Shexli |
| `make install` | Builds and installs the ZIP with `gnome-extensions install --force` |
| `make clean` | Removes build output and locally compiled schemas |
| `make pot` | Regenerates the translation template |
| `make po-update` | Regenerates the template and updates the translation catalogs |

If Shexli is installed in the virtual environment above, run:

```bash
make validate SHEXLI=/tmp/resource-monitor-shexli/bin/shexli
```

Shexli is the only automated check. It analyzes the release ZIP and writes its report to `build/shexli.json`. Any finding fails validation. The validation and release workflows run the same check.

The ZIP contains the extension files at its root, schema XML, compiled translations, licenses and icon attribution. Build tools, translation sources and compiled schemas stay outside the package. GNOME Shell compiles schemas during installation.

## GNOME review

Follow the [GNOME Shell extension review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html):

- Create runtime objects, connect signals and schedule callbacks after `enable()`.
- Release those resources in `disable()` and cancel pending work.
- Keep Shell code and preferences code separate.
- Prefer GNOME platform APIs and asynchronous file operations.
- Keep the submitted code readable and include only files needed by the extension and its licenses.

A clean Shexli report does not replace functional testing or the GNOME review. Before submission, verify enable/disable, preferences and resource readings on the GNOME Shell versions declared in `metadata.json`. Include the versions checked and any limitations in the pull request.

## Text and translations

Use concise US English for source text and documentation. Follow the [GNOME writing style](https://developer.gnome.org/hig/guidelines/writing-style.html) for interface text. Use consistent terms such as “preferences”, “Wi-Fi”, “disk activity” and “temperature”. Write “GTK 4” and “libadwaita” in documentation.

Keep the extension name **Resource Monitor** unchanged in every language. Do not mark the name itself for gettext; use a placeholder when including it in a translated message.

Mark other interface strings for gettext. When changing them, run `make po-update`, review the catalogs in `po/`, and update the affected translations. Preserve format placeholders such as `%s` and `%d%%`. Review fuzzy entries before removing their fuzzy flag.

For a new language, add its catalog to `po/` and its locale code to `po/LINGUAS`. Only compiled translations are included in the ZIP.

## Pull requests

Use the pull request template. Describe the user-visible changes, summarize validation, update the documentation and changelog where needed, and include screenshots for visible interface changes.

## Changelog

Follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Add unreleased changes under `Unreleased`, using the applicable `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` or `Security` sections. Omit empty sections and describe the effect of a change for users.

Keep releases in reverse chronological order with `YYYY-MM-DD` dates and comparison links. Releases use integer version names rather than Semantic Versioning. Move unreleased entries into a dated release section when preparing a release.
