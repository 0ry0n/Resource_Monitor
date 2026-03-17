import Gio from "gi://Gio";

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
        reject(error);
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
        reject(error);
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

export function queryFilesystemInfo(path, cancellable = null) {
  const file = Gio.File.new_for_path(path);

  return new Promise((resolve, reject) => {
    file.query_filesystem_info_async(
      `${Gio.FILE_ATTRIBUTE_FILESYSTEM_SIZE},${Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE}`,
      0,
      cancellable,
      (sourceObject, result) => {
        try {
          const info = sourceObject.query_filesystem_info_finish(result);
          resolve({
            size: info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_SIZE),
            free: info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE),
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
