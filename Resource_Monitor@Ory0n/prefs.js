/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
/* exported init, buildPrefsWidget */

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

const Gettex = imports.gettext.domain('com-github-Ory0n-Resource_Monitor');
const _ = Gettex.gettext;

const ExtensionUtils = imports.misc.extensionUtils;

function init() {
    ExtensionUtils.initTranslations();
}

const ResourceMonitorPrefsWidget = GObject.registerClass(
    class ResourceMonitorPrefsWidget extends Gtk.ScrolledWindow {
        _init() {
            super._init({
                hscrollbar_policy: Gtk.PolicyType.NEVER,
            });

            // Settings
            this._settings = ExtensionUtils.getSettings();

            const box = new Gtk.Box();
            this.child = box;

            this._notebook = new Gtk.Notebook({
                halign: Gtk.Align.CENTER,
                valign: Gtk.Align.START,
                hexpand: true,
                margin_start: 60,
                margin_end: 60,
                margin_top: 60,
                margin_bottom: 60,
            });
            box.append(this._notebook);

            // GLOBAL FRAME
            this._notebook.append_page(this._buildGlobal(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Global')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // CPU FRAME
            this._notebook.append_page(this._buildCpu(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Cpu')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // RAM FRAME
            this._notebook.append_page(this._buildRam(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Ram')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // SWAP FRAME
            this._notebook.append_page(this._buildSwap(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Swap')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // DISK FRAME
            this._notebook.append_page(this._buildDisk(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Disk')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // NET FRAME
            this._notebook.append_page(this._buildNet(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Net')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));

            // THERMAL FRAME
            this._notebook.append_page(this._buildThermal(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Thermal')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));
        }

        _buildGlobal() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let refresh = new SpinButtonRow('Seconds', this._settings, 'interval');
            let icons = new SwitchRow('Display', this._settings, 'icons');
            let position = new ComboBoxRow('Position', this._settings, 'iconsposition', ['LEFT', 'RIGHT']);
            let decimals = new SwitchRow('Display', this._settings, 'decimals');
            let systemMonitor = new SwitchRow('Show System Monitor when clicking on extension', this._settings, 'showsystemmonitor');

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Refresh Time')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(refresh);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Icons')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(icons);
            box.append(position);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Decimals')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(decimals);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('System Monitor')),
                use_markup: true,
                halign: Gtk.Align.START,
            }));
            box.append(systemMonitor);

            refresh.button.set_range(1, 30);

            icons.button.connect('state-set', button => {
                position.combobox.sensitive = button.active;
            });
            position.combobox.sensitive = icons.button.active;

            return box;
        }

        _buildCpu() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let cpu = new SwitchRow('Display', this._settings, 'cpu');
            let width = new SpinButtonRow('Width', this._settings, 'widthcpu');
            let frequency = new SwitchRow('Display', this._settings, 'cpufrequency');
            let widthFrequency = new SpinButtonRow('Width', this._settings, 'widthcpufrequency');

            box.append(cpu);
            box.append(width);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Frequency')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(frequency);
            box.append(widthFrequency);

            cpu.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = cpu.button.active;

            frequency.button.connect('state-set', button => {
                widthFrequency.button.sensitive = button.active;
            });
            widthFrequency.button.sensitive = frequency.button.active;

            return box;
        }

        _buildRam() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let ram = new SwitchRow('Display', this._settings, 'ram');
            let width = new SpinButtonRow('Width', this._settings, 'widthram');

            box.append(ram);
            box.append(width);

            ram.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = ram.button.active;

            return box;
        }

        _buildSwap() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let swap = new SwitchRow('Display', this._settings, 'swap');
            let width = new SpinButtonRow('Width', this._settings, 'widthswap');

            box.append(swap);
            box.append(width);

            swap.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = swap.button.active;

            return box;
        }

        _buildDisk() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let stats = new SwitchRow('Display', this._settings, 'diskstats');
            let widthStats = new SpinButtonRow('Width', this._settings, 'widthdiskstats');
            let mode = new SwitchRow('Display All In One', this._settings, 'diskstatsmode');
            let space = new SwitchRow('Display', this._settings, 'diskspace');
            let widthSpace = new SpinButtonRow('Width', this._settings, 'widthdiskspace');
            let unit = new SwitchRow('Percentage Unit', this._settings, 'diskspaceunit');
            let devices = new ListRow('Devices');

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Stats')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(stats);
            box.append(widthStats);
            box.append(mode);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Space')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(space);
            box.append(widthSpace);
            box.append(unit);
            box.append(devices);

            stats.button.connect('state-set', button => {
                widthStats.button.sensitive = button.active;
                mode.button.sensitive = button.active;
            });
            widthStats.button.sensitive = stats.button.active;
            mode.button.sensitive = stats.button.active;

            space.button.connect('state-set', button => {
                widthSpace.button.sensitive = button.active;
                unit.button.sensitive = button.active;
            });
            widthSpace.button.sensitive = space.button.active;
            unit.button.sensitive = space.button.active;

            // Array format
            // name stats space
            // Get current disks settings
            let disksArray = this._settings.get_strv('diskslist', Gio.SettingsBindFlags.DEFAULT);
            let newDisksArray = [];
            let x = 0;

            let file = GLib.file_get_contents('/proc/mounts');
            let lines = ('' + file[1]).split('\n');

            for (let j = 0; j < lines.length; j++) {
                let line = lines[j];
                let entry = line.trim().split(/\s/);

                let name = entry[0];
                let path = entry[1];

                if (typeof (name) === 'undefined' || name === '' || name.match(/\/dev\/loop\d*/) || (name.match(/^[^\/]/) && !path.match(/\/media\//)))
                    continue;

                let disk = new ListItemRow(name, path);

                // Init gui
                for (let i = 0; i < disksArray.length; i++) {
                    let element = disksArray[i];
                    let it = element.split(' ');

                    if (name === it[0]) {
                        let dStButton = (it[1] === 'true');
                        let dSpButton = (it[2] === 'true');

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

                        if (name === it[0]) {
                            it[1] = button.active;
                            disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2];

                            found = true;
                            break;
                        }
                    }

                    // Add new disks
                    if (found === false) {
                        disksArray.push(name + ' ' + disk.stats.active + ' ' + disk.space.active);
                        found = false;
                    }

                    // Save all
                    this._settings.set_strv('diskslist', disksArray);
                });

                disk.space.connect('toggled', button => {
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
                        disksArray.push(name + ' ' + disk.stats.active + ' ' + disk.space.active);
                        found = false;
                    }

                    // Save all
                    this._settings.set_strv('diskslist', disksArray);
                });

                // Add disk to newDisksArray
                newDisksArray[x] = name + ' ' + disk.stats.active + ' ' + disk.space.active;

                devices.list.insert(disk, x++);
            }

            // Save newDisksArray with the list of new disks (to remove old disks)
            disksArray = newDisksArray;
            this._settings.set_strv('diskslist', disksArray);

            return box;
        }

        _buildNet() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let auto = new SwitchRow('Enable', this._settings, 'autohide');
            let wlan = new SwitchRow('Display', this._settings, 'wlan');
            let eth = new SwitchRow('Display', this._settings, 'eth');
            let widthWlan = new SpinButtonRow('Width', this._settings, 'widthwlan');
            let widthEth = new SpinButtonRow('Width', this._settings, 'widtheth');
            let unit = new SwitchRow('Show in bits per second', this._settings, 'networkunit');

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Auto Hide')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(auto);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Unit')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(unit);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Eth')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(eth);
            box.append(widthEth);
            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Wlan')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(wlan);
            box.append(widthWlan);

            eth.button.connect('state-set', button => {
                widthEth.button.sensitive = button.active;
            });
            widthEth.button.sensitive = eth.button.active;

            wlan.button.connect('state-set', button => {
                widthWlan.button.sensitive = button.active;
            });
            widthWlan.button.sensitive = wlan.button.active;

            return box;
        }

        _buildThermal() {
            let box = new Gtk.Box({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.VERTICAL,
            });

            let thermal = new SwitchRow('Display', this._settings, 'cputemperature');
            let unit = new SwitchRow('Fahrenheit Unit', this._settings, 'cputemperatureunit');
            let width = new SpinButtonRow('Width', this._settings, 'widthcputemperature');

            box.append(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Cpu Temperature')),
                use_markup: true,
                halign: Gtk.Align.START
            }));
            box.append(thermal);
            box.append(width);
            box.append(unit);

            thermal.button.connect('state-set', button => {
                width.button.sensitive = button.active;
                unit.button.sensitive = button.active;
            });
            width.button.sensitive = thermal.button.active;
            unit.button.sensitive = thermal.button.active;

            return box;
        }
    });

const SwitchRow = GObject.registerClass(
    class SwitchRow extends Gtk.Grid {
        _init(label, settings, settingsName) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(_(label)),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.button = new Gtk.Switch({
                halign: Gtk.Align.END,
            });

            settings.bind(settingsName, this.button, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.button, 1, 0, 1, 1);
        }
    });

const SpinButtonRow = GObject.registerClass(
    class SpinButtonRow extends Gtk.Grid {
        _init(label, settings, settingsName) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(_(label)),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.button = new Gtk.SpinButton({
                adjustment: new Gtk.Adjustment({
                    lower: 1,
                    upper: 500,
                    step_increment: 1,
                }),
                halign: Gtk.Align.END,
                numeric: true,
            });

            settings.bind(settingsName, this.button, 'value', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.button, 1, 0, 1, 1);
        }
    });

const ComboBoxRow = GObject.registerClass(
    class ComboBoxRow extends Gtk.Grid {
        _init(label, settings, settingsName, initValue) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '%s'.format(_(label)),
                    halign: Gtk.Align.START,
                    hexpand: true,
                }), 0, 0, 1, 1);

            this.combobox = new Gtk.ComboBoxText({
                halign: Gtk.Align.END,
            });

            if (initValue !== null) {
                for (let i = 0; i < initValue.length; i++) {
                    this.combobox.insert_text(i, initValue[i]);
                }
            }

            settings.bind(settingsName, this.combobox, 'active', Gio.SettingsBindFlags.DEFAULT);
            this.attach(this.combobox, 1, 0, 1, 1);
        }
    });

const ListRow = GObject.registerClass(
    class ListRow extends Gtk.Grid {
        _init(label) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
            });

            this.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(_(label)),
                    halign: Gtk.Align.START,
                    use_markup: true,
                    hexpand: true,
                }), 0, 0, 1, 1);

            let view = new Gtk.ScrolledWindow({
                height_request: 120,
            });

            let box = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
            });
            view.child = box;

            this.list = new Gtk.ListBox({
                selection_mode: Gtk.SelectionMode.NONE,
            });
            box.append(this.list);

            this.attach(view, 0, 1, 2, 2);
        }
    });

const ListItemRow = GObject.registerClass(
    class ListItemRow extends Gtk.Grid {
        _init(name, path) {
            super._init({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                orientation: Gtk.Orientation.HORIZONTAL,
            });

            this.diskName = new Gtk.Label({
                label: '%s'.format(_(name)),
                halign: Gtk.Align.START,
                margin_end: 10,
                hexpand: true,
            });

            this.diskPath = new Gtk.Label({
                label: '%s'.format(_(path)),
                halign: Gtk.Align.START,
                margin_end: 10,
                hexpand: true,
            });

            this.stats = new Gtk.CheckButton({
                label: '%s'.format(_("Stats")),
                active: false,
            });

            this.space = new Gtk.CheckButton({
                label: '%s'.format(_("Space")),
                active: false,
            });

            this.attach(this.diskName, 0, 0, 1, 1);
            this.attach(this.diskPath, 1, 0, 1, 1);
            this.attach(this.stats, 2, 0, 1, 1);
            this.attach(this.space, 3, 0, 1, 1);
        }
    });

function buildPrefsWidget() {
    return new ResourceMonitorPrefsWidget();
}
