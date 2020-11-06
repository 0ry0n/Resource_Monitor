/*
 * Resource_Monitor is Copyright © 2018-2020 Giuseppe Silvestro
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
const Mainloop = imports.mainloop;

const Gettext = imports.gettext.domain('com-github-Ory0n-Resource_Monitor');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var ResourceMonitorIndicator;
var IndicatorName = Me.metadata['name'];

const INTERVAL = 'interval';
const ICONS = 'icons';
const DECIMALS = 'decimals';
const CPU = 'cpu';
const RAM = 'ram';
const DISK = 'disk';
const ETH = 'eth';
const WLAN = 'wlan';
const CPUTEMPERATURE = 'cputemperature';
const CHOSEN_DISK = 'chosendisk';
const AUTO_HIDE = 'autohide';
const WIDTH_CPU = 'widthcpu';
const WIDTH_RAM = 'widthram';
const WIDTH_DISK = 'widthdisk';
const WIDTH_ETH = 'widtheth';
const WIDTH_WLAN = 'widthwlan';
const WIDTH_CPUTEMPERATURE = 'widthcputemperature';

const CPUTEMPERATUREUNIT = 'cputemperatureunit';

const INTERVAL_HIDE = 2;

var ResourceMonitor = GObject.registerClass(
  class ResourceMonitor extends PanelMenu.Button {
    _init(params) {
      super._init(params, IndicatorName);
      this.actor.connect('button-press-event', this._openSystemMonitor.bind(this));

      this._settings = ExtensionUtils.getSettings();

      this.client = NM.Client.new(null);

      /** ### **/

      this.idleOld = 0;
      this.cpuTotOld = 0;

      this.idleDiskOld = 0;
      this.rwTotOld = [0, 0];

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
          Mainloop.source_remove(this.timer);
          this.timer = null;
        }

        this.timer = Mainloop.timeout_add_seconds(this.interval, this.refresh.bind(this));
      });

      // Icons
      this.displayIcons;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${ICONS}`, this.iconsChange.bind(this));
      this.iconsChange();

      // Decimals
      this.displayDecimals;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DECIMALS}`, this.decimalsChange.bind(this));
      this.decimalsChange();

      // Cpu
      this.enCpu;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${CPU}`, this.cpuChange.bind(this));
      this.cpuChange();

      // Ram
      this.enRam;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${RAM}`, this.ramChange.bind(this));
      this.ramChange();

      // Disk
      this.enDisk;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${DISK}`, this.diskChange.bind(this));
      this.diskChange();

      this.onWlan = true;
      this.onEth = true;

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

      // Chosen Disk
      this.chosenDisk;
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${CHOSEN_DISK}`, this.chosenDiskChange.bind(this));
      this.chosenDiskChange();

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

      // Disk
      this.sigId[this.numSigId++] = this._settings.connect(`changed::${WIDTH_DISK}`, () => {
        this.disk.width = this._settings.get_int(WIDTH_DISK);
      });
      this.disk.width = this._settings.get_int(WIDTH_DISK);

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

      /** ### ### ### ### **/

      this.timerHide;
      this.refreshHide();

      this.timer;
      this.refresh();
    }

    initUI() {
      this.box = new St.BoxLayout();

      // Icon
      this.cpuIco = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'computer-symbolic'}),
        style_class: 'system-status-icon'
      });

      this.ramIco = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'emblem-system-symbolic'}),
        style_class: 'system-status-icon'
      });

      this.diskIco = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'drive-harddisk-symbolic'}),
        style_class: 'system-status-icon'
      });

      this.ethIco  = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'network-wired-symbolic'}),
        style_class: 'system-status-icon'
      });

      this.wlanIco = new St.Icon({
        gicon: new Gio.ThemedIcon({name: 'network-wireless-symbolic'}),
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

      this.diskUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: 'K',
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

      this.disk = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: DISK,
        style_class: 'label'
      });

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

      this.box.add(this.disk);
      this.box.add(this.diskUnit);
      this.box.add(this.diskIco);

      this.box.add(this.eth);
      this.box.add(this.ethUnit);
      this.box.add(this.ethIco);

      this.box.add(this.wlan);
      this.box.add(this.wlanUnit);
      this.box.add(this.wlanIco);

      this.actor.add_actor(this.box);
    }

    destroy() {
      if (this.timerHide) {
        Mainloop.source_remove(this.timerHide);
        this.timerHide = null;
      }

      if (this.timer) {
        Mainloop.source_remove(this.timer);
        this.timer = null;
      }

      /** ## Signals Disconnection ## **/
      for (var i = 0; i < this.numSigId; i++) {
        this._settings.disconnect(this.sigId[i]);
        this.sigId[i] = 0;
      }

      super.destroy();
    }

    _openSystemMonitor() {
      var app = global.log(Shell.AppSystem.get_default().lookup_app('gnome-system-monitor.desktop'));

      if (app != null)
        app.activate();
      else
        Util.spawn(['gnome-system-monitor']);
    }

    /** Signals Handler **/

    iconsChange() {
      this.displayIcons = this._settings.get_boolean(ICONS);
    	if (this.displayIcons) {
    		if (this.enCpu)
    			this.cpuIco.show();
    		if (this.enRam)
    			this.ramIco.show();
    		if (this.enDisk)
    			this.diskIco.show();
    		if (this.enEth)
    			this.ethIco.show();
    		if (this.enWlan)
    			this.wlanIco.show();
    	} else {
    		this.cpuIco.hide();
    		this.ramIco.hide();
    		this.diskIco.hide();
    		this.ethIco.hide();
    		this.wlanIco.hide();
    	}
    }

    decimalsChange() {
      this.displayDecimals = this._settings.get_boolean(DECIMALS);
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

    diskChange() {
    	this.enDisk = this._settings.get_boolean(DISK);
    	if (this.enDisk) {
    		if (this.displayIcons)
    			this.diskIco.show();
    		this.disk.show();
    		this.diskUnit.show();
    	} else {
    		this.diskIco.hide();
    		this.disk.hide();
    		this.diskUnit.hide();
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
    	if (this.enHide) {
    		this.refreshHide();
    	} else {
        if (this.timerHide) {
          Mainloop.source_remove(this.timerHide);
          this.timerHide = null;
        }

    		this.onEth = true;
    		this.onWlan = true;
    		this.ethChange();
    		this.wlanChange();
    	}
    }

    chosenDiskChange() {
    	this.chosenDisk = this._settings.get_string(CHOSEN_DISK);
      this.idleDiskOld = 0;
      this.rwTotOld = [0, 0];
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
      if (this.enDisk)
        this.refreshDisk();
      if (this.enEth)
        this.refreshEth();
      if (this.enWlan)
        this.refreshWlan();
      if (this.enCpuTemperature)
        this.refreshCpuTemperature();

      if (this.timer) {
        Mainloop.source_remove(this.timer);
        this.timer = null;
      }

      this.timer = Mainloop.timeout_add_seconds(this.interval, this.refresh.bind(this));
    }

    refreshHide() {
      if (this.enEth || this.enWlan) {
        var devices = this.client.get_devices();
        var e = true, w = true;

        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];

          switch (device.get_device_type()) {

            case NM.DeviceType.ETHERNET: {
              e = false;
              if (device.active_connection) {
                if (device.active_connection.state === NM.ActiveConnectionState.ACTIVATED)
                  this.onEth = true;
              } else
                this.onEth = false;
            } break;

            case NM.DeviceType.WIFI: {
              w = false;
              if (device.active_connection) {
                if (device.active_connection.state === NM.ActiveConnectionState.ACTIVATED)
                  this.onWlan = true;
              } else
                this.onWlan = false;
            } break;

            default:

          }
        }

        if (e) {
          this.onEth = false;
        }

        if (w) {
          this.onWlan = false;
        }

        this.ethChange();
        this.wlanChange();
      }

      if (this.timerHide) {
        Mainloop.source_remove(this.timerHide);
        this.timerHide = null;
      }

      this.timerHide = Mainloop.timeout_add_seconds(INTERVAL_HIDE, this.refreshHide.bind(this));
    }

    refreshCpu() {
      var lines = Shell.get_file_contents_utf8_sync('/proc/stat').split('\n');
      var entry = lines[0].trim().split(/[\s]+/);
      var cpuTot = 0;
      var idle = parseInt(entry[4]);

      // user sys nice idle iowait
      for (var i = 1; i < 5; i++)
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
      var total, free, buffer, cached, used;
      var lines = Shell.get_file_contents_utf8_sync('/proc/meminfo').split('\n');

      for (var i = 0; i < 5; i++) {
        var values;
        var line = lines[i];

        if (line.match(/^MemTotal/)) {
          values = line.match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);
          total = parseInt(values[1]);
        } else if (line.match(/^MemFree/)) {
          values = line.match(/^MemFree:\s*([^ ]*)\s*([^ ]*)$/);
          free = parseInt(values[1]);
        }	else if (line.match(/^Buffers/)) {
          values = line.match(/^Buffers:\s*([^ ]*)\s*([^ ]*)$/);
          buffer = parseInt(values[1]);
        }	else if (line.match(/^Cached/)) {
          values = line.match(/^Cached:\s*([^ ]*)\s*([^ ]*)$/);
          cached = parseInt(values[1]);
        }
      }

      used = total - free - buffer - cached;

      if (this.displayDecimals) {
        this.ram.text = `${(100*used/total).toFixed(1)}`;
      } else {
        this.ram.text = `${(100*used/total).toFixed(0)}`;
      }
    }

    refreshDisk() {
      var rwTot = [0, 0];
      var rw = [0, 0];
      var lines = Shell.get_file_contents_utf8_sync('/proc/diskstats').split('\n');

      if (this.chosenDisk === 'All') {
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          var entry = line.trim().split(/[\s]+/);
          if (typeof (entry[1]) === 'undefined')
            break;

          if (entry[2].match(/loop\d*/))
            continue;

          rwTot[0] += parseInt(entry[5]);
          rwTot[1] += parseInt(entry[9]);
        }
      } else {
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          var entry = line.trim().split(/[\s]+/);
          if (typeof (entry[1]) === 'undefined')
            break;

          if (entry[2] === this.chosenDisk) {
            rwTot[0] += parseInt(entry[5]);
            rwTot[1] += parseInt(entry[9]);
            break;
          }
        }
      }

      var idle = GLib.get_monotonic_time() / 1000;
      var delta = (idle - this.idleDiskOld) / 1000;

      if (delta > 0) {
        for ( var i = 0; i < 2; i++) {
          rw[i] =  (rwTot[i] - this.rwTotOld[i]) / delta;
          this.rwTotOld[i] = rwTot[i];
        }

        if (rw[0] > 1024 || rw[1] > 1024) {
          this.diskUnit.text = 'M';
          rw[0] /= 1024;
          rw[1] /= 1024;
          if (rw[0] > 1024 || rw[1] > 1024) {
            this.diskUnit.text = 'G';
            rw[0] /= 1024;
            rw[1] /= 1024;
          }
        } else {
          this.diskUnit.text = 'K';
        }
      }

      this.idleDiskOld = idle;

      if (this.displayDecimals) {
        this.disk.text = `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`;
      } else {
        this.disk.text = `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`;
      }
    }

    refreshEth() {
      var duTot = [0, 0];
      var du = [0, 0];
      var lines = Shell.get_file_contents_utf8_sync('/proc/net/dev').split('\n');

      for (var i = 2; i < lines.length - 1; i++) {
        var line = lines[i];
        var entry = line.trim().split(':');
        if (entry[0].match(/(eth[0-9]+|en[a-z0-9]*)/)) {
          var values = entry[1].trim().split(/[\s]+/);

          duTot[0] += parseInt(values[0]);
          duTot[1] += parseInt(values[8]);
        }
      }

      var idle = GLib.get_monotonic_time() / 1000;
      var delta = (idle - this.idleEthOld) / 1000;

      if (delta > 0) {
        for ( var i = 0; i < 2; i++) {
          du[i] =  (duTot[i] - this.duTotEthOld[i]) / delta;
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

      for (var i = 2; i < lines.length - 1; i++) {
        var line = lines[i];
        var entry = line.trim().split(':');
        if (entry[0].match(/(wlan[0-9]+|wl[a-z0-9]*)/)) {
          var values = entry[1].trim().split(/[\s]+/);

          duTot[0] += parseInt(values[0]);
          duTot[1] += parseInt(values[8]);
        }
      }

      var idle = GLib.get_monotonic_time() / 1000;
      var delta = (idle - this.idleWlanOld) / 1000;

      if (delta > 0) {
        for ( var i = 0; i < 2; i++) {
          du[i] =  (duTot[i] - this.duTotWlanOld[i]) / delta;
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
