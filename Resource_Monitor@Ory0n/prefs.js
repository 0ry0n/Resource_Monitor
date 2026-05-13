/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/*
 * Resource_Monitor is Copyright © 2018-2026 Giuseppe Silvestro
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
  INDICATOR_FORMATTING_SPECS,
  RENDER_MODE_PRECISE,
  RENDER_MODE_STEP,
} from "./indicatorFormatting.js";
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
import {
  getAmdGpuDescriptors,
  getDiskStableId,
  getMountedDiskEntries,
  getIntelGpuDescriptors,
  isSupportedCpuThermalChip,
  getThermalCpuSensorDescriptors,
} from "./services/runtime.js";

// Settings
const REFRESH_TIME = "refreshtime";
const EXTENSION_POSITION = "extensionposition";
const DISPLAY_MODE = "displaymode";
const DATA_SCALE_BASE = "datascalebase";
const LEFT_CLICK_STATUS = "leftclickstatus";
const RIGHT_CLICK_STATUS = "rightclickstatus";
const CUSTOM_LEFT_CLICK_STATUS = "customleftclickstatus";

const ICONS_STATUS = "iconsstatus";
const ICONS_POSITION = "iconsposition";
const SECONDARY_SEPARATOR_STYLE = "secondaryseparatorstyle";

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
const DISPLAY_MODE_PRIMARY = "primary";
const DISPLAY_MODE_ALL = "all";
const GNOME_SHELL_SCHEMA = "org.gnome.shell";
const ENABLED_EXTENSIONS_KEY = "enabled-extensions";
const DISABLE_USER_EXTENSIONS_KEY = "disable-user-extensions";
const DASH_TO_PANEL_UUID = "dash-to-panel@jderose9.github.com";

function parseNvidiaSmiListLine(line) {
  const match = line.match(/^(GPU \d+):\s+(.*)\s+\(UUID:\s+([^)]+)\)$/);
  if (!match) {
    return null;
  }

  const [, device, name, uuid] = match;
  return {
    device,
    name,
    uuid,
  };
}

const ResourceMonitorPrefsWidget = GObject.registerClass(
  class ResourceMonitorPrefsWidget extends GObject.Object {
    _init({ settings, dir, metadata }) {
      super._init();

      this._settings = settings;
      this._dir = dir;
      this._metadata = metadata;
      this._diskReadGeneration = 0;

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

    _createPageIntroGroup({ title, subtitle, iconName }) {
      const group = new Adw.PreferencesGroup();
      group.margin_start = 10;
      group.margin_end = 10;
      const row = new Adw.ActionRow({
        title,
        subtitle,
      });
      row.add_css_class("resource-monitor-page-intro");
      row.activatable = false;
      row.selectable = false;
      row.add_prefix(
        new Gtk.Image({
          icon_name: iconName,
          pixel_size: 28,
          valign: Gtk.Align.CENTER,
        })
      );
      group.add(row);
      return group;
    }

    _createEmbeddedExpanderSection({
      title,
      subtitle = null,
      child,
      expanded = false,
    }) {
      const expander = new Gtk.Expander({
        expanded,
        hexpand: true,
        halign: Gtk.Align.FILL,
      });
      expander.add_css_class("resource-monitor-expander");

      const heading = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 2,
        hexpand: true,
      });
      const titleLabel = new Gtk.Label({
        label: title,
        xalign: 0,
        hexpand: true,
      });
      titleLabel.add_css_class("resource-monitor-expander-title");
      heading.append(titleLabel);

      if (subtitle) {
        const subtitleLabel = new Gtk.Label({
          label: subtitle,
          xalign: 0,
          wrap: true,
          hexpand: true,
        });
        subtitleLabel.add_css_class("dim-label");
        heading.append(subtitleLabel);
      }

      child.hexpand = true;
      child.halign = Gtk.Align.FILL;
      expander.set_label_widget(heading);
      expander.set_child(child);

      return expander;
    }

    _createSectionPage({ name, title, iconName = null }) {
      const page = new Adw.PreferencesPage({
        name,
        title,
      });
      page.hexpand = true;
      page.halign = Gtk.Align.FILL;

      if (iconName) {
        page.icon_name = iconName;
      }

      return page;
    }

    _createSettingsGroup(title, description = null) {
      const group = new Adw.PreferencesGroup({
        title,
        description,
      });
      group.margin_start = 10;
      group.margin_end = 10;
      return group;
    }

    _createSwitch() {
      return new Gtk.Switch({
        valign: Gtk.Align.CENTER,
      });
    }

    _createSpinButton({ upper, lower = 0, step = 1, page = 10, digits = 0 }) {
      return new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
          lower,
          upper,
          step_increment: step,
          page_increment: page,
        }),
        digits,
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

    _getFrequencyScaleOptions() {
      return [
        ["auto", _("Auto")],
        ["k", _("kHz")],
        ["m", _("MHz")],
        ["g", _("GHz")],
      ];
    }

    _getNumericOrPercentOptions() {
      return [
        ["numeric", _("Numeric")],
        ["perc", "%"],
      ];
    }

    _getDataScaleOptions() {
      return [
        ["auto", _("Auto")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ];
    }

    _getDataScaleBaseOptions() {
      return [
        ["decimal", _("SI (1000)")],
        ["binary", _("IEC (1024)")],
      ];
    }

    _getRenderModeOptions() {
      return [
        [RENDER_MODE_PRECISE, _("Precise")],
        [RENDER_MODE_STEP, _("Step")],
      ];
    }

    _getSecondarySeparatorStyleOptions() {
      return [
        ["dot", _("Minimal Dot")],
        ["slash", _("Slash")],
        ["brackets", _("Square Brackets")],
      ];
    }

    _isDashToPanelEnabled() {
      try {
        const shellSettings = new Gio.Settings({
          schema_id: GNOME_SHELL_SCHEMA,
        });
        if (shellSettings.get_boolean(DISABLE_USER_EXTENSIONS_KEY)) {
          return false;
        }
        const enabledExtensions = shellSettings.get_strv(ENABLED_EXTENSIONS_KEY);
        return enabledExtensions.includes(DASH_TO_PANEL_UUID);
      } catch (error) {
        return false;
      }
    }

    _getDisplayModeOptions() {
      return [
        [DISPLAY_MODE_PRIMARY, _("Primary Display Only")],
        [
          DISPLAY_MODE_ALL,
          this._isDashToPanelEnabled()
            ? _("All Dash to Panel Panels")
            : _("All Dash to Panel Panels (Requires Dash to Panel)"),
        ],
      ];
    }

    _getDisplayModeDescription() {
      return this._isDashToPanelEnabled()
        ? _(
            "Show the indicator only on the primary panel or mirror it on every Dash to Panel panel."
          )
        : _(
            "Show the indicator on the primary panel. Multi-panel mode requires Dash to Panel."
          );
    }

    _getMemoryMonitorOptions() {
      return [
        ["used", _("Used Memory")],
        ["free", _("Free Memory")],
      ];
    }

    _getSpaceMonitorOptions() {
      return [
        ["used", _("Used Space")],
        ["free", _("Free Space")],
      ];
    }

    _getNetworkUnitOptions() {
      return [
        ["bytes", _("B/s")],
        ["bits", _("b/s")],
      ];
    }

    _getIndicatorFormattingSpec(indicatorId) {
      return INDICATOR_FORMATTING_SPECS.find((spec) => spec.id === indicatorId) ?? null;
    }

    _createIndicatorFormattingControls(
      indicatorId,
      {
        decimalsUpper = 3,
        stepUpper = 1000,
      } = {}
    ) {
      const spec = this._getIndicatorFormattingSpec(indicatorId);
      if (!spec) {
        throw new Error(`Unknown indicator formatting id: ${indicatorId}`);
      }

      const decimals = this._createSpinButton({
        upper: decimalsUpper,
        step: 1,
        page: 1,
      });
      const renderMode = this._createComboBox(this._getRenderModeOptions());
      const renderStep = this._createSpinButton({
        upper: stepUpper,
        lower: 1,
        step: 1,
        page: 1,
      });

      connectSpinButton(this._settings, spec.decimalsKey, decimals);
      connectComboBox(this._settings, spec.renderModeKey, renderMode);
      connectSpinButton(this._settings, spec.renderStepKey, renderStep);

      return {
        decimals,
        renderMode,
        renderStep,
      };
    }

    _initializeIndicatorFormattingControls({ display = null, controls }) {
      const syncSensitivity = () => {
        const displayActive = display ? display.active : true;

        controls.decimals.sensitive = displayActive;
        controls.renderMode.sensitive = displayActive;
        controls.renderStep.sensitive =
          displayActive &&
          controls.renderMode.get_active_id() === RENDER_MODE_STEP;
      };

      if (display) {
        display.connect("notify::active", syncSensitivity);
      }
      controls.renderMode.connect("changed", syncSensitivity);
      syncSensitivity();
    }

    _getCurrentDataScaleBaseLabel() {
      const base = this._settings.get_string(DATA_SCALE_BASE);
      return base === "binary" ? _("IEC (1024)") : _("SI (1000)");
    }

    _appendDataScaleBaseHint(text) {
      return `${text} ${_("Current unit base: %s.").format(
        this._getCurrentDataScaleBaseLabel()
      )}`;
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

    _createIconButton(iconName, tooltip = null) {
      const resolvedTooltip =
        tooltip ?? (iconName === "list-add" ? _("Add threshold") : null);

      return new Gtk.Button({
        icon_name: iconName,
        tooltip_text: resolvedTooltip,
        valign: Gtk.Align.CENTER,
      });
    }

    _createEntry(inputPurpose = Gtk.InputPurpose.FREE_FORM) {
      return new Gtk.Entry({
        input_purpose: inputPurpose,
        hexpand: true,
      });
    }

    _setWidgetsSensitive(widgets, sensitive) {
      for (const widget of widgets) {
        widget.sensitive = sensitive;
      }
    }

    _bindToggleSensitivity(toggle, widgets, callback = null) {
      toggle.connect("notify::active", (button) => {
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

      const column = new Gtk.ColumnViewColumn({
        title,
        factory,
        resizable: true,
      });
      this._setColumnExpand(column, true);
      view.append_column(column);
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

      const column = new Gtk.ColumnViewColumn({
        title,
        factory,
        resizable: true,
      });
      this._setColumnFixedWidth(column, 110);
      view.append_column(column);
    }

    _setColumnExpand(column, expand = true) {
      if (typeof column?.set_expand === "function") {
        column.set_expand(expand);
      } else if (column && "expand" in column) {
        column.expand = expand;
      }
    }

    _setColumnFixedWidth(column, width) {
      if (!Number.isFinite(width) || width <= 0 || !column) {
        return;
      }

      if (typeof column.set_fixed_width === "function") {
        column.set_fixed_width(width);
      } else if ("fixed_width" in column) {
        column.fixed_width = width;
      }
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

    _relaxPreferencesWindowClamps(window) {
      const stack = [window];

      while (stack.length > 0) {
        const widget = stack.pop();
        if (!widget) {
          continue;
        }

        if (widget instanceof Adw.Clamp) {
          widget.hexpand = true;
          widget.halign = Gtk.Align.FILL;

          if (typeof widget.set_maximum_size === "function") {
            widget.set_maximum_size(2400);
          } else if ("maximum_size" in widget) {
            widget.maximum_size = 2400;
          }

          if (typeof widget.set_tightening_threshold === "function") {
            widget.set_tightening_threshold(800);
          } else if ("tightening_threshold" in widget) {
            widget.tightening_threshold = 800;
          }
        }

        let child = widget.get_first_child?.() ?? null;
        while (child) {
          stack.push(child);
          child = child.get_next_sibling?.() ?? null;
        }
      }
    }

    _clearListBox(listbox) {
      for (
        let child = listbox.get_first_child();
        child !== null;
      ) {
        const next = child.get_next_sibling();
        listbox.remove(child);
        child = next;
      }
    }

    _appendInfoRow(listbox, title, subtitle) {
      const row = new Adw.ActionRow({
        title,
        subtitle,
      });
      listbox.append(row);
    }

    _formatBooleanLabel(value) {
      return value ? _("Yes") : _("No");
    }

    _getGpuBackendLabel(deviceId) {
      if (deviceId.startsWith("amd:")) {
        return _("AMD (sysfs)");
      }

      if (deviceId.startsWith("intel:")) {
        return _("Intel (sysfs)");
      }

      return _("NVIDIA (nvidia-smi)");
    }

    _refreshGpuDiagnostics() {
      if (!this._gpuDiagnosticsListbox) {
        return;
      }

      const hasNvidiaSmi = GLib.find_program_in_path("nvidia-smi") !== null;
      const hasAmdSysfs = getAmdGpuDescriptors().length > 0;
      const hasIntelSysfs = getIntelGpuDescriptors().length > 0;
      const backendList = [];

      if (hasNvidiaSmi) {
        backendList.push(_("NVIDIA (nvidia-smi)"));
      }
      if (hasAmdSysfs) {
        backendList.push(_("AMD (sysfs)"));
      }
      if (hasIntelSysfs) {
        backendList.push(_("Intel (sysfs)"));
      }

      const backendsText =
        backendList.length > 0 ? backendList.join(", ") : _("None");

      this._clearListBox(this._gpuDiagnosticsListbox);
      this._appendInfoRow(
        this._gpuDiagnosticsListbox,
        _("Detected Backends"),
        backendsText
      );
      this._appendInfoRow(
        this._gpuDiagnosticsListbox,
        _("Detected GPUs"),
        _("Scanning...")
      );

      this._readDetectedGpus()
        .then((detectedGpus) => {
          this._clearListBox(this._gpuDiagnosticsListbox);
          this._appendInfoRow(
            this._gpuDiagnosticsListbox,
            _("Detected Backends"),
            backendsText
          );
          this._appendInfoRow(
            this._gpuDiagnosticsListbox,
            _("Detected GPUs"),
            `${detectedGpus.length}`
          );

          if (detectedGpus.length === 0) {
            this._appendInfoRow(
              this._gpuDiagnosticsListbox,
              _("No Supported GPU Telemetry"),
              _(
                "No supported NVIDIA, AMD, or Intel GPU telemetry source was detected on this system."
              )
            );
            return;
          }

          detectedGpus.forEach((gpu) => {
            this._appendInfoRow(
              this._gpuDiagnosticsListbox,
              gpu.name,
              _(
                "Device: %s | Backend: %s | Usage: %s | Memory: %s | Thermal: %s"
              ).format(
                gpu.device,
                this._getGpuBackendLabel(gpu.device),
                this._formatBooleanLabel(gpu.hasUsage),
                this._formatBooleanLabel(gpu.hasMemory),
                this._formatBooleanLabel(gpu.hasThermal)
              )
            );
          });
        })
        .catch((error) => {
          console.error("[Resource_Monitor] Error reading GPU diagnostics:", error);
          this._clearListBox(this._gpuDiagnosticsListbox);
          this._appendInfoRow(
            this._gpuDiagnosticsListbox,
            _("GPU Diagnostics Error"),
            _("Could not read GPU diagnostics on this system.")
          );
        });
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
      return getMountedDiskEntries();
    }

    async _readThermalCpuSensors() {
      const decoder = new TextDecoder();
      const descriptors = getThermalCpuSensorDescriptors();
      const sensors = [];

      for (const descriptor of descriptors) {
        try {
          const chipName = decoder.decode(await loadFile(descriptor.namePath)).trim();
          if (!isSupportedCpuThermalChip(chipName)) {
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
        } catch (error) {
          continue;
        }
      }

      return sensors;
    }

    async _readDetectedNvidiaGpus() {
      if (GLib.find_program_in_path("nvidia-smi") === null) {
        return [];
      }

      try {
        const output = await executeCommand(["nvidia-smi", "-L"]);
        return output
          .trim()
          .split("\n")
          .map((line) => parseNvidiaSmiListLine(line.trim()))
          .filter(Boolean)
          .map(({ name, uuid }) => ({
            device: uuid,
            name,
            hasUsage: true,
            hasMemory: true,
            hasThermal: true,
          }));
      } catch (error) {
        console.error(
          "[Resource_Monitor] Error executing nvidia-smi command:",
          error
        );
        return [];
      }
    }

    _readDetectedAmdGpus() {
      return getAmdGpuDescriptors().map((descriptor) => ({
        device: descriptor.device,
        name: descriptor.name,
        hasUsage: Boolean(descriptor.usagePath),
        hasMemory: Boolean(descriptor.memoryTotalPath && descriptor.memoryUsedPath),
        hasThermal: Boolean(descriptor.temperaturePath),
      }));
    }

    _readDetectedIntelGpus() {
      return getIntelGpuDescriptors().map((descriptor) => ({
        device: descriptor.device,
        name: descriptor.name,
        hasUsage: Boolean(descriptor.usagePath),
        hasMemory: Boolean(descriptor.memoryTotalPath && descriptor.memoryUsedPath),
        hasThermal: Boolean(descriptor.temperaturePath),
      }));
    }

    async _readDetectedGpus() {
      const nvidia = await this._readDetectedNvidiaGpus();
      const amd = this._readDetectedAmdGpus();
      const intel = this._readDetectedIntelGpus();
      const deduped = new Map();

      [...nvidia, ...amd, ...intel].forEach((entry) => {
        const existing = deduped.get(entry.device);
        if (!existing) {
          deduped.set(entry.device, entry);
          return;
        }

        deduped.set(entry.device, {
          ...entry,
          hasUsage: existing.hasUsage || entry.hasUsage,
          hasMemory: existing.hasMemory || entry.hasMemory,
          hasThermal: existing.hasThermal || entry.hasThermal,
        });
      });

      return Array.from(deduped.values());
    }

    _createListGroup(title, description, addButton, listbox) {
      const group = this._createSettingsGroup(title, description);

      const addRow = new Adw.ActionRow({
        title: _("Threshold Colors"),
        subtitle: _(
          "Rules are matched from the highest threshold downward. Values that do not go higher than any threshold keep the default color."
        ),
      });
      addRow.add_suffix(this._takeWidget(addButton));
      if (addRow.set_activatable_widget) {
        addRow.set_activatable_widget(addButton);
      }

      group.add(addRow);
      group.add(
        this._createEmbeddedExpanderSection({
          title: _("Threshold Rules"),
          subtitle: _(
            "Expand to manage thresholds and colors for this metric."
          ),
          child: this._wrapEmbeddedWidget(
            listbox,
            ["boxed-list", "resource-monitor-list"]
          ),
          expanded: false,
        })
      );

      return group;
    }

    _getPanelItemLabel(item) {
      const labels = {
        cpu: _("CPU"),
        ram: _("RAM"),
        swap: _("Swap"),
        stats: _("Disk Statistics"),
        space: _("Disk Space"),
        eth: _("Ethernet"),
        wlan: _("Wi-Fi"),
        gpu: _("GPU"),
      };

      return labels[item] ?? item;
    }

    _getPanelItemIconName(item) {
      const icons = {
        cpu: "utilities-system-monitor-symbolic",
        ram: "computer-symbolic",
        swap: "media-floppy-symbolic",
        stats: "drive-harddisk-symbolic",
        space: "drive-harddisk-symbolic",
        eth: "network-wired-symbolic",
        wlan: "network-wireless-signal-excellent-symbolic",
        gpu: "video-display-symbolic",
      };

      return icons[item] ?? "applications-system-symbolic";
    }

    _resolveLeftClickPreset(activeCommand, customCommand) {
      if (activeCommand === "gnome-system-monitor") {
        return "system-monitor";
      }

      if (activeCommand === "gnome-usage") {
        return "gnome-usage";
      }

      if (activeCommand === customCommand) {
        return "custom";
      }

      return "custom";
    }

    _buildNativeGlobalPage() {
      const page = this._createSectionPage({
        name: "global",
        title: _("Global"),
        iconName: "preferences-system-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("Global Preferences"),
          subtitle: _(
            "Control panel placement, interaction behavior, and shared formatting options."
          ),
          iconName: "preferences-system-symbolic",
        })
      );

      const behaviorGroup = this._createSettingsGroup(
        _("Behavior"),
        _("Choose how the indicator behaves in GNOME Shell.")
      );
      behaviorGroup.add(
        this._createActionRow(
          _("Refresh Interval"),
          _("Controls how often resource values are updated."),
          this._secondsSpinbutton
        )
      );
      behaviorGroup.add(
        this._createActionRow(
          _("Panel Position"),
          _("Choose where the indicator appears in the panel."),
          this._extensionPositionCombobox
        )
      );
      behaviorGroup.add(
        this._createActionRow(
          _("Display Mode"),
          this._getDisplayModeDescription(),
          this._displayModeCombobox
        )
      );
      behaviorGroup.add(
        this._createActionRow(
          _("Open Preferences on Right-Click"),
          _("Open the preferences window when the indicator is right-clicked."),
          this._extensionRightClickPrefs
        )
      );
      page.add(behaviorGroup);

      const appearanceGroup = this._createSettingsGroup(
        _("Appearance"),
        _("Adjust how values are formatted and shown in the panel.")
      );
      appearanceGroup.add(
        this._createActionRow(
          _("Data Unit Base"),
          _("Choose whether data units use SI (1000) or IEC (1024) scaling."),
          this._dataScaleBaseCombobox
        )
      );
      appearanceGroup.add(
        this._createActionRow(
          _("Show Icons"),
          _("Display symbolic icons next to monitored resources."),
          this._iconsDisplay
        )
      );
      appearanceGroup.add(
        this._createActionRow(
          _("Icon Position"),
          _("Choose whether icons appear before or after the values."),
          this._iconsPositionCombobox
        )
      );
      appearanceGroup.add(
        this._createActionRow(
          _("Secondary Metrics Separator"),
          _("Choose how secondary metrics are separated in the panel."),
          this._secondarySeparatorStyleCombobox
        )
      );
      page.add(appearanceGroup);

      const launchGroup = this._createSettingsGroup(
        _("Launch Action"),
        _("Choose what happens when you left-click the indicator.")
      );
      launchGroup.add(
        this._createActionRow(
          _("Left-click Action"),
          _("Choose which app or command runs on left-click."),
          this._extensionLeftClickActionCombobox
        )
      );
      launchGroup.add(
        this._createActionRow(
          _("Custom Command"),
          _("Used only when Left-click Action is set to Custom Command."),
          this._extensionLeftClickEntryCustom
        )
      );
      page.add(launchGroup);

      const orderingGroup = this._createSettingsGroup(
        _("Items Order"),
        _("Reorder the resources shown in the panel.")
      );
      orderingGroup.add(
        this._wrapEmbeddedWidget(
          this._itemsPositionListbox,
          ["boxed-list", "resource-monitor-list"]
        )
      );
      page.add(orderingGroup);

      return page;
    }

    _buildNativeCpuPage() {
      const page = this._createSectionPage({
        name: "cpu",
        title: _("CPU"),
        iconName: "utilities-system-monitor-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("CPU Preferences"),
          subtitle: _("Configure CPU usage, frequency, and load average indicators."),
          iconName: "utilities-system-monitor-symbolic",
        })
      );

      const usageGroup = this._createSettingsGroup(
        _("Usage"),
        _("Configure how CPU usage is shown in the panel.")
      );
      usageGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show CPU usage in the panel."),
          this._cpuDisplay
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for the CPU value."),
          this._cpuWidthSpinbutton
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for CPU usage."),
          this._cpuFormattingControls.decimals
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._cpuFormattingControls.renderMode
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._cpuFormattingControls.renderStep
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
        _("Configure how CPU frequency is shown in the panel.")
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show the current CPU frequency in the panel."),
          this._cpuFrequencyDisplay
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for the frequency value."),
          this._cpuFrequencyWidthSpinbutton
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Scale"),
          _("Choose how CPU frequency values are scaled."),
          this._cpuFrequencyUnitMeasureCombobox
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for CPU frequency."),
          this._cpuFrequencyFormattingControls.decimals
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._cpuFrequencyFormattingControls.renderMode
        )
      );
      frequencyGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._cpuFrequencyFormattingControls.renderStep
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
        _("Configure how system load average is shown in the panel.")
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show the load average in the panel."),
          this._cpuLoadAverageDisplay
        )
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for the load average value."),
          this._cpuLoadAverageWidthSpinbutton
        )
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for load average."),
          this._cpuLoadAverageFormattingControls.decimals
        )
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._cpuLoadAverageFormattingControls.renderMode
        )
      );
      loadAverageGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._cpuLoadAverageFormattingControls.renderStep
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

    _buildNativeRamPage() {
      const page = this._createSectionPage({
        name: "ram",
        title: _("RAM"),
        iconName: "computer-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("RAM Preferences"),
          subtitle: _("Configure memory metrics, scale, and alert thresholds."),
          iconName: "computer-symbolic",
        })
      );

      const monitorGroup = this._createSettingsGroup(
        _("Memory"),
        _("Configure how RAM usage is shown in the panel.")
      );
      monitorGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show RAM usage in the panel."),
          this._ramDisplay
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for the RAM value."),
          this._ramWidthSpinbutton
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Value Format"),
          _("Choose between percentage and numeric values."),
          this._ramUnitCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how numeric RAM values are formatted.")
          ),
          this._ramUnitMeasureCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Tracked Value"),
          _("Choose whether to monitor used or free memory."),
          this._ramMonitorCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for RAM values."),
          this._ramFormattingControls.decimals
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._ramFormattingControls.renderMode
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._ramFormattingControls.renderStep
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
          _("Show a notification when available memory drops below the configured limit."),
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

    _buildNativeSwapPage() {
      const page = this._createSectionPage({
        name: "swap",
        title: _("Swap"),
        iconName: "media-floppy-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("Swap Preferences"),
          subtitle: _("Configure swap metrics, scale, and low-memory alerts."),
          iconName: "media-floppy-symbolic",
        })
      );

      const monitorGroup = this._createSettingsGroup(
        _("Swap"),
        _("Configure how swap usage is shown in the panel.")
      );
      monitorGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show swap usage in the panel."),
          this._swapDisplay
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for the swap value."),
          this._swapWidthSpinbutton
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Value Format"),
          _("Choose between percentage and numeric values."),
          this._swapUnitCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how numeric swap values are formatted.")
          ),
          this._swapUnitMeasureCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Tracked Value"),
          _("Choose whether to monitor used or free swap."),
          this._swapMonitorCombobox
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for swap values."),
          this._swapFormattingControls.decimals
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._swapFormattingControls.renderMode
        )
      );
      monitorGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._swapFormattingControls.renderStep
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
          _("Show a notification when available swap drops below the configured limit."),
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

    _buildNativeNetPage() {
      const page = this._createSectionPage({
        name: "net",
        title: _("Network"),
        iconName: "network-workgroup-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("Network Preferences"),
          subtitle: _("Configure throughput units and per-interface indicators."),
          iconName: "network-workgroup-symbolic",
        })
      );

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared network display settings.")
      );
      commonGroup.add(
        this._createActionRow(
          _("Auto-hide Inactive"),
          _("Hide interfaces that do not have an active NetworkManager connection."),
          this._netAutoHide
        )
      );
      commonGroup.add(
        this._createActionRow(
          _("Base Unit"),
          _("Choose whether throughput is displayed in bytes or bits."),
          this._netUnitCombobox
        )
      );
      commonGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how network throughput values are formatted.")
          ),
          this._netUnitMeasureCombobox
        )
      );
      page.add(commonGroup);

      const ethernetGroup = this._createSettingsGroup(
        _("Ethernet"),
        _("Configure how wired traffic is shown in the panel.")
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show Ethernet traffic in the panel."),
          this._netEthDisplay
        )
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for Ethernet throughput."),
          this._netEthWidthSpinbutton
        )
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for Ethernet throughput."),
          this._netEthFormattingControls.decimals
        )
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._netEthFormattingControls.renderMode
        )
      );
      ethernetGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._netEthFormattingControls.renderStep
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
        _("Configure how Wi-Fi traffic is shown in the panel.")
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show Wi-Fi traffic in the panel."),
          this._netWlanDisplay
        )
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for Wi-Fi throughput."),
          this._netWlanWidthSpinbutton
        )
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for Wi-Fi throughput."),
          this._netWlanFormattingControls.decimals
        )
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._netWlanFormattingControls.renderMode
        )
      );
      wirelessGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._netWlanFormattingControls.renderStep
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

    _buildNativeDiskPage() {
      const page = this._createSectionPage({
        name: "disk",
        title: _("Disk"),
        iconName: "drive-harddisk-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("Disk Preferences"),
          subtitle: _("Configure activity, space monitoring, and device selection."),
          iconName: "drive-harddisk-symbolic",
        })
      );

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared disk settings for panel indicators.")
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
          _("Show in Panel"),
          _("Show disk activity statistics in the panel."),
          this._diskStatsDisplay
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for disk activity values."),
          this._diskStatsWidthSpinbutton
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Aggregation"),
          _("Choose between a single combined value and per-device values."),
          this._diskStatsModeCombobox
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how disk activity values are formatted.")
          ),
          this._diskStatsUnitMeasureCombobox
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for disk activity."),
          this._diskStatsFormattingControls.decimals
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._diskStatsFormattingControls.renderMode
        )
      );
      statsGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._diskStatsFormattingControls.renderStep
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
          _("Show in Panel"),
          _("Show disk space usage in the panel."),
          this._diskSpaceDisplay
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for disk space values."),
          this._diskSpaceWidthSpinbutton
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Value Format"),
          _("Choose between percentage and numeric values."),
          this._diskSpaceUnitCombobox
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how numeric disk space values are formatted.")
          ),
          this._diskSpaceUnitMeasureCombobox
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Tracked Value"),
          _("Choose whether to monitor used or free space."),
          this._diskSpaceMonitorCombobox
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for disk space values."),
          this._diskSpaceFormattingControls.decimals
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._diskSpaceFormattingControls.renderMode
        )
      );
      spaceGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._diskSpaceFormattingControls.renderStep
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
          _("Include every detected device in the device list."),
          this._diskDevicesDisplayAll
        )
      );
      devicesGroup.add(this._createColumnViewContainer(this._diskDevicesColumnView));
      page.add(devicesGroup);

      return page;
    }

    _buildNativeThermalPage() {
      const page = this._createSectionPage({
        name: "thermal",
        title: _("Thermal"),
        iconName: "weather-clear-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("Thermal Preferences"),
          subtitle: _("Configure CPU and GPU temperature units, sensors, and visibility."),
          iconName: "weather-clear-symbolic",
        })
      );

      const commonGroup = this._createSettingsGroup(
        _("Common"),
        _("Configure shared temperature display settings.")
      );
      commonGroup.add(
        this._createActionRow(
          _("Temperature Unit"),
          _("Choose Celsius or Fahrenheit for all thermal readings."),
          this._thermalUnitCombobox
        )
      );
      page.add(commonGroup);

      const cpuGroup = this._createSettingsGroup(
        _("CPU Temperature"),
        _("Configure how CPU temperature is shown in the panel.")
      );
      cpuGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show CPU temperature in the panel."),
          this._thermalCpuDisplay
        )
      );
      cpuGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for CPU temperature values."),
          this._thermalCpuWidthSpinbutton
        )
      );
      cpuGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for CPU temperature."),
          this._thermalCpuFormattingControls.decimals
        )
      );
      cpuGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._thermalCpuFormattingControls.renderMode
        )
      );
      cpuGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._thermalCpuFormattingControls.renderStep
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
        _("Configure how GPU temperature is shown in the panel.")
      );
      gpuGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show GPU temperature in the panel."),
          this._thermalGpuDisplay
        )
      );
      gpuGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for GPU temperature values."),
          this._thermalGpuWidthSpinbutton
        )
      );
      gpuGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for GPU temperature."),
          this._thermalGpuFormattingControls.decimals
        )
      );
      gpuGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._thermalGpuFormattingControls.renderMode
        )
      );
      gpuGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._thermalGpuFormattingControls.renderStep
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

    _buildNativeGpuPage() {
      const page = this._createSectionPage({
        name: "gpu",
        title: _("GPU"),
        iconName: "video-display-symbolic",
      });

      page.add(
        this._createPageIntroGroup({
          title: _("GPU Preferences"),
          subtitle: _("Configure usage, memory telemetry, devices, and diagnostics."),
          iconName: "video-display-symbolic",
        })
      );

      const usageGroup = this._createSettingsGroup(
        _("Usage"),
        _("Configure how GPU usage is shown in the panel.")
      );
      usageGroup.add(
        this._createActionRow(
          _("Show in Panel"),
          _("Show GPU usage in the panel."),
          this._gpuDisplay
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Reserved Width"),
          _("Reserve a fixed amount of space for GPU usage values."),
          this._gpuWidthSpinbutton
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Display Device Name"),
          _("Show the selected GPU name next to the panel values."),
          this._gpuDisplayDeviceName
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for GPU usage."),
          this._gpuFormattingControls.decimals
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._gpuFormattingControls.renderMode
        )
      );
      usageGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._gpuFormattingControls.renderStep
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
        _("Configure how GPU memory is shown in the panel.")
      );
      memoryGroup.add(
        this._createActionRow(
          _("Value Format"),
          _("Choose between percentage and numeric values."),
          this._gpuMemoryUnitCombobox
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Scale"),
          this._appendDataScaleBaseHint(
            _("Choose how numeric GPU memory values are formatted.")
          ),
          this._gpuMemoryUnitMeasureCombobox
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Tracked Value"),
          _("Choose whether to monitor used or free GPU memory."),
          this._gpuMemoryMonitorCombobox
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Decimals"),
          _("Choose how many decimal digits are shown for GPU memory."),
          this._gpuMemoryFormattingControls.decimals
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Render Mode"),
          _("Choose between precise rendering and quantized step rendering."),
          this._gpuMemoryFormattingControls.renderMode
        )
      );
      memoryGroup.add(
        this._createActionRow(
          _("Step"),
          _("In step mode, values change only after this increment."),
          this._gpuMemoryFormattingControls.renderStep
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

      const diagnosticsGroup = this._createSettingsGroup(
        _("Diagnostics"),
        _("Review detected GPU backends and available telemetry capabilities.")
      );
      diagnosticsGroup.add(
        this._wrapEmbeddedWidget(
          this._gpuDiagnosticsListbox,
          ["boxed-list", "resource-monitor-list"]
        )
      );
      page.add(diagnosticsGroup);

      return page;
    }

    fillPreferencesWindow(window) {
      window.add_css_class("resource-monitor-preferences");

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

      window.add(this._buildNativeGlobalPage());
      window.add(this._buildNativeCpuPage());
      window.add(this._buildNativeRamPage());
      window.add(this._buildNativeSwapPage());
      window.add(this._buildNativeDiskPage());
      window.add(this._buildNativeNetPage());
      window.add(this._buildNativeThermalPage());
      window.add(this._buildNativeGpuPage());

      GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        this._relaxPreferencesWindowClamps(window);
        return GLib.SOURCE_REMOVE;
      });
    }

    _buildGlobal() {
      this._secondsSpinbutton = this._createSpinButton({
        upper: 60,
        step: 1,
        page: 1,
      });
      this._extensionPositionCombobox = this._createComboBox([
        ["left", _("Left")],
        ["center", _("Center")],
        ["right", _("Right")],
      ]);
      this._displayModeCombobox = this._createComboBox(
        this._getDisplayModeOptions()
      );
      this._extensionLeftClickActionCombobox = this._createComboBox([
        ["system-monitor", _("GNOME System Monitor")],
        ["gnome-usage", _("GNOME Usage")],
        ["custom", _("Custom Command")],
      ]);
      this._extensionLeftClickEntryCustom = this._createEntry(
        Gtk.InputPurpose.TERMINAL
      );
      this._extensionLeftClickEntryCustom.placeholder_text = _(
        "e.g. gnome-system-monitor"
      );
      this._extensionLeftClickEntryCustom.width_chars = 28;
      this._extensionRightClickPrefs = this._createSwitch();
      this._dataScaleBaseCombobox = this._createComboBox(
        this._getDataScaleBaseOptions()
      );
      this._iconsDisplay = this._createSwitch();
      this._iconsPositionCombobox = this._createComboBox([
        ["left", _("Left")],
        ["right", _("Right")],
      ]);
      this._secondarySeparatorStyleCombobox = this._createComboBox(
        this._getSecondarySeparatorStyleOptions()
      );
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
      connectComboBox(
        this._settings,
        DISPLAY_MODE,
        this._displayModeCombobox
      );
      this._displayModeCombobox.connect("changed", (widget) => {
        if (
          widget.get_active_id() === DISPLAY_MODE_ALL &&
          !this._isDashToPanelEnabled()
        ) {
          this._settings.set_string(DISPLAY_MODE, DISPLAY_MODE_PRIMARY);
          widget.set_active_id(DISPLAY_MODE_PRIMARY);
        }
      });
      connectSwitchButton(
        this._settings,
        RIGHT_CLICK_STATUS,
        this._extensionRightClickPrefs
      );
      connectComboBox(
        this._settings,
        DATA_SCALE_BASE,
        this._dataScaleBaseCombobox
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
      connectComboBox(
        this._settings,
        SECONDARY_SEPARATOR_STYLE,
        this._secondarySeparatorStyleCombobox
      );

      this._iconsDisplay.connect("notify::active", (button) => {
        this._iconsPositionCombobox.sensitive = button.active;
      });
      this._iconsPositionCombobox.sensitive = this._iconsDisplay.active;

      // LEFT-CLICK
      const active = this._settings.get_string(LEFT_CLICK_STATUS);
      let textBufferCustom = this._settings.get_string(
        CUSTOM_LEFT_CLICK_STATUS
      );
      if (!textBufferCustom || textBufferCustom === "custom-program") {
        textBufferCustom =
          active &&
          active !== "gnome-system-monitor" &&
          active !== "gnome-usage"
            ? active
            : "custom-program";
      }
      this._extensionLeftClickEntryCustom.text = textBufferCustom;

      this._extensionLeftClickActionCombobox.set_active_id(
        this._resolveLeftClickPreset(active, textBufferCustom)
      );
      this._extensionLeftClickEntryCustom.sensitive =
        this._extensionLeftClickActionCombobox.get_active_id() === "custom";

      this._extensionLeftClickActionCombobox.connect("changed", (widget) => {
        const selected = widget.get_active_id();
        const isCustom = selected === "custom";
        this._extensionLeftClickEntryCustom.sensitive = isCustom;

        switch (selected) {
          case "system-monitor":
            this._settings.set_string(LEFT_CLICK_STATUS, "gnome-system-monitor");
            break;
          case "gnome-usage":
            this._settings.set_string(LEFT_CLICK_STATUS, "gnome-usage");
            break;
          case "custom":
          default:
            this._settings.set_string(
              LEFT_CLICK_STATUS,
              this._extensionLeftClickEntryCustom.text
            );
            break;
        }
      });

      this._extensionLeftClickEntryCustom.connect("changed", (entry) => {
        this._settings.set_string(CUSTOM_LEFT_CLICK_STATUS, entry.text);
        if (
          this._extensionLeftClickActionCombobox.get_active_id() === "custom"
        ) {
          this._settings.set_string(LEFT_CLICK_STATUS, entry.text);
        }
      });

      // ListBox
      let itemsPositionArray = this._settings.get_strv(ITEMS_POSITION);

      for (let i = 0; i < itemsPositionArray.length; i++) {
        const element = itemsPositionArray[i];

        const row = new Gtk.ListBoxRow();
        row.add_css_class("resource-monitor-reorder-row");
        const box = new Gtk.Box({
          orientation: Gtk.Orientation.HORIZONTAL,
          spacing: 8,
        });

        const up = new Gtk.Button({
          icon_name: "go-up",
          tooltip_text: _("Move up"),
          valign: Gtk.Align.CENTER,
        });
        up.add_css_class("flat");
        up.add_css_class("resource-monitor-reorder-button");
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
          tooltip_text: _("Move down"),
          valign: Gtk.Align.CENTER,
        });
        down.add_css_class("flat");
        down.add_css_class("resource-monitor-reorder-button");
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

        const label = new Gtk.Label({
          label: this._getPanelItemLabel(element),
          hexpand: true,
          halign: Gtk.Align.START,
        });
        const icon = new Gtk.Image({
          icon_name: this._getPanelItemIconName(element),
          pixel_size: 16,
          valign: Gtk.Align.CENTER,
        });
        icon.add_css_class("resource-monitor-reorder-icon");
        label.add_css_class("resource-monitor-reorder-label");
        box.append(icon);
        box.append(label);
        box.append(up);
        box.append(down);

        row.child = box;

        this._itemsPositionListbox.insert(row, i);
      }
    }

    _buildCpu() {
      this._cpuDisplay = this._createSwitch();
      this._cpuWidthSpinbutton = this._createSpinButton({ upper: 400 });
      this._cpuFormattingControls =
        this._createIndicatorFormattingControls("cpu", {
          stepUpper: 100,
        });
      this._cpuColorsAddButton = this._createIconButton("list-add");
      this._cpuColorsListbox = this._createListBox();
      this._cpuFrequencyDisplay = this._createSwitch();
      this._cpuFrequencyWidthSpinbutton = this._createSpinButton({
        upper: 400,
      });
      this._cpuFrequencyFormattingControls =
        this._createIndicatorFormattingControls("cpuFrequency", {
          stepUpper: 10000,
        });
      this._cpuFrequencyColorsAddButton = this._createIconButton("list-add");
      this._cpuFrequencyColorsListbox = this._createListBox();
      this._cpuFrequencyUnitMeasureCombobox = this._createComboBox(
        this._getFrequencyScaleOptions()
      );
      this._cpuLoadAverageDisplay = this._createSwitch();
      this._cpuLoadAverageWidthSpinbutton = this._createSpinButton({
        upper: 400,
      });
      this._cpuLoadAverageFormattingControls =
        this._createIndicatorFormattingControls("cpuLoadAverage", {
          stepUpper: 100,
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
      this._initializeIndicatorFormattingControls({
        display: this._cpuDisplay,
        controls: this._cpuFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._cpuFrequencyDisplay,
        controls: this._cpuFrequencyFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._cpuLoadAverageDisplay,
        controls: this._cpuLoadAverageFormattingControls,
      });

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
      this._ramWidthSpinbutton = this._createSpinButton({ upper: 400 });
      this._ramFormattingControls =
        this._createIndicatorFormattingControls("ram", {
          stepUpper: 1000,
        });
      this._ramColorsAddButton = this._createIconButton("list-add");
      this._ramColorsListbox = this._createListBox();
      this._ramUnitCombobox = this._createComboBox(
        this._getNumericOrPercentOptions()
      );
      this._ramUnitMeasureCombobox = this._createComboBox(
        this._getDataScaleOptions()
      );
      this._ramMonitorCombobox = this._createComboBox(
        this._getMemoryMonitorOptions()
      );
      this._ramAlert = this._createSwitch();
      this._ramAlertThresholdSpinbutton = this._createSpinButton({
        upper: 99,
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
      this._initializeIndicatorFormattingControls({
        display: this._ramDisplay,
        controls: this._ramFormattingControls,
      });
    }

    _buildSwap() {
      this._swapDisplay = this._createSwitch();
      this._swapWidthSpinbutton = this._createSpinButton({ upper: 400 });
      this._swapFormattingControls =
        this._createIndicatorFormattingControls("swap", {
          stepUpper: 1000,
        });
      this._swapColorsAddButton = this._createIconButton("list-add");
      this._swapColorsListbox = this._createListBox();
      this._swapUnitCombobox = this._createComboBox(
        this._getNumericOrPercentOptions()
      );
      this._swapUnitMeasureCombobox = this._createComboBox(
        this._getDataScaleOptions()
      );
      this._swapMonitorCombobox = this._createComboBox(
        this._getMemoryMonitorOptions()
      );
      this._swapAlert = this._createSwitch();
      this._swapAlertThresholdSpinbutton = this._createSpinButton({
        upper: 99,
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
      this._initializeIndicatorFormattingControls({
        display: this._swapDisplay,
        controls: this._swapFormattingControls,
      });
    }

    _buildDisk() {
      this._diskShowDeviceName = this._createSwitch();
      this._diskStatsDisplay = this._createSwitch();
      this._diskStatsWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._diskStatsFormattingControls =
        this._createIndicatorFormattingControls("diskStats", {
          stepUpper: 10000,
        });
      this._diskStatsColorsAddButton = this._createIconButton("list-add");
      this._diskStatsColorsListbox = this._createListBox();
      this._diskStatsModeCombobox = this._createComboBox([
        ["single", _("Combined")],
        ["multiple", _("Per Device")],
      ]);
      this._diskStatsUnitMeasureCombobox = this._createComboBox(
        this._getDataScaleOptions()
      );
      this._diskSpaceDisplay = this._createSwitch();
      this._diskSpaceWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._diskSpaceFormattingControls =
        this._createIndicatorFormattingControls("diskSpace", {
          stepUpper: 1000,
        });
      this._diskSpaceColorsAddButton = this._createIconButton("list-add");
      this._diskSpaceColorsListbox = this._createListBox();
      this._diskSpaceUnitCombobox = this._createComboBox(
        this._getNumericOrPercentOptions()
      );
      this._diskSpaceUnitMeasureCombobox = this._createComboBox(
        this._getDataScaleOptions()
      );
      this._diskSpaceMonitorCombobox = this._createComboBox(
        this._getSpaceMonitorOptions()
      );
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
      this._initializeIndicatorFormattingControls({
        display: this._diskStatsDisplay,
        controls: this._diskStatsFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._diskSpaceDisplay,
        controls: this._diskSpaceFormattingControls,
      });

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
      this._setColumnExpand(mountPointCol, true);
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
      this._diskDevicesDisplayAll.connect("notify::active", (button) => {
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

    _findDiskConfig(disksArray, { filesystem, stableId = "", mountPoint = "" }) {
      for (const diskConfig of disksArray) {
        if ((diskConfig.mountPoint ?? "") !== mountPoint) {
          continue;
        }

        if (
          stableId &&
          diskConfig.stableId &&
          stableId === diskConfig.stableId
        ) {
          return diskConfig;
        }

        if (filesystem === diskConfig.device) {
          return diskConfig;
        }
      }

      return null;
    }

    _readDiskDevices(settings, model, loadAll) {
      const generation = ++this._diskReadGeneration;
      model.remove_all();

      const disksArray = parseSettingsArray(
        settings,
        DISK_DEVICES_LIST,
        parseDiskEntry
      );

      this._readMountEntries()
        .then((entries) => {
          if (generation !== this._diskReadGeneration) {
            return;
          }

          for (const { filesystem, mountPoint, stableId = "" } of entries) {

            let statsButton = false;
            let spaceButton = false;
            let displayName = filesystem;
            const diskConfig = this._findDiskConfig(disksArray, {
              filesystem,
              stableId,
              mountPoint,
            });
            if (diskConfig) {
              statsButton = diskConfig.stats;
              spaceButton = diskConfig.space;
              displayName = diskConfig.displayName || filesystem;
            }

            // Append disk entry to the model
            model.append(
              new DiskElement(
                displayName,
                filesystem,
                stableId,
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
                if (generation !== this._diskReadGeneration) {
                  return;
                }

                const lines = new TextDecoder().decode(contents).split("\n");

                for (const line of lines) {
                  if (!line.trim()) continue;

                  const entry = line.trim().split(/\s+/);
                  const devicePath = `/dev/${entry[2]}`;
                  const stableId = getDiskStableId(devicePath);

                  // Skip loop devices
                  if (/^loop/.test(entry[2])) continue;

                  // Check if device is already listed
                  let isListed = false;
                  for (let iter = 0; iter < model.get_n_items(); iter++) {
                    const item = model.get_item(iter);
                    if (
                      devicePath === item.device ||
                      (stableId && stableId === item.stableId)
                    ) {
                      isListed = true;
                      break; // Stop the for
                    }
                  }

                  if (!isListed) {
                    let statsButton = false;
                    let spaceButton = false;
                    let displayName = devicePath;
                    const diskConfig = this._findDiskConfig(disksArray, {
                      filesystem: devicePath,
                      stableId,
                      mountPoint: "",
                    });
                    if (diskConfig) {
                      statsButton = diskConfig.stats;
                      spaceButton = diskConfig.space;
                      displayName = diskConfig.displayName || devicePath;
                    }

                    model.append(
                      new DiskElement(
                        displayName,
                        devicePath,
                        stableId,
                        "",
                        statsButton,
                        spaceButton
                      )
                    );
                  }
                }

                // Save updated disksArray to settings
                if (generation === this._diskReadGeneration) {
                  saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
                }
              })
              .catch((err) =>
                console.error(
                  "[Resource_Monitor] Error loading /proc/diskstats:",
                  err
                )
              );
          } else {
            // Save updated disksArray to settings
            if (generation === this._diskReadGeneration) {
              saveArrayToSettings(model, settings, DISK_DEVICES_LIST);
            }
          }
        })
        .catch((err) =>
          console.error("[Resource_Monitor] Error reading mounted disks:", err)
        );
    }

    _buildNet() {
      this._netAutoHide = this._createSwitch();
      this._netUnitCombobox = this._createComboBox(
        this._getNetworkUnitOptions()
      );
      this._netUnitMeasureCombobox = this._createComboBox([
        ["auto", _("Auto")],
        ["b", _("Base Unit")],
        ["k", _("Kilo")],
        ["m", _("Mega")],
        ["g", _("Giga")],
        ["t", _("Tera")],
      ]);
      this._netEthDisplay = this._createSwitch();
      this._netEthWidthSpinbutton = this._createSpinButton({ upper: 400 });
      this._netEthFormattingControls =
        this._createIndicatorFormattingControls("netEth", {
          stepUpper: 10000,
        });
      this._netEthColorsAddButton = this._createIconButton("list-add");
      this._netEthColorsListbox = this._createListBox();
      this._netWlanDisplay = this._createSwitch();
      this._netWlanWidthSpinbutton = this._createSpinButton({ upper: 400 });
      this._netWlanFormattingControls =
        this._createIndicatorFormattingControls("netWlan", {
          stepUpper: 10000,
        });
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
      this._initializeIndicatorFormattingControls({
        display: this._netEthDisplay,
        controls: this._netEthFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._netWlanDisplay,
        controls: this._netWlanFormattingControls,
      });

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
      const hasGpuTelemetry =
        GLib.find_program_in_path("nvidia-smi") !== null ||
        getAmdGpuDescriptors().length > 0 ||
        getIntelGpuDescriptors().length > 0;

      this._thermalUnitCombobox = this._createComboBox([
        ["c", _("°C")],
        ["f", _("°F")],
      ]);
      this._thermalCpuDisplay = this._createSwitch();
      this._thermalCpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._thermalCpuFormattingControls =
        this._createIndicatorFormattingControls("thermalCpu", {
          stepUpper: 200,
        });
      this._thermalCpuColorsAddButton = this._createIconButton("list-add");
      this._thermalCpuColorsListbox = this._createListBox();
      this._thermalCpuDevicesColumnView = this._createColumnView();
      this._thermalGpuDisplay = this._createSwitch();
      this._thermalGpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._thermalGpuFormattingControls =
        this._createIndicatorFormattingControls("thermalGpu", {
          stepUpper: 200,
        });
      this._thermalGpuColorsAddButton = this._createIconButton("list-add");
      this._thermalGpuColorsListbox = this._createListBox();
      this._thermalGpuDevicesColumnView = this._createColumnView();
      this._thermalGpuDevicesColumnView.sensitive = hasGpuTelemetry;

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
      this._initializeIndicatorFormattingControls({
        display: this._thermalCpuDisplay,
        controls: this._thermalCpuFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._thermalGpuDisplay,
        controls: this._thermalGpuFormattingControls,
      });

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

      this._readDetectedGpus().then((detectedGpus) => {
        detectedGpus
          .filter((gpu) => gpu.hasThermal)
          .forEach((gpu) => {
            let statusButton = false;

            for (const gpuConfig of gpuTempsArray) {
              if (gpu.device === gpuConfig.device) {
                statusButton = gpuConfig.monitor;
                break;
              }
            }

            this._thermalGpuDevicesModel.append(
              new ThermalGpuElement(gpu.device, gpu.name, statusButton)
            );
          });

        saveArrayToSettings(
          this._thermalGpuDevicesModel,
          this._settings,
          THERMAL_GPU_TEMPERATURE_DEVICES_LIST
        );
      });

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
      const hasGpuTelemetry =
        GLib.find_program_in_path("nvidia-smi") !== null ||
        getAmdGpuDescriptors().length > 0 ||
        getIntelGpuDescriptors().length > 0;

      this._gpuDisplay = this._createSwitch();
      this._gpuWidthSpinbutton = this._createSpinButton({ upper: 500 });
      this._gpuFormattingControls =
        this._createIndicatorFormattingControls("gpu", {
          stepUpper: 100,
        });
      this._gpuColorsAddButton = this._createIconButton("list-add");
      this._gpuColorsListbox = this._createListBox();
      this._gpuMemoryColorsAddButton = this._createIconButton("list-add");
      this._gpuMemoryColorsListbox = this._createListBox();
      this._gpuMemoryFormattingControls =
        this._createIndicatorFormattingControls("gpuMemory", {
          stepUpper: 1000,
        });
      this._gpuMemoryUnitCombobox = this._createComboBox(
        this._getNumericOrPercentOptions()
      );
      this._gpuMemoryUnitMeasureCombobox = this._createComboBox(
        this._getDataScaleOptions()
      );
      this._gpuMemoryMonitorCombobox = this._createComboBox(
        this._getMemoryMonitorOptions()
      );
      this._gpuDisplayDeviceName = this._createSwitch();
      this._gpuDevicesColumnView = this._createColumnView();
      this._gpuDiagnosticsListbox = this._createListBox();
      this._gpuDevicesColumnView.sensitive = hasGpuTelemetry;

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
      this._initializeIndicatorFormattingControls({
        display: this._gpuDisplay,
        controls: this._gpuFormattingControls,
      });
      this._initializeIndicatorFormattingControls({
        display: this._gpuDisplay,
        controls: this._gpuMemoryFormattingControls,
      });

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
      this._setColumnExpand(nameCol, true);
      this._gpuDevicesColumnView.append_column(nameCol);

      // Usage Column
      this._appendToggleColumn(this._gpuDevicesColumnView, this._gpuDevicesModel, {
        title: _("Monitor Usage"),
        getValue: (item) => item.usage,
        setValue: (item, value) => {
          item.usage = value;
        },
      });

      // Memory Column
      this._appendToggleColumn(this._gpuDevicesColumnView, this._gpuDevicesModel, {
        title: _("Monitor Memory"),
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

      this._readDetectedGpus().then((detectedGpus) => {
        detectedGpus
          .filter((gpu) => gpu.hasUsage || gpu.hasMemory)
          .forEach((gpu) => {
            let usageButton = false;
            let memoryButton = false;
            let displayName = gpu.name;

            for (const gpuConfig of gpuDevicesArray) {
              if (gpu.device === gpuConfig.device) {
                usageButton = gpuConfig.usage;
                memoryButton = gpuConfig.memory;
                displayName = gpuConfig.displayName || gpu.name;
                break;
              }
            }

            this._gpuDevicesModel.append(
              new GpuElement(
                displayName,
                gpu.device,
                gpu.name,
                usageButton,
                memoryButton
              )
            );
          });

        saveArrayToSettings(
          this._gpuDevicesModel,
          this._settings,
          GPU_DEVICES_LIST
        );
      });

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

      this._refreshGpuDiagnostics();
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
