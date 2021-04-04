# Resource_Monitor
Resource_Monitor is a GNOME Shell extension that Monitor the use of system resources like cpu, ram, disk, network and display them in GNOME shell top bar.

# Screenshots
![](https://github.com/0ry0n/Resource_Monitor/blob/master/main.png)

# GNOME Shell versions supported
**3.28, 3.30, 3.32, 3.34, 3.36, 3.38**

# How-To Install
## Download
You can get this extension:

- From [GNOME Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/).
- Downloading the latest [Release](https://github.com/0ry0n/Resource_Monitor/releases) released on GitHub.
- Cloning the [Master](https://github.com/0ry0n/Resource_Monitor/tree/master) repository.
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

### Cloning the repository
1. Clone the Master repository.
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
Might require a Gnome restart. Press `ALT+F2` and type `r` and hit enter.

# Preferences
![](https://github.com/0ry0n/Resource_Monitor/blob/master/settings.png)

![](https://github.com/0ry0n/Resource_Monitor/blob/master/system-monitor.png)

# Bug Reporting
Use the GitHub [Issues](https://github.com/0ry0n/Resource_Monitor/issues) tracker to report issues or ask for features.

# Change Log
**version 12 (Apr 4, 2021)**
- Added asynchronous file reading.
- Bug fixed.

**version 11 (Apr 1, 2021)**
- Added new better icons.
- Changed the detection of network devices via signals.
- Added disks space monitoring.
- Added the ability to show multiple disks at the same time.
- Added backward compatibility with gnome 3.28, 3.30
- Added the position of icons.
- Added swap monitoring: thanks to @henrique3g
- Removed deprecated functions.

**version 10 (Nov 21, 2020)**
- Ram fix.
- Added show or not Gnome System Monitor when clicking on extension.

**version 9 (Nov 6, 2020)**
- Added support for gnome 3.38.
- Added Display Decimals function.
- Text Bug fixed.

**version 8 (Apr 6, 2020)**
- Added support for gnome 3.36.
- Added CPU temperature monitoring.
- New graphics for extension preferences.
- Text Bug fixed.

**version 7 (Nov 5, 2019)**
- Added support for gnome 3.34.
- Total restyling of the application.
- Improved graphics.

**version 6 (Jun 5, 2019)**
- Settings Bug fixed.

**version 5 (May 24, 2019)**
- Schema Bug fixed.

**version 4 (May 2, 2019)**
- Network Bugs fixed.

**version 3 (Apr 1, 2019)**
- Bugs fixed.
- Approved on Gnome Extensions.

**version 2 (Feb 5, 2019)**
- Added partitions selection.
- Added custom resizing of fields.

**version 1 (Dec 26, 2018)**
- Initial release.

# Authors
- **Giuseppe Silvestro** - *Initial work* - [0ry0n](https://github.com/0ry0n)

# License
This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](https://github.com/0ry0n/Resource_Monitor/blob/master/LICENSE) file for details.
