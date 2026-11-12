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
        const [, stdout, stderr] = sourceObject.communicate_utf8_finish(result);
        if (sourceObject.get_successful()) {
          resolve(stdout);
          return;
        }

        const exitStatus = sourceObject.get_if_exited()
          ? sourceObject.get_exit_status()
          : `signal ${sourceObject.get_term_sig()}`;
        const reason = (stderr || "").trim();
        reject(
          new Error(
            reason
              ? `Process failed (exit ${exitStatus}): ${reason}`
              : `Process failed with exit status ${exitStatus}`
          )
        );
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function executeCommand(command, cancellable = null) {
  cancellable?.set_error_if_cancelled();
  const proc = Gio.Subprocess.new(
    command,
    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
  );
  // Cancelling communicate_utf8_async() alone does not stop nvidia-smi.
  const cancelId = cancellable?.connect(() => proc.force_exit());
  try {
    return await readOutput(proc, cancellable);
  } finally {
    if (cancelId) {
      cancellable.disconnect(cancelId);
    }
  }
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
