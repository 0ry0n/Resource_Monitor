import { convertValueToUnit, parseDiskStats } from "./metrics.js";

export function parseDiskStatsEntries(contents) {
  return parseDiskStats(contents);
}

export function buildDiskSpaceDisplay(entry, options) {
  const { monitor, unitType, unitMeasure } = options;

  if (unitType === "perc") {
    const value = monitor === "free" ? 100 - entry.usedPercent : entry.usedPercent;
    return {
      value,
      unit: "%",
      isPercent: true,
    };
  }

  const sizeInKilobytes =
    monitor === "free" ? entry.availableKilobytes : entry.usedKilobytes;
  const [value, unit] = convertValueToUnit(sizeInKilobytes, unitMeasure);

  return {
    value,
    unit,
    isPercent: false,
  };
}
