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
import St from "gi://St";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import Shell from "gi://Shell";
import NM from "gi://NM";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

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

const ResourceMonitor = GObject.registerClass(
  class ResourceMonitor extends PanelMenu.Button {
    _init({ settings, openPreferences, path, metadata }) {
      super._init(0.0, metadata.name, false);

      this._settings = settings;
      this._openPreferences = openPreferences;
      this._path = path;
      this._metadata = metadata;

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
      this._cpuTemperaturesReads = 0;

      this._createMainGui();

      this._initSettings();

      this._buildMainGui();

      this._connectSettingsSignals();

      this.connect("button-press-event", this._clickManager.bind(this));

      if (typeof NM !== "undefined") {
        NM.Client.new_async(null, (client) => {
          client.connect(
            "active-connection-added",
            this._onActiveConnectionAdded.bind(this)
          );
          client.connect(
            "active-connection-removed",
            this._onActiveConnectionRemoved.bind(this)
          );

          this._onActiveConnectionRemoved(client);
        });
      }

      // Update device path
      this._executeCommand([
        "bash",
        "-c",
        'if ls /sys/class/hwmon/hwmon*/temp*_input 1>/dev/null 2>&1; then echo "EXIST"; fi',
      ]).then((output) => {
        let result = output.split("\n")[0];
        if (result === "EXIST") {
          this._executeCommand([
            "bash",
            "-c",
            'for i in /sys/class/hwmon/hwmon*/temp*_input; do NAME="$(<$(dirname $i)/name)"; if [[ "$NAME" == "coretemp" ]] || [[ "$NAME" == "k10temp" ]] || [[ "$NAME" == "zenpower" ]]; then echo "$NAME: $(cat ${i%_*}_label 2>/dev/null || echo $(basename ${i%_*}))-$i"; fi done',
          ]).then((output) => {
            let lines = output.split("\n");

            for (let i = 0; i < lines.length - 1; i++) {
              let line = lines[i];
              let entry = line.trim().split(/-/);

              let device = entry[0];
              let path = entry[1];

              for (let i = 0; i < this._thermalCpuTemperatureDevicesList.length; i++) {
                let element = this._thermalCpuTemperatureDevicesList[i];
                let it = element.split(
                  THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR
                );

                if (device === it[0]) {
                  // Update device path
                  this._thermalCpuTemperatureDevicesList[i] = it[0] +
                    THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR +
                    it[1] +
                    THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR +
                    path;

                  break;
                }
              }
            }
          });
        }
      });

      this._mainTimer = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this._refreshTime,
        this._refreshHandler.bind(this)
      );
      this._refreshHandler();
    }

    destroy() {
      if (this._mainTimer) {
        GLib.source_remove(this._mainTimer);
        this._mainTimer = null;
      }

      for (let i = 0; i < this._handlerIdsCount; i++) {
        this._settings.disconnect(this._handlerIds[i]);
        this._handlerIds[i] = 0;
      }

      super.destroy();
    }

    // GUI
    _createMainGui() {
      this._box = new St.BoxLayout();

      // Icon
      this._cpuIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/cpu-symbolic.svg"),
        style_class: "system-status-icon",
      });

      this._ramIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/ram-symbolic.svg"),
        style_class: "system-status-icon",
      });

      this._swapIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/swap-symbolic.svg"),
        style_class: "system-status-icon",
      });

      this._diskStatsIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(
          this._path + "/icons/disk-stats-symbolic.svg"
        ),
        style_class: "system-status-icon",
      });

      this._diskSpaceIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(
          this._path + "/icons/disk-space-symbolic.svg"
        ),
        style_class: "system-status-icon",
      });

      this._ethIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/eth-symbolic.svg"),
        style_class: "system-status-icon",
      });

      this._wlanIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/wlan-symbolic.svg"),
        style_class: "system-status-icon",
      });

      this._gpuIcon = new St.Icon({
        gicon: Gio.icon_new_for_string(this._path + "/icons/gpu-symbolic.svg"),
        style_class: "system-status-icon",
      });

      // Unit
      this._cpuTemperatureUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "°C",
      });
      this._cpuTemperatureUnit.set_style("padding-left: 0.125em;");

      this._cpuFrequencyUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "KHz",
      });
      this._cpuFrequencyUnit.set_style("padding-left: 0.125em;");

      this._cpuUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "%",
      });
      this._cpuUnit.set_style("padding-left: 0.125em;");

      this._ramUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: this._ramUnitType ? "%" : "KB",
      });
      this._ramUnit.set_style("padding-left: 0.125em;");

      this._swapUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: this._swapUnitType ? "%" : "KB",
      });
      this._swapUnit.set_style("padding-left: 0.125em;");

      this._ethUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._ethUnit.set_style("padding-left: 0.125em;");

      this._wlanUnit = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._wlanUnit.set_style("padding-left: 0.125em;");

      // Value
      this._cpuValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._cpuValue.set_style("text-align: right;");

      this._ramValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._ramValue.set_style("text-align: right;");

      this._swapValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._swapValue.set_style("text-align: right;");

      this._diskStatsBox = new DiskContainerStats();
      this._diskSpaceBox = new DiskContainerSpace();

      this._ethValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._ethValue.set_style("text-align: right;");

      this._wlanValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._wlanValue.set_style("text-align: right;");

      this._cpuTemperatureValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[--",
      });
      this._cpuTemperatureValueBracket = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "]",
      });
      this._cpuTemperatureValue.set_style("text-align: right;");

      this._cpuFrequencyValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[--",
      });
      this._cpuFrequencyValueBracket = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "]",
      });
      this._cpuFrequencyValue.set_style("text-align: right;");

      this._cpuLoadAverageValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[--]",
      });
      this._cpuLoadAverageValue.set_style("text-align: right;");

      this._gpuBox = new GpuContainer();
    }

    _buildMainGui() {
      // Apply prefs settings
      this._refreshGui();

      switch (this._iconsPosition) {
        case "left":
          this._itemsPosition.forEach((element) => {
            switch (element) {
              case "cpu":
                this._box.add_child(this._cpuIcon);
                this._box.add_child(this._cpuValue);
                this._box.add_child(this._cpuUnit);

                this._box.add_child(this._cpuTemperatureValue);
                this._box.add_child(this._cpuTemperatureUnit);
                this._box.add_child(this._cpuTemperatureValueBracket);
                this._box.add_child(this._cpuFrequencyValue);
                this._box.add_child(this._cpuFrequencyUnit);
                this._box.add_child(this._cpuFrequencyValueBracket);
                this._box.add_child(this._cpuLoadAverageValue);

                break;

              case "ram":
                this._box.add_child(this._ramIcon);
                this._box.add_child(this._ramValue);
                this._box.add_child(this._ramUnit);

                break;

              case "swap":
                this._box.add_child(this._swapIcon);
                this._box.add_child(this._swapValue);
                this._box.add_child(this._swapUnit);

                break;

              case "stats":
                this._box.add_child(this._diskStatsIcon);
                this._box.add_child(this._diskStatsBox);

                break;

              case "space":
                this._box.add_child(this._diskSpaceIcon);
                this._box.add_child(this._diskSpaceBox);

                break;

              case "eth":
                this._box.add_child(this._ethIcon);
                this._box.add_child(this._ethValue);
                this._box.add_child(this._ethUnit);

                break;

              case "wlan":
                this._box.add_child(this._wlanIcon);
                this._box.add_child(this._wlanValue);
                this._box.add_child(this._wlanUnit);

                break;

              case "gpu":
                this._box.add_child(this._gpuIcon);
                this._box.add_child(this._gpuBox);

                break;

              default:
                break;
            }
          });

          break;

        case "right":

        default:
          this._itemsPosition.forEach((element) => {
            switch (element) {
              case "cpu":
                this._box.add_child(this._cpuValue);
                this._box.add_child(this._cpuUnit);

                this._box.add_child(this._cpuTemperatureValue);
                this._box.add_child(this._cpuTemperatureUnit);
                this._box.add_child(this._cpuTemperatureValueBracket);
                this._box.add_child(this._cpuFrequencyValue);
                this._box.add_child(this._cpuFrequencyUnit);
                this._box.add_child(this._cpuFrequencyValueBracket);
                this._box.add_child(this._cpuLoadAverageValue);
                this._box.add_child(this._cpuIcon);

                break;

              case "ram":
                this._box.add_child(this._ramValue);
                this._box.add_child(this._ramUnit);
                this._box.add_child(this._ramIcon);

                break;

              case "swap":
                this._box.add_child(this._swapValue);
                this._box.add_child(this._swapUnit);
                this._box.add_child(this._swapIcon);

                break;

              case "stats":
                this._box.add_child(this._diskStatsBox);
                this._box.add_child(this._diskStatsIcon);

                break;

              case "space":
                this._box.add_child(this._diskSpaceBox);
                this._box.add_child(this._diskSpaceIcon);

                break;

              case "eth":
                this._box.add_child(this._ethValue);
                this._box.add_child(this._ethUnit);
                this._box.add_child(this._ethIcon);

                break;

              case "wlan":
                this._box.add_child(this._wlanValue);
                this._box.add_child(this._wlanUnit);
                this._box.add_child(this._wlanIcon);

                break;

              case "gpu":
                this._box.add_child(this._gpuBox);
                this._box.add_child(this._gpuIcon);

                break;

              default:
                break;
            }
          });

          break;
      }

      this.add_child(this._box);
    }

    // SETTINGS
    _initSettings() {
      this._refreshTime = this._settings.get_int(REFRESH_TIME);
      this._decimalsStatus = this._settings.get_boolean(DECIMALS_STATUS);
      this._leftClickStatus = this._settings.get_string(LEFT_CLICK_STATUS);
      this._rightClickStatus = this._settings.get_boolean(RIGHT_CLICK_STATUS);

      this._iconsStatus = this._settings.get_boolean(ICONS_STATUS);
      this._iconsPosition = this._settings.get_string(ICONS_POSITION);

      this._itemsPosition = this._settings.get_strv(ITEMS_POSITION);

      this._cpuStatus = this._settings.get_boolean(CPU_STATUS);
      this._cpuWidth = this._settings.get_int(CPU_WIDTH);
      this._cpuColors = this._settings.get_strv(CPU_COLORS);
      this._cpuFrequencyStatus =
        this._settings.get_boolean(CPU_FREQUENCY_STATUS);
      this._cpuFrequencyWidth = this._settings.get_int(CPU_FREQUENCY_WIDTH);
      this._cpuFrequencyColors = this._settings.get_strv(CPU_FREQUENCY_COLORS);
      this._cpuFrequencyUnitMeasure = this._settings.get_string(
        CPU_FREQUENCY_UNIT_MEASURE
      );
      this._cpuLoadAverageStatus = this._settings.get_boolean(
        CPU_LOADAVERAGE_STATUS
      );
      this._cpuLoadAverageWidth = this._settings.get_int(CPU_LOADAVERAGE_WIDTH);
      this._cpuLoadAverageColors = this._settings.get_strv(CPU_LOADAVERAGE_COLORS);

      this._ramStatus = this._settings.get_boolean(RAM_STATUS);
      this._ramWidth = this._settings.get_int(RAM_WIDTH);
      this._ramColors = this._settings.get_strv(RAM_COLORS);
      this._ramUnitType = this._settings.get_string(RAM_UNIT);
      this._ramUnitMeasure = this._settings.get_string(RAM_UNIT_MEASURE);
      this._ramMonitor = this._settings.get_string(RAM_MONITOR);
      this._ramAlert = this._settings.get_boolean(RAM_ALERT);
      this._ramAlertThreshold = this._settings.get_int(RAM_ALERT_THRESHOLD);

      this._swapStatus = this._settings.get_boolean(SWAP_STATUS);
      this._swapWidth = this._settings.get_int(SWAP_WIDTH);
      this._swapColors = this._settings.get_strv(SWAP_COLORS);
      this._swapUnitType = this._settings.get_string(SWAP_UNIT);
      this._swapUnitMeasure = this._settings.get_string(SWAP_UNIT_MEASURE);
      this._swapMonitor = this._settings.get_string(SWAP_MONITOR);
      this._swapAlert = this._settings.get_boolean(SWAP_ALERT);
      this._swapAlertThreshold = this._settings.get_int(SWAP_ALERT_THRESHOLD);

      this._diskStatsStatus = this._settings.get_boolean(DISK_STATS_STATUS);
      this._diskStatsWidth = this._settings.get_int(DISK_STATS_WIDTH);
      this._diskStatsColors = this._settings.get_strv(DISK_STATS_COLORS);
      this._diskStatsMode = this._settings.get_string(DISK_STATS_MODE);
      this._diskStatsUnitMeasure = this._settings.get_string(
        DISK_STATS_UNIT_MEASURE
      );
      this._diskSpaceStatus = this._settings.get_boolean(DISK_SPACE_STATUS);
      this._diskSpaceWidth = this._settings.get_int(DISK_SPACE_WIDTH);
      this._diskSpaceColors = this._settings.get_strv(DISK_SPACE_COLORS);
      this._diskSpaceUnitType = this._settings.get_string(DISK_SPACE_UNIT);
      this._diskSpaceUnitMeasure = this._settings.get_string(
        DISK_SPACE_UNIT_MEASURE
      );
      this._diskSpaceMonitor = this._settings.get_string(DISK_SPACE_MONITOR);
      this._diskDevicesList = this._settings.get_strv(DISK_DEVICES_LIST);

      this._netAutoHideStatus =
        this._settings.get_boolean(NET_AUTO_HIDE_STATUS) &&
        typeof NM !== "undefined";
      this._netUnit = this._settings.get_string(NET_UNIT);
      this._netUnitMeasure = this._settings.get_string(NET_UNIT_MEASURE);
      this._netEthStatus = this._settings.get_boolean(NET_ETH_STATUS);
      this._netEthWidth = this._settings.get_int(NET_ETH_WIDTH);
      this._netEthColors = this._settings.get_strv(NET_ETH_COLORS);
      this._netWlanStatus = this._settings.get_boolean(NET_WLAN_STATUS);
      this._netWlanWidth = this._settings.get_int(NET_WLAN_WIDTH);
      this._netWlanColors = this._settings.get_strv(NET_WLAN_COLORS);

      this._thermalTemperatureUnit = this._settings.get_string(
        THERMAL_TEMPERATURE_UNIT
      );
      this._thermalCpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_CPU_TEMPERATURE_STATUS
      );
      this._thermalCpuTemperatureWidth = this._settings.get_int(
        THERMAL_CPU_TEMPERATURE_WIDTH
      );
      this._thermalCpuColors = this._settings.get_strv(THERMAL_CPU_COLORS);
      this._thermalCpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST
      );
      this._thermalGpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_GPU_TEMPERATURE_STATUS
      );
      this._thermalGpuTemperatureWidth = this._settings.get_int(
        THERMAL_GPU_TEMPERATURE_WIDTH
      );
      this._thermalGpuColors = this._settings.get_strv(THERMAL_GPU_COLORS);
      this._thermalGpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST
      );

      this._gpuStatus = this._settings.get_boolean(GPU_STATUS);
      this._gpuWidth = this._settings.get_int(GPU_WIDTH);
      this._gpuColors = this._settings.get_strv(GPU_COLORS);
      this._gpuMemoryColors = this._settings.get_strv(GPU_MEMORY_COLORS);
      this._gpuMemoryUnitType = this._settings.get_string(GPU_MEMORY_UNIT);
      this._gpuMemoryUnitMeasure = this._settings.get_string(
        GPU_MEMORY_UNIT_MEASURE
      );
      this._gpuMemoryMonitor = this._settings.get_string(GPU_MEMORY_MONITOR);
      this._gpuDisplayDeviceName = this._settings.get_boolean(
        GPU_DISPLAY_DEVICE_NAME
      );
      this._gpuDevicesList = this._settings.get_strv(GPU_DEVICES_LIST);
    }

    _connectSettingsSignals() {
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${REFRESH_TIME}`,
        this._refreshTimeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DECIMALS_STATUS}`,
        this._decimalsStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${LEFT_CLICK_STATUS}`,
        this._leftClickStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RIGHT_CLICK_STATUS}`,
        this._rightClickStatusChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${ICONS_STATUS}`,
        this._iconsStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${ICONS_POSITION}`,
        this._iconsPositionChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${ITEMS_POSITION}`,
        this._itemsPositionChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_STATUS}`,
        this._cpuStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_WIDTH}`,
        this._cpuWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_COLORS}`,
        this._cpuColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_FREQUENCY_STATUS}`,
        this._cpuFrequencyStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_FREQUENCY_WIDTH}`,
        this._cpuFrequencyWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_FREQUENCY_COLORS}`,
        this._cpuFrequencyColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_FREQUENCY_UNIT_MEASURE}`,
        this._cpuFrequencyUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_LOADAVERAGE_STATUS}`,
        this._cpuLoadAverageStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_LOADAVERAGE_WIDTH}`,
        this._cpuLoadAverageWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${CPU_LOADAVERAGE_COLORS}`,
        this._cpuLoadAverageColorsChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_STATUS}`,
        this._ramStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_WIDTH}`,
        this._ramWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_COLORS}`,
        this._ramColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_UNIT}`,
        this._ramUnitTypeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_UNIT_MEASURE}`,
        this._ramUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_MONITOR}`,
        this._ramMonitorChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_ALERT}`,
        this._ramAlertChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${RAM_ALERT_THRESHOLD}`,
        this._ramAlertThresholdChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_STATUS}`,
        this._swapStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_WIDTH}`,
        this._swapWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_COLORS}`,
        this._swapColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_UNIT}`,
        this._swapUnitTypeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_UNIT_MEASURE}`,
        this._swapUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_MONITOR}`,
        this._swapMonitorChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_ALERT}`,
        this._swapAlertChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${SWAP_ALERT_THRESHOLD}`,
        this._swapAlertThresholdChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_STATS_STATUS}`,
        this._diskStatsStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_STATS_WIDTH}`,
        this._diskStatsWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_STATS_COLORS}`,
        this._diskStatsColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_STATS_MODE}`,
        this._diskStatsModeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_STATS_UNIT_MEASURE}`,
        this._diskStatsUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_STATUS}`,
        this._diskSpaceStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_WIDTH}`,
        this._diskSpaceWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_COLORS}`,
        this._diskSpaceColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_UNIT}`,
        this._diskSpaceUnitTypeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_UNIT_MEASURE}`,
        this._diskSpaceUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_SPACE_MONITOR}`,
        this._diskSpaceMonitorChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${DISK_DEVICES_LIST}`,
        this._diskDevicesListChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_AUTO_HIDE_STATUS}`,
        this._netAutoHideStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_UNIT}`,
        this._netUnitChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_UNIT_MEASURE}`,
        this._netUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_ETH_STATUS}`,
        this._netEthStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_ETH_WIDTH}`,
        this._netEthWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_ETH_COLORS}`,
        this._netEthColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_WLAN_STATUS}`,
        this._netWlanStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_WLAN_WIDTH}`,
        this._netWlanWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${NET_WLAN_COLORS}`,
        this._netWlanColorsChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_TEMPERATURE_UNIT}`,
        this._thermalTemperatureUnitChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_CPU_TEMPERATURE_STATUS}`,
        this._thermalCpuTemperatureStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_CPU_TEMPERATURE_WIDTH}`,
        this._thermalCpuTemperatureWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_CPU_COLORS}`,
        this._thermalCpuColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_CPU_TEMPERATURE_DEVICES_LIST}`,
        this._thermalCpuTemperatureDevicesListChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_GPU_TEMPERATURE_STATUS}`,
        this._thermalGpuTemperatureStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_GPU_TEMPERATURE_WIDTH}`,
        this._thermalGpuTemperatureWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_GPU_COLORS}`,
        this._thermalGpuColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${THERMAL_GPU_TEMPERATURE_DEVICES_LIST}`,
        this._thermalGpuTemperatureDevicesListChanged.bind(this)
      );

      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_STATUS}`,
        this._gpuStatusChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_WIDTH}`,
        this._gpuWidthChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_COLORS}`,
        this._gpuColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_MEMORY_COLORS}`,
        this._gpuMemoryColorsChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_MEMORY_UNIT}`,
        this._gpuMemoryUnitTypeChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_MEMORY_UNIT_MEASURE}`,
        this._gpuMemoryUnitMeasureChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_MEMORY_MONITOR}`,
        this._gpuMemoryMonitorChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_DISPLAY_DEVICE_NAME}`,
        this._gpuDisplayDeviceNameChanged.bind(this)
      );
      this._handlerIds[this._handlerIdsCount++] = this._settings.connect(
        `changed::${GPU_DEVICES_LIST}`,
        this._gpuDevicesListChanged.bind(this)
      );
    }

    // HANDLERS
    _clickManager(actor, event) {
      switch (event.get_button()) {
        case 3: // Right Click
          if (this._rightClickStatus) {
            this._openPreferences();
          }

          break;

        case 1: // Left Click

        default:
          if (this._leftClickStatus !== "") {
            const appSystem = Shell.AppSystem.get_default();
            const appName = this._leftClickStatus + ".desktop";

            let app = appSystem.lookup_app(appName);

            if (app) {
              // Application found, activate it
              app.activate();
            } else {
              try {
                Util.spawnCommandLine(this._leftClickStatus);
              } catch (e) {
                logError(`Error spawning ${this._leftClickStatus}: ${e}`);
              }
            }
          }

          break;
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
        !this._thermalCpuTemperatureStatus &&
        !this._cpuFrequencyStatus &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuValue,
        this._cpuUnit
      );
    }

    _cpuWidthChanged() {
      this._cpuWidth = this._settings.get_int(CPU_WIDTH);

      this._basicItemWidth(this._cpuWidth, this._cpuValue);
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

      this._basicItemStatus(
        this._cpuFrequencyStatus,
        !this._cpuStatus &&
        !this._thermalCpuTemperatureStatus &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuFrequencyValue,
        this._cpuFrequencyUnit,
        this._cpuFrequencyValueBracket
      );
    }

    _cpuFrequencyWidthChanged() {
      this._cpuFrequencyWidth = this._settings.get_int(CPU_FREQUENCY_WIDTH);

      this._basicItemWidth(this._cpuFrequencyWidth, this._cpuFrequencyValue);
    }

    _cpuFrequencyColorsChanged() {
      this._cpuFrequencyColors = this._settings.get_strv(CPU_FREQUENCY_COLORS);

      if (this._cpuFrequencyStatus) {
        this._refreshCpuFrequencyValue();
      }
    }

    _cpuFrequencyUnitMeasureChanged() {
      this._cpuFrequencyUnitMeasure = this._settings.get_string(
        CPU_FREQUENCY_UNIT_MEASURE
      );

      if (this._cpuFrequencyStatus) {
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
        !this._thermalCpuTemperatureStatus &&
        !this._cpuFrequencyStatus,
        this._cpuIcon,
        this._cpuLoadAverageValue
      );
    }

    _cpuLoadAverageWidthChanged() {
      this._cpuLoadAverageWidth = this._settings.get_int(CPU_LOADAVERAGE_WIDTH);

      this._basicItemWidth(
        this._cpuLoadAverageWidth,
        this._cpuLoadAverageValue
      );
    }

    _cpuLoadAverageColorsChanged() {
      this._cpuLoadAverageColors = this._settings.get_strv(CPU_LOADAVERAGE_COLORS);

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

      this._basicItemWidth(this._ramWidth, this._ramValue);
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

      this._basicItemWidth(this._swapWidth, this._swapValue);
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

      this._diskStatsBox.set_element_width(this._diskStatsWidth);
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

      this._diskSpaceBox.set_element_width(this._diskSpaceWidth);
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
      this._diskDevicesList = this._settings.get_strv(DISK_DEVICES_LIST);

      this._diskStatsBox.cleanup_elements();
      this._diskSpaceBox.cleanup_elements();

      this._diskDevicesList.forEach((element) => {
        const it = element.split(DISK_DEVICES_LIST_SEPARATOR);

        const filesystem = it[0];
        const mountPoint = it[1];
        const stats = it[2] === "true";
        const space = it[3] === "true";

        let label = "";

        if (filesystem.match(/(\/\w+)+/)) {
          label = filesystem.split("/").pop();
        } else {
          label = filesystem;
        }

        if (stats) {
          this._diskStatsBox.add_element(filesystem, label);
        }

        if (space) {
          this._diskSpaceBox.add_element(filesystem, label);
        }
      });

      this._diskStatsBox.add_single();
      this._diskStatsBox.update_mode(this._diskStatsMode);

      this._diskStatsBox.set_element_width(this._diskStatsWidth);
      this._diskSpaceBox.set_element_width(this._diskSpaceWidth);
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

      this._basicItemWidth(this._netEthWidth, this._ethValue);
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

      this._basicItemWidth(this._netWlanWidth, this._wlanValue);
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

      this._basicItemStatus(
        this._thermalCpuTemperatureStatus,
        !this._cpuStatus &&
        !this._cpuFrequencyStatus &&
        !this._cpuLoadAverageStatus,
        this._cpuIcon,
        this._cpuTemperatureValue,
        this._cpuTemperatureUnit,
        this._cpuTemperatureValueBracket
      );
    }

    _thermalCpuTemperatureWidthChanged() {
      this._thermalCpuTemperatureWidth = this._settings.get_int(
        THERMAL_CPU_TEMPERATURE_WIDTH
      );

      this._basicItemWidth(
        this._thermalCpuTemperatureWidth,
        this._cpuTemperatureValue
      );
    }

    _thermalCpuColorsChanged() {
      this._thermalCpuColors = this._settings.get_strv(THERMAL_CPU_COLORS);

      if (this._thermalCpuTemperatureStatus) {
        this._refreshCpuTemperatureValue();
      }
    }

    _thermalTemperatureUnitChanged() {
      this._thermalTemperatureUnit = this._settings.get_string(
        THERMAL_TEMPERATURE_UNIT
      );

      if (this._thermalCpuTemperatureStatus) {
        this._refreshCpuTemperatureValue();
      }
    }

    _thermalCpuTemperatureDevicesListChanged() {
      this._thermalCpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST
      );

      if (this._thermalCpuTemperatureStatus) {
        this._refreshCpuTemperatureValue();
      }
    }

    _thermalGpuTemperatureStatusChanged() {
      this._thermalGpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_GPU_TEMPERATURE_STATUS
      );

      this._basicItemStatus(
        this._gpuStatus || this._thermalGpuTemperatureStatus,
        !this._gpuStatus,
        this._gpuIcon,
        this._gpuBox
      );
      this._gpuDevicesListChanged();
    }

    _thermalGpuTemperatureWidthChanged() {
      this._thermalGpuTemperatureWidth = this._settings.get_int(
        THERMAL_GPU_TEMPERATURE_WIDTH
      );

      this._gpuBox.set_element_thermal_width(this._thermalGpuTemperatureWidth);
    }

    _thermalGpuColorsChanged() {
      this._thermalGpuColors = this._settings.get_strv(THERMAL_GPU_COLORS);

      if (this._thermalGpuTemperatureStatus) {
        this._refreshGpuValue();
      }
    }

    _thermalGpuTemperatureDevicesListChanged() {
      this._thermalGpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST
      );

      this._gpuDevicesListChanged();
    }

    _gpuStatusChanged() {
      this._gpuStatus = this._settings.get_boolean(GPU_STATUS);

      this._basicItemStatus(
        this._gpuStatus || this._thermalGpuTemperatureStatus,
        !this._thermalGpuTemperatureStatus,
        this._gpuIcon,
        this._gpuBox
      );
      this._gpuDevicesListChanged();
    }

    _gpuWidthChanged() {
      this._gpuWidth = this._settings.get_int(GPU_WIDTH);

      this._gpuBox.set_element_width(this._gpuWidth);
    }

    _gpuColorsChanged() {
      this._gpuColors = this._settings.get_strv(GPU_COLORS);

      if (this._gpuStatus) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryColorsChanged() {
      this._gpuMemoryColors = this._settings.get_strv(GPU_MEMORY_COLORS);

      if (this._gpuStatus) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryUnitTypeChanged() {
      this._gpuMemoryUnitType = this._settings.get_string(GPU_MEMORY_UNIT);

      if (this._gpuStatus) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryUnitMeasureChanged() {
      this._gpuMemoryUnitMeasure = this._settings.get_string(
        GPU_MEMORY_UNIT_MEASURE
      );

      if (this._gpuStatus) {
        this._refreshGpuValue();
      }
    }

    _gpuMemoryMonitorChanged() {
      this._gpuMemoryMonitor = this._settings.get_string(GPU_MEMORY_MONITOR);

      if (this._gpuStatus) {
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
      this._gpuDevicesList = this._settings.get_strv(GPU_DEVICES_LIST);

      this._gpuBox.cleanup_elements();

      this._gpuDevicesList.forEach((element) => {
        const it = element.split(GPU_DEVICES_LIST_SEPARATOR);

        const uuid = it[0];
        const name = this._gpuDisplayDeviceName ? it[1] : null;
        const usage = it[2] === "true" && this._gpuStatus;
        const memory = it[3] === "true" && this._gpuStatus;
        let thermal = false;

        if (this._thermalGpuTemperatureStatus) {
          this._thermalGpuTemperatureDevicesList.forEach((element) => {
            const it = element.split(GPU_DEVICES_LIST_SEPARATOR);

            if (uuid === it[0]) {
              thermal = it[2] === "true";
            }
          });
        }

        this._gpuBox.add_element(uuid, name, usage, memory, thermal);
      });

      this._gpuBox.set_element_width(this._gpuWidth);
    }

    _refreshHandler() {
      if (this._cpuStatus) {
        this._refreshCpuValue();
      }
      if (this._ramStatus) {
        this._refreshRamValue();
      }
      if (this._swapStatus) {
        this._refreshSwapValue();
      }
      if (this._diskStatsStatus) {
        this._refreshDiskStatsValue();
      }
      if (this._diskSpaceStatus) {
        this._refreshDiskSpaceValue();
      }
      if (this._netEthStatus) {
        this._refreshEthValue();
      }
      if (this._netWlanStatus) {
        this._refreshWlanValue();
      }
      if (this._cpuFrequencyStatus) {
        this._refreshCpuFrequencyValue();
      }
      if (this._cpuLoadAverageStatus) {
        this._refreshCpuLoadAverageValue();
      }
      if (this._thermalCpuTemperatureStatus) {
        this._refreshCpuTemperatureValue();
      }
      if (this._gpuStatus || this._thermalGpuTemperatureStatus) {
        this._refreshGpuValue();
      }

      return GLib.SOURCE_CONTINUE;
    }

    _refreshGui() {
      //this._onActiveConnectionAdded(client, activeConnection);

      //this._onActiveConnectionRemoved(client, activeConnection);

      //this._refreshTimeChanged();

      //this._decimalsStatusChanged();

      //this._leftClickStatusChanged();

      this._rightClickStatusChanged();

      this._iconsStatusChanged();

      //this._iconsPositionChanged();

      //this._itemsPositionChanged();

      this._cpuStatusChanged();

      this._cpuWidthChanged();

      this._cpuFrequencyStatusChanged();

      this._cpuFrequencyWidthChanged();

      //this._cpuFrequencyUnitMeasureChanged();

      this._cpuLoadAverageStatusChanged();

      this._cpuLoadAverageWidthChanged();

      this._ramStatusChanged();

      this._ramWidthChanged();

      //this._ramUnitTypeChanged();

      //this._ramUnitMeasureChanged();

      //this._ramMonitorChanged();

      //this._ramAlertChanged();

      //this._ramAlertThresholdChanged();

      this._swapStatusChanged();

      this._swapWidthChanged();

      //this._swapUnitTypeChanged();

      //this._swapUnitMeasureChanged();

      //this._swapMonitorChanged();

      //this._swapAlertChanged();

      //this._swapAlertThresholdChanged();

      this._diskStatsStatusChanged();

      this._diskStatsWidthChanged();

      this._diskStatsModeChanged();

      //this._diskStatsUnitMeasureChanged();

      this._diskSpaceStatusChanged();

      this._diskSpaceWidthChanged();

      //this._diskSpaceUnitTypeChanged();

      //this._diskSpaceUnitMeasureChanged();

      //this._diskSpaceMonitorChanged();

      this._diskDevicesListChanged();

      //this._netAutoHideStatusChanged();

      //this._netUnitChanged();

      //this._netUnitMeasureChanged();

      this._netEthStatusChanged();

      this._netEthWidthChanged();

      this._netWlanStatusChanged();

      this._netWlanWidthChanged();

      this._thermalCpuTemperatureStatusChanged();

      this._thermalCpuTemperatureWidthChanged();

      //this._thermalCpuTemperatureUnitChanged();

      //this._thermalCpuTemperatureDevicesListChanged();

      this._thermalGpuTemperatureStatusChanged();

      this._thermalGpuTemperatureWidthChanged();

      //this._thermalGpuTemperatureDevicesListChanged();

      this._gpuStatusChanged();

      this._gpuWidthChanged();

      //this._gpuMemoryUnitTypeChanged();

      //this._gpuMemoryUnitMeasureChanged();

      //this._gpuMemoryMonitorChanged();

      //this._gpuDisplayDeviceNameChanged();

      this._gpuDevicesListChanged();
    }

    _refreshCpuValue() {
      this._loadFile("/proc/stat").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        const entry = lines[0].trim().split(/\s+/);
        let cpuTot = 0;
        const idle = parseInt(entry[4]);

        // user sys nice idle iowait
        for (let i = 1; i < 5; i++) cpuTot += parseInt(entry[i]);

        const delta = cpuTot - this._cpuTotOld;
        const deltaIdle = idle - this._cpuIdleOld;

        const cpuCurr = (100 * (delta - deltaIdle)) / delta;

        this._cpuTotOld = cpuTot;
        this._cpuIdleOld = idle;

        if (this._cpuColors.length > 0) {
          for (let i = 0; i < this._cpuColors.length; i++) {
            const item = this._cpuColors[i];
            const values = item.split(COLOR_LIST_SEPARATOR);

            if (cpuCurr <= parseFloat(values[0])) {
              this._cpuValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
              break;
            }
          }
        } else {
          this._cpuValue.style = "";
        }

        if (this._decimalsStatus) {
          this._cpuValue.text = `${cpuCurr.toFixed(1)}`;
        } else {
          this._cpuValue.text = `${cpuCurr.toFixed(0)}`;
        }
      });
    }

    _refreshRamValue() {
      this._loadFile("/proc/meminfo").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        let total, available, used;

        for (let i = 0; i < 3; i++) {
          const line = lines[i];
          let values;

          if (line.match(/^MemTotal/)) {
            values = line.match(/^MemTotal:\s*([^ ]*)\s*([^ ]*)$/);
            total = parseInt(values[1]);
          } else if (line.match(/^MemAvailable/)) {
            values = line.match(/^MemAvailable:\s*([^ ]*)\s*([^ ]*)$/);
            available = parseInt(values[1]);
          }
        }

        used = total - available;

        if (this._ramAlert) {
          if (((100 * available) / total).toFixed(0) < this._ramAlertThreshold) {
            Main.notify('Resource Monitor - Low Memory Alert', `Available RAM has dropped below ${this._ramAlertThreshold}%. Please take action to free up memory.`);
          }
        }

        let value = 0;
        let unit = "KB";
        switch (this._ramMonitor) {
          case "free":
            value = available;

            break;

          case "used":

          default:
            value = used;

            break;
        }

        switch (this._ramUnitType) {
          case "perc":
            if (this._ramColors.length > 0) {
              for (let i = 0; i < this._ramColors.length; i++) {
                const item = this._ramColors[i];
                const values = item.split(COLOR_LIST_SEPARATOR);

                if (((100 * value) / total) <= parseFloat(values[0])) {
                  this._ramValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                  break;
                }
              }
            } else {
              this._ramValue.style = "";
            }

            if (this._decimalsStatus) {
              this._ramValue.text = `${((100 * value) / total).toFixed(1)}`;
            } else {
              this._ramValue.text = `${((100 * value) / total).toFixed(0)}`;
            }

            this._ramUnit.text = "%";

            break;

          case "numeric":

          default:
            switch (this._ramUnitMeasure) {
              case "k":
                unit = "KB";
                break;

              case "m":
                unit = "MB";
                value /= 1000;
                break;

              case "g":
                unit = "GB";
                value /= 1000;
                value /= 1000;
                break;

              case "t":
                unit = "TB";
                value /= 1000;
                value /= 1000;
                value /= 1000;
                break;

              case "auto":

              default:
                if (value > 1000) {
                  unit = "MB";
                  value /= 1000;
                  if (value > 1000) {
                    unit = "GB";
                    value /= 1000;
                    if (value > 1000) {
                      unit = "TB";
                      value /= 1000;
                    }
                  }
                } else {
                  unit = "KB";
                }

                break;
            }

            if (this._ramColors.length > 0) {
              for (let i = 0; i < this._ramColors.length; i++) {
                const item = this._ramColors[i];
                const values = item.split(COLOR_LIST_SEPARATOR);

                if (value <= parseFloat(values[0])) {
                  this._ramValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                  break;
                }
              }
            } else {
              this._ramValue.style = "";
            }

            if (this._decimalsStatus) {
              this._ramValue.text = `${value.toFixed(1)}`;
            } else {
              this._ramValue.text = `${value.toFixed(0)}`;
            }

            this._ramUnit.text = unit;

            break;
        }
      });
    }

    _refreshSwapValue() {
      this._loadFile("/proc/meminfo").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        let total, available, used;

        for (let i = 0; i < 16; i++) {
          const line = lines[i];
          let values;

          if (line.match(/^SwapTotal/)) {
            values = line.match(/^SwapTotal:\s*([^ ]*)\s*([^ ]*)$/);
            total = parseInt(values[1]);
          } else if (line.match(/^SwapFree/)) {
            values = line.match(/^SwapFree:\s*([^ ]*)\s*([^ ]*)$/);
            available = parseInt(values[1]);
          }
        }

        used = total - available;

        if (this._swapAlert) {
          if (((100 * available) / total).toFixed(0) < this._swapAlertThreshold) {
            Main.notify('Resource Monitor - Low Memory Alert', `Available SWAP has dropped below ${this._swapAlertThreshold}%. Please take action to free up memory.`);
          }
        }

        let value = 0;
        let unit = "KB";
        switch (this._swapMonitor) {
          case "free":
            value = available;

            break;

          case "used":

          default:
            value = used;

            break;
        }

        switch (this._swapUnitType) {
          case "perc":
            if (this._swapColors.length > 0) {
              for (let i = 0; i < this._swapColors.length; i++) {
                const item = this._swapColors[i];
                const values = item.split(COLOR_LIST_SEPARATOR);

                if (((100 * value) / total) <= parseFloat(values[0])) {
                  this._swapValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                  break;
                }
              }
            } else {
              this._swapValue.style = "";
            }

            if (this._decimalsStatus) {
              this._swapValue.text = `${((100 * value) / total).toFixed(1)}`;
            } else {
              this._swapValue.text = `${((100 * value) / total).toFixed(0)}`;
            }

            this._swapUnit.text = "%";

            break;

          case "numeric":

          default:
            switch (this._swapUnitMeasure) {
              case "k":
                unit = "KB";
                break;

              case "m":
                unit = "MB";
                value /= 1000;
                break;

              case "g":
                unit = "GB";
                value /= 1000;
                value /= 1000;
                break;

              case "t":
                unit = "TB";
                value /= 1000;
                value /= 1000;
                value /= 1000;
                break;

              case "auto":

              default:
                if (value > 1000) {
                  unit = "MB";
                  value /= 1000;
                  if (value > 1000) {
                    unit = "GB";
                    value /= 1000;
                    if (value > 1000) {
                      unit = "TB";
                      value /= 1000;
                    }
                  }
                } else {
                  unit = "KB";
                }

                break;
            }

            if (this._swapColors.length > 0) {
              for (let i = 0; i < this._swapColors.length; i++) {
                const item = this._swapColors[i];
                const values = item.split(COLOR_LIST_SEPARATOR);

                if (value <= parseFloat(values[0])) {
                  this._swapValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                  break;
                }
              }
            } else {
              this._swapValue.style = "";
            }

            if (this._decimalsStatus) {
              this._swapValue.text = `${value.toFixed(1)}`;
            } else {
              this._swapValue.text = `${value.toFixed(0)}`;
            }

            this._swapUnit.text = unit;

            break;
        }
      });
    }

    _refreshDiskStatsValue() {
      this._loadFile("/proc/diskstats").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        switch (this._diskStatsMode) {
          case "single":
            let rwTot = [0, 0];
            let rw = [0, 0];

            const filesystem = "single";

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i];
              const entry = line.trim().split(/\s+/);

              if (entry[2].match(/loop*/)) {
                continue;
              }

              // Found
              if (this._diskStatsBox.get_filesystem(entry[2])) {
                rwTot[0] += parseInt(entry[5]);
                rwTot[1] += parseInt(entry[9]);

                // sector is 512 bytes
                // 1 kilobyte = 2 sectors
                rwTot[0] /= 2;
                rwTot[1] /= 2;
              }
            }

            const idle = GLib.get_monotonic_time() / 1000;
            const delta =
              (idle - this._diskStatsBox.get_idle(filesystem)) / 1000;
            this._diskStatsBox.set_idle(filesystem, idle);

            let unit = "";

            if (delta > 0) {
              const rwTotOld = this._diskStatsBox.get_rw_tot(filesystem);
              for (let i = 0; i < 2; i++) {
                rw[i] = (rwTot[i] - rwTotOld[i]) / delta;
              }
              this._diskStatsBox.set_rw_tot(filesystem, rwTot);

              switch (this._diskStatsUnitMeasure) {
                case "k":
                  unit = "K";
                  break;

                case "m":
                  unit = "M";
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  break;

                case "g":
                  unit = "G";
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  break;

                case "t":
                  unit = "T";
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  rw[0] /= 1024;
                  rw[1] /= 1024;
                  break;

                case "auto":

                default:
                  if (rw[0] > 1024 || rw[1] > 1024) {
                    unit = "M";
                    rw[0] /= 1024;
                    rw[1] /= 1024;
                    if (rw[0] > 1024 || rw[1] > 1024) {
                      unit = "G";
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      if (rw[0] > 1024 || rw[1] > 1024) {
                        unit = "T";
                        rw[0] /= 1024;
                        rw[1] /= 1024;
                      }
                    }
                  } else {
                    unit = "K";
                  }

                  break;
              }
            }

            let style = "";
            if (this._diskStatsColors.length > 0) {
              for (let i = 0; i < this._diskStatsColors.length; i++) {
                const item = this._diskStatsColors[i];
                const values = item.split(COLOR_LIST_SEPARATOR);

                if (rw[0] <= parseFloat(values[0]) || rw[1] <= parseFloat(values[0])) {
                  style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                  break;
                }
              }
            } else {
              style = "";
            }

            if (this._decimalsStatus) {
              this._diskStatsBox.update_element_value(
                filesystem,
                `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`,
                unit,
                style
              );
            } else {
              this._diskStatsBox.update_element_value(
                filesystem,
                `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`,
                unit,
                style
              );
            }

            break;

          case "multiple":

          default:
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i];
              const entry = line.trim().split(/\s+/);

              if (entry[2].match(/loop*/)) {
                continue;
              }

              const filesystem = this._diskStatsBox.get_filesystem(entry[2]);
              // Found
              if (filesystem) {
                let rwTot = [0, 0];
                let rw = [0, 0];

                rwTot[0] += parseInt(entry[5]);
                rwTot[1] += parseInt(entry[9]);

                // sector is 512 bytes
                // 1 kilobyte = 2 sectors
                rwTot[0] /= 2;
                rwTot[1] /= 2;

                const idle = GLib.get_monotonic_time() / 1000;
                const delta =
                  (idle - this._diskStatsBox.get_idle(filesystem)) / 1000;
                this._diskStatsBox.set_idle(filesystem, idle);

                let unit = "";

                if (delta > 0) {
                  const rwTotOld = this._diskStatsBox.get_rw_tot(filesystem);
                  for (let i = 0; i < 2; i++) {
                    rw[i] = (rwTot[i] - rwTotOld[i]) / delta;
                  }
                  this._diskStatsBox.set_rw_tot(filesystem, rwTot);

                  switch (this._diskStatsUnitMeasure) {
                    case "k":
                      unit = "K";
                      break;

                    case "m":
                      unit = "M";
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      break;

                    case "g":
                      unit = "G";
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      break;

                    case "t":
                      unit = "T";
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      rw[0] /= 1024;
                      rw[1] /= 1024;
                      break;

                    case "auto":

                    default:
                      if (rw[0] > 1024 || rw[1] > 1024) {
                        unit = "M";
                        rw[0] /= 1024;
                        rw[1] /= 1024;
                        if (rw[0] > 1024 || rw[1] > 1024) {
                          unit = "G";
                          rw[0] /= 1024;
                          rw[1] /= 1024;
                          if (rw[0] > 1024 || rw[1] > 1024) {
                            unit = "T";
                            rw[0] /= 1024;
                            rw[1] /= 1024;
                          }
                        }
                      } else {
                        unit = "K";
                      }

                      break;
                  }
                }

                let style = "";
                if (this._diskStatsColors.length > 0) {
                  for (let i = 0; i < this._diskStatsColors.length; i++) {
                    const item = this._diskStatsColors[i];
                    const values = item.split(COLOR_LIST_SEPARATOR);

                    if (rw[0] <= parseFloat(values[0]) || rw[1] <= parseFloat(values[0])) {
                      style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                      break;
                    }
                  }
                } else {
                  style = "";
                }

                if (this._decimalsStatus) {
                  this._diskStatsBox.update_element_value(
                    filesystem,
                    `${rw[0].toFixed(1)}|${rw[1].toFixed(1)}`,
                    unit,
                    style
                  );
                } else {
                  this._diskStatsBox.update_element_value(
                    filesystem,
                    `${rw[0].toFixed(0)}|${rw[1].toFixed(0)}`,
                    unit,
                    style
                  );
                }
              } else {
                // Not found
                this._diskStatsBox.update_element_value(
                  filesystem,
                  "--|--",
                  "",
                  ""
                );
              }
            }

            break;
        }
      });
    }

    _refreshDiskSpaceValue() {
      this._executeCommand([
        "df",
        "-BKB",
        "-x",
        "squashfs",
        "-x",
        "tmpfs",
      ]).then((output) => {
        const lines = output.split("\n");

        // Excludes the first line of output
        for (let i = 1; i < lines.length - 1; i++) {
          const line = lines[i];
          const entry = line.trim().split(/\s+/);

          const filesystem = entry[0];

          let value = "";
          let unit = "KB";
          let style = "";
          switch (this._diskSpaceUnitType) {
            case "perc":
              const used = `${entry[4].slice(0, -1)}`;

              switch (this._diskSpaceMonitor) {
                case "free":
                  value = (100 - parseInt(used)).toString();

                  break;

                case "used":

                default:
                  value = used;

                  break;
              }

              if (this._diskSpaceColors.length > 0) {
                for (let i = 0; i < this._diskSpaceColors.length; i++) {
                  const item = this._diskSpaceColors[i];
                  const values = item.split(COLOR_LIST_SEPARATOR);

                  if (value <= parseFloat(values[0])) {
                    style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                    break;
                  }
                }
              } else {
                style = "";
              }

              this._diskSpaceBox.update_element_value(filesystem, value, "%", style);

              break;

            case "numeric":

            default:
              switch (this._diskSpaceMonitor) {
                case "free":
                  value = parseInt(entry[3].slice(0, -2));

                  break;

                case "used":

                default:
                  value = parseInt(entry[2].slice(0, -2));

                  break;
              }

              switch (this._diskSpaceUnitMeasure) {
                case "k":
                  unit = "KB";
                  break;

                case "m":
                  unit = "MB";
                  value /= 1000;
                  break;

                case "g":
                  unit = "GB";
                  value /= 1000;
                  value /= 1000;
                  break;

                case "t":
                  unit = "TB";
                  value /= 1000;
                  value /= 1000;
                  value /= 1000;
                  break;

                case "auto":

                default:
                  if (value > 1000) {
                    unit = "MB";
                    value /= 1000;
                    if (value > 1000) {
                      unit = "GB";
                      value /= 1000;
                      if (value > 1000) {
                        unit = "TB";
                        value /= 1000;
                      }
                    }
                  } else {
                    unit = "KB";
                  }

                  break;
              }

              if (this._diskSpaceColors.length > 0) {
                for (let i = 0; i < this._diskSpaceColors.length; i++) {
                  const item = this._diskSpaceColors[i];
                  const values = item.split(COLOR_LIST_SEPARATOR);

                  if (value <= parseFloat(values[0])) {
                    style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                    break;
                  }
                }
              } else {
                style = "";
              }

              if (this._decimalsStatus) {
                this._diskSpaceBox.update_element_value(
                  filesystem,
                  `${value.toFixed(1)}`,
                  unit,
                  style
                );
              } else {
                this._diskSpaceBox.update_element_value(
                  filesystem,
                  `${value.toFixed(0)}`,
                  unit,
                  style
                );
              }

              break;
          }
        }
      });
    }

    _refreshEthValue() {
      this._loadFile("/proc/net/dev").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        let duTot = [0, 0];
        let du = [0, 0];

        // Excludes the first two lines of output
        for (let i = 2; i < lines.length - 1; i++) {
          const line = lines[i];
          const entry = line.trim().split(":");
          if (entry[0].match(/(eth[0-9]+|en[a-z0-9]*)/)) {
            const values = entry[1].trim().split(/\s+/);

            duTot[0] += parseInt(values[0]);
            duTot[1] += parseInt(values[8]);
          }
        }

        const idle = GLib.get_monotonic_time() / 1000;
        const delta = (idle - this._ethIdleOld) / 1000;

        // True bits
        // False Bytes
        const boolUnit = this._netUnit === "bits";

        const factor = boolUnit ? 8 : 1;

        if (delta > 0) {
          for (let i = 0; i < 2; i++) {
            du[i] = ((duTot[i] - this._duTotEthOld[i]) * factor) / delta;
            this._duTotEthOld[i] = duTot[i];
          }

          switch (this._netUnitMeasure) {
            case "b":
              this._ethUnit.text = boolUnit ? "b" : "B";
              break;

            case "k":
              this._ethUnit.text = boolUnit ? "k" : "K";
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "m":
              this._ethUnit.text = boolUnit ? "m" : "M";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "g":
              this._ethUnit.text = boolUnit ? "g" : "G";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "t":
              this._ethUnit.text = boolUnit ? "t" : "T";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "auto":

            default:
              if (du[0] > 1024 || du[1] > 1024) {
                this._ethUnit.text = boolUnit ? "k" : "K";
                du[0] /= 1024;
                du[1] /= 1024;
                if (du[0] > 1024 || du[1] > 1024) {
                  this._ethUnit.text = boolUnit ? "m" : "M";
                  du[0] /= 1024;
                  du[1] /= 1024;
                  if (du[0] > 1024 || du[1] > 1024) {
                    this._ethUnit.text = boolUnit ? "g" : "G";
                    du[0] /= 1024;
                    du[1] /= 1024;
                    if (du[0] > 1024 || du[1] > 1024) {
                      this._ethUnit.text = boolUnit ? "t" : "T";
                      du[0] /= 1024;
                      du[1] /= 1024;
                    }
                  }
                }
              } else {
                this._ethUnit.text = boolUnit ? "b" : "B";
              }

              break;
          }
        }

        this._ethIdleOld = idle;

        if (this._netEthColors.length > 0) {
          for (let i = 0; i < this._netEthColors.length; i++) {
            const item = this._netEthColors[i];
            const values = item.split(COLOR_LIST_SEPARATOR);

            if (du[0] <= parseFloat(values[0]) || du[1] <= parseFloat(values[0])) {
              this._ethValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
              break;
            }
          }
        } else {
          this._ethValue.style = "";
        }

        if (this._decimalsStatus) {
          this._ethValue.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
        } else {
          this._ethValue.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
        }
      });
    }

    _refreshWlanValue() {
      this._loadFile("/proc/net/dev").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        let duTot = [0, 0];
        let du = [0, 0];

        // Excludes the first two lines of output
        for (let i = 2; i < lines.length - 1; i++) {
          const line = lines[i];
          const entry = line.trim().split(":");
          if (entry[0].match(/(wlan[0-9]+|wl[a-z0-9]*)/)) {
            const values = entry[1].trim().split(/\s+/);

            duTot[0] += parseInt(values[0]);
            duTot[1] += parseInt(values[8]);
          }
        }

        const idle = GLib.get_monotonic_time() / 1000;
        const delta = (idle - this._wlanIdleOld) / 1000;

        // True bits
        // False Bytes
        const boolUnit = this._netUnit === "bits";

        const factor = boolUnit ? 8 : 1;

        if (delta > 0) {
          for (let i = 0; i < 2; i++) {
            du[i] = ((duTot[i] - this._duTotWlanOld[i]) * factor) / delta;
            this._duTotWlanOld[i] = duTot[i];
          }

          switch (this._netUnitMeasure) {
            case "b":
              this._wlanUnit.text = boolUnit ? "b" : "B";
              break;

            case "k":
              this._wlanUnit.text = boolUnit ? "k" : "K";
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "m":
              this._wlanUnit.text = boolUnit ? "m" : "M";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "g":
              this._wlanUnit.text = boolUnit ? "g" : "G";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "t":
              this._wlanUnit.text = boolUnit ? "t" : "T";
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              du[0] /= 1024;
              du[1] /= 1024;
              break;

            case "auto":

            default:
              if (du[0] > 1024 || du[1] > 1024) {
                this._wlanUnit.text = boolUnit ? "k" : "K";
                du[0] /= 1024;
                du[1] /= 1024;
                if (du[0] > 1024 || du[1] > 1024) {
                  this._wlanUnit.text = boolUnit ? "m" : "M";
                  du[0] /= 1024;
                  du[1] /= 1024;
                  if (du[0] > 1024 || du[1] > 1024) {
                    this._wlanUnit.text = boolUnit ? "g" : "G";
                    du[0] /= 1024;
                    du[1] /= 1024;
                    if (du[0] > 1024 || du[1] > 1024) {
                      this._wlanUnit.text = boolUnit ? "t" : "T";
                      du[0] /= 1024;
                      du[1] /= 1024;
                    }
                  }
                }
              } else {
                this._wlanUnit.text = boolUnit ? "b" : "B";
              }

              break;
          }
        }

        this._wlanIdleOld = idle;

        if (this._netWlanColors.length > 0) {
          for (let i = 0; i < this._netWlanColors.length; i++) {
            const item = this._netWlanColors[i];
            const values = item.split(COLOR_LIST_SEPARATOR);

            if (du[0] <= parseFloat(values[0]) || du[1] <= parseFloat(values[0])) {
              this._wlanValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
              break;
            }
          }
        } else {
          this._wlanValue.style = "";
        }

        if (this._decimalsStatus) {
          this._wlanValue.text = `${du[0].toFixed(1)}|${du[1].toFixed(1)}`;
        } else {
          this._wlanValue.text = `${du[0].toFixed(0)}|${du[1].toFixed(0)}`;
        }
      });
    }

    _refreshCpuFrequencyValue() {
      this._executeCommand([
        "bash",
        "-c",
        "cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq"
      ]).then((output) => {
        const lines = output.split("\n");

        let value = 0;
        let unit = "";
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          const entry = parseInt(line.trim());

          // max_freq
          if (entry > value) {
            value = entry;
          }
        }

        switch (this._cpuFrequencyUnitMeasure) {
          case "k":
            unit = "KHz";
            break;

          case "m":
            unit = "MHz";
            value /= 1000;
            break;

          case "g":
            unit = "GHz";
            value /= 1000;
            value /= 1000;
            break;

          case "auto":

          default:
            if (value > 1000) {
              unit = "MHz";
              value /= 1000;
              if (value > 1000) {
                unit = "GHz";
                value /= 1000;
              }
            } else {
              unit = "KHz";
            }

            break;
        }

        this._cpuFrequencyUnit.text = unit;

        if (this._cpuFrequencyColors.length > 0) {
          for (let i = 0; i < this._cpuFrequencyColors.length; i++) {
            const item = this._cpuFrequencyColors[i];
            const values = item.split(COLOR_LIST_SEPARATOR);

            if (value <= parseFloat(values[0])) {
              this._cpuFrequencyValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
              break;
            }
          }
        } else {
          this._cpuFrequencyValue.style = "";
        }

        if (this._decimalsStatus) {
          this._cpuFrequencyValue.text = `[${value.toFixed(2)}`;
        } else {
          this._cpuFrequencyValue.text = `[${value.toFixed(0)}`;
        }
      });
    }

    _refreshCpuLoadAverageValue() {
      this._loadFile("/proc/loadavg").then((contents) => {
        const lines = new TextDecoder().decode(contents).split("\n");

        const entry = lines[0].trim().split(/\s/);

        const l0 = entry[0];
        const l1 = entry[1];
        const l2 = entry[2];

        if (this._cpuLoadAverageColors.length > 0) {
          for (let i = 0; i < this._cpuLoadAverageColors.length; i++) {
            const item = this._cpuLoadAverageColors[i];
            const values = item.split(COLOR_LIST_SEPARATOR);

            if (l0 <= parseFloat(values[0] || l1 <= parseFloat(values[0]) || l2 <= parseFloat(values[0]))) {
              this._cpuLoadAverageValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
              break;
            }
          }
        } else {
          this._cpuLoadAverageValue.style = "";
        }

        this._cpuLoadAverageValue.text = "[" + l0 + " " + l1 + " " + l2 + "]";
      });
    }

    _refreshCpuTemperatureValue() {
      if (this._thermalCpuTemperatureDevicesList.length > 0) {
        for (
          let i = 0;
          i < this._thermalCpuTemperatureDevicesList.length;
          i++
        ) {
          const element = this._thermalCpuTemperatureDevicesList[i];
          const it = element.split(
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR
          );

          const status = it[1];
          const path = it[2];

          if (status === "false") {
            continue;
          }

          if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
            this._loadFile(path).then((contents) => {
              const value = parseInt(new TextDecoder().decode(contents));

              this._cpuTemperatures += value / 1000;
              this._cpuTemperaturesReads++;

              if (
                this._cpuTemperaturesReads >=
                this._thermalCpuTemperatureDevicesList.length
              ) {
                // Temperatures Average
                this._cpuTemperatures /= this._cpuTemperaturesReads;

                switch (this._thermalTemperatureUnit) {
                  case "f":
                    this._cpuTemperatures = this._cpuTemperatures * 1.8 + 32;
                    this._cpuTemperatureUnit.text = "°F";

                    break;

                  case "c":

                  default:
                    this._cpuTemperatureUnit.text = "°C";

                    break;
                }

                if (this._thermalCpuColors.length > 0) {
                  for (let i = 0; i < this._thermalCpuColors.length; i++) {
                    const item = this._thermalCpuColors[i];
                    const values = item.split(COLOR_LIST_SEPARATOR);

                    if (this._cpuTemperatures <= parseFloat(values[0])) {
                      this._cpuTemperatureValue.style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                      break;
                    }
                  }
                } else {
                  this._cpuTemperatureValue.style = "";
                }

                if (this._decimalsStatus) {
                  this._cpuTemperatureValue.text = `[${this._cpuTemperatures.toFixed(
                    1
                  )}`;
                } else {
                  this._cpuTemperatureValue.text = `[${this._cpuTemperatures.toFixed(
                    0
                  )}`;
                }

                this._cpuTemperatures = 0;
                this._cpuTemperaturesReads = 0;
              }
            });
          } else {
            this._cpuTemperatureValue.text = _("[Temperature Error");
            this._cpuTemperatureUnit.text = "";
          }
        }
      } else {
        this._cpuTemperatureValue.text = _("[--");
      }
    }

    _refreshGpuValue() {
      this._executeCommand([
        "nvidia-smi",
        "--query-gpu=uuid,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
        "--format=csv,noheader",
      ]).then((output) => {
        const lines = output.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          const entry = line.trim().split(/\,\s/);

          const uuid = entry[0];
          let memoryTotal = entry[1].slice(0, -4);
          let memoryUsed = entry[2].slice(0, -4);
          let memoryFree = entry[3].slice(0, -4);
          const usage = entry[4].slice(0, -1);
          const temperature = entry[5];

          // mebibyte
          memoryTotal = parseInt(memoryTotal);
          memoryUsed = parseInt(memoryUsed);
          memoryFree = parseInt(memoryFree);

          // kibibyte
          memoryTotal *= 1024;
          memoryUsed *= 1024;
          memoryFree *= 1024;

          // kilobyte
          memoryTotal *= 1.024;
          memoryUsed *= 1.024;
          memoryFree *= 1.024;

          let style = "";
          if (this._gpuColors.length > 0) {
            for (let i = 0; i < this._gpuColors.length; i++) {
              const item = this._gpuColors[i];
              const values = item.split(COLOR_LIST_SEPARATOR);

              if (usage <= parseFloat(values[0])) {
                style = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                break;
              }
            }
          } else {
            style = "";
          }

          this._gpuBox.update_element_value(uuid, usage, "%", style);

          let value = 0;
          let unit = "KB";
          switch (this._gpuMemoryUnitType) {
            case "perc":
              const used = (100 * memoryUsed) / memoryTotal;
              unit = "%";

              switch (this._gpuMemoryMonitor) {
                case "free":
                  value = 100 - used;

                  break;

                case "used":

                default:
                  value = used;

                  break;
              }

              break;

            case "numeric":

            default:
              switch (this._gpuMemoryMonitor) {
                case "free":
                  value = memoryFree;

                  break;

                case "used":

                default:
                  value = memoryUsed;

                  break;
              }

              switch (this._gpuMemoryUnitMeasure) {
                case "k":
                  unit = "KB";
                  break;

                case "m":
                  unit = "MB";
                  value /= 1000;

                  break;

                case "g":
                  unit = "GB";
                  value /= 1000;
                  value /= 1000;

                  break;

                case "t":
                  unit = "TB";
                  value /= 1000;
                  value /= 1000;
                  value /= 1000;

                  break;

                case "auto":

                default:
                  if (value > 1000) {
                    unit = "MB";
                    value /= 1000;
                    if (value > 1000) {
                      unit = "GB";
                      value /= 1000;
                      if (value > 1000) {
                        unit = "TB";
                        value /= 1000;
                      }
                    }
                  } else {
                    unit = "KB";
                  }

                  break;
              }

              break;
          }

          let valueT = parseInt(temperature);
          let unitT = "°C";
          switch (this._thermalTemperatureUnit) {
            case "f":
              valueT = valueT * 1.8 + 32;
              unitT = "°F";

              break;

            case "c":

            default:
              unitT = "°C";

              break;
          }

          let styleM = "";
          if (this._gpuMemoryColors.length > 0) {
            for (let i = 0; i < this._gpuMemoryColors.length; i++) {
              const item = this._gpuMemoryColors[i];
              const values = item.split(COLOR_LIST_SEPARATOR);

              if (usage <= parseFloat(values[0])) {
                styleM = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                break;
              }
            }
          } else {
            styleM = "";
          }

          let styleT = "";
          if (this._thermalGpuColors.length > 0) {
            for (let i = 0; i < this._thermalGpuColors.length; i++) {
              const item = this._thermalGpuColors[i];
              const values = item.split(COLOR_LIST_SEPARATOR);

              if (usage <= parseFloat(values[0])) {
                styleT = `color: rgb(${(parseFloat(values[1]) * 255).toFixed(0)}, ${(parseFloat(values[2]) * 255).toFixed(0)}, ${(parseFloat(values[3]) * 255).toFixed(0)});`;
                break;
              }
            }
          } else {
            styleT = "";
          }

          if (this._decimalsStatus) {
            this._gpuBox.update_element_memory_value(
              uuid,
              `${value.toFixed(1)}`,
              unit,
              styleM
            );
            this._gpuBox.update_element_thermal_value(
              uuid,
              `${valueT.toFixed(1)}`,
              unitT,
              styleT
            );
          } else {
            this._gpuBox.update_element_memory_value(
              uuid,
              `${value.toFixed(0)}`,
              unit,
              styleM
            );
            this._gpuBox.update_element_thermal_value(
              uuid,
              `${valueT.toFixed(0)}`,
              unitT,
              styleT
            );
          }
        }
      });
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

    _loadContents(file, cancellable = null) {
      return new Promise((resolve, reject) => {
        file.load_contents_async(cancellable, (source_object, res) => {
          try {
            const [ok, contents, etag_out] = source_object.load_contents_finish(res);
            if (ok) {
              resolve(contents);
            } else {
              reject(new Error("Failed to load contents"));
            }
          } catch (error) {
            reject(new Error(`Error in load_contents_finish: ${error.message}`));
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
            const [ok, stdout, stderr] = source_object.communicate_utf8_finish(res);
            if (ok) {
              resolve(stdout);
            } else {
              reject(new Error(`Process failed with error: ${stderr}`));
            }
          } catch (error) {
            reject(new Error(`Error in communicate_utf8_finish: ${error.message}`));
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
        console.error(`[Resource_Monitor] Execute Command Error: ${error.message}`);
      }
    }
  }
);

const DiskContainer = GObject.registerClass(
  class DiskContainer extends St.BoxLayout {
    _init() {
      super._init();

      this._elementsPath = [];
      this._elementsName = [];
      this._elementsLabel = [];
      this._elementsValue = [];
      this._elementsUnit = [];
    }

    set_element_width(width) {
      if (width === 0) {
        this._elementsPath.forEach((element) => {
          this._elementsValue[element].min_width = 0;
          this._elementsValue[element].natural_width = 0;
          this._elementsValue[element].min_width_set = false;
          this._elementsValue[element].natural_width_set = false;
        });
      } else {
        this._elementsPath.forEach((element) => {
          this._elementsValue[element].width = width;
        });
      }
    }

    cleanup_elements() {
      this._elementsPath = [];
      this._elementsName = [];
      this._elementsLabel = [];
      this._elementsValue = [];
      this._elementsUnit = [];

      this.remove_all_children();
    }
  }
);

const DiskContainerStats = GObject.registerClass(
  class DiskContainerStats extends DiskContainer {
    _init() {
      super._init();

      this.idleOld = [];
      this.rwTotOld = [];

      this.add_single();
    }

    add_single() {
      this._elementsPath.push("single");

      this._elementsValue["single"] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._elementsValue["single"].set_style("text-align: right;");

      this._elementsUnit["single"] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._elementsUnit["single"].set_style("padding-left: 0.125em;");

      this.add_child(this._elementsValue["single"]);
      this.add_child(this._elementsUnit["single"]);

      this.idleOld["single"] = 0;
      this.rwTotOld["single"] = [0, 0];
    }

    add_element(filesystem, label) {
      this._elementsPath.push(filesystem);

      this._elementsName[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ` ${label}: `,
      });

      this._elementsValue[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._elementsValue[filesystem].set_style("text-align: right;");

      this._elementsUnit[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._elementsUnit[filesystem].set_style("padding-left: 0.125em;");

      this.add_child(this._elementsName[filesystem]);
      this.add_child(this._elementsValue[filesystem]);
      this.add_child(this._elementsUnit[filesystem]);

      this.idleOld[filesystem] = 0;
      this.rwTotOld[filesystem] = [0, 0];
    }

    update_mode(mode) {
      switch (mode) {
        case "single":
          this._elementsPath.forEach((element) => {
            if (element !== "single") {
              this._elementsName[element].hide();
              this._elementsValue[element].hide();
              this._elementsUnit[element].hide();
            } else {
              this._elementsValue[element].show();
              this._elementsUnit[element].show();
            }
          });

          break;

        case "multiple":

        default:
          this._elementsPath.forEach((element) => {
            if (element !== "single") {
              this._elementsName[element].show();
              this._elementsValue[element].show();
              this._elementsUnit[element].show();
            } else {
              this._elementsValue[element].hide();
              this._elementsUnit[element].hide();
            }
          });

          break;
      }
    }

    get_filesystem(name) {
      return this._elementsPath.filter((item) => item.endsWith(name)).shift();
    }

    get_idle(filesystem) {
      return this.idleOld[filesystem];
    }

    get_rw_tot(filesystem) {
      return this.rwTotOld[filesystem];
    }

    set_idle(filesystem, idle) {
      this.idleOld[filesystem] = idle;
    }

    set_rw_tot(filesystem, rwTot) {
      this.rwTotOld[filesystem] = rwTot;
    }

    update_element_value(filesystem, value, unit, style = "") {
      if (this._elementsValue[filesystem]) {
        this._elementsValue[filesystem].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsUnit[filesystem].text = unit;
      }
    }
  }
);

const DiskContainerSpace = GObject.registerClass(
  class DiskContainerSpace extends DiskContainer {
    add_element(filesystem, label) {
      this._elementsPath.push(filesystem);

      this._elementsName[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ` ${label}: `,
      });

      this._elementsValue[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._elementsValue[filesystem].set_style("text-align: right;");

      this._elementsUnit[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: this._diskSpaceUnitType ? "%" : "KB",
      });
      this._elementsUnit[filesystem].set_style("padding-left: 0.125em;");

      this.add_child(this._elementsName[filesystem]);
      this.add_child(this._elementsValue[filesystem]);
      this.add_child(this._elementsUnit[filesystem]);
    }

    update_element_value(filesystem, value, unit, style = "") {
      if (this._elementsValue[filesystem]) {
        this._elementsValue[filesystem].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsUnit[filesystem].text = unit;
      }
    }
  }
);

const GpuContainer = GObject.registerClass(
  class GpuContainer extends St.BoxLayout {
    _init() {
      super._init();

      this._elementsUuid = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];
      this._elementsMemoryValue = [];
      this._elementsMemoryUnit = [];
      this._elementsThermalValue = [];
      this._elementsThermalUnit = [];
    }

    set_element_width(width) {
      if (width === 0) {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsValue[element] !== "undefined") {
            this._elementsValue[element].min_width = 0;
            this._elementsValue[element].natural_width = 0;
            this._elementsValue[element].min_width_set = false;
            this._elementsValue[element].natural_width_set = false;
          }

          if (typeof this._elementsMemoryValue[element] !== "undefined") {
            this._elementsMemoryValue[element].min_width = 0;
            this._elementsMemoryValue[element].natural_width = 0;
            this._elementsMemoryValue[element].min_width_set = false;
            this._elementsMemoryValue[element].natural_width_set = false;
          }
        });
      } else {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsValue[element] !== "undefined") {
            this._elementsValue[element].width = width;
          }

          if (typeof this._elementsMemoryValue[element] !== "undefined") {
            this._elementsMemoryValue[element].width = width;
          }
        });
      }
    }

    set_element_thermal_width(width) {
      if (width === 0) {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsThermalValue[element] !== "undefined") {
            this._elementsThermalValue[element].min_width = 0;
            this._elementsThermalValue[element].natural_width = 0;
            this._elementsThermalValue[element].min_width_set = false;
            this._elementsThermalValue[element].natural_width_set = false;
          }
        });
      } else {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsThermalValue[element] !== "undefined") {
            this._elementsThermalValue[element].width = width;
          }
        });
      }
    }

    cleanup_elements() {
      this._elementsUuid = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];
      this._elementsMemoryValue = [];
      this._elementsMemoryUnit = [];
      this._elementsThermalValue = [];
      this._elementsThermalUnit = [];

      this.remove_all_children();
    }

    add_element(uuid, label, usage, memory, thermal) {
      this._elementsUuid.push(uuid);

      if (label !== null) {
        this._elementsName[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: ` ${label}: `,
        });
        this.add_child(this._elementsName[uuid]);
      }

      // Usage
      if (usage) {
        this._elementsValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsValue[uuid].set_style("text-align: right;");

        this._elementsUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "%",
        });
        this._elementsUnit[uuid].set_style("padding-left: 0.125em;");

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsValue[uuid]);
        this.add_child(this._elementsUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }

      // Memory
      if (memory) {
        this._elementsMemoryValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsMemoryValue[uuid].set_style("text-align: right;");

        this._elementsMemoryUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: this._gpuMemoryUnitType ? "%" : "KB",
        });
        this._elementsMemoryUnit[uuid].set_style("padding-left: 0.125em;");

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsMemoryValue[uuid]);
        this.add_child(this._elementsMemoryUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }

      // Thermal
      if (thermal) {
        this._elementsThermalValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsThermalValue[uuid].set_style("text-align: right;");

        this._elementsThermalUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "°C",
        });
        this._elementsThermalUnit[uuid].set_style("padding-left: 0.125em;");

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsThermalValue[uuid]);
        this.add_child(this._elementsThermalUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }
    }

    update_element_value(uuid, value, unit, style = "") {
      if (this._elementsValue[uuid]) {
        this._elementsValue[uuid].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsUnit[uuid].text = unit;
      }
    }

    update_element_memory_value(uuid, value, unit, style = "") {
      if (this._elementsMemoryValue[uuid]) {
        this._elementsMemoryValue[uuid].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsMemoryUnit[uuid].text = unit;
      }
    }

    update_element_thermal_value(uuid, value, unit, style = "") {
      if (this._elementsThermalValue[uuid]) {
        this._elementsThermalValue[uuid].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsThermalUnit[uuid].text = unit;
      }
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
