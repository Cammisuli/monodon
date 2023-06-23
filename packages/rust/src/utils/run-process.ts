import { execSync } from 'child_process';
import { joinPathFragments, workspaceRoot } from '@nx/devkit';
import { cargoMetadata } from './cargo';

export function runProcess(
  processCmd: string,
  ...args: string[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  const metadata = cargoMetadata();
  const targetDir =
    metadata?.target_directory ??
    joinPathFragments(workspaceRoot, 'dist', 'cargo');

  return new Promise((resolve) => {
    if (process.env.VERCEL) {
      // Vercel doesnt have support for cargo atm, so auto success builds
      return resolve({ success: true });
    }

    execSync(processCmd + ' ' + args.join(' '), {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUSTC_WRAPPER: '',
        CARGO_TARGET_DIR: targetDir,
        CARGO_BUILD_TARGET_DIR: targetDir,
      },
      windowsHide: true,
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    resolve({ success: true });
  });
}
