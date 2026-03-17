import GLib from "gi://GLib";

export function hasVisibleCpuFrequency(indicator) {
  return indicator._cpuFrequencyStatus && indicator._capabilities.cpuFrequency;
}

export function hasVisibleThermalCpuTemperature(indicator) {
  return (
    indicator._thermalCpuTemperatureStatus &&
    indicator._capabilities.thermalHwmon &&
    indicator._thermalCpuTemperatureDevices.some(
      (sensor) =>
        sensor.monitor &&
        sensor.path &&
        GLib.file_test(sensor.path, GLib.FileTest.EXISTS)
    )
  );
}

export function hasVisibleGpu(indicator) {
  return (
    indicator._capabilities.nvidiaSmi &&
    (indicator._gpuStatus || indicator._thermalGpuTemperatureStatus) &&
    indicator._gpuDevices.some((device) => {
      const hasUsage = device.usage && indicator._gpuStatus;
      const hasMemory = device.memory && indicator._gpuStatus;
      const hasThermal =
        indicator._thermalGpuTemperatureStatus &&
        indicator._thermalGpuTemperatureDevices.some(
          (thermalDevice) =>
            thermalDevice.monitor && thermalDevice.device === device.device
        );

      return hasUsage || hasMemory || hasThermal;
    })
  );
}

export function syncCpuFrequencyVisibility(indicator) {
  indicator._basicItemStatus(
    hasVisibleCpuFrequency(indicator),
    !indicator._cpuStatus &&
      !hasVisibleThermalCpuTemperature(indicator) &&
      !indicator._cpuLoadAverageStatus,
    indicator._cpuIcon,
    indicator._cpuFrequencyValue,
    indicator._cpuFrequencyUnit,
    indicator._cpuFrequencyBracketStart,
    indicator._cpuFrequencyBracketEnd
  );
}

export function syncThermalCpuVisibility(indicator) {
  indicator._basicItemStatus(
    hasVisibleThermalCpuTemperature(indicator),
    !indicator._cpuStatus &&
      !hasVisibleCpuFrequency(indicator) &&
      !indicator._cpuLoadAverageStatus,
    indicator._cpuIcon,
    indicator._cpuTemperatureValue,
    indicator._cpuTemperatureUnit,
    indicator._cpuTemperatureBracketStart,
    indicator._cpuTemperatureBracketEnd
  );
}

export function syncGpuVisibility(indicator) {
  indicator._basicItemStatus(
    hasVisibleGpu(indicator),
    !indicator._thermalGpuTemperatureStatus,
    indicator._gpuIcon,
    indicator._gpuBox
  );
}
