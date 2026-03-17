import { convertValueToUnit, parseDiskStats } from "./metrics.js";

export function parseDiskStatsEntries(contents) {
  return parseDiskStats(contents);
}

export function parseDiskSpaceTable(contents) {
  return contents
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/);
      if (!match) {
        return null;
      }

      const [, filesystem, usedStr, availStr, usedPercentStr] = match;
      return {
        filesystem,
        usedKilobytes: parseInt(usedStr, 10),
        availableKilobytes: parseInt(availStr, 10),
        usedPercent: parseInt(usedPercentStr.slice(0, -1), 10),
      };
    })
    .filter(Boolean);
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
