const { Gio } = imports.gi;

var executeCommand = async(command, cancellable = null) => {
    try {
        const proc = Gio.Subprocess.new(command, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
        const output = await _readOutput(proc, cancellable);

        return output;
    } catch (error) {
        log('[Resource_Monitor] Execute Command Error (' + error + ')');
    }
}

function _readOutput(proc, cancellable = null) {
    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(null, cancellable, (source_object, res) => {
            try {
                const [ok, stdout, stderr] = source_object.communicate_utf8_finish(res);

                if (source_object.get_successful()) {
                    resolve(stdout);
                } else {
                    throw new Error(stderr);
                }
            } catch (e) {
                reject(e);
            }
        });
    });
}
