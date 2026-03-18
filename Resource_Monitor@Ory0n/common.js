const SETTINGS_ENTRY_VERSION = 2;

function _serialize(type, payload) {
  return JSON.stringify({
    version: SETTINGS_ENTRY_VERSION,
    type,
    ...payload,
  });
}

function _parseJsonEntry(serialized, type) {
  let parsed = null;

  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`Invalid JSON for ${type} entry.`);
  }

  if (
    !parsed ||
    parsed.version !== SETTINGS_ENTRY_VERSION ||
    parsed.type !== type
  ) {
    throw new Error(`Unsupported ${type} entry version or type.`);
  }

  return parsed;
}

function _toBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

export function serializeDiskEntry({
  device,
  stableId = "",
  mountPoint = "",
  stats = false,
  space = false,
  displayName = "",
}) {
  return _serialize("disk", {
    device,
    stableId,
    mountPoint,
    stats: Boolean(stats),
    space: Boolean(space),
    displayName,
  });
}

export function parseDiskEntry(serialized) {
  const parsed = _parseJsonEntry(serialized, "disk");
  const device = parsed.device ?? "";

  return {
    device,
    stableId: parsed.stableId ?? "",
    mountPoint: parsed.mountPoint ?? "",
    stats: _toBoolean(parsed.stats),
    space: _toBoolean(parsed.space),
    displayName: parsed.displayName || device,
  };
}

export function serializeThermalCpuEntry({
  name,
  monitor = false,
  path = "",
}) {
  return _serialize("thermal-cpu", {
    name,
    monitor: Boolean(monitor),
    path,
  });
}

export function parseThermalCpuEntry(serialized) {
  const parsed = _parseJsonEntry(serialized, "thermal-cpu");

  return {
    name: parsed.name ?? "",
    monitor: _toBoolean(parsed.monitor),
    path: parsed.path ?? "",
  };
}

export function serializeThermalGpuEntry({
  device,
  name,
  monitor = false,
}) {
  return _serialize("thermal-gpu", {
    device,
    name,
    monitor: Boolean(monitor),
  });
}

export function parseThermalGpuEntry(serialized) {
  const parsed = _parseJsonEntry(serialized, "thermal-gpu");

  return {
    device: parsed.device ?? "",
    name: parsed.name ?? "",
    monitor: _toBoolean(parsed.monitor),
  };
}

export function serializeGpuEntry({
  device,
  name,
  usage = false,
  memory = false,
  displayName = "",
}) {
  return _serialize("gpu", {
    device,
    name,
    usage: Boolean(usage),
    memory: Boolean(memory),
    displayName,
  });
}

export function parseGpuEntry(serialized) {
  const parsed = _parseJsonEntry(serialized, "gpu");
  const name = parsed.name ?? "";

  return {
    device: parsed.device ?? "",
    name,
    usage: _toBoolean(parsed.usage),
    memory: _toBoolean(parsed.memory),
    displayName: parsed.displayName || name,
  };
}
