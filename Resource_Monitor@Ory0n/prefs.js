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
            /*this._notebook.append_page(this._buildDisk(), new Gtk.Label({
                label: '<b>%s</b>'.format(_('Disk')),
                use_markup: true,
                halign: Gtk.Align.CENTER,
            }));*/

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
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });


            // Refresh
            // Row 0 - 1
            grid.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(_('Refresh Time')),
                    use_markup: true,
                    halign: Gtk.Align.START,
                }), 0, 0, 1, 1);

            grid.attach(
                new Gtk.Label({
                    label: '%s'.format(_('Seconds')),
                    halign: Gtk.Align.START,
                }), 0, 1, 1, 1);

            let adjustment = new Gtk.Adjustment({
                lower: 1,
                upper: 30,
                step_increment: 1,
            });
            this._settings.bind('interval', adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);

            grid.attach(new Gtk.Scale({
                adjustment: adjustment,
                digits: 0,
                halign: Gtk.Align.END,
            }), 1, 1, 1, 1);

            // Icons
            // Row 2 - 3 - 4
            grid.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(_('Icons')),
                    use_markup: true,
                    halign: Gtk.Align.START,
                }), 0, 2, 1, 1);

            let icons = new SwitchRow(
                'Display',
                this._settings,
                'icons'
            );
            grid.attach(icons, 0, 3, 1, 1);


            let position = new ComboBoxRow('Position', this._settings, 'iconsposition', ['LEFT', 'RIGHT']);
            grid.attach(position, 0, 4, 1, 1);

            icons.button.connect('state-set', button => {
                position.combobox.sensitive = button.active;
            });
            position.combobox.sensitive = icons.button.active;

            // Decimals
            // Row 5 - 6

            grid.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(_('Decimals')),
                    use_markup: true,
                    halign: Gtk.Align.START,
                }), 0, 5, 1, 1);

            grid.attach(
                new SwitchRow(
                    'Display',
                    this._settings,
                    'decimals'
                ), 0, 6, 1, 1);

            // ENABLE SHOW SYSTEM MONITOR
            // Row 7 - 8
            grid.attach(
                new Gtk.Label({
                    label: '<b>%s</b>'.format(_('System Monitor')),
                    use_markup: true,
                    halign: Gtk.Align.START,
                }), 0, 7, 1, 1);

            grid.attach(
                new SwitchRow(
                    'Show System Monitor when clicking on extension',
                    this._settings,
                    'showsystemmonitor'
                ), 0, 8, 1, 1);

            return grid;
        }

        _buildCpu() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let cpu = new SwitchRow('Display', this._settings, 'cpu');
            let width = new SpinButtonRow('Width', this._settings, 'widthcpu');

            grid.attach(cpu, 0, 0, 1, 1);
            grid.attach(width, 0, 1, 1, 1);

            cpu.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = cpu.button.active;

            return grid;
        }

        _buildRam() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let ram = new SwitchRow('Display', this._settings, 'ram');
            let width = new SpinButtonRow('Width', this._settings, 'widthram');

            grid.attach(ram, 0, 0, 1, 1);
            grid.attach(width, 0, 1, 1, 1);

            ram.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = ram.button.active;

            return grid;
        }

        _buildSwap() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let swap = new SwitchRow('Display', this._settings, 'swap');
            let width = new SpinButtonRow('Width', this._settings, 'widthswap');

            grid.attach(swap, 0, 0, 1, 1);
            grid.attach(width, 0, 1, 1, 1);

            swap.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = swap.button.active;

            return grid;
        }

        _buildDisk() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let cpu = new SwitchRow('Display', this._settings, 'cpu');
            let width = new SpinButtonRow('Width', this._settings, 'widthcpu');

            grid.attach(cpu, 0, 0, 1, 1);
            grid.attach(width, 0, 1, 1, 1);

            cpu.button.connect('state-set', button => {
                width.button.sensitive = button.active;
            });
            width.button.sensitive = cpu.button.active;

            return grid;




            // // DISK
            // let diskFrame = new Gtk.Grid({
            //     row_spacing: 6,
            //     orientation: Gtk.Orientation.VERTICAL
            // });

            // let gridDisk = new Gtk.Grid({
            //     row_spacing: 6
            // });
            // diskFrame.attach(gridDisk);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Display Stats')),
            //     halign: Gtk.Align.START,
            //     hexpand: true
            // }), 0, 0, 1, 1);

            // let valueDiskStats = new Gtk.Switch({
            //     halign: Gtk.Align.END
            // });
            // this._settings.bind('diskstats', valueDiskStats, 'active', Gio.SettingsBindFlags.DEFAULT);
            // valueDiskStats.connect('state-set', button => {
            //     widthDiskStats.sensitive = button.active;
            //     valueDiskStatsMode.sensitive = button.active;
            // });
            // gridDisk.attach(valueDiskStats, 1, 0, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Width')),
            //     halign: Gtk.Align.START
            // }), 0, 1, 1, 1);

            // let widthDiskStats = new Gtk.SpinButton({
            //     adjustment: new Gtk.Adjustment({
            //         lower: 1,
            //         upper: 500,
            //         step_increment: 1
            //     }),
            //     halign: Gtk.Align.END,
            //     numeric: true
            // });
            // this._settings.bind('widthdiskstats', widthDiskStats, 'value', Gio.SettingsBindFlags.DEFAULT);
            // // Init
            // widthDiskStats.sensitive = valueDiskStats.active;
            // gridDisk.attach(widthDiskStats, 1, 1, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Display All In One')),
            //     halign: Gtk.Align.START,
            //     hexpand: true
            // }), 0, 2, 1, 1);

            // let valueDiskStatsMode = new Gtk.Switch({
            //     halign: Gtk.Align.END
            // });
            // this._settings.bind('diskstatsmode', valueDiskStatsMode, 'active', Gio.SettingsBindFlags.DEFAULT);
            // // Init
            // valueDiskStatsMode.sensitive = valueDiskStats.active;
            // gridDisk.attach(valueDiskStatsMode, 1, 2, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Display Space')),
            //     halign: Gtk.Align.START,
            //     hexpand: true
            // }), 0, 3, 1, 1);

            // let valueDiskSpace = new Gtk.Switch({
            //     halign: Gtk.Align.END
            // });
            // this._settings.bind('diskspace', valueDiskSpace, 'active', Gio.SettingsBindFlags.DEFAULT);
            // valueDiskSpace.connect('state-set', button => {
            //     widthDiskSpace.sensitive = button.active;
            //     valueDiskSpaceUnit.sensitive = button.active;
            // });
            // gridDisk.attach(valueDiskSpace, 1, 3, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Width')),
            //     halign: Gtk.Align.START
            // }), 0, 4, 1, 1);

            // let widthDiskSpace = new Gtk.SpinButton({
            //     adjustment: new Gtk.Adjustment({
            //         lower: 1,
            //         upper: 500,
            //         step_increment: 1
            //     }),
            //     halign: Gtk.Align.END,
            //     numeric: true
            // });
            // this._settings.bind('widthdiskspace', widthDiskSpace, 'value', Gio.SettingsBindFlags.DEFAULT);
            // // Init
            // widthDiskSpace.sensitive = valueDiskSpace.active;
            // gridDisk.attach(widthDiskSpace, 1, 4, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Percentage Unit')),
            //     halign: Gtk.Align.START,
            //     hexpand: true
            // }), 0, 5, 1, 1);

            // let valueDiskSpaceUnit = new Gtk.Switch({
            //     halign: Gtk.Align.END
            // });
            // this._settings.bind('diskspaceunit', valueDiskSpaceUnit, 'active', Gio.SettingsBindFlags.DEFAULT);
            // // Init
            // valueDiskSpaceUnit.sensitive = valueDiskSpace.active;
            // gridDisk.attach(valueDiskSpaceUnit, 1, 5, 1, 1);

            // gridDisk.attach(new Gtk.Label({
            //     label: '%s'.format(_('Devices')),
            //     halign: Gtk.Align.START,
            //     hexpand: true
            // }), 0, 6, 1, 1);

            // let view = new Gtk.ScrolledWindow();
            // view.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

            // let mainBox = new Gtk.Box({
            //     orientation: Gtk.Orientation.VERTICAL,
            //     vexpand: true,
            //     valign: Gtk.Align.FILL
            // });
            // view.add_with_viewport(mainBox);

            // let list = new Gtk.ListBox({
            //     selection_mode: Gtk.SelectionMode.NONE
            // });
            // mainBox.add(list);

            // gridDisk.attach(view, 0, 7, 2, 1);

            // /****************************************************/

            // // Array format
            // // name stats space
            // // Get current disks settings
            // let disksArray = this._settings.get_strv('diskslist', Gio.SettingsBindFlags.DEFAULT);
            // let newDisksArray = [];

            // let file = GLib.file_get_contents('/proc/mounts');
            // let lines = ('' + file[1]).split('\n');

            // let x = 0;

            // for (let j = 0; j < lines.length; j++) {
            //     let line = lines[j];
            //     let entry = line.trim().split(/\s/);

            //     let name = entry[0];
            //     let path = entry[1];

            //     if (typeof (name) === 'undefined' || name === '' || name.match(/\/dev\/loop\d*/) || (name.match(/^[^\/]/) && !path.match(/\/media\//)))
            //         continue;

            //     let gridElement = new Gtk.Grid({
            //         row_spacing: 6,
            //         orientation: Gtk.Orientation.HORIZONTAL
            //     });

            //     let dName = new Gtk.Label({
            //         label: '%s'.format(_(name)),
            //         halign: Gtk.Align.START,
            //         margin_end: 10,
            //         hexpand: true
            //     });
            //     gridElement.attach(dName, 0, 0, 1, 1);

            //     gridElement.attach(new Gtk.Label({
            //         label: '%s'.format(_(path)),
            //         halign: Gtk.Align.START,
            //         margin_end: 10,
            //         hexpand: true
            //     }), 1, 0, 1, 1);

            //     let dStatsButton = new Gtk.CheckButton({
            //         label: '%s'.format(_("Stats")),
            //         active: false
            //     });
            //     gridElement.attach(dStatsButton, 2, 0, 1, 1);

            //     let dSpaceButton = new Gtk.CheckButton({
            //         label: '%s'.format(_("Space")),
            //         active: false
            //     });
            //     gridElement.attach(dSpaceButton, 3, 0, 1, 1);

            //     // Init gui
            //     for (let i = 0; i < disksArray.length; i++) {
            //         let element = disksArray[i];
            //         let it = element.split(' ');

            //         if (name === it[0]) {
            //             let dStButton = (it[1] === 'true');
            //             let dSpButton = (it[2] === 'true');

            //             dStatsButton.active = dStButton;
            //             dSpaceButton.active = dSpButton;

            //             break;
            //         }
            //     }

            //     dStatsButton.connect('toggled', button => {
            //         // Save new button state
            //         let found = false;

            //         for (let i = 0; i < disksArray.length; i++) {
            //             let element = disksArray[i];
            //             let it = element.split(' ');

            //             if (name === it[0]) {
            //                 it[1] = button.active;
            //                 disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2];

            //                 found = true;
            //                 break;
            //             }
            //         }

            //         // Add new disks
            //         if (found === false) {
            //             disksArray.push(name + ' ' + dStatsButton.active + ' ' + dSpaceButton.active);
            //             found = false;
            //         }

            //         // Save all
            //         this._settings.set_strv('diskslist', disksArray);
            //     });

            //     dSpaceButton.connect('toggled', button => {
            //         // Save new button state
            //         let found = false;

            //         for (let i = 0; i < disksArray.length; i++) {
            //             let element = disksArray[i];
            //             let it = element.split(' ');

            //             if (name === it[0]) {
            //                 it[2] = button.active;
            //                 disksArray[i] = it[0] + ' ' + it[1] + ' ' + it[2];

            //                 found = true;
            //                 break;
            //             }
            //         }

            //         // Add new disks
            //         if (found === false) {
            //             disksArray.push(name + ' ' + dStatsButton.active + ' ' + dSpaceButton.active);
            //             found = false;
            //         }

            //         // Save all
            //         this._settings.set_strv('diskslist', disksArray);
            //     });

            //     // Add disk to newDisksArray
            //     newDisksArray[x] = name + ' ' + dStatsButton.active + ' ' + dSpaceButton.active;

            //     list.insert(gridElement, x++);
            // }

            // // Save newDisksArray with the list of new disks (to remove old disks)
            // disksArray = newDisksArray;
            // this._settings.set_strv('diskslist', disksArray);

            // /****************************************************/

            // this.append_page(diskFrame, new Gtk.Label({
            //     label: '<b>%s</b>'.format(_('Disk')),
            //     use_markup: true,
            //     halign: Gtk.Align.CENTER
            // }));
        }

        _buildNet() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let auto = new SwitchRow('Enable', this._settings, 'autohide');
            let wlan = new SwitchRow('Display', this._settings, 'wlan');
            let eth = new SwitchRow('Display', this._settings, 'eth');
            let widthWlan = new SpinButtonRow('Width', this._settings, 'widthwlan');
            let widthEth = new SpinButtonRow('Width', this._settings, 'widtheth');

            grid.attach(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Auto Hide')),
                use_markup: true,
                halign: Gtk.Align.START
            }), 0, 0, 1, 1);
            grid.attach(auto, 0, 1, 1, 1);
            grid.attach(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Eth')),
                use_markup: true,
                halign: Gtk.Align.START
            }), 0, 2, 1, 1);
            grid.attach(eth, 0, 3, 1, 1);
            grid.attach(widthEth, 0, 4, 1, 1);
            grid.attach(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Wlan')),
                use_markup: true,
                halign: Gtk.Align.START
            }), 0, 5, 1, 1);
            grid.attach(wlan, 0, 6, 1, 1);
            grid.attach(widthWlan, 0, 7, 1, 1);

            eth.button.connect('state-set', button => {
                widthEth.button.sensitive = button.active;
            });
            widthEth.button.sensitive = eth.button.active;

            wlan.button.connect('state-set', button => {
                widthWlan.button.sensitive = button.active;
            });
            widthWlan.button.sensitive = wlan.button.active;

            return grid;
        }

        _buildThermal() {
            let grid = new Gtk.Grid({
                margin_start: 12,
                margin_end: 12,
                margin_top: 12,
                margin_bottom: 12,
                column_spacing: 12,
            });

            let thermal = new SwitchRow('Display', this._settings, 'cputemperature');
            let unit = new SwitchRow('Fahrenheit Unit', this._settings, 'cputemperatureunit');
            let width = new SpinButtonRow('Width', this._settings, 'widthcputemperature');

            grid.attach(new Gtk.Label({
                label: '<b>%s</b>'.format(_('Cpu Temperature')),
                use_markup: true,
                halign: Gtk.Align.START
            }), 0, 0, 1, 1);
            grid.attach(thermal, 0, 1, 1, 1);
            grid.attach(width, 0, 2, 1, 1);
            grid.attach(unit, 0, 3, 1, 1);

            thermal.button.connect('state-set', button => {
                width.button.sensitive = button.active;
                unit.button.sensitive = button.active;
            });
            width.button.sensitive = thermal.button.active;
            unit.button.sensitive = thermal.button.active;

            return grid;
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

function buildPrefsWidget() {
    return new ResourceMonitorPrefsWidget();
}

