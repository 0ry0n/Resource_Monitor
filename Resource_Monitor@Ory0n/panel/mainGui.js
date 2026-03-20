import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import St from "gi://St";

import { DiskContainerSpace, DiskContainerStats, GpuContainer } from "./containers.js";

function _addStyleClasses(actor, classes) {
  classes.forEach((cssClass) => actor.add_style_class_name(cssClass));
}

function _createGroupBox(name) {
  const box = new St.BoxLayout({
    style_class: "resource-monitor-group",
  });
  box.add_style_class_name(`resource-monitor-group-${name}`);
  return box;
}

function _replaceGroupChildren(group, appendChildren) {
  group.remove_all_children();
  appendChildren((child) => group.add_child(child));
}

function _createUnitLabel(text) {
  const label = new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
  _addStyleClasses(label, ["resource-monitor-unit"]);
  return label;
}

function _createValueLabel(text) {
  const label = new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
  _addStyleClasses(label, ["resource-monitor-value"]);
  label.clutter_text.set({
    x_align: Clutter.ActorAlign.END,
  });
  return label;
}

function _createBracketLabel(text) {
  const label = new St.Label({
    y_align: Clutter.ActorAlign.CENTER,
    text,
  });
  _addStyleClasses(label, ["resource-monitor-bracket"]);
  return label;
}

function _createIcon(path) {
  const icon = new St.Icon({
    gicon: Gio.icon_new_for_string(path),
    style_class: "system-status-icon",
  });
  _addStyleClasses(icon, ["resource-monitor-icon"]);
  return icon;
}

function _getSecondarySeparatorPair(style) {
  switch (style) {
    case "dot":
      return { start: " · ", end: "" };
    case "slash":
      return { start: " / ", end: "" };
    case "brackets":
      return { start: "[", end: "]" };
    default:
      return { start: " · ", end: "" };
  }
}

export function applySecondarySeparatorStyle(indicator) {
  const style = indicator._secondarySeparatorStyle;
  const { start, end } = _getSecondarySeparatorPair(style);

  const cpuSeparators = [
    [indicator._cpuTemperatureBracketStart, indicator._cpuTemperatureBracketEnd],
    [indicator._cpuFrequencyBracketStart, indicator._cpuFrequencyBracketEnd],
    [indicator._cpuLoadAverageBracketStart, indicator._cpuLoadAverageBracketEnd],
  ];

  cpuSeparators.forEach(([startLabel, endLabel]) => {
    if (startLabel) {
      startLabel.text = start;
    }
    if (endLabel) {
      endLabel.text = end;
    }
  });

  if (typeof indicator._gpuBox?.set_separator_style === "function") {
    indicator._gpuBox.set_separator_style(style);
  }
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
  indicator._box = new St.BoxLayout({
    style_class: "resource-monitor-box",
  });
  indicator._cpuGroup = _createGroupBox("cpu");
  indicator._ramGroup = _createGroupBox("ram");
  indicator._swapGroup = _createGroupBox("swap");
  indicator._diskStatsGroup = _createGroupBox("disk-stats");
  indicator._diskSpaceGroup = _createGroupBox("disk-space");
  indicator._ethGroup = _createGroupBox("eth");
  indicator._wlanGroup = _createGroupBox("wlan");
  indicator._gpuGroup = _createGroupBox("gpu");

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
  indicator._cpuFrequencyUnit = _createUnitLabel("kHz");
  indicator._cpuUnit = _createUnitLabel("%");
  indicator._ramUnit = _createUnitLabel("KB");
  indicator._swapUnit = _createUnitLabel("KB");
  indicator._ethUnit = _createUnitLabel("B");
  indicator._wlanUnit = _createUnitLabel("B");

  indicator._cpuValue = _createValueLabel("--");
  indicator._ramValue = _createValueLabel("--");
  indicator._swapValue = _createValueLabel("--");
  indicator._ethValue = _createValueLabel("--|--");
  indicator._wlanValue = _createValueLabel("--|--");
  indicator._cpuTemperatureValue = _createValueLabel("--");
  indicator._cpuFrequencyValue = _createValueLabel("--");
  indicator._cpuLoadAverageValue = _createValueLabel("--");
  _addStyleClasses(indicator._cpuTemperatureValue, [
    "resource-monitor-secondary-value",
  ]);
  _addStyleClasses(indicator._cpuFrequencyValue, [
    "resource-monitor-secondary-value",
  ]);
  _addStyleClasses(indicator._cpuLoadAverageValue, [
    "resource-monitor-secondary-value",
  ]);
  _addStyleClasses(indicator._cpuTemperatureUnit, ["resource-monitor-secondary-unit"]);
  _addStyleClasses(indicator._cpuFrequencyUnit, ["resource-monitor-secondary-unit"]);

  indicator._cpuTemperatureBracketStart = _createBracketLabel("[");
  indicator._cpuTemperatureBracketEnd = _createBracketLabel("]");
  indicator._cpuFrequencyBracketStart = _createBracketLabel("[");
  indicator._cpuFrequencyBracketEnd = _createBracketLabel("]");
  indicator._cpuLoadAverageBracketStart = _createBracketLabel("[");
  indicator._cpuLoadAverageBracketEnd = _createBracketLabel("]");
  _addStyleClasses(indicator._cpuTemperatureBracketStart, [
    "resource-monitor-secondary-bracket",
  ]);
  _addStyleClasses(indicator._cpuTemperatureBracketEnd, [
    "resource-monitor-secondary-bracket",
  ]);
  _addStyleClasses(indicator._cpuFrequencyBracketStart, [
    "resource-monitor-secondary-bracket",
  ]);
  _addStyleClasses(indicator._cpuFrequencyBracketEnd, [
    "resource-monitor-secondary-bracket",
  ]);
  _addStyleClasses(indicator._cpuLoadAverageBracketStart, [
    "resource-monitor-secondary-bracket",
  ]);
  _addStyleClasses(indicator._cpuLoadAverageBracketEnd, [
    "resource-monitor-secondary-bracket",
  ]);

  indicator._diskStatsBox = new DiskContainerStats();
  indicator._diskSpaceBox = new DiskContainerSpace();
  indicator._gpuBox = new GpuContainer();
}

export function buildMainGui(indicator) {
  indicator._refreshGui();

  const iconsPosition = indicator._iconsPosition;
  indicator._box.remove_style_class_name("resource-monitor-icons-left");
  indicator._box.remove_style_class_name("resource-monitor-icons-right");
  indicator._box.add_style_class_name(
    iconsPosition === "left"
      ? "resource-monitor-icons-left"
      : "resource-monitor-icons-right"
  );

  const groupsByItem = {
    cpu: indicator._cpuGroup,
    ram: indicator._ramGroup,
    swap: indicator._swapGroup,
    stats: indicator._diskStatsGroup,
    space: indicator._diskSpaceGroup,
    eth: indicator._ethGroup,
    wlan: indicator._wlanGroup,
    gpu: indicator._gpuGroup,
  };

  _replaceGroupChildren(indicator._cpuGroup, (addChild) =>
    _appendCpuChildren(indicator, addChild, iconsPosition)
  );
  _replaceGroupChildren(indicator._ramGroup, (addChild) =>
    _appendSimpleChildren(
      indicator._ramIcon,
      indicator._ramValue,
      indicator._ramUnit,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._swapGroup, (addChild) =>
    _appendSimpleChildren(
      indicator._swapIcon,
      indicator._swapValue,
      indicator._swapUnit,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._diskStatsGroup, (addChild) =>
    _appendSingleBoxChildren(
      indicator._diskStatsIcon,
      indicator._diskStatsBox,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._diskSpaceGroup, (addChild) =>
    _appendSingleBoxChildren(
      indicator._diskSpaceIcon,
      indicator._diskSpaceBox,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._ethGroup, (addChild) =>
    _appendSimpleChildren(
      indicator._ethIcon,
      indicator._ethValue,
      indicator._ethUnit,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._wlanGroup, (addChild) =>
    _appendSimpleChildren(
      indicator._wlanIcon,
      indicator._wlanValue,
      indicator._wlanUnit,
      addChild,
      iconsPosition
    )
  );
  _replaceGroupChildren(indicator._gpuGroup, (addChild) =>
    _appendSingleBoxChildren(
      indicator._gpuIcon,
      indicator._gpuBox,
      addChild,
      iconsPosition
    )
  );

  indicator._itemsPosition.forEach((element) => {
    const group = groupsByItem[element];
    if (group) {
      indicator._box.add_child(group);
    }
  });

  applySecondarySeparatorStyle(indicator);

  if (indicator._box.get_parent() !== indicator) {
    indicator.add_child(indicator._box);
  }
}
