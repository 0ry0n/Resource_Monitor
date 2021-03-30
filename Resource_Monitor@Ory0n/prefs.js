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

const { Gio, GObject, Gtk, GLib } = imports.gi;
const Gettex = imports.gettext.domain('com-github-0ry0n-Resource_Monitor');
const _ = Gettex.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
  ExtensionUtils.initTranslations();
}

const ResourceMonitorPrefsWidget = GObject.registerClass(
  class ResourceMonitorPrefsWidget extends Gtk.Notebook {
    _init(params) {
      super._init(params);

      // Settings
      this._settings = ExtensionUtils.getSettings();

      // Parent
      this.margin = 12;

      // GLOBAL
      let globalFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      // REFRESH
      let alignmentRefresh = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      globalFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Refresh Time')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      globalFrame.add(alignmentRefresh);

      let gridRefresh = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentRefresh.add(gridRefresh);

      gridRefresh.attach(new Gtk.Label({
        label: '%s'.format(_('Seconds')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let adjustment = new Gtk.Adjustment({
        lower: 1,
        upper: 30,
        step_increment: 1
      });
      this._settings.bind('interval', adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);

      gridRefresh.attach(new Gtk.HScale({
        adjustment: adjustment,
        hexpand: true,
        digits: 0
      }), 1, 0, 1, 1);

      // ICONS
      let alignmentIcons = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      globalFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Icons')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      globalFrame.add(alignmentIcons);

      let gridIcons = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentIcons.add(gridIcons);

      gridIcons.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueIcons = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('icons', valueIcons, 'active', Gio.SettingsBindFlags.DEFAULT);
      gridIcons.attach(valueIcons, 1, 0, 1, 1);

      gridIcons.attach(new Gtk.Label({
        label: '%s'.format(_('Position')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 1, 1, 1);

      let valueIconsPosition = new Gtk.ComboBoxText({
        halign: Gtk.Align.END
      });
      valueIconsPosition.insert_text(0, 'LEFT');
      valueIconsPosition.insert_text(1, 'RIGHT');
      this._settings.bind('iconsposition', valueIconsPosition, 'active', Gio.SettingsBindFlags.DEFAULT);
      
      valueIcons.connect('state-set', button => {
        valueIconsPosition.sensitive = button.active;
      });
      valueIconsPosition.sensitive = valueIcons.active;

      gridIcons.attach(valueIconsPosition, 1, 1, 1, 1);

      // DECIMALS
      let alignmentDecimals = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      globalFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Decimals')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      globalFrame.add(alignmentDecimals);

      let gridDecimals = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentDecimals.add(gridDecimals);

      gridDecimals.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueDecimals = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('decimals', valueDecimals, 'active', Gio.SettingsBindFlags.DEFAULT);
      gridDecimals.attach(valueDecimals, 1, 0, 1, 1);

      // ENABLE SHOW SYSTEM MONITOR
      let alignmentShowSM = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      globalFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('System Monitor')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      globalFrame.add(alignmentShowSM);

      let gridShowSM = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentShowSM.add(gridShowSM);

      gridShowSM.attach(new Gtk.Label({
        label: '%s'.format(_('Show System Monitor when clicking on extension')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueShowSM = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('showsystemmonitor', valueShowSM, 'active', Gio.SettingsBindFlags.DEFAULT);
      gridShowSM.attach(valueShowSM, 1, 0, 1, 1);

      this.append_page(globalFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Global')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      // CPU
      let cpuFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      let gridCpu = new Gtk.Grid({
        row_spacing: 6
      });
      cpuFrame.add(gridCpu);

      gridCpu.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueCpu = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('cpu', valueCpu, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueCpu.connect('state-set', button => {
        widthCpu.sensitive = button.active;
      });
      gridCpu.attach(valueCpu, 1, 0, 1, 1);

      gridCpu.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthCpu = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthcpu', widthCpu, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthCpu.sensitive = valueCpu.active;
      gridCpu.attach(widthCpu, 1, 1, 1, 1);

      this.append_page(cpuFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Cpu')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      // RAM
      let ramFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      let gridRam = new Gtk.Grid({
        row_spacing: 6
      });
      ramFrame.add(gridRam);

      gridRam.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueRam = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('ram', valueRam, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueRam.connect('state-set', button => {
        widthRam.sensitive = button.active;
      });
      gridRam.attach(valueRam, 1, 0, 1, 1);

      gridRam.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthRam = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthram', widthRam, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthRam.sensitive = valueRam.active;
      gridRam.attach(widthRam, 1, 1, 1, 1);

      this.append_page(ramFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Ram')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      // SWAP
      let swapFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      let gridSwap = new Gtk.Grid({
        row_spacing: 6
      });
      swapFrame.add(gridSwap);

      gridSwap.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueSwap = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('swap', valueSwap, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueSwap.connect('state-set', button => {
        widthSwap.sensitive = button.active;
      });
      gridSwap.attach(valueSwap, 1, 0, 1, 1);

      gridSwap.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthSwap = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthswap', widthSwap, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthSwap.sensitive = valueSwap.active;
      gridSwap.attach(widthSwap, 1, 1, 1, 1);

      this.append_page(swapFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Swap')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      // DISK
      let diskFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      let gridDisk = new Gtk.Grid({
        row_spacing: 6
      });
      diskFrame.add(gridDisk);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Display Stats')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueDiskStats = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('diskstats', valueDiskStats, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueDiskStats.connect('state-set', button => {
        widthDiskStats.sensitive = button.active;
        valueDiskStatsMode.sensitive = button.active;
      });
      gridDisk.attach(valueDiskStats, 1, 0, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthDiskStats = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthdiskstats', widthDiskStats, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthDiskStats.sensitive = valueDiskStats.active;
      gridDisk.attach(widthDiskStats, 1, 1, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Display All In One')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 2, 1, 1);

      let valueDiskStatsMode = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('diskstatsmode', valueDiskStatsMode, 'active', Gio.SettingsBindFlags.DEFAULT);
      // Init
      valueDiskStatsMode.sensitive = valueDiskStats.active;
      gridDisk.attach(valueDiskStatsMode, 1, 2, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Display Space')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 3, 1, 1);

      let valueDiskSpace = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('diskspace', valueDiskSpace, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueDiskSpace.connect('state-set', button => {
        widthDiskSpace.sensitive = button.active;
        valueDiskSpaceUnit.sensitive = button.active;
      });
      gridDisk.attach(valueDiskSpace, 1, 3, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 4, 1, 1);

      let widthDiskSpace = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthdiskspace', widthDiskSpace, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthDiskSpace.sensitive = valueDiskSpace.active;
      gridDisk.attach(widthDiskSpace, 1, 4, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Percentage Unit')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 5, 1, 1);

      let valueDiskSpaceUnit = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('diskspaceunit', valueDiskSpaceUnit, 'active', Gio.SettingsBindFlags.DEFAULT);
      // Init
      valueDiskSpaceUnit.sensitive = valueDiskSpace.active;
      gridDisk.attach(valueDiskSpaceUnit, 1, 5, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Devices')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 6, 1, 1);

      let view = new Gtk.ScrolledWindow();
      view.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

      let mainBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        vexpand: true,
        valign: Gtk.Align.FILL
      });
      view.add_with_viewport(mainBox);

      let list = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE
      });
      mainBox.add(list);

      gridDisk.attach(view, 0, 7, 2, 1);

      /****************************************************/

      // Array format
      // name stats space
      // Get current disks settings
      let disksArray = this._settings.get_strv('diskslist', Gio.SettingsBindFlags.DEFAULT);

      let file = GLib.file_get_contents('/proc/mounts');
      let lines = ('' + file[1]).split('\n');

      let x = 0;

      for (let j = 0; j < lines.length; j++) {
        let line = lines[j];
        let entry = line.trim().split(/\s/);

        let name = entry[0];
        let path = entry[1];

        if (typeof (name) === 'undefined' || name === '' || name.match(/\/dev\/loop\d*/) || (name.match(/^[^\/]/) && !path.match(/\/media\//)))
          continue;

        let gridElement = new Gtk.Grid({
          row_spacing: 6,
          orientation: Gtk.Orientation.HORIZONTAL
        });

        let dName = new Gtk.Label({
          label: '%s'.format(_(name)),
          halign: Gtk.Align.START,
          margin_end: 10,
          hexpand: true
        });
        gridElement.attach(dName, 0, 0, 1, 1);

        gridElement.attach(new Gtk.Label({
          label: '%s'.format(_(path)),
          halign: Gtk.Align.START,
          margin_end: 10,
          hexpand: true
        }), 1, 0, 1, 1);

        let dStatsButton = new Gtk.CheckButton({
          label: '%s'.format(_("Stats")),
          active: false
        });
        gridElement.attach(dStatsButton, 2, 0, 1, 1);

        let dSpaceButton = new Gtk.CheckButton({
          label: '%s'.format(_("Space")),
          active: false
        });
        gridElement.attach(dSpaceButton, 3, 0, 1, 1);

        for (let i = 0; i < disksArray.length; i++) {
          let element = disksArray[i];
          let it = element.split(' ');

          if (name === it[0]) {
            let dStButton = (it[1] === 'true');
            let dSpButton = (it[2] === 'true');

            dStatsButton.active = dStButton;
            dSpaceButton.active = dSpButton;

            break;
          }
        }

        dStatsButton.connect('toggled', button => {
          // Save new button state
          let found = false;

          for (let i = 0; i < disksArray.length; i++) {
            let element = disksArray[i];
            let it = element.split(' ');

            if (name === it[0]) {
              it[1] = button.active;
              disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2];

              found = true;
              break;
            }
          }

          // Add new disks
          if (found === false) {
            disksArray.push(name + ' ' + dStatsButton.active + ' ' + dSpaceButton.active);
            found = false;
          }

          // Save all
          this._settings.set_strv('diskslist', disksArray);
        });

        dSpaceButton.connect('toggled', button => {
          // Save new button state
          let found = false;

          for (let i = 0; i < disksArray.length; i++) {
            let element = disksArray[i];
            let it = element.split(' ');

            if (name === it[0]) {
              it[2] = button.active;
              disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2];

              found = true;
              break;
            }
          }

          // Add new disks
          if (found === false) {
            disksArray.push(name + ' ' + dStatsButton.active + ' ' + dSpaceButton.active);
            found = false;
          }

          // Save all
          this._settings.set_strv('diskslist', disksArray);
        });

        list.insert(gridElement, x++);
      }

      /****************************************************/

      this.append_page(diskFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Disk')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      let netFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      // AUTO HIDE
      let alignmentAutoHide = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      netFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Auto Hide')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      netFrame.add(alignmentAutoHide);

      let gridAutoHide = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentAutoHide.add(gridAutoHide);

      gridAutoHide.attach(new Gtk.Label({
        label: '%s'.format(_('Enable')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueAutoHide = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('autohide', valueAutoHide, 'active', Gio.SettingsBindFlags.DEFAULT);
      gridAutoHide.attach(valueAutoHide, 1, 0, 1, 1);

      // ETH
      let alignmentEth = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      netFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Eth')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      netFrame.add(alignmentEth);

      let gridEth = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentEth.add(gridEth);

      gridEth.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueEth = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('eth', valueEth, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueEth.connect('state-set', button => {
        widthEth.sensitive = button.active;
      });
      gridEth.attach(valueEth, 1, 0, 1, 1);

      gridEth.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthEth = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widtheth', widthEth, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthEth.sensitive = valueEth.active;
      gridEth.attach(widthEth, 1, 1, 1, 1);

      // WLAN
      let alignmentWlan = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      netFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Wlan')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      netFrame.add(alignmentWlan);

      let gridWlan = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentWlan.add(gridWlan);

      gridWlan.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueWlan = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('wlan', valueWlan, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueWlan.connect('state-set', button => {
        widthWlan.sensitive = button.active;
      });
      gridWlan.attach(valueWlan, 1, 0, 1, 1);

      gridWlan.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthWlan = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthwlan', widthWlan, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthWlan.sensitive = valueWlan.active;
      gridWlan.attach(widthWlan, 1, 1, 1, 1);

      this.append_page(netFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Net')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));

      // TEMPERATURE
      let temperatureFrame = new Gtk.Grid({
        margin: 12,
        row_spacing: 6,
        orientation: Gtk.Orientation.VERTICAL
      });

      let alignmentTemperature = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      temperatureFrame.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Cpu Temperature')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      temperatureFrame.add(alignmentTemperature);

      let gridTemperature = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentTemperature.add(gridTemperature);

      gridTemperature.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueTemperature = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('cputemperature', valueTemperature, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueTemperature.connect('state-set', button => {
        widthTemperature.sensitive = button.active;
        valueCpuTemperatureUnit.sensitive = button.active;
      });
      gridTemperature.attach(valueTemperature, 1, 0, 1, 1);

      gridTemperature.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthTemperature = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 1,
          upper: 500,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthcputemperature', widthTemperature, 'value', Gio.SettingsBindFlags.DEFAULT);

      gridTemperature.attach(new Gtk.Label({
        label: '%s'.format(_('Fahrenheit Unit')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 3, 1, 1);

      let valueCpuTemperatureUnit = new Gtk.Switch({
        halign: Gtk.Align.END
      });

      this._settings.bind('cputemperatureunit', valueCpuTemperatureUnit, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueCpuTemperatureUnit.connect('state-set', button => {
        valueCpuTemperatureUnit.value = button.active;
      });
      gridTemperature.attach(valueCpuTemperatureUnit, 1, 3, 1, 1);

      // Init
      widthTemperature.sensitive = valueTemperature.active;
      valueCpuTemperatureUnit.sensitive = valueTemperature.active;
      gridTemperature.attach(widthTemperature, 1, 1, 1, 1);

      this.append_page(temperatureFrame, new Gtk.Label({
        label: '<b>%s</b>'.format(_('Thermal')),
        use_markup: true,
        halign: Gtk.Align.CENTER
      }));
    }
  }
);

function buildPrefsWidget() {
  let widget = new ResourceMonitorPrefsWidget();
  widget.show_all();

  return widget;
}
