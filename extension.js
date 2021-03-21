/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init enable disable */

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

const Util = imports.misc.util;

const Gettext = imports.gettext.domain('com-github-0ry0n-Resource_Monitor');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var ResourceMonitorIndicator;
var IndicatorName = Me.metadata['name'];

const INTERVAL = 'interval';
const ICONS = 'icons';
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
const WIDTH_CPUTEMPERATURE = 'widthcputemperature';

const CPUTEMPERATUREUNIT = 'cputemperatureunit';

var ResourceMonitor = GObject.registerClass(
  class ResourceMonitor extends PanelMenu.Button {
    _init(params) {
      super._init(params, IndicatorName);
      this.actor.connect('button-press-event', this._openSystemMonitor.bind(this));

      this._settings = ExtensionUtils.getSettings();

      this.client = NM.Client.new(null);
      this.client.connect('active-connection-added', this.onActiveConnectionAdded.bind(this));
      this.client.connect('active-connection-removed', this.onActiveConnectionRemoved.bind(this));

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
      this.initUI();

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

        this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this.interval, this.refresh.bind(this));
      });

      // Icons
      this.displayIcons;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${ICONS}`, this.iconsChange.bind(this));
      this.iconsChange();

      // Decimals
      this.displayDecimals;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DECIMALS}`, this.decimalsChange.bind(this));
      this.decimalsChange();

      // Show System Monitor
      this.displaySystemMonitor;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${SYSTEMMONITOR}`, this.systemMonitorChange.bind(this));
      this.systemMonitorChange();

      // Cpu
      this.enCpu;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPU}`, this.cpuChange.bind(this));
      this.cpuChange();

      // Ram
      this.enRam;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${RAM}`, this.ramChange.bind(this));
      this.ramChange();

      // Swap
      this.enSwap;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${SWAP}`, this.swapChange.bind(this));
      this.swapChange();

      // Disk Stats
      this.enDiskStats;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_STATS}`, this.diskStatsChange.bind(this));
      this.diskStatsChange();

      // Disk Space
      this.enDiskSpace;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_SPACE}`, this.diskSpaceChange.bind(this));
      this.diskSpaceChange();

      // Eth
      this.enEth;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${ETH}`, this.getSettingsEth.bind(this));
      this.getSettingsEth();

      // Wlan
      this.enWlan;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${WLAN}`, this.getSettingsWlan.bind(this));
      this.getSettingsWlan();

      // Auto Hide
      this.enHide;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${AUTO_HIDE}`, this.hideChange.bind(this));
      this.hideChange();

      // Cpu Temperature
      this.cpuTemperature;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPUTEMPERATURE}`, this.cpuTemperatureChange.bind(this));
      this.cpuTemperatureChange();

      // Cpu Temperature Unit
      this.cpuTemperatureFahrenheit;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPUTEMPERATUREUNIT}`, () => {
        this.cpuTemperatureFahrenheit = this._settings.get_boolean(CPUTEMPERATUREUNIT);

        this.cpuTemperatureUnit.text = this.cpuTemperatureFahrenheit ? '°F' : '°C';
      });
      this.cpuTemperatureFahrenheit = this._settings.get_boolean(CPUTEMPERATUREUNIT);
      this.cpuTemperatureUnit.text = this.cpuTemperatureFahrenheit ? '°F' : '°C'

      // Disks List
      this.disksList;
      this.diskStatsItems = [];
      this.diskSpaceItems = [];
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISKS_LIST}`, this.disksListChange.bind(this));

      // Disk Stats Mode
      this.diskStatsMode;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_STATS_MODE}`, this.diskStatsModeChange.bind(this));

      // Disks Space Unit
      this.disksSpaceUnit;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK_SPACE_UNIT}`, () => {
        this.disksSpaceUnit = this._settings.get_boolean(DISK_SPACE_UNIT);

        this.refreshDiskSpace();
      });
      this.disksSpaceUnit = this._settings.get_boolean(DISK_SPACE_UNIT);

      this.disksListChange();

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
        this.diskStatsWidthUpdate();
      });
      this.diskStatsWidthUpdate();

      // Disk Space
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_DISK_SPACE}`, () => {
        this.diskSpaceWidthUpdate();
      });
      this.diskSpaceWidthUpdate();

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
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_CPUTEMPERATURE}`, () => {
        this.cpuTemperature.width = this._settings.get_int(WIDTH_CPUTEMPERATURE);
      });
      this.cpuTemperature.width = this._settings.get_int(WIDTH_CPUTEMPERATURE);

      // Init Connections State
      this.onActiveConnectionRemoved(this.client);

      /** ### Setup Refresh Timer ### **/
      this.timer;
      this.timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this.interval, this.refresh.bind(this));
      this.refresh();
    }

    initUI() {
      this.box = new St.BoxLayout();

      // Icon
      this.cpuIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'computer-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.ramIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'emblem-system-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.swapIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'system-run-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.diskStatsIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'drive-harddisk-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.diskSpaceIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'drive-harddisk-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.ethIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'network-wired-symbolic' }),
        style_class: 'system-status-icon'
      });

      this.wlanIco = new St.Icon({
        gicon: new Gio.ThemedIcon({ name: 'network-wireless-symbolic' }),
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

      // Label
      this.cpu = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: CPU,
        style_class: 'label'
      });

      this.ram = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: RAM,
        style_class: 'label'
      });

      this.swap = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: SWAP,
        style_class: 'label'
      });

      this.diskStats = new St.BoxLayout();
      this.diskSpace = new St.BoxLayout();

      this.eth = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ETH,
        style_class: 'label'
      });

      this.wlan = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: WLAN,
        style_class: 'label'
      });

      this.cpuTemperature = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: CPUTEMPERATURE,
        style_class: 'label'
      });

      this.temperatureBrackets = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ']',
        style_class: 'label'
      });

      this.box.add(this.cpu);
      this.box.add(this.cpuUnit);

      this.box.add(this.cpuTemperature);
      this.box.add(this.cpuTemperatureUnit);
      this.box.add(this.temperatureBrackets);
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

      this.actor.add_actor(this.box);
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
        var app = global.log(Shell.AppSystem.get_default().lookup_app('gnome-system-monitor.desktop'));

        if (app != null)
          app.activate();
        else
          Util.spawn(['gnome-system-monitor']);
      }
    }

    /** Signals Handler **/
    onActiveConnectionAdded(client, activeConnection) {
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

      this.ethChange();
      this.wlanChange();
    }

    onActiveConnectionRemoved(client) {
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

      this.ethChange();
      this.wlanChange();
    }

    iconsChange() {
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
        if (this.enEth)
          this.ethIco.show();
        if (this.enWlan)
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

    decimalsChange() {
      this.displayDecimals = this._settings.get_boolean(DECIMALS);
    }

    systemMonitorChange() {
      this.displaySystemMonitor = this._settings.get_boolean(SYSTEMMONITOR);
    }

    cpuChange() {
      this.enCpu = this._settings.get_boolean(CPU);
      if (this.enCpu) {
        if (this.displayIcons)
          this.cpuIco.show();
        this.cpu.show();
        this.cpuUnit.show();
      } else {
        if (!this.enCpuTemperature)
          this.cpuIco.hide();
        this.cpu.hide();
        this.cpuUnit.hide();
      }
    }

    ramChange() {
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

    swapChange() {
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

    diskStatsChange() {
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

    diskSpaceChange() {
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

    getSettingsEth() {
      this.enEth = this._settings.get_boolean(ETH);

      this.ethChange();
    }

    ethChange() {
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

    getSettingsWlan() {
      this.enWlan = this._settings.get_boolean(WLAN);

      this.wlanChange();
    }

    wlanChange() {
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

    hideChange() {
      this.enHide = this._settings.get_boolean(AUTO_HIDE);

      this.ethChange();
      this.wlanChange();
    }

    diskStatsWidthUpdate() {
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

    diskSpaceWidthUpdate() {
      for (let i = 0; i < this.disksList.length; i++) {
        let element = this.disksList[i];
        let it = element.split(' ');
        let field = this.diskSpaceItems[it[0]];

        if (typeof (field) !== 'undefined') {
          field[0].width = this._settings.get_int(WIDTH_DISK_SPACE);
        }
      }
    }

    diskStatsUpdate() {
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
          text: DISK_STATS,
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
              text: '0',
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

    diskSpaceUpdate() {
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
            text: '0',
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

    disksListChange() {
      this.disksList = this._settings.get_strv(DISKS_LIST);

      this.diskStatsUpdate();
      this.diskSpaceUpdate();
    }

    diskStatsModeChange() {
      this.diskStatsMode = this._settings.get_boolean(DISK_STATS_MODE);

      this.diskStatsUpdate();
      this.refreshDiskStats();
    }

    cpuTemperatureChange() {
      this.enCpuTemperature = this._settings.get_boolean(CPUTEMPERATURE);
      if (this.enCpuTemperature) {
        if (this.displayIcons)
          this.cpuIco.show();
        this.temperatureBrackets.show()
        this.cpuTemperature.show();
        this.cpuTemperatureUnit.show();
      } else {
        if (!this.enCpu)
          this.cpuIco.hide();
        this.temperatureBrackets.hide();
        this.cpuTemperature.hide();
        this.cpuTemperatureUnit.hide();
      }
    }

    /*********************/

    refresh() {
      if (this.enCpu)
        this.refreshCpu();
      if (this.enRam)
        this.refreshRam();
      if (this.enSwap)
        this.refreshSwap();
      if (this.enDiskStats)
        this.refreshDiskStats();
      if (this.enDiskSpace)
        this.refreshDiskSpace();
      if (this.enEth)
        this.refreshEth();
      if (this.enWlan)
        this.refreshWlan();
      if (this.enCpuTemperature)
        this.refreshCpuTemperature();

      return true;
    }

    refreshCpu() {
      var lines = Shell.get_file_contents_utf8_sync('/proc/stat').split('\n');
      var entry = lines[0].trim().split(/\s+/);
      var cpuTot = 0;
      var idle = parseInt(entry[4]);

      // user sys nice idle iowait
      for (let i = 1; i < 5; i++)
        cpuTot += parseInt(entry[i]);

      var delta = cpuTot - this.cpuTotOld;
      var deltaIdle = idle - this.idleOld;

      var cpuCurr = 100 * (delta - deltaIdle) / delta;

      this.cpuTotOld = cpuTot;
      this.idleOld = idle;

      if (this.displayDecimals) {
        this.cpu.text = `${cpuCurr.toFixed(1)}`;
      } else {
        this.cpu.text = `${cpuCurr.toFixed(0)}`;
      }
    }

    refreshRam() {
      var total, available, used;
      var lines = Shell.get_file_contents_utf8_sync('/proc/meminfo').split('\n');

      for (let i = 0; i < 3; i++) {
        var values;
        var line = lines[i];

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
    }

    refreshSwap() {
      var total, available, used;
      var lines = Shell.get_file_contents_utf8_sync('/proc/meminfo').split('\n');

      for (let i = 0; i < 16; i++) {
        var values;
        var line = lines[i];

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
    }

    refreshDiskStats() {
      var lines = Shell.get_file_contents_utf8_sync('/proc/diskstats').split('\n');

      if (this.diskStatsMode === true) {
        let field = this.diskStatsItems['All'];

        var rwTot = [0, 0];
        var rw = [0, 0];

        for (let i = 0; i < this.disksList.length; i++) {
          let element = this.disksList[i];
          let it = element.split(' ');

          for (let j = 0; j < lines.length; j++) {
            var line = lines[j];
            var entry = line.trim().split(/\s+/); // TODO search by name
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

        var idle = GLib.get_monotonic_time() / 1000;
        var delta = (idle - this.idleDiskOld['All']) / 1000;

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

          if (typeof (field) === 'undefined') {
            continue;
          }

          var rwTot = [0, 0];
          var rw = [0, 0];

          for (let j = 0; j < lines.length; j++) {
            var line = lines[j];

            var entry = line.trim().split(/\s+/); // TODO search by name
            if (typeof (entry[1]) === 'undefined')
              break;

            // Same Name
            if (it[0].endsWith(entry[2])) {
              rwTot[0] += parseInt(entry[5]);
              rwTot[1] += parseInt(entry[9]);
              break;
            }
          }

          var idle = GLib.get_monotonic_time() / 1000;
          var delta = (idle - this.idleDiskOld[it[0]]) / 1000;

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
        }
      }
    }

    refreshDiskSpace() {
      let proc = Gio.Subprocess.new(['/usr/bin/df'], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);

      proc.communicate_utf8_async(null, null, (proc, res) => {
        try {
            let [, stdout, stderr] = proc.communicate_utf8_finish(res);

            if (proc.get_successful()) {
              let lines = stdout.split('\n');

              for (let i = 0; i < this.disksList.length; i++) {
                let element = this.disksList[i];
                let it = element.split(' ');
                let field = this.diskSpaceItems[it[0]];

                for (let j = 0; j < lines.length; j++) {
                  var line = lines[j];
                  var entry = line.trim().split(/\s+/);
                  if (typeof (entry[1]) === 'undefined')
                    break;

                  // Same Name
                  if (it[0].endsWith(entry[0])) {
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

    refreshEth() {
      var duTot = [0, 0];
      var du = [0, 0];
      var lines = Shell.get_file_contents_utf8_sync('/proc/net/dev').split('\n');

      for (let i = 2; i < lines.length - 1; i++) {
        var line = lines[i];
        var entry = line.trim().split(':');
        if (entry[0].match(/(eth[0-9]+|en[a-z0-9]*)/)) {
          var values = entry[1].trim().split(/\s+/);

          duTot[0] += parseInt(values[0]);
          duTot[1] += parseInt(values[8]);
        }
      }

      var idle = GLib.get_monotonic_time() / 1000;
      var delta = (idle - this.idleEthOld) / 1000;

      if (delta > 0) {
        for (let i = 0; i < 2; i++) {
          du[i] = (duTot[i] - this.duTotEthOld[i]) / delta;
          this.duTotEthOld[i] = duTot[i];
        }

        if (du[0] > 1024 || du[1] > 1024) {
          this.ethUnit.text = 'K';
          du[0] /= 1024;
          du[1] /= 1024;
          if (du[0] > 1024 || du[1] > 1024) {
            this.ethUnit.text = 'M';
            du[0] /= 1024;
            du[1] /= 1024;
            if (du[0] > 1024 || du[1] > 1024) {
              this.ethUnit.text = 'G';
              du[0] /= 1024;
              du[1] /= 1024;
            }
          }
        } else {
          this.ethUnit.text = 'B';
        }
      }

      this.idleEthOld = idle;

      if (this.displayDecimals) {
        this.eth.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
      } else {
        this.eth.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
      }
    }

    refreshWlan() {
      var duTot = [0, 0];
      var du = [0, 0];
      var lines = Shell.get_file_contents_utf8_sync('/proc/net/dev').split('\n');

      for (let i = 2; i < lines.length - 1; i++) {
        var line = lines[i];
        var entry = line.trim().split(':');
        if (entry[0].match(/(wlan[0-9]+|wl[a-z0-9]*)/)) {
          var values = entry[1].trim().split(/\s+/);

          duTot[0] += parseInt(values[0]);
          duTot[1] += parseInt(values[8]);
        }
      }

      var idle = GLib.get_monotonic_time() / 1000;
      var delta = (idle - this.idleWlanOld) / 1000;

      if (delta > 0) {
        for (let i = 0; i < 2; i++) {
          du[i] = (duTot[i] - this.duTotWlanOld[i]) / delta;
          this.duTotWlanOld[i] = duTot[i];
        }

        if (du[0] > 1024 || du[1] > 1024) {
          this.wlanUnit.text = 'K';
          du[0] /= 1024;
          du[1] /= 1024;
          if (du[0] > 1024 || du[1] > 1024) {
            this.wlanUnit.text = 'M';
            du[0] /= 1024;
            du[1] /= 1024;
            if (du[0] > 1024 || du[1] > 1024) {
              this.wlanUnit.text = 'G';
              du[0] /= 1024;
              du[1] /= 1024;
            }
          }
        } else {
          this.wlanUnit.text = 'B';
        }
      }

      this.idleWlanOld = idle;

      if (this.displayDecimals) {
        this.wlan.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
      } else {
        this.wlan.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
      }
    }

    refreshCpuTemperature() {
      var cpuTemperatureFile = '/sys/devices/virtual/thermal/thermal_zone0/temp';
      if (GLib.file_test(cpuTemperatureFile, GLib.FileTest.EXISTS)) {
        var file = Gio.file_new_for_path(cpuTemperatureFile);
        file.load_contents_async(null, (source, result) => {
          var contents = source.load_contents_finish(result);
          var temperature = parseInt(contents[1]) / 1000;

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
  });

function init() {
  ExtensionUtils.initTranslations();
}

function enable() {
  ResourceMonitorIndicator = new ResourceMonitor();
  Main.panel.addToStatusArea(IndicatorName, ResourceMonitorIndicator);
}

function disable() {
  ResourceMonitorIndicator.destroy();
  ResourceMonitorIndicator = null;
}
