export function initializeSettings(indicator, keys) {
  indicator._refreshTime = indicator._settings.get_int(keys.REFRESH_TIME);
  indicator._decimalsStatus = indicator._settings.get_boolean(keys.DECIMALS_STATUS);
  indicator._dataScaleBase = indicator._settings.get_string(keys.DATA_SCALE_BASE);
  indicator._leftClickStatus = indicator._settings.get_string(keys.LEFT_CLICK_STATUS);
  indicator._rightClickStatus = indicator._settings.get_boolean(keys.RIGHT_CLICK_STATUS);

  indicator._iconsStatus = indicator._settings.get_boolean(keys.ICONS_STATUS);
  indicator._iconsPosition = indicator._settings.get_string(keys.ICONS_POSITION);
  indicator._secondarySeparatorStyle = indicator._settings.get_string(
    keys.SECONDARY_SEPARATOR_STYLE
  );
  indicator._itemsPosition = indicator._settings.get_strv(keys.ITEMS_POSITION);

  indicator._cpuStatus = indicator._settings.get_boolean(keys.CPU_STATUS);
  indicator._cpuWidth = indicator._settings.get_int(keys.CPU_WIDTH);
  indicator._cpuColors = indicator._settings.get_strv(keys.CPU_COLORS);
  indicator._cpuFrequencyStatus = indicator._settings.get_boolean(
    keys.CPU_FREQUENCY_STATUS
  );
  indicator._cpuFrequencyWidth =
    indicator._settings.get_int(keys.CPU_FREQUENCY_WIDTH);
  indicator._cpuFrequencyColors = indicator._settings.get_strv(
    keys.CPU_FREQUENCY_COLORS
  );
  indicator._cpuFrequencyUnitMeasure = indicator._settings.get_string(
    keys.CPU_FREQUENCY_UNIT_MEASURE
  );
  indicator._cpuLoadAverageStatus = indicator._settings.get_boolean(
    keys.CPU_LOADAVERAGE_STATUS
  );
  indicator._cpuLoadAverageWidth =
    indicator._settings.get_int(keys.CPU_LOADAVERAGE_WIDTH);
  indicator._cpuLoadAverageColors = indicator._settings.get_strv(
    keys.CPU_LOADAVERAGE_COLORS
  );

  indicator._ramStatus = indicator._settings.get_boolean(keys.RAM_STATUS);
  indicator._ramWidth = indicator._settings.get_int(keys.RAM_WIDTH);
  indicator._ramColors = indicator._settings.get_strv(keys.RAM_COLORS);
  indicator._ramUnitType = indicator._settings.get_string(keys.RAM_UNIT);
  indicator._ramUnitMeasure = indicator._settings.get_string(keys.RAM_UNIT_MEASURE);
  indicator._ramMonitor = indicator._settings.get_string(keys.RAM_MONITOR);
  indicator._ramAlert = indicator._settings.get_boolean(keys.RAM_ALERT);
  indicator._ramAlertThreshold = indicator._settings.get_int(
    keys.RAM_ALERT_THRESHOLD
  );

  indicator._swapStatus = indicator._settings.get_boolean(keys.SWAP_STATUS);
  indicator._swapWidth = indicator._settings.get_int(keys.SWAP_WIDTH);
  indicator._swapColors = indicator._settings.get_strv(keys.SWAP_COLORS);
  indicator._swapUnitType = indicator._settings.get_string(keys.SWAP_UNIT);
  indicator._swapUnitMeasure = indicator._settings.get_string(keys.SWAP_UNIT_MEASURE);
  indicator._swapMonitor = indicator._settings.get_string(keys.SWAP_MONITOR);
  indicator._swapAlert = indicator._settings.get_boolean(keys.SWAP_ALERT);
  indicator._swapAlertThreshold = indicator._settings.get_int(
    keys.SWAP_ALERT_THRESHOLD
  );

  indicator._diskShowDeviceName = indicator._settings.get_boolean(
    keys.DISK_SHOW_DEVICE_NAME
  );
  indicator._diskStatsStatus = indicator._settings.get_boolean(keys.DISK_STATS_STATUS);
  indicator._diskStatsWidth =
    indicator._settings.get_int(keys.DISK_STATS_WIDTH);
  indicator._diskStatsColors = indicator._settings.get_strv(keys.DISK_STATS_COLORS);
  indicator._diskStatsMode = indicator._settings.get_string(keys.DISK_STATS_MODE);
  indicator._diskStatsUnitMeasure = indicator._settings.get_string(
    keys.DISK_STATS_UNIT_MEASURE
  );
  indicator._diskSpaceStatus = indicator._settings.get_boolean(keys.DISK_SPACE_STATUS);
  indicator._diskSpaceWidth =
    indicator._settings.get_int(keys.DISK_SPACE_WIDTH);
  indicator._diskSpaceColors = indicator._settings.get_strv(keys.DISK_SPACE_COLORS);
  indicator._diskSpaceUnitType = indicator._settings.get_string(keys.DISK_SPACE_UNIT);
  indicator._diskSpaceUnitMeasure = indicator._settings.get_string(
    keys.DISK_SPACE_UNIT_MEASURE
  );
  indicator._diskSpaceMonitor = indicator._settings.get_string(
    keys.DISK_SPACE_MONITOR
  );
  indicator._diskDevices = indicator._parseSettingsArray(
    keys.DISK_DEVICES_LIST,
    keys.parseDiskEntry
  );

  indicator._netAutoHideStatus = indicator._settings.get_boolean(
    keys.NET_AUTO_HIDE_STATUS
  );
  indicator._netUnit = indicator._settings.get_string(keys.NET_UNIT);
  indicator._netUnitMeasure = indicator._settings.get_string(keys.NET_UNIT_MEASURE);
  indicator._netEthStatus = indicator._settings.get_boolean(keys.NET_ETH_STATUS);
  indicator._netEthWidth =
    indicator._settings.get_int(keys.NET_ETH_WIDTH);
  indicator._netEthColors = indicator._settings.get_strv(keys.NET_ETH_COLORS);
  indicator._netWlanStatus = indicator._settings.get_boolean(keys.NET_WLAN_STATUS);
  indicator._netWlanWidth =
    indicator._settings.get_int(keys.NET_WLAN_WIDTH);
  indicator._netWlanColors = indicator._settings.get_strv(keys.NET_WLAN_COLORS);

  indicator._thermalTemperatureUnit = indicator._settings.get_string(
    keys.THERMAL_TEMPERATURE_UNIT
  );
  indicator._thermalCpuTemperatureStatus = indicator._settings.get_boolean(
    keys.THERMAL_CPU_TEMPERATURE_STATUS
  );
  indicator._thermalCpuTemperatureWidth =
    indicator._settings.get_int(keys.THERMAL_CPU_TEMPERATURE_WIDTH);
  indicator._thermalCpuColors = indicator._settings.get_strv(keys.THERMAL_CPU_COLORS);
  indicator._thermalCpuTemperatureDevices = indicator._parseSettingsArray(
    keys.THERMAL_CPU_TEMPERATURE_DEVICES_LIST,
    keys.parseThermalCpuEntry
  );
  indicator._thermalGpuTemperatureStatus = indicator._settings.get_boolean(
    keys.THERMAL_GPU_TEMPERATURE_STATUS
  );
  indicator._thermalGpuTemperatureWidth =
    indicator._settings.get_int(keys.THERMAL_GPU_TEMPERATURE_WIDTH);
  indicator._thermalGpuColors = indicator._settings.get_strv(keys.THERMAL_GPU_COLORS);
  indicator._thermalGpuTemperatureDevices = indicator._parseSettingsArray(
    keys.THERMAL_GPU_TEMPERATURE_DEVICES_LIST,
    keys.parseThermalGpuEntry
  );

  indicator._gpuStatus = indicator._settings.get_boolean(keys.GPU_STATUS);
  indicator._gpuWidth = indicator._settings.get_int(keys.GPU_WIDTH);
  indicator._gpuColors = indicator._settings.get_strv(keys.GPU_COLORS);
  indicator._gpuMemoryColors = indicator._settings.get_strv(keys.GPU_MEMORY_COLORS);
  indicator._gpuMemoryUnitType = indicator._settings.get_string(keys.GPU_MEMORY_UNIT);
  indicator._gpuMemoryUnitMeasure = indicator._settings.get_string(
    keys.GPU_MEMORY_UNIT_MEASURE
  );
  indicator._gpuMemoryMonitor = indicator._settings.get_string(
    keys.GPU_MEMORY_MONITOR
  );
  indicator._gpuDisplayDeviceName = indicator._settings.get_boolean(
    keys.GPU_DISPLAY_DEVICE_NAME
  );
  indicator._gpuDevices = indicator._parseSettingsArray(
    keys.GPU_DEVICES_LIST,
    keys.parseGpuEntry
  );
}

export function connectSettingsSignals(indicator, keys) {
  const signalMap = [
    [keys.REFRESH_TIME, "_refreshTimeChanged"],
    [keys.DECIMALS_STATUS, "_decimalsStatusChanged"],
    [keys.DATA_SCALE_BASE, "_dataScaleBaseChanged"],
    [keys.LEFT_CLICK_STATUS, "_leftClickStatusChanged"],
    [keys.RIGHT_CLICK_STATUS, "_rightClickStatusChanged"],
    [keys.ICONS_STATUS, "_iconsStatusChanged"],
    [keys.ICONS_POSITION, "_iconsPositionChanged"],
    [keys.SECONDARY_SEPARATOR_STYLE, "_secondarySeparatorStyleChanged"],
    [keys.ITEMS_POSITION, "_itemsPositionChanged"],
    [keys.CPU_STATUS, "_cpuStatusChanged"],
    [keys.CPU_WIDTH, "_cpuWidthChanged"],
    [keys.CPU_COLORS, "_cpuColorsChanged"],
    [keys.CPU_FREQUENCY_STATUS, "_cpuFrequencyStatusChanged"],
    [keys.CPU_FREQUENCY_WIDTH, "_cpuFrequencyWidthChanged"],
    [keys.CPU_FREQUENCY_COLORS, "_cpuFrequencyColorsChanged"],
    [keys.CPU_FREQUENCY_UNIT_MEASURE, "_cpuFrequencyUnitMeasureChanged"],
    [keys.CPU_LOADAVERAGE_STATUS, "_cpuLoadAverageStatusChanged"],
    [keys.CPU_LOADAVERAGE_WIDTH, "_cpuLoadAverageWidthChanged"],
    [keys.CPU_LOADAVERAGE_COLORS, "_cpuLoadAverageColorsChanged"],
    [keys.RAM_STATUS, "_ramStatusChanged"],
    [keys.RAM_WIDTH, "_ramWidthChanged"],
    [keys.RAM_COLORS, "_ramColorsChanged"],
    [keys.RAM_UNIT, "_ramUnitTypeChanged"],
    [keys.RAM_UNIT_MEASURE, "_ramUnitMeasureChanged"],
    [keys.RAM_MONITOR, "_ramMonitorChanged"],
    [keys.RAM_ALERT, "_ramAlertChanged"],
    [keys.RAM_ALERT_THRESHOLD, "_ramAlertThresholdChanged"],
    [keys.SWAP_STATUS, "_swapStatusChanged"],
    [keys.SWAP_WIDTH, "_swapWidthChanged"],
    [keys.SWAP_COLORS, "_swapColorsChanged"],
    [keys.SWAP_UNIT, "_swapUnitTypeChanged"],
    [keys.SWAP_UNIT_MEASURE, "_swapUnitMeasureChanged"],
    [keys.SWAP_MONITOR, "_swapMonitorChanged"],
    [keys.SWAP_ALERT, "_swapAlertChanged"],
    [keys.SWAP_ALERT_THRESHOLD, "_swapAlertThresholdChanged"],
    [keys.DISK_SHOW_DEVICE_NAME, "_diskShowDeviceNameChanged"],
    [keys.DISK_STATS_STATUS, "_diskStatsStatusChanged"],
    [keys.DISK_STATS_WIDTH, "_diskStatsWidthChanged"],
    [keys.DISK_STATS_COLORS, "_diskStatsColorsChanged"],
    [keys.DISK_STATS_MODE, "_diskStatsModeChanged"],
    [keys.DISK_STATS_UNIT_MEASURE, "_diskStatsUnitMeasureChanged"],
    [keys.DISK_SPACE_STATUS, "_diskSpaceStatusChanged"],
    [keys.DISK_SPACE_WIDTH, "_diskSpaceWidthChanged"],
    [keys.DISK_SPACE_COLORS, "_diskSpaceColorsChanged"],
    [keys.DISK_SPACE_UNIT, "_diskSpaceUnitTypeChanged"],
    [keys.DISK_SPACE_UNIT_MEASURE, "_diskSpaceUnitMeasureChanged"],
    [keys.DISK_SPACE_MONITOR, "_diskSpaceMonitorChanged"],
    [keys.DISK_DEVICES_LIST, "_diskDevicesListChanged"],
    [keys.NET_AUTO_HIDE_STATUS, "_netAutoHideStatusChanged"],
    [keys.NET_UNIT, "_netUnitChanged"],
    [keys.NET_UNIT_MEASURE, "_netUnitMeasureChanged"],
    [keys.NET_ETH_STATUS, "_netEthStatusChanged"],
    [keys.NET_ETH_WIDTH, "_netEthWidthChanged"],
    [keys.NET_ETH_COLORS, "_netEthColorsChanged"],
    [keys.NET_WLAN_STATUS, "_netWlanStatusChanged"],
    [keys.NET_WLAN_WIDTH, "_netWlanWidthChanged"],
    [keys.NET_WLAN_COLORS, "_netWlanColorsChanged"],
    [keys.THERMAL_TEMPERATURE_UNIT, "_thermalTemperatureUnitChanged"],
    [keys.THERMAL_CPU_TEMPERATURE_STATUS, "_thermalCpuTemperatureStatusChanged"],
    [keys.THERMAL_CPU_TEMPERATURE_WIDTH, "_thermalCpuTemperatureWidthChanged"],
    [keys.THERMAL_CPU_COLORS, "_thermalCpuColorsChanged"],
    [keys.THERMAL_CPU_TEMPERATURE_DEVICES_LIST, "_thermalCpuTemperatureDevicesListChanged"],
    [keys.THERMAL_GPU_TEMPERATURE_STATUS, "_thermalGpuTemperatureStatusChanged"],
    [keys.THERMAL_GPU_TEMPERATURE_WIDTH, "_thermalGpuTemperatureWidthChanged"],
    [keys.THERMAL_GPU_COLORS, "_thermalGpuColorsChanged"],
    [keys.THERMAL_GPU_TEMPERATURE_DEVICES_LIST, "_thermalGpuTemperatureDevicesListChanged"],
    [keys.GPU_STATUS, "_gpuStatusChanged"],
    [keys.GPU_WIDTH, "_gpuWidthChanged"],
    [keys.GPU_COLORS, "_gpuColorsChanged"],
    [keys.GPU_MEMORY_COLORS, "_gpuMemoryColorsChanged"],
    [keys.GPU_MEMORY_UNIT, "_gpuMemoryUnitTypeChanged"],
    [keys.GPU_MEMORY_UNIT_MEASURE, "_gpuMemoryUnitMeasureChanged"],
    [keys.GPU_MEMORY_MONITOR, "_gpuMemoryMonitorChanged"],
    [keys.GPU_DISPLAY_DEVICE_NAME, "_gpuDisplayDeviceNameChanged"],
    [keys.GPU_DEVICES_LIST, "_gpuDevicesListChanged"],
  ];

  signalMap.forEach(([key, handlerName]) => {
    indicator._handlerIds[indicator._handlerIdsCount++] = indicator._settings.connect(
      `changed::${key}`,
      indicator[handlerName].bind(indicator)
    );
  });
}

export function refreshGui(indicator) {
  indicator._rightClickStatusChanged();
  indicator._iconsStatusChanged();
  indicator._secondarySeparatorStyleChanged();
  indicator._cpuStatusChanged();
  indicator._cpuWidthChanged();
  indicator._cpuFrequencyStatusChanged();
  indicator._cpuFrequencyWidthChanged();
  indicator._cpuLoadAverageStatusChanged();
  indicator._cpuLoadAverageWidthChanged();
  indicator._ramStatusChanged();
  indicator._ramWidthChanged();
  indicator._swapStatusChanged();
  indicator._swapWidthChanged();
  indicator._diskStatsStatusChanged();
  indicator._diskStatsWidthChanged();
  indicator._diskStatsModeChanged();
  indicator._diskSpaceStatusChanged();
  indicator._diskSpaceWidthChanged();
  indicator._diskDevicesListChanged();
  indicator._netEthStatusChanged();
  indicator._netEthWidthChanged();
  indicator._netWlanStatusChanged();
  indicator._netWlanWidthChanged();
  indicator._thermalCpuTemperatureStatusChanged();
  indicator._thermalCpuTemperatureWidthChanged();
  indicator._thermalGpuTemperatureStatusChanged();
  indicator._thermalGpuTemperatureWidthChanged();
  indicator._gpuStatusChanged();
  indicator._gpuWidthChanged();
  indicator._gpuDevicesListChanged();
}
