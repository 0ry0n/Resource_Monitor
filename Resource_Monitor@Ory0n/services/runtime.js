import GLib from "gi://GLib";

export function detectCapabilities() {
  return {
    bash: GLib.find_program_in_path("bash") !== null,
    nvidiaSmi: GLib.find_program_in_path("nvidia-smi") !== null,
    cpuFrequency:
      GLib.file_test(
        "/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq",
        GLib.FileTest.EXISTS
      ) ||
      GLib.file_test("/sys/devices/system/cpu/cpufreq", GLib.FileTest.IS_DIR),
    thermalHwmon: GLib.file_test("/sys/class/hwmon", GLib.FileTest.IS_DIR),
  };
}

export class IssueLogger {
  constructor() {
    this._loggedIssues = new Set();
  }

  logOnce(key, message, error = null) {
    if (this._loggedIssues.has(key)) {
      return;
    }

    this._loggedIssues.add(key);

    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
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
