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

import GObject from "gi://GObject";
import Atk from "gi://Atk";
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import Shell from "gi://Shell";
import NM from "gi://NM";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import {
  parseDiskEntry,
  parseGpuEntry,
  parseThermalCpuEntry,
  parseThermalGpuEntry,
  serializeThermalCpuEntry,
} from "./common.js";
import {
  convertValueToUnit,
  convertValuesToUnit,
  getUsageColor,
  getValueFixed,
} from "./runtime/metrics.js";
import {
  executeCommand as executeRuntimeCommand,
  loadContents as loadRuntimeContents,
  loadFile as loadRuntimeFile,
  readOutput as readRuntimeOutput,
} from "./runtime/io.js";
import { buildMainGui, createMainGui } from "./panel/mainGui.js";
import {
  detectCapabilities,
  IssueLogger,
  RefreshTaskRunner,
} from "./services/runtime.js";
import {
  connectSettingsSignals,
  initializeSettings,
  refreshGui,
} from "./services/settings.js";
import { parseSettingsArray } from "./utils/settings.js";
import {
  hasVisibleCpuFrequency,
  hasVisibleGpu,
  hasVisibleThermalCpuTemperature,
  syncCpuFrequencyVisibility,
  syncGpuVisibility,
  syncThermalCpuVisibility,
} from "./services/visibility.js";
import {
  refreshCpuLoadAverageValue,
  refreshCpuFrequencyValue,
  refreshCpuTemperatureValue,
  refreshCpuValue,
  refreshDiskSpaceValue,
  refreshDiskStatsValue,
  refreshEthValue,
  refreshGpuValue,
  refreshHandler,
  refreshRamValue,
  refreshSwapValue,
  refreshWlanValue,
} from "./services/refreshers.js";

// Settings
const REFRESH_TIME = "refreshtime";
const EXTENSION_POSITION = "extensionposition";
const DECIMALS_STATUS = "decimalsstatus";
const LEFT_CLICK_STATUS = "leftclickstatus";
const RIGHT_CLICK_STATUS = "rightclickstatus";

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

const SETTINGS_KEYS = {
  REFRESH_TIME,
  DECIMALS_STATUS,
  LEFT_CLICK_STATUS,
  RIGHT_CLICK_STATUS,
  ICONS_STATUS,
  ICONS_POSITION,
  ITEMS_POSITION,
  CPU_STATUS,
  CPU_WIDTH,
  CPU_COLORS,
  CPU_FREQUENCY_STATUS,
  CPU_FREQUENCY_WIDTH,
  CPU_FREQUENCY_COLORS,
  CPU_FREQUENCY_UNIT_MEASURE,
  CPU_LOADAVERAGE_STATUS,
  CPU_LOADAVERAGE_WIDTH,
  CPU_LOADAVERAGE_COLORS,
  RAM_STATUS,
  RAM_WIDTH,
  RAM_COLORS,
  RAM_UNIT,
  RAM_UNIT_MEASURE,
  RAM_MONITOR,
  RAM_ALERT,
  RAM_ALERT_THRESHOLD,
  SWAP_STATUS,
  SWAP_WIDTH,
  SWAP_COLORS,
  SWAP_UNIT,
  SWAP_UNIT_MEASURE,
  SWAP_MONITOR,
  SWAP_ALERT,
  SWAP_ALERT_THRESHOLD,
  DISK_SHOW_DEVICE_NAME,
  DISK_STATS_STATUS,
  DISK_STATS_WIDTH,
  DISK_STATS_COLORS,
  DISK_STATS_MODE,
  DISK_STATS_UNIT_MEASURE,
  DISK_SPACE_STATUS,
  DISK_SPACE_WIDTH,
  DISK_SPACE_COLORS,
  DISK_SPACE_UNIT,
  DISK_SPACE_UNIT_MEASURE,
  DISK_SPACE_MONITOR,
  DISK_DEVICES_LIST,
  NET_AUTO_HIDE_STATUS,
  NET_UNIT,
  NET_UNIT_MEASURE,
  NET_ETH_STATUS,
  NET_ETH_WIDTH,
  NET_ETH_COLORS,
  NET_WLAN_STATUS,
  NET_WLAN_WIDTH,
  NET_WLAN_COLORS,
  THERMAL_TEMPERATURE_UNIT,
  THERMAL_CPU_TEMPERATURE_STATUS,
  THERMAL_CPU_TEMPERATURE_WIDTH,
  THERMAL_CPU_COLORS,
  THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
  THERMAL_GPU_TEMPERATURE_STATUS,
  THERMAL_GPU_TEMPERATURE_WIDTH,
  THERMAL_GPU_COLORS,
  THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
  GPU_STATUS,
  GPU_WIDTH,
  GPU_COLORS,
  GPU_MEMORY_COLORS,
  GPU_MEMORY_UNIT,
  GPU_MEMORY_UNIT_MEASURE,
  GPU_MEMORY_MONITOR,
  GPU_DISPLAY_DEVICE_NAME,
  GPU_DEVICES_LIST,
  parseDiskEntry,
  parseThermalCpuEntry,
  parseThermalGpuEntry,
  parseGpuEntry,
  NM,
};

const ResourceMonitor = GObject.registerClass(
  class ResourceMonitor extends PanelMenu.Button {
    _init({ settings, openPreferences, path, metadata }) {
      super._init(0.0, metadata.name, false);

      this._settings = settings;
      this._openPreferences = openPreferences;
      this._path = path;
      this._metadata = metadata;

      this._themeContext = St.ThemeContext.get_for_stage(global.stage);
      this._scaleFactor = 1;
      this._destroyed = false;
      this._ioCancellable = new Gio.Cancellable();
      this._refreshTaskRunner = new RefreshTaskRunner();
      this._issueLogger = new IssueLogger();
      this._capabilities = detectCapabilities();
      this._nmClient = null;
      this._nmClientHandlerIds = [];
      this._ramAlertActive = false;
      this._swapAlertActive = false;
      this._themeContextHandlerId = this._themeContext.connect(
        "notify::scale-factor",
        () => {
          this._onScaleFactorChanged();

          this._cpuWidthChanged();
          this._cpuFrequencyWidthChanged();
          this._cpuLoadAverageWidthChanged();
          this._ramWidthChanged();
          this._swapWidthChanged();
          this._diskStatsWidthChanged();
          this._diskSpaceWidthChanged();
          this._netEthWidthChanged();
          this._netWlanWidthChanged();
          this._thermalCpuTemperatureWidthChanged();
          this._thermalGpuTemperatureWidthChanged();
          this._gpuWidthChanged();
        }
      );
      this._onScaleFactorChanged();

      // Variables
      this._handlerIds = [];
      this._handlerIdsCount = 0;

      this._nmEthStatus = false;
      this._nmWlanStatus = false;

      this._cpuTotOld = 0;
      this._cpuIdleOld = 0;

      this._duTotEthOld = [0, 0];
      this._ethIdleOld = 0;

      this._duTotWlanOld = [0, 0];
      this._wlanIdleOld = 0;

      this._cpuTemperatures = 0;
      this._cpuTemperaturesReadings = 0;

      this._createMainGui();
      this._setupAccessibility();
      this._setupMenu();

      this._initSettings();

      this._buildMainGui();

      this._connectSettingsSignals();

      this.connect("button-press-event", this._clickManager.bind(this));
      this.connect("key-press-event", this._onKeyPressEvent.bind(this));

      if (typeof NM !== "undefined") {
        this._initNetworkMonitor();
      }

      this._refreshThermalCpuSensorPaths();

      this._mainTimer = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this._refreshTime,
        this._refreshHandler.bind(this)
      );
      this._refreshHandler();
    }

    _setupAccessibility() {
      const accessibleName = this._metadata?.name || "Resource Monitor";

      this.accessible_name = accessibleName;
      this.accessible_role = Atk.Role.PUSH_BUTTON;

      if (typeof this.set_accessible_name === "function") {
        this.set_accessible_name(accessibleName);
      }

      if (typeof this.set_tooltip_text === "function") {
        this.set_tooltip_text(
          _(
            "Left click launches the configured action. Right click opens preferences."
          )
        );
      } else {
        this.tooltip_text = _(
          "Left click launches the configured action. Right click opens preferences."
        );
      }

      if (this._box) {
        this._box.accessible_name = accessibleName;
      }
    }

    _setupMenu() {
      this.menu.removeAll();

      const refreshItem = new PopupMenu.PopupMenuItem(_("Refresh Now"));
      refreshItem.connect("activate", () => {
        this._refreshHandler();
      });
      this.menu.addMenuItem(refreshItem);

      const preferencesItem = new PopupMenu.PopupMenuItem(_("Preferences"));
      preferencesItem.connect("activate", () => {
        this._openPreferences();
      });
      this.menu.addMenuItem(preferencesItem);
    }

    destroy() {
      this._destroyed = true;

      if (this._mainTimer) {
        GLib.source_remove(this._mainTimer);
        this._mainTimer = null;
      }

      this._ioCancellable.cancel();

      for (let i = 0; i < this._handlerIdsCount; i++) {
        this._settings.disconnect(this._handlerIds[i]);
        this._handlerIds[i] = 0;
      }

      this._nmClientHandlerIds.forEach((handlerId) => {
        this._nmClient?.disconnect(handlerId);
      });
      this._nmClientHandlerIds = [];
      this._nmClient = null;

      this._themeContext.disconnect(this._themeContextHandlerId);

      super.destroy();
    }

    async _initNetworkMonitor() {
      try {
        this._nmClient = await new Promise((resolve, reject) => {
          NM.Client.new_async(this._ioCancellable, (source, result) => {
            try {
              resolve(NM.Client.new_finish(result));
            } catch (error) {
              reject(error);
            }
          });
        });

        if (this._destroyed || !this._nmClient) {
          return;
        }

        this._nmClientHandlerIds.push(
          this._nmClient.connect(
            "active-connection-added",
            this._onActiveConnectionAdded.bind(this)
          )
        );
        this._nmClientHandlerIds.push(
          this._nmClient.connect(
            "active-connection-removed",
            this._onActiveConnectionRemoved.bind(this)
          )
        );

        this._onActiveConnectionRemoved(this._nmClient);
      } catch (error) {
        if (!this._isCancelledError(error)) {
          console.error("[Resource_Monitor] Error initializing NM client:", error);
        }
      }
    }

    async _refreshThermalCpuSensorPaths() {
      if (!this._capabilities.bash || !this._capabilities.thermalHwmon) {
        this._logIssueOnce(
          "thermal-cpu-discovery-unavailable",
          "[Resource_Monitor] CPU thermal sensor discovery is unavailable on this system."
        );
        return;
      }

      try {
        const output = await this._executeCommand([
          "bash",
          "-c",
          'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then for i in /sys/class/hwmon/hwmon*/temp*_input; do NAME="$(<$(dirname "$i")/name)"; if [[ "$NAME" == "coretemp" ]] || [[ "$NAME" == "k10temp" ]] || [[ "$NAME" == "zenpower" ]]; then echo "$NAME: $(cat "${i%_*}_label" 2>/dev/null || basename "${i%_*}")|$i"; fi done; fi',
        ]);

        if (this._destroyed || !output) {
          return;
        }

        this._clearLoggedIssue("thermal-cpu-discovery-unavailable");

        const sensorPathByName = new Map();
        output
          .trim()
          .split("\n")
          .filter(Boolean)
          .forEach((line) => {
            const [name, path] = line.split("|");
            if (name && path) {
              sensorPathByName.set(name.trim(), path.trim());
            }
          });

        let changed = false;
        const nextEntries = this._thermalCpuTemperatureDevices.map((entry) => {
          const nextPath = sensorPathByName.get(entry.name) ?? entry.path;
          if (nextPath !== entry.path) {
            changed = true;
          }

          return {
            ...entry,
            path: nextPath,
          };
        });

        if (changed) {
          this._settings.set_strv(
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
            nextEntries.map(serializeThermalCpuEntry)
          );
        }
      } catch (error) {
        if (!this._isCancelledError(error)) {
          this._logIssueOnce(
            "thermal-cpu-discovery-error",
            "[Resource_Monitor] Error refreshing thermal sensor paths.",
            error
          );
        }
      }
    }

    // GUI
    _createMainGui() {
      createMainGui(this);
    }

    _buildMainGui() {
      buildMainGui(this);
    }

    // SETTINGS
    _initSettings() {
      initializeSettings(this, SETTINGS_KEYS);
    }

    _connectSettingsSignals() {
      connectSettingsSignals(this, SETTINGS_KEYS);
    }

    // HANDLERS
    _onScaleFactorChanged() {
      this._scaleFactor = St.ThemeContext.get_for_stage(
        global.stage
      ).scale_factor;
    }

    _clickManager(actor, event) {
      switch (event.get_button()) {
        case 3: // Right Click
          if (this._rightClickStatus) {
            this._openPreferences();
          } else {
            this.menu.toggle();
          }

          return Clutter.EVENT_STOP;

        case 1: // Left Click
          this._launchPrimaryAction();

          return Clutter.EVENT_STOP;

        default:
          return Clutter.EVENT_PROPAGATE;
      }
    }

    _onKeyPressEvent(actor, event) {
      switch (event.get_key_symbol()) {
        case Clutter.KEY_Return:
        case Clutter.KEY_KP_Enter:
        case Clutter.KEY_space:
          this._launchPrimaryAction();
          return Clutter.EVENT_STOP;

        case Clutter.KEY_Menu:
          this.menu.toggle();
          return Clutter.EVENT_STOP;

        default:
          return Clutter.EVENT_PROPAGATE;
      }
    }

    _launchPrimaryAction() {
      if (this._leftClickStatus === "") {
        return;
      }

      const appSystem = Shell.AppSystem.get_default();
      const appName = this._leftClickStatus + ".desktop";
      let app = appSystem.lookup_app(appName);

      if (app) {
        app.activate();
        return;
      }

      try {
        Util.spawnCommandLine(this._leftClickStatus);
      } catch (error) {
        console.error(
          `[Resource_Monitor] Error spawning ${this._leftClickStatus}: ${error}`
        );
      }
    }

    _onActiveConnectionAdded(client, activeConnection) {
      activeConnection.get_devices().forEach((device) => {
        switch (device.get_device_type()) {
          case NM.DeviceType.ETHERNET:
            this._nmEthStatus = true;

            break;

          case NM.DeviceType.WIFI:
            this._nmWlanStatus = true;

            break;

          default:
            break;
        }
      });

      this._basicItemStatus(
        (this._netEthStatus && this._nmEthStatus) ||
        (this._netEthStatus && !this._netAutoHideStatus),
        true,
        this._ethIcon,
        this._ethValue,
        this._ethUnit
      );
      this._basicItemStatus(
        (this._netWlanStatus && this._nmWlanStatus) ||
        (this._netWlanStatus && !this._netAutoHideStatus),
        true,
        this._wlanIcon,
        this._wlanValue,
        this._wlanUnit
      );
    }

    _onActiveConnectionRemoved(client, activeConnection) {
      this._nmEthStatus = false;
      this._nmWlanStatus = false;

      client.get_active_connections().forEach((activeConnection) => {
        activeConnection.get_devices().forEach((device) => {
          switch (device.get_device_type()) {
            case NM.DeviceType.ETHERNET:
              this._nmEthStatus = true;

              break;

            case NM.DeviceType.WIFI:
              this._nmWlanStatus = true;

              break;

            default:
              break;
          }
        });
      });

      this._basicItemStatus(
        (this._netEthStatus && this._nmEthStatus) ||
        (this._netEthStatus && !this._netAutoHideStatus),
        true,
        this._ethIcon,
        this._ethValue,
        this._ethUnit
      );
      this._basicItemStatus(
        (this._netWlanStatus && this._nmWlanStatus) ||
        (this._netWlanStatus && !this._netAutoHideStatus),
        true,
        this._wlanIcon,
        this._wlanValue,
        this._wlanUnit
      );
    }

    _refreshTimeChanged() {
      this._refreshTime = this._settings.get_int(REFRESH_TIME);

      if (this._mainTimer) {
        GLib.source_remove(this._mainTimer);
        this._mainTimer = null;
      }

      this._mainTimer = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this._refreshTime,
        this._refreshHandler.bind(this)
      );
    }

    _decimalsStatusChanged() {
      this._decimalsStatus = this._settings.get_boolean(DECIMALS_STATUS);

      this._refreshHandler();
    }

    _leftClickStatusChanged() {
      this._leftClickStatus = this._settings.get_string(LEFT_CLICK_STATUS);
    }

    _rightClickStatusChanged() {
      this._rightClickStatus = this._settings.get_boolean(RIGHT_CLICK_STATUS);
    }

    _iconsStatusChanged() {
      this._iconsStatus = this._settings.get_boolean(ICONS_STATUS);

      if (this._iconsStatus) {
        if (
          this._cpuStatus ||
          this._cpuFrequencyStatus ||
          this._cpuLoadAverageStatus ||
          this._thermalCpuTemperatureStatus
        ) {
          this._cpuIcon.show();
        }
        if (this._ramStatus) {
          this._ramIcon.show();
        }
        if (this._swapStatus) {
          this._swapIcon.show();
        }
        if (this._diskStatsStatus) {
          this._diskStatsIcon.show();
        }
        if (this._diskSpaceStatus) {
          this._diskSpaceIcon.show();
        }
        if (
          (this._netEthStatus && this._nmEthStatus) ||
          (this._netEthStatus && !this._netAutoHideStatus)
        ) {
          this._ethIcon.show();
        }
        if (
          (this._netWlanStatus && this._nmWlanStatus) ||
          (this._netWlanStatus && !this._netAutoHideStatus)
        ) {
          this._wlanIcon.show();
        }
        if (this._gpuStatus || this._thermalGpuTemperatureStatus) {
          this._gpuIcon.show();
        }
      } else {
        this._cpuIcon.hide();
        this._ramIcon.hide();
        this._swapIcon.hide();
        this._diskStatsIcon.hide();
        this._diskSpaceIcon.hide();
        this._ethIcon.hide();
        this._wlanIcon.hide();
        this._gpuIcon.hide();
      }
    }

    _iconsPositionChanged() {
      this._iconsPosition = this._settings.get_string(ICONS_POSITION);

      this._box.remove_all_children();

      this._buildMainGui();
    }

    _itemsPositionChanged() {
      this._itemsPosition = this._settings.get_strv(ITEMS_POSITION);

      this._box.remove_all_children();

      this._buildMainGui();
    }

    _cpuStatusChanged() {
      this._cpuStatus = this._settings.get_boolean(CPU_STATUS);

      this._basicItemStatus(
        this._cpuStatus,
        !this._hasVisibleThermalCpuTemperature() &&
        !this._hasVisibleCpuFrequency() &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuValue,
        this._cpuUnit
      );
    }

    _cpuWidthChanged() {
      this._cpuWidth = this._settings.get_int(CPU_WIDTH);

      this._basicItemWidth(this._cpuWidth * this._scaleFactor, this._cpuValue);
    }

    _cpuColorsChanged() {
      this._cpuColors = this._settings.get_strv(CPU_COLORS);

      if (this._cpuStatus) {
        this._refreshCpuValue();
      }
    }

    _cpuFrequencyStatusChanged() {
      this._cpuFrequencyStatus =
        this._settings.get_boolean(CPU_FREQUENCY_STATUS);

      this._syncCpuFrequencyVisibility();

      if (this._hasVisibleCpuFrequency()) {
        this._refreshCpuFrequencyValue();
      }
    }

    _syncCpuFrequencyVisibility() {
      this._basicItemStatus(
        this._hasVisibleCpuFrequency(),
        !this._cpuStatus &&
        !this._hasVisibleThermalCpuTemperature() &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuFrequencyValue,
        this._cpuFrequencyUnit,
        this._cpuFrequencyBracketStart,
        this._cpuFrequencyBracketEnd
      );
    }

    _cpuFrequencyWidthChanged() {
      this._cpuFrequencyWidth = this._settings.get_int(CPU_FREQUENCY_WIDTH);

      this._basicItemWidth(
        this._cpuFrequencyWidth * this._scaleFactor,
        this._cpuFrequencyValue
      );
    }

    _cpuFrequencyColorsChanged() {
      this._cpuFrequencyColors = this._settings.get_strv(CPU_FREQUENCY_COLORS);

      if (this._hasVisibleCpuFrequency()) {
        this._refreshCpuFrequencyValue();
      }
    }

    _cpuFrequencyUnitMeasureChanged() {
      this._cpuFrequencyUnitMeasure = this._settings.get_string(
        CPU_FREQUENCY_UNIT_MEASURE
      );

      if (this._hasVisibleCpuFrequency()) {
        this._refreshCpuFrequencyValue();
      }
    }

    _cpuLoadAverageStatusChanged() {
      this._cpuLoadAverageStatus = this._settings.get_boolean(
        CPU_LOADAVERAGE_STATUS
      );

      this._basicItemStatus(
        this._cpuLoadAverageStatus,
        !this._cpuStatus &&
        !this._hasVisibleThermalCpuTemperature() &&
        !this._hasVisibleCpuFrequency(),
        this._cpuIcon,
        this._cpuLoadAverageValue,
        this._cpuLoadAverageBracketStart,
        this._cpuLoadAverageBracketEnd
      );
    }

    _cpuLoadAverageWidthChanged() {
      this._cpuLoadAverageWidth = this._settings.get_int(CPU_LOADAVERAGE_WIDTH);

      this._basicItemWidth(
        this._cpuLoadAverageWidth * this._scaleFactor,
        this._cpuLoadAverageValue
      );
    }

    _cpuLoadAverageColorsChanged() {
      this._cpuLoadAverageColors = this._settings.get_strv(
        CPU_LOADAVERAGE_COLORS
      );

      if (this._cpuLoadAverageStatus) {
        this._refreshCpuLoadAverageValue();
      }
    }

    _ramStatusChanged() {
      this._ramStatus = this._settings.get_boolean(RAM_STATUS);

      this._basicItemStatus(
        this._ramStatus,
        true,
        this._ramIcon,
        this._ramValue,
        this._ramUnit
      );
    }

    _ramWidthChanged() {
      this._ramWidth = this._settings.get_int(RAM_WIDTH);

      this._basicItemWidth(this._ramWidth * this._scaleFactor, this._ramValue);
    }

    _ramColorsChanged() {
      this._ramColors = this._settings.get_strv(RAM_COLORS);

      if (this._ramStatus) {
        this._refreshRamValue();
      }
    }

    _ramUnitTypeChanged() {
      this._ramUnitType = this._settings.get_string(RAM_UNIT);

      if (this._ramStatus) {
        this._refreshRamValue();
      }
    }

    _ramUnitMeasureChanged() {
      this._ramUnitMeasure = this._settings.get_string(RAM_UNIT_MEASURE);

      if (this._ramStatus) {
        this._refreshRamValue();
      }
    }

    _ramMonitorChanged() {
      this._ramMonitor = this._settings.get_string(RAM_MONITOR);

      if (this._ramStatus) {
        this._refreshRamValue();
      }
    }

    _ramAlertChanged() {
      this._ramAlert = this._settings.get_boolean(RAM_ALERT);
    }

    _ramAlertThresholdChanged() {
      this._ramAlertThreshold = this._settings.get_int(RAM_ALERT_THRESHOLD);
    }

    _swapStatusChanged() {
      this._swapStatus = this._settings.get_boolean(SWAP_STATUS);

      this._basicItemStatus(
        this._swapStatus,
        true,
        this._swapIcon,
        this._swapValue,
        this._swapUnit
      );
    }

    _swapWidthChanged() {
      this._swapWidth = this._settings.get_int(SWAP_WIDTH);

      this._basicItemWidth(
        this._swapWidth * this._scaleFactor,
        this._swapValue
      );
    }

    _swapColorsChanged() {
      this._swapColors = this._settings.get_strv(SWAP_COLORS);

      if (this._swapStatus) {
        this._refreshSwapValue();
      }
    }

    _swapUnitTypeChanged() {
      this._swapUnitType = this._settings.get_string(SWAP_UNIT);

      if (this._swapStatus) {
        this._refreshSwapValue();
      }
    }

    _swapUnitMeasureChanged() {
      this._swapUnitMeasure = this._settings.get_string(SWAP_UNIT_MEASURE);

      if (this._swapStatus) {
        this._refreshSwapValue();
      }
    }

    _swapMonitorChanged() {
      this._swapMonitor = this._settings.get_string(SWAP_MONITOR);

      if (this._swapStatus) {
        this._refreshSwapValue();
      }
    }

    _swapAlertChanged() {
      this._swapAlert = this._settings.get_boolean(SWAP_ALERT);
    }

    _swapAlertThresholdChanged() {
      this._swapAlertThreshold = this._settings.get_int(SWAP_ALERT_THRESHOLD);
    }

    _diskShowDeviceNameChanged() {
      this._diskShowDeviceName = this._settings.get_boolean(DISK_SHOW_DEVICE_NAME);

      this._diskStatsBox.set_element_name_visibility(
        this._diskShowDeviceName
      );
      this._diskSpaceBox.set_element_name_visibility(
        this._diskShowDeviceName
      );
    }

    _diskStatsStatusChanged() {
      this._diskStatsStatus = this._settings.get_boolean(DISK_STATS_STATUS);

      this._basicItemStatus(
        this._diskStatsStatus,
        true,
        this._diskStatsIcon,
        this._diskStatsBox
      );
    }

    _diskStatsWidthChanged() {
      this._diskStatsWidth = this._settings.get_int(DISK_STATS_WIDTH);

      this._diskStatsBox.set_element_width(
        this._diskStatsWidth * this._scaleFactor
      );
    }

    _diskStatsColorsChanged() {
      this._diskStatsColors = this._settings.get_strv(DISK_STATS_COLORS);

      if (this._diskStatsStatus) {
        this._refreshDiskStatsValue();
      }
    }

    _diskStatsModeChanged() {
      this._diskStatsMode = this._settings.get_string(DISK_STATS_MODE);

      this._diskStatsBox.update_mode(this._diskStatsMode);
    }

    _diskStatsUnitMeasureChanged() {
      this._diskStatsUnitMeasure = this._settings.get_string(
        DISK_STATS_UNIT_MEASURE
      );

      if (this._diskStatsStatus) {
        this._refreshDiskStatsValue();
      }
    }

    _diskSpaceStatusChanged() {
      this._diskSpaceStatus = this._settings.get_boolean(DISK_SPACE_STATUS);

      this._basicItemStatus(
        this._diskSpaceStatus,
        true,
        this._diskSpaceIcon,
        this._diskSpaceBox
      );
    }

    _diskSpaceWidthChanged() {
      this._diskSpaceWidth = this._settings.get_int(DISK_SPACE_WIDTH);

      this._diskSpaceBox.set_element_width(
        this._diskSpaceWidth * this._scaleFactor
      );
    }

    _diskSpaceColorsChanged() {
      this._diskSpaceColors = this._settings.get_strv(DISK_SPACE_COLORS);

      if (this._diskSpaceStatus) {
        this._refreshDiskSpaceValue();
      }
    }

    _diskSpaceUnitTypeChanged() {
      this._diskSpaceUnitType = this._settings.get_string(DISK_SPACE_UNIT);

      if (this._diskSpaceStatus) {
        this._refreshDiskSpaceValue();
      }
    }

    _diskSpaceUnitMeasureChanged() {
      this._diskSpaceUnitMeasure = this._settings.get_string(
        DISK_SPACE_UNIT_MEASURE
      );

      if (this._diskSpaceStatus) {
        this._refreshDiskSpaceValue();
      }
    }

    _diskSpaceMonitorChanged() {
      this._diskSpaceMonitor = this._settings.get_string(DISK_SPACE_MONITOR);

      if (this._diskSpaceStatus) {
        this._refreshDiskSpaceValue();
      }
    }

    _diskDevicesListChanged() {
      this._diskDevices = this._parseSettingsArray(DISK_DEVICES_LIST, parseDiskEntry);

      this._diskStatsBox.cleanup_elements();
      this._diskSpaceBox.cleanup_elements();

      this._diskDevices.forEach((device) => {
        if (device.stats) {
          this._diskStatsBox.add_element(device.device, device.displayName);
        }

        if (device.space) {
          this._diskSpaceBox.add_element(device.device, device.displayName);
        }
      });

      this._diskStatsBox.add_single();
      this._diskStatsBox.update_mode(this._diskStatsMode);

      this._diskStatsBox.set_element_width(
        this._diskStatsWidth * this._scaleFactor
      );
      this._diskSpaceBox.set_element_width(
        this._diskSpaceWidth * this._scaleFactor
      );

      this._diskStatsBox.set_element_name_visibility(
        this._diskShowDeviceName
      );
      this._diskSpaceBox.set_element_name_visibility(
        this._diskShowDeviceName
      );
    }

    _netAutoHideStatusChanged() {
      this._netAutoHideStatus =
        this._settings.get_boolean(NET_AUTO_HIDE_STATUS) &&
        typeof NM !== "undefined";

      this._basicItemStatus(
        (this._netEthStatus && this._nmEthStatus) ||
        (this._netEthStatus && !this._netAutoHideStatus),
        true,
        this._ethIcon,
        this._ethValue,
        this._ethUnit
      );
      this._basicItemStatus(
        (this._netWlanStatus && this._nmWlanStatus) ||
        (this._netWlanStatus && !this._netAutoHideStatus),
        true,
        this._wlanIcon,
        this._wlanValue,
        this._wlanUnit
      );
    }

    _netUnitChanged() {
      this._netUnit = this._settings.get_string(NET_UNIT);

      if (this._netEthStatus) {
        this._refreshEthValue();
      }
      if (this._netWlanStatus) {
        this._refreshWlanValue();
      }
    }

    _netUnitMeasureChanged() {
      this._netUnitMeasure = this._settings.get_string(NET_UNIT_MEASURE);

      if (this._netEthStatus) {
        this._refreshEthValue();
      }
      if (this._netWlanStatus) {
        this._refreshWlanValue();
      }
    }

    _netEthStatusChanged() {
      this._netEthStatus = this._settings.get_boolean(NET_ETH_STATUS);

      this._basicItemStatus(
        (this._netEthStatus && this._nmEthStatus) ||
        (this._netEthStatus && !this._netAutoHideStatus),
        true,
        this._ethIcon,
        this._ethValue,
        this._ethUnit
      );
    }

    _netEthWidthChanged() {
      this._netEthWidth = this._settings.get_int(NET_ETH_WIDTH);

      this._basicItemWidth(
        this._netEthWidth * this._scaleFactor,
        this._ethValue
      );
    }

    _netEthColorsChanged() {
      this._netEthColors = this._settings.get_strv(NET_ETH_COLORS);

      if (this._netEthStatus) {
        this._refreshEthValue();
      }
    }

    _netWlanStatusChanged() {
      this._netWlanStatus = this._settings.get_boolean(NET_WLAN_STATUS);

      this._basicItemStatus(
        (this._netWlanStatus && this._nmWlanStatus) ||
        (this._netWlanStatus && !this._netAutoHideStatus),
        true,
        this._wlanIcon,
        this._wlanValue,
        this._wlanUnit
      );
    }

    _netWlanWidthChanged() {
      this._netWlanWidth = this._settings.get_int(NET_WLAN_WIDTH);

      this._basicItemWidth(
        this._netWlanWidth * this._scaleFactor,
        this._wlanValue
      );
    }

    _netWlanColorsChanged() {
      this._netWlanColors = this._settings.get_strv(NET_WLAN_COLORS);

      if (this._netWlanStatus) {
        this._refreshWlanValue();
      }
    }

    _thermalCpuTemperatureStatusChanged() {
      this._thermalCpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_CPU_TEMPERATURE_STATUS
      );

      this._syncThermalCpuVisibility();

      if (this._hasVisibleThermalCpuTemperature()) {
        this._refreshCpuTemperatureValue();
      }
    }

    _syncThermalCpuVisibility() {
      this._basicItemStatus(
        this._hasVisibleThermalCpuTemperature(),
        !this._cpuStatus &&
        !this._hasVisibleCpuFrequency() &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuTemperatureValue,
        this._cpuTemperatureUnit,
        this._cpuTemperatureBracketStart,
        this._cpuTemperatureBracketEnd
      );
    }

    _thermalCpuTemperatureWidthChanged() {
      this._thermalCpuTemperatureWidth = this._settings.get_int(
        THERMAL_CPU_TEMPERATURE_WIDTH
      );

      this._basicItemWidth(
        this._thermalCpuTemperatureWidth * this._scaleFactor,
        this._cpuTemperatureValue
      );
    }

    _thermalCpuColorsChanged() {
      this._thermalCpuColors = this._settings.get_strv(THERMAL_CPU_COLORS);

      if (this._hasVisibleThermalCpuTemperature()) {
        this._refreshCpuTemperatureValue();
      }
    }

    _thermalTemperatureUnitChanged() {
      this._thermalTemperatureUnit = this._settings.get_string(
        THERMAL_TEMPERATURE_UNIT
      );

      if (this._hasVisibleThermalCpuTemperature()) {
        this._refreshCpuTemperatureValue();
      }
      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _thermalCpuTemperatureDevicesListChanged() {
      this._thermalCpuTemperatureDevices = this._parseSettingsArray(
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
        parseThermalCpuEntry
      );

      this._syncThermalCpuVisibility();

      if (this._hasVisibleThermalCpuTemperature()) {
        this._refreshCpuTemperatureValue();
      }
    }

    _thermalGpuTemperatureStatusChanged() {
      this._thermalGpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_GPU_TEMPERATURE_STATUS
      );

      this._syncGpuVisibility();
      this._gpuDevicesListChanged();

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _thermalGpuTemperatureWidthChanged() {
      this._thermalGpuTemperatureWidth = this._settings.get_int(
        THERMAL_GPU_TEMPERATURE_WIDTH
      );

      this._gpuBox.set_element_thermal_width(
        this._thermalGpuTemperatureWidth * this._scaleFactor
      );
    }

    _thermalGpuColorsChanged() {
      this._thermalGpuColors = this._settings.get_strv(THERMAL_GPU_COLORS);

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _thermalGpuTemperatureDevicesListChanged() {
      this._thermalGpuTemperatureDevices = this._parseSettingsArray(
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
        parseThermalGpuEntry
      );

      this._gpuDevicesListChanged();
    }

    _gpuStatusChanged() {
      this._gpuStatus = this._settings.get_boolean(GPU_STATUS);

      this._syncGpuVisibility();
      this._gpuDevicesListChanged();

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuWidthChanged() {
      this._gpuWidth = this._settings.get_int(GPU_WIDTH);

      this._gpuBox.set_element_width(this._gpuWidth * this._scaleFactor);
    }

    _gpuColorsChanged() {
      this._gpuColors = this._settings.get_strv(GPU_COLORS);

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryColorsChanged() {
      this._gpuMemoryColors = this._settings.get_strv(GPU_MEMORY_COLORS);

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryUnitTypeChanged() {
      this._gpuMemoryUnitType = this._settings.get_string(GPU_MEMORY_UNIT);

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryUnitMeasureChanged() {
      this._gpuMemoryUnitMeasure = this._settings.get_string(
        GPU_MEMORY_UNIT_MEASURE
      );

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryMonitorChanged() {
      this._gpuMemoryMonitor = this._settings.get_string(GPU_MEMORY_MONITOR);

      if (this._hasVisibleGpu()) {
        this._refreshGpuValue();
      }
    }

    _gpuDisplayDeviceNameChanged() {
      this._gpuDisplayDeviceName = this._settings.get_boolean(
        GPU_DISPLAY_DEVICE_NAME
      );

      this._gpuDevicesListChanged();
    }

    _gpuDevicesListChanged() {
      this._gpuDevices = this._parseSettingsArray(GPU_DEVICES_LIST, parseGpuEntry);

      this._gpuBox.cleanup_elements();

      if (!this._capabilities.nvidiaSmi) {
        this._syncGpuVisibility();
        return;
      }

      this._gpuDevices.forEach((device) => {
        const uuid = device.device;
        const usage = device.usage && this._gpuStatus;
        const memory = device.memory && this._gpuStatus;
        const displayName = this._gpuDisplayDeviceName
          ? device.displayName
          : null;
        let thermal = false;

        if (this._thermalGpuTemperatureStatus) {
          this._thermalGpuTemperatureDevices.forEach((thermalDevice) => {
            if (uuid === thermalDevice.device) {
              thermal = thermalDevice.monitor;
            }
          });
        }

        this._gpuBox.add_element(uuid, displayName, usage, memory, thermal);
      });

      this._gpuBox.set_element_width(this._gpuWidth * this._scaleFactor);
      this._gpuBox.set_element_thermal_width(
        this._thermalGpuTemperatureWidth * this._scaleFactor
      );
      this._syncGpuVisibility();
    }

    _hasVisibleCpuFrequency() {
      return hasVisibleCpuFrequency(this);
    }

    _hasVisibleThermalCpuTemperature() {
      return hasVisibleThermalCpuTemperature(this);
    }

    _hasVisibleGpu() {
      return hasVisibleGpu(this);
    }

    _syncGpuVisibility() {
      syncGpuVisibility(this);
    }

    _syncCpuFrequencyVisibility() {
      syncCpuFrequencyVisibility(this);
    }

    _syncThermalCpuVisibility() {
      syncThermalCpuVisibility(this);
    }

    _refreshHandler() {
      return refreshHandler(this);
    }

    _refreshGui() {
      refreshGui(this);
    }

    _parseSettingsArray(key, parser) {
      return parseSettingsArray(this._settings, key, parser);
    }

    _isCancelledError(error) {
      if (!error) {
        return false;
      }

      if (error instanceof GLib.Error) {
        return error.matches(Gio.io_error_quark(), Gio.IOErrorEnum.CANCELLED);
      }

      return error.code === Gio.IOErrorEnum.CANCELLED;
    }

    _logIssueOnce(key, message, error = null) {
      this._issueLogger.logOnce(key, message, error);
    }

    _clearLoggedIssue(key) {
      this._issueLogger.clear(key);
    }

    _runRefreshTask(key, callback) {
      this._refreshTaskRunner.run(key, callback);
    }

    _applyMemoryDisplay(display, options) {
      const {
        alertEnabled,
        alertThreshold,
        alertActive,
        setAlertActive,
        title,
        message,
        valueLabel,
        unitLabel,
        colors,
      } = options;

      if (
        alertEnabled &&
        display.total > 0 &&
        (100 * display.available) / display.total < alertThreshold
      ) {
        if (!alertActive) {
          this._notifyMemoryAlert(title, message);
          setAlertActive(true);
        }
      } else {
        setAlertActive(false);
      }

      valueLabel.style = this._getUsageColor(display.value, colors);
      valueLabel.text = `${this._getValueFixed(display.value)}`;
      unitLabel.text = display.unit;
    }

    _notifyMemoryAlert(title, message) {
      Main.notify(title, message);
    }

    // ==================
    // HELPER FUNCTIONS
    // ==================

    // Determines the color based on the value and thresholds
    _getUsageColor(value, colors) {
      return getUsageColor(value, colors, COLOR_LIST_SEPARATOR);
    }

    // Decimal precision
    _getValueFixed(value) {
      return getValueFixed(value, this._decimalsStatus);
    }

    // Conversion for a single value (KB, MB, GB or Hz)
    _convertValueToUnit(value, unitMeasure, isHertz = false) {
      return convertValueToUnit(value, unitMeasure, isHertz);
    }

    // Conversion of array of values (network/disk)
    _convertValuesToUnit(values, unitMeasure, isBits = false) {
      return convertValuesToUnit(values, unitMeasure, isBits);
    }

    // ==================
    // REFRESH FUNCTIONS
    // ==================

    _refreshCpuValue() {
      refreshCpuValue(this);
    }

    _refreshRamValue() {
      refreshRamValue(this);
    }

    _refreshSwapValue() {
      refreshSwapValue(this);
    }

    _refreshDiskStatsValue() {
      refreshDiskStatsValue(this);
    }

    _refreshDiskSpaceValue() {
      refreshDiskSpaceValue(this);
    }

    _refreshEthValue() {
      refreshEthValue(this);
    }

    _refreshWlanValue() {
      refreshWlanValue(this);
    }

    _refreshCpuFrequencyValue() {
      refreshCpuFrequencyValue(this);
    }

    _refreshCpuLoadAverageValue() {
      refreshCpuLoadAverageValue(this);
    }

    _refreshCpuTemperatureValue() {
      refreshCpuTemperatureValue(this);
    }

    _refreshGpuValue() {
      refreshGpuValue(this);
    }

    // Common Function
    _basicItemStatus(status, iconCondition, icon, ...elements) {
      if (status) {
        if (this._iconsStatus) {
          icon.show();
        }
        elements.forEach((element) => {
          element.show();
        });
      } else {
        if (iconCondition) {
          icon.hide();
        }
        elements.forEach((element) => {
          element.hide();
        });
      }
    }

    _basicItemWidth(width, element) {
      if (width === 0) {
        element.min_width = 0;
        element.natural_width = 0;
        element.min_width_set = false;
        element.natural_width_set = false;
      } else {
        element.width = width;
      }
    }

    _loadContents(file, cancellable = this._ioCancellable) {
      return loadRuntimeContents(file, cancellable);
    }

    async _loadFile(path, cancellable = this._ioCancellable) {
      return loadRuntimeFile(path, cancellable);
    }

    _readOutput(proc, cancellable = this._ioCancellable) {
      return readRuntimeOutput(proc, cancellable);
    }

    async _executeCommand(command, cancellable = this._ioCancellable) {
      return executeRuntimeCommand(command, cancellable);
    }
  }
);

export default class ResourceMonitorExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._indicator = new ResourceMonitor({
      settings: this._settings,
      openPreferences: () => {
        this.openPreferences();
      },
      path: this.path,
      metadata: this.metadata,
    });

    const index = {
      left: -1,
      center: 0,
      right: 0,
    };

    this._extensionPosition = this._settings.get_string(EXTENSION_POSITION);
    this._handlerId = this._settings.connect(
      `changed::${EXTENSION_POSITION}`,
      () => {
        this._extensionPosition = this._settings.get_string(EXTENSION_POSITION);

        this._indicator.destroy();
        this._indicator = null;
        this._indicator = new ResourceMonitor({
          settings: this._settings,
          openPreferences: () => {
            this.openPreferences();
          },
          path: this.path,
          metadata: this.metadata,
        });

        Main.panel.addToStatusArea(
          this.uuid,
          this._indicator,
          index[this._extensionPosition],
          this._extensionPosition
        );
      }
    );

    Main.panel.addToStatusArea(
      this.uuid,
      this._indicator,
      index[this._extensionPosition],
      this._extensionPosition
    );
  }

  disable() {
    // Disconnect Signal
    this._settings.disconnect(this._handlerId);
    this._settings = null;

    this._indicator.destroy();
    this._indicator = null;
  }
}
