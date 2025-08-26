/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/*
 * Resource_Monitor is Copyright © 2018-2024 Giuseppe Silvestro
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

import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

// Settings
const REFRESH_TIME = "refreshtime";
const EXTENSION_POSITION = "extensionposition";
const DECIMALS_STATUS = "decimalsstatus";
const LEFT_CLICK_STATUS = "leftclickstatus";
const RIGHT_CLICK_STATUS = "rightclickstatus";
const CUSTOM_LEFT_CLICK_STATUS = "customleftclickstatus";

const ICONS_STATUS = "iconsstatus";
const ICONS_POSITION = "iconsposition";

const ITEMS_POSITION = "itemsposition";

const COLOR_LIST_SEPARATOR = " ";

const CPU_STATUS = "cpustatus";
const CPU_WIDTH = "cpuwidth";
const CPU_COLORS = "cpucolors";
const CPU_FREQUENCY_STATUS = "cpufrequencystatus";
const CPU_FREQUENCY_WIDTH = "cpufrequencywidth";
const CPU_FREQUENCY_COLORS = "cpufrequencycolors";
const CPU_FREQUENCY_UNIT_MEASURE = "cpufrequencyunitmeasure";
const CPU_LOADAVERAGE_STATUS = "cpuloadaveragestatus";
const CPU_LOADAVERAGE_WIDTH = "cpuloadaveragewidth";
const CPU_LOADAVERAGE_COLORS = "cpuloadaveragecolors";

const RAM_STATUS = "ramstatus";
const RAM_WIDTH = "ramwidth";
const RAM_COLORS = "ramcolors";
const RAM_UNIT = "ramunit";
const RAM_UNIT_MEASURE = "ramunitmeasure";
const RAM_MONITOR = "rammonitor";
const RAM_ALERT = "ramalert";
const RAM_ALERT_THRESHOLD = "ramalertthreshold";

const SWAP_STATUS = "swapstatus";
const SWAP_WIDTH = "swapwidth";
const SWAP_COLORS = "swapcolors";
const SWAP_UNIT = "swapunit";
const SWAP_UNIT_MEASURE = "swapunitmeasure";
const SWAP_MONITOR = "swapmonitor";
const SWAP_ALERT = "swapalert";
const SWAP_ALERT_THRESHOLD = "swapalertthreshold";

const DISK_SHOW_DEVICE_NAME = "diskshowdevicename";
const DISK_STATS_STATUS = "diskstatsstatus";
const DISK_STATS_WIDTH = "diskstatswidth";
const DISK_STATS_COLORS = "diskstatscolors";
const DISK_STATS_MODE = "diskstatsmode";
const DISK_STATS_UNIT_MEASURE = "diskstatsunitmeasure";
const DISK_SPACE_STATUS = "diskspacestatus";
const DISK_SPACE_WIDTH = "diskspacewidth";
const DISK_SPACE_COLORS = "diskspacecolors";
const DISK_SPACE_UNIT = "diskspaceunit";
const DISK_SPACE_UNIT_MEASURE = "diskspaceunitmeasure";
const DISK_SPACE_MONITOR = "diskspacemonitor";
const DISK_DEVICES_DISPLAY_ALL = "diskdevicesdisplayall";
const DISK_DEVICES_LIST = "diskdeviceslist";
const DISK_DEVICES_LIST_SEPARATOR = " ";

const NET_AUTO_HIDE_STATUS = "netautohidestatus";
const NET_UNIT = "netunit";
const NET_UNIT_MEASURE = "netunitmeasure";
const NET_ETH_STATUS = "netethstatus";
const NET_ETH_WIDTH = "netethwidth";
const NET_ETH_COLORS = "netethcolors";
const NET_WLAN_STATUS = "netwlanstatus";
const NET_WLAN_WIDTH = "netwlanwidth";
const NET_WLAN_COLORS = "netwlancolors";

const THERMAL_TEMPERATURE_UNIT = "thermaltemperatureunit";
const THERMAL_CPU_TEMPERATURE_STATUS = "thermalcputemperaturestatus";
const THERMAL_CPU_TEMPERATURE_WIDTH = "thermalcputemperaturewidth";
const THERMAL_CPU_COLORS = "thermalcpucolors";
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST = "thermalcputemperaturedeviceslist";
const THERMAL_GPU_TEMPERATURE_STATUS = "thermalgputemperaturestatus";
const THERMAL_GPU_TEMPERATURE_WIDTH = "thermalgputemperaturewidth";
const THERMAL_GPU_COLORS = "thermalgpucolors";
const THERMAL_GPU_TEMPERATURE_DEVICES_LIST = "thermalgputemperaturedeviceslist";
const THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR = "-";

const GPU_STATUS = "gpustatus";
const GPU_WIDTH = "gpuwidth";
const GPU_COLORS = "gpucolors";
const GPU_MEMORY_COLORS = "gpumemorycolors";
const GPU_MEMORY_UNIT = "gpumemoryunit";
const GPU_MEMORY_UNIT_MEASURE = "gpumemoryunitmeasure";
const GPU_MEMORY_MONITOR = "gpumemorymonitor";
const GPU_DISPLAY_DEVICE_NAME = "gpudisplaydevicename";
const GPU_DEVICES_LIST = "gpudeviceslist";
const GPU_DEVICES_LIST_SEPARATOR = ":";

const ResourceMonitorBuilderScope = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class ResourceMonitorBuilderScope extends GObject.Object {
    vfunc_create_closure(builder, handlerName, flags, connectObject) {
      if (flags & Gtk.BuilderClosureFlags.SWAPPED)
        throw new Error('Unsupported template signal flag "swapped"');

      if (typeof this[handlerName] === "undefined")
        throw new Error(`${handlerName} is undefined`);

      return this[handlerName].bind(connectObject || this);
    }
  }
);

const ResourceMonitorPrefsWidget = GObject.registerClass(
  class ResourceMonitorPrefsWidget extends GObject.Object {
    _connectSpinButton(settings, settingsName, element) {
      settings.bind(
        settingsName,
        element,
        "value",
        Gio.SettingsBindFlags.DEFAULT
      );
    }

    _connectComboBox(settings, settingsName, element) {
      settings.bind(
        settingsName,
        element,
        "active-id",
        Gio.SettingsBindFlags.DEFAULT
      );
    }

    _connectSwitchButton(settings, settingsName, element) {
      settings.bind(
        settingsName,
        element,
        "active",
        Gio.SettingsBindFlags.DEFAULT
      );
    }

    _makeColorRow(
      settings,
      settingsName,
      listbox,
      text = "0.0",
      red = 224 / 255,
      green = 27 / 255,
      blue = 36 / 255,
      alpha = 1.0
    ) {
      const row = new Gtk.ListBoxRow();
      const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

      // Label for the row
      box.append(
        new Gtk.Label({
          label: "Lower than",
          hexpand: true,
          halign: Gtk.Align.START,
        })
      );

      // Entry field for threshold value
      const entry = new Gtk.Entry({
        input_purpose: Gtk.InputPurpose.NUMBER,
        text: text,
        margin_end: 8,
      });
      entry.connect("changed", (widget) => {
        const index = row.get_index();
        let colorsArray = settings.get_strv(settingsName);

        if (index >= 0 && index < colorsArray.length) {
          const [_, oldRed, oldGreen, oldBlue] =
            colorsArray[index].split(COLOR_LIST_SEPARATOR);
          colorsArray[
            index
          ] = `${widget.text}${COLOR_LIST_SEPARATOR}${oldRed}${COLOR_LIST_SEPARATOR}${oldGreen}${COLOR_LIST_SEPARATOR}${oldBlue}`;
          settings.set_strv(settingsName, colorsArray);
        }
      });
      box.append(entry);

      // Color button for selecting color
      const colorButton = new Gtk.ColorButton({
        rgba: new Gdk.RGBA({ red, green, blue, alpha }),
        margin_end: 8,
      });
      colorButton.connect("color-set", (widget) => {
        const index = row.get_index();
        let colorsArray = settings.get_strv(settingsName);

        if (index >= 0 && index < colorsArray.length) {
          const rgba = widget.get_rgba();
          const [threshold] = colorsArray[index].split(COLOR_LIST_SEPARATOR);
          colorsArray[
            index
          ] = `${threshold}${COLOR_LIST_SEPARATOR}${rgba.red}${COLOR_LIST_SEPARATOR}${rgba.green}${COLOR_LIST_SEPARATOR}${rgba.blue}`;
          settings.set_strv(settingsName, colorsArray);
        }
      });
      box.append(colorButton);

      // Delete button to remove row
      const deleteButton = new Gtk.Button({ icon_name: "edit-delete" });
      deleteButton.connect("clicked", () => {
        const index = row.get_index();
        let colorsArray = settings.get_strv(settingsName);

        if (index >= 0 && index < colorsArray.length) {
          listbox.remove(row);
          colorsArray.splice(index, 1);
          settings.set_strv(settingsName, colorsArray);
        }
      });
      box.append(deleteButton);

      row.child = box;
      listbox.append(row);

      // Return the formatted color string for the settings array
      return `${text}${COLOR_LIST_SEPARATOR}${red}${COLOR_LIST_SEPARATOR}${green}${COLOR_LIST_SEPARATOR}${blue}`;
    }

    _makeColors(settings, settingsName, listBox, addButton) {
      const colorsArray = settings.get_strv(settingsName);

      for (const element of colorsArray) {
        const entry = element.split(COLOR_LIST_SEPARATOR);

        // Destructure and parse RGB values
        const [threshold, red, green, blue] = entry;
        const redValue = parseFloat(red);
        const greenValue = parseFloat(green);
        const blueValue = parseFloat(blue);

        // Create a color row with the parsed values
        this._makeColorRow(
          settings,
          settingsName,
          listBox,
          threshold,
          redValue,
          greenValue,
          blueValue
        );
      }

      addButton.connect("clicked", (button) => {
        let colorsArray = settings.get_strv(settingsName);
        colorsArray.push(this._makeColorRow(settings, settingsName, listBox));
        settings.set_strv(settingsName, colorsArray);
      });
    }

    // Function to create a reusable label factory
    _createLabelFactory(getTextCallback) {
      const factory = new Gtk.SignalListItemFactory();

      factory.connect("setup", (factory, listItem) => {
        const label = new Gtk.Label({ halign: Gtk.Align.START });
        listItem.set_child(label);
      });

      factory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const label = listItem.get_child();
        label.set_text(getTextCallback(item));
      });

      return factory;
    }

    _makeThermalColumnView(view, type) {
      const model = new Gio.ListStore({ item_type: type });
      const selection = new Gtk.NoSelection({ model: model });
      view.set_model(selection);

      // Device Column
      const deviceFactory = this._createLabelFactory((item) => item.device);
      const deviceCol = new Gtk.ColumnViewColumn({
        title: "Device",
        factory: deviceFactory,
        resizable: true,
      });
      view.append_column(deviceCol);

      // Name Column
      const nameFactory = this._createLabelFactory((item) => item.name);
      const nameCol = new Gtk.ColumnViewColumn({
        title: "Name",
        factory: nameFactory,
        resizable: true,
      });
      view.append_column(nameCol);

      // Monitor Column
      const monitorFactory = new Gtk.SignalListItemFactory();
      monitorFactory.connect("setup", (factory, listItem) => {
        const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
        listItem.set_child(toggle);
      });

      monitorFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();

        // Set the initial state of the toggle button
        toggle.set_active(item.monitor);

        // Connect the toggled signal with the handler
        toggle.connect("toggled", (toggle) => {
          const [found, index] = model.find(item);
          if (found) {
            item.monitor = toggle.active;
            model.splice(index, 1, [item]); // Update model with new item state
          }
        });
      });

      const monitorCol = new Gtk.ColumnViewColumn({
        title: "Monitor",
        factory: monitorFactory,
        resizable: true,
      });
      view.append_column(monitorCol);

      return model;
    }

    _saveArrayToSettings(model, settings, key) {
      const array = [];
      for (let iter = 0; iter < model.get_n_items(); iter++) {
        const element = model.get_item(iter);
        array.push(element.getFormattedString());
      }
      settings.set_strv(key, array);
    }

    _init({ settings, dir, metadata }) {
      this._settings = settings;
      this._dir = dir;
      this._metadata = metadata;

      // Gtk Css Provider
      this._provider = new Gtk.CssProvider();
      this._provider.load_from_path(this._dir.get_path() + "/prefs.css");
      Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        this._provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
      );

      // Gtk Builder
      this._builder = new Gtk.Builder();
      this._builder.set_scope(new ResourceMonitorBuilderScope());
      this._builder.set_translation_domain(this._metadata["gettext-domain"]);
      this._builder.add_from_file(this._dir.get_path() + "/prefs.ui");

      // PREFS
      this.notebook = this._builder.get_object("main_notebook");

      // GLOBAL FRAME
      this._buildGlobal();

      // CPU FRAME
      this._buildCpu();

      // RAM FRAME
      this._buildRam();

      // SWAP FRAME
      this._buildSwap();

      // DISK FRAME
      this._buildDisk();

      // NET FRAME
      this._buildNet();

      // THERMAL FRAME
      this._buildThermal();

      // GPU FRAME
      this._buildGpu();
    }

    _buildGlobal() {
      this._secondsSpinbutton = this._builder.get_object("seconds_spinbutton");
      this._extensionPositionCombobox = this._builder.get_object(
        "extension_position_combobox"
      );
      this._extensionLeftClickRadioButtonSM = this._builder.get_object(
        "extension_left_click_radiobutton_sm"
      );
      this._extensionLeftClickRadioButtonU = this._builder.get_object(
        "extension_left_click_radiobutton_u"
      );
      this._extensionLeftClickRadioButtonCustom = this._builder.get_object(
        "extension_left_click_radiobutton_custom"
      );
      this._extensionLeftClickEntryCustom = this._builder.get_object(
        "extension_left_click_entry_custom"
      );
      this._extensionRightClickPrefs = this._builder.get_object(
        "extension_right_click_prefs"
      );
      this._decimalsDisplay = this._builder.get_object("decimals_display");
      this._iconsDisplay = this._builder.get_object("icons_display");
      this._iconsPositionCombobox = this._builder.get_object(
        "icons_position_combobox"
      );
      this._itemsPositionListbox = this._builder.get_object(
        "items_position_listbox"
      );

      this._connectSpinButton(
        this._settings,
        REFRESH_TIME,
        this._secondsSpinbutton
      );
      this._connectComboBox(
        this._settings,
        EXTENSION_POSITION,
        this._extensionPositionCombobox
      );
      this._connectSwitchButton(
        this._settings,
        RIGHT_CLICK_STATUS,
        this._extensionRightClickPrefs
      );
      this._connectSwitchButton(
        this._settings,
        DECIMALS_STATUS,
        this._decimalsDisplay
      );
      this._connectSwitchButton(
        this._settings,
        ICONS_STATUS,
        this._iconsDisplay
      );
      this._connectComboBox(
        this._settings,
        ICONS_POSITION,
        this._iconsPositionCombobox
      );

      this._iconsDisplay.connect("state-set", (button) => {
        this._iconsPositionCombobox.sensitive = button.active;
      });
      this._iconsPositionCombobox.sensitive = this._iconsDisplay.active;

      // LEFT-CLICK
      const active = this._settings.get_string(LEFT_CLICK_STATUS);
      const textBufferCustom = this._settings.get_string(
        CUSTOM_LEFT_CLICK_STATUS
      );

      this._extensionLeftClickRadioButtonSM.connect("toggled", (button) => {
        if (button.active) {
          this._settings.set_string(LEFT_CLICK_STATUS, "gnome-system-monitor");
        }
      });
      this._extensionLeftClickRadioButtonSM.active =
        "gnome-system-monitor" === active;

      this._extensionLeftClickRadioButtonU.connect("toggled", (button) => {
        if (button.active) {
          this._settings.set_string(LEFT_CLICK_STATUS, "gnome-usage");
        }
      });
      this._extensionLeftClickRadioButtonU.active = "gnome-usage" === active;

      this._extensionLeftClickRadioButtonCustom.connect("toggled", (button) => {
        if (button.active) {
          const text = this._settings.get_string(CUSTOM_LEFT_CLICK_STATUS);
          this._settings.set_string(LEFT_CLICK_STATUS, text);
        }
        this._extensionLeftClickEntryCustom.sensitive = button.active;
      });
      this._extensionLeftClickRadioButtonCustom.active =
        textBufferCustom === active;
      this._extensionLeftClickEntryCustom.sensitive =
        this._extensionLeftClickRadioButtonCustom.active;
      this._extensionLeftClickEntryCustom.text = textBufferCustom;

      this._extensionLeftClickEntryCustom.connect("changed", (tBuffer) => {
        this._settings.set_string(LEFT_CLICK_STATUS, tBuffer.text);
        this._settings.set_string(CUSTOM_LEFT_CLICK_STATUS, tBuffer.text);
      });

      // ListBox
      let itemsPositionArray = this._settings.get_strv(ITEMS_POSITION);

      for (let i = 0; i < itemsPositionArray.length; i++) {
        const element = itemsPositionArray[i];

        const row = new Gtk.ListBoxRow();
        const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

        const up = new Gtk.Button({ icon_name: "go-up" });
        up.connect("clicked", (button) => {
          const index = row.get_index();
          if (index > 0) {
            [itemsPositionArray[index], itemsPositionArray[index - 1]] = [
              itemsPositionArray[index - 1],
              itemsPositionArray[index],
            ];
            this._itemsPositionListbox.remove(row);
            this._itemsPositionListbox.insert(row, index - 1);

            this._settings.set_strv(ITEMS_POSITION, itemsPositionArray);
          }
        });
        const down = new Gtk.Button({ icon_name: "go-down" });
        down.connect("clicked", (button) => {
          const index = row.get_index();
          if (index < itemsPositionArray.length) {
            [itemsPositionArray[index], itemsPositionArray[index + 1]] = [
              itemsPositionArray[index + 1],
              itemsPositionArray[index],
            ];
            this._itemsPositionListbox.remove(row);
            this._itemsPositionListbox.insert(row, index + 1);

            this._settings.set_strv(ITEMS_POSITION, itemsPositionArray);
          }
        });

        box.append(
          new Gtk.Label({
            label: element,
            hexpand: true,
            halign: Gtk.Align.START,
          })
        );
        box.append(up);
        box.append(down);

        row.child = box;

        this._itemsPositionListbox.insert(row, i);
      }
    }

    _buildCpu() {
      this._cpuDisplay = this._builder.get_object("cpu_display");
      this._cpuWidthSpinbutton = this._builder.get_object(
        "cpu_width_spinbutton"
      );
      this._cpuColorsAddButton = this._builder.get_object(
        "cpu_colors_add_button"
      );
      this._cpuColorsListbox = this._builder.get_object("cpu_colors_listbox");
      this._cpuFrequencyDisplay = this._builder.get_object(
        "cpu_frequency_display"
      );
      this._cpuFrequencyWidthSpinbutton = this._builder.get_object(
        "cpu_frequency_width_spinbutton"
      );
      this._cpuFrequencyColorsAddButton = this._builder.get_object(
        "cpu_frequency_colors_add_button"
      );
      this._cpuFrequencyColorsListbox = this._builder.get_object(
        "cpu_frequency_colors_listbox"
      );
      this._cpuFrequencyUnitMeasureCombobox = this._builder.get_object(
        "cpu_frequency_unit_measure_combobox"
      );
      this._cpuLoadAverageDisplay = this._builder.get_object(
        "cpu_loadaverage_display"
      );
      this._cpuLoadAverageWidthSpinbutton = this._builder.get_object(
        "cpu_loadaverage_width_spinbutton"
      );
      this._cpuLoadAverageColorsAddButton = this._builder.get_object(
        "cpu_load_average_colors_add_button"
      );
      this._cpuLoadAverageColorsListbox = this._builder.get_object(
        "cpu_load_average_colors_listbox"
      );

      this._connectSwitchButton(this._settings, CPU_STATUS, this._cpuDisplay);
      this._connectSpinButton(
        this._settings,
        CPU_WIDTH,
        this._cpuWidthSpinbutton
      );
      this._connectSwitchButton(
        this._settings,
        CPU_FREQUENCY_STATUS,
        this._cpuFrequencyDisplay
      );
      this._connectSpinButton(
        this._settings,
        CPU_FREQUENCY_WIDTH,
        this._cpuFrequencyWidthSpinbutton
      );
      this._connectComboBox(
        this._settings,
        CPU_FREQUENCY_UNIT_MEASURE,
        this._cpuFrequencyUnitMeasureCombobox
      );
      this._connectSwitchButton(
        this._settings,
        CPU_LOADAVERAGE_STATUS,
        this._cpuLoadAverageDisplay
      );
      this._connectSpinButton(
        this._settings,
        CPU_LOADAVERAGE_WIDTH,
        this._cpuLoadAverageWidthSpinbutton
      );

      this._cpuDisplay.connect("state-set", (button) => {
        this._cpuWidthSpinbutton.sensitive = button.active;
      });
      this._cpuWidthSpinbutton.sensitive = this._cpuDisplay.active;

      this._cpuFrequencyDisplay.connect("state-set", (button) => {
        this._cpuFrequencyWidthSpinbutton.sensitive = button.active;
        this._cpuFrequencyUnitMeasureCombobox.sensitive = button.active;
      });
      this._cpuFrequencyWidthSpinbutton.sensitive =
        this._cpuFrequencyDisplay.active;
      this._cpuFrequencyUnitMeasureCombobox.sensitive =
        this._cpuFrequencyDisplay.active;

      this._cpuLoadAverageDisplay.connect("state-set", (button) => {
        this._cpuLoadAverageWidthSpinbutton.sensitive = button.active;
      });
      this._cpuLoadAverageWidthSpinbutton.sensitive =
        this._cpuLoadAverageDisplay.active;

      // Cpu Colors
      this._makeColors(
        this._settings,
        CPU_COLORS,
        this._cpuColorsListbox,
        this._cpuColorsAddButton
      );

      // Frequency Colors
      this._makeColors(
        this._settings,
        CPU_FREQUENCY_COLORS,
        this._cpuFrequencyColorsListbox,
        this._cpuFrequencyColorsAddButton
      );

      // Load Average Colors
      this._makeColors(
        this._settings,
        CPU_LOADAVERAGE_COLORS,
        this._cpuLoadAverageColorsListbox,
        this._cpuLoadAverageColorsAddButton
      );
    }

    _buildRam() {
      this._ramDisplay = this._builder.get_object("ram_display");
      this._ramWidthSpinbutton = this._builder.get_object(
        "ram_width_spinbutton"
      );
      this._ramColorsAddButton = this._builder.get_object(
        "ram_colors_add_button"
      );
      this._ramColorsListbox = this._builder.get_object("ram_colors_listbox");
      this._ramUnitCombobox = this._builder.get_object("ram_unit_combobox");
      this._ramUnitMeasureCombobox = this._builder.get_object(
        "ram_unit_measure_combobox"
      );
      this._ramMonitorCombobox = this._builder.get_object(
        "ram_monitor_combobox"
      );
      this._ramAlert = this._builder.get_object("ram_alert");
      this._ramAlertThresholdSpinbutton = this._builder.get_object(
        "ram_alert_threshold_spinbutton"
      );

      this._connectSwitchButton(this._settings, RAM_STATUS, this._ramDisplay);
      this._connectSpinButton(
        this._settings,
        RAM_WIDTH,
        this._ramWidthSpinbutton
      );
      this._connectComboBox(this._settings, RAM_UNIT, this._ramUnitCombobox);
      this._connectComboBox(
        this._settings,
        RAM_UNIT_MEASURE,
        this._ramUnitMeasureCombobox
      );
      this._connectComboBox(
        this._settings,
        RAM_MONITOR,
        this._ramMonitorCombobox
      );
      this._connectSwitchButton(this._settings, RAM_ALERT, this._ramAlert);
      this._connectSpinButton(
        this._settings,
        RAM_ALERT_THRESHOLD,
        this._ramAlertThresholdSpinbutton
      );

      this._ramDisplay.connect("state-set", (button) => {
        this._ramWidthSpinbutton.sensitive = button.active;
        this._ramUnitCombobox.sensitive = button.active;
        this._ramUnitMeasureCombobox.sensitive = button.active;
        this._ramMonitorCombobox.sensitive = button.active;
        this._ramAlert.sensitive = button.active;
        this._ramAlertThresholdSpinbutton.sensitive = button.active;
      });
      this._ramWidthSpinbutton.sensitive = this._ramDisplay.active;
      this._ramUnitCombobox.sensitive = this._ramDisplay.active;
      this._ramUnitMeasureCombobox.sensitive = this._ramDisplay.active;
      this._ramMonitorCombobox.sensitive = this._ramDisplay.active;
      this._ramAlert.sensitive = this._ramDisplay.active;
      this._ramAlertThresholdSpinbutton.sensitive = this._ramAlert.active;

      this._ramAlert.connect("state-set", (button) => {
        this._ramAlertThresholdSpinbutton.sensitive = button.active;
      });
      this._ramAlertThresholdSpinbutton.sensitive = this._ramAlert.active;

      // Colors
      this._makeColors(
        this._settings,
        RAM_COLORS,
        this._ramColorsListbox,
        this._ramColorsAddButton
      );
    }

    _buildSwap() {
      this._swapDisplay = this._builder.get_object("swap_display");
      this._swapWidthSpinbutton = this._builder.get_object(
        "swap_width_spinbutton"
      );
      this._swapColorsAddButton = this._builder.get_object(
        "swap_colors_add_button"
      );
      this._swapColorsListbox = this._builder.get_object("swap_colors_listbox");
      this._swapUnitCombobox = this._builder.get_object("swap_unit_combobox");
      this._swapUnitMeasureCombobox = this._builder.get_object(
        "swap_unit_measure_combobox"
      );
      this._swapMonitorCombobox = this._builder.get_object(
        "swap_monitor_combobox"
      );
      this._swapAlert = this._builder.get_object("swap_alert");
      this._swapAlertThresholdSpinbutton = this._builder.get_object(
        "swap_alert_threshold_spinbutton"
      );

      this._connectSwitchButton(this._settings, SWAP_STATUS, this._swapDisplay);
      this._connectSpinButton(
        this._settings,
        SWAP_WIDTH,
        this._swapWidthSpinbutton
      );
      this._connectComboBox(this._settings, SWAP_UNIT, this._swapUnitCombobox);
      this._connectComboBox(
        this._settings,
        SWAP_UNIT_MEASURE,
        this._swapUnitMeasureCombobox
      );
      this._connectComboBox(
        this._settings,
        SWAP_MONITOR,
        this._swapMonitorCombobox
      );
      this._connectSwitchButton(this._settings, SWAP_ALERT, this._swapAlert);
      this._connectSpinButton(
        this._settings,
        SWAP_ALERT_THRESHOLD,
        this._swapAlertThresholdSpinbutton
      );

      this._swapDisplay.connect("state-set", (button) => {
        this._swapWidthSpinbutton.sensitive = button.active;
        this._swapUnitCombobox.sensitive = button.active;
        this._swapUnitMeasureCombobox.sensitive = button.active;
        this._swapMonitorCombobox.sensitive = button.active;
        this._swapAlert.sensitive = button.active;
        this._swapAlertThresholdSpinbutton.sensitive = button.active;
      });
      this._swapWidthSpinbutton.sensitive = this._swapDisplay.active;
      this._swapUnitCombobox.sensitive = this._swapDisplay.active;
      this._swapUnitMeasureCombobox.sensitive = this._swapDisplay.active;
      this._swapMonitorCombobox.sensitive = this._swapDisplay.active;
      this._swapAlert.sensitive = this._swapDisplay.active;
      this._swapAlertThresholdSpinbutton.sensitive = this._swapAlert.active;

      this._swapAlert.connect("state-set", (button) => {
        this._swapAlertThresholdSpinbutton.sensitive = button.active;
      });
      this._swapAlertThresholdSpinbutton.sensitive = this._swapAlert.active;

      // Colors
      this._makeColors(
        this._settings,
        SWAP_COLORS,
        this._swapColorsListbox,
        this._swapColorsAddButton
      );
    }

    _buildDisk() {
      this._diskShowDeviceName = this._builder.get_object("disk_show_device_name");
      this._diskStatsDisplay = this._builder.get_object("disk_stats_display");
      this._diskStatsWidthSpinbutton = this._builder.get_object(
        "disk_stats_width_spinbutton"
      );
      this._diskStatsColorsAddButton = this._builder.get_object(
        "disk_stats_colors_add_button"
      );
      this._diskStatsColorsListbox = this._builder.get_object(
        "disk_stats_colors_listbox"
      );
      this._diskStatsModeCombobox = this._builder.get_object(
        "disk_stats_mode_combobox"
      );
      this._diskStatsUnitMeasureCombobox = this._builder.get_object(
        "disk_stats_unit_measure_combobox"
      );
      this._diskSpaceDisplay = this._builder.get_object("disk_space_display");
      this._diskSpaceWidthSpinbutton = this._builder.get_object(
        "disk_space_width_spinbutton"
      );
      this._diskSpaceColorsAddButton = this._builder.get_object(
        "disk_space_colors_add_button"
      );
      this._diskSpaceColorsListbox = this._builder.get_object(
        "disk_space_colors_listbox"
      );
      this._diskSpaceUnitCombobox = this._builder.get_object(
        "disk_space_unit_combobox"
      );
      this._diskSpaceUnitMeasureCombobox = this._builder.get_object(
        "disk_space_unit_measure_combobox"
      );
      this._diskSpaceMonitorCombobox = this._builder.get_object(
        "disk_space_monitor_combobox"
      );
      this._diskDevicesDisplayAll = this._builder.get_object(
        "disk_devices_display_all"
      );
      this._diskDevicesColumnView = this._builder.get_object(
        "disk_devices_columnview"
      );

      this._connectSwitchButton(
        this._settings,
        DISK_SHOW_DEVICE_NAME,
        this._diskShowDeviceName
      );
      this._connectSwitchButton(
        this._settings,
        DISK_STATS_STATUS,
        this._diskStatsDisplay
      );
      this._connectSpinButton(
        this._settings,
        DISK_STATS_WIDTH,
        this._diskStatsWidthSpinbutton
      );
      this._connectComboBox(
        this._settings,
        DISK_STATS_MODE,
        this._diskStatsModeCombobox
      );
      this._connectComboBox(
        this._settings,
        DISK_STATS_UNIT_MEASURE,
        this._diskStatsUnitMeasureCombobox
      );
      this._connectSwitchButton(
        this._settings,
        DISK_SPACE_STATUS,
        this._diskSpaceDisplay
      );
      this._connectSpinButton(
        this._settings,
        DISK_SPACE_WIDTH,
        this._diskSpaceWidthSpinbutton
      );
      this._connectComboBox(
        this._settings,
        DISK_SPACE_UNIT,
        this._diskSpaceUnitCombobox
      );
      this._connectComboBox(
        this._settings,
        DISK_SPACE_UNIT_MEASURE,
        this._diskSpaceUnitMeasureCombobox
      );
      this._connectComboBox(
        this._settings,
        DISK_SPACE_MONITOR,
        this._diskSpaceMonitorCombobox
      );
      this._connectSwitchButton(
        this._settings,
        DISK_DEVICES_DISPLAY_ALL,
        this._diskDevicesDisplayAll
      );

      this._diskStatsDisplay.connect("state-set", (button) => {
        this._diskStatsWidthSpinbutton.sensitive = button.active;
        this._diskStatsModeCombobox.sensitive = button.active;
        this._diskStatsUnitMeasureCombobox.sensitive = button.active;
      });
      this._diskStatsWidthSpinbutton.sensitive = this._diskStatsDisplay.active;
      this._diskStatsModeCombobox.sensitive = this._diskStatsDisplay.active;
      this._diskStatsUnitMeasureCombobox.sensitive =
        this._diskStatsDisplay.active;

      this._diskSpaceDisplay.connect("state-set", (button) => {
        this._diskSpaceWidthSpinbutton.sensitive = button.active;
        this._diskSpaceUnitCombobox.sensitive = button.active;
        this._diskSpaceMonitorCombobox.sensitive = button.active;
        this._diskSpaceUnitMeasureCombobox.sensitive = button.active;
      });
      this._diskSpaceWidthSpinbutton.sensitive = this._diskSpaceDisplay.active;
      this._diskSpaceUnitCombobox.sensitive = this._diskSpaceDisplay.active;
      this._diskSpaceMonitorCombobox.sensitive = this._diskSpaceDisplay.active;
      this._diskSpaceUnitMeasureCombobox.sensitive =
        this._diskSpaceDisplay.active;

      // ColumnView
      this._diskDevicesModel = new Gio.ListStore({
        item_type: DiskElement,
      });
      const selection = new Gtk.NoSelection({
        model: this._diskDevicesModel,
      });
      this._diskDevicesColumnView.set_model(selection);

      // Display Name Column
      const displayNameFactory = new Gtk.SignalListItemFactory();
      displayNameFactory.connect("setup", (factory, listItem) => {
        const label = new Gtk.Entry();
        listItem.set_child(label);
      });
      displayNameFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const label = listItem.get_child();
        label.set_text(item.displayName);
        label.connect("changed", (tBuffer) => {
          const [found, index] = this._diskDevicesModel.find(item);

          if (found) {
            item.setDisplayName(tBuffer.text);

            // Update if empty
            if (item.displayName !== tBuffer.text) {
              tBuffer.text = item.displayName;
            }

            this._diskDevicesModel.splice(index, 1, [item]);
          }
        });
      });

      const displayNameCol = new Gtk.ColumnViewColumn({
        title: "Display Name",
        factory: displayNameFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(displayNameCol);

      // Device Column
      const deviceFactory = this._createLabelFactory((item) => item.device);

      const deviceCol = new Gtk.ColumnViewColumn({
        title: "Device",
        factory: deviceFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(deviceCol);

      // Mount Point Column
      const mountPointFactory = this._createLabelFactory(
        (item) => item.mountPoint
      );

      const mountPointCol = new Gtk.ColumnViewColumn({
        title: "Mount Point",
        factory: mountPointFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(mountPointCol);

      // Stats Column
      const statsFactory = new Gtk.SignalListItemFactory();
      statsFactory.connect("setup", (factory, listItem) => {
        const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
        listItem.set_child(toggle);
      });
      statsFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();

        // Set the initial state of the toggle button
        toggle.set_active(item.stats);

        // Connect the toggled signal with the handler
        toggle.connect("toggled", (toggle) => {
          const [found, index] = this._diskDevicesModel.find(item);
          if (found) {
            item.stats = toggle.active;
            this._diskDevicesModel.splice(index, 1, [item]); // Update model with new item state
          }
        });
      });

      const statsCol = new Gtk.ColumnViewColumn({
        title: "Stats",
        factory: statsFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(statsCol);

      // Space Column
      const spaceFactory = new Gtk.SignalListItemFactory();
      spaceFactory.connect("setup", (factory, listItem) => {
        const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
        listItem.set_child(toggle);
      });
      spaceFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();

        // Set the initial state of the toggle button
        toggle.set_active(item.space);
        if (item.mountPoint === "") {
          toggle.sensitive = false;
        }

        // Connect the toggled signal with the handler
        toggle.connect("toggled", (toggle) => {
          const [found, index] = this._diskDevicesModel.find(item);
          if (found) {
            item.space = toggle.active;
            this._diskDevicesModel.splice(index, 1, [item]); // Update model with new item state
          }
        });
      });

      const spaceCol = new Gtk.ColumnViewColumn({
        title: "Space",
        factory: spaceFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(spaceCol);

      // Display All
      this._diskDevicesDisplayAll.connect("state-set", (button) => {
        // Refresh
        this._readDiskDevices(
          this._settings,
          this._diskDevicesModel,
          button.active
        );
      });
      this._readDiskDevices(
        this._settings,
        this._diskDevicesModel,
        this._diskDevicesDisplayAll.active
      );

      // Update
      this._diskDevicesModel.connect(
        "items-changed",
        (_list, position, removed, added) => {
          const diskElement = _list.get_item(position);
          // This is necessary because model.remove_all() is used
          if (diskElement) {
            let disksArray = this._settings.get_strv(DISK_DEVICES_LIST);

            disksArray[position] = diskElement.getFormattedString();

            this._settings.set_strv(DISK_DEVICES_LIST, disksArray);
          }
        }
      );

      // Stats Colors
      this._makeColors(
        this._settings,
        DISK_STATS_COLORS,
        this._diskStatsColorsListbox,
        this._diskStatsColorsAddButton
      );

      // Space Colors
      this._makeColors(
        this._settings,
        DISK_SPACE_COLORS,
        this._diskSpaceColorsListbox,
        this._diskSpaceColorsAddButton
      );
    }

    _readDiskDevices(settings, model, loadAll) {
      // Array format
      // filesystem mount_point stats space display_name

      model.remove_all();

      // Retrieve the disk device settings
      let disksArray = settings.get_strv(DISK_DEVICES_LIST);

      // Execute 'df' command and parse the output
      this._executeCommand(["df", "-x", "squashfs", "-x", "tmpfs"])
        .then((output) => {
          const lines = output.split("\n");

          // Parse each line of the command output, skipping the header line
          for (let i = 1; i < lines.length - 1; i++) {
            const entry = lines[i].trim().split(/\s+/);
            const filesystem = entry[0];
            const mountPoint = entry[5];

            // Initialize button states and display name
            let statsButton = false;
            let spaceButton = false;
            let displayName = filesystem;

            // Check if the device is in the settings array
            for (const diskConfig of disksArray) {
              const [fs, mount, stBtn, spBtn, name] = diskConfig.split(
                DISK_DEVICES_LIST_SEPARATOR
              );
              if (filesystem === fs && mountPoint === mount) {
                statsButton = stBtn === "true";
                spaceButton = spBtn === "true";
                displayName = name;
                break;
              }
            }

            // Append disk entry to the model
            model.append(
              new DiskElement(
                displayName,
                filesystem,
                mountPoint,
                statsButton,
                spaceButton
              )
            );
          }

          if (loadAll) {
            // Load additional devices from /proc/diskstats if needed
            this._loadFile("/proc/diskstats")
              .then((contents) => {
                const lines = new TextDecoder().decode(contents).split("\n");

                for (const line of lines) {
                  if (!line.trim()) continue;

                  const entry = line.trim().split(/\s+/);
                  const devicePath = `/dev/${entry[2]}`;

                  // Skip loop devices
                  if (entry[2].match(/loop*/)) continue;

                  // Check if device is already listed
                  let isListed = false;
                  for (let iter = 0; iter < model.get_n_items(); iter++) {
                    if (devicePath === model.get_item(iter).device) {
                      isListed = true;
                      break; // Stop the for
                    }
                  }

                  if (!isListed) {
                    // Initialize button states and display name
                    let statsButton = false;
                    let spaceButton = false;
                    let displayName = devicePath;

                    // Check if the device is in the settings array
                    for (const diskConfig of disksArray) {
                      const [fs, mount, stBtn, spBtn, name] = diskConfig.split(
                        DISK_DEVICES_LIST_SEPARATOR
                      );
                      if (devicePath === fs && "" === mount) {
                        statsButton = stBtn === "true";
                        spaceButton = spBtn === "true";
                        displayName = name;
                        break;
                      }
                    }

                    model.append(
                      new DiskElement(
                        displayName,
                        devicePath,
                        "",
                        statsButton,
                        spaceButton
                      )
                    );
                  }
                }

                // Save updated disksArray to settings
                this._saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
              })
              .catch((err) =>
                console.error(
                  "[Resource_Monitor] Error loading /proc/diskstats:",
                  err
                )
              );
          } else {
            // Save updated disksArray to settings
            this._saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
          }
        })
        .catch((err) =>
          console.error("[Resource_Monitor] Error executing df command:", err)
        );
    }

    _buildNet() {
      this._netAutoHide = this._builder.get_object("net_auto_hide");
      this._netUnitCombobox = this._builder.get_object("net_unit_combobox");
      this._netUnitMeasureCombobox = this._builder.get_object(
        "net_unit_measure_combobox"
      );
      this._netEthDisplay = this._builder.get_object("net_eth_display");
      this._netEthWidthSpinbutton = this._builder.get_object(
        "net_eth_width_spinbutton"
      );
      this._netEthColorsAddButton = this._builder.get_object(
        "net_eth_colors_add_button"
      );
      this._netEthColorsListbox = this._builder.get_object(
        "net_eth_colors_listbox"
      );
      this._netWlanDisplay = this._builder.get_object("net_wlan_display");
      this._netWlanWidthSpinbutton = this._builder.get_object(
        "net_wlan_width_spinbutton"
      );
      this._netWlanColorsAddButton = this._builder.get_object(
        "net_wlan_colors_add_button"
      );
      this._netWlanColorsListbox = this._builder.get_object(
        "net_wlan_colors_listbox"
      );

      this._connectSwitchButton(
        this._settings,
        NET_AUTO_HIDE_STATUS,
        this._netAutoHide
      );
      this._connectComboBox(this._settings, NET_UNIT, this._netUnitCombobox);
      this._connectComboBox(
        this._settings,
        NET_UNIT_MEASURE,
        this._netUnitMeasureCombobox
      );
      this._connectSwitchButton(
        this._settings,
        NET_ETH_STATUS,
        this._netEthDisplay
      );
      this._connectSpinButton(
        this._settings,
        NET_ETH_WIDTH,
        this._netEthWidthSpinbutton
      );
      this._connectSwitchButton(
        this._settings,
        NET_WLAN_STATUS,
        this._netWlanDisplay
      );
      this._connectSpinButton(
        this._settings,
        NET_WLAN_WIDTH,
        this._netWlanWidthSpinbutton
      );

      this._netEthDisplay.connect("state-set", (button) => {
        this._netEthWidthSpinbutton.sensitive = button.active;
      });
      this._netEthWidthSpinbutton.sensitive = this._netEthDisplay.active;

      this._netWlanDisplay.connect("state-set", (button) => {
        this._netWlanWidthSpinbutton.sensitive = button.active;
      });
      this._netWlanWidthSpinbutton.sensitive = this._netWlanDisplay.active;

      // Eth Colors
      this._makeColors(
        this._settings,
        NET_ETH_COLORS,
        this._netEthColorsListbox,
        this._netEthColorsAddButton
      );

      // Wlan Colors
      this._makeColors(
        this._settings,
        NET_WLAN_COLORS,
        this._netWlanColorsListbox,
        this._netWlanColorsAddButton
      );
    }

    _buildThermal() {
      this._thermalUnitCombobox = this._builder.get_object(
        "thermal_unit_combobox"
      );
      this._thermalCpuDisplay = this._builder.get_object("thermal_cpu_display");
      this._thermalCpuWidthSpinbutton = this._builder.get_object(
        "thermal_cpu_width_spinbutton"
      );
      this._thermalCpuColorsAddButton = this._builder.get_object(
        "thermal_cpu_colors_add_button"
      );
      this._thermalCpuColorsListbox = this._builder.get_object(
        "thermal_cpu_colors_listbox"
      );
      this._thermalCpuDevicesColumnView = this._builder.get_object(
        "thermal_cpu_devices_columnview"
      );
      this._thermalGpuDisplay = this._builder.get_object("thermal_gpu_display");
      this._thermalGpuWidthSpinbutton = this._builder.get_object(
        "thermal_gpu_width_spinbutton"
      );
      this._thermalGpuColorsAddButton = this._builder.get_object(
        "thermal_gpu_colors_add_button"
      );
      this._thermalGpuColorsListbox = this._builder.get_object(
        "thermal_gpu_colors_listbox"
      );
      this._thermalGpuDevicesColumnView = this._builder.get_object(
        "thermal_gpu_devices_columnview"
      );

      this._connectComboBox(
        this._settings,
        THERMAL_TEMPERATURE_UNIT,
        this._thermalUnitCombobox
      );
      this._connectSwitchButton(
        this._settings,
        THERMAL_CPU_TEMPERATURE_STATUS,
        this._thermalCpuDisplay
      );
      this._connectSpinButton(
        this._settings,
        THERMAL_CPU_TEMPERATURE_WIDTH,
        this._thermalCpuWidthSpinbutton
      );
      this._connectSwitchButton(
        this._settings,
        THERMAL_GPU_TEMPERATURE_STATUS,
        this._thermalGpuDisplay
      );
      this._connectSpinButton(
        this._settings,
        THERMAL_GPU_TEMPERATURE_WIDTH,
        this._thermalGpuWidthSpinbutton
      );

      this._thermalCpuDisplay.connect("state-set", (button) => {
        this._thermalCpuWidthSpinbutton.sensitive = button.active;
      });
      this._thermalCpuWidthSpinbutton.sensitive =
        this._thermalCpuDisplay.active;

      this._thermalGpuDisplay.connect("state-set", (button) => {
        this._thermalGpuWidthSpinbutton.sensitive = button.active;
      });
      this._thermalGpuWidthSpinbutton.sensitive =
        this._thermalGpuDisplay.active;

      // CPU
      // ColumnView
      this._thermalCpuDevicesModel = this._makeThermalColumnView(
        this._thermalCpuDevicesColumnView,
        ThermalCpuElement
      );

      // Array format
      // name-status-path
      let cpuTempsArray = this._settings.get_strv(
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST
      );

      // Detect sensors
      // let command = 'for i in /sys/class/hwmon/hwmon*/temp*_input; do echo "$(<$(dirname $i)/name): $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*})) $(readlink -f $i)"; done';
      this._executeCommand([
        "bash",
        "-c",
        'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then echo "EXIST"; fi',
      ])
        .then((output) => {
          const result = output.trim().split("\n")[0];

          if (result === "EXIST") {
            // Execute command to detect relevant temperature sensors
            this._executeCommand([
              "bash",
              "-c",
              'for i in /sys/class/hwmon/hwmon*/temp*_input; do NAME="$(<$(dirname $i)/name)"; if [[ "$NAME" == "coretemp" ]] || [[ "$NAME" == "k10temp" ]] || [[ "$NAME" == "zenpower" ]]; then echo "$NAME: $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; fi done',
            ])
              .then((inner_output) => {
                const lines = inner_output.trim().split("\n");

                for (const line of lines) {
                  if (!line) continue;

                  const [device, path] = line.trim().split(/-/);
                  let statusButton = false;

                  // Check if this device is in the saved temperature settings
                  for (const tempConfig of cpuTempsArray) {
                    const [savedDevice, buttonStatus, savedPath] =
                      tempConfig.split(
                        THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR
                      );
                    if (device === savedDevice) {
                      statusButton = buttonStatus === "true";
                      break;
                    }
                  }

                  // Append the CPU temperature data to the model
                  this._thermalCpuDevicesModel.append(
                    new ThermalCpuElement(path, device, statusButton)
                  );
                }

                // Save updated CPU temperature array to settings
                this._saveArrayToSettings(
                  this._thermalCpuDevicesModel,
                  this._settings,
                  THERMAL_CPU_TEMPERATURE_DEVICES_LIST
                );
              })
              .catch((error) =>
                console.error(
                  "[Resource_Monitor] Error fetching sensor details:",
                  error
                )
              );
          }
        })
        .catch((error) =>
          console.error(
            "[Resource_Monitor] Error checking for sensor existence:",
            error
          )
        );

      // Update
      this._thermalCpuDevicesModel.connect(
        "items-changed",
        (_list, position, removed, added) => {
          const cpuTempElement = _list.get_item(position);
          let cpuTempsArray = this._settings.get_strv(
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST
          );

          cpuTempsArray[position] = cpuTempElement.getFormattedString();

          this._settings.set_strv(
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
            cpuTempsArray
          );
        }
      );

      // Colors
      this._makeColors(
        this._settings,
        THERMAL_CPU_COLORS,
        this._thermalCpuColorsListbox,
        this._thermalCpuColorsAddButton
      );

      // GPU
      // ColumnView
      this._thermalGpuDevicesModel = this._makeThermalColumnView(
        this._thermalGpuDevicesColumnView,
        ThermalGpuElement
      );

      // Array format
      // uuid:name:status
      let gpuTempsArray = this._settings.get_strv(
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST
      );

      // NVIDIA GPU detection
      this._executeCommand(["nvidia-smi", "-L"])
        .then((output) => {
          const lines = output.trim().split("\n");

          for (const line of lines) {
            if (!line) continue;

            const entry = line.trim().split(":");
            const device = entry[0].trim();
            const name = entry[1]?.trim().slice(0, -6); // Remove trailing "(UUID)"
            const uuid = entry[2]?.trim().slice(0, -1); // Remove trailing ")"

            let statusButton = false;

            // Check if the UUID is in the saved GPU temperature settings
            for (const gpuConfig of gpuTempsArray) {
              const [savedUuid, name, statusBtn] = gpuConfig.split(
                GPU_DEVICES_LIST_SEPARATOR
              );

              if (uuid === savedUuid) {
                statusButton = statusBtn === "true";
                break;
              }
            }

            // Append the GPU data to the thermal model
            this._thermalGpuDevicesModel.append(
              new ThermalGpuElement(uuid, name, statusButton)
            );
          }

          // Save updated GPU temperatures to settings
          this._saveArrayToSettings(
            this._thermalGpuDevicesModel,
            this._settings,
            THERMAL_GPU_TEMPERATURE_DEVICES_LIST
          );
        })
        .catch((error) =>
          console.error(
            "[Resource_Monitor] Error executing nvidia-smi command:",
            error
          )
        );

      // Update
      this._thermalGpuDevicesModel.connect(
        "items-changed",
        (_list, position, removed, added) => {
          const gpuTempElement = _list.get_item(position);
          let gpuTempsArray = this._settings.get_strv(
            THERMAL_GPU_TEMPERATURE_DEVICES_LIST
          );

          gpuTempsArray[position] = gpuTempElement.getFormattedString();

          this._settings.set_strv(
            THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
            gpuTempsArray
          );
        }
      );

      // Colors
      this._makeColors(
        this._settings,
        THERMAL_GPU_COLORS,
        this._thermalGpuColorsListbox,
        this._thermalGpuColorsAddButton
      );
    }

    _buildGpu() {
      this._gpuDisplay = this._builder.get_object("gpu_display");
      this._gpuWidthSpinbutton = this._builder.get_object(
        "gpu_width_spinbutton"
      );
      this._gpuColorsAddButton = this._builder.get_object(
        "gpu_colors_add_button"
      );
      this._gpuColorsListbox = this._builder.get_object("gpu_colors_listbox");
      this._gpuMemoryColorsAddButton = this._builder.get_object(
        "gpu_memory_colors_add_button"
      );
      this._gpuMemoryColorsListbox = this._builder.get_object(
        "gpu_memory_colors_listbox"
      );
      this._gpuMemoryUnitCombobox = this._builder.get_object(
        "gpu_memory_unit_combobox"
      );
      this._gpuMemoryUnitMeasureCombobox = this._builder.get_object(
        "gpu_memory_unit_measure_combobox"
      );
      this._gpuMemoryMonitorCombobox = this._builder.get_object(
        "gpu_memory_monitor_combobox"
      );
      this._gpuDisplayDeviceName = this._builder.get_object(
        "gpu_display_device_name"
      );
      this._gpuDevicesColumnView = this._builder.get_object(
        "gpu_devices_columnview"
      );

      this._connectSwitchButton(this._settings, GPU_STATUS, this._gpuDisplay);
      this._connectSpinButton(
        this._settings,
        GPU_WIDTH,
        this._gpuWidthSpinbutton
      );
      this._connectComboBox(
        this._settings,
        GPU_MEMORY_UNIT,
        this._gpuMemoryUnitCombobox
      );
      this._connectComboBox(
        this._settings,
        GPU_MEMORY_UNIT_MEASURE,
        this._gpuMemoryUnitMeasureCombobox
      );
      this._connectComboBox(
        this._settings,
        GPU_MEMORY_MONITOR,
        this._gpuMemoryMonitorCombobox
      );
      this._connectSwitchButton(
        this._settings,
        GPU_DISPLAY_DEVICE_NAME,
        this._gpuDisplayDeviceName
      );

      this._gpuDisplay.connect("state-set", (button) => {
        this._gpuWidthSpinbutton.sensitive = button.active;
        this._gpuMemoryUnitCombobox.sensitive = button.active;
        this._gpuMemoryUnitMeasureCombobox.sensitive = button.active;
        this._gpuMemoryMonitorCombobox.sensitive = button.active;
        this._gpuDisplayDeviceName.sensitive = button.active;
      });
      this._gpuWidthSpinbutton.sensitive = this._gpuDisplay.active;
      this._gpuMemoryUnitCombobox.sensitive = this._gpuDisplay.active;
      this._gpuMemoryUnitMeasureCombobox.sensitive = this._gpuDisplay.active;
      this._gpuMemoryMonitorCombobox.sensitive = this._gpuDisplay.active;
      this._gpuDisplayDeviceName.sensitive = this._gpuDisplay.active;

      // ColumnView
      this._gpuDevicesModel = new Gio.ListStore({
        item_type: GpuElement,
      });
      const selection = new Gtk.NoSelection({
        model: this._gpuDevicesModel,
      });
      this._gpuDevicesColumnView.set_model(selection);

      // Display Name Column
      const displayNameFactory = new Gtk.SignalListItemFactory();
      displayNameFactory.connect("setup", (factory, listItem) => {
        const label = new Gtk.Entry();
        listItem.set_child(label);
      });
      displayNameFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const label = listItem.get_child();
        label.set_text(item.displayName);
        label.connect("changed", (tBuffer) => {
          const [found, index] = this._gpuDevicesModel.find(item);

          if (found) {
            item.setDisplayName(tBuffer.text);

            // Update if empty
            if (item.displayName !== tBuffer.text) {
              tBuffer.text = item.displayName;
            }

            this._gpuDevicesModel.splice(index, 1, [item]);
          }
        });
      });

      const displayNameCol = new Gtk.ColumnViewColumn({
        title: "Display Name",
        factory: displayNameFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(displayNameCol);

      // Device Column
      const deviceFactory = this._createLabelFactory((item) => item.device);

      const deviceCol = new Gtk.ColumnViewColumn({
        title: "Device",
        factory: deviceFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(deviceCol);

      // Name Column
      const nameFactory = this._createLabelFactory((item) => item.name);

      const nameCol = new Gtk.ColumnViewColumn({
        title: "Name",
        factory: nameFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(nameCol);

      // Usage Column
      const usageFactory = new Gtk.SignalListItemFactory();
      usageFactory.connect("setup", (factory, listItem) => {
        const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
        listItem.set_child(toggle);
      });
      usageFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();

        // Set the initial state of the toggle button
        toggle.set_active(item.usage);

        // Connect the toggled signal with the handler
        toggle.connect("toggled", (toggle) => {
          const [found, index] = this._gpuDevicesModel.find(item);
          if (found) {
            item.usage = toggle.active;
            this._gpuDevicesModel.splice(index, 1, [item]); // Update model with new item state
          }
        });
      });

      const usageCol = new Gtk.ColumnViewColumn({
        title: "Usage Monitor",
        factory: usageFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(usageCol);

      // Memory Column
      const memoryFactory = new Gtk.SignalListItemFactory();
      memoryFactory.connect("setup", (factory, listItem) => {
        const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
        listItem.set_child(toggle);
      });
      memoryFactory.connect("bind", (factory, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();

        // Set the initial state of the toggle button
        toggle.set_active(item.memory);

        // Connect the toggled signal with the handler
        toggle.connect("toggled", (toggle) => {
          const [found, index] = this._gpuDevicesModel.find(item);
          if (found) {
            item.memory = toggle.active;
            this._gpuDevicesModel.splice(index, 1, [item]); // Update model with new item state
          }
        });
      });

      const memoryCol = new Gtk.ColumnViewColumn({
        title: "Memory Monitor",
        factory: memoryFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(memoryCol);

      // Array format
      // uuid:name:usage:memory:displayName
      let gpuDevicesArray = this._settings.get_strv(GPU_DEVICES_LIST);

      // NVIDIA GPU detection
      this._executeCommand(["nvidia-smi", "-L"])
        .then((output) => {
          const lines = output.trim().split("\n");

          for (const line of lines) {
            if (!line) continue;

            const entry = line.trim().split(":");
            const device = entry[0].trim();
            const name = entry[1]?.trim().slice(0, -6); // Remove trailing "(UUID)"
            const uuid = entry[2]?.trim().slice(0, -1); // Remove trailing ")"

            let usageButton = false;
            let memoryButton = false;
            let displayName = name;

            // Check if the UUID is in the saved GPU settings
            for (const gpuConfig of gpuDevicesArray) {
              const [
                savedUuid,
                savedName,
                usageStatus,
                memoryStatus,
                savedDisplayName,
              ] = gpuConfig.split(GPU_DEVICES_LIST_SEPARATOR);

              if (uuid === savedUuid) {
                usageButton = usageStatus === "true";
                memoryButton = memoryStatus === "true";
                displayName = savedDisplayName;
                break;
              }
            }

            // Append the GPU data to the model
            this._gpuDevicesModel.append(
              new GpuElement(displayName, uuid, name, usageButton, memoryButton)
            );
          }

          // Save updated GPU array to settings
          this._saveArrayToSettings(
            this._gpuDevicesModel,
            this._settings,
            GPU_DEVICES_LIST
          );
        })
        .catch((error) =>
          console.error(
            "[Resource_Monitor] Error executing nvidia-smi command:",
            error
          )
        );

      // Update
      this._gpuDevicesModel.connect(
        "items-changed",
        (_list, position, removed, added) => {
          const gpuElement = _list.get_item(position);
          let gpuDevicesArray = this._settings.get_strv(GPU_DEVICES_LIST);

          gpuDevicesArray[position] = gpuElement.getFormattedString();

          this._settings.set_strv(GPU_DEVICES_LIST, gpuDevicesArray);
        }
      );

      // Gpu Colors
      this._makeColors(
        this._settings,
        GPU_COLORS,
        this._gpuColorsListbox,
        this._gpuColorsAddButton
      );

      // Memory Colors
      this._makeColors(
        this._settings,
        GPU_MEMORY_COLORS,
        this._gpuMemoryColorsListbox,
        this._gpuMemoryColorsAddButton
      );
    }

    _loadContents(file, cancellable = null) {
      return new Promise((resolve, reject) => {
        file.load_contents_async(cancellable, (source_object, res) => {
          try {
            const [ok, contents, etag_out] =
              source_object.load_contents_finish(res);
            if (ok) {
              resolve(contents);
            } else {
              reject(new Error("Failed to load contents"));
            }
          } catch (error) {
            reject(
              new Error(`Error in load_contents_finish: ${error.message}`)
            );
          }
        });
      });
    }

    async _loadFile(path, cancellable = null) {
      try {
        const file = Gio.File.new_for_path(path);
        const contents = await this._loadContents(file, cancellable);
        return contents;
      } catch (error) {
        console.error(`[Resource_Monitor] Load File Error: ${error.message}`);
      }
    }

    _readOutput(proc, cancellable = null) {
      return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, cancellable, (source_object, res) => {
          try {
            const [ok, stdout, stderr] =
              source_object.communicate_utf8_finish(res);
            if (ok) {
              resolve(stdout);
            } else {
              reject(new Error(`Process failed with error: ${stderr}`));
            }
          } catch (error) {
            reject(
              new Error(`Error in communicate_utf8_finish: ${error.message}`)
            );
          }
        });
      });
    }

    async _executeCommand(command, cancellable = null) {
      try {
        const proc = Gio.Subprocess.new(
          command,
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );
        const output = await this._readOutput(proc, cancellable);
        return output;
      } catch (error) {
        console.error(
          `[Resource_Monitor] Execute Command Error: ${error.message}`
        );
      }
    }
  }
);

const DiskElement = GObject.registerClass(
  class DiskElement extends GObject.Object {
    _init(displayName, device, mountPoint, stats, space) {
      super._init();
      this.device = device;
      this.mountPoint = mountPoint;
      this.stats = stats;
      this.space = space;

      this.setDisplayName(displayName);
    }

    setDisplayName(displayName) {
      if (displayName) {
        this.displayName = displayName;
      } else {
        if (this.device.match(/(\/\w+)+/)) {
          this.displayName = this.device.split("/").pop();
        } else {
          this.displayName = this.device;
        }
      }
    }

    getFormattedString() {
      return `${this.device}${DISK_DEVICES_LIST_SEPARATOR}${this.mountPoint}${DISK_DEVICES_LIST_SEPARATOR}${this.stats}${DISK_DEVICES_LIST_SEPARATOR}${this.space}${DISK_DEVICES_LIST_SEPARATOR}${this.displayName}`;
    }
  }
);

const ThermalElement = GObject.registerClass(
  class ThermalElement extends GObject.Object {
    _init(device, name, monitor) {
      super._init();
      this.device = device;
      this.name = name;
      this.monitor = monitor;
    }

    getFormattedString() {
      return "";
    }
  }
);

const ThermalCpuElement = GObject.registerClass(
  class ThermalCpuElement extends ThermalElement {
    getFormattedString() {
      return `${this.name}${THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR}${this.monitor}${THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR}${this.device}`;
    }
  }
);

const ThermalGpuElement = GObject.registerClass(
  class ThermalGpuElement extends ThermalElement {
    getFormattedString() {
      return `${this.device}${GPU_DEVICES_LIST_SEPARATOR}${this.name}${GPU_DEVICES_LIST_SEPARATOR}${this.monitor}`;
    }
  }
);

const GpuElement = GObject.registerClass(
  class GpuElement extends GObject.Object {
    _init(displayName, device, name, usage, memory) {
      super._init();
      this.device = device;
      this.name = name;
      this.usage = usage;
      this.memory = memory;

      this.setDisplayName(displayName);
    }

    setDisplayName(displayName) {
      this.displayName = displayName || this.name;
    }

    getFormattedString() {
      return `${this.device}${GPU_DEVICES_LIST_SEPARATOR}${this.name}${GPU_DEVICES_LIST_SEPARATOR}${this.usage}${GPU_DEVICES_LIST_SEPARATOR}${this.memory}${GPU_DEVICES_LIST_SEPARATOR}${this.displayName}`;
    }
  }
);

export default class ResourceMonitorExtensionPreferences extends ExtensionPreferences {
  getPreferencesWidget() {
    const widget = new ResourceMonitorPrefsWidget({
      settings: this.getSettings(),
      dir: this.dir,
      metadata: this.metadata,
    });

    return widget.notebook;
  }
}
