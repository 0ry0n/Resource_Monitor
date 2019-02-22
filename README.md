# Resource_Monitor
Resource_Monitor is a Gnome Shell extension that monitors the use of system resources such as cpu, ram, disks and network.

# Screenshots
![](https://github.com/Ory0n/Resource_Monitor/blob/master/main.png)

# How-To Install
## Download
You can download this extension with various methods:

- From [Gnome](https://extensions.gnome.org/) website.
- Using the latest [Release](https://github.com/Ory0n/Resource_Monitor/releases) posted on GitHub.
- By cloning the [Master](https://github.com/Ory0n/Resource_Monitor/tree/master) repository.
## Install
### Using the latest release
1. Unzip the file `Resource_Monitor-x.x.x.zip`.
2. Rename `Resource_Monitor-x.x.x` folder to `Resource_Monitor@Ory0n`.
3. Paste the `com.github.Ory0n.Resource_Monitor.gschema.xml` schema to `/usr/share/glib-2.0/schemas`.
4. Paste the `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions`.
5. Run `glib-compile-schemas /usr/share/glib-2.0/schemas`
4. Activate the extensions with Gnome Tweak Tool.

For example...
```
unzip Resource_Monitor-x.x.x.zip
mv Resource_Monitor-x.x.x Resource_Monitor@Ory0n
cp Resource_Monitor@Ory0n/schemas/com.github.Ory0n.Resource_Monitor.gschema.xml /usr/share/glib-2.0/schemas
cp -r Resource_Monitor@Ory0n ~/.local/share/gnome-shell/extensions

glib-compile-schemas /usr/share/glib-2.0/schemas
gnome-shell-extension-tool -e Resource_Monitor@Ory0n
```

### Cloning the repository
1. Clone the Master repository.
2. Rename `Resource_Monitor` folder to `Resource_Monitor@Ory0n`.
3. Paste the `com.github.Ory0n.Resource_Monitor.gschema.xml` schema to `/usr/share/glib-2.0/schemas`.
4. Paste the `Resource_Monitor@Ory0n` folder to `~/.local/share/gnome-shell/extensions`.
5. Run `glib-compile-schemas /usr/share/glib-2.0/schemas`
6. Activate the extensions with Gnome Tweak Tool.

For example...
```
git clone https://github.com/Ory0n/Resource_Monitor
mv Resource_Monitor Resource_Monitor@Ory0n
cp Resource_Monitor@Ory0n/schemas/com.github.Ory0n.Resource_Monitor.gschema.xml /usr/share/glib-2.0/schemas
cp -r Resource_Monitor@Ory0n ~/.local/share/gnome-shell/extensions

glib-compile-schemas /usr/share/glib-2.0/schemas
gnome-shell-extension-tool -e Resource_Monitor@Ory0n
```
Might require a Gnome restart. Press `ALT+F2` and type `r` and hit enter.

Or you can use the `install.sh` script.
```
./install.sh
```
# General Settings
![](https://github.com/Ory0n/Resource_Monitor/blob/master/settings.png)

- **Update Interval:** Choose the refresh interval, from 1 to 30 seconds.
- **Display Icons:** Allows you to view or hide icons.
- **Display Cpu:** Allows you to view or hide the Cpu field.
- **Modify Width Cpu:** Resize the Cpu field.
- **Display Ram:** Allows you to view or hide the Ram field.
- **Modify Width Ram:** Resize the Ram field.
- **Display Disk:** Allows you to view or hide the Disk field.
- **Chose Disk:** Lets you choose the drive or memory partition to monitor.
- **Modify Width Disk:** Resize the Disk field.
- **Auto Hide Net:** If enabled, it automatically hides the unused network interface field.
- **Display Eth:** Allows you to view or hide the Ethernet field.
- **Modify Width Eth:** Resize the Eth field.
- **Display Wlan:** Allows you to view or hide the Wlan field.
- **Modify Width Wlan:** Resize the Wlan field.
- **Gnome System Monitor:** Clicking on the extension will open Gnome System Monitor.

![](https://github.com/Ory0n/Resource_Monitor/blob/master/system-monitor.png)

# Bug Reporting
Use the GitHub [Issues](https://github.com/Ory0n/Resource_Monitor/issues) tracker to report issues or ask for features.

# Change Log
**version 2 (Feb 5, 2019)**
- Added partitions selection.
- Added custom resizing of fields.

**version 1 (Dec 26, 2018)**
- Initial release.

# Authors
- **Giuseppe Silvestro** - *Initial work* - [Ory0n](https://github.com/Ory0n)

# License
This project is licensed under the GNU GPL-3.0 License - see the [LICENSE.md](https://github.com/Ory0n/Resource_Monitor/blob/master/LICENSE) file for details.

