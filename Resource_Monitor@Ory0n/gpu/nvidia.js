const { GLib } = imports.gi;
const GpuBackend = imports.misc.extensionUtils.getCurrentExtension().imports.gpu.backend.GpuBackend;
const _executeCommand = imports.misc.extensionUtils.getCurrentExtension().imports.utils.executeCommand

var NvidiaBackend = class NvidiaBackend extends GpuBackend {
    static detect() {
        try {
            GLib.spawn_command_line_sync('nvidia-smi');
            return true;
        } catch (e) {
            return false;
        }
    }

    async query() {
        const output = await _executeCommand(['nvidia-smi', '--query-gpu=uuid,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu', '--format=csv,noheader']);
        const lines = output.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            const entry = line.trim().split(/\,\s/);

            const uuid = entry[0];
            let memoryTotal = entry[1].slice(0, -4);
            let memoryUsed = entry[2].slice(0, -4);
            let memoryFree = entry[3].slice(0, -4);
            const usage = entry[4].slice(0, -1);
            const temperature = entry[5];

            // mebibyte
            memoryTotal = parseInt(memoryTotal);
            memoryUsed = parseInt(memoryUsed);
            memoryFree = parseInt(memoryFree);

            // kibibyte
            memoryTotal *= 1024;
            memoryUsed *= 1024;
            memoryFree *= 1024;

            // kilobyte
            memoryTotal *= 1.024;
            memoryUsed *= 1.024;
            memoryFree *= 1.024;

            this._gpuBox.update_element_value(uuid, usage, '%');

            let value = 0;
            let unit = 'KB';
            switch (this._gpuMemoryUnitType) {
                case 'perc':
                    const used = (100 * memoryUsed) / memoryTotal;
                    unit = '%';

                    switch (this._gpuMemoryMonitor) {
                        case 'free':
                            value = 100 - used;

                            break;

                        case 'used':

                        default:
                            value = used;

                            break;
                    }

                    break;

                case 'numeric':

                default:
                    switch (this._gpuMemoryMonitor) {
                        case 'free':
                            value = memoryFree;

                            break;

                        case 'used':

                        default:
                            value = memoryUsed;

                            break;
                    }

                    switch (this._gpuMemoryUnitMeasure) {
                        case 'k':
                            unit = 'KB';
                            break;

                        case 'm':
                            unit = 'MB';
                            value /= 1000;

                            break;

                        case 'g':
                            unit = 'GB';
                            value /= 1000;
                            value /= 1000;

                            break;

                        case 't':
                            unit = 'TB';
                            value /= 1000;
                            value /= 1000;
                            value /= 1000;

                            break;

                        case 'auto':

                        default:
                            if (value > 1000) {
                                unit = 'MB';
                                value /= 1000;
                                if (value > 1000) {
                                    unit = 'GB';
                                    value /= 1000;
                                    if (value > 1000) {
                                        unit = 'TB';
                                        value /= 1000;
                                    }
                                }
                            } else {
                                unit = 'KB';
                            }

                            break;
                    }

                    break;
            }

            let valueT = parseInt(temperature);
            let unitT = '°C';
            switch (this._thermalTemperatureUnit) {
                case 'f':
                    valueT = (valueT * 1.8) + 32;
                    unitT = '°F';

                    break;

                case 'c':

                default:
                    unitT = '°C';

                    break;
            }

            if (this._decimalsStatus) {
                this._gpuBox.update_element_memory_value(uuid, `${value.toFixed(1)}`, unit);
                this._gpuBox.update_element_thermal_value(uuid, `${valueT.toFixed(1)}`, unitT);
            } else {
                this._gpuBox.update_element_memory_value(uuid, `${value.toFixed(0)}`, unit);
                this._gpuBox.update_element_thermal_value(uuid, `${valueT.toFixed(0)}`, unitT);
            }
        }
    }
}