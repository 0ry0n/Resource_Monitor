import {
  normalizeFormattingSettings,
  RENDER_MODE_STEP,
} from "../indicatorFormatting.js";

function normalizeColorComponent(component) {
  if (!Number.isFinite(component)) {
    return null;
  }

  const scaled = component > 1 ? component : component * 255;
  return Math.max(0, Math.min(255, Math.round(scaled)));
}

function parseColorThreshold(colorItem, separator) {
  if (typeof colorItem !== "string") {
    return null;
  }

  const parts = colorItem.split(separator);
  if (parts.length !== 4) {
    return null;
  }

  const [thresholdRaw, rRaw, gRaw, bRaw] = parts.map(Number);
  const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : null;
  const r = normalizeColorComponent(rRaw);
  const g = normalizeColorComponent(gRaw);
  const b = normalizeColorComponent(bRaw);

  if (threshold === null || r === null || g === null || b === null) {
    return null;
  }

  return {
    threshold,
    style: `color: rgb(${r}, ${g}, ${b});`,
  };
}

function getNormalizedThresholds(colors, separator) {
  return colors
    .map((colorItem) => parseColorThreshold(colorItem, separator))
    .filter(Boolean)
    .sort((first, second) => first.threshold - second.threshold);
}

export function getUsageColor(value, colors, separator = " ") {
  if (!colors || colors.length === 0) {
    return "";
  }

  const normalizedValue = Array.isArray(value)
    ? Math.max(...value.filter(Number.isFinite))
    : value;

  if (!Number.isFinite(normalizedValue)) {
    return "";
  }

  const thresholds = getNormalizedThresholds(colors, separator);
  if (thresholds.length === 0) {
    return "";
  }

  for (let index = thresholds.length - 1; index >= 0; index--) {
    const threshold = thresholds[index];
    if (normalizedValue > threshold.threshold) {
      return threshold.style;
    }
  }

  return "";
}

export function getValueFixed(value, formatting = {}) {
  const normalizedFormatting =
    typeof formatting === "boolean"
      ? normalizeFormattingSettings({
        decimals: formatting ? 1 : 0,
      })
      : normalizeFormattingSettings(formatting);

  const normalizedValue =
    normalizedFormatting.renderMode === RENDER_MODE_STEP
      ? Math.floor(value / normalizedFormatting.renderStep) *
        normalizedFormatting.renderStep
      : value;

  return normalizedValue.toFixed(normalizedFormatting.decimals);
}

const DECIMAL_FACTOR = 1000;
const BINARY_FACTOR = 1024;
const DISKSTAT_SECTOR_BYTES = 512;

export function getDataScaleFactor(scaleBase = "decimal") {
  return scaleBase === "binary" ? BINARY_FACTOR : DECIMAL_FACTOR;
}

function getStorageUnitSuffixes(scaleBase = "decimal") {
  return scaleBase === "binary"
    ? ["KiB", "MiB", "GiB", "TiB"]
    : ["KB", "MB", "GB", "TB"];
}

function getThroughputUnitSuffixes(scaleBase = "decimal", isBits = false) {
  if (isBits) {
    return scaleBase === "binary"
      ? ["b", "Kib", "Mib", "Gib", "Tib"]
      : ["b", "kb", "Mb", "Gb", "Tb"];
  }

  return scaleBase === "binary"
    ? ["B", "KiB", "MiB", "GiB", "TiB"]
    : ["B", "KB", "MB", "GB", "TB"];
}

export function getBaseStorageUnit(scaleBase = "decimal") {
  return getStorageUnitSuffixes(scaleBase)[0];
}

export function convertValueToUnit(
  value,
  unitMeasure,
  isHertz = false,
  scaleBase = "decimal"
) {
  const factor = isHertz ? DECIMAL_FACTOR : getDataScaleFactor(scaleBase);
  const unitSuffixes = isHertz
    ? ["kHz", "MHz", "GHz", "THz"]
    : getStorageUnitSuffixes(scaleBase);

  let unit = unitSuffixes[0];

  switch (unitMeasure) {
    case "k":
      break;
    case "m":
      value /= factor;
      unit = unitSuffixes[1];
      break;
    case "g":
      value /= factor ** 2;
      unit = unitSuffixes[2];
      break;
    case "t":
      value /= factor ** 3;
      unit = unitSuffixes[3];
      break;
    case "auto":
    default: {
      let exponent = 0;
      for (let index = 1; index <= 3; index++) {
        if (value >= factor ** index) {
          exponent = index;
        }
      }

      value /= factor ** exponent;
      unit = unitSuffixes[exponent];
      break;
    }
  }

  return [value, unit];
}

export function convertValuesToUnit(
  values,
  unitMeasure,
  isBits = false,
  scaleBase = "decimal"
) {
  const factor = getDataScaleFactor(scaleBase);
  const unitSuffixes = getThroughputUnitSuffixes(scaleBase, isBits);
  const normalizedMeasure = unitMeasure?.toLowerCase();
  const sanitizedValues = values.map((currentValue) =>
    Number.isFinite(currentValue) ? Math.max(0, currentValue) : 0
  );

  let exponent = 0;

  switch (normalizedMeasure) {
    case "b":
      exponent = 0;
      break;
    case "k":
      exponent = 1;
      break;
    case "m":
      exponent = 2;
      break;
    case "g":
      exponent = 3;
      break;
    case "t":
      exponent = 4;
      break;
    default:
      while (
        sanitizedValues.some(
          (currentValue) => currentValue >= factor ** (exponent + 1)
        ) &&
        exponent < 4
      ) {
        exponent++;
      }
      break;
  }

  return {
    values: sanitizedValues.map(
      (currentValue) => currentValue / factor ** exponent
    ),
    unit: unitSuffixes[exponent],
  };
}

export function getFixedDataUnitForMeasure(
  unitMeasure,
  scaleBase = "decimal",
  isBits = false
) {
  const unitSuffixes = getThroughputUnitSuffixes(scaleBase, isBits);

  switch (unitMeasure?.toLowerCase()) {
    case "k":
      return unitSuffixes[1];
    case "m":
      return unitSuffixes[2];
    case "g":
      return unitSuffixes[3];
    case "t":
      return unitSuffixes[4];
    case "b":
    case "auto":
    default:
      return unitSuffixes[0];
  }
}

export function convertTemperature(tempCelsius, preferredUnit) {
  return preferredUnit === "f"
    ? [tempCelsius * 1.8 + 32, "°F"]
    : [tempCelsius, "°C"];
}

export function parseCpuUsage(contents, previousSample) {
  const lines = new TextDecoder().decode(contents).split("\n");
  const entry = lines[0]?.trim().split(/\s+/) || [];
  if (entry.length < 5 || entry[0] !== "cpu") {
    return {
      usage: 0,
      sample: {
        total: previousSample.total || 0,
        idle: previousSample.idle || 0,
      },
    };
  }
  const idle = parseInt(entry[4], 10) + (parseInt(entry[5], 10) || 0);

  let total = 0;
  for (let index = 1; index < entry.length; index++) {
    const value = parseInt(entry[index], 10);
    if (!isNaN(value)) {
      total += value;
    }
  }

  const hasPreviousSample =
    Number.isFinite(previousSample.total) &&
    Number.isFinite(previousSample.idle) &&
    previousSample.total > 0 &&
    previousSample.idle >= 0;

  if (!hasPreviousSample) {
    return {
      usage: 0,
      sample: {
        total,
        idle,
      },
    };
  }

  const deltaTotal = total - (previousSample.total || 0);
  const deltaIdle = idle - (previousSample.idle || 0);
  const usage =
    deltaTotal > 0
      ? (100 * Math.max(0, deltaTotal - Math.max(0, deltaIdle))) / deltaTotal
      : 0;

  return {
    usage,
    sample: {
      total,
      idle,
    },
  };
}

export function parseMemoryValue(contents, totalKey, availableKey) {
  const lines = new TextDecoder().decode(contents).split("\n");

  let total = 0;
  let available = 0;

  for (const line of lines) {
    if (line.startsWith(totalKey)) {
      const match = line.match(/^\w+:\s*(\d+)\s*kB$/);
      if (match) {
        total = parseInt(match[1], 10);
      }
    } else if (line.startsWith(availableKey)) {
      const match = line.match(/^\w+:\s*(\d+)\s*kB$/);
      if (match) {
        available = parseInt(match[1], 10);
      }
    }

    if (total && available) {
      break;
    }
  }

  return {
    total,
    available,
    used: total - available,
  };
}

export function parseDiskStats(contents) {
  return new TextDecoder()
    .decode(contents)
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter((entry) => entry.length >= 10 && entry[2] && !/^loop/.test(entry[2]))
    .map((entry) => {
      const readSectors = parseInt(entry[5], 10);
      const writeSectors = parseInt(entry[9], 10);

      if (!Number.isFinite(readSectors) || !Number.isFinite(writeSectors)) {
        return null;
      }

      return {
        device: entry[2],
        readBytes: readSectors * DISKSTAT_SECTOR_BYTES,
        writeBytes: writeSectors * DISKSTAT_SECTOR_BYTES,
      };
    })
    .filter(Boolean);
}

export function parseNetworkTotals(contents, pattern) {
  const lines = new TextDecoder().decode(contents).split("\n");
  const totals = [0, 0];

  for (let index = 2; index < lines.length; index++) {
    const line = lines[index].trim();
    const splitLine = line.split(":");
    if (splitLine.length < 2) {
      continue;
    }

    const iface = splitLine[0].trim();
    const data = splitLine[1].trim();

    if (!pattern.test(iface)) {
      continue;
    }

    const values = data.split(/\s+/);
    const rxBytes = parseInt(values[0], 10);
    const txBytes = parseInt(values[8], 10);

    if (!Number.isFinite(rxBytes) || !Number.isFinite(txBytes)) {
      continue;
    }

    totals[0] += rxBytes;
    totals[1] += txBytes;
  }

  return totals;
}

export function parseLoadAverage(contents) {
  const line = new TextDecoder().decode(contents);
  const [one, five, fifteen] = line
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(parseFloat);

  return [one, five, fifteen].map((value) =>
    Number.isFinite(value) ? value : 0
  );
}
