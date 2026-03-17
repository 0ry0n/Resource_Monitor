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
      ] = line.trim().split(/,\s*/);

      if (
        !uuid ||
        !memoryTotalStr ||
        !memoryUsedStr ||
        !memoryFreeStr ||
        !usageStr ||
        !temperatureStr
      ) {
        return null;
      }

      const memoryTotalMatch = memoryTotalStr.match(/(\d+)/);
      const memoryUsedMatch = memoryUsedStr.match(/(\d+)/);
      const memoryFreeMatch = memoryFreeStr.match(/(\d+)/);
      const usageMatch = usageStr.match(/(\d+)/);
      const temperatureMatch = temperatureStr.match(/(-?\d+)/);

      if (
        !memoryTotalMatch ||
        !memoryUsedMatch ||
        !memoryFreeMatch ||
        !usageMatch ||
        !temperatureMatch
      ) {
        return null;
      }

      const usage = parseInt(usageMatch[1], 10);
      const memoryTotal = parseInt(memoryTotalMatch[1], 10) * 1024 * 1.024;
      const memoryUsed = parseInt(memoryUsedMatch[1], 10) * 1024 * 1.024;
      const memoryFree = parseInt(memoryFreeMatch[1], 10) * 1024 * 1.024;
      const rawTemperature = parseInt(temperatureMatch[1], 10);

      if (
        !Number.isFinite(usage) ||
        !Number.isFinite(memoryTotal) ||
        !Number.isFinite(memoryUsed) ||
        !Number.isFinite(memoryFree) ||
        !Number.isFinite(rawTemperature)
      ) {
        return null;
      }

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
    })
    .filter(Boolean);
}
