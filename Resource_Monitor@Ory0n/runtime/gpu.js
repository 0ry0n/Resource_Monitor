import { convertTemperature, convertValueToUnit } from "./metrics.js";

export function parseGpuSmiOutput(contents, options) {
  const { memoryMonitor, memoryUnitType, memoryUnitMeasure, temperatureUnit } =
    options;

  return contents
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [
        uuid,
        memoryTotalStr,
        memoryUsedStr,
        memoryFreeStr,
        usageStr,
        temperatureStr,
      ] = line.trim().split(/,\s/);

      const usage = parseInt(usageStr.slice(0, -1), 10);
      const memoryTotal = parseInt(memoryTotalStr.slice(0, -4), 10) * 1024 * 1.024;
      const memoryUsed = parseInt(memoryUsedStr.slice(0, -4), 10) * 1024 * 1.024;
      const memoryFree = parseInt(memoryFreeStr.slice(0, -4), 10) * 1024 * 1.024;
      const rawTemperature = parseInt(temperatureStr, 10);

      let memoryValue = memoryMonitor === "free" ? memoryFree : memoryUsed;
      let memoryUnit = "KB";
      let memoryPercent = null;

      if (memoryUnitType === "perc") {
        memoryPercent = memoryTotal > 0 ? (100 * memoryValue) / memoryTotal : 0;
        memoryValue = memoryPercent;
        memoryUnit = "%";
      } else {
        [memoryValue, memoryUnit] = convertValueToUnit(memoryValue, memoryUnitMeasure);
      }

      const [temperatureValue, temperatureDisplayUnit] = convertTemperature(
        rawTemperature,
        temperatureUnit
      );

      return {
        uuid,
        usage,
        memoryValue,
        memoryUnit,
        memoryPercent,
        temperatureValue,
        temperatureUnit: temperatureDisplayUnit,
      };
    });
}
