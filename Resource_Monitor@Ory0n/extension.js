/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init, enable, disable */

/*
 * Resource_Monitor is Copyright © 2018-2021 Giuseppe Silvestro
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

const { St, GObject, NM, GLib, Shell, Gio, Clutter } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ByteArray = imports.byteArray;

const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;

const Gettext = imports.gettext.domain('com-github-Ory0n-Resource_Monitor');
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();

const IndicatorName = Me.metadata['name'];

const INTERVAL = 'interval';
const ICONS = 'icons';
const ICONSPOSITION = 'iconsposition';
const DECIMALS = 'decimals';
const SYSTEMMONITOR = 'showsystemmonitor';
const CPU = 'cpu';
const RAM = 'ram';
const SWAP = 'swap';
const DISK_STATS = 'diskstats';
const DISK_SPACE = 'diskspace';
const ETH = 'eth';
const WLAN = 'wlan';
const CPUTEMPERATURE = 'cputemperature';
const CPUFREQUENCY = 'cpufrequency';
const DISKS_LIST = 'diskslist';
const DISK_STATS_MODE = 'diskstatsmode';
const DISK_SPACE_UNIT = 'diskspaceunit';
const AUTO_HIDE = 'autohide';
const WIDTH_CPU = 'widthcpu';
const WIDTH_RAM = 'widthram';
const WIDTH_SWAP = 'widthswap';
const WIDTH_DISK_STATS = 'widthdiskstats';
const WIDTH_DISK_SPACE = 'widthdiskspace';
const WIDTH_ETH = 'widtheth';
const WIDTH_WLAN = 'widthwlan';
const WIDTH_CPU_TEMPERATURE = 'widthcputemperature';
const WIDTH_CPU_FREQUENCY = 'widthcpufrequency';
const CPUTEMPERATUREUNIT = 'cputemperatureunit';
const NETWORKUNIT = 'networkunit';

var ResourceMonitorIndicator = null;

const ResourceMonitor = GObject.registerClass(
    class ResourceMonitor extends PanelMenu.Button {
        _init(params) {
            super._init(params, IndicatorName);
            this.connect('button-press-event', this._openSystemMonitor.bind(this));

            this._settings = ExtensionUtils.getSettings();

            this.client = NM.Client.new(null);
            this.onEth = false;
            this.onWlan = false;
            this.client.connect('active-connection-added', this._onActiveConnectionAdded.bind(this));
            this.client.connect('active-connection-removed', this._onActiveConnectionRemoved.bind(this));

            /** ### **/

            this.idleOld = 0;
            this.cpuTotOld = 0;

            this.idleDiskOld = [];
            this.rwTotOld = [];

            this.idleEthOld = 0;
            this.duTotEthOld = [0, 0];

            this.idleWlanOld = 0;
            this.duTotWlanOld = [0, 0];

            // Create UI
            this._createMainGui();

            /** ### Signals ### **/
            this.numSigId = 0;
            this.sigId = [];

            // Interval
            this.interval = this._settings.get_int(INTERVAL);
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${INTERVAL}`, () => {
                this.interval = this._settings.get_int(INTERVAL);

                if (this.timer) {
                    GLib.source_remove(this.timer);
                    this.timer = null;
                }

                this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this.interval, this._refresh.bind(this));
            });

            // Icons
            this.displayIcons;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${ICONS}`, this._iconsChange.bind(this));
            this.displayIcons = this._settings.get_boolean(ICONS);

            // Icons Position
            this.iconsPosition;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${ICONSPOSITION}`, this._iconsPositionChange.bind(this));
            this.iconsPosition = this._settings.get_int(ICONSPOSITION);

            // Decimals
            this.displayDecimals;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DECIMALS}`, this._decimalsChange.bind(this));
            this.displayDecimals = this._settings.get_boolean(DECIMALS);

            // Show System Monitor
            this.displaySystemMonitor;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${SYSTEMMONITOR}`, this._systemMonitorChange.bind(this));
            this.displaySystemMonitor = this._settings.get_boolean(SYSTEMMONITOR);

            // Cpu
            this.enCpu;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPU}`, this._cpuChange.bind(this));
            this.enCpu = this._settings.get_boolean(CPU);

            // Ram
            this.enRam;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${RAM}`, this._ramChange.bind(this));
            this.enRam = this._settings.get_boolean(RAM);

            // Swap
            this.enSwap;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${SWAP}`, this._swapChange.bind(this));
            this.enSwap = this._settings.get_boolean(SWAP);

            // Disk Stats
            this.enDiskStats;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_STATS}`, this._diskStatsChange.bind(this));
            this.enDiskStats = this._settings.get_boolean(DISK_STATS);

            // Disk Space
            this.enDiskSpace;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_SPACE}`, this._diskSpaceChange.bind(this));
            this.enDiskSpace = this._settings.get_boolean(DISK_SPACE);

            // Eth
            this.enEth;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${ETH}`, this._getSettingsEth.bind(this));
            this.enEth = this._settings.get_boolean(ETH);

            // Wlan
            this.enWlan;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WLAN}`, this._getSettingsWlan.bind(this));
            this.enWlan = this._settings.get_boolean(WLAN);

            // Auto Hide
            this.enHide;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${AUTO_HIDE}`, this._hideChange.bind(this));
            this.enHide = this._settings.get_boolean(AUTO_HIDE);

            // Cpu Temperature
            this.enCpuTemperature;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPUTEMPERATURE}`, this._cpuTemperatureChange.bind(this));
            this.enCpuTemperature = this._settings.get_boolean(CPUTEMPERATURE);

            // Cpu Frequency
            this.enCpuFrequency;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPUFREQUENCY}`, this._cpuFrequencyChange.bind(this));
            this.enCpuFrequency = this._settings.get_boolean(CPUFREQUENCY);

            // Cpu Temperature Unit
            this.cpuTemperatureFahrenheit;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPUTEMPERATUREUNIT}`, () => {
                this.cpuTemperatureFahrenheit = this._settings.get_boolean(CPUTEMPERATUREUNIT);

                this.cpuTemperatureUnit.text = this.cpuTemperatureFahrenheit ? '°F' : '°C';
            });
            this.cpuTemperatureFahrenheit = this._settings.get_boolean(CPUTEMPERATUREUNIT);
            this.cpuTemperatureUnit.text = this.cpuTemperatureFahrenheit ? '°F' : '°C'

            // Network Unit
            this.networkUnit;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${NETWORKUNIT}`, this._networkUnitChange.bind(this));
            this.networkUnit = this._settings.get_boolean(NETWORKUNIT);

            // Disks List
            this.disksList;
            this.diskStatsItems = [];
            this.diskSpaceItems = [];
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISKS_LIST}`, this._disksListChange.bind(this));
            this.disksList = this._settings.get_strv(DISKS_LIST);

            // Disk Stats Mode
            this.diskStatsMode;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_STATS_MODE}`, this._diskStatsModeChange.bind(this));
            this.diskStatsMode = this._settings.get_boolean(DISK_STATS_MODE);

            // Disks Space Unit
            this.disksSpaceUnit;
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_SPACE_UNIT}`, () => {
                this.disksSpaceUnit = this._settings.get_boolean(DISK_SPACE_UNIT);

                this._refreshDiskSpace();
            });
            this.disksSpaceUnit = this._settings.get_boolean(DISK_SPACE_UNIT);

            this._buildMainGui();
            this._initMainGui();

            /** ## WIDTH ## **/

            // Cpu
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_CPU}`, () => {
                this.cpu.width = this._settings.get_int(WIDTH_CPU);
            });
            this.cpu.width = this._settings.get_int(WIDTH_CPU);

            // Ram
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_RAM}`, () => {
                this.ram.width = this._settings.get_int(WIDTH_RAM);
            });
            this.ram.width = this._settings.get_int(WIDTH_RAM);

            // Swap
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_SWAP}`, () => {
                this.swap.width = this._settings.get_int(WIDTH_SWAP);
            });
            this.swap.width = this._settings.get_int(WIDTH_SWAP);

            // Disk Stats
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_DISK_STATS}`, () => {
                this._diskStatsWidthUpdate();
            });
            this._diskStatsWidthUpdate();

            // Disk Space
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_DISK_SPACE}`, () => {
                this._diskSpaceWidthUpdate();
            });
            this._diskSpaceWidthUpdate();

            // Eth
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_ETH}`, () => {
                this.eth.width = this._settings.get_int(WIDTH_ETH);
            });
            this.eth.width = this._settings.get_int(WIDTH_ETH);

            // Wlan
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_WLAN}`, () => {
                this.wlan.width = this._settings.get_int(WIDTH_WLAN);
            });
            this.wlan.width = this._settings.get_int(WIDTH_WLAN);

            // Cpu Temperature
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_CPU_TEMPERATURE}`, () => {
                this.cpuTemperature.width = this._settings.get_int(WIDTH_CPU_TEMPERATURE);
            });
            this.cpuTemperature.width = this._settings.get_int(WIDTH_CPU_TEMPERATURE);

            // Cpu Frequency
            this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_CPU_FREQUENCY}`, () => {
                this.cpuFrequency.width = this._settings.get_int(WIDTH_CPU_FREQUENCY);
            });
            this.cpuFrequency.width = this._settings.get_int(WIDTH_CPU_FREQUENCY);

            // Init Connections State
            this._onActiveConnectionRemoved(this.client);

            /** ### Setup Refresh Timer ### **/
            this.timer;
            this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this.interval, this._refresh.bind(this));
            this._refresh();
        }

        _createMainGui() {
            this.box = new St.BoxLayout();

            // Icon
            this.cpuIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/cpu-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.ramIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/ram-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.swapIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/swap-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.diskStatsIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/disk-stats-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.diskSpaceIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/disk-space-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.ethIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/eth-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            this.wlanIco = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + '/icons/wlan-symbolic.svg'),
                style_class: 'system-status-icon'
            });

            // Unit
            this.cpuUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '%',
                style_class: 'unit'
            });

            this.ramUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '%',
                style_class: 'unit'
            });

            this.swapUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '%',
                style_class: 'unit'
            });

            this.ethUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K',
                style_class: 'unit'
            });

            this.wlanUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'K',
                style_class: 'unit'
            });

            this.cpuTemperatureUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '°C',
                style_class: 'unit'
            });

            this.cpuFrequencyUnit = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: 'MHz',
                style_class: 'unit'
            });

            // Label
            this.cpu = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--',
                style_class: 'label'
            });

            this.ram = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--',
                style_class: 'label'
            });

            this.swap = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--',
                style_class: 'label'
            });

            this.diskStats = new St.BoxLayout();
            this.diskSpace = new St.BoxLayout();

            this.eth = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--',
                style_class: 'label'
            });

            this.wlan = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '--|--',
                style_class: 'label'
            });

            this.cpuTemperature = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '[--',
                style_class: 'label'
            });

            this.temperatureBrackets = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ']',
                style_class: 'label'
            });

            this.cpuFrequency = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: '[--',
                style_class: 'label'
            });

            this.cpuFrequencyBrackets = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ']',
                style_class: 'label'
            });
        }

        _buildMainGui() {
            if (this.iconsPosition === 0) { // LEFT
                this.box.add(this.cpuIco);
                this.box.add(this.cpu);
                this.box.add(this.cpuUnit);

                this.box.add(this.cpuTemperature);
                this.box.add(this.cpuTemperatureUnit);
                this.box.add(this.temperatureBrackets);
                this.box.add(this.cpuFrequency);
                this.box.add(this.cpuFrequencyUnit);
                this.box.add(this.cpuFrequencyBrackets);

                this.box.add(this.ramIco);
                this.box.add(this.ram);
                this.box.add(this.ramUnit);

                this.box.add(this.swapIco);
                this.box.add(this.swap);
                this.box.add(this.swapUnit);

                this.box.add(this.diskStatsIco);
                this.box.add(this.diskStats);

                this.box.add(this.diskSpaceIco);
                this.box.add(this.diskSpace);

                this.box.add(this.ethIco);
                this.box.add(this.eth);
                this.box.add(this.ethUnit);

                this.box.add(this.wlanIco);
                this.box.add(this.wlan);
                this.box.add(this.wlanUnit);
            } else { // RIGHT
                this.box.add(this.cpu);
                this.box.add(this.cpuUnit);

                this.box.add(this.cpuTemperature);
                this.box.add(this.cpuTemperatureUnit);
                this.box.add(this.temperatureBrackets);
                this.box.add(this.cpuFrequency);
                this.box.add(this.cpuFrequencyUnit);
                this.box.add(this.cpuFrequencyBrackets);
                this.box.add(this.cpuIco);

                this.box.add(this.ram);
                this.box.add(this.ramUnit);
                this.box.add(this.ramIco);

                this.box.add(this.swap);
                this.box.add(this.swapUnit);
                this.box.add(this.swapIco);

                this.box.add(this.diskStats);
                this.box.add(this.diskStatsIco);
                this.box.add(this.diskSpace);
                this.box.add(this.diskSpaceIco);

                this.box.add(this.eth);
                this.box.add(this.ethUnit);
                this.box.add(this.ethIco);

                this.box.add(this.wlan);
                this.box.add(this.wlanUnit);
                this.box.add(this.wlanIco);
            }

            this.add_actor(this.box);
        }

        _initMainGui() {
            this._iconsChange();
            this._cpuChange();
            this._ramChange();
            this._swapChange();
            this._diskStatsChange();
            this._diskSpaceChange();
            this._getSettingsEth();
            this._getSettingsWlan();
            this._hideChange();
            this._cpuTemperatureChange();
            this._cpuFrequencyChange();
            this._disksListChange();
        }

        destroy() {
            if (this.timer) {
                GLib.source_remove(this.timer);
                this.timer = null;
            }

            /** ## Signals Disconnection ## **/
            for (let i = 0; i < this.numSigId; i++) {
                this._settings.disconnect(this.sigId[i]);
                this.sigId[i] = 0;
            }

            super.destroy();
        }

        _openSystemMonitor() {
            if (this.displaySystemMonitor) {
                let app = global.log(Shell.AppSystem.get_default().lookup_app('gnome-system-monitor.desktop'));

                if (app != null)
                    app.activate();
                else
                    Util.spawn(['gnome-system-monitor']);
            }
        }

        /** Signals Handler **/
        _onActiveConnectionAdded(client, activeConnection) {
            activeConnection.get_devices().forEach(device => {
                switch (device.get_device_type()) {

                    case NM.DeviceType.ETHERNET: {
                        this.onEth = true;
                    } break;

                    case NM.DeviceType.WIFI: {
                        this.onWlan = true;
                    } break;

                    default:

                }
            });

            this._ethChange();
            this._wlanChange();
        }

        _onActiveConnectionRemoved(client) {
            this.onEth = false;
            this.onWlan = false;

            client.get_active_connections().forEach(activeConnection => {
                activeConnection.get_devices().forEach(device => {
                    switch (device.get_device_type()) {

                        case NM.DeviceType.ETHERNET: {
                            this.onEth = true;
                        } break;

                        case NM.DeviceType.WIFI: {
                            this.onWlan = true;
                        } break;

                        default:

                    }
                });
            });

            this._ethChange();
            this._wlanChange();
        }

        _iconsChange() {
            this.displayIcons = this._settings.get_boolean(ICONS);
            if (this.displayIcons) {
                if (this.enCpu)
                    this.cpuIco.show();
                if (this.enRam)
                    this.ramIco.show();
                if (this.enSwap)
                    this.swapIco.show();
                if (this.enDiskStats)
                    this.diskStatsIco.show();
                if (this.enDiskSpace)
                    this.diskSpaceIco.show();
                if ((this.enEth && this.onEth) || (this.enEth && !this.enHide))
                    this.ethIco.show();
                if ((this.enWlan && this.onWlan) || (this.enWlan && !this.enHide))
                    this.wlanIco.show();
            } else {
                this.cpuIco.hide();
                this.ramIco.hide();
                this.swapIco.hide();
                this.diskStatsIco.hide();
                this.diskSpaceIco.hide();
                this.ethIco.hide();
                this.wlanIco.hide();
            }
        }

        _iconsPositionChange() {
            this.iconsPosition = this._settings.get_int(ICONSPOSITION);

            // Cleanup gui
            this.box.remove_all_children();

            this._buildMainGui();

            this._initMainGui();
        }

        _decimalsChange() {
            this.displayDecimals = this._settings.get_boolean(DECIMALS);
        }

        _systemMonitorChange() {
            this.displaySystemMonitor = this._settings.get_boolean(SYSTEMMONITOR);
        }

        _cpuChange() {
            this.enCpu = this._settings.get_boolean(CPU);
            if (this.enCpu) {
                if (this.displayIcons)
                    this.cpuIco.show();
                this.cpu.show();
                this.cpuUnit.show();
            } else {
                if (!this.enCpuTemperature && !this.enCpuFrequency)
                    this.cpuIco.hide();
                this.cpu.hide();
                this.cpuUnit.hide();
            }
        }

        _ramChange() {
            this.enRam = this._settings.get_boolean(RAM);
            if (this.enRam) {
                if (this.displayIcons)
                    this.ramIco.show();
                this.ram.show();
                this.ramUnit.show();
            } else {
                this.ramIco.hide();
                this.ram.hide();
                this.ramUnit.hide();
            }
        }

        _swapChange() {
            this.enSwap = this._settings.get_boolean(SWAP);
            if (this.enSwap) {
                if (this.displayIcons)
                    this.swapIco.show();
                this.swap.show();
                this.swapUnit.show();
            } else {
                this.swapIco.hide();
                this.swap.hide();
                this.swapUnit.hide();
            }
        }

        _diskStatsChange() {
            this.enDiskStats = this._settings.get_boolean(DISK_STATS);
            if (this.enDiskStats) {
                if (this.displayIcons)
                    this.diskStatsIco.show();
                this.diskStats.show();
            } else {
                this.diskStatsIco.hide();
                this.diskStats.hide();
            }
        }

        _diskSpaceChange() {
            this.enDiskSpace = this._settings.get_boolean(DISK_SPACE);
            if (this.enDiskSpace) {
                if (this.displayIcons)
                    this.diskSpaceIco.show();
                this.diskSpace.show();
            } else {
                this.diskSpaceIco.hide();
                this.diskSpace.hide();
            }
        }

        _getSettingsEth() {
            this.enEth = this._settings.get_boolean(ETH);

            this._ethChange();
        }

        _ethChange() {
            if ((this.enEth && this.onEth) || (this.enEth && !this.enHide)) {
                if (this.displayIcons)
                    this.ethIco.show();
                this.eth.show();
                this.ethUnit.show();
            } else {
                this.ethIco.hide();
                this.eth.hide();
                this.ethUnit.hide();
            }
        }

        _getSettingsWlan() {
            this.enWlan = this._settings.get_boolean(WLAN);

            this._wlanChange();
        }

        _wlanChange() {
            if ((this.enWlan && this.onWlan) || (this.enWlan && !this.enHide)) {
                if (this.displayIcons)
                    this.wlanIco.show();
                this.wlan.show();
                this.wlanUnit.show();
            } else {
                this.wlanIco.hide();
                this.wlan.hide();
                this.wlanUnit.hide();
            }
        }

        _hideChange() {
            this.enHide = this._settings.get_boolean(AUTO_HIDE);

            this._ethChange();
            this._wlanChange();
        }

        _networkUnitChange() {
            this.networkUnit = this._settings.get_boolean(NETWORKUNIT);
        }

        _diskStatsWidthUpdate() {
            for (let i = 0; i < this.disksList.length; i++) {
                let element = this.disksList[i];
                let it = element.split(' ');
                let field = this.diskStatsItems[it[0]];

                if (typeof (field) !== 'undefined') {
                    field[0].width = this._settings.get_int(WIDTH_DISK_STATS);
                }
            }

            let field = this.diskStatsItems['All'];
            if (typeof (field) !== 'undefined') {
                field[0].width = this._settings.get_int(WIDTH_DISK_STATS);
            }
        }

        _diskSpaceWidthUpdate() {
            for (let i = 0; i < this.disksList.length; i++) {
                let element = this.disksList[i];
                let it = element.split(' ');
                let field = this.diskSpaceItems[it[0]];

                if (typeof (field) !== 'undefined') {
                    field[0].width = this._settings.get_int(WIDTH_DISK_SPACE);
                }
            }
        }

        _diskStatsUpdate() {
            // Cleanup gui
            this.diskStats.remove_all_children();

            this.diskStatsItems = [];
            let width = this._settings.get_int(WIDTH_DISK_STATS);

            this.idleDiskOld = [];
            this.rwTotOld = [];

            // Stats
            if (this.diskStatsMode === true) {
                // All In One
                let field = new St.Label({
                    y_align: Clutter.ActorAlign.CENTER,
                    text: '--|--',
                    width: width,
                    style_class: 'label'
                });

                let unit = new St.Label({
                    y_align: Clutter.ActorAlign.CENTER,
                    text: 'K',
                    style_class: 'unit'
                });

                this.diskStats.add(field);
                this.diskStats.add(unit);

                this.diskStatsItems['All'] = [field, unit];

                this.idleDiskOld['All'] = 0;
                this.rwTotOld['All'] = [0, 0];
            } else {
                for (let i = 0; i < this.disksList.length; i++) {
                    let element = this.disksList[i];
                    let it = element.split(' ');

                    let dStButton = (it[1] === 'true');
                    if (dStButton) {
                        let name = new St.Label({
                            y_align: Clutter.ActorAlign.CENTER,
                            text: it[0] + ':',
                            style_class: 'label'
                        });

                        let field = new St.Label({
                            y_align: Clutter.ActorAlign.CENTER,
                            text: '--|--',
                            width: width,
                            style_class: 'label'
                        });

                        let unit = new St.Label({
                            y_align: Clutter.ActorAlign.CENTER,
                            text: 'K',
                            style_class: 'unit'
                        });

                        this.diskStats.add(name);
                        this.diskStats.add(field);
                        this.diskStats.add(unit);

                        this.diskStatsItems[it[0]] = [field, unit];

                        this.idleDiskOld[it[0]] = 0;
                        this.rwTotOld[it[0]] = [0, 0];
                    }
                }
            }
        }

        _diskSpaceUpdate() {
            // Cleanup gui
            this.diskSpace.remove_all_children();

            this.diskSpaceItems = [];
            let width = this._settings.get_int(WIDTH_DISK_SPACE);

            // Space
            for (let i = 0; i < this.disksList.length; i++) {
                let element = this.disksList[i];
                let it = element.split(' ');

                let dSpButton = (it[2] === 'true');

                if (dSpButton) {
                    let name = new St.Label({
                        y_align: Clutter.ActorAlign.CENTER,
                        text: it[0] + ':',
                        style_class: 'label'
                    });

                    let field = new St.Label({
                        y_align: Clutter.ActorAlign.CENTER,
                        text: '--',
                        width: width,
                        style_class: 'label'
                    });

                    let unit = new St.Label({
                        y_align: Clutter.ActorAlign.CENTER,
                        text: this.disksSpaceUnit ? '%' : 'K',
                        style_class: 'unit'
                    });

                    this.diskSpace.add(name);
                    this.diskSpace.add(field);
                    this.diskSpace.add(unit);

                    this.diskSpaceItems[it[0]] = [field, unit];
                }
            }
        }

        _disksListChange() {
            this.disksList = this._settings.get_strv(DISKS_LIST);

            this._diskStatsUpdate();
            this._diskSpaceUpdate();
        }

        _diskStatsModeChange() {
            this.diskStatsMode = this._settings.get_boolean(DISK_STATS_MODE);

            this._diskStatsUpdate();
            this._refreshDiskStats();
        }

        _cpuTemperatureChange() {
            this.enCpuTemperature = this._settings.get_boolean(CPUTEMPERATURE);
            if (this.enCpuTemperature) {
                if (this.displayIcons)
                    this.cpuIco.show();
                this.temperatureBrackets.show()
                this.cpuTemperature.show();
                this.cpuTemperatureUnit.show();
            } else {
                if (!this.enCpu && !this.enCpuFrequency)
                    this.cpuIco.hide();
                this.temperatureBrackets.hide();
                this.cpuTemperature.hide();
                this.cpuTemperatureUnit.hide();
            }
        }

        _cpuFrequencyChange() {
            this.enCpuFrequency = this._settings.get_boolean(CPUFREQUENCY);
            if (this.enCpuFrequency) {
                if (this.displayIcons)
                    this.cpuIco.show();
                this.cpuFrequencyBrackets.show()
                this.cpuFrequency.show();
                this.cpuFrequencyUnit.show();
            } else {
                if (!this.enCpu && !this.enCpuTemperature)
                    this.cpuIco.hide();
                this.cpuFrequencyBrackets.hide();
                this.cpuFrequency.hide();
                this.cpuFrequencyUnit.hide();
            }
        }

        /*********************/

        _refresh() {
            if (this.enCpu)
                this._refreshCpu();
            if (this.enRam)
                this._refreshRam();
            if (this.enSwap)
                this._refreshSwap();
            if (this.enDiskStats)
                this._refreshDiskStats();
            if (this.enDiskSpace)
                this._refreshDiskSpace();
            if (this.enEth)
                this._refreshEth();
            if (this.enWlan)
                this._refreshWlan();
            if (this.enCpuTemperature)
                this._refreshCpuTemperature();
            if (this.enCpuFrequency)
                this._refreshCpuFrequency();

            return GLib.SOURCE_CONTINUE;
        }

        _refreshCpu() {
            let file = Gio.file_new_for_path('/proc/stat');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                let entry = lines[0].trim().split(/\s+/);
                let cpuTot = 0;
                let idle = parseInt(entry[4]);

                // user sys nice idle iowait
                for (let i = 1; i < 5; i++)
                    cpuTot += parseInt(entry[i]);

                let delta = cpuTot - this.cpuTotOld;
                let deltaIdle = idle - this.idleOld;

                let cpuCurr = 100 * (delta - deltaIdle) / delta;

                this.cpuTotOld = cpuTot;
                this.idleOld = idle;

                if (this.displayDecimals) {
                    this.cpu.text = `${cpuCurr.toFixed(1)}`;
                } else {
                    this.cpu.text = `${cpuCurr.toFixed(0)}`;
                }
            });
        }

        _refreshRam() {
            let file = Gio.file_new_for_path('/proc/meminfo');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                let total, available, used;

                for (let i = 0; i < 3; i++) {
                    let values;
                    let line = lines[i];

                    if (line.match(/^MemTotal/)) {
                        values = line.match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);
                        total = parseInt(values[1]);
                    } else if (line.match(/^MemAvailable/)) {
                        values = line.match(/^MemAvailable:\s*([^ ]*)\s*([^ ]*)$/);
                        available = parseInt(values[1]);
                    }
                }

                used = total - available;

                if (this.displayDecimals) {
                    this.ram.text = `${(100 * used / total).toFixed(1)}`;
                } else {
                    this.ram.text = `${(100 * used / total).toFixed(0)}`;
                }
            });
        }

        _refreshSwap() {
            let file = Gio.file_new_for_path('/proc/meminfo');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                let total, available, used;

                for (let i = 0; i < 16; i++) {
                    let values;
                    let line = lines[i];

                    if (line.match(/^SwapTotal/)) {
                        values = line.match(/^SwapTotal:\s*([^ ]*)\s*([^ ]*)$/);
                        total = parseInt(values[1]);
                    } else if (line.match(/^SwapFree/)) {
                        values = line.match(/^SwapFree:\s*([^ ]*)\s*([^ ]*)$/);
                        available = parseInt(values[1]);
                    }
                }

                used = total - available;

                if (this.displayDecimals) {
                    this.swap.text = `${(100 * used / total).toFixed(1)}`;
                } else {
                    this.swap.text = `${(100 * used / total).toFixed(0)}`;
                }
            });
        }

        _refreshDiskStats() {
            let file = Gio.file_new_for_path('/proc/diskstats');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                if (this.diskStatsMode === true) {
                    let field = this.diskStatsItems['All'];

                    let rwTot = [0, 0];
                    let rw = [0, 0];

                    for (let i = 0; i < this.disksList.length; i++) {
                        let element = this.disksList[i];
                        let it = element.split(' ');

                        // if disk stats enabled
                        if (it[1] === 'true') {
                            for (let j = 0; j < lines.length; j++) {
                                let line = lines[j];
                                let entry = line.trim().split(/\s+/); // TODO search by name
                                if (typeof (entry[1]) === 'undefined')
                                    break;

                                // All
                                // Same Name
                                if (it[0].endsWith(entry[2])) {
                                    rwTot[0] += parseInt(entry[5]);
                                    rwTot[1] += parseInt(entry[9]);
                                }
                            }
                        }
                    }

                    let idle = GLib.get_monotonic_time() / 1000;
                    let delta = (idle - this.idleDiskOld['All']) / 1000;

                    if (delta > 0) {
                        for (let i = 0; i < 2; i++) {
                            rw[i] = (rwTot[i] - this.rwTotOld['All'][i]) / delta;
                            this.rwTotOld['All'][i] = rwTot[i];
                        }

                        if (rw[0] > 1024 || rw[1] > 1024) {
                            field[1].text = 'M';
                            rw[0] /= 1024;
                            rw[1] /= 1024;
                            if (rw[0] > 1024 || rw[1] > 1024) {
                                field[1].text = 'G';
                                rw[0] /= 1024;
                                rw[1] /= 1024;
                            }
                        } else {
                            field[1].text = 'K';
                        }
                    }

                    this.idleDiskOld['All'] = idle;

                    if (this.displayDecimals) {
                        field[0].text = `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`;
                    } else {
                        field[0].text = `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`;
                    }
                } else {
                    for (let i = 0; i < this.disksList.length; i++) {
                        let element = this.disksList[i];
                        let it = element.split(' ');
                        let field = this.diskStatsItems[it[0]];

                        // undefined if stats disabled
                        if (typeof (field) === 'undefined') {
                            continue;
                        }

                        let rwTot = [0, 0];
                        let rw = [0, 0];

                        let found = false; // found in /proc/diskstats

                        for (let j = 0; j < lines.length; j++) {
                            let line = lines[j];

                            let entry = line.trim().split(/\s+/); // TODO search by name
                            if (typeof (entry[1]) === 'undefined')
                                break;

                            // Same Name
                            if (it[0].endsWith(entry[2])) {
                                rwTot[0] += parseInt(entry[5]);
                                rwTot[1] += parseInt(entry[9]);
                                found = true;
                                break;
                            }
                        }

                        if (found) {
                            let idle = GLib.get_monotonic_time() / 1000;
                            let delta = (idle - this.idleDiskOld[it[0]]) / 1000;

                            if (delta > 0) {
                                for (let i = 0; i < 2; i++) {
                                    rw[i] = (rwTot[i] - this.rwTotOld[it[0]][i]) / delta;
                                    this.rwTotOld[it[0]][i] = rwTot[i];
                                }

                                if (rw[0] > 1024 || rw[1] > 1024) {
                                    field[1].text = 'M';
                                    rw[0] /= 1024;
                                    rw[1] /= 1024;
                                    if (rw[0] > 1024 || rw[1] > 1024) {
                                        field[1].text = 'G';
                                        rw[0] /= 1024;
                                        rw[1] /= 1024;
                                    }
                                } else {
                                    field[1].text = 'K';
                                }
                            }

                            this.idleDiskOld[it[0]] = idle;

                            if (this.displayDecimals) {
                                field[0].text = `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`;
                            } else {
                                field[0].text = `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`;
                            }
                        } else { // Not found
                            field[0].text = '--|--';
                        }
                    }
                }
            });
        }

        _refreshDiskSpace() {
            let proc = Gio.Subprocess.new(['df'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);

                    if (proc.get_successful()) {
                        let lines = stdout.split('\n');

                        for (let i = 0; i < this.disksList.length; i++) {
                            let element = this.disksList[i];
                            let it = element.split(' ');
                            let field = this.diskSpaceItems[it[0]];

                            // undefined if space disabled
                            if (typeof (field) === 'undefined') {
                                continue;
                            }

                            for (let j = 0; j < lines.length; j++) {
                                let line = lines[j];
                                let entry = line.trim().split(/\s+/);
                                if (typeof (entry[1]) === 'undefined')
                                    break;

                                // Same Name
                                if (it[0] === entry[0]) {
                                    if (this.disksSpaceUnit === true) {
                                        // Used %
                                        field[1].text = '%';
                                        field[0].text = `${entry[4].slice(0, -1)}`;
                                    } else {
                                        // Used
                                        let used = entry[2]

                                        if (used > 1024) {
                                            field[1].text = 'M';
                                            used /= 1024;
                                            if (used > 1024) {
                                                field[1].text = 'G';
                                                used /= 1024;
                                                if (used > 1024) {
                                                    field[1].text = 'T';
                                                    used /= 1024;
                                                }
                                            }
                                        } else {
                                            field[1].text = 'K';
                                        }

                                        if (this.displayDecimals) {
                                            field[0].text = `${used.toFixed(1)}`;
                                        } else {
                                            field[0].text = `${used.toFixed(0)}`;
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        throw new Error(stderr);
                    }
                } catch (e) {
                    throw new Error(e);
                }
            });
        }

        _refreshEth() {
            let duTot = [0, 0];
            let du = [0, 0];

            let file = Gio.file_new_for_path('/proc/net/dev');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                for (let i = 2; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(':');
                    if (entry[0].match(/(eth[0-9]+|en[a-z0-9]*)/)) {
                        let values = entry[1].trim().split(/\s+/);

                        duTot[0] += parseInt(values[0]);
                        duTot[1] += parseInt(values[8]);
                    }
                }

                let idle = GLib.get_monotonic_time() / 1000;
                let delta = (idle - this.idleEthOld) / 1000;

                let unit = this.networkUnit ? 1000 : 1024;
                let factor = this.networkUnit ? 8 : 1;

                if (delta > 0) {
                    for (let i = 0; i < 2; i++) {
                        du[i] = ((duTot[i] - this.duTotEthOld[i]) * factor) / delta;
                        this.duTotEthOld[i] = duTot[i];
                    }

                    if (du[0] > unit || du[1] > unit) {
                        this.ethUnit.text = this.networkUnit ? 'k' : 'K';
                        du[0] /= unit;
                        du[1] /= unit;
                        if (du[0] > unit || du[1] > unit) {
                            this.ethUnit.text = this.networkUnit ? 'm' : 'M';
                            du[0] /= unit;
                            du[1] /= unit;
                            if (du[0] > unit || du[1] > unit) {
                                this.ethUnit.text = this.networkUnit ? 'g' : 'G';
                                du[0] /= unit;
                                du[1] /= unit;
                            }
                        }
                    } else {
                        this.ethUnit.text = this.networkUnit ? 'b' : 'B';
                    }
                }

                this.idleEthOld = idle;

                if (this.displayDecimals) {
                    this.eth.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
                } else {
                    this.eth.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
                }
            });
        }

        _refreshWlan() {
            let duTot = [0, 0];
            let du = [0, 0];

            let file = Gio.file_new_for_path('/proc/net/dev');
            file.load_contents_async(null, (source, result) => {
                let contents = source.load_contents_finish(result)[1];
                let lines = ByteArray.toString(contents).split('\n');

                for (let i = 2; i < lines.length - 1; i++) {
                    let line = lines[i];
                    let entry = line.trim().split(':');
                    if (entry[0].match(/(wlan[0-9]+|wl[a-z0-9]*)/)) {
                        let values = entry[1].trim().split(/\s+/);

                        duTot[0] += parseInt(values[0]);
                        duTot[1] += parseInt(values[8]);
                    }
                }

                let idle = GLib.get_monotonic_time() / 1000;
                let delta = (idle - this.idleWlanOld) / 1000;

                let unit = this.networkUnit ? 1000 : 1024;
                let factor = this.networkUnit ? 8 : 1;

                if (delta > 0) {
                    for (let i = 0; i < 2; i++) {
                        du[i] = ((duTot[i] - this.duTotWlanOld[i]) * factor) / delta;
                        this.duTotWlanOld[i] = duTot[i];
                    }

                    if (du[0] > unit || du[1] > unit) {
                        this.wlanUnit.text = this.networkUnit ? 'k' : 'K';
                        du[0] /= unit;
                        du[1] /= unit;
                        if (du[0] > unit || du[1] > unit) {
                            this.wlanUnit.text = this.networkUnit ? 'm' : 'M';
                            du[0] /= unit;
                            du[1] /= unit;
                            if (du[0] > unit || du[1] > unit) {
                                this.wlanUnit.text = this.networkUnit ? 'g' : 'G';
                                du[0] /= unit;
                                du[1] /= unit;
                            }
                        }
                    } else {
                        this.wlanUnit.text = this.networkUnit ? 'b' : 'B';
                    }
                }

                this.idleWlanOld = idle;

                if (this.displayDecimals) {
                    this.wlan.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
                } else {
                    this.wlan.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
                }
            });
        }

        _refreshCpuTemperature() {
            let cpuTemperatureFile = '/sys/devices/virtual/thermal/thermal_zone0/temp';
            if (GLib.file_test(cpuTemperatureFile, GLib.FileTest.EXISTS)) {
                let file = Gio.file_new_for_path(cpuTemperatureFile);
                file.load_contents_async(null, (source, result) => {
                    let contents = source.load_contents_finish(result)[1];
                    let temperature = parseInt(ByteArray.toString(contents)) / 1000;

                    if (this.cpuTemperatureFahrenheit) {
                        temperature = (temperature * 1.8) + 32;
                    }

                    if (this.displayDecimals) {
                        this.cpuTemperature.text = `[${temperature.toFixed(1)}`;
                    } else {
                        this.cpuTemperature.text = `[${temperature.toFixed(0)}`;
                    }
                });
            } else {
                this.cpuTemperature.text = '[Error';
            }
        }

        _refreshCpuFrequency() {
            let cpuFrequencyFile = '/sys/devices/system/cpu/cpu1/cpufreq/scaling_cur_freq';
            if (GLib.file_test(cpuFrequencyFile, GLib.FileTest.EXISTS)) {
                let file = Gio.file_new_for_path(cpuFrequencyFile);
                file.load_contents_async(null, (source, result) => {
                    let contents = source.load_contents_finish(result)[1];
                    let frequencyMHz = (parseInt(ByteArray.toString(contents)) / 1000).toFixed(0);
                    // display in GHz if over 999MHz
                    if (frequencyMHz > 999) {
                        this.cpuFrequency.text = `[${(frequencyMHz / 1000).toFixed(2)}`;
                        this.cpuFrequencyUnit.text = 'GHz';
                    } else {
                        this.cpuFrequency.text = `[${frequencyMHz}`;
                        this.cpuFrequencyUnit.text = 'MHz';
                    }
                });
            } else {
                this.cpuFrequency.text = '[Error';
            }
        }
    });

function init() {
    ExtensionUtils.initTranslations();
}

function enable() {
    ResourceMonitorIndicator = new ResourceMonitor();
    Main.panel.addToStatusArea(IndicatorName, ResourceMonitorIndicator);
}

function disable() {
    if (ResourceMonitorIndicator !== null) {
        ResourceMonitorIndicator.destroy();
        ResourceMonitorIndicator = null;
    }
}
