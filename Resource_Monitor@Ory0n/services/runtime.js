import GLib from "gi://GLib";

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

export function detectCapabilities() {
  return {
    nvidiaSmi: GLib.find_program_in_path("nvidia-smi") !== null,
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
