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

import Adw from "gi://Adw";
import Gdk from "gi://Gdk?version=4.0";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import {
  parseDiskEntry,
  parseGpuEntry,
  parseThermalCpuEntry,
  parseThermalGpuEntry,
} from "./common.js";
import {
  connectComboBox,
  connectSpinButton,
  connectSwitchButton,
  createLabelFactory,
  executeCommand,
  loadFile,
  makeColors,
  makeThermalColumnView,
  parseSettingsArray,
  replaceSignalHandler,
  saveArrayToSettings,
} from "./prefs/helpers.js";
import {
  DiskElement,
  GpuElement,
  ThermalCpuElement,
  ThermalGpuElement,
} from "./prefs/models.js";
import { getThermalCpuSensorDescriptors } from "./services/runtime.js";

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

const GPU_STATUS = "gpustatus";
const GPU_WIDTH = "gpuwidth";
const GPU_COLORS = "gpucolors";
const GPU_MEMORY_COLORS = "gpumemorycolors";
const GPU_MEMORY_UNIT = "gpumemoryunit";
const GPU_MEMORY_UNIT_MEASURE = "gpumemoryunitmeasure";
const GPU_MEMORY_MONITOR = "gpumemorymonitor";
const GPU_DISPLAY_DEVICE_NAME = "gpudisplaydevicename";
const GPU_DEVICES_LIST = "gpudeviceslist";

const ResourceMonitorPrefsWidget = GObject.registerClass(
  class ResourceMonitorPrefsWidget extends GObject.Object {
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

    _takeWidget(widget) {
      const parent = widget?.get_parent?.();
      if (!parent) {
        return widget;
      }

      if (typeof parent.remove === "function") {
        parent.remove(widget);
      } else if (typeof parent.set_child === "function") {
        parent.set_child(null);
      }

      return widget;
    }

    _createActionRow(title, subtitle, suffix) {
      const row = new Adw.ActionRow({
        title,
        subtitle,
      });

      row.add_suffix(this._takeWidget(suffix));
      if (row.set_activatable_widget) {
        row.set_activatable_widget(suffix);
      }

      return row;
    }

    _createSectionPage(title) {
      return new Adw.PreferencesPage({
        name: title.toLowerCase(),
        title,
      });
    }

    _createSettingsGroup(title, description = null) {
      return new Adw.PreferencesGroup({
        title,
        description,
      });
    }

    _createSwitch() {
      return new Gtk.Switch({
        valign: Gtk.Align.CENTER,
      });
    }

    _createSpinButton({ upper, lower = 0, step = 1, page = 10 }) {
      return new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower,
          upper,
          step_increment: step,
          page_increment: page,
        }),
        numeric: true,
        valign: Gtk.Align.CENTER,
      });
    }

    _createComboBox(items) {
      const widget = new Gtk.ComboBoxText({
        valign: Gtk.Align.CENTER,
      });

      for (const [id, label] of items) {
        widget.append(id, label);
      }

      return widget;
    }

    _createListBox() {
      return new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE,
        hexpand: true,
      });
    }

    _createColumnView() {
      return new Gtk.ColumnView({
        hexpand: true,
        vexpand: true,
        reorderable: false,
        show_column_separators: true,
      });
    }

    _createIconButton(iconName) {
      return new Gtk.Button({
        icon_name: iconName,
        valign: Gtk.Align.CENTER,
      });
    }

    _createEntry(inputPurpose = Gtk.InputPurpose.FREE_FORM) {
      return new Gtk.Entry({
        input_purpose: inputPurpose,
        hexpand: true,
      });
    }

    _createCheckButton(label, group = null) {
      return new Gtk.CheckButton({
        label,
        group,
        halign: Gtk.Align.START,
      });
    }

    _setWidgetsSensitive(widgets, sensitive) {
      for (const widget of widgets) {
        widget.sensitive = sensitive;
      }
    }

    _bindToggleSensitivity(toggle, widgets, callback = null) {
      toggle.connect("state-set", (button) => {
        this._setWidgetsSensitive(widgets, button.active);
        callback?.(button.active);
      });
    }

    _initializeToggleControlledSection(toggle, widgets) {
      this._bindToggleSensitivity(toggle, widgets);
      this._setWidgetsSensitive(widgets, toggle.active);
    }

    _initializeUsageMonitor({
      display,
      width,
      unit,
      unitMeasure,
      monitor,
      alert,
      threshold,
      statusKey,
      widthKey,
      unitKey,
      unitMeasureKey,
      monitorKey,
      alertKey,
      thresholdKey,
      colorsKey,
      colorsListbox,
      colorsAddButton,
    }) {
      connectSwitchButton(this._settings, statusKey, display);
      connectSpinButton(this._settings, widthKey, width);
      connectComboBox(this._settings, unitKey, unit);
      connectComboBox(this._settings, unitMeasureKey, unitMeasure);
      connectComboBox(this._settings, monitorKey, monitor);
      connectSwitchButton(this._settings, alertKey, alert);
      connectSpinButton(this._settings, thresholdKey, threshold);

      const controlledWidgets = [width, unit, unitMeasure, monitor, alert];
      this._bindToggleSensitivity(display, controlledWidgets, (active) => {
        threshold.sensitive = active && alert.active;
      });
      this._setWidgetsSensitive(controlledWidgets, display.active);

      this._bindToggleSensitivity(alert, [], (active) => {
        threshold.sensitive = display.active && active;
      });
      threshold.sensitive = display.active && alert.active;

      makeColors(
        this._settings,
        colorsKey,
        colorsListbox,
        colorsAddButton
      );
    }

    _appendEditableTextColumn(view, model, { title, getText, setText }) {
      const factory = new Gtk.SignalListItemFactory();
      factory.connect("setup", (factoryObject, listItem) => {
        listItem.set_child(new Gtk.Entry());
      });
      factory.connect("bind", (factoryObject, listItem) => {
        const item = listItem.get_item();
        const entry = listItem.get_child();
        entry.set_text(getText(item));

        replaceSignalHandler(
          entry,
          "_resourceMonitorChangedHandlerId",
          "changed",
          (widget) => {
            const [found, index] = model.find(item);
            if (!found) {
              return;
            }

            setText(item, widget.text);

            const normalized = getText(item);
            if (normalized !== widget.text) {
              widget.text = normalized;
            }

            model.splice(index, 1, [item]);
          }
        );
      });
      factory.connect("unbind", (factoryObject, listItem) => {
        const entry = listItem.get_child();
        if (entry?._resourceMonitorChangedHandlerId) {
          entry.disconnect(entry._resourceMonitorChangedHandlerId);
          entry._resourceMonitorChangedHandlerId = null;
        }
      });

      view.append_column(
        new Gtk.ColumnViewColumn({
          title,
          factory,
          resizable: true,
        })
      );
    }

    _appendToggleColumn(view, model, { title, getValue, setValue, sensitive }) {
      const factory = new Gtk.SignalListItemFactory();
      factory.connect("setup", (factoryObject, listItem) => {
        listItem.set_child(new Gtk.CheckButton({ halign: Gtk.Align.CENTER }));
      });
      factory.connect("bind", (factoryObject, listItem) => {
        const item = listItem.get_item();
        const toggle = listItem.get_child();
        toggle.set_active(getValue(item));
        toggle.sensitive = sensitive ? sensitive(item) : true;

        replaceSignalHandler(
          toggle,
          "_resourceMonitorToggleHandlerId",
          "toggled",
          (widget) => {
            const [found, index] = model.find(item);
            if (!found) {
              return;
            }

            setValue(item, widget.active);
            model.splice(index, 1, [item]);
          }
        );
      });
      factory.connect("unbind", (factoryObject, listItem) => {
        const toggle = listItem.get_child();
        if (toggle?._resourceMonitorToggleHandlerId) {
          toggle.disconnect(toggle._resourceMonitorToggleHandlerId);
          toggle._resourceMonitorToggleHandlerId = null;
        }
      });

      view.append_column(
        new Gtk.ColumnViewColumn({
          title,
          factory,
          resizable: true,
        })
      );
    }

    _prepareEmbeddedWidget(widget, cssClasses = []) {
      const embeddedWidget = this._takeWidget(widget);

      embeddedWidget.margin_top = 0;
      embeddedWidget.margin_bottom = 0;
      embeddedWidget.margin_start = 0;
      embeddedWidget.margin_end = 0;
      embeddedWidget.hexpand = true;

      for (const cssClass of cssClasses) {
        embeddedWidget.add_css_class(cssClass);
      }

      return embeddedWidget;
    }

    _wrapEmbeddedWidget(widget, cssClasses = []) {
      const container = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        hexpand: true,
        margin_top: 6,
        margin_bottom: 6,
        margin_start: 6,
        margin_end: 6,
      });
      container.add_css_class("embedded-widget");

      const embeddedWidget = this._prepareEmbeddedWidget(widget, cssClasses);
      container.append(embeddedWidget);

      return container;
    }

    _createColumnViewContainer(view, minHeight = 240) {
      const container = new Gtk.ScrolledWindow({
        hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
        vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
        min_content_height: minHeight,
        hexpand: true,
        vexpand: true,
        has_frame: true,
      });
      container.add_css_class("embedded-widget");
      container.set_child(
        this._prepareEmbeddedWidget(view, ["resource-monitor-column-view"])
      );

      return container;
    }

    _cleanupCssProvider() {
      if (!this._provider) {
        return;
      }

      const display = Gdk.Display.get_default();
      if (display) {
        Gtk.StyleContext.remove_provider_for_display(display, this._provider);
      }

      this._provider = null;
    }

    async _readMountEntries() {
      const mounts = await loadFile("/proc/self/mounts");
      const lines = new TextDecoder().decode(mounts).split("\n");
      const entries = [];
      const ignoredFs = new Set(["squashfs", "tmpfs"]);

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const parts = line.split(" ");
        if (parts.length < 3) {
          continue;
        }

        const device = parts[0];
        const mountPoint = parts[1]
          .replaceAll("\\040", " ")
          .replaceAll("\\011", "\t")
          .replaceAll("\\012", "\n")
          .replaceAll("\\134", "\\");
        const fsType = parts[2];

        if (ignoredFs.has(fsType) || !device.startsWith("/dev/")) {
          continue;
        }

        entries.push({
          filesystem: device,
          mountPoint,
        });
      }

      return entries;
    }

    async _readThermalCpuSensors() {
      const decoder = new TextDecoder();
      const allowedSensorNames = new Set(["coretemp", "k10temp", "zenpower"]);
      const descriptors = getThermalCpuSensorDescriptors();
      const sensors = [];

      for (const descriptor of descriptors) {
        const chipName = decoder.decode(await loadFile(descriptor.namePath)).trim();
        if (!allowedSensorNames.has(chipName)) {
          continue;
        }

        let label = descriptor.fallbackLabel;
        if (GLib.file_test(descriptor.labelPath, GLib.FileTest.EXISTS)) {
          try {
            label = decoder.decode(await loadFile(descriptor.labelPath)).trim();
          } catch (error) {
            label = descriptor.fallbackLabel;
          }
        }

        sensors.push({
          device: descriptor.inputPath,
          name: `${chipName}: ${label}`,
        });
      }

      return sensors;
    }

    _createListGroup(title, description, addButton, listbox) {
      const group = this._createSettingsGroup(title, description);

      const addRow = new Adw.ActionRow({
        title: _("Threshold Colors"),
        subtitle: _(
          "Rules are matched from the highest threshold downward. Values below the first threshold keep the lowest color."
        ),
      });
      addRow.add_suffix(this._takeWidget(addButton));
      if (addRow.set_activatable_widget) {
        addRow.set_activatable_widget(addButton);
      }

      group.add(addRow);
      group.add(
        this._wrapEmbeddedWidget(listbox, ["boxed-list", "resource-monitor-list"])
      );

      return group;
    }

    _buildNativeGlobalPage(title) {
      const page = this._createSectionPage(title);

      const generalGroup = this._createSettingsGroup(_("General"));
      generalGroup.add(
        this._createActionRow(
          _("Refresh Interval"),
          _("Controls how often resource values are updated."),
          this._secondsSpinbutton
        )
      );
      generalGroup.add(
        this._createActionRow(
          _("Panel Position"),
          _("Choose where the indicator appears in the top bar."),
          this._extensionPositionCombobox
        )
      );
      generalGroup.add(
        this._createActionRow(
          _("Open Preferences on Right Click"),
          _("Show the preferences window when the indicator is right-clicked."),
          this._extensionRightClickPrefs
        )
      );
      generalGroup.add(
        this._createActionRow(
          _("Show Decimal Digits"),
          _("Enable fractional digits in the panel values."),
          this._decimalsDisplay
        )
      );
      generalGroup.add(
        this._createActionRow(
          _("Show Icons"),
          _("Display symbolic icons next to monitored resources."),
          this._iconsDisplay
        )
      );
      generalGroup.add(
        this._createActionRow(
          _("Icon Position"),
          _("Choose whether icons appear before or after the values."),
          this._iconsPositionCombobox
        )
      );
      page.add(generalGroup);

      const launchGroup = new Adw.PreferencesGroup({
        title: _("Launch Action"),
        description: _("Choose what happens when the indicator is left-clicked."),
      });
      launchGroup.add(
        this._wrapEmbeddedWidget(this._extensionLeftClickRadioButtonSM.get_parent())
      );
      page.add(launchGroup);

      const orderingGroup = new Adw.PreferencesGroup({
        title: _("Items Order"),
        description: _("Reorder how resources appear in the panel."),
      });
      orderingGroup.add(
        this._wrapEmbeddedWidget(
          this._itemsPositionListbox,
          ["boxed-list", "resource-monitor-list"]
        )
      );
      page.add(orderingGroup);

      return page;
    }

    _buildNativeCpuPage(title) {
      const page = this._createSectionPage(title);

      const usageGroup = this._createSettingsGroup(
        _("Usage"),
        _("Configure the main CPU usage indicator shown in the panel.")
      );
      usageGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show CPU usage in the top bar."),
          this._cpuDisplay
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for the CPU value."),
          this._cpuWidthSpinbutton
        )
      );
      page.add(usageGroup);
      page.add(
        this._createListGroup(
          _("Usage Colors"),
          _("Manage threshold colors for CPU usage."),
          this._cpuColorsAddButton,
          this._cpuColorsListbox
        )
      );

      const frequencyGroup = this._createSettingsGroup(
        _("Frequency"),
        _("Control how CPU frequency is displayed.")
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show the current CPU frequency in the panel."),
          this._cpuFrequencyDisplay
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for the frequency value."),
          this._cpuFrequencyWidthSpinbutton
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how CPU frequency is formatted."),
          this._cpuFrequencyUnitMeasureCombobox
        )
      );
      page.add(frequencyGroup);
      page.add(
        this._createListGroup(
          _("Frequency Colors"),
          _("Manage threshold colors for CPU frequency."),
          this._cpuFrequencyColorsAddButton,
          this._cpuFrequencyColorsListbox
        )
      );

      const loadAverageGroup = this._createSettingsGroup(
        _("Load Average"),
        _("Control how system load average is shown.")
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show the load average in the panel."),
          this._cpuLoadAverageDisplay
        )
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for the load average value."),
          this._cpuLoadAverageWidthSpinbutton
        )
      );
      page.add(loadAverageGroup);
      page.add(
        this._createListGroup(
          _("Load Average Colors"),
          _("Manage threshold colors for load average."),
          this._cpuLoadAverageColorsAddButton,
          this._cpuLoadAverageColorsListbox
        )
      );

      return page;
    }

    _buildNativeRamPage(title) {
      const page = this._createSectionPage(title);

      const monitorGroup = this._createSettingsGroup(
        _("Memory"),
        _("Configure how RAM usage is presented in the panel.")
      );
      monitorGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show RAM usage in the top bar."),
          this._ramDisplay
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for the RAM value."),
          this._ramWidthSpinbutton
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether to show percentages or numeric values."),
          this._ramUnitCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how numeric RAM values are formatted."),
          this._ramUnitMeasureCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Monitor"),
          _("Choose whether the indicator tracks used or free memory."),
          this._ramMonitorCombobox
        )
      );
      page.add(monitorGroup);
      page.add(
        this._createListGroup(
          _("Memory Colors"),
          _("Manage threshold colors for RAM usage."),
          this._ramColorsAddButton,
          this._ramColorsListbox
        )
      );

      const alertGroup = this._createSettingsGroup(
        _("Alert"),
        _("Configure the low-memory warning threshold.")
      );
      alertGroup.add(
        this._createActionRow(
          _("Enable Alert"),
          _("Notify when available memory drops below the configured limit."),
          this._ramAlert
        )
      );
      alertGroup.add(
        this._createActionRow(
          _("Threshold"),
          _("Trigger the alert when free memory is lower than this percentage."),
          this._ramAlertThresholdSpinbutton
        )
      );
      page.add(alertGroup);

      return page;
    }

    _buildNativeSwapPage(title) {
      const page = this._createSectionPage(title);

      const monitorGroup = this._createSettingsGroup(
        _("Swap"),
        _("Configure how swap usage is presented in the panel.")
      );
      monitorGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show swap usage in the top bar."),
          this._swapDisplay
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for the swap value."),
          this._swapWidthSpinbutton
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether to show percentages or numeric values."),
          this._swapUnitCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how numeric swap values are formatted."),
          this._swapUnitMeasureCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Monitor"),
          _("Choose whether the indicator tracks used or free swap."),
          this._swapMonitorCombobox
        )
      );
      page.add(monitorGroup);
      page.add(
        this._createListGroup(
          _("Swap Colors"),
          _("Manage threshold colors for swap usage."),
          this._swapColorsAddButton,
          this._swapColorsListbox
        )
      );

      const alertGroup = this._createSettingsGroup(
        _("Alert"),
        _("Configure the low-swap warning threshold.")
      );
      alertGroup.add(
        this._createActionRow(
          _("Enable Alert"),
          _("Notify when available swap drops below the configured limit."),
          this._swapAlert
        )
      );
      alertGroup.add(
        this._createActionRow(
          _("Threshold"),
          _("Trigger the alert when free swap is lower than this percentage."),
          this._swapAlertThresholdSpinbutton
        )
      );
      page.add(alertGroup);

      return page;
    }

    _buildNativeNetPage(title) {
      const page = this._createSectionPage(title);

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared network display settings.")
      );
      commonGroup.add(
        this._createActionRow(
          _("Auto Hide"),
          _("Hide network indicators when there is no traffic."),
          this._netAutoHide
        )
      );
      commonGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether throughput is displayed in bytes or bits."),
          this._netUnitCombobox
        )
      );
      commonGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how network throughput values are formatted."),
          this._netUnitMeasureCombobox
        )
      );
      page.add(commonGroup);

      const ethernetGroup = this._createSettingsGroup(
        _("Ethernet"),
        _("Configure the wired network indicator.")
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show Ethernet traffic in the panel."),
          this._netEthDisplay
        )
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for Ethernet throughput."),
          this._netEthWidthSpinbutton
        )
      );
      page.add(ethernetGroup);
      page.add(
        this._createListGroup(
          _("Ethernet Colors"),
          _("Manage threshold colors for Ethernet throughput."),
          this._netEthColorsAddButton,
          this._netEthColorsListbox
        )
      );

      const wirelessGroup = this._createSettingsGroup(
        _("Wireless"),
        _("Configure the Wi-Fi network indicator.")
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show Wi-Fi traffic in the panel."),
          this._netWlanDisplay
        )
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for Wi-Fi throughput."),
          this._netWlanWidthSpinbutton
        )
      );
      page.add(wirelessGroup);
      page.add(
        this._createListGroup(
          _("Wireless Colors"),
          _("Manage threshold colors for Wi-Fi throughput."),
          this._netWlanColorsAddButton,
          this._netWlanColorsListbox
        )
      );

      return page;
    }

    _buildNativeDiskPage(title) {
      const page = this._createSectionPage(title);

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared disk indicator settings.")
      );
      commonGroup.add(
        this._createActionRow(
          _("Show Device Name"),
          _("Display the configured disk label in the panel."),
          this._diskShowDeviceName
        )
      );
      page.add(commonGroup);

      const statsGroup = this._createSettingsGroup(
        _("Statistics"),
        _("Configure disk activity indicators.")
      );
      statsGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show disk activity statistics in the top bar."),
          this._diskStatsDisplay
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for disk activity values."),
          this._diskStatsWidthSpinbutton
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Mode"),
          _("Choose whether disk activity is displayed as a single or multiple values."),
          this._diskStatsModeCombobox
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how disk activity values are formatted."),
          this._diskStatsUnitMeasureCombobox
        )
      );
      page.add(statsGroup);
      page.add(
        this._createListGroup(
          _("Statistics Colors"),
          _("Manage threshold colors for disk activity."),
          this._diskStatsColorsAddButton,
          this._diskStatsColorsListbox
        )
      );

      const spaceGroup = this._createSettingsGroup(
        _("Space"),
        _("Configure disk space indicators.")
      );
      spaceGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show disk space usage in the top bar."),
          this._diskSpaceDisplay
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for disk space values."),
          this._diskSpaceWidthSpinbutton
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether to show percentages or numeric values."),
          this._diskSpaceUnitCombobox
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how numeric disk space values are formatted."),
          this._diskSpaceUnitMeasureCombobox
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Monitor"),
          _("Choose whether the indicator tracks used or free space."),
          this._diskSpaceMonitorCombobox
        )
      );
      page.add(spaceGroup);
      page.add(
        this._createListGroup(
          _("Space Colors"),
          _("Manage threshold colors for disk space usage."),
          this._diskSpaceColorsAddButton,
          this._diskSpaceColorsListbox
        )
      );

      const devicesGroup = this._createSettingsGroup(
        _("Devices"),
        _("Choose which disks participate in the panel indicators.")
      );
      devicesGroup.add(
        this._createActionRow(
          _("Display All Devices"),
          _("Include every detected device in the statistics list."),
          this._diskDevicesDisplayAll
        )
      );
      devicesGroup.add(this._createColumnViewContainer(this._diskDevicesColumnView));
      page.add(devicesGroup);

      return page;
    }

    _buildNativeThermalPage(title) {
      const page = this._createSectionPage(title);

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared temperature display settings.")
      );
      commonGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether temperatures are displayed in Celsius or Fahrenheit."),
          this._thermalUnitCombobox
        )
      );
      page.add(commonGroup);

      const cpuGroup = this._createSettingsGroup(
        _("CPU Temperature"),
        _("Configure the CPU temperature indicator.")
      );
      cpuGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show CPU temperature in the top bar."),
          this._thermalCpuDisplay
        )
      );
      cpuGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for CPU temperature values."),
          this._thermalCpuWidthSpinbutton
        )
      );
      page.add(cpuGroup);
      page.add(
        this._createListGroup(
          _("CPU Temperature Colors"),
          _("Manage threshold colors for CPU temperature."),
          this._thermalCpuColorsAddButton,
          this._thermalCpuColorsListbox
        )
      );

      const cpuDevicesGroup = this._createSettingsGroup(
        _("CPU Sensors"),
        _("Choose which CPU thermal sensors are monitored.")
      );
      cpuDevicesGroup.add(
        this._createColumnViewContainer(this._thermalCpuDevicesColumnView)
      );
      page.add(cpuDevicesGroup);

      const gpuGroup = this._createSettingsGroup(
        _("GPU Temperature"),
        _("Configure the GPU temperature indicator.")
      );
      gpuGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show GPU temperature in the top bar."),
          this._thermalGpuDisplay
        )
      );
      gpuGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for GPU temperature values."),
          this._thermalGpuWidthSpinbutton
        )
      );
      page.add(gpuGroup);
      page.add(
        this._createListGroup(
          _("GPU Temperature Colors"),
          _("Manage threshold colors for GPU temperature."),
          this._thermalGpuColorsAddButton,
          this._thermalGpuColorsListbox
        )
      );

      const gpuDevicesGroup = this._createSettingsGroup(
        _("GPU Sensors"),
        _("Choose which GPU thermal sensors are monitored.")
      );
      gpuDevicesGroup.add(
        this._createColumnViewContainer(this._thermalGpuDevicesColumnView)
      );
      page.add(gpuDevicesGroup);

      return page;
    }

    _buildNativeGpuPage(title) {
      const page = this._createSectionPage(title);

      const usageGroup = this._createSettingsGroup(
        _("Usage"),
        _("Configure the GPU usage indicator.")
      );
      usageGroup.add(
        this._createActionRow(
          _("Display"),
          _("Show GPU usage in the top bar."),
          this._gpuDisplay
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Width"),
          _("Reserve a fixed amount of space for GPU usage values."),
          this._gpuWidthSpinbutton
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Display Device Name"),
          _("Show the selected GPU name alongside panel values."),
          this._gpuDisplayDeviceName
        )
      );
      page.add(usageGroup);
      page.add(
        this._createListGroup(
          _("Usage Colors"),
          _("Manage threshold colors for GPU usage."),
          this._gpuColorsAddButton,
          this._gpuColorsListbox
        )
      );

      const memoryGroup = this._createSettingsGroup(
        _("Memory"),
        _("Configure the GPU memory indicator.")
      );
      memoryGroup.add(
        this._createActionRow(
          _("Unit"),
          _("Choose whether to show percentages or numeric values."),
          this._gpuMemoryUnitCombobox
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Unit of Measure"),
          _("Choose how numeric GPU memory values are formatted."),
          this._gpuMemoryUnitMeasureCombobox
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Monitor"),
          _("Choose whether the indicator tracks used or free GPU memory."),
          this._gpuMemoryMonitorCombobox
        )
      );
      page.add(memoryGroup);
      page.add(
        this._createListGroup(
          _("Memory Colors"),
          _("Manage threshold colors for GPU memory."),
          this._gpuMemoryColorsAddButton,
          this._gpuMemoryColorsListbox
        )
      );

      const devicesGroup = this._createSettingsGroup(
        _("Devices"),
        _("Choose which GPUs contribute usage and memory indicators.")
      );
      devicesGroup.add(this._createColumnViewContainer(this._gpuDevicesColumnView));
      page.add(devicesGroup);

      return page;
    }

    fillPreferencesWindow(window) {
      window.set_default_size(980, 760);

      if (window.set_title) {
        window.set_title(this._metadata?.name ?? _("Resource Monitor"));
      }

      if (window.set_search_enabled) {
        window.set_search_enabled(true);
      }

      window.connect("close-request", () => {
        this._cleanupCssProvider();
        return false;
      });

      window.add(this._buildNativeGlobalPage("Global"));
      window.add(this._buildNativeCpuPage("Cpu"));
      window.add(this._buildNativeRamPage("Ram"));
      window.add(this._buildNativeSwapPage("Swap"));
      window.add(this._buildNativeDiskPage("Disk"));
      window.add(this._buildNativeNetPage("Net"));
      window.add(this._buildNativeThermalPage("Thermal"));
      window.add(this._buildNativeGpuPage("Gpu"));
    }

    _buildGlobal() {
      this._secondsSpinbutton = this._createSpinButton({
        upper: 10,
        step: 1,
        page: 1,
      });
      this._extensionPositionCombobox = this._createComboBox([
        ["left", _("Left")],
        ["center", _("Center")],
        ["right", _("Right")],
      ]);
      this._extensionLeftClickRadioButtonSM = this._createCheckButton(
        _("Launch GNOME System Monitor")
      );
      this._extensionLeftClickRadioButtonU = this._createCheckButton(
        _("Launch GNOME Usage"),
        this._extensionLeftClickRadioButtonSM
      );
      this._extensionLeftClickRadioButtonCustom = this._createCheckButton(
        _("Custom program"),
        this._extensionLeftClickRadioButtonSM
      );
      this._extensionLeftClickEntryCustom = this._createEntry(
        Gtk.InputPurpose.TERMINAL
      );
      this._extensionLeftClickBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
        hexpand: true,
      });
      this._extensionLeftClickBox.append(this._extensionLeftClickRadioButtonSM);
      this._extensionLeftClickBox.append(this._extensionLeftClickRadioButtonU);
      this._extensionLeftClickBox.append(
        this._extensionLeftClickRadioButtonCustom
      );
      this._extensionLeftClickBox.append(this._extensionLeftClickEntryCustom);
      this._extensionRightClickPrefs = this._createSwitch();
      this._decimalsDisplay = this._createSwitch();
      this._iconsDisplay = this._createSwitch();
      this._iconsPositionCombobox = this._createComboBox([
        ["left", _("Left")],
        ["right", _("Right")],
      ]);
      this._itemsPositionListbox = this._createListBox();
      this._itemsPositionListbox.add_css_class("boxed-list");

      connectSpinButton(
        this._settings,
        REFRESH_TIME,
        this._secondsSpinbutton
      );
      connectComboBox(
        this._settings,
        EXTENSION_POSITION,
        this._extensionPositionCombobox
      );
      connectSwitchButton(
        this._settings,
        RIGHT_CLICK_STATUS,
        this._extensionRightClickPrefs
      );
      connectSwitchButton(
        this._settings,
        DECIMALS_STATUS,
        this._decimalsDisplay
      );
      connectSwitchButton(
        this._settings,
        ICONS_STATUS,
        this._iconsDisplay
      );
      connectComboBox(
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
        this._settings.set_string(CUSTOM_LEFT_CLICK_STATUS, tBuffer.text);
        if (this._extensionLeftClickRadioButtonCustom.active) {
          this._settings.set_string(LEFT_CLICK_STATUS, tBuffer.text);
        }
      });

      // ListBox
      let itemsPositionArray = this._settings.get_strv(ITEMS_POSITION);

      for (let i = 0; i < itemsPositionArray.length; i++) {
        const element = itemsPositionArray[i];

        const row = new Gtk.ListBoxRow();
        const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

        const up = new Gtk.Button({
          icon_name: "go-up",
          tooltip_text: _("Move Up"),
        });
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
        const down = new Gtk.Button({
          icon_name: "go-down",
          tooltip_text: _("Move Down"),
        });
        down.connect("clicked", (button) => {
          const index = row.get_index();
          if (index < itemsPositionArray.length - 1) {
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
      this._cpuDisplay = this._createSwitch();
      this._cpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._cpuColorsAddButton = this._createIconButton("list-add");
      this._cpuColorsListbox = this._createListBox();
      this._cpuFrequencyDisplay = this._createSwitch();
      this._cpuFrequencyWidthSpinbutton = this._createSpinButton({
        upper: 500,
      });
      this._cpuFrequencyColorsAddButton = this._createIconButton("list-add");
      this._cpuFrequencyColorsListbox = this._createListBox();
      this._cpuFrequencyUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("KHz")],
        ["m", _("MHz")],
        ["g", _("GHz")],
      ]);
      this._cpuLoadAverageDisplay = this._createSwitch();
      this._cpuLoadAverageWidthSpinbutton = this._createSpinButton({
        upper: 500,
      });
      this._cpuLoadAverageColorsAddButton = this._createIconButton("list-add");
      this._cpuLoadAverageColorsListbox = this._createListBox();

      connectSwitchButton(this._settings, CPU_STATUS, this._cpuDisplay);
      connectSpinButton(
        this._settings,
        CPU_WIDTH,
        this._cpuWidthSpinbutton
      );
      connectSwitchButton(
        this._settings,
        CPU_FREQUENCY_STATUS,
        this._cpuFrequencyDisplay
      );
      connectSpinButton(
        this._settings,
        CPU_FREQUENCY_WIDTH,
        this._cpuFrequencyWidthSpinbutton
      );
      connectComboBox(
        this._settings,
        CPU_FREQUENCY_UNIT_MEASURE,
        this._cpuFrequencyUnitMeasureCombobox
      );
      connectSwitchButton(
        this._settings,
        CPU_LOADAVERAGE_STATUS,
        this._cpuLoadAverageDisplay
      );
      connectSpinButton(
        this._settings,
        CPU_LOADAVERAGE_WIDTH,
        this._cpuLoadAverageWidthSpinbutton
      );

      this._initializeToggleControlledSection(this._cpuDisplay, [
        this._cpuWidthSpinbutton,
      ]);
      this._initializeToggleControlledSection(this._cpuFrequencyDisplay, [
        this._cpuFrequencyWidthSpinbutton,
        this._cpuFrequencyUnitMeasureCombobox,
      ]);
      this._initializeToggleControlledSection(this._cpuLoadAverageDisplay, [
        this._cpuLoadAverageWidthSpinbutton,
      ]);

      // Cpu Colors
      makeColors(
        this._settings,
        CPU_COLORS,
        this._cpuColorsListbox,
        this._cpuColorsAddButton
      );

      // Frequency Colors
      makeColors(
        this._settings,
        CPU_FREQUENCY_COLORS,
        this._cpuFrequencyColorsListbox,
        this._cpuFrequencyColorsAddButton
      );

      // Load Average Colors
      makeColors(
        this._settings,
        CPU_LOADAVERAGE_COLORS,
        this._cpuLoadAverageColorsListbox,
        this._cpuLoadAverageColorsAddButton
      );
    }

    _buildRam() {
      this._ramDisplay = this._createSwitch();
      this._ramWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._ramColorsAddButton = this._createIconButton("list-add");
      this._ramColorsListbox = this._createListBox();
      this._ramUnitCombobox = this._createComboBox([
        ["numeric", _("Numeric")],
        ["perc", "%"],
      ]);
      this._ramUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._ramMonitorCombobox = this._createComboBox([
        ["used", _("Used Memory")],
        ["free", _("Free Memory")],
      ]);
      this._ramAlert = this._createSwitch();
      this._ramAlertThresholdSpinbutton = this._createSpinButton({
        upper: 100,
      });

      this._initializeUsageMonitor({
        display: this._ramDisplay,
        width: this._ramWidthSpinbutton,
        unit: this._ramUnitCombobox,
        unitMeasure: this._ramUnitMeasureCombobox,
        monitor: this._ramMonitorCombobox,
        alert: this._ramAlert,
        threshold: this._ramAlertThresholdSpinbutton,
        statusKey: RAM_STATUS,
        widthKey: RAM_WIDTH,
        unitKey: RAM_UNIT,
        unitMeasureKey: RAM_UNIT_MEASURE,
        monitorKey: RAM_MONITOR,
        alertKey: RAM_ALERT,
        thresholdKey: RAM_ALERT_THRESHOLD,
        colorsKey: RAM_COLORS,
        colorsListbox: this._ramColorsListbox,
        colorsAddButton: this._ramColorsAddButton,
      });
    }

    _buildSwap() {
      this._swapDisplay = this._createSwitch();
      this._swapWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._swapColorsAddButton = this._createIconButton("list-add");
      this._swapColorsListbox = this._createListBox();
      this._swapUnitCombobox = this._createComboBox([
        ["numeric", _("Numeric")],
        ["perc", "%"],
      ]);
      this._swapUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._swapMonitorCombobox = this._createComboBox([
        ["used", _("Used Memory")],
        ["free", _("Free Memory")],
      ]);
      this._swapAlert = this._createSwitch();
      this._swapAlertThresholdSpinbutton = this._createSpinButton({
        upper: 100,
      });

      this._initializeUsageMonitor({
        display: this._swapDisplay,
        width: this._swapWidthSpinbutton,
        unit: this._swapUnitCombobox,
        unitMeasure: this._swapUnitMeasureCombobox,
        monitor: this._swapMonitorCombobox,
        alert: this._swapAlert,
        threshold: this._swapAlertThresholdSpinbutton,
        statusKey: SWAP_STATUS,
        widthKey: SWAP_WIDTH,
        unitKey: SWAP_UNIT,
        unitMeasureKey: SWAP_UNIT_MEASURE,
        monitorKey: SWAP_MONITOR,
        alertKey: SWAP_ALERT,
        thresholdKey: SWAP_ALERT_THRESHOLD,
        colorsKey: SWAP_COLORS,
        colorsListbox: this._swapColorsListbox,
        colorsAddButton: this._swapColorsAddButton,
      });
    }

    _buildDisk() {
      this._diskShowDeviceName = this._createSwitch();
      this._diskStatsDisplay = this._createSwitch();
      this._diskStatsWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._diskStatsColorsAddButton = this._createIconButton("list-add");
      this._diskStatsColorsListbox = this._createListBox();
      this._diskStatsModeCombobox = this._createComboBox([
        ["single", _("Single Mode")],
        ["multiple", _("Multiple Mode")],
      ]);
      this._diskStatsUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._diskSpaceDisplay = this._createSwitch();
      this._diskSpaceWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._diskSpaceColorsAddButton = this._createIconButton("list-add");
      this._diskSpaceColorsListbox = this._createListBox();
      this._diskSpaceUnitCombobox = this._createComboBox([
        ["numeric", _("Numeric")],
        ["perc", "%"],
      ]);
      this._diskSpaceUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._diskSpaceMonitorCombobox = this._createComboBox([
        ["used", _("Used Space")],
        ["free", _("Free Space")],
      ]);
      this._diskDevicesDisplayAll = this._createSwitch();
      this._diskDevicesColumnView = this._createColumnView();

      connectSwitchButton(
        this._settings,
        DISK_SHOW_DEVICE_NAME,
        this._diskShowDeviceName
      );
      connectSwitchButton(
        this._settings,
        DISK_STATS_STATUS,
        this._diskStatsDisplay
      );
      connectSpinButton(
        this._settings,
        DISK_STATS_WIDTH,
        this._diskStatsWidthSpinbutton
      );
      connectComboBox(
        this._settings,
        DISK_STATS_MODE,
        this._diskStatsModeCombobox
      );
      connectComboBox(
        this._settings,
        DISK_STATS_UNIT_MEASURE,
        this._diskStatsUnitMeasureCombobox
      );
      connectSwitchButton(
        this._settings,
        DISK_SPACE_STATUS,
        this._diskSpaceDisplay
      );
      connectSpinButton(
        this._settings,
        DISK_SPACE_WIDTH,
        this._diskSpaceWidthSpinbutton
      );
      connectComboBox(
        this._settings,
        DISK_SPACE_UNIT,
        this._diskSpaceUnitCombobox
      );
      connectComboBox(
        this._settings,
        DISK_SPACE_UNIT_MEASURE,
        this._diskSpaceUnitMeasureCombobox
      );
      connectComboBox(
        this._settings,
        DISK_SPACE_MONITOR,
        this._diskSpaceMonitorCombobox
      );
      connectSwitchButton(
        this._settings,
        DISK_DEVICES_DISPLAY_ALL,
        this._diskDevicesDisplayAll
      );

      this._initializeToggleControlledSection(this._diskStatsDisplay, [
        this._diskStatsWidthSpinbutton,
        this._diskStatsModeCombobox,
        this._diskStatsUnitMeasureCombobox,
      ]);
      this._initializeToggleControlledSection(this._diskSpaceDisplay, [
        this._diskSpaceWidthSpinbutton,
        this._diskSpaceUnitCombobox,
        this._diskSpaceMonitorCombobox,
        this._diskSpaceUnitMeasureCombobox,
      ]);

      // ColumnView
      this._diskDevicesModel = new Gio.ListStore({
        item_type: DiskElement,
      });
      const selection = new Gtk.NoSelection({
        model: this._diskDevicesModel,
      });
      this._diskDevicesColumnView.set_model(selection);

      // Display Name Column
      this._appendEditableTextColumn(this._diskDevicesColumnView, this._diskDevicesModel, {
        title: _("Display Name"),
        getText: (item) => item.displayName,
        setText: (item, text) => item.setDisplayName(text),
      });

      // Device Column
      const deviceFactory = createLabelFactory((item) => item.device);

      const deviceCol = new Gtk.ColumnViewColumn({
        title: _("Device"),
        factory: deviceFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(deviceCol);

      // Mount Point Column
      const mountPointFactory = createLabelFactory(
        (item) => item.mountPoint
      );

      const mountPointCol = new Gtk.ColumnViewColumn({
        title: _("Mount Point"),
        factory: mountPointFactory,
        resizable: true,
      });
      this._diskDevicesColumnView.append_column(mountPointCol);

      // Stats Column
      this._appendToggleColumn(this._diskDevicesColumnView, this._diskDevicesModel, {
        title: _("Stats"),
        getValue: (item) => item.stats,
        setValue: (item, value) => {
          item.stats = value;
        },
      });

      // Space Column
      this._appendToggleColumn(this._diskDevicesColumnView, this._diskDevicesModel, {
        title: _("Space"),
        getValue: (item) => item.space,
        setValue: (item, value) => {
          item.space = value;
        },
        sensitive: (item) => item.mountPoint !== "",
      });

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
        () => {
          saveArrayToSettings(
            this._diskDevicesModel,
            this._settings,
            DISK_DEVICES_LIST
          );
        }
      );

      // Stats Colors
      makeColors(
        this._settings,
        DISK_STATS_COLORS,
        this._diskStatsColorsListbox,
        this._diskStatsColorsAddButton
      );

      // Space Colors
      makeColors(
        this._settings,
        DISK_SPACE_COLORS,
        this._diskSpaceColorsListbox,
        this._diskSpaceColorsAddButton
      );
    }

    _readDiskDevices(settings, model, loadAll) {
      model.remove_all();

      const disksArray = parseSettingsArray(
        settings,
        DISK_DEVICES_LIST,
        parseDiskEntry
      );

      this._readMountEntries()
        .then((entries) => {
          for (const { filesystem, mountPoint } of entries) {

            let statsButton = false;
            let spaceButton = false;
            let displayName = filesystem;

            for (const diskConfig of disksArray) {
              if (
                filesystem === diskConfig.device &&
                mountPoint === diskConfig.mountPoint
              ) {
                statsButton = diskConfig.stats;
                spaceButton = diskConfig.space;
                displayName = diskConfig.displayName;
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
            loadFile("/proc/diskstats")
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
                    let statsButton = false;
                    let spaceButton = false;
                    let displayName = devicePath;

                    for (const diskConfig of disksArray) {
                      if (
                        devicePath === diskConfig.device &&
                        diskConfig.mountPoint === ""
                      ) {
                        statsButton = diskConfig.stats;
                        spaceButton = diskConfig.space;
                        displayName = diskConfig.displayName;
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
                saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
              })
              .catch((err) =>
                console.error(
                  "[Resource_Monitor] Error loading /proc/diskstats:",
                  err
                )
              );
          } else {
            // Save updated disksArray to settings
            saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
          }
        })
        .catch((err) =>
          console.error("[Resource_Monitor] Error reading mounted disks:", err)
        );
    }

    _buildNet() {
      this._netAutoHide = this._createSwitch();
      this._netUnitCombobox = this._createComboBox([
        ["bytes", _("Bps")],
        ["bits", _("bps")],
      ]);
      this._netUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["b", _("Byte/Bit")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._netEthDisplay = this._createSwitch();
      this._netEthWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._netEthColorsAddButton = this._createIconButton("list-add");
      this._netEthColorsListbox = this._createListBox();
      this._netWlanDisplay = this._createSwitch();
      this._netWlanWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._netWlanColorsAddButton = this._createIconButton("list-add");
      this._netWlanColorsListbox = this._createListBox();

      connectSwitchButton(
        this._settings,
        NET_AUTO_HIDE_STATUS,
        this._netAutoHide
      );
      connectComboBox(this._settings, NET_UNIT, this._netUnitCombobox);
      connectComboBox(
        this._settings,
        NET_UNIT_MEASURE,
        this._netUnitMeasureCombobox
      );
      connectSwitchButton(
        this._settings,
        NET_ETH_STATUS,
        this._netEthDisplay
      );
      connectSpinButton(
        this._settings,
        NET_ETH_WIDTH,
        this._netEthWidthSpinbutton
      );
      connectSwitchButton(
        this._settings,
        NET_WLAN_STATUS,
        this._netWlanDisplay
      );
      connectSpinButton(
        this._settings,
        NET_WLAN_WIDTH,
        this._netWlanWidthSpinbutton
      );

      this._initializeToggleControlledSection(this._netEthDisplay, [
        this._netEthWidthSpinbutton,
      ]);
      this._initializeToggleControlledSection(this._netWlanDisplay, [
        this._netWlanWidthSpinbutton,
      ]);

      // Eth Colors
      makeColors(
        this._settings,
        NET_ETH_COLORS,
        this._netEthColorsListbox,
        this._netEthColorsAddButton
      );

      // Wlan Colors
      makeColors(
        this._settings,
        NET_WLAN_COLORS,
        this._netWlanColorsListbox,
        this._netWlanColorsAddButton
      );
    }

    _buildThermal() {
      this._thermalUnitCombobox = this._createComboBox([
        ["c", _("°C")],
        ["f", _("°F")],
      ]);
      this._thermalCpuDisplay = this._createSwitch();
      this._thermalCpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._thermalCpuColorsAddButton = this._createIconButton("list-add");
      this._thermalCpuColorsListbox = this._createListBox();
      this._thermalCpuDevicesColumnView = this._createColumnView();
      this._thermalGpuDisplay = this._createSwitch();
      this._thermalGpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._thermalGpuColorsAddButton = this._createIconButton("list-add");
      this._thermalGpuColorsListbox = this._createListBox();
      this._thermalGpuDevicesColumnView = this._createColumnView();

      connectComboBox(
        this._settings,
        THERMAL_TEMPERATURE_UNIT,
        this._thermalUnitCombobox
      );
      connectSwitchButton(
        this._settings,
        THERMAL_CPU_TEMPERATURE_STATUS,
        this._thermalCpuDisplay
      );
      connectSpinButton(
        this._settings,
        THERMAL_CPU_TEMPERATURE_WIDTH,
        this._thermalCpuWidthSpinbutton
      );
      connectSwitchButton(
        this._settings,
        THERMAL_GPU_TEMPERATURE_STATUS,
        this._thermalGpuDisplay
      );
      connectSpinButton(
        this._settings,
        THERMAL_GPU_TEMPERATURE_WIDTH,
        this._thermalGpuWidthSpinbutton
      );

      this._initializeToggleControlledSection(this._thermalCpuDisplay, [
        this._thermalCpuWidthSpinbutton,
      ]);
      this._initializeToggleControlledSection(this._thermalGpuDisplay, [
        this._thermalGpuWidthSpinbutton,
      ]);

      // CPU
      // ColumnView
      this._thermalCpuDevicesModel = makeThermalColumnView(
        this._thermalCpuDevicesColumnView,
        ThermalCpuElement
      );

      let cpuTempsArray = parseSettingsArray(
        this._settings,
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
        parseThermalCpuEntry
      );

      this._readThermalCpuSensors()
        .then((sensors) => {
          for (const sensor of sensors) {
            let statusButton = false;

            for (const tempConfig of cpuTempsArray) {
              if (sensor.name === tempConfig.name) {
                statusButton = tempConfig.monitor;
                break;
              }
            }

            this._thermalCpuDevicesModel.append(
              new ThermalCpuElement(sensor.device, sensor.name, statusButton)
            );
          }

          saveArrayToSettings(
            this._thermalCpuDevicesModel,
            this._settings,
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST
          );
        })
        .catch((error) =>
          console.error(
            "[Resource_Monitor] Error reading CPU thermal sensors:",
            error
          )
        );

      // Update
      this._thermalCpuDevicesModel.connect(
        "items-changed",
        () => {
          saveArrayToSettings(
            this._thermalCpuDevicesModel,
            this._settings,
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
          );
        }
      );

      // Colors
      makeColors(
        this._settings,
        THERMAL_CPU_COLORS,
        this._thermalCpuColorsListbox,
        this._thermalCpuColorsAddButton
      );

      // GPU
      // ColumnView
      this._thermalGpuDevicesModel = makeThermalColumnView(
        this._thermalGpuDevicesColumnView,
        ThermalGpuElement
      );

      let gpuTempsArray = parseSettingsArray(
        this._settings,
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
        parseThermalGpuEntry
      );

      // NVIDIA GPU detection
      executeCommand(["nvidia-smi", "-L"])
        .then((output) => {
          const lines = output.trim().split("\n");

          for (const line of lines) {
            if (!line) continue;

            const entry = line.trim().split(":");
            const device = entry[0].trim();
            const name = entry[1]?.trim().slice(0, -6); // Remove trailing "(UUID)"
            const uuid = entry[2]?.trim().slice(0, -1); // Remove trailing ")"

            let statusButton = false;

            for (const gpuConfig of gpuTempsArray) {
              if (uuid === gpuConfig.device) {
                statusButton = gpuConfig.monitor;
                break;
              }
            }

            // Append the GPU data to the thermal model
            this._thermalGpuDevicesModel.append(
              new ThermalGpuElement(uuid, name, statusButton)
            );
          }

          // Save updated GPU temperatures to settings
          saveArrayToSettings(
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
        () => {
          saveArrayToSettings(
            this._thermalGpuDevicesModel,
            this._settings,
            THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
          );
        }
      );

      // Colors
      makeColors(
        this._settings,
        THERMAL_GPU_COLORS,
        this._thermalGpuColorsListbox,
        this._thermalGpuColorsAddButton
      );
    }

    _buildGpu() {
      this._gpuDisplay = this._createSwitch();
      this._gpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._gpuColorsAddButton = this._createIconButton("list-add");
      this._gpuColorsListbox = this._createListBox();
      this._gpuMemoryColorsAddButton = this._createIconButton("list-add");
      this._gpuMemoryColorsListbox = this._createListBox();
      this._gpuMemoryUnitCombobox = this._createComboBox([
        ["numeric", _("Numeric")],
        ["perc", "%"],
      ]);
      this._gpuMemoryUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._gpuMemoryMonitorCombobox = this._createComboBox([
        ["used", _("Used Memory")],
        ["free", _("Free Memory")],
      ]);
      this._gpuDisplayDeviceName = this._createSwitch();
      this._gpuDevicesColumnView = this._createColumnView();

      connectSwitchButton(this._settings, GPU_STATUS, this._gpuDisplay);
      connectSpinButton(
        this._settings,
        GPU_WIDTH,
        this._gpuWidthSpinbutton
      );
      connectComboBox(
        this._settings,
        GPU_MEMORY_UNIT,
        this._gpuMemoryUnitCombobox
      );
      connectComboBox(
        this._settings,
        GPU_MEMORY_UNIT_MEASURE,
        this._gpuMemoryUnitMeasureCombobox
      );
      connectComboBox(
        this._settings,
        GPU_MEMORY_MONITOR,
        this._gpuMemoryMonitorCombobox
      );
      connectSwitchButton(
        this._settings,
        GPU_DISPLAY_DEVICE_NAME,
        this._gpuDisplayDeviceName
      );

      this._initializeToggleControlledSection(this._gpuDisplay, [
        this._gpuWidthSpinbutton,
        this._gpuMemoryUnitCombobox,
        this._gpuMemoryUnitMeasureCombobox,
        this._gpuMemoryMonitorCombobox,
        this._gpuDisplayDeviceName,
      ]);

      // ColumnView
      this._gpuDevicesModel = new Gio.ListStore({
        item_type: GpuElement,
      });
      const selection = new Gtk.NoSelection({
        model: this._gpuDevicesModel,
      });
      this._gpuDevicesColumnView.set_model(selection);

      // Display Name Column
      this._appendEditableTextColumn(this._gpuDevicesColumnView, this._gpuDevicesModel, {
        title: _("Display Name"),
        getText: (item) => item.displayName,
        setText: (item, text) => item.setDisplayName(text),
      });

      // Device Column
      const deviceFactory = createLabelFactory((item) => item.device);

      const deviceCol = new Gtk.ColumnViewColumn({
        title: _("Device"),
        factory: deviceFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(deviceCol);

      // Name Column
      const nameFactory = createLabelFactory((item) => item.name);

      const nameCol = new Gtk.ColumnViewColumn({
        title: _("Name"),
        factory: nameFactory,
        resizable: true,
      });
      this._gpuDevicesColumnView.append_column(nameCol);

      // Usage Column
      this._appendToggleColumn(this._gpuDevicesColumnView, this._gpuDevicesModel, {
        title: _("Usage Monitor"),
        getValue: (item) => item.usage,
        setValue: (item, value) => {
          item.usage = value;
        },
      });

      // Memory Column
      this._appendToggleColumn(this._gpuDevicesColumnView, this._gpuDevicesModel, {
        title: _("Memory Monitor"),
        getValue: (item) => item.memory,
        setValue: (item, value) => {
          item.memory = value;
        },
      });

      let gpuDevicesArray = parseSettingsArray(
        this._settings,
        GPU_DEVICES_LIST,
        parseGpuEntry
      );

      // NVIDIA GPU detection
      executeCommand(["nvidia-smi", "-L"])
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

            for (const gpuConfig of gpuDevicesArray) {
              if (uuid === gpuConfig.device) {
                usageButton = gpuConfig.usage;
                memoryButton = gpuConfig.memory;
                displayName = gpuConfig.displayName;
                break;
              }
            }

            // Append the GPU data to the model
            this._gpuDevicesModel.append(
              new GpuElement(displayName, uuid, name, usageButton, memoryButton)
            );
          }

          // Save updated GPU array to settings
          saveArrayToSettings(
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
        () => {
          saveArrayToSettings(
            this._gpuDevicesModel,
            this._settings,
            GPU_DEVICES_LIST
          );
        }
      );

      // Gpu Colors
      makeColors(
        this._settings,
        GPU_COLORS,
        this._gpuColorsListbox,
        this._gpuColorsAddButton
      );

      // Memory Colors
      makeColors(
        this._settings,
        GPU_MEMORY_COLORS,
        this._gpuMemoryColorsListbox,
        this._gpuMemoryColorsAddButton
      );
    }

  }
);

export default class ResourceMonitorExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const widget = new ResourceMonitorPrefsWidget({
      settings: this.getSettings(),
      dir: this.dir,
      metadata: this.metadata,
    });

    widget.fillPreferencesWindow(window);
  }
}
