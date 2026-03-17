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

function _normalizeThresholdValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function _normalizeColorEntry(colorEntry, separator = " ") {
  if (typeof colorEntry !== "string") {
    return "";
  }

  return colorEntry.includes("undefined")
    ? colorEntry.replaceAll("undefined", separator)
    : colorEntry;
}

function _sortColorEntries(colorsArray, separator) {
  return [...colorsArray].sort((first, second) => {
    const [firstThreshold] = _normalizeColorEntry(first, separator).split(separator);
    const [secondThreshold] = _normalizeColorEntry(second, separator).split(separator);
    return (
      _normalizeThresholdValue(firstThreshold) -
      _normalizeThresholdValue(secondThreshold)
    );
  });
}

function _normalizeAndSortColorEntries(colorsArray, separator = " ") {
  return _sortColorEntries(
    colorsArray.map((colorEntry) => _normalizeColorEntry(colorEntry, separator)),
    separator
  );
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
      label: _("At or above"),
      hexpand: true,
      halign: Gtk.Align.START,
    })
  );

  const entry = new Gtk.Entry({
    input_purpose: Gtk.InputPurpose.NUMBER,
    text,
    width_chars: 7,
    margin_end: 8,
  });
  entry.connect("changed", (widget) => {
    const index = row.get_index();
    let colorsArray = settings.get_strv(settingsName);

    if (index >= 0 && index < colorsArray.length) {
      const [, oldRed, oldGreen, oldBlue] = _normalizeColorEntry(
        colorsArray[index],
        separator
      ).split(separator);
      colorsArray[index] =
        `${widget.text}${separator}${oldRed}${separator}${oldGreen}${separator}${oldBlue}`;
      settings.set_strv(settingsName, colorsArray);
    }
  });
  box.append(entry);

  const colorButton = new Gtk.ColorButton({
    rgba: new Gdk.RGBA({ red, green, blue, alpha }),
    margin_end: 8,
  });
  colorButton.connect("color-set", (widget) => {
    const index = row.get_index();
    let colorsArray = settings.get_strv(settingsName);

    if (index >= 0 && index < colorsArray.length) {
      const rgba = widget.get_rgba();
      _setPreviewMarkup(preview, rgba);
      const [threshold] = _normalizeColorEntry(
        colorsArray[index],
        separator
      ).split(separator);
      colorsArray[index] =
        `${threshold}${separator}${rgba.red}${separator}${rgba.green}${separator}${rgba.blue}`;
      settings.set_strv(settingsName, colorsArray);
    }
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
  const colorsArray = _normalizeAndSortColorEntries(
    settings.get_strv(settingsName),
    separator
  );

  settings.set_strv(settingsName, colorsArray);

  for (const element of colorsArray) {
    const [threshold, red, green, blue] = element.split(separator);
    makeColorRow(
      settings,
      settingsName,
      listBox,
      separator,
      threshold,
      parseFloat(red),
      parseFloat(green),
      parseFloat(blue)
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

  view.append_column(
    new Gtk.ColumnViewColumn({
      title: _("Monitor"),
      factory: monitorFactory,
      resizable: true,
    })
  );

  return model;
}

export function saveArrayToSettings(model, settings, key) {
  const array = [];
  for (let iter = 0; iter < model.get_n_items(); iter++) {
    array.push(model.get_item(iter).getFormattedString());
  }
  settings.set_strv(key, array);
}
