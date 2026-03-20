import { convertValuesToUnit, parseNetworkTotals } from "./metrics.js";

export function buildNetworkSample(contents, options) {
  const {
    pattern,
    unit,
    unitMeasure,
    scaleBase = "decimal",
    previousTotals,
    previousIdle,
    currentIdle,
  } = options;
  const totals = parseNetworkTotals(contents, pattern);
  const delta = (currentIdle - (previousIdle || currentIdle)) / 1000;
  const factor = unit === "bits" ? 8 : 1;
  let values = [0, 0];
  let displayUnit = unit === "bits" ? "b" : "B";

  if (delta > 0) {
    values = totals.map((total, index) => {
      const previousValue = previousTotals[index] || 0;
      const deltaCounter = total - previousValue;

      // Counter resets can happen after link/interface resets.
      if (deltaCounter <= 0) {
        return 0;
      }

      return (deltaCounter * factor) / delta;
    });

    const converted = convertValuesToUnit(
      values,
      unitMeasure,
      unit === "bits",
      scaleBase
    );
    values = converted.values;
    displayUnit = converted.unit;
  }

  return {
    totals,
    values,
    unit: displayUnit,
    idle: currentIdle,
  };
}
