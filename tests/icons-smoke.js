import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";

// Exercise icon lookup without a display or icons supplied by the host theme.
const root = Gio.File.new_for_uri(import.meta.url).get_parent().get_parent();
const icons = root.get_child("Resource_Monitor@Ory0n/icons");
const assets = icons.get_child("hicolor/scalable/actions");
const theme = new Gtk.IconTheme();
theme.set_search_path([icons.get_path()]);
theme.set_theme_name("resource-monitor-test-missing-theme");

const files = assets.enumerate_children(
  "standard::name",
  Gio.FileQueryInfoFlags.NONE,
  null
);
let count = 0;
try {
  let info;
  while ((info = files.next_file(null)) !== null) {
    const filename = info.get_name();
    if (!filename.endsWith("-symbolic.svg")) continue;
    const name = filename.slice(0, -4);
    for (const size of [16, 32]) {
      const icon = theme.lookup_icon(
        name, null, size, 1, Gtk.TextDirection.NONE,
        Gtk.IconLookupFlags.FORCE_SYMBOLIC
      );
      if (!theme.has_icon(name) || !icon.is_symbolic ||
          !icon.get_file()?.equal(assets.get_child(filename))) {
        throw new Error(`Bundled symbolic icon did not resolve: ${name} (${size}px)`);
      }
    }
    count++;
  }
} finally {
  files.close(null);
}
if (count === 0) throw new Error("No bundled icons found");
console.log(`Bundled icon smoke tests passed (${count} icons).`);
