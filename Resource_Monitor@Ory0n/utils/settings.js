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
