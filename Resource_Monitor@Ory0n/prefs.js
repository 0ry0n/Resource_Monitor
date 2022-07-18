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

const { Gio, GObject, Gtk, Gdk, GLib } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const ByteArray = imports.byteArray;
const Me = ExtensionUtils.getCurrentExtension();

const _ = ExtensionUtils.gettext;

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

const THERMAL_TEMPERATURE_UNIT = 'thermaltemperatureunit';
const THERMAL_CPU_TEMPERATURE_STATUS = 'thermalcputemperaturestatus';
const THERMAL_CPU_TEMPERATURE_WIDTH = 'thermalcputemperaturewidth';
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST = 'thermalcputemperaturedeviceslist';
const THERMAL_GPU_TEMPERATURE_STATUS = 'thermalgputemperaturestatus';
const THERMAL_GPU_TEMPERATURE_WIDTH = 'thermalgputemperaturewidth';
const THERMAL_GPU_TEMPERATURE_DEVICES_LIST = 'thermalgputemperaturedeviceslist';

const GPU_STATUS = 'gpustatus';
const GPU_WIDTH = 'gpuwidth';
const GPU_DEVICES_LIST = 'gpudeviceslist';
const GPU_DEVICES_SETTINGS_LIST = 'gpudevicessettingslist';

const ResourceMonitorBuilderScope = GObject.registerClass({
    Implements: [Gtk.BuilderScope],
}, class ResourceMonitorBuilderScope extends GObject.Object {

    vfunc_create_closure(builder, handlerName, flags, connectObject) {
        if (flags & Gtk.BuilderClosureFlags.SWAPPED)
            throw new Error('Unsupported template signal flag "swapped"');

        if (typeof this[handlerName] === 'undefined')
            throw new Error(`${handlerName} is undefined`);

        return this[handlerName].bind(connectObject || this);
    }

    /*on_btn_click(connectObject) {
        connectObject.set_label("Clicked");
    }*/
});

const ResourceMonitorPrefsWidget = GObject.registerClass(
    class ResourceMonitorPrefsWidget extends GObject.Object {
        _connectSpinButton(settings, settingsName, element) {
            settings.bind(settingsName, element, 'value', Gio.SettingsBindFlags.DEFAULT);
        }

        _connectComboBox(settings, settingsName, element, initValueLabel, initValue) {
            if (initValue !== null && initValue.length === initValueLabel.length) {
                for (let i = 0; i < initValue.length; i++) {
                    element.insert(i, initValue[i], initValueLabel[i]);
                }
            }

            settings.bind(settingsName, element, 'active-id', Gio.SettingsBindFlags.DEFAULT);
        }

        _connectSwitchButton(settings, settingsName, element) {
            settings.bind(settingsName, element, 'active', Gio.SettingsBindFlags.DEFAULT);
        }

        _connectRadioButton(settings, settingsName, element, initValueLabel, initValue) {
            let radioButtonGroup = [];
            let active = settings.get_string(settingsName, Gio.SettingsBindFlags.DEFAULT);

            if (initValue !== null && initValue.length === initValueLabel.length) {
                for (let i = 0; i < initValue.length; i++) {
                    let radioButton = new Gtk.CheckButton({
                        label: '%s'.format(initValueLabel[i]),
                    });

                    radioButton.connect('toggled', button => {
                        if (button.active) {
                            settings.set_string(settingsName, initValue[i]);
                        }
                    });

                    radioButton.active = (initValue[i] === active);

                    radioButtonGroup[i] = radioButton;

                    if (i > 0) {
                        radioButton.set_group(radioButtonGroup[i - 1]);
                    }

                    element.append(radioButton);
                }
            }
        }

        _init() {
            // Gtk Css Provider
            this._provider = new Gtk.CssProvider();
            this._provider.load_from_path(Me.dir.get_path() + '/prefs.css');
            Gtk.StyleContext.add_provider_for_display(
                Gdk.Display.get_default(),
                this._provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

            // Gtk Builder
            this._builder = new Gtk.Builder();
            this._builder.set_scope(new ResourceMonitorBuilderScope());
            this._builder.set_translation_domain(GETTEXT_DOMAIN);
            this._builder.add_from_file(Me.dir.get_path() + '/prefs.ui');

            // Settings
            this._settings = ExtensionUtils.getSettings();

            // PREFS
            this.notebook = this._builder.get_object('main_notebook');

            // GLOBAL FRAME
            this._buildGlobal();

            // CPU FRAME
            this._buildCpu();

            // RAM FRAME
            this._buildRam();

            // SWAP FRAME
            this._buildSwap();

            // DISK FRAME
            this._buildDisk();

            // NET FRAME
            this._buildNet();

            // THERMAL FRAME
            this._buildThermal();

            // GPU FRAME
            this._buildGpu();
        }

        _buildGlobal() {
            this._secondsSpinbutton = this._builder.get_object('seconds_spinbutton');
            this._extensionPositionCombobox = this._builder.get_object('extension_position_combobox');
            this._extensionLeftClickBox = this._builder.get_object('extension_left_click_box');
            this._extensionRightClickPrefs = this._builder.get_object('extension_right_click_prefs');
            this._decimalsDisplay = this._builder.get_object('decimals_display');
            this._iconsDisplay = this._builder.get_object('icons_display')
            this._iconsPositionCombobox = this._builder.get_object('icons_position_combobox');


            this._connectSpinButton(this._settings, REFRESH_TIME, this._secondsSpinbutton);
            this._connectComboBox(this._settings, EXTENSION_POSITION, this._extensionPositionCombobox, [_('Left'), _('Center'), _('Right')], ['left', 'center', 'right']);
            this._connectRadioButton(this._settings, LEFT_CLICK_STATUS, this._extensionLeftClickBox, [_('Launch GNOME System Monitor'), _('Launch GNOME Usage')], ['gnome-system-monitor', 'gnome-usage']);
            this._connectSwitchButton(this._settings, RIGHT_CLICK_STATUS, this._extensionRightClickPrefs);
            this._connectSwitchButton(this._settings, DECIMALS_STATUS, this._decimalsDisplay);
            this._connectSwitchButton(this._settings, ICONS_STATUS, this._iconsDisplay);
            this._connectComboBox(this._settings, ICONS_POSITION, this._iconsPositionCombobox, [_('Left'), _('Right')], ['left', 'right']);

            this._iconsDisplay.connect('state-set', button => {
                this._iconsPositionCombobox.sensitive = button.active;
            });
            this._iconsPositionCombobox.sensitive = this._iconsDisplay.active;
        }

        _buildCpu() {
            this._cpuDisplay = this._builder.get_object('cpu_display');
            this._cpuWidthSpinbutton = this._builder.get_object('cpu_width_spinbutton');
            this._cpuFrequencyDisplay = this._builder.get_object('cpu_frequency_display');
            this._cpuFrequencyWidthSpinbutton = this._builder.get_object('cpu_frequency_width_spinbutton');

            this._connectSwitchButton(this._settings, CPU_STATUS, this._cpuDisplay);
            this._connectSpinButton(this._settings, CPU_WIDTH, this._cpuWidthSpinbutton);
            this._connectSwitchButton(this._settings, CPU_FREQUENCY_STATUS, this._cpuFrequencyDisplay);
            this._connectSpinButton(this._settings, CPU_FREQUENCY_WIDTH, this._cpuFrequencyWidthSpinbutton);

            this._cpuDisplay.connect('state-set', button => {
                this._cpuWidthSpinbutton.sensitive = button.active;
            });
            this._cpuWidthSpinbutton.sensitive = this._cpuDisplay.active;

            this._cpuFrequencyDisplay.connect('state-set', button => {
                this._cpuWidthSpinbutton.sensitive = button.active;
            });
            this._cpuWidthSpinbutton.sensitive = this._cpuFrequencyDisplay.active;
        }

        _buildRam() {
            this._ramDisplay = this._builder.get_object('ram_display');
            this._ramWidthSpinbutton = this._builder.get_object('ram_width_spinbutton');
            this._ramUnitCombobox = this._builder.get_object('ram_unit_combobox');
            this._ramMonitorCombobox = this._builder.get_object('ram_monitor_combobox');

            this._connectSwitchButton(this._settings, RAM_STATUS, this._ramDisplay);
            this._connectSpinButton(this._settings, RAM_WIDTH, this._ramWidthSpinbutton);
            this._connectComboBox(this._settings, RAM_UNIT, this._ramUnitCombobox, [_('Numeric'), _('%')], ['numeric', 'perc']);
            this._connectComboBox(this._settings, RAM_MONITOR, this._ramMonitorCombobox, [_('Used Memory'), _('Free Memory')], ['used', 'free']);

            this._ramDisplay.connect('state-set', button => {
                this._ramWidthSpinbutton.sensitive = button.active;
                this._ramUnitCombobox.sensitive = button.active;
                this._ramMonitorCombobox.sensitive = button.active;
            });
            this._ramWidthSpinbutton.sensitive = this._ramDisplay.active;
            this._ramUnitCombobox.sensitive = this._ramDisplay.active;
            this._ramMonitorCombobox.sensitive = this._ramDisplay.active;
        }

        _buildSwap() {
            this._swapDisplay = this._builder.get_object('swap_display');
            this._swapWidthSpinbutton = this._builder.get_object('swap_width_spinbutton');
            this._swapUnitCombobox = this._builder.get_object('swap_unit_combobox');
            this._swapMonitorCombobox = this._builder.get_object('swap_monitor_combobox');

            this._connectSwitchButton(this._settings, SWAP_STATUS, this._swapDisplay);
            this._connectSpinButton(this._settings, SWAP_WIDTH, this._swapWidthSpinbutton);
            this._connectComboBox(this._settings, SWAP_UNIT, this._swapUnitCombobox, [_('Numeric'), _('%')], ['numeric', 'perc']);
            this._connectComboBox(this._settings, SWAP_MONITOR, this._swapMonitorCombobox, [_('Used Memory'), _('Free Memory')], ['used', 'free']);

            this._swapDisplay.connect('state-set', button => {
                this._swapWidthSpinbutton.sensitive = button.active;
                this._swapUnitCombobox.sensitive = button.active;
                this._swapMonitorCombobox.sensitive = button.active;
            });
            this._swapWidthSpinbutton.sensitive = this._swapDisplay.active;
            this._swapUnitCombobox.sensitive = this._swapDisplay.active;
            this._swapMonitorCombobox.sensitive = this._swapDisplay.active;
        }

        _buildDisk() {
            this._diskStatsDisplay = this._builder.get_object('disk_stats_display');
            this._diskStatsWidthSpinbutton = this._builder.get_object('disk_stats_width_spinbutton');
            this._diskStatsModeCombobox = this._builder.get_object('disk_stats_mode_combobox');
            this._diskSpaceDisplay = this._builder.get_object('disk_space_display');
            this._diskSpaceWidthSpinbutton = this._builder.get_object('disk_space_width_spinbutton');
            this._diskSpaceUnitCombobox = this._builder.get_object('disk_space_unit_combobox');
            this._diskSpaceMonitorCombobox = this._builder.get_object('disk_space_monitor_combobox');
            this._diskDevicesModel = this._builder.get_object('disk_devices_model');

            this._connectSwitchButton(this._settings, DISK_STATS_STATUS, this._diskStatsDisplay);
            this._connectSpinButton(this._settings, DISK_STATS_WIDTH, this._diskStatsWidthSpinbutton);
            this._connectComboBox(this._settings, DISK_STATS_MODE, this._diskStatsModeCombobox, [_('Single Mode'), _('Multiple Mode')], ['single', 'multiple']);
            this._connectSwitchButton(this._settings, DISK_SPACE_STATUS, this._diskSpaceDisplay);
            this._connectSpinButton(this._settings, DISK_SPACE_WIDTH, this._diskSpaceWidthSpinbutton);
            this._connectComboBox(this._settings, DISK_SPACE_UNIT, this._diskSpaceUnitCombobox, [_('Numeric'), _('%')], ['numeric', 'perc']);
            this._connectComboBox(this._settings, DISK_SPACE_MONITOR, this._diskSpaceMonitorCombobox, [_('Used Space'), _('Free Space')], ['used', 'free']);

            this._diskStatsDisplay.connect('state-set', button => {
                this._diskStatsWidthSpinbutton.sensitive = button.active;
                this._diskStatsModeCombobox.sensitive = button.active;
            });
            this._diskStatsWidthSpinbutton.sensitive = this._diskStatsDisplay.active;
            this._diskStatsModeCombobox.sensitive = this._diskStatsDisplay.active;

            this._diskSpaceDisplay.connect('state-set', button => {
                this._diskSpaceWidthSpinbutton.sensitive = button.active;
                this._diskSpaceUnitCombobox.sensitive = button.active;
                this._diskSpaceMonitorCombobox.sensitive = button.active;
            });
            this._diskSpaceWidthSpinbutton.sensitive = this._diskSpaceDisplay.active;
            this._diskSpaceUnitCombobox.sensitive = this._diskSpaceDisplay.active;
            this._diskSpaceMonitorCombobox.sensitive = this._diskSpaceDisplay.active;

            // Array format
            // filesystem mountPoint stats space
            // Get current disks settings
            /* TODO let disksArray = this._settings.get_strv(DISK_DEVICES_LIST, Gio.SettingsBindFlags.DEFAULT);
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
            });*/
        }

        _buildNet() {
            this._netAutoHide = this._builder.get_object('net_auto_hide');
            this._netUnitCombobox = this._builder.get_object('net_unit_combobox');
            this._netEthDisplay = this._builder.get_object('net_eth_display');
            this._netEthWidthSpinbutton = this._builder.get_object('net_eth_width_spinbutton');
            this._netWlanDisplay = this._builder.get_object('net_wlan_display');
            this._netWlanWidthSpinbutton = this._builder.get_object('net_wlan_width_spinbutton');

            this._connectSwitchButton(this._settings, NET_AUTO_HIDE_STATUS, this._netAutoHide);
            this._connectComboBox(this._settings, NET_UNIT, this._netUnitCombobox, [_('Bps'), _('bps')], ['bytes', 'bits']);
            this._connectSwitchButton(this._settings, NET_ETH_STATUS, this._netEthDisplay);
            this._connectSpinButton(this._settings, NET_ETH_WIDTH, this._netEthWidthSpinbutton);
            this._connectSwitchButton(this._settings, NET_WLAN_STATUS, this._netWlanDisplay);
            this._connectSpinButton(this._settings, NET_WLAN_WIDTH, this._netWlanWidthSpinbutton);

            this._netEthDisplay.connect('state-set', button => {
                this._netEthWidthSpinbutton.sensitive = button.active;
            });
            this._netEthWidthSpinbutton.sensitive = this._netEthDisplay.active;

            this._netWlanDisplay.connect('state-set', button => {
                this._netWlanWidthSpinbutton.sensitive = button.active;
            });
            this._netWlanWidthSpinbutton.sensitive = this._netWlanDisplay.active;
        }

        _buildThermal() {
            this._thermalUnitCombobox = this._builder.get_object('thermal_unit_combobox');
            this._thermalCpuDisplay = this._builder.get_object('thermal_cpu_display');
            this._thermalCpuWidthSpinbutton = this._builder.get_object('thermal_cpu_width_spinbutton');
            this._thermalCpuDevicesModel = this._builder.get_object('thermal_cpu_devices_model');
            this._thermalGpuDisplay = this._builder.get_object('thermal_gpu_display');
            this._thermalGpuWidthSpinbutton = this._builder.get_object('thermal_gpu_width_spinbutton');
            this._thermalGpuDevicesModel = this._builder.get_object('thermal_gpu_devices_model');


            this._connectComboBox(this._settings, THERMAL_TEMPERATURE_UNIT, this._thermalUnitCombobox, [_('°C'), _('°F')], ['c', 'f']);
            this._connectSwitchButton(this._settings, THERMAL_CPU_TEMPERATURE_STATUS, this._thermalCpuDisplay);
            this._connectSpinButton(this._settings, THERMAL_CPU_TEMPERATURE_WIDTH, this._thermalCpuWidthSpinbutton);
            this._connectSwitchButton(this._settings, THERMAL_GPU_TEMPERATURE_STATUS, this._thermalGpuDisplay);
            this._connectSpinButton(this._settings, THERMAL_GPU_TEMPERATURE_WIDTH, this._thermalGpuWidthSpinbutton);

            this._thermalCpuDisplay.connect('state-set', button => {
                this._thermalCpuWidthSpinbutton.sensitive = button.active;
            });
            this._thermalCpuWidthSpinbutton.sensitive = this._thermalCpuDisplay.active;

            this._thermalGpuDisplay.connect('state-set', button => {
                this._thermalGpuWidthSpinbutton.sensitive = button.active;
            });
            this._thermalGpuWidthSpinbutton.sensitive = this._thermalGpuDisplay.active;

            // TODO gpu add

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
        }

        _buildGpu() {
            this._gpuDisplay = this._builder.get_object('gpu_display');
            this._gpuWidthSpinbutton = this._builder.get_object('gpu_width_spinbutton');
            this._gpuDevicesModel = this._builder.get_object('gpu_devices_model');

            this._connectSwitchButton(this._settings, GPU_STATUS, this._gpuDisplay);
            this._connectSpinButton(this._settings, GPU_WIDTH, this._gpuWidthSpinbutton);

            this._gpuDisplay.connect('state-set', button => {
                this._gpuWidthSpinbutton.sensitive = button.active;
            });
            this._gpuWidthSpinbutton.sensitive = this._gpuDisplay.active;

            // Array format
            // uuid-status
            // Get current gpu devices settings
            /* TODO let devicesArray = this._settings.get_strv(GPU_DEVICES_LIST, Gio.SettingsBindFlags.DEFAULT);
            let newDevicesArray = [];
            let x = 0;

            this._executeCommand(['nvidia-smi', '-L']).then(output => {
                let lines = output.split('\n');

                for (let i = 0; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(/:/);

                    let device = entry[0];
                    let name = entry[1].slice(1, -6);
                    let uuid = entry[2].slice(1, -1);

                    let temp = new TempListItemRow(name + ": " + uuid);

                    // Init gui
                    for (let i = 0; i < devicesArray.length; i++) {
                        let element = devicesArray[i];
                        let it = element.split(':');

                        if (uuid === it[0]) {
                            let statusButton = (it[1] === 'true');

                            temp.button.active = statusButton;

                            break;
                        }
                    }

                    temp.button.connect('toggled', button => {
                        // Save new button state
                        let found = false;

                        for (let i = 0; i < devicesArray.length; i++) {
                            let element = devicesArray[i];
                            let it = element.split(':');

                            if (uuid === it[0]) {
                                it[1] = button.active;
                                devicesArray[i] = it[0] + ':' + it[1];

                                found = true;
                                break;
                            }
                        }

                        // Add new device
                        if (found === false) {
                            devicesArray.push(uuid + ':' + temp.button.active);
                            found = false;
                        }

                        // Save all
                        this._settings.set_strv(GPU_DEVICES_LIST, devicesArray);
                    });

                    // Add device to newDevicesArray
                    newDevicesArray[x++] = uuid + ':' + temp.button.active;

                    devices.list.append(temp);
                    devices.list.show();
                }

                // Save newDevicesArray with the list of new devices (to remove old devices)
                devicesArray = newDevicesArray;
                this._settings.set_strv(GPU_DEVICES_LIST, devicesArray);
            });*/

            /*// Array format
            // name-status-path
            // Get current disks settings
            let tempsArray = this._settings.get_strv(GPU_ELEMENTS_LIST, Gio.SettingsBindFlags.DEFAULT);
            let newTempsArray = [];
            let y = 0;

            this._executeCommand(['bash', '-c', '']).then(output => {
                let result = output.split('\n')[0];
                if (result === 'EXIST') {
                    this._executeCommand(['bash', '-c', 'fo echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; done']).then(output => {
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
            });*/
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

function init() {
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
}

function buildPrefsWidget() {
    const widget = new ResourceMonitorPrefsWidget();

    return widget.notebook;
}