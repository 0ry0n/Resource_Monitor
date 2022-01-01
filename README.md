# Resource_Monitor
Resource_Monitor is a GNOME Shell extension that Monitor the use of system resources like cpu, ram, disk, network and display them in GNOME shell top bar.

# Screenshots
![](/main.png)

# GNOME Shell versions supported
**40, 41**
- For older GNOME versions see the [gnome-3.28-3.38](/tree/gnome-3.28-3.38) branch.

# How-To Install
## Download
You can get this extension:

- From [GNOME Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/).
- Downloading the latest [Release](/releases/latest) released on GitHub.
- Cloning the [master](/tree/master) repository.
## Install
### Using the latest release
1. Unzip the file `Resource_Monitor@Ory0n.zip`.
2. Move `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
3. Activate the extensions with Gnome Extensions.

For example...
```
unzip Resource_Monitor@Ory0n.zip -d ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```

### Cloning the master branch
1. Clone the master branch.
2. Open `Resource_Monitor` folder.
3. Move `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
4. Activate the extensions with Gnome Extensions.

For example...
```
git clone https://github.com/0ry0n/Resource_Monitor
cd Resource_Monitor
mv Resource_Monitor@Ory0n ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```

# Preferences
![](/settings.png)

![](/system-monitor.png)

# Bug Reporting
Use the GitHub [Issues](/issues) tracker to report issues or ask for features.

# Change Log
**version 16 (Jan 1, 2022)**
- Added bps network unit.
- Added extension position.
- Added show or not Prefs when clicking on extension (right click).
- Added new better icons.
- Added cpu frequency: thanks to @xtenduke.
- Added automatic width when setting width to 0.
- Added the ability to choose to monitor used space or free space.
- Added the ability to monitor the temperatures of the selected devices. 
- Bug fixed.

**version 15 (Apr 15, 2021)**
- Added support for gnome 40.
- New preferences window.
- Deprecated GTK elements removed from pref.js.

# Authors
- **Giuseppe Silvestro** - *Initial work* - [0ry0n](https://github.com/0ry0n)

# License
This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](/LICENSE) file for details.
