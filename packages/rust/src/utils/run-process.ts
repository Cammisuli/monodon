import { ChildProcess, spawn } from 'child_process';

export let childProcess: ChildProcess | null;

export function runProcess(
  processCmd: string,
  ...args: string[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  return new Promise((resolve, reject) => {
    childProcess = spawn(processCmd, [...args, '--color', 'always'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUSTC_WRAPPER: '',
      },
      stdio: ['pipe'],
    });

    // cargo outputs to stderr instead of stdout. Redirect to stdout.
    childProcess.stderr?.pipe(process.stdout);

    // Ensure the child process is killed when the parent exits
    process.on('exit', () => childProcess?.kill());
    process.on('SIGTERM', () => childProcess?.kill());

    childProcess.on('error', (err) => {
      reject({ success: false });
    });

    childProcess.on('exit', (code) => {
      childProcess = null;
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject({ success: false });
      }
    });
  });
}
