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

    expect(listFiles('napi_proj/npm').length).toBeGreaterThan(0);

    expect(() =>
      runNxCommand(`build napi_proj`, projectDirectory)
    ).not.toThrow();

    const files = listFiles('napi_proj');
    expect(files).toContain('.node');

    expect(() =>
      runNxCommand(
        `build napi_proj -- --target wasm32-wasip1-threads`,
        projectDirectory
      )
    ).not.toThrow();
    const files2 = listFiles('napi_proj');
    expect(files2).toContain('wasm32-wasi.node');
    expect(files2).toContain('wasi-worker.mjs');
    expect(files2).toContain('wasi-worker-browser.mjs');
  });
});
