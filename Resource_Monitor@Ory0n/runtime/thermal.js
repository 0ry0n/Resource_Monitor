import { convertTemperature } from "./metrics.js";

export function buildCpuTemperatureDisplay(results, preferredUnit) {
  let totalTemperature = 0;
  let readings = 0;

  results.forEach((result) => {
    if (result.status !== "fulfilled") {
      return;
    }

    const temperature = parseInt(new TextDecoder().decode(result.value), 10);
    if (!isNaN(temperature)) {
      totalTemperature += temperature / 1000;
      readings++;
    }
  });

  if (readings === 0) {
    return null;
  }

  const average = totalTemperature / readings;
  const [value, unit] = convertTemperature(average, preferredUnit);

  return {
    average,
    value,
    unit,
  };
}
