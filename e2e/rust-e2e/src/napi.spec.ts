import { execSync } from 'child_process';
import { createTestProject, runNxCommand } from './utils';
import { rmSync } from 'fs';
import { listFiles } from '@nx/plugin/testing';

describe('napi', () => {
  let projectDirectory: string;
  beforeAll(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`npm install @monodon/rust@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  afterAll(() => {
    // Cleanup the test project
    rmSync(projectDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('should create a napi project', () => {
    runNxCommand(
      `generate @monodon/rust:lib napi-proj --napi`,
      projectDirectory
    );

    expect(listFiles(`test-project/napi_proj/npm`).length).toBeGreaterThan(0);

    expect(() =>
      runNxCommand(`build napi_proj`, projectDirectory)
    ).not.toThrow();

    const files = listFiles(`test-project/napi_proj`);
    expect(files.some((file) => file.endsWith('.node'))).toBeTruthy();

    expect(() =>
      runNxCommand(
        `build napi_proj -- --target wasm32-wasip1-threads`,
        projectDirectory
      )
    ).not.toThrow();
    const files2 = listFiles(`test-project/napi_proj`);
    expect(
      files2.some((file) => file.endsWith('wasm32-wasi.wasm'))
    ).toBeTruthy();
    expect(files2).toContain('wasi-worker.mjs');
    expect(files2).toContain('wasi-worker-browser.mjs');
  });
});
