export function parseSettingsArray(settings, key, parser) {
  return settings
    .get_strv(key)
    .map((entry) => {
      try {
        return parser(entry);
      } catch (error) {
        console.error(
          `[Resource_Monitor] Error parsing settings entry for ${key}: ${error.message}`
        );
        return null;
      }
    })
    .filter(Boolean);
}

// Inserts items added in newer versions (missing from a stored order) next to
// their neighbour from the default order, so upgrades don't hide new groups.
export function normalizeItemsPosition(stored, defaults) {
  const result = [...stored];

  defaults.forEach((item, index) => {
    if (!result.includes(item)) {
      const previous = defaults[index - 1];
      result.splice(previous ? result.indexOf(previous) + 1 : 0, 0, item);
    }
  });

  return result;
}

export function readItemsPosition(settings, key) {
  return normalizeItemsPosition(
    settings.get_strv(key),
    settings.get_default_value(key).deepUnpack()
  );
}
