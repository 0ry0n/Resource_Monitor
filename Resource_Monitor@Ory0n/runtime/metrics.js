function normalizeColorComponent(component) {
  if (!Number.isFinite(component)) {
    return null;
  }

  const scaled = component > 1 ? component : component * 255;
  return Math.max(0, Math.min(255, Math.round(scaled)));
}

function normalizeColorEntry(colorItem, separator = " ") {
  if (typeof colorItem !== "string") {
    return "";
  }

  return colorItem.includes("undefined")
    ? colorItem.replaceAll("undefined", separator)
    : colorItem;
}

function parseColorThreshold(colorItem, separator) {
  const [thresholdRaw, rRaw, gRaw, bRaw] = normalizeColorEntry(
    colorItem,
    separator
  )
    .split(separator)
    .map(Number);
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

export function getValueFixed(value, showDecimals) {
  return showDecimals ? value.toFixed(1) : value.toFixed(0);
}

export function convertValueToUnit(value, unitMeasure, isHertz = false) {
  const factor = 1000;
  const unitSuffixes = isHertz
    ? ["KHz", "MHz", "GHz", "THz"]
    : ["KB", "MB", "GB", "TB"];

  let unit = isHertz ? "KHz" : "KB";

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

export function convertValuesToUnit(values, unitMeasure, isBits = false) {
  const factor = 1024;
  const unitSuffixes = isBits
    ? ["b", "k", "m", "g", "t"]
    : ["B", "K", "M", "G", "T"];
  const normalizedUnit = isBits
    ? unitMeasure?.toLowerCase()
    : unitMeasure?.toUpperCase();

  let exponent = 0;

  if (normalizedUnit && unitSuffixes.includes(normalizedUnit)) {
    exponent = unitSuffixes.indexOf(normalizedUnit);
  } else {
    while (
      values.some((currentValue) => currentValue >= factor ** (exponent + 1)) &&
      exponent < 4
    ) {
      exponent++;
    }
  }

  return {
    values: values.map((currentValue) => currentValue / factor ** exponent),
    unit: unitSuffixes[exponent],
  };
}

export function convertTemperature(tempCelsius, preferredUnit) {
  return preferredUnit === "f"
    ? [tempCelsius * 1.8 + 32, "°F"]
    : [tempCelsius, "°C"];
}

export function parseCpuUsage(contents, previousSample) {
  const lines = new TextDecoder().decode(contents).split("\n");
  const entry = lines[0].trim().split(/\s+/);
  const idle = parseInt(entry[4], 10) + (parseInt(entry[5], 10) || 0);

  let total = 0;
  for (let index = 1; index < entry.length; index++) {
    const value = parseInt(entry[index], 10);
    if (!isNaN(value)) {
      total += value;
    }
  }

  const deltaTotal = total - (previousSample.total || 0);
  const deltaIdle = idle - (previousSample.idle || 0);

  return {
    usage: deltaTotal ? (100 * (deltaTotal - deltaIdle)) / deltaTotal : 0,
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
    .filter((entry) => entry[2] && !/^loop/.test(entry[2]))
    .map((entry) => ({
      device: entry[2],
      readKilobytes: parseInt(entry[5], 10) / 2,
      writeKilobytes: parseInt(entry[9], 10) / 2,
    }));
}

export function parseNetworkTotals(contents, pattern) {
  const lines = new TextDecoder().decode(contents).split("\n");
  const totals = [0, 0];

  for (let index = 2; index < lines.length - 1; index++) {
    const line = lines[index].trim();
    const [iface, data] = line.split(":").map((segment) => segment.trim());

    if (!pattern.test(iface)) {
      continue;
    }

    const values = data.split(/\s+/);
    totals[0] += parseInt(values[0], 10);
    totals[1] += parseInt(values[8], 10);
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

  return [one, five, fifteen];
}
