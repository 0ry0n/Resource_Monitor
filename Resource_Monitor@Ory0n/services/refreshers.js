import GLib from "gi://GLib";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import { buildCpuUsageSample, parseCpuFrequencyOutput, parseLoadAverageDisplay } from "../runtime/cpu.js";
import {
  getBaseStorageUnit,
  getFixedDataUnitForMeasure,
} from "../runtime/metrics.js";
import { buildMemoryDisplay } from "../runtime/memory.js";
import {
  buildDiskSpaceDisplay,
  parseDiskStatsEntries,
} from "../runtime/disk.js";
import { buildNetworkSample } from "../runtime/network.js";
import { buildSysfsGpuDisplay, parseGpuSmiOutput } from "../runtime/gpu.js";
import { buildCpuTemperatureDisplay } from "../runtime/thermal.js";
import { queryFilesystemInfo } from "../runtime/io.js";
import {
  getAmdGpuDescriptors,
  getCpuFrequencyPaths,
  getIntelGpuDescriptors,
} from "./runtime.js";
import {
  hasVisibleCpuFrequency,
  hasVisibleThermalCpuTemperature,
  hasVisibleGpu,
  syncCpuFrequencyVisibility,
  syncGpuVisibility,
  syncThermalCpuVisibility,
} from "./visibility.js";

function resetCpuFrequencyDisplay(indicator) {
  indicator._cpuFrequencyValue.style = "";
  indicator._cpuFrequencyValue.text = "--";
  indicator._cpuFrequencyUnit.text = "kHz";
}

function resetCpuTemperatureDisplay(indicator) {
  indicator._cpuTemperatureValue.style = "";
  indicator._cpuTemperatureValue.text = "--";
  indicator._cpuTemperatureUnit.text = indicator._thermalTemperatureUnit === "f" ? "°F" : "°C";
}

function resetGpuDisplay(indicator) {
  const memoryUnit = getBaseStorageUnit(indicator._dataScaleBase);
  indicator._gpuDevices.forEach((device) => {
    indicator._gpuBox.update_element_value(device.device, "--", "%", "");
    indicator._gpuBox.update_element_memory_value(device.device, "--", memoryUnit, "");
    indicator._gpuBox.update_element_thermal_value(
      device.device,
      "--",
      indicator._thermalTemperatureUnit === "f" ? "°F" : "°C",
      ""
    );
  });
}

function _shouldRunGpuRefresh(indicator, force = false) {
  const now = GLib.get_monotonic_time();

  if (force) {
    indicator._lastGpuRefreshAtUsec = now;
    return true;
  }

  const refreshIntervalUsec = indicator._gpuRefreshIntervalUsec || 0;
  if (refreshIntervalUsec <= 0) {
    indicator._lastGpuRefreshAtUsec = now;
    return true;
  }

  const elapsed = now - (indicator._lastGpuRefreshAtUsec || 0);
  if (elapsed < refreshIntervalUsec) {
    return false;
  }

  indicator._lastGpuRefreshAtUsec = now;
  return true;
}

async function _readNumericFile(indicator, path) {
  if (!path) {
    return null;
  }

  try {
    const contents = await indicator._loadFile(path);
    const value = parseInt(new TextDecoder().decode(contents).trim(), 10);
    return Number.isFinite(value) ? value : null;
  } catch (error) {
    if (!indicator._isCancelledError(error)) {
      indicator._logIssueOnce(
        `sysfs-gpu-read-error:${path}`,
        `[Resource_Monitor] Error reading sysfs GPU metric: ${path}.`,
        error
      );
    }
    return null;
  }
}

async function _readSysfsGpuSamples(indicator, descriptors) {
  const samples = await Promise.all(
    descriptors.map(async (descriptor) => {
      const [usagePercent, memoryTotalBytes, memoryUsedBytes, temperatureMilliCelsius] =
        await Promise.all([
          _readNumericFile(indicator, descriptor.usagePath),
          _readNumericFile(indicator, descriptor.memoryTotalPath),
          _readNumericFile(indicator, descriptor.memoryUsedPath),
          _readNumericFile(indicator, descriptor.temperaturePath),
        ]);

      return {
        device: descriptor.device,
        usagePercent,
        memoryTotalBytes,
        memoryUsedBytes,
        memoryFreeBytes:
          Number.isFinite(memoryTotalBytes) && Number.isFinite(memoryUsedBytes)
            ? Math.max(0, memoryTotalBytes - memoryUsedBytes)
            : null,
        temperatureCelsius: Number.isFinite(temperatureMilliCelsius)
          ? temperatureMilliCelsius / 1000
          : null,
      };
    })
  );

  return buildSysfsGpuDisplay(samples, {
    memoryMonitor: indicator._gpuMemoryMonitor,
    memoryUnitType: indicator._gpuMemoryUnitType,
    memoryUnitMeasure: indicator._gpuMemoryUnitMeasure,
    memoryScaleBase: indicator._dataScaleBase,
    temperatureUnit: indicator._thermalTemperatureUnit,
  });
}

export function refreshCpuValue(indicator) {
  indicator._runRefreshTask("cpu", () =>
    indicator._loadFile("/proc/stat")
      .then((contents) => {
        const { usage, sample } = buildCpuUsageSample(contents, {
          total: indicator._cpuTotOld,
          idle: indicator._cpuIdleOld,
        });
        indicator._cpuTotOld = sample.total;
        indicator._cpuIdleOld = sample.idle;

        indicator._clearLoggedIssue("cpu-read-error");
        indicator._cpuValue.style = indicator._getUsageColor(
          usage,
          indicator._cpuColors
        );
        indicator._cpuValue.text = `${indicator._getValueFixed(usage, "cpu")}`;
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "cpu-read-error",
            "[Resource_Monitor] Error reading cpu.",
            error
          );
        }
      })
  );
}

export function refreshRamValue(indicator) {
  indicator._runRefreshTask("ram", () =>
    indicator._loadFile("/proc/meminfo")
      .then((contents) => {
        indicator._clearLoggedIssue("ram-read-error");

        indicator._applyMemoryDisplay(
          buildMemoryDisplay(contents, {
            totalKey: "MemTotal",
            availableKey: "MemAvailable",
            monitor: indicator._ramMonitor,
            unitType: indicator._ramUnitType,
            unitMeasure: indicator._ramUnitMeasure,
            scaleBase: indicator._dataScaleBase,
          }),
          {
            alertEnabled: indicator._ramAlert,
            alertThreshold: indicator._ramAlertThreshold,
            alertActive: indicator._ramAlertActive,
            setAlertActive: (value) => {
              indicator._ramAlertActive = value;
            },
            title: _("Resource Monitor - Low Memory Alert"),
            message: _(
              "Available RAM has dropped below %d%%. Please take action to free up memory."
            ).format(indicator._ramAlertThreshold),
            valueLabel: indicator._ramValue,
            unitLabel: indicator._ramUnit,
            colors: indicator._ramColors,
            formattingId: "ram",
          }
        );
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "ram-read-error",
            "[Resource_Monitor] Error reading ram.",
            error
          );
        }
      })
  );
}

export function refreshSwapValue(indicator) {
  indicator._runRefreshTask("swap", () =>
    indicator._loadFile("/proc/meminfo")
      .then((contents) => {
        indicator._clearLoggedIssue("swap-read-error");

        indicator._applyMemoryDisplay(
          buildMemoryDisplay(contents, {
            totalKey: "SwapTotal",
            availableKey: "SwapFree",
            monitor: indicator._swapMonitor,
            unitType: indicator._swapUnitType,
            unitMeasure: indicator._swapUnitMeasure,
            scaleBase: indicator._dataScaleBase,
          }),
          {
            alertEnabled: indicator._swapAlert,
            alertThreshold: indicator._swapAlertThreshold,
            alertActive: indicator._swapAlertActive,
            setAlertActive: (value) => {
              indicator._swapAlertActive = value;
            },
            title: _("Resource Monitor - Low Swap Alert"),
            message: _(
              "Available swap has dropped below %d%%. Please take action to free up memory."
            ).format(indicator._swapAlertThreshold),
            valueLabel: indicator._swapValue,
            unitLabel: indicator._swapUnit,
            colors: indicator._swapColors,
            formattingId: "swap",
          }
        );
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "swap-read-error",
            "[Resource_Monitor] Error reading swap.",
            error
          );
        }
      })
  );
}

export function refreshDiskStatsValue(indicator) {
  indicator._runRefreshTask("disk-stats", () =>
    indicator._loadFile("/proc/diskstats")
      .then((contents) => {
        const entries = parseDiskStatsEntries(contents);
        const idle = GLib.get_monotonic_time() / 1000;

        indicator._clearLoggedIssue("disk-stats-read-error");

        const processEntry = (filesystem, rwTot, rw) => {
          const previousIdle = indicator._diskStatsBox.get_idle(filesystem) || 0;
          const delta = previousIdle > 0 ? (idle - previousIdle) / 1000 : 0;
          indicator._diskStatsBox.set_idle(filesystem, idle);
          const rwTotOld = indicator._diskStatsBox.get_rw_tot(filesystem) || [
            0, 0,
          ];
          indicator._diskStatsBox.set_rw_tot(filesystem, rwTot);

          let unit =
            indicator._diskStatsUnitMeasure === "auto"
              ? getFixedDataUnitForMeasure("b", indicator._dataScaleBase)
              : getFixedDataUnitForMeasure(
                indicator._diskStatsUnitMeasure,
                indicator._dataScaleBase
              );

          if (delta > 0) {
            for (let i = 0; i < 2; i++) {
              const deltaCounter = rwTot[i] - (rwTotOld[i] || 0);
              rw[i] = deltaCounter > 0 ? deltaCounter / delta : 0;
            }
            const unitResult = indicator._convertValuesToUnit(
              rw,
              indicator._diskStatsUnitMeasure
            );
            rw = unitResult.values;
            unit = unitResult.unit;
          }

          indicator._diskStatsBox.update_element_value(
            filesystem,
            `${indicator._getValueFixed(rw[0], "diskStats")}|${indicator._getValueFixed(rw[1], "diskStats")}`,
            unit,
            indicator._getUsageColor(rw, indicator._diskStatsColors)
          );
        };

        switch (indicator._diskStatsMode) {
          case "single": {
            let rwTot = [0, 0];
            let rw = [0, 0];
            const filesystem = "single";

            entries.forEach((entry) => {
              if (indicator._diskStatsBox.get_filesystem(entry.device)) {
                rwTot[0] += entry.readBytes;
                rwTot[1] += entry.writeBytes;
              }
            });

            processEntry(filesystem, rwTot, rw);
            break;
          }

          case "multiple":
          default:
            entries.forEach((entry) => {
              const filesystem = indicator._diskStatsBox.get_filesystem(
                entry.device
              );
              if (filesystem) {
                let rwTot = [entry.readBytes, entry.writeBytes];
                let rw = [0, 0];
                processEntry(filesystem, rwTot, rw);
              }
            });
            break;
        }
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "disk-stats-read-error",
            "[Resource_Monitor] Error reading disk stats.",
            error
          );
        }
      })
  );
}

export function refreshDiskSpaceValue(indicator) {
  const monitoredDevices = indicator._diskDevices.filter(
    (device) => device.space && device.mountPoint
  );

  indicator._runRefreshTask("disk-space", () =>
    Promise.allSettled(
      monitoredDevices.map(async (device) => {
        const { size, free } = await queryFilesystemInfo(
          device.mountPoint,
          indicator._ioCancellable
        );

        return {
          filesystem: device.device,
          usedBytes: Math.max(0, size - free),
          availableBytes: Math.max(0, free),
          usedPercent: size > 0 ? Math.round((100 * (size - free)) / size) : 0,
        };
      })
    )
      .then((results) => {
        let hasSuccess = false;
        let firstError = null;

        results.forEach((result) => {
          if (result.status !== "fulfilled") {
            if (!firstError && !indicator._isCancelledError(result.reason)) {
              firstError = result.reason;
            }
            return;
          }

          hasSuccess = true;
          const entry = result.value;
          const display = buildDiskSpaceDisplay(entry, {
            monitor: indicator._diskSpaceMonitor,
            unitType: indicator._diskSpaceUnitType,
            unitMeasure: indicator._diskSpaceUnitMeasure,
            scaleBase: indicator._dataScaleBase,
          });

          indicator._diskSpaceBox.update_element_value(
            entry.filesystem,
            `${indicator._getValueFixed(display.value, "diskSpace")}`,
            display.unit,
            indicator._getUsageColor(display.value, indicator._diskSpaceColors)
          );
        });

        if (hasSuccess || monitoredDevices.length === 0) {
          indicator._clearLoggedIssue("disk-space-read-error");
        } else if (firstError) {
          indicator._logIssueOnce(
            "disk-space-read-error",
            "[Resource_Monitor] Error reading disk space.",
            firstError
          );
        }
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "disk-space-read-error",
            "[Resource_Monitor] Error reading disk space.",
            error
          );
        }
      })
  );
}

export function refreshEthValue(indicator) {
  indicator._runRefreshTask("net-eth", () =>
    indicator._loadFile("/proc/net/dev")
      .then((contents) => {
        const sample = buildNetworkSample(contents, {
          pattern: /^(eth[0-9]+|en[a-z0-9]*)$/,
          unit: indicator._netUnit,
          unitMeasure: indicator._netUnitMeasure,
          scaleBase: indicator._dataScaleBase,
          previousTotals: indicator._duTotEthOld,
          previousIdle: indicator._ethIdleOld,
          currentIdle: GLib.get_monotonic_time() / 1000,
        });
        indicator._duTotEthOld = sample.totals;
        indicator._ethIdleOld = sample.idle;
        indicator._ethUnit.text = sample.unit;
        indicator._clearLoggedIssue("net-eth-read-error");

        indicator._ethValue.style = indicator._getUsageColor(
          sample.values,
          indicator._netEthColors
        );
        indicator._ethValue.text = `${indicator._getValueFixed(
          sample.values[0],
          "netEth"
        )}|${indicator._getValueFixed(sample.values[1], "netEth")}`;
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "net-eth-read-error",
            "[Resource_Monitor] Error reading eth.",
            error
          );
        }
      })
  );
}

export function refreshWlanValue(indicator) {
  indicator._runRefreshTask("net-wlan", () =>
    indicator._loadFile("/proc/net/dev")
      .then((contents) => {
        const sample = buildNetworkSample(contents, {
          pattern: /^(wlan[0-9]+|wl[a-z0-9]*)$/,
          unit: indicator._netUnit,
          unitMeasure: indicator._netUnitMeasure,
          scaleBase: indicator._dataScaleBase,
          previousTotals: indicator._duTotWlanOld,
          previousIdle: indicator._wlanIdleOld,
          currentIdle: GLib.get_monotonic_time() / 1000,
        });
        indicator._duTotWlanOld = sample.totals;
        indicator._wlanIdleOld = sample.idle;
        indicator._wlanUnit.text = sample.unit;
        indicator._clearLoggedIssue("net-wlan-read-error");

        indicator._wlanValue.style = indicator._getUsageColor(
          sample.values,
          indicator._netWlanColors
        );
        indicator._wlanValue.text = `${indicator._getValueFixed(
          sample.values[0],
          "netWlan"
        )}|${indicator._getValueFixed(sample.values[1], "netWlan")}`;
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "net-wlan-read-error",
            "[Resource_Monitor] Error reading wlan.",
            error
          );
        }
      })
  );
}

export function refreshCpuFrequencyValue(indicator) {
  const frequencyPaths = getCpuFrequencyPaths();

  if (frequencyPaths.length === 0) {
    resetCpuFrequencyDisplay(indicator);
    syncCpuFrequencyVisibility(indicator);
    indicator._logIssueOnce(
      "cpu-frequency-unavailable",
      "[Resource_Monitor] CPU frequency monitoring is unavailable on this system."
    );
    return;
  }

  indicator._runRefreshTask("cpu-frequency", () =>
    Promise.allSettled(frequencyPaths.map((path) => indicator._loadFile(path)))
      .then((results) => {
        const contents = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => new TextDecoder().decode(result.value))
          .join("\n");
        const display = parseCpuFrequencyOutput(
          contents,
          indicator._cpuFrequencyUnitMeasure
        );

        if (!display) {
          resetCpuFrequencyDisplay(indicator);
          syncCpuFrequencyVisibility(indicator);
          indicator._logIssueOnce(
            "cpu-frequency-unavailable",
            "[Resource_Monitor] CPU frequency monitoring returned no usable samples."
          );
          return;
        }

        indicator._clearLoggedIssue("cpu-frequency-unavailable");
        indicator._clearLoggedIssue("cpu-frequency-read-error");
        syncCpuFrequencyVisibility(indicator);

        indicator._cpuFrequencyValue.style = indicator._getUsageColor(
          display.value,
          indicator._cpuFrequencyColors
        );
        indicator._cpuFrequencyValue.text = `${indicator._getValueFixed(
          display.value,
          "cpuFrequency"
        )}`;
        indicator._cpuFrequencyUnit.text = display.unit;
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          resetCpuFrequencyDisplay(indicator);
          syncCpuFrequencyVisibility(indicator);
          indicator._logIssueOnce(
            "cpu-frequency-read-error",
            "[Resource_Monitor] Error reading cpu frequency.",
            error
          );
        }
      })
  );
}

export function refreshCpuLoadAverageValue(indicator) {
  indicator._runRefreshTask("cpu-loadavg", () =>
    indicator._loadFile("/proc/loadavg")
      .then((contents) => {
        const display = parseLoadAverageDisplay(contents);
        indicator._clearLoggedIssue("cpu-loadavg-read-error");
        indicator._cpuLoadAverageValue.style = indicator._getUsageColor(
          display.values[0],
          indicator._cpuLoadAverageColors
        );
        indicator._cpuLoadAverageValue.text = display.values
          .map((value) => indicator._getValueFixed(value, "cpuLoadAverage"))
          .join(" ");
      })
      .catch((error) => {
        if (!indicator._isCancelledError(error)) {
          indicator._logIssueOnce(
            "cpu-loadavg-read-error",
            "[Resource_Monitor] Error reading cpu load average.",
            error
          );
        }
      })
  );
}

export function refreshCpuTemperatureValue(indicator) {
  const activeSensors = indicator._thermalCpuTemperatureDevices.filter(
    (sensor) =>
      sensor.monitor &&
      sensor.path &&
      GLib.file_test(sensor.path, GLib.FileTest.EXISTS)
  );

  if (activeSensors.length > 0) {
    indicator._runRefreshTask("thermal-cpu", () =>
      Promise.allSettled(activeSensors.map((sensor) => indicator._loadFile(sensor.path)))
        .then((results) => {
          const display = buildCpuTemperatureDisplay(
            results,
            indicator._thermalTemperatureUnit
          );

          if (!display) {
            resetCpuTemperatureDisplay(indicator);
            syncThermalCpuVisibility(indicator);
            indicator._logIssueOnce(
              "thermal-cpu-unavailable",
              "[Resource_Monitor] CPU thermal monitoring returned no usable samples."
            );
            return;
          }

          indicator._clearLoggedIssue("thermal-cpu-unavailable");
          indicator._clearLoggedIssue("thermal-cpu-read-error");
          syncThermalCpuVisibility(indicator);
          indicator._cpuTemperatureValue.text = `${indicator._getValueFixed(
            display.value,
            "thermalCpu"
          )}`;
          indicator._cpuTemperatureUnit.text = display.unit;
          indicator._cpuTemperatureValue.style = indicator._getUsageColor(
            display.value,
            indicator._thermalCpuColors
          );
        })
        .catch((error) => {
          if (!indicator._isCancelledError(error)) {
            resetCpuTemperatureDisplay(indicator);
            syncThermalCpuVisibility(indicator);
            indicator._logIssueOnce(
              "thermal-cpu-read-error",
              "[Resource_Monitor] Error reading cpu thermal.",
              error
            );
          }
        })
    );
  } else {
    resetCpuTemperatureDisplay(indicator);
    syncThermalCpuVisibility(indicator);
  }
}

export function refreshGpuValue(indicator, options = {}) {
  const { force = false } = options;

  if (!indicator._capabilities.gpu) {
    syncGpuVisibility(indicator);
    indicator._logIssueOnce(
      "gpu-unavailable",
      "[Resource_Monitor] GPU monitoring is unavailable because no supported backend was found."
    );
    return;
  }

  if (!_shouldRunGpuRefresh(indicator, force)) {
    return;
  }

  indicator._runRefreshTask("gpu", async () => {
    try {
      const entryMap = new Map();

      if (indicator._capabilities.nvidiaSmi) {
        const contents = await indicator._executeCommand([
          "nvidia-smi",
          "--query-gpu=uuid,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
          "--format=csv,noheader,nounits",
        ]);
        const nvidiaEntries = parseGpuSmiOutput(contents, {
          memoryMonitor: indicator._gpuMemoryMonitor,
          memoryUnitType: indicator._gpuMemoryUnitType,
          memoryUnitMeasure: indicator._gpuMemoryUnitMeasure,
          memoryScaleBase: indicator._dataScaleBase,
          temperatureUnit: indicator._thermalTemperatureUnit,
        });

        nvidiaEntries.forEach((entry) => entryMap.set(entry.uuid, entry));
      }

      if (indicator._capabilities.amdGpu) {
        const knownDescriptors = indicator._amdGpuDescriptors ?? [];
        const descriptors =
          knownDescriptors.length > 0 ? knownDescriptors : getAmdGpuDescriptors();
        const amdEntries = await _readSysfsGpuSamples(indicator, descriptors);
        amdEntries.forEach((entry) => entryMap.set(entry.uuid, entry));
      }

      if (indicator._capabilities.intelGpu) {
        const knownDescriptors = indicator._intelGpuDescriptors ?? [];
        const descriptors =
          knownDescriptors.length > 0
            ? knownDescriptors
            : getIntelGpuDescriptors();
        const intelEntries = await _readSysfsGpuSamples(indicator, descriptors);
        intelEntries.forEach((entry) => entryMap.set(entry.uuid, entry));
      }

      if (entryMap.size === 0) {
        resetGpuDisplay(indicator);
        syncGpuVisibility(indicator);
        indicator._logIssueOnce(
          "gpu-unavailable",
          "[Resource_Monitor] GPU monitoring returned no usable samples."
        );
        return;
      }

      indicator._clearLoggedIssue("gpu-unavailable");
      indicator._clearLoggedIssue("gpu-read-error");
      syncGpuVisibility(indicator);

      const defaultMemoryUnit = getBaseStorageUnit(indicator._dataScaleBase);
      const defaultTemperatureUnit =
        indicator._thermalTemperatureUnit === "f" ? "°F" : "°C";

      indicator._gpuDevices.forEach((device) => {
        const entry = entryMap.get(device.device);
        const usageValue = Number.isFinite(entry?.usage) ? entry.usage : null;
        const temperatureValue = Number.isFinite(entry?.temperatureValue)
          ? entry.temperatureValue
          : null;
        const memoryValue = Number.isFinite(entry?.memoryValue)
          ? entry.memoryValue
          : null;

        indicator._gpuBox.update_element_value(
          device.device,
          usageValue === null
            ? "--"
            : `${indicator._getValueFixed(usageValue, "gpu")}`,
          "%",
          usageValue === null
            ? ""
            : indicator._getUsageColor(usageValue, indicator._gpuColors)
        );

        indicator._gpuBox.update_element_thermal_value(
          device.device,
          temperatureValue === null
            ? "--"
            : `${indicator._getValueFixed(temperatureValue, "thermalGpu")}`,
          entry?.temperatureUnit ?? defaultTemperatureUnit,
          temperatureValue === null
            ? ""
            : indicator._getUsageColor(temperatureValue, indicator._thermalGpuColors)
        );

        indicator._gpuBox.update_element_memory_value(
          device.device,
          memoryValue === null
            ? "--"
            : `${indicator._getValueFixed(memoryValue, "gpuMemory")}`,
          entry?.memoryUnit ?? defaultMemoryUnit,
          memoryValue === null
            ? ""
            : indicator._getUsageColor(memoryValue, indicator._gpuMemoryColors)
        );
      });
    } catch (error) {
      if (!indicator._isCancelledError(error)) {
        resetGpuDisplay(indicator);
        syncGpuVisibility(indicator);
        indicator._logIssueOnce(
          "gpu-read-error",
          "[Resource_Monitor] Error reading gpu.",
          error
        );
      }
    }
  });
}

export function refreshHandler(indicator, forceGpu = false) {
  if (indicator._cpuStatus) {
    refreshCpuValue(indicator);
  }
  if (indicator._ramStatus) {
    refreshRamValue(indicator);
  }
  if (indicator._swapStatus) {
    refreshSwapValue(indicator);
  }
  if (indicator._diskStatsStatus) {
    refreshDiskStatsValue(indicator);
  }
  if (indicator._diskSpaceStatus) {
    refreshDiskSpaceValue(indicator);
  }
  if (indicator._netEthStatus) {
    refreshEthValue(indicator);
  }
  if (indicator._netWlanStatus) {
    refreshWlanValue(indicator);
  }
  if (hasVisibleCpuFrequency(indicator)) {
    refreshCpuFrequencyValue(indicator);
  }
  if (indicator._cpuLoadAverageStatus) {
    refreshCpuLoadAverageValue(indicator);
  }
  if (hasVisibleThermalCpuTemperature(indicator)) {
    refreshCpuTemperatureValue(indicator);
  }
  if (hasVisibleGpu(indicator)) {
    refreshGpuValue(indicator, { force: forceGpu });
  }

  return GLib.SOURCE_CONTINUE;
}
