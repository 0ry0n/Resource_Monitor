import { convertValueToUnit, parseMemoryValue } from "./metrics.js";

const LINUX_KIB_TO_DECIMAL_KB = 1024 / 1000;

export function buildMemoryDisplay(contents, options) {
  const {
    totalKey,
    availableKey,
    monitor,
    unitType,
    unitMeasure,
    scaleBase = "decimal",
  } = options;
  const { total, available, used } = parseMemoryValue(
    contents,
    totalKey,
    availableKey
  );

  let value = monitor === "free" ? available : used;
  let unit = scaleBase === "binary" ? "KiB" : "KB";

  if (unitType === "perc") {
    value = total > 0 ? (100 * value) / total : 0;
    unit = "%";
  } else {
    // /proc/meminfo reports values in KiB.
    // Convert to decimal KB only when decimal scale is selected.
    const normalizedValue =
      scaleBase === "binary" ? value : value * LINUX_KIB_TO_DECIMAL_KB;
    [value, unit] = convertValueToUnit(
      normalizedValue,
      unitMeasure,
      false,
      scaleBase
    );
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
