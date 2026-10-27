import { getUsageLevel } from "./metrics.js";

// Linux pressure stall information (PSI) sources, in display priority order.
export const PRESSURE_SOURCES = Object.freeze([
  { id: "memory", label: "M", path: "/proc/pressure/memory" },
  { id: "cpu", label: "C", path: "/proc/pressure/cpu" },
  { id: "io", label: "D", path: "/proc/pressure/io" },
]);

export const MIN_PRESSURE_INTERVAL_USEC = 500000;

// Reads the "some" line: share of time at least one task was stalled.
export function parsePressure(contents) {
  const text = new TextDecoder().decode(contents);
  const match = text.match(/^some\s.*?\bavg10=([\d.]+).*?\btotal=(\d+)/m);
  const avg10 = match ? parseFloat(match[1]) : NaN;
  const total = match ? Number(match[2]) : NaN;

  return {
    avg10: Number.isFinite(avg10) ? avg10 : 0,
    total: Number.isFinite(total) ? total : null,
  };
}

// Percentage of wall time stalled between two samples ({ total, timeUsec }).
// Returns null when there is no usable baseline: first sample, a counter
// reset, or samples too close together to be meaningful.
export function computeIntervalPressure(
  previous,
  current,
  minElapsedUsec = MIN_PRESSURE_INTERVAL_USEC
) {
  if (!previous || previous.total === null || current.total === null) {
    return null;
  }

  const elapsedUsec = current.timeUsec - previous.timeUsec;
  const stalledUsec = current.total - previous.total;

  if (elapsedUsec < minElapsedUsec || stalledUsec < 0) {
    return null;
  }

  return Math.min(100, (100 * stalledUsec) / elapsedUsec);
}

// Feeds a new sample into a per-source state ({ sample, interval }) and
// returns the latest interval value, or undefined until one is available.
export function updatePressureState(state, sample) {
  const previous = state.sample;
  const interval = computeIntervalPressure(previous, sample);

  // Keep the older baseline when an extra refresh (e.g. a settings change)
  // lands right after the regular one.
  if (
    !previous ||
    sample.total === null ||
    sample.timeUsec - previous.timeUsec >= MIN_PRESSURE_INTERVAL_USEC
  ) {
    state.sample = sample;
  }
  if (interval !== null) {
    state.interval = interval;
  }

  return state.interval;
}

// Picks the reading with the highest color level; ties go to the higher
// value. Levels make sources comparable: 20 % CPU pressure is routine while
// 20 % memory pressure is severe.
export function pickWorstPressure(readings, colorsBySource, separator = " ") {
  let worst = null;

  for (const reading of readings) {
    const level = getUsageLevel(
      reading.value,
      colorsBySource[reading.source.id] ?? [],
      separator
    );

    if (
      !worst ||
      level > worst.level ||
      (level === worst.level && reading.value > worst.value)
    ) {
      worst = { ...reading, level };
    }
  }

  return worst;
}
