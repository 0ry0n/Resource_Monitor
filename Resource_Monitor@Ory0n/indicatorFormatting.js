export const RENDER_MODE_PRECISE = "precise";
export const RENDER_MODE_STEP = "step";

export const INDICATOR_FORMATTING_SPECS = Object.freeze([
  {
    id: "cpu",
    decimalsKey: "cpudecimals",
    renderModeKey: "cpurendermode",
    renderStepKey: "cpurenderstep",
  },
  {
    id: "cpuFrequency",
    decimalsKey: "cpufrequencydecimals",
    renderModeKey: "cpufrequencyrendermode",
    renderStepKey: "cpufrequencyrenderstep",
  },
  {
    id: "cpuLoadAverage",
    decimalsKey: "cpuloadaveragedecimals",
    renderModeKey: "cpuloadaveragerendermode",
    renderStepKey: "cpuloadaveragerenderstep",
  },
  {
    id: "ram",
    decimalsKey: "ramdecimals",
    renderModeKey: "ramrendermode",
    renderStepKey: "ramrenderstep",
  },
  {
    id: "swap",
    decimalsKey: "swapdecimals",
    renderModeKey: "swaprendermode",
    renderStepKey: "swaprenderstep",
  },
  {
    id: "diskStats",
    decimalsKey: "diskstatsdecimals",
    renderModeKey: "diskstatsrendermode",
    renderStepKey: "diskstatsrenderstep",
  },
  {
    id: "diskSpace",
    decimalsKey: "diskspacedecimals",
    renderModeKey: "diskspacerendermode",
    renderStepKey: "diskspacerenderstep",
  },
  {
    id: "netEth",
    decimalsKey: "netethdecimals",
    renderModeKey: "netethrendermode",
    renderStepKey: "netethrenderstep",
  },
  {
    id: "netWlan",
    decimalsKey: "netwlandecimals",
    renderModeKey: "netwlanrendermode",
    renderStepKey: "netwlanrenderstep",
  },
  {
    id: "thermalCpu",
    decimalsKey: "thermalcpudecimals",
    renderModeKey: "thermalcpurendermode",
    renderStepKey: "thermalcpurenderstep",
  },
  {
    id: "thermalGpu",
    decimalsKey: "thermalgpudecimals",
    renderModeKey: "thermalgpurendermode",
    renderStepKey: "thermalgpurenderstep",
  },
  {
    id: "gpu",
    decimalsKey: "gpudecimals",
    renderModeKey: "gpurendermode",
    renderStepKey: "gpurenderstep",
  },
  {
    id: "gpuMemory",
    decimalsKey: "gpumemorydecimals",
    renderModeKey: "gpumemoryrendermode",
    renderStepKey: "gpumemoryrenderstep",
  },
]);

export function getFormattingKeys() {
  return INDICATOR_FORMATTING_SPECS.flatMap((spec) => [
    spec.decimalsKey,
    spec.renderModeKey,
    spec.renderStepKey,
  ]);
}

export function normalizeFormattingSettings(formatting) {
  const decimals = Number.isFinite(formatting?.decimals)
    ? Math.max(0, Math.min(3, Math.trunc(formatting.decimals)))
    : 0;
  const renderMode =
    formatting?.renderMode === RENDER_MODE_STEP
      ? RENDER_MODE_STEP
      : RENDER_MODE_PRECISE;
  const renderStep =
    Number.isFinite(formatting?.renderStep) && formatting.renderStep > 0
      ? Math.trunc(formatting.renderStep)
      : 1;

  return {
    decimals,
    renderMode,
    renderStep,
  };
}

export function readIndicatorFormattingSettings(settings) {
  const formatting = {};

  INDICATOR_FORMATTING_SPECS.forEach((spec) => {
    formatting[spec.id] = normalizeFormattingSettings({
      decimals: settings.get_int(spec.decimalsKey),
      renderMode: settings.get_string(spec.renderModeKey),
      renderStep: settings.get_int(spec.renderStepKey),
    });
  });

  return formatting;
}
