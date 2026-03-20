import {
  parseDiskEntry,
  parseGpuEntry,
  serializeDiskEntry,
  serializeGpuEntry,
} from "../Resource_Monitor@Ory0n/common.js";
import {
  buildAmdGpuDisplay,
  buildSysfsGpuDisplay,
  parseGpuSmiOutput,
} from "../Resource_Monitor@Ory0n/runtime/gpu.js";
import { buildMemoryDisplay } from "../Resource_Monitor@Ory0n/runtime/memory.js";
import {
  parseCpuUsage,
  parseDiskStats,
  parseLoadAverage,
} from "../Resource_Monitor@Ory0n/runtime/metrics.js";
import { buildNetworkSample } from "../Resource_Monitor@Ory0n/runtime/network.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertApprox(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertThrows(callback, message) {
  let didThrow = false;
  try {
    callback();
  } catch (error) {
    didThrow = true;
  }

  if (!didThrow) {
    throw new Error(message);
  }
}

function testDiskSerializationRoundtrip() {
  const serialized = serializeDiskEntry({
    device: "/dev/nvme0n1p2",
    stableId: "/dev/disk/by-uuid/1111-2222",
    mountPoint: "/",
    stats: true,
    space: true,
    displayName: "Root",
  });

  const parsed = parseDiskEntry(serialized);
  assert(parsed.device === "/dev/nvme0n1p2", "Disk device should roundtrip");
  assert(
    parsed.stableId === "/dev/disk/by-uuid/1111-2222",
    "Disk stable id should roundtrip"
  );
  assert(parsed.mountPoint === "/", "Disk mountpoint should roundtrip");
  assert(parsed.stats === true, "Disk stats flag should roundtrip");
  assert(parsed.space === true, "Disk space flag should roundtrip");
  assert(parsed.displayName === "Root", "Disk display name should roundtrip");
}

function testLegacySettingsEntriesAreRejected() {
  assertThrows(
    () => parseDiskEntry("/dev/sda1 / true true Root"),
    "Legacy disk entry should be rejected"
  );
  assertThrows(
    () => parseGpuEntry("GPU-uuid-0:NVIDIA:true:false:Main GPU"),
    "Legacy GPU entry should be rejected"
  );
}

function testGpuSerializationRoundtrip() {
  const serialized = serializeGpuEntry({
    device: "GPU-uuid-0",
    name: "NVIDIA RTX",
    usage: true,
    memory: false,
    displayName: "Main GPU",
  });

  const parsed = parseGpuEntry(serialized);
  assert(parsed.device === "GPU-uuid-0", "GPU UUID should roundtrip");
  assert(parsed.name === "NVIDIA RTX", "GPU name should roundtrip");
  assert(parsed.usage === true, "GPU usage flag should roundtrip");
  assert(parsed.memory === false, "GPU memory flag should roundtrip");
  assert(parsed.displayName === "Main GPU", "GPU display name should roundtrip");
}

function testGpuParser() {
  const output = "GPU-uuid-0, 1000 MiB, 250 MiB, 750 MiB, 50 %, 40";

  const numeric = parseGpuSmiOutput(output, {
    memoryMonitor: "used",
    memoryUnitType: "numeric",
    memoryUnitMeasure: "k",
    temperatureUnit: "c",
  });
  assert(numeric.length === 1, "Expected one GPU entry in numeric mode");
  assert(numeric[0].usage === 50, "GPU usage should parse correctly");
  assert(numeric[0].memoryUnit === "KB", "GPU memory unit should be KB in k mode");
  assertApprox(numeric[0].memoryValue, 262144, 0.001, "GPU memory value should match");
  assertApprox(numeric[0].temperatureValue, 40, 0.001, "GPU temperature should match");

  const percent = parseGpuSmiOutput(output, {
    memoryMonitor: "used",
    memoryUnitType: "perc",
    memoryUnitMeasure: "auto",
    temperatureUnit: "f",
  });
  assert(percent.length === 1, "Expected one GPU entry in percent mode");
  assert(percent[0].memoryUnit === "%", "GPU memory unit should be % in perc mode");
  assertApprox(percent[0].memoryValue, 25, 0.001, "GPU percent should match");
  assertApprox(
    percent[0].temperatureValue,
    104,
    0.001,
    "GPU temperature should convert to Fahrenheit"
  );

  const binary = parseGpuSmiOutput(output, {
    memoryMonitor: "used",
    memoryUnitType: "numeric",
    memoryUnitMeasure: "k",
    memoryScaleBase: "binary",
    temperatureUnit: "c",
  });
  assert(binary.length === 1, "Expected one GPU entry in binary mode");
  assert(binary[0].memoryUnit === "KiB", "GPU memory unit should be KiB in binary mode");
  assertApprox(binary[0].memoryValue, 256000, 0.001, "GPU binary memory value should match");
}

function testAmdGpuDisplay() {
  const entries = buildAmdGpuDisplay(
    [
      {
        device: "amd:card0",
        usagePercent: 42,
        memoryTotalBytes: 8_000_000_000,
        memoryUsedBytes: 2_000_000_000,
        memoryFreeBytes: 6_000_000_000,
        temperatureCelsius: 55,
      },
    ],
    {
      memoryMonitor: "used",
      memoryUnitType: "numeric",
      memoryUnitMeasure: "g",
      memoryScaleBase: "decimal",
      temperatureUnit: "c",
    }
  );

  assert(entries.length === 1, "Expected one AMD entry");
  assert(entries[0].uuid === "amd:card0", "AMD id should be preserved");
  assertApprox(entries[0].usage, 42, 0.001, "AMD usage should match");
  assertApprox(entries[0].memoryValue, 2, 0.001, "AMD memory should convert to GB");
  assert(entries[0].memoryUnit === "GB", "AMD memory unit should be GB");
  assertApprox(entries[0].temperatureValue, 55, 0.001, "AMD temperature should match");
}

function testIntelGpuDisplay() {
  const entries = buildSysfsGpuDisplay(
    [
      {
        device: "intel:card1",
        usagePercent: 63,
        memoryTotalBytes: 8_000_000_000,
        memoryUsedBytes: 3_000_000_000,
        memoryFreeBytes: 5_000_000_000,
        temperatureCelsius: 61,
      },
    ],
    {
      memoryMonitor: "used",
      memoryUnitType: "numeric",
      memoryUnitMeasure: "g",
      memoryScaleBase: "decimal",
      temperatureUnit: "c",
    }
  );

  assert(entries.length === 1, "Expected one Intel entry");
  assert(entries[0].uuid === "intel:card1", "Intel id should be preserved");
  assertApprox(entries[0].usage, 63, 0.001, "Intel usage should match");
  assertApprox(entries[0].memoryValue, 3, 0.001, "Intel memory should convert to GB");
  assert(entries[0].memoryUnit === "GB", "Intel memory unit should be GB");
  assertApprox(entries[0].temperatureValue, 61, 0.001, "Intel temperature should match");
}

function testMemoryDisplay() {
  const meminfo = new TextEncoder().encode(
    "MemTotal:       1000 kB\nMemAvailable:    250 kB\n"
  );

  const usedNumeric = buildMemoryDisplay(meminfo, {
    totalKey: "MemTotal",
    availableKey: "MemAvailable",
    monitor: "used",
    unitType: "numeric",
    unitMeasure: "k",
  });
  assertApprox(usedNumeric.value, 768, 0.001, "Used memory should be 768");
  assert(usedNumeric.unit === "KB", "Used numeric unit should be KB");

  const usedNumericBinary = buildMemoryDisplay(meminfo, {
    totalKey: "MemTotal",
    availableKey: "MemAvailable",
    monitor: "used",
    unitType: "numeric",
    unitMeasure: "k",
    scaleBase: "binary",
  });
  assertApprox(usedNumericBinary.value, 750, 0.001, "Used binary memory should be 750");
  assert(usedNumericBinary.unit === "KiB", "Used binary unit should be KiB");

  const freePercent = buildMemoryDisplay(meminfo, {
    totalKey: "MemTotal",
    availableKey: "MemAvailable",
    monitor: "free",
    unitType: "perc",
    unitMeasure: "auto",
  });
  assertApprox(freePercent.value, 25, 0.001, "Free memory percent should be 25");
  assert(freePercent.unit === "%", "Free memory percent unit should be %");
}

function testCpuUsageBaseline() {
  const stat = new TextEncoder().encode("cpu  100 0 50 200 0 0 0 0 0 0\n");
  const first = parseCpuUsage(stat, { total: 0, idle: 0 });
  assertApprox(first.usage, 0, 0.001, "First CPU sample should be baseline 0");

  const nextStat = new TextEncoder().encode("cpu  120 0 60 260 0 0 0 0 0 0\n");
  const second = parseCpuUsage(nextStat, first.sample);
  assert(second.usage >= 0, "Second CPU sample usage should be non-negative");
}

function testDiskStatsSectorConversion() {
  const diskstats = new TextEncoder().encode(
    "   8       0 sda 0 0 2 0 0 0 4 0 0 0 0 0 0 0 0 0 0\n"
  );

  const entries = parseDiskStats(diskstats);
  assert(entries.length === 1, "Expected one diskstats entry");
  assertApprox(
    entries[0].readBytes,
    1024,
    0.001,
    "Read sectors should convert to bytes"
  );
  assertApprox(
    entries[0].writeBytes,
    2048,
    0.001,
    "Write sectors should convert to bytes"
  );
}

function testNetworkCounterReset() {
  const netDev = new TextEncoder().encode(
    "Inter-|   Receive                                                |  Transmit\n" +
      " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n" +
      "  eth0: 1000 0 0 0 0 0 0 0 2000 0 0 0 0 0 0 0\n"
  );
  const sample = buildNetworkSample(netDev, {
    pattern: /^eth[0-9]+$/,
    unit: "bytes",
    unitMeasure: "b",
    scaleBase: "decimal",
    previousTotals: [5000, 6000],
    previousIdle: 1000,
    currentIdle: 2000,
  });

  assertApprox(
    sample.values[0],
    0,
    0.001,
    "Network rx should clamp to zero on counter reset"
  );
  assertApprox(
    sample.values[1],
    0,
    0.001,
    "Network tx should clamp to zero on counter reset"
  );

  const scaled = buildNetworkSample(netDev, {
    pattern: /^eth[0-9]+$/,
    unit: "bytes",
    unitMeasure: "k",
    scaleBase: "decimal",
    previousTotals: [0, 0],
    previousIdle: 1000,
    currentIdle: 2000,
  });
  assert(
    scaled.unit === "KB",
    "Decimal network scale should use KB unit when fixed to k"
  );
}

function testNetworkParsingWithoutTrailingNewline() {
  const netDev = new TextEncoder().encode(
    "Inter-|   Receive                                                |  Transmit\n" +
      " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n" +
      "  eth0: 1000 0 0 0 0 0 0 0 2000 0 0 0 0 0 0 0"
  );

  const sample = buildNetworkSample(netDev, {
    pattern: /^eth[0-9]+$/,
    unit: "bytes",
    unitMeasure: "b",
    scaleBase: "decimal",
    previousTotals: [0, 0],
    previousIdle: 1000,
    currentIdle: 2000,
  });

  assertApprox(sample.values[0], 1000, 0.001, "Network rx should be parsed");
  assertApprox(sample.values[1], 2000, 0.001, "Network tx should be parsed");
}

function testLoadAverageInvalidInputFallback() {
  const invalid = new TextEncoder().encode("not-a-number ??? ??\n");
  const parsed = parseLoadAverage(invalid);

  assertApprox(parsed[0], 0, 0.001, "Invalid load average one should be 0");
  assertApprox(parsed[1], 0, 0.001, "Invalid load average five should be 0");
  assertApprox(
    parsed[2],
    0,
    0.001,
    "Invalid load average fifteen should be 0"
  );
}

testDiskSerializationRoundtrip();
testLegacySettingsEntriesAreRejected();
testGpuSerializationRoundtrip();
testGpuParser();
testAmdGpuDisplay();
testIntelGpuDisplay();
testMemoryDisplay();
testCpuUsageBaseline();
testDiskStatsSectorConversion();
testNetworkCounterReset();
testNetworkParsingWithoutTrailingNewline();
testLoadAverageInvalidInputFallback();

console.log("Runtime smoke tests passed.");
