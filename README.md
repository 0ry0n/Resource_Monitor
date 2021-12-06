# Resource_Monitor
Resource_Monitor is a GNOME Shell extension that Monitor the use of system resources like cpu, ram, disk, network and display them in GNOME shell top bar.

# Screenshots
![](/main.png)

# GNOME Shell versions supported
**40, 41**

# How-To Install
## Download
You can get this extension:

- From [GNOME Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/).
- Downloading the latest [Release](/releases/latest) released on GitHub.
- Cloning the [gnome-40.0](https://github.com/0ry0n/Resource_Monitor/tree/gnome-40.0) branch.
## Install
### Using the latest release
1. Unzip the file `Resource_Monitor-x.zip`.
2. Open `Resource_Monitor-x` folder.
3. Move `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
4. Activate the extensions with Gnome Extensions.

For example...
```
unzip Resource_Monitor-x.zip
cd Resource_Monitor-x
mv Resource_Monitor@Ory0n ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```

### Cloning the branch
1. Clone the gnome-40.0 branch.
2. Open `Resource_Monitor` folder.
3. Move `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
4. Activate the extensions with Gnome Extensions.

For example...
```
git clone -b gnome-40.0 https://github.com/0ry0n/Resource_Monitor
cd Resource_Monitor
mv Resource_Monitor@Ory0n ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```
Might require a Gnome restart. Press `ALT+F2` and type `r` and hit enter.

# Preferences
![](/settings.png)

![](/system-monitor.png)

# Bug Reporting
Use the GitHub [Issues](https://github.com/0ry0n/Resource_Monitor/issues) tracker to report issues or ask for features.

# Change Log
**version 16 (Apr 26, 2021)**
- Added bps network unit.
- Bug fixed.

**version 15 (Apr 15, 2021)**
- Added support for gnome 40.0.
- New preferences window.
- Deprecated GTK elements removed from pref.js.

# Authors
- **Giuseppe Silvestro** - *Initial work* - [0ry0n](https://github.com/0ry0n)

# License
This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](/LICENSE) file for details.
