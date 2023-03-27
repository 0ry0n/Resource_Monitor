/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init, buildPrefsWidget */

/*
 * Resource_Monitor is Copyright © 2018-2023 Giuseppe Silvestro
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
const Gettext = imports.gettext;

const Domain = Gettext.domain(Me.metadata.uuid);

const _ = Domain.gettext;
const ngettext = Domain.ngettext;

// Settings
const REFRESH_TIME = 'refreshtime';
const EXTENSION_POSITION = 'extensionposition';
const DECIMALS_STATUS = 'decimalsstatus';
const LEFT_CLICK_STATUS = 'leftclickstatus';
const RIGHT_CLICK_STATUS = 'rightclickstatus';
const CUSTOM_LEFT_CLICK_STATUS = 'customleftclickstatus';

const ICONS_STATUS = 'iconsstatus';
const ICONS_POSITION = 'iconsposition';

const ITEMS_POSITION = 'itemsposition';

const CPU_STATUS = 'cpustatus';
const CPU_WIDTH = 'cpuwidth';
const CPU_FREQUENCY_STATUS = 'cpufrequencystatus';
const CPU_FREQUENCY_WIDTH = 'cpufrequencywidth';
const CPU_FREQUENCY_UNIT_MEASURE = 'cpufrequencyunitmeasure';
const CPU_LOADAVERAGE_STATUS = 'cpuloadaveragestatus';
const CPU_LOADAVERAGE_WIDTH = 'cpuloadaveragewidth';

const RAM_STATUS = 'ramstatus';
const RAM_WIDTH = 'ramwidth';
const RAM_UNIT = 'ramunit';
const RAM_UNIT_MEASURE = 'ramunitmeasure';
const RAM_MONITOR = 'rammonitor';

const SWAP_STATUS = 'swapstatus';
const SWAP_WIDTH = 'swapwidth';
const SWAP_UNIT = 'swapunit';
const SWAP_UNIT_MEASURE = 'swapunitmeasure';
const SWAP_MONITOR = 'swapmonitor';

const DISK_STATS_STATUS = 'diskstatsstatus';
const DISK_STATS_WIDTH = 'diskstatswidth';
const DISK_STATS_MODE = 'diskstatsmode';
const DISK_STATS_UNIT_MEASURE = 'diskstatsunitmeasure';
const DISK_SPACE_STATUS = 'diskspacestatus';
const DISK_SPACE_WIDTH = 'diskspacewidth';
const DISK_SPACE_UNIT = 'diskspaceunit';
const DISK_SPACE_UNIT_MEASURE = 'diskspaceunitmeasure';
const DISK_SPACE_MONITOR = 'diskspacemonitor';
const DISK_DEVICES_DISPLAY_ALL = 'diskdevicesdisplayall';
const DISK_DEVICES_LIST = 'diskdeviceslist';
const DISK_DEVICES_LIST_SEPARATOR = ' ';

const NET_AUTO_HIDE_STATUS = 'netautohidestatus';
const NET_UNIT = 'netunit';
const NET_UNIT_MEASURE = 'netunitmeasure';
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
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR = '-';

const GPU_STATUS = 'gpustatus';
const GPU_WIDTH = 'gpuwidth';
const GPU_MEMORY_UNIT = 'gpumemoryunit';
const GPU_MEMORY_UNIT_MEASURE = 'gpumemoryunitmeasure';
const GPU_MEMORY_MONITOR = 'gpumemorymonitor';
const GPU_DISPLAY_DEVICE_NAME = 'gpudisplaydevicename'
const GPU_DEVICES_LIST = 'gpudeviceslist';
const GPU_DEVICES_LIST_SEPARATOR = ':';

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
});

const ResourceMonitorPrefsWidget = GObject.registerClass(
    class ResourceMonitorPrefsWidget extends GObject.Object {
        _connectSpinButton(settings, settingsName, element) {
            settings.bind(settingsName, element, 'value', Gio.SettingsBindFlags.DEFAULT);
        }

        _connectComboBox(settings, settingsName, element) {
            settings.bind(settingsName, element, 'active-id', Gio.SettingsBindFlags.DEFAULT);
        }

        _connectSwitchButton(settings, settingsName, element) {
            settings.bind(settingsName, element, 'active', Gio.SettingsBindFlags.DEFAULT);
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
            this._extensionLeftClickRadioButtonSM = this._builder.get_object('extension_left_click_radiobutton_sm');
            this._extensionLeftClickRadioButtonU = this._builder.get_object('extension_left_click_radiobutton_u');
            this._extensionLeftClickRadioButtonCustom = this._builder.get_object('extension_left_click_radiobutton_custom');
            this._extensionLeftClickTextViewCustom = this._builder.get_object('extension_left_click_textview_custom');
            this._extensionLeftClickTextViewTextBuffer = this._builder.get_object('extension_left_click_textview_textbuffer');
            this._extensionRightClickPrefs = this._builder.get_object('extension_right_click_prefs');
            this._decimalsDisplay = this._builder.get_object('decimals_display');
            this._iconsDisplay = this._builder.get_object('icons_display')
            this._iconsPositionCombobox = this._builder.get_object('icons_position_combobox');
            this._itemsPositionListbox = this._builder.get_object('items_position_listbox')

            this._connectSpinButton(this._settings, REFRESH_TIME, this._secondsSpinbutton);
            this._connectComboBox(this._settings, EXTENSION_POSITION, this._extensionPositionCombobox);
            this._connectSwitchButton(this._settings, RIGHT_CLICK_STATUS, this._extensionRightClickPrefs);
            this._connectSwitchButton(this._settings, DECIMALS_STATUS, this._decimalsDisplay);
            this._connectSwitchButton(this._settings, ICONS_STATUS, this._iconsDisplay);
            this._connectComboBox(this._settings, ICONS_POSITION, this._iconsPositionCombobox);

            this._iconsDisplay.connect('state-set', button => {
                this._iconsPositionCombobox.sensitive = button.active;
            });
            this._iconsPositionCombobox.sensitive = this._iconsDisplay.active;

            // LEFT-CLICK
            let active = this._settings.get_string(LEFT_CLICK_STATUS);
            let textBufferCustom = this._settings.get_string(CUSTOM_LEFT_CLICK_STATUS);

            this._extensionLeftClickRadioButtonSM.connect('toggled', button => {
                if (button.active) {
                    this._settings.set_string(LEFT_CLICK_STATUS, 'gnome-system-monitor');
                }
            });
            this._extensionLeftClickRadioButtonSM.active = ('gnome-system-monitor' === active);

            this._extensionLeftClickRadioButtonU.connect('toggled', button => {
                if (button.active) {
                    this._settings.set_string(LEFT_CLICK_STATUS, 'gnome-usage');
                }
            });
            this._extensionLeftClickRadioButtonU.active = ('gnome-usage' === active);

            this._extensionLeftClickRadioButtonCustom.connect('toggled', button => {
                if (button.active) {
                    this._settings.set_string(LEFT_CLICK_STATUS, textBufferCustom);
                }
                this._extensionLeftClickTextViewCustom.sensitive = button.active;
            });
            this._extensionLeftClickRadioButtonCustom.active = (textBufferCustom === active);
            this._extensionLeftClickTextViewCustom.sensitive = this._extensionLeftClickRadioButtonCustom.active;
            this._extensionLeftClickTextViewTextBuffer.text = textBufferCustom;

            this._extensionLeftClickTextViewTextBuffer.connect('changed', tBuffer => {
                this._settings.set_string(LEFT_CLICK_STATUS, tBuffer.text);
                this._settings.set_string(CUSTOM_LEFT_CLICK_STATUS, tBuffer.text);
            });

            // ListBox
            let itemsPositionArray = this._settings.get_strv(ITEMS_POSITION);

            for (let i = 0; i < itemsPositionArray.length; i++) {
                const element = itemsPositionArray[i];

                let row = new Gtk.ListBoxRow();
                let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

                let up = new Gtk.Button({ icon_name: 'go-up' });
                up.connect('clicked', button => {
                    const index = row.get_index()
                    if (index > 0) {
                        [itemsPositionArray[index], itemsPositionArray[index - 1]] = [itemsPositionArray[index - 1], itemsPositionArray[index]];
                        this._itemsPositionListbox.remove(row);
                        this._itemsPositionListbox.insert(row, index - 1);

                        this._settings.set_strv(ITEMS_POSITION, itemsPositionArray);
                    }
                });
                let down = new Gtk.Button({ icon_name: 'go-down' });
                down.connect('clicked', button => {
                    const index = row.get_index()
                    if (index < itemsPositionArray.length) {
                        [itemsPositionArray[index], itemsPositionArray[index + 1]] = [itemsPositionArray[index + 1], itemsPositionArray[index]];
                        this._itemsPositionListbox.remove(row);
                        this._itemsPositionListbox.insert(row, index + 1);

                        this._settings.set_strv(ITEMS_POSITION, itemsPositionArray);
                    }
                });

                box.append(new Gtk.Label({ label: element, hexpand: true, halign: Gtk.Align.START }));
                box.append(up);
                box.append(down);

                row.child = box;

                this._itemsPositionListbox.insert(row, i);
            }
        }

        _buildCpu() {
            this._cpuDisplay = this._builder.get_object('cpu_display');
            this._cpuWidthSpinbutton = this._builder.get_object('cpu_width_spinbutton');
            this._cpuFrequencyDisplay = this._builder.get_object('cpu_frequency_display');
            this._cpuFrequencyWidthSpinbutton = this._builder.get_object('cpu_frequency_width_spinbutton');
            this._cpuFrequencyUnitMeasureCombobox = this._builder.get_object('cpu_frequency_unit_measure_combobox');
            this._cpuLoadAverageDisplay = this._builder.get_object('cpu_loadaverage_display');
            this._cpuLoadAverageWidthSpinbutton = this._builder.get_object('cpu_loadaverage_width_spinbutton');

            this._connectSwitchButton(this._settings, CPU_STATUS, this._cpuDisplay);
            this._connectSpinButton(this._settings, CPU_WIDTH, this._cpuWidthSpinbutton);
            this._connectSwitchButton(this._settings, CPU_FREQUENCY_STATUS, this._cpuFrequencyDisplay);
            this._connectSpinButton(this._settings, CPU_FREQUENCY_WIDTH, this._cpuFrequencyWidthSpinbutton);
            this._connectComboBox(this._settings, CPU_FREQUENCY_UNIT_MEASURE, this._cpuFrequencyUnitMeasureCombobox);
            this._connectSwitchButton(this._settings, CPU_LOADAVERAGE_STATUS, this._cpuLoadAverageDisplay);
            this._connectSpinButton(this._settings, CPU_LOADAVERAGE_WIDTH, this._cpuLoadAverageWidthSpinbutton);

            this._cpuDisplay.connect('state-set', button => {
                this._cpuWidthSpinbutton.sensitive = button.active;
            });
            this._cpuWidthSpinbutton.sensitive = this._cpuDisplay.active;

            this._cpuFrequencyDisplay.connect('state-set', button => {
                this._cpuFrequencyWidthSpinbutton.sensitive = button.active;
                this._cpuFrequencyUnitMeasureCombobox.sensitive = button.active;
            });
            this._cpuFrequencyWidthSpinbutton.sensitive = this._cpuFrequencyDisplay.active;
            this._cpuFrequencyUnitMeasureCombobox.sensitive = this._cpuFrequencyDisplay.active;

            this._cpuLoadAverageDisplay.connect('state-set', button => {
                this._cpuLoadAverageWidthSpinbutton.sensitive = button.active;
            });
            this._cpuLoadAverageWidthSpinbutton.sensitive = this._cpuLoadAverageDisplay.active;
        }

        _buildRam() {
            this._ramDisplay = this._builder.get_object('ram_display');
            this._ramWidthSpinbutton = this._builder.get_object('ram_width_spinbutton');
            this._ramUnitCombobox = this._builder.get_object('ram_unit_combobox');
            this._ramUnitMeasureCombobox = this._builder.get_object('ram_unit_measure_combobox');
            this._ramMonitorCombobox = this._builder.get_object('ram_monitor_combobox');

            this._connectSwitchButton(this._settings, RAM_STATUS, this._ramDisplay);
            this._connectSpinButton(this._settings, RAM_WIDTH, this._ramWidthSpinbutton);
            this._connectComboBox(this._settings, RAM_UNIT, this._ramUnitCombobox);
            this._connectComboBox(this._settings, RAM_UNIT_MEASURE, this._ramUnitMeasureCombobox);
            this._connectComboBox(this._settings, RAM_MONITOR, this._ramMonitorCombobox);

            this._ramDisplay.connect('state-set', button => {
                this._ramWidthSpinbutton.sensitive = button.active;
                this._ramUnitCombobox.sensitive = button.active;
                this._ramUnitMeasureCombobox.sensitive = button.active;
                this._ramMonitorCombobox.sensitive = button.active;
            });
            this._ramWidthSpinbutton.sensitive = this._ramDisplay.active;
            this._ramUnitCombobox.sensitive = this._ramDisplay.active;
            this._ramUnitMeasureCombobox.sensitive = this._ramDisplay.active;
            this._ramMonitorCombobox.sensitive = this._ramDisplay.active;
        }

        _buildSwap() {
            this._swapDisplay = this._builder.get_object('swap_display');
            this._swapWidthSpinbutton = this._builder.get_object('swap_width_spinbutton');
            this._swapUnitCombobox = this._builder.get_object('swap_unit_combobox');
            this._swapUnitMeasureCombobox = this._builder.get_object('swap_unit_measure_combobox');
            this._swapMonitorCombobox = this._builder.get_object('swap_monitor_combobox');

            this._connectSwitchButton(this._settings, SWAP_STATUS, this._swapDisplay);
            this._connectSpinButton(this._settings, SWAP_WIDTH, this._swapWidthSpinbutton);
            this._connectComboBox(this._settings, SWAP_UNIT, this._swapUnitCombobox);
            this._connectComboBox(this._settings, SWAP_UNIT_MEASURE, this._swapUnitMeasureCombobox);
            this._connectComboBox(this._settings, SWAP_MONITOR, this._swapMonitorCombobox);

            this._swapDisplay.connect('state-set', button => {
                this._swapWidthSpinbutton.sensitive = button.active;
                this._swapUnitCombobox.sensitive = button.active;
                this._swapUnitMeasureCombobox.sensitive = button.active;
                this._swapMonitorCombobox.sensitive = button.active;
            });
            this._swapWidthSpinbutton.sensitive = this._swapDisplay.active;
            this._swapUnitCombobox.sensitive = this._swapDisplay.active;
            this._swapUnitMeasureCombobox.sensitive = this._swapDisplay.active;
            this._swapMonitorCombobox.sensitive = this._swapDisplay.active;
        }

        _buildDisk() {
            this._diskStatsDisplay = this._builder.get_object('disk_stats_display');
            this._diskStatsWidthSpinbutton = this._builder.get_object('disk_stats_width_spinbutton');
            this._diskStatsModeCombobox = this._builder.get_object('disk_stats_mode_combobox');
            this._diskStatsUnitMeasureCombobox = this._builder.get_object('disk_stats_unit_measure_combobox');
            this._diskSpaceDisplay = this._builder.get_object('disk_space_display');
            this._diskSpaceWidthSpinbutton = this._builder.get_object('disk_space_width_spinbutton');
            this._diskSpaceUnitCombobox = this._builder.get_object('disk_space_unit_combobox');
            this._diskSpaceUnitMeasureCombobox = this._builder.get_object('disk_space_unit_measure_combobox');
            this._diskSpaceMonitorCombobox = this._builder.get_object('disk_space_monitor_combobox');
            this._diskDevicesDisplayAll = this._builder.get_object('disk_devices_display_all');
            this._diskDevicesTreeView = this._builder.get_object('disk_devices_treeview')

            this._connectSwitchButton(this._settings, DISK_STATS_STATUS, this._diskStatsDisplay);
            this._connectSpinButton(this._settings, DISK_STATS_WIDTH, this._diskStatsWidthSpinbutton);
            this._connectComboBox(this._settings, DISK_STATS_MODE, this._diskStatsModeCombobox);
            this._connectComboBox(this._settings, DISK_STATS_UNIT_MEASURE, this._diskStatsUnitMeasureCombobox);
            this._connectSwitchButton(this._settings, DISK_SPACE_STATUS, this._diskSpaceDisplay);
            this._connectSpinButton(this._settings, DISK_SPACE_WIDTH, this._diskSpaceWidthSpinbutton);
            this._connectComboBox(this._settings, DISK_SPACE_UNIT, this._diskSpaceUnitCombobox);
            this._connectComboBox(this._settings, DISK_SPACE_UNIT_MEASURE, this._diskSpaceUnitMeasureCombobox);
            this._connectComboBox(this._settings, DISK_SPACE_MONITOR, this._diskSpaceMonitorCombobox);
            this._connectSwitchButton(this._settings, DISK_DEVICES_DISPLAY_ALL, this._diskDevicesDisplayAll);

            this._diskStatsDisplay.connect('state-set', button => {
                this._diskStatsWidthSpinbutton.sensitive = button.active;
                this._diskStatsModeCombobox.sensitive = button.active;
                this._diskStatsUnitMeasureCombobox.sensitive = button.active;
            });
            this._diskStatsWidthSpinbutton.sensitive = this._diskStatsDisplay.active;
            this._diskStatsModeCombobox.sensitive = this._diskStatsDisplay.active;
            this._diskStatsUnitMeasureCombobox.sensitive = this._diskStatsDisplay.active;

            this._diskSpaceDisplay.connect('state-set', button => {
                this._diskSpaceWidthSpinbutton.sensitive = button.active;
                this._diskSpaceUnitCombobox.sensitive = button.active;
                this._diskSpaceMonitorCombobox.sensitive = button.active;
                this._diskSpaceUnitMeasureCombobox.sensitive = button.active;
            });
            this._diskSpaceWidthSpinbutton.sensitive = this._diskSpaceDisplay.active;
            this._diskSpaceUnitCombobox.sensitive = this._diskSpaceDisplay.active;
            this._diskSpaceMonitorCombobox.sensitive = this._diskSpaceDisplay.active;
            this._diskSpaceUnitMeasureCombobox.sensitive = this._diskSpaceDisplay.active;

            // TreeView
            this._disk_devices_model = new Gtk.ListStore();
            this._disk_devices_model.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN, GObject.TYPE_BOOLEAN]);

            this._diskDevicesTreeView.set_model(this._disk_devices_model);

            let deviceCol = this._diskDevicesTreeView.get_column(0);
            let mountPointCol = this._diskDevicesTreeView.get_column(1);
            let statsCol = this._diskDevicesTreeView.get_column(2);
            let spaceCol = this._diskDevicesTreeView.get_column(3);

            let empty = new Gtk.TreeViewColumn();
            empty.pack_start(new Gtk.CellRendererText(), true);
            this._diskDevicesTreeView.append_column(empty);

            let deviceColText = new Gtk.CellRendererText();
            deviceCol.pack_start(deviceColText, false);
            deviceCol.add_attribute(deviceColText, 'text', 0);

            let mountPointColText = new Gtk.CellRendererText();
            mountPointCol.pack_start(mountPointColText, false);
            mountPointCol.add_attribute(mountPointColText, 'text', 1);

            let statsColToggle = new Gtk.CellRendererToggle();
            statsCol.pack_start(statsColToggle, false);
            statsCol.add_attribute(statsColToggle, 'active', 2);
            statsColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._disk_devices_model.get_iter_from_string(row.toString()); // bool, iter

                this._disk_devices_model.set_value(treeiter[1], 2, !toggle.active);
            });

            let spaceColToggle = new Gtk.CellRendererToggle();
            spaceColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._disk_devices_model.get_iter_from_string(row.toString()); // bool, iter

                this._disk_devices_model.set_value(treeiter[1], 3, !toggle.active);
            });
            spaceCol.pack_start(spaceColToggle, false);
            spaceCol.add_attribute(spaceColToggle, 'active', 3);

            this._disk_devices_model.connect('row-changed', (list, path, iter) => {
                let row = path.get_indices()[0];
                let disksArray = this._settings.get_strv(DISK_DEVICES_LIST);
                disksArray[row] = list.get_value(iter, 0) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 3);
                this._settings.set_strv(DISK_DEVICES_LIST, disksArray);
            });

            this._diskDevicesDisplayAll.connect('state-set', button => {
                // Refresh
                this._readDiskDevices(this._settings, this._disk_devices_model, button.active);
            });

            this._readDiskDevices(this._settings, this._disk_devices_model, this._diskDevicesDisplayAll.active);
        }

        _readDiskDevices(settings, model, all) {
            model.clear();
            // Array format
            // filesystem mountPoint stats space
            // Get current disks settings
            let disksArray = settings.get_strv(DISK_DEVICES_LIST);

            this._executeCommand(['df', '-x', 'squashfs', '-x', 'tmpfs']).then(output => {
                let lines = output.split('\n');

                // Excludes the first line of output
                for (let i = 1; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(/\s+/);

                    let filesystem = entry[0];
                    let mountedOn = entry[5];

                    let dStButton = false;
                    let dSpButton = false;

                    // Init gui
                    for (let i = 0; i < disksArray.length; i++) {
                        let element = disksArray[i];

                        let it = element.split(DISK_DEVICES_LIST_SEPARATOR);

                        if (filesystem === it[0]) {
                            dStButton = (it[2] === 'true');
                            dSpButton = (it[3] === 'true');

                            break;
                        }
                    }

                    model.set(model.append(), [0, 1, 2, 3], [filesystem, mountedOn, dStButton, dSpButton]);
                }

                if (all) {
                    this._loadFile('/proc/diskstats').then(contents => {
                        const lines = ByteArray.toString(contents).split('\n');

                        for (let i = 0; i < lines.length - 1; i++) {
                            const line = lines[i];
                            const entry = line.trim().split(/\s+/);

                            if (entry[2].match(/loop*/)) {
                                continue;
                            }

                            let found = false;
                            const fs = '/dev/' + entry[2];
                            model.foreach((list, path, iter) => {
                                const filesystem = list.get_value(iter, 0);

                                if (fs === filesystem) {
                                    found = true;

                                    return;
                                }
                            });

                            if (found) {
                                // nothing
                            } else {
                                let dStButton = false;
                                let dSpButton = false; // slways false

                                // Init gui
                                for (let i = 0; i < disksArray.length; i++) {
                                    let element = disksArray[i];

                                    let it = element.split(DISK_DEVICES_LIST_SEPARATOR);

                                    if (fs === it[0]) {
                                        dStButton = (it[2] === 'true');
                                        dSpButton = (it[3] === 'true');

                                        break;
                                    }
                                }

                                model.set(model.append(), [0, 1, 2, 3], [fs, '', dStButton, dSpButton]);
                            }
                        }

                        // Save new disksArray with the list of new disks (to remove old disks)
                        disksArray = [];
                        model.foreach((list, path, iter) => {
                            disksArray.push(list.get_value(iter, 0) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 3));
                        });
                        settings.set_strv(DISK_DEVICES_LIST, disksArray);
                    });
                } else {
                    // Save new disksArray with the list of new disks (to remove old disks)
                    disksArray = [];
                    model.foreach((list, path, iter) => {
                        disksArray.push(list.get_value(iter, 0) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + DISK_DEVICES_LIST_SEPARATOR + list.get_value(iter, 3));
                    });
                    settings.set_strv(DISK_DEVICES_LIST, disksArray);
                }
            });
        }

        _buildNet() {
            this._netAutoHide = this._builder.get_object('net_auto_hide');
            this._netUnitCombobox = this._builder.get_object('net_unit_combobox');
            this._netUnitMeasureCombobox = this._builder.get_object('net_unit_measure_combobox');
            this._netEthDisplay = this._builder.get_object('net_eth_display');
            this._netEthWidthSpinbutton = this._builder.get_object('net_eth_width_spinbutton');
            this._netWlanDisplay = this._builder.get_object('net_wlan_display');
            this._netWlanWidthSpinbutton = this._builder.get_object('net_wlan_width_spinbutton');

            this._connectSwitchButton(this._settings, NET_AUTO_HIDE_STATUS, this._netAutoHide);
            this._connectComboBox(this._settings, NET_UNIT, this._netUnitCombobox);
            this._connectComboBox(this._settings, NET_UNIT_MEASURE, this._netUnitMeasureCombobox);
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
            this._thermalCpuDevicesTreeView = this._builder.get_object('thermal_cpu_devices_treeview');
            this._thermalGpuDisplay = this._builder.get_object('thermal_gpu_display');
            this._thermalGpuWidthSpinbutton = this._builder.get_object('thermal_gpu_width_spinbutton');
            this._thermalGpuDevicesTreeView = this._builder.get_object('thermal_gpu_devices_treeview');

            this._connectComboBox(this._settings, THERMAL_TEMPERATURE_UNIT, this._thermalUnitCombobox);
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

            // TreeView
            this._thermalCpuDevicesModel = new Gtk.ListStore();
            this._thermalCpuDevicesModel.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN]);

            this._thermalCpuDevicesTreeView.set_model(this._thermalCpuDevicesModel);

            let cpuDeviceCol = this._thermalCpuDevicesTreeView.get_column(0);
            let cpuNameCol = this._thermalCpuDevicesTreeView.get_column(1);
            let cpuMonitorCol = this._thermalCpuDevicesTreeView.get_column(2);

            let empty = new Gtk.TreeViewColumn();
            empty.pack_start(new Gtk.CellRendererText(), true);
            this._thermalCpuDevicesTreeView.append_column(empty);

            let deviceColText = new Gtk.CellRendererText();
            cpuDeviceCol.pack_start(deviceColText, false);
            cpuDeviceCol.add_attribute(deviceColText, 'text', 0);

            let nameColText = new Gtk.CellRendererText();
            cpuNameCol.pack_start(nameColText, false);
            cpuNameCol.add_attribute(nameColText, 'text', 1);

            let monitorColToggle = new Gtk.CellRendererToggle();
            cpuMonitorCol.pack_start(monitorColToggle, false);
            cpuMonitorCol.add_attribute(monitorColToggle, 'active', 2);
            monitorColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._thermalCpuDevicesModel.get_iter_from_string(row.toString()); // bool, iter

                this._thermalCpuDevicesModel.set_value(treeiter[1], 2, !toggle.active);
            });

            this._thermalCpuDevicesModel.connect('row-changed', (list, path, iter) => {
                let row = path.get_indices()[0];
                let cpuTempsArray = this._settings.get_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST);
                cpuTempsArray[row] = list.get_value(iter, 1) + THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR + list.get_value(iter, 0);
                this._settings.set_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST, cpuTempsArray);
            });

            // Array format
            // name-status-path
            // Get current disks settings
            let cpuTempsArray = this._settings.get_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST);

            // Detect sensors
            //let command = 'for i in /sys/class/hwmon/hwmon*/temp*_input; do echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*})) $(readlink -f $i)"; done';

            this._executeCommand(['bash', '-c', 'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then echo "EXIST"; fi']).then(output => {
                let result = output.split('\n')[0];
                if (result === 'EXIST') {
                    this._executeCommand(['bash', '-c', 'for i in /sys/class/hwmon/hwmon*/temp*_input; do NAME="$(<$(dirname $i)/name)"; if [[ "$NAME" == "coretemp" ]] || [[ "$NAME" == "k10temp" ]]; then echo "$NAME: $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; fi done']).then(output => {
                        let lines = output.split('\n');

                        for (let i = 0; i < lines.length - 1; i++) {
                            let line = lines[i];
                            let entry = line.trim().split(/-/);

                            let device = entry[0];
                            let path = entry[1];

                            let statusButton = false;

                            // Init gui
                            for (let i = 0; i < cpuTempsArray.length; i++) {
                                let element = cpuTempsArray[i];
                                let it = element.split(THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR);

                                if (device === it[0]) {
                                    statusButton = (it[1] === 'true');

                                    break;
                                }
                            }

                            this._thermalCpuDevicesModel.set(this._thermalCpuDevicesModel.append(), [0, 1, 2], [path, device, statusButton]);
                        }

                        // Save new cpuTempsArray with the list of new devices (to remove old devices)
                        cpuTempsArray = [];
                        this._thermalCpuDevicesModel.foreach((list, path, iter) => {
                            cpuTempsArray.push(list.get_value(iter, 1) + THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR + list.get_value(iter, 0));
                        });
                        this._settings.set_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST, cpuTempsArray);
                    });
                }
            });

            // GPU
            this._thermalGpuDevicesModel = new Gtk.ListStore();
            this._thermalGpuDevicesModel.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN]);

            this._thermalGpuDevicesTreeView.set_model(this._thermalGpuDevicesModel);

            let gpuDeviceCol = this._thermalGpuDevicesTreeView.get_column(0);
            let gpuNameCol = this._thermalGpuDevicesTreeView.get_column(1);
            let gpuMonitorCol = this._thermalGpuDevicesTreeView.get_column(2);

            empty = new Gtk.TreeViewColumn();
            empty.pack_start(new Gtk.CellRendererText(), true);
            this._thermalGpuDevicesTreeView.append_column(empty);

            let gpuDeviceColText = new Gtk.CellRendererText();
            gpuDeviceCol.pack_start(gpuDeviceColText, false);
            gpuDeviceCol.add_attribute(gpuDeviceColText, 'text', 0);

            let gpuNameColText = new Gtk.CellRendererText();
            gpuNameCol.pack_start(gpuNameColText, false);
            gpuNameCol.add_attribute(gpuNameColText, 'text', 1);

            let gpuMonitorColToggle = new Gtk.CellRendererToggle();
            gpuMonitorCol.pack_start(gpuMonitorColToggle, false);
            gpuMonitorCol.add_attribute(gpuMonitorColToggle, 'active', 2);
            gpuMonitorColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._thermalGpuDevicesModel.get_iter_from_string(row.toString()); // bool, iter

                this._thermalGpuDevicesModel.set_value(treeiter[1], 2, !toggle.active);
            });

            this._thermalGpuDevicesModel.connect('row-changed', (list, path, iter) => {
                let row = path.get_indices()[0];
                let gpuTempsArray = this._settings.get_strv(THERMAL_GPU_TEMPERATURE_DEVICES_LIST);
                gpuTempsArray[row] = list.get_value(iter, 0) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2);
                this._settings.set_strv(THERMAL_GPU_TEMPERATURE_DEVICES_LIST, gpuTempsArray);
            });

            // Array format
            // uuid:name:status
            // Get current disks settings
            let gpuTempsArray = this._settings.get_strv(THERMAL_GPU_TEMPERATURE_DEVICES_LIST);

            // NVIDIA
            this._executeCommand(['nvidia-smi', '-L']).then(output => {
                let lines = output.split('\n');

                for (let i = 0; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(/:/);

                    let device = entry[0];
                    let name = entry[1].slice(1, -6);
                    let uuid = entry[2].slice(1, -1);

                    let statusButton = false;

                    // Init gui
                    for (let i = 0; i < gpuTempsArray.length; i++) {
                        let element = gpuTempsArray[i];
                        let it = element.split(GPU_DEVICES_LIST_SEPARATOR);

                        if (uuid === it[0]) {
                            statusButton = (it[2] === 'true');

                            break;
                        }
                    }

                    this._thermalGpuDevicesModel.set(this._thermalGpuDevicesModel.append(), [0, 1, 2], [uuid, name, statusButton]);
                }

                // Save new gpuTempsArray with the list of new devices (to remove old devices)
                gpuTempsArray = [];
                this._thermalGpuDevicesModel.foreach((list, path, iter) => {
                    gpuTempsArray.push(list.get_value(iter, 0) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2));
                });
                this._settings.set_strv(THERMAL_GPU_TEMPERATURE_DEVICES_LIST, gpuTempsArray);
            });

            // AMD
            //this._executeCommand(['bash', '-c', 'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then echo "EXIST"; fi']).then(output => {
            //    let result = output.split('\n')[0];
            //    if (result === 'EXIST') {
            //        this._executeCommand(['bash', '-c', 'for i in /sys/class/hwmon/hwmon*/temp*_input; do NAME="$(<$(dirname $i)/name)"; if [[ "$NAME" == "amdgpu" ]]; then echo "$NAME: $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; fi done']).then(output => {
            /*            let lines = output.split('\n');

                        for (let i = 0; i < lines.length - 1; i++) {
                            let line = lines[i];
                            let entry = line.trim().split(/-/);

                            let device = entry[0];
                            let path = entry[1];

                            let statusButton = false;

                            // Init gui
                            for (let i = 0; i < cpuTempsArray.length; i++) {
                                let element = cpuTempsArray[i];
                                let it = element.split(THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR);

                                if (device === it[0]) {
                                    statusButton = (it[1] === 'true');

                                    break;
                                }
                            }

                            this._thermalGpuDevicesModel.set(this._thermalGpuDevicesModel.append(), [0, 1, 2], [uuid, device, statusButton]);
                        }

                        // Save new cpuTempsArray with the list of new devices (to remove old devices)
                        gpuTempsArray = [];
                        this._thermalGpuDevicesModel.foreach((list, path, iter) => {
                            gpuTempsArray.push(list.get_value(iter, 0) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2));
                        });
                        this._settings.set_strv(THERMAL_GPU_TEMPERATURE_DEVICES_LIST, gpuTempsArray);
                    });
                }
            });
            */
        }

        _buildGpu() {
            this._gpuDisplay = this._builder.get_object('gpu_display');
            this._gpuWidthSpinbutton = this._builder.get_object('gpu_width_spinbutton');
            this._gpuMemoryUnitCombobox = this._builder.get_object('gpu_memory_unit_combobox');
            this._gpuMemoryUnitMeasureCombobox = this._builder.get_object('gpu_memory_unit_measure_combobox');
            this._gpuMemoryMonitorCombobox = this._builder.get_object('gpu_memory_monitor_combobox');
            this._gpuDisplayDeviceName = this._builder.get_object('gpu_display_device_name');
            this._gpuDevicesTreeView = this._builder.get_object('gpu_devices_treeview');

            this._connectSwitchButton(this._settings, GPU_STATUS, this._gpuDisplay);
            this._connectSpinButton(this._settings, GPU_WIDTH, this._gpuWidthSpinbutton);
            this._connectComboBox(this._settings, GPU_MEMORY_UNIT, this._gpuMemoryUnitCombobox);
            this._connectComboBox(this._settings, GPU_MEMORY_UNIT_MEASURE, this._gpuMemoryUnitMeasureCombobox);
            this._connectComboBox(this._settings, GPU_MEMORY_MONITOR, this._gpuMemoryMonitorCombobox);
            this._connectSwitchButton(this._settings, GPU_DISPLAY_DEVICE_NAME, this._gpuDisplayDeviceName);

            this._gpuDisplay.connect('state-set', button => {
                this._gpuWidthSpinbutton.sensitive = button.active;
                this._gpuMemoryUnitCombobox.sensitive = button.active;
                this._gpuMemoryUnitMeasureCombobox.sensitive = button.active;
                this._gpuMemoryMonitorCombobox.sensitive = button.active;
                this._gpuDisplayDeviceName.sensitive = button.active;
            });
            this._gpuWidthSpinbutton.sensitive = this._gpuDisplay.active;
            this._gpuMemoryUnitCombobox.sensitive = this._gpuDisplay.active;
            this._gpuMemoryUnitMeasureCombobox.sensitive = this._gpuDisplay.active;
            this._gpuMemoryMonitorCombobox.sensitive = this._gpuDisplay.active;
            this._gpuDisplayDeviceName.sensitive = this._gpuDisplay.active;

            // TreeView
            this._gpuDevicesModel = new Gtk.ListStore();
            this._gpuDevicesModel.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_BOOLEAN, GObject.TYPE_BOOLEAN]);

            this._gpuDevicesTreeView.set_model(this._gpuDevicesModel);

            let gpuDeviceCol = this._gpuDevicesTreeView.get_column(0);
            let gpuNameCol = this._gpuDevicesTreeView.get_column(1);
            let gpuUsageMonitorCol = this._gpuDevicesTreeView.get_column(2);
            let gpuMemoryMonitorCol = this._gpuDevicesTreeView.get_column(3);

            let empty = new Gtk.TreeViewColumn();
            empty.pack_start(new Gtk.CellRendererText(), true);
            this._gpuDevicesTreeView.append_column(empty);

            let gpuDeviceColText = new Gtk.CellRendererText();
            gpuDeviceCol.pack_start(gpuDeviceColText, false);
            gpuDeviceCol.add_attribute(gpuDeviceColText, 'text', 0);

            let gpuNameColText = new Gtk.CellRendererText();
            gpuNameCol.pack_start(gpuNameColText, false);
            gpuNameCol.add_attribute(gpuNameColText, 'text', 1);

            let gpuUsageMonitorColToggle = new Gtk.CellRendererToggle();
            gpuUsageMonitorCol.pack_start(gpuUsageMonitorColToggle, false);
            gpuUsageMonitorCol.add_attribute(gpuUsageMonitorColToggle, 'active', 2);
            gpuUsageMonitorColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._gpuDevicesModel.get_iter_from_string(row.toString()); // bool, iter

                this._gpuDevicesModel.set_value(treeiter[1], 2, !toggle.active);
            });

            let gpuMemoryMonitorColToggle = new Gtk.CellRendererToggle();
            gpuMemoryMonitorCol.pack_start(gpuMemoryMonitorColToggle, false);
            gpuMemoryMonitorCol.add_attribute(gpuMemoryMonitorColToggle, 'active', 3);
            gpuMemoryMonitorColToggle.connect('toggled', (toggle, row) => {
                let treeiter = this._gpuDevicesModel.get_iter_from_string(row.toString()); // bool, iter

                this._gpuDevicesModel.set_value(treeiter[1], 3, !toggle.active);
            });

            this._gpuDevicesModel.connect('row-changed', (list, path, iter) => {
                let row = path.get_indices()[0];
                let gpuDevicesArray = this._settings.get_strv(GPU_DEVICES_LIST);
                gpuDevicesArray[row] = list.get_value(iter, 0) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 3);
                this._settings.set_strv(GPU_DEVICES_LIST, gpuDevicesArray);
            });

            // Array format
            // uuid:name:usage:memory
            // Get current disks settings
            let gpuDevicesArray = this._settings.get_strv(GPU_DEVICES_LIST);

            this._executeCommand(['nvidia-smi', '-L']).then(output => {
                let lines = output.split('\n');

                for (let i = 0; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(/:/);

                    let device = entry[0];
                    let name = entry[1].slice(1, -6);
                    let uuid = entry[2].slice(1, -1);

                    let usageButton = false;
                    let memoryButton = false;

                    // Init gui
                    for (let i = 0; i < gpuDevicesArray.length; i++) {
                        let element = gpuDevicesArray[i];
                        let it = element.split(GPU_DEVICES_LIST_SEPARATOR);

                        if (uuid === it[0]) {
                            usageButton = (it[2] === 'true');
                            memoryButton = (it[3] === 'true');

                            break;
                        }
                    }

                    this._gpuDevicesModel.set(this._gpuDevicesModel.append(), [0, 1, 2, 3], [uuid, name, usageButton, memoryButton]);
                }

                // Save new gpuTempsArray with the list of new devices (to remove old devices)
                gpuDevicesArray = [];
                this._gpuDevicesModel.foreach((list, path, iter) => {
                    gpuDevicesArray.push(list.get_value(iter, 0) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 1) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 2) + GPU_DEVICES_LIST_SEPARATOR + list.get_value(iter, 3));
                });
                this._settings.set_strv(GPU_DEVICES_LIST, gpuDevicesArray);
            });
        }

        _loadContents(file, cancellable = null) {
            return new Promise((resolve, reject) => {
                file.load_contents_async(cancellable, (source_object, res) => {
                    try {
                        const [ok, contents, etag_out] = source_object.load_contents_finish(res);

                        resolve(contents);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        async _loadFile(path, cancellable = null) {
            try {
                const file = Gio.File.new_for_path(path);
                const contents = await this._loadContents(file, cancellable);

                return contents;
            } catch (error) {
                log('[Resource_Monitor] Load File Error (' + error + ')');
            }
        }

        _readOutput(proc, cancellable = null) {
            return new Promise((resolve, reject) => {
                proc.communicate_utf8_async(null, cancellable, (source_object, res) => {
                    try {
                        const [ok, stdout, stderr] = source_object.communicate_utf8_finish(res);

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
                const proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
                const output = await this._readOutput(proc, cancellable);

                return output;
            } catch (error) {
                log('[Resource_Monitor] Execute Command Error (' + error + ')');
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

