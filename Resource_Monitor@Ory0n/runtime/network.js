import { convertValuesToUnit, parseNetworkTotals } from "./metrics.js";

export function buildNetworkSample(contents, options) {
  const {
    pattern,
    unit,
    unitMeasure,
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
    values = totals.map(
      (total, index) => ((total - (previousTotals[index] || 0)) * factor) / delta
    );

    const converted = convertValuesToUnit(values, unitMeasure, unit === "bits");
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
