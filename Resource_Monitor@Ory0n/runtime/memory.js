import { convertValueToUnit, parseMemoryValue } from "./metrics.js";

export function buildMemoryDisplay(contents, options) {
  const { totalKey, availableKey, monitor, unitType, unitMeasure } = options;
  const { total, available, used } = parseMemoryValue(
    contents,
    totalKey,
    availableKey
  );

  let value = monitor === "free" ? available : used;
  let unit = "KB";

  if (unitType === "perc") {
    value = total > 0 ? (100 * value) / total : 0;
    unit = "%";
  } else {
    [value, unit] = convertValueToUnit(value, unitMeasure);
  }

  return {
    total,
    available,
    used,
    value,
    unit,
    isPercent: unitType === "perc",
  };
}
