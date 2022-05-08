/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init, buildPrefsWidget */

/*
 * Resource_Monitor is Copyright © 2018-2022 Giuseppe Silvestro
 *
 * This file is part of Resource_Monitor.
 *
 * Resource_Monitor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Resource_Monitor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Resource_Monitor. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const GETTEXT_DOMAIN = 'com-github-Ory0n-Resource_Monitor';

const { Gio, GObject, Gtk, GLib } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const ByteArray = imports.byteArray;

// Settings
const REFRESH_TIME = 'refreshtime';
const EXTENSION_POSITION = 'extensionposition';
const DECIMALS_STATUS = 'decimalsstatus';
const LEFT_CLICK_STATUS = 'leftclickstatus';
const RIGHT_CLICK_STATUS = 'rightclickstatus';

const ICONS_STATUS = 'iconsstatus';
const ICONS_POSITION = 'iconsposition';

const CPU_STATUS = 'cpustatus';
const CPU_WIDTH = 'cpuwidth';
const CPU_FREQUENCY_STATUS = 'cpufrequencystatus';
const CPU_FREQUENCY_WIDTH = 'cpufrequencywidth';

const RAM_STATUS = 'ramstatus';
const RAM_WIDTH = 'ramwidth';
const RAM_UNIT = 'ramunit';
const RAM_MONITOR = 'rammonitor';

const SWAP_STATUS = 'swapstatus';
const SWAP_WIDTH = 'swapwidth';
const SWAP_UNIT = 'swapunit';
const SWAP_MONITOR = 'swapmonitor';

const DISK_STATS_STATUS = 'diskstatsstatus';
const DISK_STATS_WIDTH = 'diskstatswidth';
const DISK_STATS_MODE = 'diskstatsmode';
const DISK_SPACE_STATUS = 'diskspacestatus';
const DISK_SPACE_WIDTH = 'diskspacewidth';
const DISK_SPACE_UNIT = 'diskspaceunit';
const DISK_SPACE_MONITOR = 'diskspacemonitor';
const DISK_DEVICES_LIST = 'diskdeviceslist';

const NET_AUTO_HIDE_STATUS = 'netautohidestatus';
const NET_UNIT = 'netunit';
const NET_ETH_STATUS = 'netethstatus';
const NET_ETH_WIDTH = 'netethwidth';
const NET_WLAN_STATUS = 'netwlanstatus';
const NET_WLAN_WIDTH = 'netwlanwidth';

const THERMAL_CPU_TEMPERATURE_STATUS = 'thermalcputemperaturestatus';
const THERMAL_CPU_TEMPERATURE_WIDTH = 'thermalcputemperaturewidth';
const THERMAL_CPU_TEMPERATURE_UNIT = 'thermalcputemperatureunit';
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST = 'thermalcputemperaturedeviceslist';

function init() {
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
}

const ResourceMonitorPrefsWidget = GObject.registerClass(
    class ResourceMonitorPrefsWidget extends Gtk.Box {
        _init() {
            super._init({
                orientation: Gtk.Orientation.VERTICAL,
                margin_top: 10,
                margin_bottom: 10,
                margin_start: 10,
                margin_end: 10
            });

            // Settings
            this._settings = ExtensionUtils.getSettings();

            this._notebook = new Gtk.Notebook();
            this.append(this._notebook);

            // GLOBAL FRAME
            this._notebook.append_page(this._buildGlobal(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Global')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // CPU FRAME
            this._notebook.append_page(this._buildCpu(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Cpu')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // RAM FRAME
            this._notebook.append_page(this._buildRam(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Ram')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // SWAP FRAME
            this._notebook.append_page(this._buildSwap(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Swap')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // DISK FRAME
            this._notebook.append_page(this._buildDisk(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Disk')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // NET FRAME
            this._notebook.append_page(this._buildNet(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Net')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // THERMAL FRAME
            this._notebook.append_page(this._buildThermal(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Thermal')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));
        }

        _buildGlobal() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let refresh = new SpinButtonRow(_('Seconds'), this._settings, REFRESH_TIME, 1, 30);
            let ePosition = new ComboBoxRow(_('Position'), this._settings, EXTENSION_POSITION, [_('Left'), _('Center'), _('Right')], ['left', 'center', 'right']);
            let decimals = new SwitchRow(_('Display'), this._settings, DECIMALS_STATUS);
            let leftClick = new RadioButtonRow(this._settings, LEFT_CLICK_STATUS, [_('Launch GNOME System Monitor'), _('Launch GNOME Usage')], ['gnome-system-monitor', 'gnome-usage']);
            let rightClick = new SwitchRow(_('Show Prefs when clicking on extension'), this._settings, RIGHT_CLICK_STATUS);
            let icons = new SwitchRow(_('Display'), this._settings, ICONS_STATUS);
            let iPosition = new ComboBoxRow(_('Position'), this._settings, ICONS_POSITION, [_('Left'), _('Right')], ['left', 'right']);

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Refresh Time')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(refresh);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Extension')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(ePosition);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Decimals')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(decimals);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Left-click on the extension')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(leftClick);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Right-click on the extension')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(rightClick);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Icons')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(icons);
            box.append(iPosition);

            refresh.button.set_range(1, 30);

            icons.button.connect('state-set', button => {
                iPosition.combobox.sensitive = button.active;
            });
            iPosition.combobox.sensitive = icons.button.active;

            return box;
        }

        _buildCpu() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let cpu = new SwitchRow(_('Display'), this._settings, CPU_STATUS);
            let width = new SpinButtonRow(_('Width'), this._settings, CPU_WIDTH);
            let frequency = new SwitchRow(_('Display'), this._settings, CPU_FREQUENCY_STATUS);
            let widthFrequency = new SpinButtonRow(_('Width'), this._settings, CPU_FREQUENCY_WIDTH);

            box.append(cpu);
            box.append(width);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Frequency')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(frequency);
            box.append(widthFrequency);

            cpu.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = cpu.button.active;

            frequency.button.connect('state-set', button => {
                widthFrequency.button.sensitive = button.active;
            });
            widthFrequency.button.sensitive = frequency.button.active;

            return box;
        }

        _buildRam() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let ram = new SwitchRow(_('Display'), this._settings, RAM_STATUS);
            let width = new SpinButtonRow(_('Width'), this._settings, RAM_WIDTH);
            let unit = new ComboBoxRow(_('Unit'), this._settings, RAM_UNIT, [_('Numeric'), _('%')], ['numeric', 'perc']);
            let monitor = new ComboBoxRow(_('Monitor'), this._settings, RAM_MONITOR, [_('Used Memory'), _('Free Memory')], ['used', 'free']);

            box.append(ram);
            box.append(width);
            box.append(unit);
            box.append(monitor);

            ram.button.connect('state-set', button => {
                width.button.sensitive = button.active;
                unit.combobox.sensitive = button.active;
                monitor.combobox.sensitive = button.active;
            });
            width.button.sensitive = ram.button.active;
            unit.combobox.sensitive = ram.button.active;
            monitor.combobox.sensitive = ram.button.active;

            return box;
        }

        _buildSwap() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let swap = new SwitchRow(_('Display'), this._settings, SWAP_STATUS);
            let width = new SpinButtonRow(_('Width'), this._settings, SWAP_WIDTH);
            let unit = new ComboBoxRow(_('Unit'), this._settings, SWAP_UNIT, [_('Numeric'), _('%')], ['numeric', 'perc']);
            let monitor = new ComboBoxRow(_('Monitor'), this._settings, SWAP_MONITOR, [_('Used Memory'), _('Free Memory')], ['used', 'free']);

            box.append(swap);
            box.append(width);
            box.append(unit);
            box.append(monitor);

            swap.button.connect('state-set', button => {
                width.button.sensitive = button.active;
                unit.combobox.sensitive = button.active;
                monitor.combobox.sensitive = button.active;
            });
            width.button.sensitive = swap.button.active;
            unit.combobox.sensitive = swap.button.active;
            monitor.combobox.sensitive = swap.button.active;

            return box;
        }

        _buildDisk() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let stats = new SwitchRow(_('Display'), this._settings, DISK_STATS_STATUS);
            let widthStats = new SpinButtonRow(_('Width'), this._settings, DISK_STATS_WIDTH);
            let mode = new ComboBoxRow(_('Display'), this._settings, DISK_STATS_MODE, [_('Single Mode'), _('Multiple Mode')], ['single', 'multiple']);
            let space = new SwitchRow(_('Display'), this._settings, DISK_SPACE_STATUS);
            let widthSpace = new SpinButtonRow(_('Width'), this._settings, DISK_SPACE_WIDTH);
            let unit = new ComboBoxRow(_('Unit'), this._settings, DISK_SPACE_UNIT, [_('Numeric'), _('%')], ['numeric', 'perc']);
            let monitor = new ComboBoxRow(_('Monitor'), this._settings, DISK_SPACE_MONITOR, [_('Used Space'), _('Free Space')], ['used', 'free']);
            let devices = new ListRow(_('Devices'));

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Stats')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(stats);
            box.append(widthStats);
            box.append(mode);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Space')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(space);
            box.append(widthSpace);
            box.append(unit);
            box.append(monitor);
            box.append(devices);

            stats.button.connect('state-set', button => {
                widthStats.button.sensitive = button.active;
                mode.combobox.sensitive = button.active;
            });
            widthStats.button.sensitive = stats.button.active;
            mode.combobox.sensitive = stats.button.active;

            space.button.connect('state-set', button => {
                widthSpace.button.sensitive = button.active;
                unit.combobox.sensitive = button.active;
            });
            widthSpace.button.sensitive = space.button.active;
            unit.combobox.sensitive = space.button.active;

            space.button.connect('state-set', button => {
                widthSpace.button.sensitive = button.active;
                monitor.combobox.sensitive = button.active;
            });
            widthSpace.button.sensitive = space.button.active;
            monitor.combobox.sensitive = space.button.active;

            // Array format
            // filesystem mountPoint stats space
            // Get current disks settings
            let disksArray = this._settings.get_strv(DISK_DEVICES_LIST, Gio.SettingsBindFlags.DEFAULT);
            let newDisksArray = [];
            let x = 0;

            this._executeCommand(['df', '-x', 'squashfs', '-x', 'tmpfs']).then(output => {
                let lines = output.split('\n');

                // Excludes the first line of output
                for (let i = 1; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(/\s+/);

                    let filesystem = entry[0];
                    let mountedOn = entry[5];

                    let disk = new ListItemRow(filesystem, mountedOn);

                    // Init gui
                    for (let i = 0; i < disksArray.length; i++) {
                        let element = disksArray[i];

                        let it = element.split(' ');

                        if (filesystem === it[0]) {
                            let dStButton = (it[2] === 'true');
                            let dSpButton = (it[3] === 'true');

                            disk.stats.active = dStButton;
                            disk.space.active = dSpButton;

                            break;
                        }
                    }

                    disk.stats.connect('toggled', button => {
                        // Save new button state
                        let found = false;

                        for (let i = 0; i < disksArray.length; i++) {
                            let element = disksArray[i];
                            let it = element.split(' ');

                            if (filesystem === it[0]) {
                                it[2] = button.active;
                                disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2] + ' ' + it[3];

                                found = true;
                                break;
                            }
                        }

                        // Add new disks
                        if (found === false) {
                            disksArray.push(filesystem + ' ' + mountedOn + ' ' + disk.stats.active + ' ' + disk.space.active);
                            found = false;
                        }

                        // Save all
                        this._settings.set_strv(DISK_DEVICES_LIST, disksArray);
                    });

                    disk.space.connect('toggled', button => {
                        // Save new button state
                        let found = false;

                        for (let i = 0; i < disksArray.length; i++) {
                            let element = disksArray[i];
                            let it = element.split(' ');

                            if (filesystem === it[0]) {
                                it[3] = button.active;
                                disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2] + ' ' + it[3];

                                found = true;
                                break;
                            }
                        }

                        // Add new disks
                        if (found === false) {
                            disksArray.push(filesystem + ' ' + mountedOn + ' ' + disk.stats.active + ' ' + disk.space.active);
                            found = false;
                        }

                        // Save all
                        this._settings.set_strv(DISK_DEVICES_LIST, disksArray);
                    });

                    // Add disk to newDisksArray
                    newDisksArray[x++] = filesystem + ' ' + mountedOn + ' ' + disk.stats.active + ' ' + disk.space.active;

                    devices.list.append(disk);
                    devices.list.show();
                }

                // Save newDisksArray with the list of new disks (to remove old disks)
                disksArray = newDisksArray;
                this._settings.set_strv(DISK_DEVICES_LIST, disksArray);
            });

            return box;
        }

        _buildNet() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let auto = new SwitchRow(_('Enable'), this._settings, NET_AUTO_HIDE_STATUS);
            let unit = new ComboBoxRow(_('Unit'), this._settings, NET_UNIT, [_('Bps'), _('bps')], ['bytes', 'bits']);
            let eth = new SwitchRow(_('Display'), this._settings, NET_ETH_STATUS);
            let widthEth = new SpinButtonRow(_('Width'), this._settings, NET_ETH_WIDTH);
            let wlan = new SwitchRow(_('Display'), this._settings, NET_WLAN_STATUS);
            let widthWlan = new SpinButtonRow(_('Width'), this._settings, NET_WLAN_WIDTH);

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Auto Hide')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(auto);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Unit')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(unit);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Eth')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(eth);
            box.append(widthEth);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Wlan')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(wlan);
            box.append(widthWlan);

            eth.button.connect('state-set', button => {
                widthEth.button.sensitive = button.active;
            });
            widthEth.button.sensitive = eth.button.active;

            wlan.button.connect('state-set', button => {
                widthWlan.button.sensitive = button.active;
            });
            widthWlan.button.sensitive = wlan.button.active;

            return box;
        }

        _buildThermal() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let thermal = new SwitchRow(_('Display'), this._settings, THERMAL_CPU_TEMPERATURE_STATUS);
            let width = new SpinButtonRow(_('Width'), this._settings, THERMAL_CPU_TEMPERATURE_WIDTH);
            let unit = new ComboBoxRow(_('Unit'), this._settings, THERMAL_CPU_TEMPERATURE_UNIT, [_('°C'), _('°F')], ['c', 'f']);
            let devices = new ListRow(_('Devices'));

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Cpu Temperature')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(thermal);
            box.append(width);
            box.append(unit);
            box.append(devices);

            thermal.button.connect('state-set', button => {
                width.button.sensitive = button.active;
                unit.combobox.sensitive = button.active;
            });
            width.button.sensitive = thermal.button.active;
            unit.combobox.sensitive = thermal.button.active;

            // Array format
            // name-status-path
            // Get current disks settings
            let tempsArray = this._settings.get_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST, Gio.SettingsBindFlags.DEFAULT);
            let newTempsArray = [];
            let x = 0;

            // Detect sensors
            //let command = 'for i in /sys/class/hwmon/hwmon*/temp*_input; do echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*})) $(readlink -f $i)"; done';

            this._executeCommand(['bash', '-c', 'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then echo "EXIST"; fi']).then(output => {
                let result = output.split('\n')[0];
                if (result === 'EXIST') {
                    this._executeCommand(['bash', '-c', 'for i in /sys/class/hwmon/hwmon*/temp*_input; do echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; done']).then(output => {
                        let lines = output.split('\n');

                        for (let i = 0; i < lines.length - 1; i++) {
                            let line = lines[i];
                            let entry = line.trim().split(/-/);

                            let device = entry[0];
                            let path = entry[1];

                            let temp = new TempListItemRow(device);

                            // Init gui
                            for (let i = 0; i < tempsArray.length; i++) {
                                let element = tempsArray[i];
                                let it = element.split('-');

                                if (device === it[0]) {
                                    let statusButton = (it[1] === 'true');

                                    temp.button.active = statusButton;

                                    break;
                                }
                            }

                            temp.button.connect('toggled', button => {
                                // Save new button state
                                let found = false;

                                for (let i = 0; i < tempsArray.length; i++) {
                                    let element = tempsArray[i];
                                    let it = element.split('-');

                                    if (device === it[0]) {
                                        it[1] = button.active;
                                        tempsArray[i] = it[0] + '-' + it[1] + '-' + it[2];

                                        found = true;
                                        break;
                                    }
                                }

                                // Add new device
                                if (found === false) {
                                    tempsArray.push(device + '-' + temp.button.active + '-' + path);
                                    found = false;
                                }

                                // Save all
                                this._settings.set_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST, tempsArray);
                            });

                            // Add device to newTempsArray
                            newTempsArray[x++] = device + '-' + temp.button.active + '-' + path;

                            devices.list.append(temp);
                            devices.list.show();
                        }

                        // Save newTempsArray with the list of new devices (to remove old devices)
                        tempsArray = newTempsArray;
                        this._settings.set_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST, tempsArray);
                    });
                }
            });

            return box;
        }

        _readOutput(proc, cancellable = null) {
            return new Promise((resolve, reject) => {
                proc.communicate_utf8_async(null, cancellable, (source_object, res) => {
                    try {
                        let [ok, stdout, stderr] = source_object.communicate_utf8_finish(res);

                        if (source_object.get_successful()) {
                            resolve(stdout);
                        } else {
                            throw new Error(stderr);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        async _executeCommand(command, cancellable = null) {
            try {
                let proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
                let output = await this._readOutput(proc, cancellable);

                return output;
            } catch (e) {
                logError(e);
            }
        }
    });

const SwitchRow = GObject.registerClass(
    class SwitchRow extends Gtk.Grid {
        _init(label, settings, settingsName) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(label),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.button = new Gtk.Switch({
                halign: Gtk.Align.END,
            });

            settings.bind(settingsName, this.button, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.button, 1, 0, 1, 1);
        }
    });

const SpinButtonRow = GObject.registerClass(
    class SpinButtonRow extends Gtk.Grid {
        _init(label, settings, settingsName, lower = 0, upper = 500) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(label),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.button = new Gtk.SpinButton({
                adjustment: new Gtk.Adjustment({
                    lower: lower,
                    upper: upper,
                    step_increment: 1,
                }),
                halign: Gtk.Align.END,
                numeric: true,
            });

            settings.bind(settingsName, this.button, 'value', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.button, 1, 0, 1, 1);
        }
    });

const RadioButtonRow = GObject.registerClass(
    class RadioButtonRow extends Gtk.Grid {
        _init(settings, settingsName, initValueLabel, initValue) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.radioButtonGroup = [];
            let active = settings.get_string(settingsName, Gio.SettingsBindFlags.DEFAULT);

            if (initValue !== null && initValue.length === initValueLabel.length) {
                for (let i = 0; i < initValue.length; i++) {
                    let radioButton = new Gtk.CheckButton({
                        label: '%s'.format(initValueLabel[i]),
                        halign: Gtk.Align.START,
                        hexpand: true,
                    });

                    radioButton.connect('toggled', button => {
                        if (button.active) {
                            settings.set_string(settingsName, initValue[i]);
                        }
                    });

                    radioButton.active = (initValue[i] === active);

                    this.radioButtonGroup[i] = radioButton;

                    if (i > 0) {
                        radioButton.set_group(this.radioButtonGroup[i - 1]);
                    }

                    this.attach(radioButton, 0, i, 1, 1);
                }
            }
        }
    });

const ComboBoxRow = GObject.registerClass(
    class ComboBoxRow extends Gtk.Grid {
        _init(label, settings, settingsName, initValueLabel, initValue) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(label),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.combobox = new Gtk.ComboBoxText({
                halign: Gtk.Align.END,
            });

            if (initValue !== null && initValue.length === initValueLabel.length) {
                for (let i = 0; i < initValue.length; i++) {
                    this.combobox.insert(i, initValue[i], initValueLabel[i]);
                }
            }

            settings.bind(settingsName, this.combobox, 'active-id', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.combobox, 1, 0, 1, 1);
        }
    });

const ListRow = GObject.registerClass(
    class ListRow extends Gtk.Grid {
        _init(label) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(label),
                    halign: Gtk.Align.START,
                    use_markup: true,
                    hexpand: true,
                }), 0, 0, 1, 1);

            let view = new Gtk.ScrolledWindow({
                height_request: 152,
            });

            this.list = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
            });
            view.child = this.list;

            this.attach(view, 0, 1, 2, 2);
        }
    });

const ListItemRow = GObject.registerClass(
    class ListItemRow extends Gtk.Grid {
        _init(name, path) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.HORIZONTAL,
            });

            this.diskName = new Gtk.Label({
                label: '%s'.format(name),
                halign: Gtk.Align.START,
                margin_end: 10,
                hexpand: true,
            });

            this.diskPath = new Gtk.Label({
                label: '%s'.format(path),
                halign: Gtk.Align.START,
                margin_end: 10,
                hexpand: true,
            });

            this.stats = new Gtk.CheckButton({
                label: '%s'.format(_("Stats")),
                active: false,
            });

            this.space = new Gtk.CheckButton({
                label: '%s'.format(_("Space")),
                active: false,
            });

            this.attach(this.diskName, 0, 0, 1, 1);
            this.attach(this.diskPath, 1, 0, 1, 1);
            this.attach(this.stats, 2, 0, 1, 1);
            this.attach(this.space, 3, 0, 1, 1);
        }
    });

const TempListItemRow = GObject.registerClass(
    class TempListItemRow extends Gtk.Grid {
        _init(name) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.HORIZONTAL,
            });

            this.deviceName = new Gtk.Label({
                label: '%s'.format(name),
                halign: Gtk.Align.START,
                margin_end: 10,
                hexpand: true,
            });

            this.button = new Gtk.CheckButton({
                label: '%s'.format(_("Monitor")),
                active: false,
            });

            this.attach(this.deviceName, 0, 0, 1, 1);
            this.attach(this.button, 1, 0, 1, 1);
        }
    });

function buildPrefsWidget() {
    return new ResourceMonitorPrefsWidget();
}

