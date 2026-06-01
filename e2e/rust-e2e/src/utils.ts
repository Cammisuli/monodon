import { dirname, join, relative } from 'path';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpProjPath } from '@nx/plugin/testing';

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
export function createTestProject(testId = '') {
  const projectName = 'test-project-' + testId;
  const projectDirectory = tmpProjPath(projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  // --skipGit: the project is created under the repo's gitignored `tmp/` dir, so
  // create-nx-workspace would otherwise try to `git add` into the parent repo and
  // abort on the ignored path. Specs that need git (e.g. nx release) init their own.
  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive --packageManager yarn --skipGit`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}

/**
 * Installs the plugin (built and published to the local npm registry in the jest
 * globalSetup) into a test project.
 *
 * -W: the generated workspace's package.json declares `workspaces`, and yarn
 * classic refuses to add a dependency to the workspace root without it.
 */
export function installPlugin(projectDirectory: string) {
  execSync(`yarn add -D @monodon/rust@e2e -W`, {
    cwd: projectDirectory,
    stdio: 'inherit',
    env: process.env,
  });
}

/**
 * Locates a generated crate's directory (root relative to the workspace). The
 * generator places crates under a layout-dependent base dir (e.g. packages/),
 * so we find the `<crate>/Cargo.toml` rather than assuming a fixed path.
 */
export function crateRoot(workspace: string, crate: string): string {
  const skip = new Set(['node_modules', 'target', 'dist', '.git', '.nx']);

  const search = (dir: string, depth: number): string | null => {
    if (depth > 4) return null;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || skip.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.name === crate && existsSync(join(full, 'Cargo.toml'))) {
        return full;
      }
      const nested = search(full, depth + 1);
      if (nested) return nested;
    }
    return null;
  };

  const found = search(workspace, 0);
  if (!found) {
    throw new Error(
      `Could not locate generated crate "${crate}" under ${workspace}`
    );
  }
  return relative(workspace, found);
}

export function runNxCommand(command: string, projectDir: string) {
  // NX_DAEMON=false: the daemon can serve a stale (empty) project graph in these
  // throwaway workspaces, which breaks commands that read the graph (e.g. nx
  // release). Force a fresh computation on every invocation.
  execSync(`npx nx ${command}`, {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, NX_DAEMON: 'false' },
  });
}
