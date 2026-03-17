import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import St from "gi://St";

import { DiskContainerSpace, DiskContainerStats, GpuContainer } from "./containers.js";

const UNIT_PADDING_STYLE = "padding-left: 0.125em;";

function _createUnitLabel(text) {
  const label = new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
  label.set_style(UNIT_PADDING_STYLE);
  return label;
}

function _createValueLabel(text) {
  const label = new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
  label.clutter_text.set({
    x_align: Clutter.ActorAlign.END,
  });
  return label;
}

function _createBracketLabel(text) {
  return new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
}

function _createIcon(path) {
  return new St.Icon({
    gicon: Gio.icon_new_for_string(path),
    style_class: "system-status-icon",
  });
}

function _appendCpuChildren(indicator, addChild, iconsPosition) {
  if (iconsPosition === "left") {
    addChild(indicator._cpuIcon);
  }

  addChild(indicator._cpuValue);
  addChild(indicator._cpuUnit);
  addChild(indicator._cpuTemperatureBracketStart);
  addChild(indicator._cpuTemperatureValue);
  addChild(indicator._cpuTemperatureUnit);
  addChild(indicator._cpuTemperatureBracketEnd);
  addChild(indicator._cpuFrequencyBracketStart);
  addChild(indicator._cpuFrequencyValue);
  addChild(indicator._cpuFrequencyUnit);
  addChild(indicator._cpuFrequencyBracketEnd);
  addChild(indicator._cpuLoadAverageBracketStart);
  addChild(indicator._cpuLoadAverageValue);
  addChild(indicator._cpuLoadAverageBracketEnd);

  if (iconsPosition !== "left") {
    addChild(indicator._cpuIcon);
  }
}

function _appendSimpleChildren(icon, value, unit, addChild, iconsPosition) {
  if (iconsPosition === "left") {
    addChild(icon);
  }

  addChild(value);
  addChild(unit);

  if (iconsPosition !== "left") {
    addChild(icon);
  }
}

function _appendSingleBoxChildren(icon, box, addChild, iconsPosition) {
  if (iconsPosition === "left") {
    addChild(icon);
  }

  addChild(box);

  if (iconsPosition !== "left") {
    addChild(icon);
  }
}

export function createMainGui(indicator) {
  indicator._box = new St.BoxLayout();

  indicator._cpuIcon = _createIcon(`${indicator._path}/icons/cpu-symbolic.svg`);
  indicator._ramIcon = _createIcon(`${indicator._path}/icons/ram-symbolic.svg`);
  indicator._swapIcon = _createIcon(`${indicator._path}/icons/swap-symbolic.svg`);
  indicator._diskStatsIcon = _createIcon(
    `${indicator._path}/icons/disk-stats-symbolic.svg`
  );
  indicator._diskSpaceIcon = _createIcon(
    `${indicator._path}/icons/disk-space-symbolic.svg`
  );
  indicator._ethIcon = _createIcon(`${indicator._path}/icons/eth-symbolic.svg`);
  indicator._wlanIcon = _createIcon(`${indicator._path}/icons/wlan-symbolic.svg`);
  indicator._gpuIcon = _createIcon(`${indicator._path}/icons/gpu-symbolic.svg`);

  indicator._cpuTemperatureUnit = _createUnitLabel("°C");
  indicator._cpuFrequencyUnit = _createUnitLabel("KHz");
  indicator._cpuUnit = _createUnitLabel("%");
  indicator._ramUnit = _createUnitLabel("KB");
  indicator._swapUnit = _createUnitLabel("KB");
  indicator._ethUnit = _createUnitLabel("K");
  indicator._wlanUnit = _createUnitLabel("K");

  indicator._cpuValue = _createValueLabel("--");
  indicator._ramValue = _createValueLabel("--");
  indicator._swapValue = _createValueLabel("--");
  indicator._ethValue = _createValueLabel("--|--");
  indicator._wlanValue = _createValueLabel("--|--");
  indicator._cpuTemperatureValue = _createValueLabel("--");
  indicator._cpuFrequencyValue = _createValueLabel("--");
  indicator._cpuLoadAverageValue = _createValueLabel("--");

  indicator._cpuTemperatureBracketStart = _createBracketLabel("[");
  indicator._cpuTemperatureBracketEnd = _createBracketLabel("]");
  indicator._cpuFrequencyBracketStart = _createBracketLabel("[");
  indicator._cpuFrequencyBracketEnd = _createBracketLabel("]");
  indicator._cpuLoadAverageBracketStart = _createBracketLabel("[");
  indicator._cpuLoadAverageBracketEnd = _createBracketLabel("]");

  indicator._diskStatsBox = new DiskContainerStats();
  indicator._diskSpaceBox = new DiskContainerSpace();
  indicator._gpuBox = new GpuContainer();
}

export function buildMainGui(indicator) {
  indicator._refreshGui();

  const iconsPosition = indicator._iconsPosition;
  const addChild = (child) => indicator._box.add_child(child);

  indicator._itemsPosition.forEach((element) => {
    switch (element) {
      case "cpu":
        _appendCpuChildren(indicator, addChild, iconsPosition);
        break;

      case "ram":
        _appendSimpleChildren(
          indicator._ramIcon,
          indicator._ramValue,
          indicator._ramUnit,
          addChild,
          iconsPosition
        );
        break;

      case "swap":
        _appendSimpleChildren(
          indicator._swapIcon,
          indicator._swapValue,
          indicator._swapUnit,
          addChild,
          iconsPosition
        );
        break;

      case "stats":
        _appendSingleBoxChildren(
          indicator._diskStatsIcon,
          indicator._diskStatsBox,
          addChild,
          iconsPosition
        );
        break;

      case "space":
        _appendSingleBoxChildren(
          indicator._diskSpaceIcon,
          indicator._diskSpaceBox,
          addChild,
          iconsPosition
        );
        break;

      case "eth":
        _appendSimpleChildren(
          indicator._ethIcon,
          indicator._ethValue,
          indicator._ethUnit,
          addChild,
          iconsPosition
        );
        break;

      case "wlan":
        _appendSimpleChildren(
          indicator._wlanIcon,
          indicator._wlanValue,
          indicator._wlanUnit,
          addChild,
          iconsPosition
        );
        break;

      case "gpu":
        _appendSingleBoxChildren(
          indicator._gpuIcon,
          indicator._gpuBox,
          addChild,
          iconsPosition
        );
        break;

      default:
        break;
    }
  });

  if (indicator._box.get_parent() !== indicator) {
    indicator.add_child(indicator._box);
  }
}
