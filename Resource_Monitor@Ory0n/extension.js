/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init */

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

const { GObject, St, Gio, Clutter, NM, GLib, Shell } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ByteArray = imports.byteArray;

const Me = ExtensionUtils.getCurrentExtension();
const IndicatorName = Me.metadata.name;

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
const DISK_DEVICES_LIST_SEPARATOR = ' ';

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
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR = '-';

const ResourceMonitor = GObject.registerClass(
    class ResourceMonitor extends PanelMenu.Button {
        _init(settings) {
            super._init(0.0, _(IndicatorName));

            this._settings = settings;

            // Variables
            this._handlerIds = [];
            this._handlerIdsCount = 0;

            this._nmEthStatus = false;
            this._nmWlanStatus = false;

            this._cpuTotOld = 0;
            this._cpuIdleOld = 0;

            this._duTotEthOld = [0, 0];
            this._ethIdleOld = 0;

            this._duTotWlanOld = [0, 0];
            this._wlanIdleOld = 0;

            this._cpuTemperatures = 0;
            this._cpuTemperaturesReads = 0;

            this._createMainGui();

            this._initSettings();

            this._buildMainGui();

            this._connectSettingsSignals();

            this.connect('button-press-event', this._clickManager.bind(this));

            NM.Client.new_async(null, (client) => {
                client.connect('active-connection-added', this._onActiveConnectionAdded.bind(this));
                client.connect('active-connection-removed', this._onActiveConnectionRemoved.bind(this));

                this._onActiveConnectionRemoved(client);
            });

            this._mainTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._refreshTime, this._refreshHandler.bind(this));
            this._refreshHandler();
        }

        destroy() {
            if (this._mainTimer) {
                GLib.source_remove(this._mainTimer);
                this._mainTimer = null;
            }

            for (let i = 0; i < this._handlerIdsCount; i++) {
                this._settings.disconnect(this._handlerIds[i]);
                this._handlerIds[i] = 0;
            }

            super.destroy();
        }

        // GUI
        _createMainGui() {
            this._box = new St.BoxLayout();

            // Icon
            this._cpuIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/cpu-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._ramIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/ram-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._swapIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/swap-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._diskStatsIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/disk-stats-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._diskSpaceIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/disk-space-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._ethIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/eth-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this._wlanIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/wlan-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            // Unit
            this._cpuTemperatureUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '°C'
            });
            this._cpuTemperatureUnit.set_style('padding-left: 0.125em;');

            this._cpuFrequencyUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'MHz'
            });
            this._cpuFrequencyUnit.set_style('padding-left: 0.125em;');

            this._cpuUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '%'
            });
            this._cpuUnit.set_style('padding-left: 0.125em;');

            this._ramUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: this._ramUnitType ? '%' : 'MB'
            });
            this._ramUnit.set_style('padding-left: 0.125em;');

            this._swapUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: this._swapUnitType ? '%' : 'MB'
            });
            this._swapUnit.set_style('padding-left: 0.125em;');

            this._ethUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K'
            });
            this._ethUnit.set_style('padding-left: 0.125em;');

            this._wlanUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K'
            });
            this._wlanUnit.set_style('padding-left: 0.125em;');

            // Value
            this._cpuValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--'
            });
            this._cpuValue.set_style('text-align: right;');

            this._ramValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--'
            });
            this._ramValue.set_style('text-align: right;');

            this._swapValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--'
            });
            this._swapValue.set_style('text-align: right;');

            this._diskStatsBox = new DiskContainerStats();
            this._diskSpaceBox = new DiskContainerSpace();

            this._ethValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--'
            });
            this._ethValue.set_style('text-align: right;');

            this._wlanValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--'
            });
            this._wlanValue.set_style('text-align: right;');

            this._cpuTemperatureValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '[--'
            });
            this._cpuTemperatureValueBracket = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ']'
            });
            this._cpuTemperatureValue.set_style('text-align: right;');

            this._cpuFrequencyValue = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '[--'
            });
            this._cpuFrequencyValueBracket = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ']'
            });
            this._cpuFrequencyValue.set_style('text-align: right;');
        }

        _buildMainGui() {
            // Apply prefs settings
            this._refreshGui();

            switch (this._iconsPosition) {
                case 'left':
                    this._box.add(this._cpuIcon);
                    this._box.add(this._cpuValue);
                    this._box.add(this._cpuUnit);

                    this._box.add(this._cpuTemperatureValue);
                    this._box.add(this._cpuTemperatureUnit);
                    this._box.add(this._cpuTemperatureValueBracket);
                    this._box.add(this._cpuFrequencyValue);
                    this._box.add(this._cpuFrequencyUnit);
                    this._box.add(this._cpuFrequencyValueBracket);

                    this._box.add(this._ramIcon);
                    this._box.add(this._ramValue);
                    this._box.add(this._ramUnit);

                    this._box.add(this._swapIcon);
                    this._box.add(this._swapValue);
                    this._box.add(this._swapUnit);

                    this._box.add(this._diskStatsIcon);
                    this._box.add(this._diskStatsBox);

                    this._box.add(this._diskSpaceIcon);
                    this._box.add(this._diskSpaceBox);

                    this._box.add(this._ethIcon);
                    this._box.add(this._ethValue);
                    this._box.add(this._ethUnit);

                    this._box.add(this._wlanIcon);
                    this._box.add(this._wlanValue);
                    this._box.add(this._wlanUnit);

                    break;

                case 'right':

                default:
                    this._box.add(this._cpuValue);
                    this._box.add(this._cpuUnit);

                    this._box.add(this._cpuTemperatureValue);
                    this._box.add(this._cpuTemperatureUnit);
                    this._box.add(this._cpuTemperatureValueBracket);
                    this._box.add(this._cpuFrequencyValue);
                    this._box.add(this._cpuFrequencyUnit);
                    this._box.add(this._cpuFrequencyValueBracket);
                    this._box.add(this._cpuIcon);

                    this._box.add(this._ramValue);
                    this._box.add(this._ramUnit);
                    this._box.add(this._ramIcon);

                    this._box.add(this._swapValue);
                    this._box.add(this._swapUnit);
                    this._box.add(this._swapIcon);

                    this._box.add(this._diskStatsBox);
                    this._box.add(this._diskStatsIcon);
                    this._box.add(this._diskSpaceBox);
                    this._box.add(this._diskSpaceIcon);

                    this._box.add(this._ethValue);
                    this._box.add(this._ethUnit);
                    this._box.add(this._ethIcon);

                    this._box.add(this._wlanValue);
                    this._box.add(this._wlanUnit);
                    this._box.add(this._wlanIcon);

                    break;
            }

            this.add_child(this._box);
        }

        // SETTINGS
        _initSettings() {
            this._refreshTime = this._settings.get_int(REFRESH_TIME);
            this._decimalsStatus = this._settings.get_boolean(DECIMALS_STATUS);
            this._leftClickStatus = this._settings.get_string(LEFT_CLICK_STATUS);
            this._rightClickStatus = this._settings.get_boolean(RIGHT_CLICK_STATUS);

            this._iconsStatus = this._settings.get_boolean(ICONS_STATUS);
            this._iconsPosition = this._settings.get_string(ICONS_POSITION);

            this._cpuStatus = this._settings.get_boolean(CPU_STATUS);
            this._cpuWidth = this._settings.get_int(CPU_WIDTH);
            this._cpuFrequencyStatus = this._settings.get_boolean(CPU_FREQUENCY_STATUS);
            this._cpuFrequencyWidth = this._settings.get_int(CPU_FREQUENCY_WIDTH);

            this._ramStatus = this._settings.get_boolean(RAM_STATUS);
            this._ramWidth = this._settings.get_int(RAM_WIDTH);
            this._ramUnitType = this._settings.get_string(RAM_UNIT);
            this._ramMonitor = this._settings.get_string(RAM_MONITOR);

            this._swapStatus = this._settings.get_boolean(SWAP_STATUS);
            this._swapWidth = this._settings.get_int(SWAP_WIDTH);
            this._swapUnitType = this._settings.get_string(SWAP_UNIT);
            this._swapMonitor = this._settings.get_string(SWAP_MONITOR);

            this._diskStatsStatus = this._settings.get_boolean(DISK_STATS_STATUS);
            this._diskStatsWidth = this._settings.get_int(DISK_STATS_WIDTH);
            this._diskStatsMode = this._settings.get_string(DISK_STATS_MODE);
            this._diskSpaceStatus = this._settings.get_boolean(DISK_SPACE_STATUS);
            this._diskSpaceWidth = this._settings.get_int(DISK_SPACE_WIDTH);
            this._diskSpaceUnitType = this._settings.get_string(DISK_SPACE_UNIT);
            this._diskSpaceMonitor = this._settings.get_string(DISK_SPACE_MONITOR);
            this._diskDeviceslist = this._settings.get_strv(DISK_DEVICES_LIST);

            this._netAutoHideStatus = this._settings.get_boolean(NET_AUTO_HIDE_STATUS);
            this._netUnit = this._settings.get_string(NET_UNIT);
            this._netEthStatus = this._settings.get_boolean(NET_ETH_STATUS);
            this._netEthWidth = this._settings.get_int(NET_ETH_WIDTH);
            this._netWlanStatus = this._settings.get_boolean(NET_WLAN_STATUS);
            this._netWlanWidth = this._settings.get_int(NET_WLAN_WIDTH);

            this._thermalCpuTemperatureStatus = this._settings.get_boolean(THERMAL_CPU_TEMPERATURE_STATUS);
            this._thermalCpuTemperatureWidth = this._settings.get_int(THERMAL_CPU_TEMPERATURE_WIDTH);
            this._thermalCpuTemperatureUnit = this._settings.get_string(THERMAL_CPU_TEMPERATURE_UNIT);
            this._thermalCpuTemperatureDevicesList = this._settings.get_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST);
        }

        _connectSettingsSignals() {
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${REFRESH_TIME}`, this._refreshTimeChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DECIMALS_STATUS}`, this._decimalsStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${LEFT_CLICK_STATUS}`, this._leftClickStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${RIGHT_CLICK_STATUS}`, this._rightClickStatusChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${ICONS_STATUS}`, this._iconsStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${ICONS_POSITION}`, this._iconsPositionChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${CPU_STATUS}`, this._cpuStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${CPU_WIDTH}`, this._cpuWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${CPU_FREQUENCY_STATUS}`, this._cpuFrequencyStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${CPU_FREQUENCY_WIDTH}`, this._cpuFrequencyWidthChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${RAM_STATUS}`, this._ramStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${RAM_WIDTH}`, this._ramWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${RAM_UNIT}`, this._ramUnitTypeChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${RAM_MONITOR}`, this._ramMonitorChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${SWAP_STATUS}`, this._swapStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${SWAP_WIDTH}`, this._swapWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${SWAP_UNIT}`, this._swapUnitTypeChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${SWAP_MONITOR}`, this._swapMonitorChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_STATS_STATUS}`, this._diskStatsStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_STATS_WIDTH}`, this._diskStatsWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_STATS_MODE}`, this._diskStatsModeChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_SPACE_STATUS}`, this._diskSpaceStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_SPACE_WIDTH}`, this._diskSpaceWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_SPACE_UNIT}`, this._diskSpaceUnitTypeChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_SPACE_MONITOR}`, this._diskSpaceMonitorChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${DISK_DEVICES_LIST}`, this._diskDevicesListChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_AUTO_HIDE_STATUS}`, this._netAutoHideStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_UNIT}`, this._netUnitChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_ETH_STATUS}`, this._netEthStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_ETH_WIDTH}`, this._netEthWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_WLAN_STATUS}`, this._netWlanStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${NET_WLAN_WIDTH}`, this._netWlanWidthChanged.bind(this));

            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${THERMAL_CPU_TEMPERATURE_STATUS}`, this._thermalCpuTemperatureStatusChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${THERMAL_CPU_TEMPERATURE_WIDTH}`, this._thermalCpuTemperatureWidthChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${THERMAL_CPU_TEMPERATURE_UNIT}`, this._thermalCpuTemperatureUnitChanged.bind(this));
            this._handlerIds[this._handlerIdsCount++] = this._settings.connect(`changed::${THERMAL_CPU_TEMPERATURE_DEVICES_LIST}`, this._thermalCpuTemperatureDevicesListChanged.bind(this));
        }

        // HANDLERS
        _clickManager(actor, event) {
            switch (event.get_button()) {
                case 3: // Right Click
                    if (this._rightClickStatus) {
                        ExtensionUtils.openPrefs();
                    }

                    break;

                case 1: // Left Click

                default:
                    if (this._leftClickStatus !== "") {
                        let app = global.log(Shell.AppSystem.get_default().lookup_app(this._leftClickStatus + '.desktop'));

                        if (app != null) {
                            app.activate();
                        } else {
                            Util.spawn([this._leftClickStatus]);
                        }
                    }

                    break;
            }
        }

        _onActiveConnectionAdded(client, activeConnection) {
            activeConnection.get_devices().forEach(device => {
                switch (device.get_device_type()) {
                    case NM.DeviceType.ETHERNET:
                        this._nmEthStatus = true;

                        break;

                    case NM.DeviceType.WIFI:
                        this._nmWlanStatus = true;

                        break;

                    default:

                        break;
                }
            });

            this._basicItemStatus((this._netEthStatus && this._nmEthStatus) || (this._netEthStatus && !this._netAutoHideStatus), true, this._ethIcon, this._ethValue, this._ethUnit);
            this._basicItemStatus((this._netWlanStatus && this._nmWlanStatus) || (this._netWlanStatus && !this._netAutoHideStatus), true, this._wlanIcon, this._wlanValue, this._wlanUnit);
        }

        _onActiveConnectionRemoved(client, activeConnection) {
            this._nmEthStatus = false;
            this._nmWlanStatus = false;

            client.get_active_connections().forEach(activeConnection => {
                activeConnection.get_devices().forEach(device => {
                    switch (device.get_device_type()) {
                        case NM.DeviceType.ETHERNET:
                            this._nmEthStatus = true;

                            break;

                        case NM.DeviceType.WIFI:
                            this._nmWlanStatus = true;

                            break;

                        default:

                            break;
                    }
                });
            });

            this._basicItemStatus((this._netEthStatus && this._nmEthStatus) || (this._netEthStatus && !this._netAutoHideStatus), true, this._ethIcon, this._ethValue, this._ethUnit);
            this._basicItemStatus((this._netWlanStatus && this._nmWlanStatus) || (this._netWlanStatus && !this._netAutoHideStatus), true, this._wlanIcon, this._wlanValue, this._wlanUnit);
        }

        _refreshTimeChanged() {
            this._refreshTime = this._settings.get_int(REFRESH_TIME);

            if (this._mainTimer) {
                GLib.source_remove(this._mainTimer);
                this._mainTimer = null;
            }

            this._mainTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._refreshTime, this._refreshHandler.bind(this));
        }

        _decimalsStatusChanged() {
            this._decimalsStatus = this._settings.get_boolean(DECIMALS_STATUS);

            this._refreshHandler();
        }

        _leftClickStatusChanged() {
            this._leftClickStatus = this._settings.get_string(LEFT_CLICK_STATUS);
        }

        _rightClickStatusChanged() {
            this._rightClickStatus = this._settings.get_boolean(RIGHT_CLICK_STATUS);
        }

        _iconsStatusChanged() {
            this._iconsStatus = this._settings.get_boolean(ICONS_STATUS);

            if (this._iconsStatus) {
                if (this._cpuStatus) {
                    this._cpuIcon.show();
                }
                if (this._ramStatus) {
                    this._ramIcon.show();
                }
                if (this._swapStatus) {
                    this._swapIcon.show();
                }
                if (this._diskStatsStatus) {
                    this._diskStatsIcon.show();
                }
                if (this._diskSpaceStatus) {
                    this._diskSpaceIcon.show();
                }
                if ((this._netEthStatus && this._nmEthStatus) || (this._netEthStatus && !this._netAutoHideStatus)) {
                    this._ethIcon.show();
                }
                if ((this._netWlanStatus && this._nmWlanStatus) || (this._netWlanStatus && !this._netAutoHideStatus)) {
                    this._wlanIcon.show();
                }
            } else {
                this._cpuIcon.hide();
                this._ramIcon.hide();
                this._swapIcon.hide();
                this._diskStatsIcon.hide();
                this._diskSpaceIcon.hide();
                this._ethIcon.hide();
                this._wlanIcon.hide();
            }
        }

        _iconsPositionChanged() {
            this._iconsPosition = this._settings.get_string(ICONS_POSITION);

            this._box.remove_all_children();

            this._buildMainGui();
        }

        _cpuStatusChanged() {
            this._cpuStatus = this._settings.get_boolean(CPU_STATUS);

            this._basicItemStatus(this._cpuStatus, (!this._thermalCpuTemperatureStatus && !this._cpuFrequencyStatus), this._cpuIcon, this._cpuValue, this._cpuUnit);
        }

        _cpuWidthChanged() {
            this._cpuWidth = this._settings.get_int(CPU_WIDTH);

            this._basicItemWidth(this._cpuWidth, this._cpuValue);
        }

        _cpuFrequencyStatusChanged() {
            this._cpuFrequencyStatus = this._settings.get_boolean(CPU_FREQUENCY_STATUS);

            this._basicItemStatus(this._cpuFrequencyStatus, (!this._cpuStatus && !this._thermalCpuTemperatureStatus), this._cpuIcon, this._cpuFrequencyValue, this._cpuFrequencyUnit, this._cpuFrequencyValueBracket);
        }

        _cpuFrequencyWidthChanged() {
            this._cpuFrequencyWidth = this._settings.get_int(CPU_FREQUENCY_WIDTH);

            this._basicItemWidth(this._cpuFrequencyWidth, this._cpuFrequencyValue);
        }

        _ramStatusChanged() {
            this._ramStatus = this._settings.get_boolean(RAM_STATUS);

            this._basicItemStatus(this._ramStatus, true, this._ramIcon, this._ramValue, this._ramUnit);
        }

        _ramWidthChanged() {
            this._ramWidth = this._settings.get_int(RAM_WIDTH);

            this._basicItemWidth(this._ramWidth, this._ramValue);
        }

        _ramUnitTypeChanged() {
            this._ramUnitType = this._settings.get_string(RAM_UNIT);

            if (this._ramStatus) {
                this._refreshRamValue();
            }
        }

        _ramMonitorChanged() {
            this._ramMonitor = this._settings.get_string(RAM_MONITOR);

            if (this._ramStatus) {
                this._refreshRamValue();
            }
        }

        _swapStatusChanged() {
            this._swapStatus = this._settings.get_boolean(SWAP_STATUS);

            this._basicItemStatus(this._swapStatus, true, this._swapIcon, this._swapValue, this._swapUnit);
        }

        _swapWidthChanged() {
            this._swapWidth = this._settings.get_int(SWAP_WIDTH);

            this._basicItemWidth(this._swapWidth, this._swapValue);
        }

        _swapUnitTypeChanged() {
            this._swapUnitType = this._settings.get_string(SWAP_UNIT);

            if (this._swapStatus) {
                this._refreshSwapValue();
            }
        }

        _swapMonitorChanged() {
            this._swapMonitor = this._settings.get_string(SWAP_MONITOR);

            if (this._swapStatus) {
                this._refreshSwapValue();
            }
        }

        _diskStatsStatusChanged() {
            this._diskStatsStatus = this._settings.get_boolean(DISK_STATS_STATUS);

            this._basicItemStatus(this._diskStatsStatus, true, this._diskStatsIcon, this._diskStatsBox);
        }

        _diskStatsWidthChanged() {
            this._diskStatsWidth = this._settings.get_int(DISK_STATS_WIDTH);

            this._diskStatsBox.set_element_width(this._diskStatsWidth);
        }

        _diskStatsModeChanged() {
            this._diskStatsMode = this._settings.get_string(DISK_STATS_MODE);

            this._diskStatsBox.update_mode(this._diskStatsMode);
        }

        _diskSpaceStatusChanged() {
            this._diskSpaceStatus = this._settings.get_boolean(DISK_SPACE_STATUS);

            this._basicItemStatus(this._diskSpaceStatus, true, this._diskSpaceIcon, this._diskSpaceBox);
        }

        _diskSpaceWidthChanged() {
            this._diskSpaceWidth = this._settings.get_int(DISK_SPACE_WIDTH);

            this._diskSpaceBox.set_element_width(this._diskSpaceWidth);
        }

        _diskSpaceUnitTypeChanged() {
            this._diskSpaceUnitType = this._settings.get_string(DISK_SPACE_UNIT);

            if (this._diskSpaceStatus) {
                this._refreshDiskSpaceValue();
            }
        }

        _diskSpaceMonitorChanged() {
            this._diskSpaceMonitor = this._settings.get_string(DISK_SPACE_MONITOR);

            if (this._diskSpaceStatus) {
                this._refreshDiskSpaceValue();
            }
        }

        _diskDevicesListChanged() {
            this._diskDeviceslist = this._settings.get_strv(DISK_DEVICES_LIST);

            this._diskStatsBox.cleanup_elements();
            this._diskSpaceBox.cleanup_elements();

            this._diskDeviceslist.forEach(element => {
                const it = element.split(DISK_DEVICES_LIST_SEPARATOR);

                const filesystem = it[0];
                const mountPoint = it[1];
                const stats = (it[2] === 'true');
                const space = (it[3] === 'true');

                let label = '';

                if (filesystem.match(/(\/\w+)+/)) {
                    label = filesystem.split('/').pop();
                } else {
                    label = filesystem;
                }

                if (stats) {
                    this._diskStatsBox.add_element(filesystem, label);
                }

                if (space) {
                    this._diskSpaceBox.add_element(filesystem, label);
                }
            });

            this._diskStatsBox.add_single();
            this._diskStatsBox.update_mode(this._diskStatsMode);

            this._diskStatsBox.set_element_width(this._diskStatsWidth);
            this._diskSpaceBox.set_element_width(this._diskSpaceWidth);
        }

        _netAutoHideStatusChanged() {
            this._netAutoHideStatus = this._settings.get_boolean(NET_AUTO_HIDE_STATUS);

            this._basicItemStatus((this._netEthStatus && this._nmEthStatus) || (this._netEthStatus && !this._netAutoHideStatus), true, this._ethIcon, this._ethValue, this._ethUnit);
            this._basicItemStatus((this._netWlanStatus && this._nmWlanStatus) || (this._netWlanStatus && !this._netAutoHideStatus), true, this._wlanIcon, this._wlanValue, this._wlanUnit);
        }

        _netUnitChanged() {
            this._netUnit = this._settings.get_string(NET_UNIT);

            if (this._netEthStatus) {
                this._refreshEthValue();
            }
            if (this._netWlanStatus) {
                this._refreshWlanValue();
            }
        }

        _netEthStatusChanged() {
            this._netEthStatus = this._settings.get_boolean(NET_ETH_STATUS);

            this._basicItemStatus((this._netEthStatus && this._nmEthStatus) || (this._netEthStatus && !this._netAutoHideStatus), true, this._ethIcon, this._ethValue, this._ethUnit);
        }

        _netEthWidthChanged() {
            this._netEthWidth = this._settings.get_int(NET_ETH_WIDTH);

            this._basicItemWidth(this._netEthWidth, this._ethValue);
        }

        _netWlanStatusChanged() {
            this._netWlanStatus = this._settings.get_boolean(NET_WLAN_STATUS);

            this._basicItemStatus((this._netWlanStatus && this._nmWlanStatus) || (this._netWlanStatus && !this._netAutoHideStatus), true, this._wlanIcon, this._wlanValue, this._wlanUnit);
        }

        _netWlanWidthChanged() {
            this._netWlanWidth = this._settings.get_int(NET_WLAN_WIDTH);

            this._basicItemWidth(this._netWlanWidth, this._wlanValue);
        }

        _thermalCpuTemperatureStatusChanged() {
            this._thermalCpuTemperatureStatus = this._settings.get_boolean(THERMAL_CPU_TEMPERATURE_STATUS);

            this._basicItemStatus(this._thermalCpuTemperatureStatus, (!this._cpuStatus && !this._cpuFrequencyStatus), this._cpuIcon, this._cpuTemperatureValue, this._cpuTemperatureUnit, this._cpuTemperatureValueBracket);
        }

        _thermalCpuTemperatureWidthChanged() {
            this._thermalCpuTemperatureWidth = this._settings.get_int(THERMAL_CPU_TEMPERATURE_WIDTH);

            this._basicItemWidth(this._thermalCpuTemperatureWidth, this._cpuTemperatureValue);
        }

        _thermalCpuTemperatureUnitChanged() {
            this._thermalCpuTemperatureUnit = this._settings.get_string(THERMAL_CPU_TEMPERATURE_UNIT);

            if (this._thermalCpuTemperatureStatus) {
                this._refreshCpuTemperatureValue();
            }
        }

        _thermalCpuTemperatureDevicesListChanged() {
            this._thermalCpuTemperatureDevicesList = this._settings.get_strv(THERMAL_CPU_TEMPERATURE_DEVICES_LIST);

            if (this._thermalCpuTemperatureStatus) {
                this._refreshCpuTemperatureValue();
            }
        }

        _refreshHandler() {
            if (this._cpuStatus) {
                this._refreshCpuValue();
            }
            if (this._ramStatus) {
                this._refreshRamValue();
            }
            if (this._swapStatus) {
                this._refreshSwapValue();
            }
            if (this._diskStatsStatus) {
                this._refreshDiskStatsValue();
            }
            if (this._diskSpaceStatus) {
                this._refreshDiskSpaceValue();
            }
            if (this._netEthStatus) {
                this._refreshEthValue();
            }
            if (this._netWlanStatus) {
                this._refreshWlanValue();
            }
            if (this._cpuFrequencyStatus) {
                this._refreshCpuFrequencyValue();
            }
            if (this._thermalCpuTemperatureStatus) {
                this._refreshCpuTemperatureValue();
            }

            return GLib.SOURCE_CONTINUE;
        }

        _refreshGui() {
            //this._onActiveConnectionAdded(client, activeConnection);

            //this._onActiveConnectionRemoved(client, activeConnection);

            //this._refreshTimeChanged();

            //this._decimalsStatusChanged();

            //this._leftClickStatusChanged();

            this._rightClickStatusChanged();

            this._iconsStatusChanged();

            //this._iconsPositionChanged();

            this._cpuStatusChanged();

            this._cpuWidthChanged();

            this._cpuFrequencyStatusChanged();

            this._cpuFrequencyWidthChanged();

            this._ramStatusChanged();

            this._ramWidthChanged();

            //this._ramUnitTypeChanged();

            //this._ramMonitorChanged();

            this._swapStatusChanged();

            this._swapWidthChanged();

            //this._swapUnitTypeChanged();

            //this._swapMonitorChanged();

            this._diskStatsStatusChanged();

            this._diskStatsWidthChanged();

            this._diskStatsModeChanged();

            this._diskSpaceStatusChanged();

            this._diskSpaceWidthChanged();

            //this._diskSpaceUnitTypeChanged();

            //this._diskSpaceMonitorChanged();

            this._diskDevicesListChanged();

            //this._netAutoHideStatusChanged();

            //this._netUnitChanged();

            this._netEthStatusChanged();

            this._netEthWidthChanged();

            this._netWlanStatusChanged();

            this._netWlanWidthChanged();

            this._thermalCpuTemperatureStatusChanged();

            this._thermalCpuTemperatureWidthChanged();

            //this._thermalCpuTemperatureUnitChanged();

            //this._thermalCpuTemperatureDevicesListChanged();
        }

        _refreshCpuValue() {
            this._loadFile('/proc/stat').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                const entry = lines[0].trim().split(/\s+/);
                let cpuTot = 0;
                const idle = parseInt(entry[4]);

                // user sys nice idle iowait
                for (let i = 1; i < 5; i++)
                    cpuTot += parseInt(entry[i]);

                const delta = cpuTot - this._cpuTotOld;
                const deltaIdle = idle - this._cpuIdleOld;

                const cpuCurr = 100 * (delta - deltaIdle) / delta;

                this._cpuTotOld = cpuTot;
                this._cpuIdleOld = idle;

                if (this._decimalsStatus) {
                    this._cpuValue.text = `${cpuCurr.toFixed(1)}`;
                } else {
                    this._cpuValue.text = `${cpuCurr.toFixed(0)}`;
                }
            });
        }

        _refreshRamValue() {
            this._loadFile('/proc/meminfo').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                let total, available, used;

                for (let i = 0; i < 3; i++) {
                    const line = lines[i];
                    let values;

                    if (line.match(/^MemTotal/)) {
                        values = line.match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);
                        total = parseInt(values[1]);
                    } else if (line.match(/^MemAvailable/)) {
                        values = line.match(/^MemAvailable:\s*([^ ]*)\s*([^ ]*)$/);
                        available = parseInt(values[1]);
                    }
                }

                used = total - available;

                let value = 0;
                switch (this._ramMonitor) {
                    case 'free':
                        value = available;

                        break;

                    case 'used':

                    default:
                        value = used;

                        break;
                }

                switch (this._ramUnitType) {
                    case 'perc':
                        if (this._decimalsStatus) {
                            this._ramValue.text = `${(100 * value / total).toFixed(1)}`;
                        } else {
                            this._ramValue.text = `${(100 * value / total).toFixed(0)}`;
                        }

                        this._ramUnit.text = '%';

                        break;

                    case 'numeric':

                    default:
                        let unit = 'MB';

                        value /= 1024;
                        if (value > 1024) {
                            unit = 'GB';
                            value /= 1024;
                            if (value > 1024) {
                                unit = 'TB';
                                value /= 1024;
                            }
                        } else {
                            unit = 'MB';
                        }

                        if (this._decimalsStatus) {
                            this._ramValue.text = `${value.toFixed(1)}`;
                        } else {
                            this._ramValue.text = `${value.toFixed(0)}`;
                        }

                        this._ramUnit.text = unit;

                        break;
                }
            });
        }

        _refreshSwapValue() {
            this._loadFile('/proc/meminfo').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                let total, available, used;

                for (let i = 0; i < 16; i++) {
                    const line = lines[i];
                    let values;

                    if (line.match(/^SwapTotal/)) {
                        values = line.match(/^SwapTotal:\s*([^ ]*)\s*([^ ]*)$/);
                        total = parseInt(values[1]);
                    } else if (line.match(/^SwapFree/)) {
                        values = line.match(/^SwapFree:\s*([^ ]*)\s*([^ ]*)$/);
                        available = parseInt(values[1]);
                    }
                }

                used = total - available;

                let value = 0;
                switch (this._swapMonitor) {
                    case 'free':
                        value = available;

                        break;

                    case 'used':

                    default:
                        value = used;

                        break;
                }

                switch (this._swapUnitType) {
                    case 'perc':
                        if (this._decimalsStatus) {
                            this._swapValue.text = `${(100 * value / total).toFixed(1)}`;
                        } else {
                            this._swapValue.text = `${(100 * value / total).toFixed(0)}`;
                        }

                        this._swapUnit.text = '%';

                        break;

                    case 'numeric':

                    default:
                        let unit = 'MB';

                        value /= 1024;
                        if (value > 1024) {
                            unit = 'GB';
                            value /= 1024;
                            if (value > 1024) {
                                unit = 'TB';
                                value /= 1024;
                            }
                        } else {
                            unit = 'MB';
                        }

                        if (this._decimalsStatus) {
                            this._swapValue.text = `${value.toFixed(1)}`;
                        } else {
                            this._swapValue.text = `${value.toFixed(0)}`;
                        }

                        this._swapUnit.text = unit;

                        break;
                }
            });
        }

        _refreshDiskStatsValue() {
            this._loadFile('/proc/diskstats').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                switch (this._diskStatsMode) {
                    case 'single':
                        let rwTot = [0, 0];
                        let rw = [0, 0];

                        const filesystem = 'single';

                        for (let i = 0; i < lines.length - 1; i++) {
                            const line = lines[i];
                            const entry = line.trim().split(/\s+/);

                            if (entry[2].match(/loop*/)) {
                                continue;
                            }

                            // Found
                            if (this._diskStatsBox.get_filesystem(entry[2])) {
                                rwTot[0] += parseInt(entry[5]);
                                rwTot[1] += parseInt(entry[9]);
                            }
                        }

                        const idle = GLib.get_monotonic_time() / 1000;
                        const delta = (idle - this._diskStatsBox.get_idle(filesystem)) / 1000;
                        this._diskStatsBox.set_idle(filesystem, idle);

                        let unit = '';

                        if (delta > 0) {
                            const rwTotOld = this._diskStatsBox.get_rw_tot(filesystem);
                            for (let i = 0; i < 2; i++) {
                                rw[i] = (rwTot[i] - rwTotOld[i]) / delta;
                            }
                            this._diskStatsBox.set_rw_tot(filesystem, rwTot);

                            if (rw[0] > 1024 || rw[1] > 1024) {
                                unit = 'M';
                                rw[0] /= 1024;
                                rw[1] /= 1024;
                                if (rw[0] > 1024 || rw[1] > 1024) {
                                    unit = 'G';
                                    rw[0] /= 1024;
                                    rw[1] /= 1024;
                                }
                            } else {
                                unit = 'K';
                            }
                        }

                        if (this._decimalsStatus) {
                            this._diskStatsBox.update_element_value(filesystem, `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`, unit);
                        } else {
                            this._diskStatsBox.update_element_value(filesystem, `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`, unit);
                        }

                        break;

                    case 'multiple':

                    default:
                        for (let i = 0; i < lines.length - 1; i++) {
                            const line = lines[i];
                            const entry = line.trim().split(/\s+/);

                            if (entry[2].match(/loop*/)) {
                                continue;
                            }

                            const filesystem = this._diskStatsBox.get_filesystem(entry[2]);
                            // Found
                            if (filesystem) {
                                let rwTot = [0, 0];
                                let rw = [0, 0];

                                rwTot[0] += parseInt(entry[5]);
                                rwTot[1] += parseInt(entry[9]);

                                const idle = GLib.get_monotonic_time() / 1000;
                                const delta = (idle - this._diskStatsBox.get_idle(filesystem)) / 1000;
                                this._diskStatsBox.set_idle(filesystem, idle);

                                let unit = '';

                                if (delta > 0) {
                                    const rwTotOld = this._diskStatsBox.get_rw_tot(filesystem);
                                    for (let i = 0; i < 2; i++) {
                                        rw[i] = (rwTot[i] - rwTotOld[i]) / delta;
                                    }
                                    this._diskStatsBox.set_rw_tot(filesystem, rwTot);

                                    if (rw[0] > 1024 || rw[1] > 1024) {
                                        unit = 'M';
                                        rw[0] /= 1024;
                                        rw[1] /= 1024;
                                        if (rw[0] > 1024 || rw[1] > 1024) {
                                            unit = 'G';
                                            rw[0] /= 1024;
                                            rw[1] /= 1024;
                                        }
                                    } else {
                                        unit = 'K';
                                    }
                                }

                                if (this._decimalsStatus) {
                                    this._diskStatsBox.update_element_value(filesystem, `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`, unit);
                                } else {
                                    this._diskStatsBox.update_element_value(filesystem, `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`, unit);
                                }
                            } else { // Not found
                                this._diskStatsBox.update_element_value(filesystem, '--|--', '');
                            }
                        }

                        break;
                }
            });
        }

        _refreshDiskSpaceValue() {
            this._executeCommand(['df', '-x', 'squashfs', '-x', 'tmpfs']).then(output => {
                const lines = output.split('\n');

                // Excludes the first line of output
                for (let i = 1; i < lines.length - 1; i++) {
                    const line = lines[i];
                    const entry = line.trim().split(/\s+/);

                    const filesystem = entry[0];

                    let value = '';
                    switch (this._diskSpaceUnitType) {
                        case 'perc':
                            const used = `${entry[4].slice(0, -1)}`;

                            switch (this._diskSpaceMonitor) {
                                case 'free':
                                    value = (100 - parseInt(used)).toString();

                                    break;

                                case 'used':

                                default:
                                    value = used;

                                    break;
                            }

                            this._diskSpaceBox.update_element_value(filesystem, value, '%');

                            break;

                        case 'numeric':

                        default:
                            switch (this._diskSpaceMonitor) {
                                case 'free':
                                    value = parseInt(entry[3]);

                                    break;

                                case 'used':

                                default:
                                    value = parseInt(entry[2]);

                                    break;
                            }

                            let unit = 'KB';

                            if (value > 1024) {
                                unit = 'MB';
                                value /= 1024;
                                if (value > 1024) {
                                    unit = 'GB';
                                    value /= 1024;
                                    if (value > 1024) {
                                        unit = 'TB';
                                        value /= 1024;
                                    }
                                }
                            } else {
                                unit = 'KB';
                            }

                            if (this._decimalsStatus) {
                                this._diskSpaceBox.update_element_value(filesystem, `${value.toFixed(1)}`, unit);
                            } else {
                                this._diskSpaceBox.update_element_value(filesystem, `${value.toFixed(0)}`, unit);
                            }

                            break;
                    }
                }
            });
        }

        _refreshEthValue() {
            this._loadFile('/proc/net/dev').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                let duTot = [0, 0];
                let du = [0, 0];

                // Excludes the first two lines of output
                for (let i = 2; i < lines.length - 1; i++) {
                    const line = lines[i];
                    const entry = line.trim().split(':');
                    if (entry[0].match(/(eth[0-9]+|en[a-z0-9]*)/)) {
                        const values = entry[1].trim().split(/\s+/);

                        duTot[0] += parseInt(values[0]);
                        duTot[1] += parseInt(values[8]);
                    }
                }

                const idle = GLib.get_monotonic_time() / 1000;
                const delta = (idle - this._ethIdleOld) / 1000;

                // True bits
                // False Bytes
                const boolUnit = this._netUnit === 'bits';

                const unit = boolUnit ? 1000 : 1024;
                const factor = boolUnit ? 8 : 1;

                if (delta > 0) {
                    for (let i = 0; i < 2; i++) {
                        du[i] = ((duTot[i] - this._duTotEthOld[i]) * factor) / delta;
                        this._duTotEthOld[i] = duTot[i];
                    }

                    if (du[0] > unit || du[1] > unit) {
                        this._ethUnit.text = boolUnit ? 'k' : 'K';
                        du[0] /= unit;
                        du[1] /= unit;
                        if (du[0] > unit || du[1] > unit) {
                            this._ethUnit.text = boolUnit ? 'm' : 'M';
                            du[0] /= unit;
                            du[1] /= unit;
                            if (du[0] > unit || du[1] > unit) {
                                this._ethUnit.text = boolUnit ? 'g' : 'G';
                                du[0] /= unit;
                                du[1] /= unit;
                            }
                        }
                    } else {
                        this._ethUnit.text = boolUnit ? 'b' : 'B';
                    }
                }

                this._ethIdleOld = idle;

                if (this._decimalsStatus) {
                    this._ethValue.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
                } else {
                    this._ethValue.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
                }
            });
        }

        _refreshWlanValue() {
            this._loadFile('/proc/net/dev').then(contents => {
                const lines = ByteArray.toString(contents).split('\n');

                let duTot = [0, 0];
                let du = [0, 0];

                // Excludes the first two lines of output
                for (let i = 2; i < lines.length - 1; i++) {
                    const line = lines[i];
                    const entry = line.trim().split(':');
                    if (entry[0].match(/(wlan[0-9]+|wl[a-z0-9]*)/)) {
                        const values = entry[1].trim().split(/\s+/);

                        duTot[0] += parseInt(values[0]);
                        duTot[1] += parseInt(values[8]);
                    }
                }

                const idle = GLib.get_monotonic_time() / 1000;
                const delta = (idle - this._wlanIdleOld) / 1000;

                // True bits
                // False Bytes
                const boolUnit = this._netUnit === 'bits';

                const unit = boolUnit ? 1000 : 1024;
                const factor = boolUnit ? 8 : 1;

                if (delta > 0) {
                    for (let i = 0; i < 2; i++) {
                        du[i] = ((duTot[i] - this._duTotWlanOld[i]) * factor) / delta;
                        this._duTotWlanOld[i] = duTot[i];
                    }

                    if (du[0] > unit || du[1] > unit) {
                        this._wlanUnit.text = boolUnit ? 'k' : 'K';
                        du[0] /= unit;
                        du[1] /= unit;
                        if (du[0] > unit || du[1] > unit) {
                            this._wlanUnit.text = boolUnit ? 'm' : 'M';
                            du[0] /= unit;
                            du[1] /= unit;
                            if (du[0] > unit || du[1] > unit) {
                                this._wlanUnit.text = boolUnit ? 'g' : 'G';
                                du[0] /= unit;
                                du[1] /= unit;
                            }
                        }
                    } else {
                        this._wlanUnit.text = boolUnit ? 'b' : 'B';
                    }
                }

                this._wlanIdleOld = idle;

                if (this._decimalsStatus) {
                    this._wlanValue.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
                } else {
                    this._wlanValue.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
                }
            });
        }

        _refreshCpuFrequencyValue() {
            if (GLib.file_test('/sys/devices/system/cpu/cpu1/cpufreq/scaling_cur_freq', GLib.FileTest.EXISTS)) {
                this._loadFile('/sys/devices/system/cpu/cpu1/cpufreq/scaling_cur_freq').then(contents => {
                    let value = parseInt(ByteArray.toString(contents));

                    if (value > 999999) {
                        this._cpuFrequencyUnit.text = 'GHz';
                        value /= 1000;
                        value /= 1000;
                    } else {
                        this._cpuFrequencyUnit.text = 'MHz';
                        value /= 1000;
                    }

                    if (this._decimalsStatus) {
                        this._cpuFrequencyValue.text = `[${value.toFixed(2)}`;
                    } else {
                        this._cpuFrequencyValue.text = `[${value.toFixed(0)}`;
                    }
                });
            } else {
                this._cpuFrequencyValue.text = _('[Frequency Error');
                this._cpuFrequencyUnit.text = '';
            }
        }

        _refreshCpuTemperatureValue() {
            for (let i = 0; i < this._thermalCpuTemperatureDevicesList.length; i++) {
                const element = this._thermalCpuTemperatureDevicesList[i];
                const it = element.split(THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR);

                const status = it[1];
                const path = it[2];

                if (status === 'false') {
                    continue;
                }

                if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
                    this._loadFile(path).then(contents => {
                        const value = parseInt(ByteArray.toString(contents));

                        this._cpuTemperatures += value / 1000;
                        this._cpuTemperaturesReads++;
                    });
                }
            }

            if (this._cpuTemperaturesReads > 0) {
                // Temperatures Average
                this._cpuTemperatures /= this._cpuTemperaturesReads;

                switch (this._thermalCpuTemperatureUnit) {
                    case 'f':
                        this._cpuTemperatures = (this._cpuTemperatures * 1.8) + 32;
                        this._cpuTemperatureUnit.text = '°F';

                        break;

                    case 'c':

                    default:
                        this._cpuTemperatureUnit.text = '°C';

                        break;
                }

                if (this._decimalsStatus) {
                    this._cpuTemperatureValue.text = `[${this._cpuTemperatures.toFixed(1)}`;
                } else {
                    this._cpuTemperatureValue.text = `[${this._cpuTemperatures.toFixed(0)}`;
                }

                this._cpuTemperatures = 0;
                this._cpuTemperaturesReads = 0;
            } else {
                this._cpuTemperatureValue.text = _('[Temperature Error');
                this._cpuTemperatureUnit.text = '';
            }
        }

        // Common Function
        _basicItemStatus(status, iconCondition, icon, ...elements) {
            if (status) {
                if (this._iconsStatus) {
                    icon.show();
                }
                elements.forEach(element => {
                    element.show();
                });
            } else {
                if (iconCondition) {
                    icon.hide();
                }
                elements.forEach(element => {
                    element.hide();
                });
            }
        }

        _basicItemWidth(width, element) {
            if (width === 0) {
                element.min_width = 0;
                element.natural_width = 0;
                element.min_width_set = false;
                element.natural_width_set = false;
            } else {
                element.width = width;
            }
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
            } catch (e) {
                logError(e);
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
            } catch (e) {
                logError(e);
            }
        }
    });

const DiskContainer = GObject.registerClass(
    class DiskContainer extends St.BoxLayout {
        _init() {
            super._init();

            this._elementsPath = [];
            this._elementsName = [];
            this._elementsLabel = [];
            this._elementsValue = [];
            this._elementsUnit = [];
        }

        set_element_width(width) {
            if (width === 0) {
                this._elementsPath.forEach(element => {
                    this._elementsValue[element].min_width = 0;
                    this._elementsValue[element].natural_width = 0;
                    this._elementsValue[element].min_width_set = false;
                    this._elementsValue[element].natural_width_set = false;
                });
            } else {
                this._elementsPath.forEach(element => {
                    this._elementsValue[element].width = width;
                });
            }
        }

        cleanup_elements() {
            this._elementsPath = [];
            this._elementsName = [];
            this._elementsLabel = [];
            this._elementsValue = [];
            this._elementsUnit = [];

            this.remove_all_children();
        }
    });

const DiskContainerStats = GObject.registerClass(
    class DiskContainerStats extends DiskContainer {
        _init() {
            super._init();

            this.idleOld = [];
            this.rwTotOld = [];

            this.add_single();
        }

        add_single() {
            this._elementsPath.push('single');

            this._elementsValue['single'] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--'
            });
            this._elementsValue['single'].set_style('text-align: right;');

            this._elementsUnit['single'] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K'
            });
            this._elementsUnit['single'].set_style('padding-left: 0.125em;');

            this.add(this._elementsValue['single']);
            this.add(this._elementsUnit['single']);

            this.idleOld['single'] = 0;
            this.rwTotOld['single'] = [0, 0];
        }

        add_element(filesystem, label) {
            this._elementsPath.push(filesystem);

            this._elementsName[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ` ${label}: `
            });

            this._elementsValue[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--'
            });
            this._elementsValue[filesystem].set_style('text-align: right;');

            this._elementsUnit[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K'
            });
            this._elementsUnit[filesystem].set_style('padding-left: 0.125em;');

            this.add(this._elementsName[filesystem]);
            this.add(this._elementsValue[filesystem]);
            this.add(this._elementsUnit[filesystem]);

            this.idleOld[filesystem] = 0;
            this.rwTotOld[filesystem] = [0, 0];
        }

        update_mode(mode) {
            switch (mode) {
                case 'single':
                    this._elementsPath.forEach(element => {
                        if (element !== 'single') {
                            this._elementsName[element].hide();
                            this._elementsValue[element].hide();
                            this._elementsUnit[element].hide();
                        } else {
                            this._elementsValue[element].show();
                            this._elementsUnit[element].show();
                        }
                    });

                    break;

                case 'multiple':

                default:
                    this._elementsPath.forEach(element => {
                        if (element !== 'single') {
                            this._elementsName[element].show();
                            this._elementsValue[element].show();
                            this._elementsUnit[element].show();
                        } else {
                            this._elementsValue[element].hide();
                            this._elementsUnit[element].hide();
                        }
                    });

                    break;
            }
        }

        get_filesystem(name) {
            return this._elementsPath.filter(item => item.endsWith(name)).shift();
        }

        get_idle(filesystem) {
            return this.idleOld[filesystem];
        }

        get_rw_tot(filesystem) {
            return this.rwTotOld[filesystem];
        }

        set_idle(filesystem, idle) {
            this.idleOld[filesystem] = idle;
        }

        set_rw_tot(filesystem, rwTot) {
            this.rwTotOld[filesystem] = rwTot;
        }

        update_element_value(filesystem, value, unit) {
            if (this._elementsValue[filesystem]) {
                this._elementsValue[filesystem].text = value;
                this._elementsUnit[filesystem].text = unit;
            }
        }
    });

const DiskContainerSpace = GObject.registerClass(
    class DiskContainerSpace extends DiskContainer {
        add_element(filesystem, label) {
            this._elementsPath.push(filesystem);

            this._elementsName[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ` ${label}: `
            });

            this._elementsValue[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--'
            });
            this._elementsValue[filesystem].set_style('text-align: right;');

            this._elementsUnit[filesystem] = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: this._diskSpaceUnitType ? '%' : 'KB'
            });
            this._elementsUnit[filesystem].set_style('padding-left: 0.125em;');

            this.add(this._elementsName[filesystem]);
            this.add(this._elementsValue[filesystem]);
            this.add(this._elementsUnit[filesystem]);
        }

        update_element_value(filesystem, value, unit) {
            if (this._elementsValue[filesystem]) {
                this._elementsValue[filesystem].text = value;
                this._elementsUnit[filesystem].text = unit;
            }
        }
    });

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._settings = ExtensionUtils.getSettings();
        this._indicator = new ResourceMonitor(this._settings);

        const index = {
            left: -1,
            center: 0,
            right: 0,
        };

        this._extensionPosition = this._settings.get_string(EXTENSION_POSITION);
        this._handlerId = this._settings.connect(`changed::${EXTENSION_POSITION}`, () => {
            this._extensionPosition = this._settings.get_string(EXTENSION_POSITION);

            this._indicator.destroy();
            this._indicator = null;
            this._indicator = new ResourceMonitor(this._settings);

            Main.panel.addToStatusArea(this._uuid, this._indicator, index[this._extensionPosition], this._extensionPosition);
        });

        Main.panel.addToStatusArea(this._uuid, this._indicator, index[this._extensionPosition], this._extensionPosition);
    }

    disable() {
        // Disconnect Signal
        this._settings.disconnect(this._handlerId);

        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
