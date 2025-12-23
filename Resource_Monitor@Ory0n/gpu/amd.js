const GpuBackend = imports.misc.extensionUtils.getCurrentExtension().imports.gpu.backend.GpuBackend;
const { Gio, GLib } = imports.gi;

var AmdBackend = class AmdBackend extends GpuBackend {
    static detect() {
        return GLib.file_test('/sys/class/drm/card0/device/hwmon', GLib.FileTest.EXISTS);
    }

    async query() {
        const cards = this._findAmdCards();
        for (const card of cards) {
            const uuid = card; 
            const base = `/sys/class/drm/${card}/device`;

            const usage = this._readInt(`${base}/gpu_busy_percent`);
            const vramTotal = this._readInt(`${base}/mem_info_vram_total`);
            const vramUsed = this._readInt(`${base}/mem_info_vram_used`);
            const temperature = this._readTemperature(base);

            // ---- USAGE ----
            if (usage !== null) {
                this._gpuBox.update_element_value(uuid, `${usage}`, '%');
            }
            
            // ---- MEMORY ----
            if (vramTotal && vramUsed) {
                let value;
                let unit = 'KB';

                if (this._gpuMemoryUnitType === 'perc') {
                    const usedPerc = (100 * vramUsed) / vramTotal;
                    value = this._gpuMemoryMonitor === 'free'
                        ? 100 - usedPerc
                        : usedPerc;
                    unit = '%';
                } else {
                    value = this._gpuMemoryMonitor === 'free'
                        ? (vramTotal - vramUsed)
                        : vramUsed;

                    value /= 1024; // bytes → KB

                    switch (this._gpuMemoryUnitMeasure) {
                        case 'm':
                            value /= 1000;
                            unit = 'MB';
                            break;
                        case 'g':
                            value /= 1_000_000;
                            unit = 'GB';
                            break;
                        case 't':
                            value /= 1_000_000_000;
                            unit = 'TB';
                            break;
                        case 'auto':
                        default:
                            if (value > 1000) {
                                value /= 1000;
                                unit = 'MB';
                                if (value > 1000) {
                                    value /= 1000;
                                    unit = 'GB';
                                }
                            }
                            break;
                    }
                }

                this._gpuBox.update_element_memory_value(
                    uuid,
                    this._decimalsStatus ? `${value.toFixed(1)}` : `${value.toFixed(0)}`,
                    unit
                );
            }

            // ---- TEMPERATURE ----
            if (temperature !== null) {

                let valueT = temperature;
                let unitT = '°C';

                if (this._thermalTemperatureUnit === 'f') {
                    valueT = (valueT * 1.8) + 32;
                    unitT = '°F';
                }

                const picsa = this._decimalsStatus ? `${valueT.toFixed(1)}` : `${valueT.toFixed(0)}`;

                this._gpuBox.update_element_thermal_value(
                    uuid,
                    this._decimalsStatus ? `${valueT.toFixed(1)}` : `${valueT.toFixed(0)}`,
                    unitT
                );
            }
        }
    }

    // ---------------- helpers ----------------

    _findAmdCards() {
        const dir = Gio.File.new_for_path('/sys/class/drm');
        const enumerator = dir.enumerate_children(
            'standard::name',
            Gio.FileQueryInfoFlags.NONE,
            null
        );

        const cards = [];
        let info;
        while ((info = enumerator.next_file(null))) {
            const name = info.get_name();
            if (name.startsWith('card')) {
                const vendor = this._readString(`/sys/class/drm/${name}/device/vendor`);
                if (vendor === '0x1002') { // AMD
                    cards.push(name);
                }
            }
        }
        return cards;
    }

    _readInt(path) {
        try {
            const file = Gio.File.new_for_path(path);
            const [, contents] = file.load_contents(null);
            return parseInt(new TextDecoder().decode(contents).trim());
        } catch {
            return null;
        }
    }

    _readString(path) {
        try {
            const file = Gio.File.new_for_path(path);
            const [, contents] = file.load_contents(null);
            return new TextDecoder().decode(contents).trim();
        } catch {
            return null;
        }
    }

    _readTemperature(basePath) {
        try {
            const hwmonDirPath = `${basePath}/hwmon`;
            const file = Gio.File.new_for_path(hwmonDirPath);
            const enumerator = file.enumerate_children(
                'standard::name',
                Gio.FileQueryInfoFlags.NONE,
                null
            );
            let info;
            while ((info = enumerator.next_file(null)) !== null) {
                const hwmonPath = `${hwmonDirPath}/${info.get_name()}`;
                const tempPath = `${hwmonPath}/temp1_input`;
                if (GLib.file_test(tempPath, GLib.FileTest.EXISTS)) {
                    const temp = this._readInt(tempPath);
                    return temp !== null ? temp / 1000 : null;
                }
            }
            return null;
        } catch (e) {
            log(`[Resource_Monitor] GPU temp read error: ${e}`);
            return null;
        }
    }
}
