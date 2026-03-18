import {
  convertValueToUnit,
  getDataScaleFactor,
  parseDiskStats,
} from "./metrics.js";

export function parseDiskStatsEntries(contents) {
  return parseDiskStats(contents);
}

export function buildDiskSpaceDisplay(entry, options) {
  const { monitor, unitType, unitMeasure, scaleBase = "decimal" } = options;

  if (unitType === "perc") {
    const value = monitor === "free" ? 100 - entry.usedPercent : entry.usedPercent;
    return {
      value,
      unit: "%",
      isPercent: true,
    };
  }

  const factor = getDataScaleFactor(scaleBase);
  const sizeInBaseUnit =
    monitor === "free"
      ? entry.availableBytes / factor
      : entry.usedBytes / factor;
  const [value, unit] = convertValueToUnit(
    sizeInBaseUnit,
    unitMeasure,
    false,
    scaleBase
  );

  return {
    value,
    unit,
    isPercent: false,
  };
}
