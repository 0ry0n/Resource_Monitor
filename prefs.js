/*
 * Resource_Monitor is Copyright © 2018-2019 Giuseppe Silvestro
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

const { Gio, GObject, Gtk, GLib } = imports.gi;
const Gettex = imports.gettext.domain('com-github-Ory0n-Resource_Monitor');
const _ = Gettex.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
  Convenience.initTranslations();
}

const ResourceMonitorPrefsWidget = GObject.registerClass(
  class ResourceMonitorPrefsWidget extends Gtk.Grid {
    _init(params) {
      super._init(params);

      // Settings
      this._settings = Convenience.getSettings();

      // Parent
      this.margin = 12;
      this.row_spacing = 6;
      this.orientation = Gtk.Orientation.VERTICAL;

      // REFRESH
      let alignmentRefresh = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Refresh')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentRefresh);

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

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Icons')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentIcons);

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

      // CPU
      let alignmentCpu = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Cpu')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentCpu);

      let gridCpu = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentCpu.add(gridCpu);

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
          lower: 22,
          upper: 40,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthcpu', widthCpu, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthCpu.sensitive = valueCpu.active;
      gridCpu.attach(widthCpu, 1, 1, 1, 1);

      // RAM
      let alignmentRam = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Ram')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentRam);

      let gridRam = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentRam.add(gridRam);

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
          lower: 22,
          upper: 40,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthram', widthRam, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthRam.sensitive = valueRam.active;
      gridRam.attach(widthRam, 1, 1, 1, 1);

      // DISK
      let alignmentDisk = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Disk')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentDisk);

      let gridDisk = new Gtk.Grid({
        row_spacing: 6
      });
      alignmentDisk.add(gridDisk);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Display')),
        halign: Gtk.Align.START,
        hexpand: true
      }), 0, 0, 1, 1);

      let valueDisk = new Gtk.Switch({
        halign: Gtk.Align.END
      });
      this._settings.bind('disk', valueDisk, 'active', Gio.SettingsBindFlags.DEFAULT);
      valueDisk.connect('state-set', button => {
        widthDisk.sensitive = button.active;
        combobox.sensitive = button.active;
      });
      gridDisk.attach(valueDisk, 1, 0, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Width')),
        halign: Gtk.Align.START
      }), 0, 1, 1, 1);

      let widthDisk = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower: 22,
          upper: 80,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthdisk', widthDisk, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthDisk.sensitive = valueDisk.active;
      gridDisk.attach(widthDisk, 1, 1, 1, 1);

      gridDisk.attach(new Gtk.Label({
        label: '%s'.format(_('Choose')),
        halign: Gtk.Align.START
      }), 0, 2, 1, 1);

      let combobox = new Gtk.ComboBoxText({
        halign: Gtk.Align.END
      });
      combobox.connect('changed', widget => {
        this._settings.set_string('chosendisk', disks[combobox.active]);
      });
      // Init
      combobox.sensitive = valueDisk.active;
      gridDisk.attach(combobox, 1, 2, 1, 1);

      /**********/
      //let lines = Shell.get_file_contents_utf8_sync('/proc/diskstats').split('\n');
      let file = GLib.file_get_contents('/proc/diskstats');
      let lines = ('' + file[1]).split('\n');

      let current = this._settings.get_string('chosendisk');

      let x = 1;
      let disks = [ 'All' ];

      combobox.insert_text(0, 'All');

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let entry = line.trim().split(/[\s]+/);
        if (typeof (entry[1]) === 'undefined')
          break;

        let name = entry[2];

        if (name.match(/loop\d*/))
          continue;

        disks[x] = name;
        combobox.insert_text(x++, name);
      }

      for (let i = 0; i < disks.length; i++) {
        if (current === disks[i]) {
          combobox.set_active(i);
          break;
        }
      }
      /**********/

      // AUTO HIDE
      let alignmentAutoHide = new Gtk.Alignment({
        left_padding: 12,
        right_padding: 12
      });

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Auto Hide')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentAutoHide);

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

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Eth')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentEth);

      let gridEth= new Gtk.Grid({
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
          lower: 22,
          upper: 80,
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

      this.add(new Gtk.Label({
        label: '<b>%s</b>'.format(_('Wlan')),
        use_markup: true,
        halign: Gtk.Align.START
      }));
      this.add(alignmentWlan);

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
          lower: 22,
          upper: 80,
          step_increment: 1
        }),
        halign: Gtk.Align.END,
        numeric: true
      });
      this._settings.bind('widthwlan', widthWlan, 'value', Gio.SettingsBindFlags.DEFAULT);
      // Init
      widthWlan.sensitive = valueWlan.active;
      gridWlan.attach(widthWlan, 1, 1, 1, 1);
     }
   }
 );

 function buildPrefsWidget() {
   let widget = new ResourceMonitorPrefsWidget();
   widget.show_all();

   return widget;
}
