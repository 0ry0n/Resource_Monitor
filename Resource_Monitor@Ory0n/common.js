const SETTINGS_ENTRY_VERSION = 2;

function _serialize(type, payload) {
  return JSON.stringify({
    version: SETTINGS_ENTRY_VERSION,
    type,
    ...payload,
  });
}

function _parseJsonEntry(serialized, type) {
  try {
    const parsed = JSON.parse(serialized);
    if (
      parsed &&
      parsed.version === SETTINGS_ENTRY_VERSION &&
      parsed.type === type
    ) {
      return parsed;
    }
  } catch (error) {
    // Fall back to legacy separators.
  }

  return null;
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

function _joinLegacyParts(parts, startIndex, endIndex) {
  return parts.slice(startIndex, endIndex).join(":");
}

export function serializeDiskEntry({
  device,
  mountPoint = "",
  stats = false,
  space = false,
  displayName = "",
}) {
  return _serialize("disk", {
    device,
    mountPoint,
    stats: Boolean(stats),
    space: Boolean(space),
    displayName,
  });
}

export function parseDiskEntry(serialized) {
  const parsed = _parseJsonEntry(serialized, "disk");
  if (parsed) {
    return {
      device: parsed.device ?? "",
      mountPoint: parsed.mountPoint ?? "",
      stats: _toBoolean(parsed.stats),
      space: _toBoolean(parsed.space),
      displayName: parsed.displayName ?? "",
    };
  }

  const [device = "", mountPoint = "", stats = "false", space = "false", ...name] =
    serialized.split(" ");

  return {
    device,
    mountPoint,
    stats: _toBoolean(stats),
    space: _toBoolean(space),
    displayName: name.join(" "),
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
  if (parsed) {
    return {
      name: parsed.name ?? "",
      monitor: _toBoolean(parsed.monitor),
      path: parsed.path ?? "",
    };
  }

  const parts = serialized.split("-");
  const path = parts.pop() ?? "";
  const monitor = parts.pop() ?? "false";

  return {
    name: parts.join("-"),
    monitor: _toBoolean(monitor),
    path,
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
  if (parsed) {
    return {
      device: parsed.device ?? "",
      name: parsed.name ?? "",
      monitor: _toBoolean(parsed.monitor),
    };
  }

  const parts = serialized.split(":");
  const device = parts.shift() ?? "";
  const monitor = parts.pop() ?? "false";

  return {
    device,
    name: parts.join(":"),
    monitor: _toBoolean(monitor),
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
  if (parsed) {
    return {
      device: parsed.device ?? "",
      name: parsed.name ?? "",
      usage: _toBoolean(parsed.usage),
      memory: _toBoolean(parsed.memory),
      displayName: parsed.displayName ?? "",
    };
  }

  const parts = serialized.split(":");
  const device = parts.shift() ?? "";
  const displayName = parts.pop() ?? "";
  const memory = parts.pop() ?? "false";
  const usage = parts.pop() ?? "false";

  return {
    device,
    name: _joinLegacyParts(parts, 0, parts.length),
    usage: _toBoolean(usage),
    memory: _toBoolean(memory),
    displayName,
  };
}
