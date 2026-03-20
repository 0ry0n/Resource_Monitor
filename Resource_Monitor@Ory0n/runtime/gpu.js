import {
  convertTemperature,
  convertValueToUnit,
  getBaseStorageUnit,
  getDataScaleFactor,
} from "./metrics.js";

const BYTES_PER_MIB = 1024 * 1024;

function _buildGpuDisplayEntry(raw, options) {
  const {
    memoryMonitor,
    memoryUnitType,
    memoryUnitMeasure,
    temperatureUnit,
    memoryScaleBase = "decimal",
  } = options;
  const {
    id,
    usage,
    memoryTotalBytes,
    memoryUsedBytes,
    memoryFreeBytes = null,
    temperatureCelsius,
  } = raw;

  let memoryValue = null;
  let memoryUnit = getBaseStorageUnit(memoryScaleBase);
  let memoryPercent = null;

  if (
    Number.isFinite(memoryTotalBytes) &&
    memoryTotalBytes > 0 &&
    Number.isFinite(memoryUsedBytes) &&
    memoryUsedBytes >= 0
  ) {
    const clampedUsedBytes = Math.min(memoryUsedBytes, memoryTotalBytes);
    const freeBytes = Number.isFinite(memoryFreeBytes)
      ? Math.max(0, memoryFreeBytes)
      : Math.max(0, memoryTotalBytes - clampedUsedBytes);

    if (memoryUnitType === "perc") {
      const usedPercent = (100 * clampedUsedBytes) / memoryTotalBytes;
      memoryPercent = memoryMonitor === "free" ? 100 - usedPercent : usedPercent;
      memoryValue = memoryPercent;
      memoryUnit = "%";
    } else {
      const factor = getDataScaleFactor(memoryScaleBase);
      const memoryBytes = memoryMonitor === "free" ? freeBytes : clampedUsedBytes;
      const baseValue = memoryBytes / factor;
      [memoryValue, memoryUnit] = convertValueToUnit(
        baseValue,
        memoryUnitMeasure,
        false,
        memoryScaleBase
      );
    }
  }

  let temperatureValue = null;
  let temperatureDisplayUnit = temperatureUnit === "f" ? "°F" : "°C";
  if (Number.isFinite(temperatureCelsius)) {
    [temperatureValue, temperatureDisplayUnit] = convertTemperature(
      temperatureCelsius,
      temperatureUnit
    );
  }

  return {
    uuid: id,
    usage: Number.isFinite(usage) ? usage : null,
    memoryValue,
    memoryUnit,
    memoryPercent,
    temperatureValue,
    temperatureUnit: temperatureDisplayUnit,
  };
}

export function parseGpuSmiOutput(contents, options) {
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
        !memoryFreeMatch
      ) {
        return null;
      }

      const usage = usageMatch ? parseInt(usageMatch[1], 10) : null;
      const memoryTotalBytes = parseInt(memoryTotalMatch[1], 10) * BYTES_PER_MIB;
      const memoryUsedBytes = parseInt(memoryUsedMatch[1], 10) * BYTES_PER_MIB;
      const memoryFreeBytes = parseInt(memoryFreeMatch[1], 10) * BYTES_PER_MIB;
      const temperatureCelsius = temperatureMatch
        ? parseInt(temperatureMatch[1], 10)
        : null;

      return _buildGpuDisplayEntry(
        {
          id: uuid,
          usage,
          memoryTotalBytes,
          memoryUsedBytes,
          memoryFreeBytes,
          temperatureCelsius,
        },
        options
      );
    })
    .filter(Boolean);
}

export function buildSysfsGpuDisplay(readings, options) {
  return readings
    .map((reading) =>
      _buildGpuDisplayEntry(
        {
          id: reading.device,
          usage: reading.usagePercent,
          memoryTotalBytes: reading.memoryTotalBytes,
          memoryUsedBytes: reading.memoryUsedBytes,
          memoryFreeBytes: reading.memoryFreeBytes,
          temperatureCelsius: reading.temperatureCelsius,
        },
        options
      )
    )
    .filter(Boolean);
}

export function buildAmdGpuDisplay(readings, options) {
  return buildSysfsGpuDisplay(readings, options);
}
