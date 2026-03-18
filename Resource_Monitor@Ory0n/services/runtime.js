import GLib from "gi://GLib";

const AMD_VENDOR_ID = "0x1002";
const INTEL_VENDOR_ID = "0x8086";
const DRM_SYSFS_PATH = "/sys/class/drm";

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

function _readTextFile(path) {
  try {
    const [ok, contents] = GLib.file_get_contents(path);
    if (!ok) {
      return null;
    }

    return new TextDecoder().decode(contents).trim();
  } catch (error) {
    return null;
  }
}

function _findFirstExistingPath(paths) {
  for (const path of paths) {
    if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
      return path;
    }
  }

  return null;
}

function _buildGpuDisplayName(vendorLabel, card, basePath) {
  const productName = _readTextFile(`${basePath}/product_name`);
  if (productName) {
    return productName;
  }

  const deviceId = _readTextFile(`${basePath}/device`);
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

function _buildSysfsGpuDescriptors({
  vendorId,
  vendorPrefix,
  vendorLabel,
  usageCandidates = [],
  memoryCandidates = [],
}) {
  return _readDirectoryEntries(DRM_SYSFS_PATH, /^card\d+$/)
    .map((card) => {
      const basePath = `${DRM_SYSFS_PATH}/${card}/device`;
      const vendor = _readTextFile(`${basePath}/vendor`);
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
        name: _buildGpuDisplayName(vendorLabel, card, basePath),
        usagePath,
        memoryTotalPath,
        memoryUsedPath,
        temperaturePath: _findGpuTemperaturePath(basePath),
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.card.localeCompare(second.card, undefined, { numeric: true }));
}

export function getAmdGpuDescriptors() {
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
  });
}

export function getIntelGpuDescriptors() {
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
  });
}

export function detectCapabilities() {
  const amdDescriptors = getAmdGpuDescriptors();
  const intelDescriptors = getIntelGpuDescriptors();
  const hasNvidiaSmi = GLib.find_program_in_path("nvidia-smi") !== null;
  const hasAmdGpu = amdDescriptors.length > 0;
  const hasIntelGpu = intelDescriptors.length > 0;

  return {
    nvidiaSmi: hasNvidiaSmi,
    amdGpu: hasAmdGpu,
    intelGpu: hasIntelGpu,
    gpu: hasNvidiaSmi || hasAmdGpu || hasIntelGpu,
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
