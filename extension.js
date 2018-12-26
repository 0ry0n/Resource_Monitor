/*
 * Resource_Monitor is Copyright © 2018 Giuseppe Silvestro
 *
 * This file is part of Resource_Monitor.
 *
 * Resource_Monitor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Resource_Monitor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Resource_Monitor.  If not, see <http://www.gnu.org/licenses/>.
 */

const St = imports.gi.St;
const Main = imports.ui.main;

const Shell = imports.gi.Shell;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const NM = imports.gi.NM;

let button;
let box;
let cpuIco, ramIco, diskIco, ethIco, wlanIco;
let cpuUnit, ramUnit, diskUnit, ethUnit, wlanUnit;
let cpu, ram, disk, eth, wlan;

let cpuTotOld = 0, cpuIdleOld = 0;
let diskReadTotOld = 0, diskWriteTotOld = 0, diskIdleOld = 0;
let client, onEth, onWlan;
let ethUpTotOld = 0, ethDownTotOld = 0, ethIdleOld = 0;
let wlanUpTotOld = 0, wlanDownTotOld = 0, wlanIdleOld = 0;

let timer;
let timeVal;

let settings;
const schema = 'org.gnome.shell.extensions.Resource_Monitor';

let displayIcons, enCpu, enRam, enDisk, enHide, enEth, enWlan;

function getSchema() {
	if (Gio.Settings.list_schemas().indexOf(schema) == -1)
        throw ("Schema \"%s\" not found.").format(schema);

	return new Gio.Settings({ schema: schema });
}

function openSystemMonitor() {
	let app = global.log(Shell.AppSystem.get_default().lookup_app("gnome-system-monitor.desktop"));

	if (app != null)
		app.activate();
	else
		Util.spawn(["gnome-system-monitor"]);
}

function initializeUI() {
	button = new St.Button({ style_class: 'panel-button'});

	box = new St.BoxLayout();
	//system-run-symbolic
	cpuIco = new St.Icon({ icon_name: 'computer-symbolic', style_class: 'system-status-icon'});
	ramIco = new St.Icon({ icon_name: 'emblem-system-symbolic', style_class: 'system-status-icon'});
	diskIco = new St.Icon({ icon_name: 'drive-harddisk-symbolic', style_class: 'system-status-icon'});
	ethIco  = new St.Icon({ icon_name: 'network-wired-symbolic', style_class: 'system-status-icon'});
	wlanIco = new St.Icon({ icon_name: 'network-wireless-symbolic', style_class: 'system-status-icon'});

	cpuUnit = new St.Label({ text: '%', style_class: 'unit' });
	ramUnit = new St.Label({ text: '%', style_class: 'unit' });
	diskUnit = new St.Label({ text: 'K', style_class: 'unit' });
	ethUnit = new St.Label({ text: 'K', style_class: 'unit' });
	wlanUnit = new St.Label({ text: 'K', style_class: 'unit' });

	cpu = new St.Label({ text: 'cpu', style_class: 'label' });
	ram = new St.Label({ text: 'ram', style_class: 'label' });
	disk = new St.Label({ text: 'disk', style_class: 'label' });
	eth = new St.Label({ text: 'eth', style_class: 'label' });
	wlan = new St.Label({ text: 'wlan', style_class: 'label' });

	box.add(cpu);
	box.add(cpuUnit);
	box.add(cpuIco);

	box.add(ram);
	box.add(ramUnit);
	box.add(ramIco);

	box.add(disk);
	box.add(diskUnit);
	box.add(diskIco);

	box.add(eth);
	box.add(ethUnit);
	box.add(ethIco);

	box.add(wlan);
	box.add(wlanUnit);
	box.add(wlanIco);

	button.set_child(box);
}

function connectWidget() {
	button.connect('button-press-event', openSystemMonitor);

	settings.connect('changed::timer', Lang.bind(this, timeChange));
	settings.connect('changed::display-icons', Lang.bind(this, iconChange));
	settings.connect('changed::enable-cpu', Lang.bind(this, cpuChange));
	settings.connect('changed::enable-ram', Lang.bind(this, ramChange));
	settings.connect('changed::enable-disk', Lang.bind(this, diskChange));
	settings.connect('changed::enable-hide', Lang.bind(this, hideChange));
	settings.connect('changed::enable-eth', Lang.bind(this, ethChange));
	settings.connect('changed::enable-wlan', Lang.bind(this, wlanChange));
	settings.connect('changed::label-cpu', Lang.bind(this, cpuLabelChange))
	settings.connect('changed::label-ram', Lang.bind(this, ramLabelChange))
	settings.connect('changed::label-disk', Lang.bind(this, diskLabelChange))
	settings.connect('changed::label-eth', Lang.bind(this, ethLabelChange))
	settings.connect('changed::label-wlan', Lang.bind(this, wlanLabelChange))
}

function refreshCpu() {
	let cpuTot = 0, idle, cpuCurr;

	let file = GLib.file_get_contents('/proc/stat');
	let line = ('' + file[1]).split('\n');

	for(let i = 0; i < line.length; i++) {
		let values;

		if (line[i].match(/^cpu /))
	    {
			values = line[i].match(/^cpu\s*(.*)$/)[1].split(' ');

			idle = values[3];

			for (let i = 0; i < 7 /*values.length*/; i++)
				cpuTot += parseInt(values[i]);
	    }
	}

	cpuCurr = (100 * ((cpuTot - cpuTotOld) - (idle - cpuIdleOld))/(cpuTot - cpuTotOld));

	cpuTotOld = cpuTot;
	cpuIdleOld = idle;

	cpu.set_text(cpuCurr.toFixed(1).toString());
}

function refreshRam() {
	let tot, free, buff, cache, used;
	let file = GLib.file_get_contents('/proc/meminfo');
	let line = ('' + file[1]).split('\n');

	for (let i = 0; i < line.length; i++)
	{
		let values;

		if (line[i].match(/^MemTotal/))
		{
			values = line[i].match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);

			tot = values[1];
		} else if (line[i].match(/^MemFree/))
		{
			values = line[i].match(/^MemFree:\s*([^ ]*)\s*([^ ]*)$/);

			free = values[1];
		}	else if (line[i].match(/^Buffers/))
		{
			values = line[i].match(/^Buffers:\s*([^ ]*)\s*([^ ]*)$/);

			buff = values[1];
		}	else if (line[i].match(/^Cached/))
		{
			values = line[i].match(/^Cached:\s*([^ ]*)\s*([^ ]*)$/);

			cache = values[1];
		}
	}

	used = tot - free - buff - cache;

	ram.set_text((100*used/tot).toFixed(1).toString());
}

function refreshDisk() {
	let rTot = 0, wTot = 0, read, write, idle;
	let file = GLib.file_get_contents('/proc/diskstats');
	let line = ('' + file[1]).split('\n');

	idle = new Date().getTime() / 1000;

	for (let i = 0; i < line.length; i++)
	{
		if (line[i].match(/^\s*\d+\s*\d+\s[a-z]+\s/))
		{
			let values = line[i].match(/^\s*\d+\s*\d+\s[a-z]+\s(.*)$/)[1].split(' ');

			rTot += parseInt(values[2]);
			wTot += parseInt(values[6]);
		}
	}

	read = (rTot - diskReadTotOld) / (idle - diskIdleOld);
	write = (wTot - diskWriteTotOld) / (idle - diskIdleOld);

	diskReadTotOld = rTot;
	diskWriteTotOld = wTot;
	diskIdleOld = idle;

	if(read > 1024 || write > 1024) {
		diskUnit.set_text('M');
		read /= 1024;
		write /= 1024;
		if(read > 1024 || write > 1024) {
			diskUnit.set_text('G');
			read /= 1024;
			write /= 1024;
		}
	} else {
		diskUnit.set_text('K');
	}

	disk.set_text(read.toFixed(1) + '|' + write.toFixed(1));
}

function refreshHide() {
	let devices = client.get_devices();

	for(let i = 0; i < devices.length; i++) {
		let device = devices[i];

		if(device.get_device_type() == NM.DeviceType.ETHERNET) {
			if(device.active_connection) {
				if(device.active_connection.state == NM.ActiveConnectionState.ACTIVATED)
					onEth = true;
			} else
				onEth = false;
		} else if(device.get_device_type() == NM.DeviceType.WIFI) {
			if(device.active_connection) {
				if(device.active_connection.state == NM.ActiveConnectionState.ACTIVATED)
					onWlan = true;
			} else
				onWlan = false;
		}
	}

	ethChange();
	wlanChange();
}

function refreshEth() {
	let dTot = 0, uTot = 0, idle, ud, down;
	let file = GLib.file_get_contents('/proc/net/dev');
	let line = ('' + file[1]).split('\n');

	idle = new Date().getTime() / 1000;

	for (let i = 0; i < line.length; i++)
	{
		if (line[i].match(/^\s*eth+[0-9]:/))
		{
			let values = line[i].match(/^\s*eth+[0-9]:\s+([0-9]+)\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+([0-9]+)/);
			dTot += parseInt(values[1]);
			uTot += parseInt(values[2]);
		}
	}

	down = (dTot - ethDownTotOld) / (idle - ethIdleOld);
	up = (uTot - ethUpTotOld) / (idle - ethIdleOld);

	ethUpTotOld = uTot;
	ethDownTotOld = dTot;
	ethIdleOld = idle;

	if(down > 1024 || up > 1024) {
		ethUnit.set_text('K');
		down /= 1024;
		up /= 1024;
		if(down > 1024 || up > 1024) {
			ethUnit.set_text('M');
			down /= 1024;
			up /= 1024;
			if(down > 1024 || up > 1024) {
				ethUnit.set_text('G');
				down /= 1024;
				up /= 1024;
			}
		}
	} else {
		ethUnit.set_text('B');
	}

	eth.set_text(up.toFixed(1) + '|' + down.toFixed(1));
}

function refreshWlan() {
	let dTot = 0, uTot = 0, idle, ud, down;
	let file = GLib.file_get_contents('/proc/net/dev');
	let line = ('' + file[1]).split('\n');

	idle = new Date().getTime() / 1000;

	for (let i = 0; i < line.length; i++)
	{
		if (line[i].match(/^\s*wlan+[0-9]:/))
		{
			let values = line[i].match(/^\s*wlan+[0-9]:\s+([0-9]+)\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+[0-9]+\s+([0-9]+)/);
			dTot += parseInt(values[1]);
			uTot += parseInt(values[2]);
		}
	}

	down = (dTot - wlanDownTotOld) / (idle - wlanIdleOld);
	up = (uTot - wlanUpTotOld) / (idle - wlanIdleOld);

	wlanUpTotOld = uTot;
	wlanDownTotOld = dTot;
	wlanIdleOld = idle;

	if(down > 1024 || up > 1024) {
		wlanUnit.set_text('K');
		down /= 1024;
		up /= 1024;
		if(down > 1024 || up > 1024) {
			wlanUnit.set_text('M');
			down /= 1024;
			up /= 1024;
			if(down > 1024 || up > 1024) {
				wlanUnit.set_text('G');
				down /= 1024;
				up /= 1024;
			}
		}
	} else {
		wlanUnit.set_text('B');
	}

	wlan.set_text(up.toFixed(1) + '|' + down.toFixed(1));
}

function refresh() {
	if(enCpu)
		refreshCpu();
	if(enRam)
		refreshRam();
	if(enDisk)
		refreshDisk();
	if(enHide)
		refreshHide();
	if(enEth)
		refreshEth();
	if(enWlan)
		refreshWlan();

	if (timer != null)
      Mainloop.source_remove(timer);

	timer = Mainloop.timeout_add_seconds(timeVal, Lang.bind(this, refresh))
}

function iconChange() {
	displayIcons = settings.get_boolean('display-icons');
	if(displayIcons) {
		if(enCpu)
			cpuIco.show();
		if(enRam)
			ramIco.show();
		if(enDisk)
			diskIco.show();
		if(enEth)
			ethIco.show();
		if(enWlan)
			wlanIco.show();
	} else {
		cpuIco.hide();
		ramIco.hide();
		diskIco.hide();
		ethIco.hide();
		wlanIco.hide();
	}
}

function timeChange() {
	timeVal = settings.get_int('timer');

	if (timer != null)
		Mainloop.source_remove(timer);
	timer = Mainloop.timeout_add_seconds(timeVal, Lang.bind(this, refresh));
}

function cpuChange() {
	enCpu = settings.get_boolean('enable-cpu');
	if(enCpu) {
		if(displayIcons)
			cpuIco.show();
		cpu.show();
		cpuUnit.show();
	} else {
		cpuIco.hide();
		cpu.hide();
		cpuUnit.hide();
	}
}

function cpuLabelChange() {
	cpu.set_width(settings.get_int('label-cpu'));
}

function ramChange() {
	enRam = settings.get_boolean('enable-ram');
	if(enRam) {
		if(displayIcons)
			ramIco.show();
		ram.show();
		ramUnit.show();
	} else {
		ramIco.hide();
		ram.hide();
		ramUnit.hide();
	}
}

function ramLabelChange() {
	ram.set_width(settings.get_int('label-ram'));
}

function diskChange() {
	enDisk = settings.get_boolean('enable-disk');
	if(enDisk) {
		if(displayIcons)
			diskIco.show();
		disk.show();
		diskUnit.show();
	} else {
		diskIco.hide();
		disk.hide();
		diskUnit.hide();
	}
}

function diskLabelChange() {
	disk.set_width(settings.get_int('label-disk'));
}

function hideChange() {
	enHide = settings.get_boolean('enable-hide');
	if(enHide) {
		refreshHide();
	} else {
		onEth = true;
		onWlan = true;
		ethChange();
		wlanChange();
	}
}

function ethChange() {
	enEth = settings.get_boolean('enable-eth') && onEth;
	if(enEth) {
		if(displayIcons)
			ethIco.show();
		eth.show();
		ethUnit.show();
	} else {
		ethIco.hide();
		eth.hide();
		ethUnit.hide();
	}
}

function ethLabelChange() {
	eth.set_width(settings.get_int('label-eth'));
}

function wlanChange() {
	enWlan = settings.get_boolean('enable-wlan') && onWlan;
	if(enWlan) {
		if(displayIcons)
			wlanIco.show();
		wlan.show();
		wlanUnit.show();
	} else {
		wlanIco.hide();
		wlan.hide();
		wlanUnit.hide();
	}
}

function wlanLabelChange() {
	wlan.set_width(settings.get_int('label-wlan'));
}

function setUp() {
	iconChange();
	timeChange();
	cpuChange();
	ramChange();
	diskChange();
	hideChange();
	ethChange();
	wlanChange();
	cpuLabelChange();
	ramLabelChange();
	diskLabelChange();
	ethLabelChange();
	wlanLabelChange();

	refreshCpu();
	refreshRam();
	refreshDisk();
	refreshEth();
	refreshWlan();
}

function init() {
	settings = getSchema();
	client = NM.Client.new(null);

	initializeUI();
	connectWidget();
	setUp();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}
