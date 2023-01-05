import { execSync } from 'child_process';
import { joinPathFragments, workspaceRoot } from '@nrwl/devkit';

export function runProcess(
  processCmd: string,
  ...args: string[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  const targetDir = joinPathFragments(workspaceRoot, 'dist', 'cargo');
  return new Promise((resolve) => {
    execSync(processCmd + ' ' + args.join(' '), {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUSTC_WRAPPER: '',
        CARGO_TARGET_DIR: targetDir,
        CARGO_BUILD_TARGET_DIR: targetDir,
      },
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    resolve({ success: true });
  });
}
