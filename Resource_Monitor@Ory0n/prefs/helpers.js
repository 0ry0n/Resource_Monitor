import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";

export const ResourceMonitorBuilderScope = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class ResourceMonitorBuilderScope extends GObject.Object {
    vfunc_create_closure(builder, handlerName, flags, connectObject) {
      if (flags & Gtk.BuilderClosureFlags.SWAPPED)
        throw new Error('Unsupported template signal flag "swapped"');

      if (typeof this[handlerName] === "undefined")
        throw new Error(`${handlerName} is undefined`);

      return this[handlerName].bind(connectObject || this);
    }
  }
);

export function replaceSignalHandler(widget, propertyName, signalName, callback) {
  if (widget[propertyName]) {
    widget.disconnect(widget[propertyName]);
  }

  widget[propertyName] = widget.connect(signalName, callback);
}

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

export function makeColorRow(
  settings,
  settingsName,
  listbox,
  separator,
  text = "0.0",
  red = 224 / 255,
  green = 27 / 255,
  blue = 36 / 255,
  alpha = 1.0
) {
  const row = new Gtk.ListBoxRow();
  const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

  box.append(
    new Gtk.Label({
      label: "Lower than",
      hexpand: true,
      halign: Gtk.Align.START,
    })
  );

  const entry = new Gtk.Entry({
    input_purpose: Gtk.InputPurpose.NUMBER,
    text,
    margin_end: 8,
  });
  entry.connect("changed", (widget) => {
    const index = row.get_index();
    let colorsArray = settings.get_strv(settingsName);

    if (index >= 0 && index < colorsArray.length) {
      const [, oldRed, oldGreen, oldBlue] = colorsArray[index].split(separator);
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
      const [threshold] = colorsArray[index].split(separator);
      colorsArray[index] =
        `${threshold}${separator}${rgba.red}${separator}${rgba.green}${separator}${rgba.blue}`;
      settings.set_strv(settingsName, colorsArray);
    }
  });
  box.append(colorButton);

  const deleteButton = new Gtk.Button({ icon_name: "edit-delete" });
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
  separator
) {
  const colorsArray = settings.get_strv(settingsName);

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
    title: "Device",
    factory: createLabelFactory((item) => item.device),
    resizable: true,
  });
  view.append_column(deviceCol);

  const nameCol = new Gtk.ColumnViewColumn({
    title: "Name",
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
      title: "Monitor",
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

export function loadContents(file, cancellable = null) {
  return new Promise((resolve, reject) => {
    file.load_contents_async(cancellable, (sourceObject, result) => {
      try {
        const [ok, contents] = sourceObject.load_contents_finish(result);
        if (ok) {
          resolve(contents);
        } else {
          reject(new Error("Failed to load contents"));
        }
      } catch (error) {
        reject(new Error(`Error in load_contents_finish: ${error.message}`));
      }
    });
  });
}

export function loadFile(path, cancellable = null) {
  const file = Gio.File.new_for_path(path);
  return loadContents(file, cancellable);
}

export function readOutput(proc, cancellable = null) {
  return new Promise((resolve, reject) => {
    proc.communicate_utf8_async(null, cancellable, (sourceObject, result) => {
      try {
        const [ok, stdout, stderr] =
          sourceObject.communicate_utf8_finish(result);
        if (ok) {
          resolve(stdout);
        } else {
          reject(new Error(`Process failed with error: ${stderr}`));
        }
      } catch (error) {
        reject(new Error(`Error in communicate_utf8_finish: ${error.message}`));
      }
    });
  });
}

export function executeCommand(command, cancellable = null) {
  const proc = Gio.Subprocess.new(
    command,
    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
  );
  return readOutput(proc, cancellable);
}
