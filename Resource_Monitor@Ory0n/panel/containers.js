import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

const UNIT_PADDING_STYLE = "padding-left: 0.125em;";

const DiskContainer = GObject.registerClass(
  class DiskContainer extends St.BoxLayout {
    _init() {
      super._init();

      this._elementsPath = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];
    }

    set_element_width(width) {
      if (width === 0) {
        this._elementsPath.forEach((element) => {
          this._elementsValue[element].min_width = 0;
          this._elementsValue[element].natural_width = 0;
          this._elementsValue[element].min_width_set = false;
          this._elementsValue[element].natural_width_set = false;
        });
      } else {
        this._elementsPath.forEach((element) => {
          this._elementsValue[element].width = width;
        });
      }
    }

    set_element_name_visibility(status) {
      this._elementsPath.forEach((element) => {
        if (typeof this._elementsName[element] !== "undefined") {
          if (status) {
            this._elementsName[element].show();
          } else {
            this._elementsName[element].hide();
          }
        }
      });
    }

    cleanup_elements() {
      this._elementsPath = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];

      this.remove_all_children();
    }
  }
);

export const DiskContainerStats = GObject.registerClass(
  class DiskContainerStats extends DiskContainer {
    _init() {
      super._init();

      this.idleOld = [];
      this.rwTotOld = [];

      this.add_single();
    }

    add_single() {
      this._elementsPath.push("single");

      this._elementsValue["single"] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._elementsValue["single"].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._elementsUnit["single"] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._elementsUnit["single"].set_style(UNIT_PADDING_STYLE);

      this.add_child(this._elementsValue["single"]);
      this.add_child(this._elementsUnit["single"]);

      this.idleOld["single"] = 0;
      this.rwTotOld["single"] = [0, 0];
    }

    add_element(filesystem, label) {
      this._elementsPath.push(filesystem);

      this._elementsName[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ` ${label}: `,
      });

      this._elementsValue[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--|--",
      });
      this._elementsValue[filesystem].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._elementsUnit[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "K",
      });
      this._elementsUnit[filesystem].set_style(UNIT_PADDING_STYLE);

      this.add_child(this._elementsName[filesystem]);
      this.add_child(this._elementsValue[filesystem]);
      this.add_child(this._elementsUnit[filesystem]);

      this.idleOld[filesystem] = 0;
      this.rwTotOld[filesystem] = [0, 0];
    }

    update_mode(mode) {
      switch (mode) {
        case "single":
          this._elementsPath.forEach((element) => {
            if (element !== "single") {
              this._elementsName[element].hide();
              this._elementsValue[element].hide();
              this._elementsUnit[element].hide();
            } else {
              this._elementsValue[element].show();
              this._elementsUnit[element].show();
            }
          });

          break;

        case "multiple":

        default:
          this._elementsPath.forEach((element) => {
            if (element !== "single") {
              this._elementsName[element].show();
              this._elementsValue[element].show();
              this._elementsUnit[element].show();
            } else {
              this._elementsValue[element].hide();
              this._elementsUnit[element].hide();
            }
          });

          break;
      }
    }

    get_filesystem(name) {
      return this._elementsPath.filter((item) => item.endsWith(name)).shift();
    }

    get_idle(filesystem) {
      return this.idleOld[filesystem];
    }

    get_rw_tot(filesystem) {
      return this.rwTotOld[filesystem];
    }

    set_idle(filesystem, idle) {
      this.idleOld[filesystem] = idle;
    }

    set_rw_tot(filesystem, rwTot) {
      this.rwTotOld[filesystem] = rwTot;
    }

    update_element_value(filesystem, value, unit, style = "") {
      if (this._elementsValue[filesystem]) {
        this._elementsValue[filesystem].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsUnit[filesystem].text = unit;
      }
    }
  }
);

export const DiskContainerSpace = GObject.registerClass(
  class DiskContainerSpace extends DiskContainer {
    add_element(filesystem, label) {
      this._elementsPath.push(filesystem);

      this._elementsName[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: ` ${label}: `,
      });

      this._elementsValue[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "--",
      });
      this._elementsValue[filesystem].clutter_text.set({
        x_align: Clutter.ActorAlign.END,
      });

      this._elementsUnit[filesystem] = new St.Label({
        y_align: Clutter.ActorAlign.CENTER,
        text: "KB",
      });
      this._elementsUnit[filesystem].set_style(UNIT_PADDING_STYLE);

      this.add_child(this._elementsName[filesystem]);
      this.add_child(this._elementsValue[filesystem]);
      this.add_child(this._elementsUnit[filesystem]);
    }

    update_element_value(filesystem, value, unit, style = "") {
      if (this._elementsValue[filesystem]) {
        this._elementsValue[filesystem].text = value;
        this._elementsValue[filesystem].style = style;
        this._elementsUnit[filesystem].text = unit;
      }
    }
  }
);

export const GpuContainer = GObject.registerClass(
  class GpuContainer extends St.BoxLayout {
    _init() {
      super._init();

      this._elementsUuid = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];
      this._elementsMemoryValue = [];
      this._elementsMemoryUnit = [];
      this._elementsThermalValue = [];
      this._elementsThermalUnit = [];
    }

    set_element_width(width) {
      if (width === 0) {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsValue[element] !== "undefined") {
            this._elementsValue[element].min_width = 0;
            this._elementsValue[element].natural_width = 0;
            this._elementsValue[element].min_width_set = false;
            this._elementsValue[element].natural_width_set = false;
          }

          if (typeof this._elementsMemoryValue[element] !== "undefined") {
            this._elementsMemoryValue[element].min_width = 0;
            this._elementsMemoryValue[element].natural_width = 0;
            this._elementsMemoryValue[element].min_width_set = false;
            this._elementsMemoryValue[element].natural_width_set = false;
          }
        });
      } else {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsValue[element] !== "undefined") {
            this._elementsValue[element].width = width;
          }

          if (typeof this._elementsMemoryValue[element] !== "undefined") {
            this._elementsMemoryValue[element].width = width;
          }
        });
      }
    }

    set_element_thermal_width(width) {
      if (width === 0) {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsThermalValue[element] !== "undefined") {
            this._elementsThermalValue[element].min_width = 0;
            this._elementsThermalValue[element].natural_width = 0;
            this._elementsThermalValue[element].min_width_set = false;
            this._elementsThermalValue[element].natural_width_set = false;
          }
        });
      } else {
        this._elementsUuid.forEach((element) => {
          if (typeof this._elementsThermalValue[element] !== "undefined") {
            this._elementsThermalValue[element].width = width;
          }
        });
      }
    }

    cleanup_elements() {
      this._elementsUuid = [];
      this._elementsName = [];
      this._elementsValue = [];
      this._elementsUnit = [];
      this._elementsMemoryValue = [];
      this._elementsMemoryUnit = [];
      this._elementsThermalValue = [];
      this._elementsThermalUnit = [];

      this.remove_all_children();
    }

    add_element(uuid, label, usage, memory, thermal) {
      this._elementsUuid.push(uuid);

      if (label !== null) {
        this._elementsName[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: ` ${label}: `,
        });
        this.add_child(this._elementsName[uuid]);
      }

      if (usage) {
        this._elementsValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

        this._elementsUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "%",
        });
        this._elementsUnit[uuid].set_style(UNIT_PADDING_STYLE);

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsValue[uuid]);
        this.add_child(this._elementsUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }

      if (memory) {
        this._elementsMemoryValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsMemoryValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

        this._elementsMemoryUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "KB",
        });
        this._elementsMemoryUnit[uuid].set_style(UNIT_PADDING_STYLE);

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsMemoryValue[uuid]);
        this.add_child(this._elementsMemoryUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }

      if (thermal) {
        this._elementsThermalValue[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "--",
        });
        this._elementsThermalValue[uuid].clutter_text.set({
          x_align: Clutter.ActorAlign.END,
        });

        this._elementsThermalUnit[uuid] = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          text: "°C",
        });
        this._elementsThermalUnit[uuid].set_style(UNIT_PADDING_STYLE);

        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "[",
          })
        );
        this.add_child(this._elementsThermalValue[uuid]);
        this.add_child(this._elementsThermalUnit[uuid]);
        this.add_child(
          new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            text: "]",
          })
        );
      }
    }

    update_element_value(uuid, value, unit, style = "") {
      if (this._elementsValue[uuid]) {
        this._elementsValue[uuid].text = value;
        this._elementsValue[uuid].style = style;
        this._elementsUnit[uuid].text = unit;
      }
    }

    update_element_memory_value(uuid, value, unit, style = "") {
      if (this._elementsMemoryValue[uuid]) {
        this._elementsMemoryValue[uuid].text = value;
        this._elementsMemoryValue[uuid].style = style;
        this._elementsMemoryUnit[uuid].text = unit;
      }
    }

    update_element_thermal_value(uuid, value, unit, style = "") {
      if (this._elementsThermalValue[uuid]) {
        this._elementsThermalValue[uuid].text = value;
        this._elementsThermalValue[uuid].style = style;
        this._elementsThermalUnit[uuid].text = unit;
      }
    }
  }
);
