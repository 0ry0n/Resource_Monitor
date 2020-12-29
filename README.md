# Resource_Monitor
Resource_Monitor is a Gnome Shell extension that Monitor the use of system resources like cpu, ram, disk, network and display them in gnome shell top bar.

# Screenshots
![](https://github.com/Ory0n/Resource_Monitor/blob/master/main.png)

# How-To Install
## Download
You can get this extension:

- From [Gnome Extensions](https://extensions.gnome.org/extension/1634/resource-monitor/).
- Downloading the latest [Release](https://github.com/Ory0n/Resource_Monitor/releases) released on GitHub.
- Cloning the [Master](https://github.com/Ory0n/Resource_Monitor/tree/master) repository.
## Install
### Using the latest release
1. Unzip the file `Resource_Monitor-x.zip`.
2. Move the `Resource_Monitor-x` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
3. Activate the extensions with Gnome Extensions.

For example...
```
unzip Resource_Monitor-x.zip
mv Resource_Monitor-x ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```

### Cloning the repository
1. Clone the Master repository.
2. Move the `Resource_Monitor` folder to `~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n`.
3. Activate the extensions with Gnome Extensions.

For example...
```
git clone https://github.com/Ory0n/Resource_Monitor
mv Resource_Monitor ~/.local/share/gnome-shell/extensions/Resource_Monitor@Ory0n

gnome-extensions enable Resource_Monitor@Ory0n
```
Might require a Gnome restart. Press `ALT+F2` and type `r` and hit enter.

# General Settings
![](https://github.com/Ory0n/Resource_Monitor/blob/master/settings.png)

- **Refresh Time:** Choose the refresh interval, from 1 to 30 seconds.
- **Display Icons:** Display or hide the icons.
- **Display Decimals:** Display or hide decimal numbers.
- **System Monitor:** Show or not Gnome System Monitor when clicking on extension.
- **Display Cpu:** Display or hide the Cpu field.
- **Modify Width Cpu:** Resize the Cpu field.
- **Display Ram:** Display or hide the Ram field.
- **Modify Width Ram:** Resize the Ram field.
- **Display Swap:** Display or hide the Swap field.
- **Modify Width Swap:** Resize the Swap field.
- **Display Disk:** Display or hide the Disk field.
- **Chose Disk:** Lets you choose the drive or memory partition to monitor.
- **Modify Width Disk:** Resize the Disk field.
- **Auto Hide Net:** If enabled, it automatically hides the unused network interface field.
- **Display Eth:** Display or hide the Ethernet field.
- **Modify Width Eth:** Resize the Eth field.
- **Display Wlan:** Display or hide the Wlan field.
- **Modify Width Wlan:** Resize the Wlan field.

![](https://github.com/Ory0n/Resource_Monitor/blob/master/system-monitor.png)

# Bug Reporting
Use the GitHub [Issues](https://github.com/Ory0n/Resource_Monitor/issues) tracker to report issues or ask for features.

# Change Log
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
- **Giuseppe Silvestro** - *Initial work* - [Ory0n](https://github.com/Ory0n)

# License
This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](https://github.com/Ory0n/Resource_Monitor/blob/master/LICENSE) file for details.
