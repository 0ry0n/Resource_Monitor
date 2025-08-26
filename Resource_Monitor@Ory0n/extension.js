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

              for (
                let i = 0;
                i < this._thermalCpuTemperatureDevicesList.length;
                i++
              ) {
                let element = this._thermalCpuTemperatureDevicesList[i];
                let it = element.split(
                  THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR
                );

                if (device === it[0]) {
                  // Update device path
                  this._thermalCpuTemperatureDevicesList[i] =
                    it[0] +
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

      this._themeContext.disconnect(this._themeContextHandlerId);

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
      this._cpuValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._ramValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._ramValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._swapValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._swapValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._diskStatsBox = new DiskContainerStats();
      this._diskSpaceBox = new DiskContainerSpace();

      this._ethValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._ethValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._wlanValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._wlanValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._cpuTemperatureBracketStart = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[",
      });
      this._cpuTemperatureValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._cpuTemperatureValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });
      this._cpuTemperatureBracketEnd = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "]",
      });

      this._cpuFrequencyBracketStart = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[",
      });
      this._cpuFrequencyValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._cpuFrequencyValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });
      this._cpuFrequencyBracketEnd = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "]",
      });

      this._cpuLoadAverageBracketStart = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "[",
      });
      this._cpuLoadAverageValue = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._cpuLoadAverageValue.clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });
      this._cpuLoadAverageBracketEnd = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "]",
      });

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

                this._box.add_child(this._cpuTemperatureBracketStart);
                this._box.add_child(this._cpuTemperatureValue);
                this._box.add_child(this._cpuTemperatureUnit);
                this._box.add_child(this._cpuTemperatureBracketEnd);
                this._box.add_child(this._cpuFrequencyBracketStart);
                this._box.add_child(this._cpuFrequencyValue);
                this._box.add_child(this._cpuFrequencyUnit);
                this._box.add_child(this._cpuFrequencyBracketEnd);
                this._box.add_child(this._cpuLoadAverageBracketStart);
                this._box.add_child(this._cpuLoadAverageValue);
                this._box.add_child(this._cpuLoadAverageBracketEnd);

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

                this._box.add_child(this._cpuTemperatureBracketStart);
                this._box.add_child(this._cpuTemperatureValue);
                this._box.add_child(this._cpuTemperatureUnit);
                this._box.add_child(this._cpuTemperatureBracketEnd);
                this._box.add_child(this._cpuFrequencyBracketStart);
                this._box.add_child(this._cpuFrequencyValue);
                this._box.add_child(this._cpuFrequencyUnit);
                this._box.add_child(this._cpuFrequencyBracketEnd);
                this._box.add_child(this._cpuLoadAverageBracketStart);
                this._box.add_child(this._cpuLoadAverageValue);
                this._box.add_child(this._cpuLoadAverageBracketEnd);
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
      this._cpuWidth = this._settings.get_int(CPU_WIDTH) * this._scaleFactor;
      this._cpuColors = this._settings.get_strv(CPU_COLORS);
      this._cpuFrequencyStatus =
        this._settings.get_boolean(CPU_FREQUENCY_STATUS);
      this._cpuFrequencyWidth =
        this._settings.get_int(CPU_FREQUENCY_WIDTH) * this._scaleFactor;
      this._cpuFrequencyColors = this._settings.get_strv(CPU_FREQUENCY_COLORS);
      this._cpuFrequencyUnitMeasure = this._settings.get_string(
        CPU_FREQUENCY_UNIT_MEASURE
      );
      this._cpuLoadAverageStatus = this._settings.get_boolean(
        CPU_LOADAVERAGE_STATUS
      );
      this._cpuLoadAverageWidth =
        this._settings.get_int(CPU_LOADAVERAGE_WIDTH) * this._scaleFactor;
      this._cpuLoadAverageColors = this._settings.get_strv(
        CPU_LOADAVERAGE_COLORS
      );

      this._ramStatus = this._settings.get_boolean(RAM_STATUS);
      this._ramWidth = this._settings.get_int(RAM_WIDTH) * this._scaleFactor;
      this._ramColors = this._settings.get_strv(RAM_COLORS);
      this._ramUnitType = this._settings.get_string(RAM_UNIT);
      this._ramUnitMeasure = this._settings.get_string(RAM_UNIT_MEASURE);
      this._ramMonitor = this._settings.get_string(RAM_MONITOR);
      this._ramAlert = this._settings.get_boolean(RAM_ALERT);
      this._ramAlertThreshold = this._settings.get_int(RAM_ALERT_THRESHOLD);

      this._swapStatus = this._settings.get_boolean(SWAP_STATUS);
      this._swapWidth = this._settings.get_int(SWAP_WIDTH) * this._scaleFactor;
      this._swapColors = this._settings.get_strv(SWAP_COLORS);
      this._swapUnitType = this._settings.get_string(SWAP_UNIT);
      this._swapUnitMeasure = this._settings.get_string(SWAP_UNIT_MEASURE);
      this._swapMonitor = this._settings.get_string(SWAP_MONITOR);
      this._swapAlert = this._settings.get_boolean(SWAP_ALERT);
      this._swapAlertThreshold = this._settings.get_int(SWAP_ALERT_THRESHOLD);

      this._diskShowDeviceName = this._settings.get_boolean(DISK_SHOW_DEVICE_NAME);
      this._diskStatsStatus = this._settings.get_boolean(DISK_STATS_STATUS);
      this._diskStatsWidth =
        this._settings.get_int(DISK_STATS_WIDTH) * this._scaleFactor;
      this._diskStatsColors = this._settings.get_strv(DISK_STATS_COLORS);
      this._diskStatsMode = this._settings.get_string(DISK_STATS_MODE);
      this._diskStatsUnitMeasure = this._settings.get_string(
        DISK_STATS_UNIT_MEASURE
      );
      this._diskSpaceStatus = this._settings.get_boolean(DISK_SPACE_STATUS);
      this._diskSpaceWidth =
        this._settings.get_int(DISK_SPACE_WIDTH) * this._scaleFactor;
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
      this._netEthWidth =
        this._settings.get_int(NET_ETH_WIDTH) * this._scaleFactor;
      this._netEthColors = this._settings.get_strv(NET_ETH_COLORS);
      this._netWlanStatus = this._settings.get_boolean(NET_WLAN_STATUS);
      this._netWlanWidth =
        this._settings.get_int(NET_WLAN_WIDTH) * this._scaleFactor;
      this._netWlanColors = this._settings.get_strv(NET_WLAN_COLORS);

      this._thermalTemperatureUnit = this._settings.get_string(
        THERMAL_TEMPERATURE_UNIT
      );
      this._thermalCpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_CPU_TEMPERATURE_STATUS
      );
      this._thermalCpuTemperatureWidth =
        this._settings.get_int(THERMAL_CPU_TEMPERATURE_WIDTH) *
        this._scaleFactor;
      this._thermalCpuColors = this._settings.get_strv(THERMAL_CPU_COLORS);
      this._thermalCpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_CPU_TEMPERATURE_DEVICES_LIST
      );
      this._thermalGpuTemperatureStatus = this._settings.get_boolean(
        THERMAL_GPU_TEMPERATURE_STATUS
      );
      this._thermalGpuTemperatureWidth =
        this._settings.get_int(THERMAL_GPU_TEMPERATURE_WIDTH) *
        this._scaleFactor;
      this._thermalGpuColors = this._settings.get_strv(THERMAL_GPU_COLORS);
      this._thermalGpuTemperatureDevicesList = this._settings.get_strv(
        THERMAL_GPU_TEMPERATURE_DEVICES_LIST
      );

      this._gpuStatus = this._settings.get_boolean(GPU_STATUS);
      this._gpuWidth = this._settings.get_int(GPU_WIDTH) * this._scaleFactor;
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
        `changed::${DISK_SHOW_DEVICE_NAME}`,
        this._diskShowDeviceNameChanged.bind(this)
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
              } catch (error) {
                console.error(
                  `[Resource_Monitor] Error spawning ${this._leftClickStatus}: ${error}`
                );
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

      this._basicItemStatus(
        this._cpuFrequencyStatus,
        !this._cpuStatus &&
        !this._thermalCpuTemperatureStatus &&
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
      this._diskDevicesList = this._settings.get_strv(DISK_DEVICES_LIST);

      this._diskStatsBox.cleanup_elements();
      this._diskSpaceBox.cleanup_elements();

      this._diskDevicesList.forEach((element) => {
        const it = element.split(DISK_DEVICES_LIST_SEPARATOR);

        const filesystem = it[0];
        const mountPoint = it[1];
        const stats = it[2] === "true";
        const space = it[3] === "true";
        const displayName = it[4];

        if (stats) {
          this._diskStatsBox.add_element(filesystem, displayName);
        }

        if (space) {
          this._diskSpaceBox.add_element(filesystem, displayName);
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

      this._basicItemStatus(
        this._thermalCpuTemperatureStatus,
        !this._cpuStatus &&
        !this._cpuFrequencyStatus &&
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

      this._gpuBox.set_element_thermal_width(
        this._thermalGpuTemperatureWidth * this._scaleFactor
      );
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

      this._gpuBox.set_element_width(this._gpuWidth * this._scaleFactor);
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
        const name = it[1];
        const usage = it[2] === "true" && this._gpuStatus;
        const memory = it[3] === "true" && this._gpuStatus;
        const displayName = this._gpuDisplayDeviceName ? it[4] : null;
        let thermal = false;

        if (this._thermalGpuTemperatureStatus) {
          this._thermalGpuTemperatureDevicesList.forEach((element) => {
            const it = element.split(GPU_DEVICES_LIST_SEPARATOR);

            if (uuid === it[0]) {
              thermal = it[2] === "true";
            }
          });
        }

        this._gpuBox.add_element(uuid, displayName, usage, memory, thermal);
      });

      this._gpuBox.set_element_width(this._gpuWidth * this._scaleFactor);
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

      //this._diskShowDeviceNameChanged();

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

    // ==================
    // HELPER FUNCTIONS
    // ==================

    // Determines the color based on the value and thresholds
    _getUsageColor(value, colors) {
      if (!colors || colors.length === 0) return "";

      const val = Array.isArray(value) ? Math.max(...value) : value;

      for (const colorItem of colors) {
        const [threshold, rRaw, gRaw, bRaw] = colorItem
          .split(COLOR_LIST_SEPARATOR)
          .map(Number);

        if (val <= threshold) {
          const r = Math.round(rRaw > 1 ? rRaw : rRaw * 255);
          const g = Math.round(gRaw > 1 ? gRaw : gRaw * 255);
          const b = Math.round(bRaw > 1 ? bRaw : bRaw * 255);
          return `color: rgb(${r}, ${g}, ${b});`;
        }
      }
      return "";
    }

    // Decimal precision
    _getValueFixed(value) {
      return this._decimalsStatus ? value.toFixed(1) : value.toFixed(0);
    }

    // Conversion for a single value (KB, MB, GB or Hz)
    _convertValueToUnit(value, unitMeasure, isHertz = false) {
      const factor = 1000;
      const unitSuffixes = isHertz
        ? ["KHz", "MHz", "GHz", "THz"]
        : ["KB", "MB", "GB", "TB"];

      let unit = isHertz ? "KHz" : "KB";

      switch (unitMeasure) {
        case "k": break;
        case "m": value /= factor; unit = unitSuffixes[1]; break;
        case "g": value /= factor ** 2; unit = unitSuffixes[2]; break;
        case "t": value /= factor ** 3; unit = unitSuffixes[3]; break;
        case "auto":
        default:
          let exp = 0;
          for (let i = 1; i <= 3; i++) {
            if (value >= factor ** i) {
              exp = i;
            }
          }
          value /= factor ** exp;
          unit = unitSuffixes[exp];
          break;
      }
      return [value, unit];
    }

    // Conversion of array of values (network/disk)
    _convertValuesToUnit(values, unitMeasure, isBits = false) {
      const factor = 1024;
      const unitSuffixes = isBits
        ? ["b", "k", "m", "g", "t"]
        : ["B", "K", "M", "G", "T"];

      let exponent = 0;

      if (unitMeasure && unitSuffixes.includes(unitMeasure.toUpperCase())) {
        exponent = unitSuffixes.indexOf(unitMeasure.toUpperCase());
      } else {
        while (values.some(v => v >= factor ** (exponent + 1)) && exponent < 4) {
          exponent++;
        }
      }

      const unit = unitSuffixes[exponent];
      return {
        values: values.map(v => v / factor ** exponent),
        unit
      };
    }

    // Temperature conversion
    _convertTemperature(tempC) {
      return this._thermalTemperatureUnit === "f"
        ? [tempC * 1.8 + 32, "°F"]
        : [tempC, "°C"];
    }

    // ==================
    // REFRESH FUNCTIONS
    // ==================

    _refreshCpuValue() {
      this._loadFile("/proc/stat")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");

          // Parse the first line for CPU statistics
          const entry = lines[0].trim().split(/\s+/);
          const idle = parseInt(entry[4], 10);
          let cpuTot = 0;

          // Sum the user, nice, system, and idle times
          for (let i = 1; i <= 4; i++) {
            const value = parseInt(entry[i], 10);
            if (!isNaN(value)) cpuTot += value;
          }

          const delta = cpuTot - (this._cpuTotOld || 0);
          const deltaIdle = idle - (this._cpuIdleOld || 0);
          const cpuCurr = delta ? (100 * (delta - deltaIdle)) / delta : 0;

          // Update previous totals
          this._cpuTotOld = cpuTot;
          this._cpuIdleOld = idle;

          // Set CPU usage color based on thresholds
          this._cpuValue.style = this._getUsageColor(cpuCurr, this._cpuColors);

          // Update CPU usage display with optional decimal precision
          this._cpuValue.text = `${this._getValueFixed(cpuCurr)}`;
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading cpu:", error)
        );
    }

    _refreshRamValue() {
      this._loadFile("/proc/meminfo")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");

          let total = 0;
          let available = 0;

          for (const line of lines) {
            if (line.startsWith("MemTotal")) {
              const match = line.match(/^MemTotal:\s*(\d+)\s*kB$/);
              if (match) total = parseInt(match[1], 10);
            } else if (line.startsWith("MemAvailable")) {
              const match = line.match(/^MemAvailable:\s*(\d+)\s*kB$/);
              if (match) available = parseInt(match[1], 10);
            }
            if (total && available) break; // Exit loop if both values are found
          }

          const used = total - available;

          // Trigger low memory alert if needed
          if (
            this._ramAlert &&
            (100 * available) / total < this._ramAlertThreshold
          ) {
            Main.notify(
              "Resource Monitor - Low Memory Alert",
              `Available RAM has dropped below ${this._ramAlertThreshold}%. Please take action to free up memory.`
            );
          }

          let value = 0;
          let unit = "KB";

          // Determine display value based on _ramMonitor setting
          switch (this._ramMonitor) {
            case "free":
              value = available;
              break;
            case "used":
            default:
              value = used;
              break;
          }

          // Apply unit conversions or percentage formatting
          if (this._ramUnitType === "perc") {
            const percentValue = (100 * value) / total;
            this._ramValue.style = this._getUsageColor(percentValue, this._ramColors);
            this._ramValue.text = `${this._getValueFixed(percentValue)}`;
            this._ramUnit.text = "%";
          } else {
            [value, unit] = this._convertValueToUnit(
              value,
              this._ramUnitMeasure
            );
            this._ramValue.style = this._getUsageColor(value, this._ramColors);
            this._ramValue.text = `${this._getValueFixed(value)}`;
            this._ramUnit.text = unit;
          }
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading ram:", error)
        );
    }

    _refreshSwapValue() {
      this._loadFile("/proc/meminfo")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");

          let total = 0;
          let available = 0;

          for (const line of lines) {
            if (line.startsWith("SwapTotal")) {
              const match = line.match(/^SwapTotal:\s*(\d+)\s*kB$/);
              if (match) total = parseInt(match[1], 10);
            } else if (line.startsWith("SwapFree")) {
              const match = line.match(/^SwapFree:\s*(\d+)\s*kB$/);
              if (match) available = parseInt(match[1], 10);
            }
            if (total && available) break; // Exit loop if both values are found
          }

          const used = total - available;

          // Trigger low memory alert if needed
          if (
            this._swapAlert &&
            (100 * available) / total < this._swapAlertThreshold
          ) {
            Main.notify(
              "Resource Monitor - Low Memory Alert",
              `Available SWAP has dropped below ${this._swapAlertThreshold}%. Please take action to free up memory.`
            );
          }

          let value = 0;
          let unit = "KB";

          // Determine display value based on _swapMonitor setting
          switch (this._swapMonitor) {
            case "free":
              value = available;
              break;
            case "used":
            default:
              value = used;
              break;
          }

          // Apply unit conversions or percentage formatting
          if (this._swapUnitType === "perc") {
            const percentValue = (100 * value) / total;
            this._swapValue.style = this._getUsageColor(
              percentValue,
              this._swapColors
            );
            this._swapValue.text = `${this._getValueFixed(percentValue)}`;
            this._swapUnit.text = "%";
          } else {
            [value, unit] = this._convertValueToUnit(
              value,
              this._swapUnitMeasure
            );
            this._swapValue.style = this._getUsageColor(
              value,
              this._swapColors
            );
            this._swapValue.text = `${this._getValueFixed(value)}`;
            this._swapUnit.text = unit;
          }
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading swap:", error)
        );
    }

    _refreshDiskStatsValue() {
      this._loadFile("/proc/diskstats")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");
          const idle = GLib.get_monotonic_time() / 1000;

          const processEntry = (filesystem, rwTot, rw) => {
            const delta =
              (idle - (this._diskStatsBox.get_idle(filesystem) || idle)) / 1000;
            this._diskStatsBox.set_idle(filesystem, idle);

            let unit = "";

            if (delta > 0) {
              const rwTotOld = this._diskStatsBox.get_rw_tot(filesystem);
              for (let i = 0; i < 2; i++) {
                rw[i] = (rwTot[i] - (rwTotOld[i] || 0)) / delta;
              }
              this._diskStatsBox.set_rw_tot(filesystem, rwTot);

              // Convert K to B
              rw[0] = rw[0] * 1024;
              rw[1] = rw[1] * 1024;
              // Convert units and determine appropriate unit string
              const unitResult = this._convertValuesToUnit(
                rw,
                this._diskStatsUnitMeasure
              );
              rw = unitResult.values;
              unit = unitResult.unit;
            }

            this._diskStatsBox.update_element_value(
              filesystem,
              `${this._getValueFixed(rw[0])}|${this._getValueFixed(rw[1])}`,
              unit,
              this._getUsageColor(rw, this._diskStatsColors)
            );
          };

          switch (this._diskStatsMode) {
            case "single": {
              let rwTot = [0, 0];
              let rw = [0, 0];
              const filesystem = "single";

              lines.forEach((line) => {
                const entry = line.trim().split(/\s+/);
                if (
                  entry[2] &&
                  !/^loop/.test(entry[2]) &&
                  this._diskStatsBox.get_filesystem(entry[2])
                ) {
                  // sector is 512 bytes
                  // 1 kilobyte = 2 sectors
                  rwTot[0] += parseInt(entry[5], 10) / 2; // Read sectors -> KB
                  rwTot[1] += parseInt(entry[9], 10) / 2; // Write sectors -> KB
                }
              });

              processEntry(filesystem, rwTot, rw);
              break;
            }

            case "multiple":
            default:
              lines.forEach((line) => {
                const entry = line.trim().split(/\s+/);
                if (entry[2] && !/^loop/.test(entry[2])) {
                  const filesystem = this._diskStatsBox.get_filesystem(
                    entry[2]
                  );
                  if (filesystem) {
                    let rwTot = [
                      // sector is 512 bytes
                      // 1 kilobyte = 2 sectors
                      parseInt(entry[5], 10) / 2, // Read sectors -> KB
                      parseInt(entry[9], 10) / 2, // Write sectors -> KB
                    ];
                    let rw = [0, 0];
                    processEntry(filesystem, rwTot, rw);
                  } else {
                    this._diskStatsBox.update_element_value(
                      filesystem,
                      "--|--",
                      "",
                      ""
                    );
                  }
                }
              });
              break;
          }
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading disk stats:", error)
        );
    }

    _refreshDiskSpaceValue() {
      this._executeCommand(["df", "-BKB", "-x", "squashfs", "-x", "tmpfs"])
        .then((contents) => {
          const lines = contents.split("\n");

          // Exclude the header line
          for (let i = 1; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const entry = line.split(/\s+/);

            const filesystem = entry[0];
            let value = 0;
            let unit = "KB";

            if (this._diskSpaceUnitType === "perc") {
              const usedPercent = parseInt(entry[4].slice(0, -1), 10);
              value =
                this._diskSpaceMonitor === "free"
                  ? 100 - usedPercent
                  : usedPercent;

              this._diskSpaceBox.update_element_value(
                filesystem,
                `${value}`,
                "%",
                this._getUsageColor(value, this._diskSpaceColors)
              );
            } else {
              // Numeric mode: parse and format value in selected unit
              const sizeInKB =
                this._diskSpaceMonitor === "free"
                  ? parseInt(entry[3].slice(0, -2), 10)
                  : parseInt(entry[2].slice(0, -2), 10);

              [value, unit] = this._convertValueToUnit(
                sizeInKB,
                this._diskSpaceUnitMeasure
              );

              this._diskSpaceBox.update_element_value(
                filesystem,
                `${this._getValueFixed(value)}`,
                unit,
                this._getUsageColor(value, this._diskSpaceColors)
              );
            }
          }
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading disk space:", error)
        );
    }

    _refreshEthValue() {
      this._loadFile("/proc/net/dev")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");

          let duTot = [0, 0];
          let du = [0, 0];

          // Exclude the first two header lines
          for (let i = 2; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const [iface, data] = line.split(":").map((s) => s.trim());

            // Match ethernet interfaces only
            if (/^(eth[0-9]+|en[a-z0-9]*)$/.test(iface)) {
              const values = data.split(/\s+/);
              duTot[0] += parseInt(values[0], 10); // Received bytes
              duTot[1] += parseInt(values[8], 10); // Transmitted bytes
            }
          }

          const idle = GLib.get_monotonic_time() / 1000;
          const delta = (idle - (this._ethIdleOld || idle)) / 1000;
          this._ethIdleOld = idle;

          // True = bits, False = bytes
          const factor = this._netUnit === "bits" ? 8 : 1;

          if (delta > 0) {
            for (let i = 0; i < 2; i++) {
              du[i] =
                ((duTot[i] - (this._duTotEthOld[i] || 0)) * factor) / delta;
              this._duTotEthOld[i] = duTot[i];
            }

            // Convert units based on user setting or auto-detect
            const result = this._convertValuesToUnit(
              du,
              this._netUnitMeasure,
              this._netUnit === "bits"
            );
            du = result.values;
            this._ethUnit.text = result.unit;
          }

          // Set color based on thresholds
          this._ethValue.style = this._getUsageColor(du, this._netEthColors);

          // Display the download/upload values with appropriate decimal places
          this._ethValue.text = `${this._getValueFixed(
            du[0]
          )}|${this._getValueFixed(du[1])}`;
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading eth:", error)
        );
    }

    _refreshWlanValue() {
      this._loadFile("/proc/net/dev")
        .then((contents) => {
          const lines = new TextDecoder().decode(contents).split("\n");

          let duTot = [0, 0];
          let du = [0, 0];

          // Exclude the first two header lines
          for (let i = 2; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const [iface, data] = line.split(":").map((s) => s.trim());

            // Match wlan interfaces only
            if (/^(wlan[0-9]+|wl[a-z0-9]*)$/.test(iface)) {
              const values = data.split(/\s+/);
              duTot[0] += parseInt(values[0], 10); // Received bytes
              duTot[1] += parseInt(values[8], 10); // Transmitted bytes
            }
          }

          const idle = GLib.get_monotonic_time() / 1000;
          const delta = (idle - (this._wlanIdleOld || idle)) / 1000;
          this._wlanIdleOld = idle;

          // True = bits, False = bytes
          const factor = this._netUnit === "bits" ? 8 : 1;

          if (delta > 0) {
            for (let i = 0; i < 2; i++) {
              du[i] =
                ((duTot[i] - (this._duTotWlanOld[i] || 0)) * factor) / delta;
              this._duTotWlanOld[i] = duTot[i];
            }

            // Convert units based on user setting or auto-detect
            const result = this._convertValuesToUnit(
              du,
              this._netUnitMeasure,
              this._netUnit === "bits"
            );
            du = result.values;
            this._wlanUnit.text = result.unit;
          }

          // Set color based on thresholds
          this._wlanValue.style = this._getUsageColor(du, this._netWlanColors);

          // Display the download/upload values with appropriate decimal places
          this._wlanValue.text = `${this._getValueFixed(
            du[0]
          )}|${this._getValueFixed(du[1])}`;
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading wlan:", error)
        );
    }

    _refreshCpuFrequencyValue() {
      this._executeCommand([
        "bash",
        "-c",
        "cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq",
      ])
        .then((contents) => {
          const lines = contents.split("\n");

          // Calculate the maximum frequency in the list
          let maxFrequency = Math.max(
            ...lines
              .map((line) => parseInt(line.trim(), 10))
              .filter(Number.isFinite)
          );

          // Convert frequency to desired unit and format the output
          const [value, unit] = this._convertValueToUnit(
            maxFrequency,
            this._cpuFrequencyUnitMeasure,
            true
          );

          this._cpuFrequencyValue.style = this._getUsageColor(
            value,
            this._cpuFrequencyColors
          );
          this._cpuFrequencyValue.text = `${this._getValueFixed(value)}`;
          this._cpuFrequencyUnit.text = unit;
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading cpu frequency:", error)
        );
    }

    _refreshCpuLoadAverageValue() {
      this._loadFile("/proc/loadavg")
        .then((contents) => {
          const line = new TextDecoder().decode(contents);

          const [l0, l1, l2] = line
            .trim()
            .split(/\s+/)
            .slice(0, 3)
            .map(parseFloat);

          // Set color based on load average values
          this._cpuLoadAverageValue.style = this._getUsageColor(
            l0,
            this._cpuLoadAverageColors
          );

          // Display load average values
          this._cpuLoadAverageValue.text = `${l0} ${l1} ${l2}`;
        })
        .catch((error) =>
          console.error(
            "[Resource_Monitor] Error reading cpu load average:",
            error
          )
        );
    }

    _refreshCpuTemperatureValue() {
      if (this._thermalCpuTemperatureDevicesList.length > 0) {
        this._thermalCpuTemperatureDevicesList.forEach((element) => {
          const [, status, path] = element.split(
            THERMAL_CPU_TEMPERATURE_DEVICES_LIST_SEPARATOR
          );

          // Skip if the sensor is inactive
          if (status === "false" || !GLib.file_test(path, GLib.FileTest.EXISTS))
            return;

          this._loadFile(path)
            .then((contents) => {
              const temperature = parseInt(
                new TextDecoder().decode(contents),
                10
              );

              if (!isNaN(temperature)) {
                this._cpuTemperatures += temperature / 1000;
                this._cpuTemperaturesReadings++;
              }

              // Process the final average once all readings are completed
              if (
                this._cpuTemperaturesReadings >=
                this._thermalCpuTemperatureDevicesList.length
              ) {
                const avg =
                  this._cpuTemperatures / this._cpuTemperaturesReadings;

                // Convert temperature to desired unit
                const [value, unit] = this._convertTemperature(avg);

                this._cpuTemperatureValue.text = `${this._getValueFixed(
                  value
                )}`;
                this._cpuTemperatureUnit.text = unit;

                // Apply color based on thresholds
                this._cpuTemperatureValue.style = this._getUsageColor(
                  value,
                  this._thermalCpuColors
                );

                // Reset totals
                this._cpuTemperatures = 0;
                this._cpuTemperaturesReadings = 0;
              }
            })
            .catch((error) => {
              console.error(
                "[Resource_Monitor] Error reading cpu thermal:",
                error
              );
            });
        });
      } else {
        this._cpuTemperatureValue.text = "--";
      }
    }

    _refreshGpuValue() {
      this._executeCommand([
        "nvidia-smi",
        "--query-gpu=uuid,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
        "--format=csv,noheader",
      ])
        .then((contents) => {
          const lines = contents.trim().split("\n");

          lines.forEach((line) => {
            const [
              uuid,
              memoryTotalStr,
              memoryUsedStr,
              memoryFreeStr,
              usageStr,
              temperatureStr,
            ] = line.trim().split(/,\s/);

            const usage = parseInt(usageStr.slice(0, -1), 10);
            let memoryTotal =
              parseInt(memoryTotalStr.slice(0, -4), 10) * 1024 * 1.024;
            let memoryUsed =
              parseInt(memoryUsedStr.slice(0, -4), 10) * 1024 * 1.024;
            let memoryFree =
              parseInt(memoryFreeStr.slice(0, -4), 10) * 1024 * 1.024;
            const temperature = parseInt(temperatureStr, 10);

            // GPU utilization
            this._gpuBox.update_element_value(
              uuid,
              `${usage}`,
              "%",
              this._getUsageColor(usage, this._gpuColors)
            );

            // GPU memory
            let memoryValue;
            let memoryUnit = "KB";

            // Determine display value based on _gpuMemoryMonitor setting
            switch (this._gpuMemoryMonitor) {
              case "free":
                memoryValue = memoryFree;
                break;
              case "used":
              default:
                memoryValue = memoryUsed;
                break;
            }

            // Apply unit conversions or percentage formatting
            if (this._gpuMemoryUnitType === "perc") {
              const percentValue = (100 * memoryValue) / memoryTotal;
              this._gpuBox.update_element_memory_value(
                uuid,
                `${this._getValueFixed(percentValue)}`,
                "%",
                this._getUsageColor(percentValue, this._gpuMemoryColors)
              );
            } else {
              [memoryValue, memoryUnit] = this._convertValueToUnit(
                memoryValue,
                this._gpuMemoryUnitMeasure
              );

              this._gpuBox.update_element_memory_value(
                uuid,
                `${this._getValueFixed(memoryValue)}`,
                memoryUnit,
                this._getUsageColor(memoryValue, this._gpuMemoryColors)
              );
            }

            // GPU Thermal
            // Convert temperature to desired unit
            const [tempValue, tempUnit] = this._convertTemperature(temperature);

            this._gpuBox.update_element_thermal_value(
              uuid,
              `${this._getValueFixed(tempValue)}`,
              tempUnit,
              this._getUsageColor(tempValue, this._thermalGpuColors)
            );
          });
        })
        .catch((error) =>
          console.error("[Resource_Monitor] Error reading gpu:", error)
        );
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
        console.error("[Resource_Monitor] Load File Error:", error);
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
        console.error("[Resource_Monitor] Execute Command Error:", error);
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

    set_element_name_visibility(status) {
      this._elementsPath.forEach((element) => {
        if (typeof this._elementsName[element] !== "undefined") {
          if (status) {
            this._elementsName[element].show();
          } else {
            this._elementsName[element].hide();
          }
        }
      });
    }

    cleanup_elements() {
      this._elementsPath = [];
      this._elementsName = [];
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
      this._elementsValue["single"].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

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
      this._elementsValue[filesystem].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

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
      this._elementsValue[filesystem].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

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
        this._elementsValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

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
        this._elementsMemoryValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

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
        this._elementsThermalValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

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
        this._elementsValue[uuid].style = style;
        this._elementsUnit[uuid].text = unit;
      }
    }

    update_element_memory_value(uuid, value, unit, style = "") {
      if (this._elementsMemoryValue[uuid]) {
        this._elementsMemoryValue[uuid].text = value;
        this._elementsMemoryValue[uuid].style = style;
        this._elementsMemoryUnit[uuid].text = unit;
      }
    }

    update_element_thermal_value(uuid, value, unit, style = "") {
      if (this._elementsThermalValue[uuid]) {
        this._elementsThermalValue[uuid].text = value;
        this._elementsThermalValue[uuid].style = style;
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