import GLib from "gi://GLib";
import { loadFile } from "../runtime/io.js";

const AMD_VENDOR_ID = "0x1002";
const INTEL_VENDOR_ID = "0x8086";
const DRM_SYSFS_PATH = "/sys/class/drm";
const DISK_STABLE_ID_DIRECTORIES = [
  "/dev/disk/by-uuid",
  "/dev/disk/by-partuuid",
  "/dev/disk/by-id",
];
const DISK_IGNORED_FILESYSTEMS = new Set([
  "squashfs",
  "tmpfs",
]);
const SUPPORTED_CPU_THERMAL_CHIPS = new Set([
  "coretemp",
  "k10temp",
  "zenpower",
]);

function _readDirectoryEntries(path, pattern = null) {
  try {
    const directory = GLib.Dir.open(path, 0);
    const entries = [];

    for (let name = directory.read_name(); name !== null; name = directory.read_name()) {
      if (!pattern || pattern.test(name)) {
        entries.push(name);
      }
    }

    return entries.sort();
  } catch (error) {
    return [];
  }
}

async function _readTextFile(path, cancellable) {
  try {
    const contents = await loadFile(path, cancellable);
    return new TextDecoder().decode(contents).trim();
  } catch (error) {
    if (cancellable?.is_cancelled()) {
      throw error;
    }
    return null;
  }
}

function _canonicalizePath(path, relativeTo = null) {
  return GLib.canonicalize_filename(path, relativeTo);
}

function _resolveSymlinkPath(path, maxDepth = 8) {
  if (!path) {
    return path;
  }

  let currentPath = _canonicalizePath(path);
  let depth = 0;

  while (
    depth < maxDepth &&
    GLib.file_test(currentPath, GLib.FileTest.IS_SYMLINK)
  ) {
    try {
      const target = GLib.file_read_link(currentPath);
      currentPath = _canonicalizePath(target, GLib.path_get_dirname(currentPath));
    } catch (error) {
      break;
    }
    depth++;
  }

  return currentPath;
}

function _decodeProcMountField(field) {
  return field
    .replaceAll("\\040", " ")
    .replaceAll("\\011", "\t")
    .replaceAll("\\012", "\n")
    .replaceAll("\\134", "\\");
}

export function resolveDiskDevicePath(devicePath) {
  if (!devicePath || !devicePath.startsWith("/dev/")) {
    return devicePath;
  }

  return _resolveSymlinkPath(devicePath);
}

export function getDiskStableIdIndex() {
  const index = new Map();

  DISK_STABLE_ID_DIRECTORIES.forEach((directory) => {
    if (!GLib.file_test(directory, GLib.FileTest.IS_DIR)) {
      return;
    }

    _readDirectoryEntries(directory).forEach((entry) => {
      const symlinkPath = `${directory}/${entry}`;
      if (!GLib.file_test(symlinkPath, GLib.FileTest.IS_SYMLINK)) {
        return;
      }

      const resolvedPath = resolveDiskDevicePath(symlinkPath);
      if (!resolvedPath || !resolvedPath.startsWith("/dev/")) {
        return;
      }

      if (!index.has(resolvedPath)) {
        index.set(resolvedPath, symlinkPath);
      }
    });
  });

  return index;
}

export function getDiskStableId(devicePath, stableIdIndex = null) {
  const resolvedPath = resolveDiskDevicePath(devicePath);
  if (!resolvedPath || !resolvedPath.startsWith("/dev/")) {
    return "";
  }

  const index = stableIdIndex ?? getDiskStableIdIndex();
  return index.get(resolvedPath) ?? "";
}

export async function getMountedDiskEntries(cancellable = null) {
  const contents = await loadFile("/proc/self/mounts", cancellable);
  const stableIdIndex = getDiskStableIdIndex();

  return new TextDecoder()
    .decode(contents)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(" "))
    .filter((parts) => parts.length >= 3)
    .map((parts) => {
      const source = parts[0];
      const mountPoint = _decodeProcMountField(parts[1]);
      const fsType = parts[2];

      if (
        DISK_IGNORED_FILESYSTEMS.has(fsType) ||
        !source.startsWith("/dev/")
      ) {
        return null;
      }

      const resolvedDevice = resolveDiskDevicePath(source);
      return {
        filesystem: resolvedDevice,
        mountPoint,
        stableId: getDiskStableId(resolvedDevice, stableIdIndex),
      };
    })
    .filter(Boolean);
}

function _findFirstExistingPath(paths) {
  for (const path of paths) {
    if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
      return path;
    }
  }

  return null;
}

async function _buildGpuDisplayName(vendorLabel, card, basePath, cancellable) {
  const productName = await _readTextFile(`${basePath}/product_name`, cancellable);
  if (productName) {
    return productName;
  }

  const deviceId = await _readTextFile(`${basePath}/device`, cancellable);
  if (deviceId) {
    return `${vendorLabel} GPU ${deviceId}`;
  }

  return `${vendorLabel} GPU (${card})`;
}

function _findGpuTemperaturePath(basePath) {
  const hwmonRootPath = `${basePath}/hwmon`;
  const hwmonEntries = _readDirectoryEntries(hwmonRootPath, /^hwmon\d+$/);

  for (const hwmonEntry of hwmonEntries) {
    const hwmonPath = `${hwmonRootPath}/${hwmonEntry}`;
    const sensorEntries = _readDirectoryEntries(hwmonPath, /^temp\d+_input$/);

    if (sensorEntries.length > 0) {
      return `${hwmonPath}/${sensorEntries[0]}`;
    }
  }

  return null;
}

async function _buildSysfsGpuDescriptors({
  vendorId,
  vendorPrefix,
  vendorLabel,
  usageCandidates = [],
  memoryCandidates = [],
}, cancellable) {
  const descriptors = await Promise.all(
    _readDirectoryEntries(DRM_SYSFS_PATH, /^card\d+$/).map(async (card) => {
      const basePath = `${DRM_SYSFS_PATH}/${card}/device`;
      const vendor = await _readTextFile(`${basePath}/vendor`, cancellable);
      if (vendor !== vendorId) {
        return null;
      }

      const usagePath = _findFirstExistingPath(
        usageCandidates.map((candidate) => `${basePath}/${candidate}`)
      );
      let memoryTotalPath = null;
      let memoryUsedPath = null;

      for (const memoryCandidate of memoryCandidates) {
        const totalPath = `${basePath}/${memoryCandidate.total}`;
        const usedPath = `${basePath}/${memoryCandidate.used}`;

        if (
          GLib.file_test(totalPath, GLib.FileTest.EXISTS) &&
          GLib.file_test(usedPath, GLib.FileTest.EXISTS)
        ) {
          memoryTotalPath = totalPath;
          memoryUsedPath = usedPath;
          break;
        }
      }

      return {
        card,
        device: `${vendorPrefix}:${card}`,
        name: await _buildGpuDisplayName(vendorLabel, card, basePath, cancellable),
        usagePath,
        memoryTotalPath,
        memoryUsedPath,
        temperaturePath: _findGpuTemperaturePath(basePath),
      };
    })
  );
  return descriptors
    .filter(Boolean)
    .sort((first, second) => first.card.localeCompare(second.card, undefined, { numeric: true }));
}

export function getAmdGpuDescriptors(cancellable = null) {
  return _buildSysfsGpuDescriptors({
    vendorId: AMD_VENDOR_ID,
    vendorPrefix: "amd",
    vendorLabel: "AMD",
    usageCandidates: ["gpu_busy_percent"],
    memoryCandidates: [
      {
        total: "mem_info_vram_total",
        used: "mem_info_vram_used",
      },
    ],
  }, cancellable);
}

export function getIntelGpuDescriptors(cancellable = null) {
  return _buildSysfsGpuDescriptors({
    vendorId: INTEL_VENDOR_ID,
    vendorPrefix: "intel",
    vendorLabel: "Intel",
    usageCandidates: ["gpu_busy_percent", "gt_busy_percent"],
    memoryCandidates: [
      {
        total: "mem_info_vram_total",
        used: "mem_info_vram_used",
      },
      {
        total: "lmem_total_bytes",
        used: "lmem_used_bytes",
      },
      {
        total: "local_memory_total_bytes",
        used: "local_memory_used_bytes",
      },
    ],
  }, cancellable);
}

export function detectCapabilities() {
  const hasNvidiaSmi = GLib.find_program_in_path("nvidia-smi") !== null;

  return {
    nvidiaSmi: hasNvidiaSmi,
    amdGpu: false,
    intelGpu: false,
    gpu: hasNvidiaSmi,
    cpuFrequency: getCpuFrequencyPaths().length > 0,
    thermalHwmon: GLib.file_test("/sys/class/hwmon", GLib.FileTest.IS_DIR),
  };
}

export function getCpuFrequencyPaths() {
  const policyPaths = _readDirectoryEntries(
    "/sys/devices/system/cpu/cpufreq",
    /^policy\d+$/
  )
    .map((entry) => `/sys/devices/system/cpu/cpufreq/${entry}/scaling_cur_freq`)
    .filter((path) => GLib.file_test(path, GLib.FileTest.EXISTS));

  if (policyPaths.length > 0) {
    return policyPaths;
  }

  return _readDirectoryEntries("/sys/devices/system/cpu", /^cpu\d+$/)
    .map((entry) => `/sys/devices/system/cpu/${entry}/cpufreq/scaling_cur_freq`)
    .filter((path) => GLib.file_test(path, GLib.FileTest.EXISTS));
}

export function getThermalCpuSensorDescriptors() {
  const descriptors = [];

  _readDirectoryEntries("/sys/class/hwmon", /^hwmon\d+$/).forEach((entry) => {
    const basePath = `/sys/class/hwmon/${entry}`;

    _readDirectoryEntries(basePath, /^temp\d+_input$/).forEach((sensorEntry) => {
      const sensorBase = sensorEntry.replace(/_input$/, "");
      descriptors.push({
        inputPath: `${basePath}/${sensorEntry}`,
        labelPath: `${basePath}/${sensorBase}_label`,
        namePath: `${basePath}/name`,
        fallbackLabel: sensorBase,
      });
    });
  });

  return descriptors;
}

export function isSupportedCpuThermalChip(chipName) {
  return SUPPORTED_CPU_THERMAL_CHIPS.has(chipName);
}

export class IssueLogger {
  constructor(logger = console) {
    this._loggedIssues = new Set();
    this._logger = logger;
  }

  logOnce(key, message, error = null) {
    if (this._loggedIssues.has(key)) {
      return;
    }

    this._loggedIssues.add(key);

    const logError =
      this._logger && typeof this._logger.error === "function"
        ? this._logger.error.bind(this._logger)
        : console.error.bind(console);

    if (error) {
      logError(message, error);
    } else {
      logError(message);
    }
  }

  clear(key) {
    this._loggedIssues.delete(key);
  }
}

export class RefreshTaskRunner {
  constructor() {
    this._refreshTaskLocks = new Set();
  }

  run(key, callback) {
    if (this._refreshTaskLocks.has(key)) {
      return;
    }

    this._refreshTaskLocks.add(key);

    Promise.resolve()
      .then(callback)
      .finally(() => {
        this._refreshTaskLocks.delete(key);
      });
  }
}
