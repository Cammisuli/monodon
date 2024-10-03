import { dirname, join } from 'path';
import { mkdirSync, rmSync } from 'fs';
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

  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive --packageManager yarn`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}

export function runNxCommand(command: string, projectDir: string) {
  execSync(`npx nx ${command}`, { cwd: projectDir, stdio: 'inherit' });
}
