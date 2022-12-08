import { execSync } from 'child_process';

export function runProcess(
  processCmd: string,
  ...args: string[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  return new Promise((resolve) => {
    execSync(processCmd + ' ' + args.join(' ') + ' --color always', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUSTC_WRAPPER: '',
      },
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    resolve({ success: true });
  });
}
