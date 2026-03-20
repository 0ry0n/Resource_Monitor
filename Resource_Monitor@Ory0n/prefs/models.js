import GObject from "gi://GObject";

import {
  serializeDiskEntry,
  serializeGpuEntry,
  serializeThermalCpuEntry,
  serializeThermalGpuEntry,
} from "../common.js";

export const DiskElement = GObject.registerClass(
  class DiskElement extends GObject.Object {
    _init(displayName, device, stableId, mountPoint, stats, space) {
      super._init();
      this.device = device;
      this.stableId = stableId ?? "";
      this.mountPoint = mountPoint;
      this.stats = stats;
      this.space = space;

      this.setDisplayName(displayName);
    }

    setDisplayName(displayName) {
      if (displayName) {
        this.displayName = displayName;
      } else if (this.device.match(/(\/\w+)+/)) {
        this.displayName = this.device.split("/").pop();
      } else {
        this.displayName = this.device;
      }
    }

    getFormattedString() {
      return serializeDiskEntry({
        device: this.device,
        stableId: this.stableId,
        mountPoint: this.mountPoint,
        stats: this.stats,
        space: this.space,
        displayName: this.displayName,
      });
    }
  }
);

export const ThermalElement = GObject.registerClass(
  class ThermalElement extends GObject.Object {
    _init(device, name, monitor) {
      super._init();
      this.device = device;
      this.name = name;
      this.monitor = monitor;
    }

    getFormattedString() {
      return "";
    }
  }
);

export const ThermalCpuElement = GObject.registerClass(
  class ThermalCpuElement extends ThermalElement {
    getFormattedString() {
      return serializeThermalCpuEntry({
        name: this.name,
        monitor: this.monitor,
        path: this.device,
      });
    }
  }
);

export const ThermalGpuElement = GObject.registerClass(
  class ThermalGpuElement extends ThermalElement {
    getFormattedString() {
      return serializeThermalGpuEntry({
        device: this.device,
        name: this.name,
        monitor: this.monitor,
      });
    }
  }
);

export const GpuElement = GObject.registerClass(
  class GpuElement extends GObject.Object {
    _init(displayName, device, name, usage, memory) {
      super._init();
      this.device = device;
      this.name = name;
      this.usage = usage;
      this.memory = memory;

      this.setDisplayName(displayName);
    }

    setDisplayName(displayName) {
      this.displayName = displayName || this.name;
    }

    getFormattedString() {
      return serializeGpuEntry({
        device: this.device,
        name: this.name,
        usage: this.usage,
        memory: this.memory,
        displayName: this.displayName,
      });
    }
  }
);
