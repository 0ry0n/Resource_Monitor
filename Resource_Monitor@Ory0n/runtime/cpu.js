import {
  convertValueToUnit,
  parseCpuUsage,
  parseLoadAverage,
} from "./metrics.js";

export function buildCpuUsageSample(contents, previousSample) {
  return parseCpuUsage(contents, previousSample);
}

export function parseCpuFrequencyOutput(contents, unitMeasure) {
  const maxFrequency = Math.max(
    ...contents
      .split("\n")
      .map((line) => parseInt(line.trim(), 10))
      .filter(Number.isFinite)
  );

  const [value, unit] = convertValueToUnit(maxFrequency, unitMeasure, true);
  return { value, unit };
}

export function parseLoadAverageDisplay(contents) {
  const [l0, l1, l2] = parseLoadAverage(contents);
  return {
    values: [l0, l1, l2],
    text: `${l0} ${l1} ${l2}`,
  };
}
