var GpuBackend = class GpuBackend {
    constructor(context) {
        this._gpuBox = context.gpuBox;
        this._gpuMemoryMonitor = context.gpuMemoryMonitor;
        this._gpuMemoryUnitType = context.gpuMemoryUnitType;
        this._gpuMemoryUnitMeasure = context.gpuMemoryUnitMeasure;
        this._thermalTemperatureUnit = context.thermalTemperatureUnit;
        this._decimalsStatus = context.decimalsStatus;
    }


    static detect() {
        return false;
    }

    async query() {
        throw new Error('Not implemented');
    }
}