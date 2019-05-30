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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Resource_Monitor.  If not, see <http://www.gnu.org/licenses/>.
 */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let settings;

function updateTimer(object, value) {
  settings.set_int('timer', value.get_value());
}

function displayIcons(object, value) {
  settings.set_boolean('display-icons', object.active);
}

function enableCpu(object, value) {
  settings.set_boolean('enable-cpu', object.active);
}

function enableRam(object, value) {
  settings.set_boolean('enable-ram', object.active);
}

function enableDisk(object, value) {
  settings.set_boolean('enable-disk', object.active);
}

function enableAutoHideNet(object, value) {
  settings.set_boolean('enable-hide', object.active);
}

function enableEth(object, value) {
  settings.set_boolean('enable-eth', object.active);
}

function enableWlan(object, value) {
  settings.set_boolean('enable-wlan', object.active);
}

function labelCpu(object, value) {
  settings.set_int('label-cpu', value.get_value());
}

function labelRam(object, value) {
  settings.set_int('label-ram', value.get_value());
}

function labelDisk(object, value) {
  settings.set_int('label-disk', value.get_value());
}

function labelEth(object, value) {
  settings.set_int('label-eth', value.get_value());
}

function labelWlan(object, value) {
  settings.set_int('label-wlan', value.get_value());
}

function selectDisk(object, value) {
  settings.set_string('select-disk', value.get_active_text());
}

function init() {
	if (Gio.Settings.list_schemas().indexOf(Me.metadata["settings-schema"]) == -1) {
		let schemaSource = Gio.SettingsSchemaSource.new_from_directory(Me.path + "/schemas", Gio.SettingsSchemaSource.get_default(), false);

		let schemaObj = schemaSource.lookup(Me.metadata["settings-schema"], true);
		if(!schemaObj) {
			throw new Error("Schema " + Me.metadata["settings-schema"] + " could not be found for extension " + Me.uuid + ". Please check your installation.");
		}

		settings = new Gio.Settings({ settings_schema: schemaObj });
	} else
		settings = new Gio.Settings({ schema: Me.metadata["settings-schema"] });
}

function PatternsPrefs() {
  let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin: 10 });
  let title = new Gtk.Label({ label: 'Settings' });

  let vBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });

  // Timer
  let hBoxTimer = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleTimer = new Gtk.Label({ label: 'Update Interval (seconds)', xalign: 0 });
  let valueTimer = new Gtk.Adjustment({ lower: 1, upper: 30, step_increment: 1 });
  let scaleTimer = new Gtk.HScale({ digits: 0, adjustment: valueTimer, value_pos: Gtk.PositionType.RIGHT });
  scaleTimer.set_value(settings.get_int('timer'));
  let buttonTimer = new Gtk.Button({ label: 'Apply' });
  buttonTimer.connect('clicked', Lang.bind(this, updateTimer, valueTimer));

  hBoxTimer.pack_start(scaleTimer, true, true, 0);
  hBoxTimer.add(buttonTimer);

  vBox.add(titleTimer);
  vBox.add(hBoxTimer);

  // Icons
  let hBoxIcons = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleIcons = new Gtk.Label({ label: 'Display Icons', xalign: 0 });
  let valueIcons = new Gtk.Switch({ active: settings.get_boolean('display-icons') });
  valueIcons.connect('notify::active', Lang.bind(this, displayIcons));

  hBoxIcons.pack_start(titleIcons, true, true, 0);
  hBoxIcons.add(valueIcons);
  vBox.add(hBoxIcons);

  // Cpu
  let hBoxCpu = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleCpu = new Gtk.Label({ label: 'Display Cpu', xalign: 0 });
  let valueCpu = new Gtk.Switch({ active: settings.get_boolean('enable-cpu') });
  valueCpu.connect('notify::active', Lang.bind(this, enableCpu));

  hBoxCpu.pack_start(titleCpu, true, true, 0);
  hBoxCpu.add(valueCpu);
  vBox.add(hBoxCpu);

  // Width Cpu
  let hBoxLabelCpu = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleLabelCpu = new Gtk.Label({ label: 'Modify Width Cpu', xalign: 0 });
  let spinLabelCpu = Gtk.SpinButton.new_with_range(22, 40, 1);
  spinLabelCpu.set_value(settings.get_int('label-cpu'));
  let buttonLabelCpu = new Gtk.Button({ label: 'Apply' });
  buttonLabelCpu.connect('clicked', Lang.bind(this, labelCpu, spinLabelCpu));

  hBoxLabelCpu.pack_start(titleLabelCpu, true, true, 0);
  hBoxLabelCpu.add(spinLabelCpu);
  hBoxLabelCpu.add(buttonLabelCpu);
  vBox.add(hBoxLabelCpu);

  // Ram
  let hBoxRam = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleRam = new Gtk.Label({ label: 'Display Ram', xalign: 0 });
  let valueRam = new Gtk.Switch({ active: settings.get_boolean('enable-ram') });
  valueRam.connect('notify::active', Lang.bind(this, enableRam));

  hBoxRam.pack_start(titleRam, true, true, 0);
  hBoxRam.add(valueRam);
  vBox.add(hBoxRam);

  // Width Ram
  let hBoxLabelRam = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleLabelRam = new Gtk.Label({ label: 'Modify Width Ram', xalign: 0 });
  let spinLabelRam = Gtk.SpinButton.new_with_range(22, 40, 1);
  spinLabelRam.set_value(settings.get_int('label-ram'));
  let buttonLabelRam = new Gtk.Button({ label: 'Apply' });
  buttonLabelRam.connect('clicked', Lang.bind(this, labelRam, spinLabelRam));

  hBoxLabelRam.pack_start(titleLabelRam, true, true, 0);
  hBoxLabelRam.add(spinLabelRam);
  hBoxLabelRam.add(buttonLabelRam);
  vBox.add(hBoxLabelRam);

  // Disk
  let hBoxDisk = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleDisk = new Gtk.Label({ label: 'Display Disk', xalign: 0 });
  let valueDisk = new Gtk.Switch({ active: settings.get_boolean('enable-disk') });
  valueDisk.connect('notify::active', Lang.bind(this, enableDisk));

  hBoxDisk.pack_start(titleDisk, true, true, 0);
  hBoxDisk.add(valueDisk);
  vBox.add(hBoxDisk);

  // ComboBox Hdd
  let hBoxSelectDisk = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleSelectDisk = new Gtk.Label({ label: 'Chose Disk', xalign: 0 });
  let comboSelectDisk = new Gtk.ComboBoxText({});

	let file = GLib.file_get_contents('/proc/diskstats');
	let line = ('' + file[1]).split('\n');
  let tmp = settings.get_string('select-disk');
  let x = 1;

  comboSelectDisk.insert_text(0, 'All');
  if(tmp == 'All')
    comboSelectDisk.set_active(0);

	for (let i = 0; i < line.length; i++)
	{
		if (line[i].match(/^\s*\d+\s*\d+\ssd[a-z]\d*\s/))
		{
			let values = line[i].match(/sd[a-z]\d*/);
      comboSelectDisk.insert_text(x, values + '');
      if(tmp == values + '')
        comboSelectDisk.set_active(x);

      x++;
		}
	}

  let buttonSelectDisk = new Gtk.Button({ label: 'Apply' });
  buttonSelectDisk.connect('clicked', Lang.bind(this, selectDisk, comboSelectDisk));

  hBoxSelectDisk.pack_start(titleSelectDisk, true, true, 0);
  hBoxSelectDisk.add(comboSelectDisk);
  hBoxSelectDisk.add(buttonSelectDisk);
  vBox.add(hBoxSelectDisk);

  // Width Disk
  let hBoxLabelDisk = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleLabelDisk = new Gtk.Label({ label: 'Modify Width Disk', xalign: 0 });
  let spinLabelDisk = Gtk.SpinButton.new_with_range(22, 85, 1);
  spinLabelDisk.set_value(settings.get_int('label-disk'));
  let buttonLabelDisk = new Gtk.Button({ label: 'Apply' });
  buttonLabelDisk.connect('clicked', Lang.bind(this, labelDisk, spinLabelDisk));

  hBoxLabelDisk.pack_start(titleLabelDisk, true, true, 0);
  hBoxLabelDisk.add(spinLabelDisk);
  hBoxLabelDisk.add(buttonLabelDisk);
  vBox.add(hBoxLabelDisk);

  // Auto Hide Net
  let hBoxHide = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleHide = new Gtk.Label({ label: 'Auto Hide Net', xalign: 0 });
  let valueHide = new Gtk.Switch({ active: settings.get_boolean('enable-hide') });
  valueHide.connect('notify::active', Lang.bind(this, enableAutoHideNet));

  hBoxHide.pack_start(titleHide, true, true, 0);
  hBoxHide.add(valueHide);
  vBox.add(hBoxHide);

  // Eth
  let hBoxEth = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleEth = new Gtk.Label({ label: 'Display Eth', xalign: 0 });
  let valueEth = new Gtk.Switch({active: settings.get_boolean('enable-eth') });
  valueEth.connect('notify::active', Lang.bind(this, enableEth));

  hBoxEth.pack_start(titleEth, true, true, 0);
  hBoxEth.add(valueEth);
  vBox.add(hBoxEth);

  // Width Eth
  let hBoxLabelEth = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleLabelEth = new Gtk.Label({ label: 'Modify Width Eth', xalign: 0 });
  let spinLabelEth = Gtk.SpinButton.new_with_range(22, 85, 1);
  spinLabelEth.set_value(settings.get_int('label-eth'));
  let buttonLabelEth = new Gtk.Button({ label: 'Apply' });
  buttonLabelEth.connect('clicked', Lang.bind(this, labelEth, spinLabelEth));

  hBoxLabelEth.pack_start(titleLabelEth, true, true, 0);
  hBoxLabelEth.add(spinLabelEth);
  hBoxLabelEth.add(buttonLabelEth);
  vBox.add(hBoxLabelEth);

  // Wlan
  let hBoxWlan = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleWlan = new Gtk.Label({ label: 'Display Wlan', xalign: 0 });
  let valueWlan = new Gtk.Switch({ active: settings.get_boolean('enable-wlan') });
  valueWlan.connect('notify::active', Lang.bind(this, enableWlan));

  hBoxWlan.pack_start(titleWlan, true, true, 0);
  hBoxWlan.add(valueWlan);
  vBox.add(hBoxWlan);

  // Width Wlan
  let hBoxLabelWlan = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
  let titleLabelWlan = new Gtk.Label({ label: 'Modify Width Wlan', xalign: 0 });
  let spinLabelWlan = Gtk.SpinButton.new_with_range(22, 85, 1);
  spinLabelWlan.set_value(settings.get_int('label-wlan'));
  let buttonLabelWlan = new Gtk.Button({ label: 'Apply' });
  buttonLabelWlan.connect('clicked', Lang.bind(this, labelWlan, spinLabelWlan));

  hBoxLabelWlan.pack_start(titleLabelWlan, true, true, 0);
  hBoxLabelWlan.add(spinLabelWlan);
  hBoxLabelWlan.add(buttonLabelWlan);
  vBox.add(hBoxLabelWlan);

  box.add(title);
  box.add(vBox);

  return box;
}

function buildPrefsWidget() {
  let widget = new PatternsPrefs();
  widget.show_all();

  return widget;
}
