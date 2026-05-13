import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export {
  executeCommand,
  loadContents,
  loadFile,
  readOutput,
} from "../runtime/io.js";
export { parseSettingsArray } from "../utils/settings.js";

export function replaceSignalHandler(widget, propertyName, signalName, callback) {
  if (widget[propertyName]) {
    widget.disconnect(widget[propertyName]);
  }

  widget[propertyName] = widget.connect(signalName, callback);
}

export function connectSpinButton(settings, settingsName, element) {
  settings.bind(settingsName, element, "value", Gio.SettingsBindFlags.DEFAULT);
}

export function connectComboBox(settings, settingsName, element) {
  settings.bind(
    settingsName,
    element,
    "active-id",
    Gio.SettingsBindFlags.DEFAULT
  );
}

export function connectSwitchButton(settings, settingsName, element) {
  settings.bind(settingsName, element, "active", Gio.SettingsBindFlags.DEFAULT);
}

function _parseColorEntry(colorEntry, separator = " ") {
  if (typeof colorEntry !== "string") {
    return null;
  }

  const parts = colorEntry.split(separator);
  if (parts.length !== 4) {
    return null;
  }

  const [threshold, red, green, blue] = parts.map(Number);
  if (
    !Number.isFinite(threshold) ||
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue)
  ) {
    return null;
  }

  return { threshold, red, green, blue };
}

function _formatColorEntry({ threshold, red, green, blue }, separator = " ") {
  return `${threshold}${separator}${red}${separator}${green}${separator}${blue}`;
}

function _sanitizeAndSortColorEntries(colorsArray, separator = " ") {
  return colorsArray
    .map((colorEntry) => _parseColorEntry(colorEntry, separator))
    .filter(Boolean)
    .sort((first, second) => first.threshold - second.threshold);
}

function _rgbaToHex(rgba) {
  const red = Math.round(rgba.red * 255);
  const green = Math.round(rgba.green * 255);
  const blue = Math.round(rgba.blue * 255);
  return `#${red.toString(16).padStart(2, "0")}${green
    .toString(16)
    .padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
}

function _setPreviewMarkup(label, rgba) {
  label.set_markup(
    `<span foreground="${_rgbaToHex(rgba)}">${_("Preview")}</span>`
  );
}

export function makeColorRow(
  settings,
  settingsName,
  listbox,
  separator = " ",
  text = "0.0",
  red = 224 / 255,
  green = 27 / 255,
  blue = 36 / 255,
  alpha = 1.0
) {
  const row = new Gtk.ListBoxRow();
  const box = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 8,
    valign: Gtk.Align.CENTER,
  });

  const preview = new Gtk.Label({
    valign: Gtk.Align.CENTER,
    use_markup: true,
  });
  preview.add_css_class("resource-monitor-threshold-preview");
  _setPreviewMarkup(preview, new Gdk.RGBA({ red, green, blue, alpha }));
  box.append(preview);

  box.append(
    new Gtk.Label({
      label: _("Above"),
      hexpand: true,
      halign: Gtk.Align.START,
    })
  );

  let colorButton = null;
  const updateColorSetting = (thresholdText, rgba) => {
    const index = row.get_index();
    let colorsArray = settings.get_strv(settingsName);

    if (index >= 0 && index < colorsArray.length) {
      colorsArray[index] = _formatColorEntry(
        {
          threshold: Number.parseFloat(thresholdText) || 0,
          red: rgba.red,
          green: rgba.green,
          blue: rgba.blue,
        },
        separator
      );
      settings.set_strv(settingsName, colorsArray);
    }
  };

  const entry = new Gtk.Entry({
    input_purpose: Gtk.InputPurpose.NUMBER,
    text,
    width_chars: 7,
    margin_end: 8,
  });
  entry.connect("changed", (widget) => {
    if (colorButton) {
      updateColorSetting(widget.text, colorButton.get_rgba());
    }
  });
  box.append(entry);

  colorButton = new Gtk.ColorButton({
    rgba: new Gdk.RGBA({ red, green, blue, alpha }),
    margin_end: 8,
  });
  colorButton.connect("color-set", (widget) => {
    const rgba = widget.get_rgba();
    _setPreviewMarkup(preview, rgba);
    updateColorSetting(entry.text, rgba);
  });
  box.append(colorButton);

  const deleteButton = new Gtk.Button({
    icon_name: "edit-delete",
    tooltip_text: _("Remove threshold"),
  });
  deleteButton.connect("clicked", () => {
    const index = row.get_index();
    let colorsArray = settings.get_strv(settingsName);

    if (index >= 0 && index < colorsArray.length) {
      listbox.remove(row);
      colorsArray.splice(index, 1);
      settings.set_strv(settingsName, colorsArray);
    }
  });
  box.append(deleteButton);

  row.child = box;
  listbox.append(row);

  return `${text}${separator}${red}${separator}${green}${separator}${blue}`;
}

export function makeColors(
  settings,
  settingsName,
  listBox,
  addButton,
  separator = " "
) {
  const sortedColorEntries = _sanitizeAndSortColorEntries(
    settings.get_strv(settingsName),
    separator
  );
  const colorsArray = sortedColorEntries.map((entry) =>
    _formatColorEntry(entry, separator)
  );

  settings.set_strv(settingsName, colorsArray);

  for (const { threshold, red, green, blue } of sortedColorEntries) {
    makeColorRow(
      settings,
      settingsName,
      listBox,
      separator,
      `${threshold}`,
      red,
      green,
      blue
    );
  }

  addButton.connect("clicked", () => {
    let nextColors = settings.get_strv(settingsName);
    nextColors.push(makeColorRow(settings, settingsName, listBox, separator));
    settings.set_strv(settingsName, nextColors);
  });
}

export function createLabelFactory(getTextCallback) {
  const factory = new Gtk.SignalListItemFactory();

  factory.connect("setup", (factoryObject, listItem) => {
    const label = new Gtk.Label({ halign: Gtk.Align.START });
    listItem.set_child(label);
  });

  factory.connect("bind", (factoryObject, listItem) => {
    const item = listItem.get_item();
    const label = listItem.get_child();
    label.set_text(getTextCallback(item));
  });

  return factory;
}

export function makeThermalColumnView(view, type, onToggle) {
  const model = new Gio.ListStore({ item_type: type });
  const selection = new Gtk.NoSelection({ model });
  view.set_model(selection);

  const deviceCol = new Gtk.ColumnViewColumn({
    title: _("Device"),
    factory: createLabelFactory((item) => item.device),
    resizable: true,
  });
  view.append_column(deviceCol);

  const nameCol = new Gtk.ColumnViewColumn({
    title: _("Name"),
    factory: createLabelFactory((item) => item.name),
    resizable: true,
  });
  if (typeof nameCol.set_expand === "function") {
    nameCol.set_expand(true);
  } else if ("expand" in nameCol) {
    nameCol.expand = true;
  }
  view.append_column(nameCol);

  const monitorFactory = new Gtk.SignalListItemFactory();
  monitorFactory.connect("setup", (factoryObject, listItem) => {
    const toggle = new Gtk.CheckButton({ halign: Gtk.Align.CENTER });
    listItem.set_child(toggle);
  });

  monitorFactory.connect("bind", (factoryObject, listItem) => {
    const item = listItem.get_item();
    const toggle = listItem.get_child();
    toggle.set_active(item.monitor);

    replaceSignalHandler(
      toggle,
      "_resourceMonitorToggleHandlerId",
      "toggled",
      (toggleButton) => {
        const [found, index] = model.find(item);
        if (found) {
          item.monitor = toggleButton.active;
          model.splice(index, 1, [item]);
          onToggle?.(item, index, model);
        }
      }
    );
  });

  monitorFactory.connect("unbind", (factoryObject, listItem) => {
    const toggle = listItem.get_child();
    if (toggle?._resourceMonitorToggleHandlerId) {
      toggle.disconnect(toggle._resourceMonitorToggleHandlerId);
      toggle._resourceMonitorToggleHandlerId = null;
    }
  });

  const monitorCol = new Gtk.ColumnViewColumn({
    title: _("Monitor"),
    factory: monitorFactory,
    resizable: true,
  });
  if (typeof monitorCol.set_fixed_width === "function") {
    monitorCol.set_fixed_width(110);
  } else if ("fixed_width" in monitorCol) {
    monitorCol.fixed_width = 110;
  }
  view.append_column(monitorCol);

  return model;
}

export function saveArrayToSettings(model, settings, key) {
  const array = [];
  for (let iter = 0; iter < model.get_n_items(); iter++) {
    array.push(model.get_item(iter).getFormattedString());
  }
  settings.set_strv(key, array);
}
