import {
  crateRoot,
  createTestProject,
  installPlugin,
  runNxCommand,
} from './utils';
import { rmSync } from 'fs';
import { join } from 'path';
import { listFiles, readFile, updateFile } from '@nx/plugin/testing';

describe('napi', () => {
  let projectDirectory: string;
  beforeAll(() => {
    projectDirectory = createTestProject('napi');

    installPlugin(projectDirectory);
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

    // Crates are generated under a layout-dependent base dir (e.g. packages/).
    // The @nx/plugin/testing helpers resolve paths relative to the tmp proj
    // root, so prefix the crate root with the workspace folder name.
    const napiProjDir = join(
      'test-project-napi',
      crateRoot(projectDirectory, 'napi_proj')
    );

    const projectConfigPath = join(napiProjDir, 'project.json');
    const projectFile = JSON.parse(readFile(projectConfigPath));
    projectFile['targets']['build']['options'] = {
      ...projectFile['targets']['build']['options'],
      jsFile: 'native.js',
      dts: 'native.d.ts',
    };
    updateFile(projectConfigPath, JSON.stringify(projectFile, null, 2));

    expect(listFiles(join(napiProjDir, 'npm')).length).toBeGreaterThan(0);

    expect(() =>
      runNxCommand(`build napi_proj`, projectDirectory)
    ).not.toThrow();

    const files = listFiles(napiProjDir);
    expect(files.some((file) => file.endsWith('native.js'))).toBeTruthy();
    expect(files.some((file) => file.endsWith('native.d.ts'))).toBeTruthy();
    expect(files.some((file) => file.endsWith('.node'))).toBeTruthy();

    expect(() =>
      runNxCommand(
        `build napi_proj -- --target wasm32-wasip1-threads`,
        projectDirectory
      )
    ).not.toThrow();
    const files2 = listFiles(napiProjDir);
    expect(
      files2.some((file) => file.endsWith('wasm32-wasi.wasm'))
    ).toBeTruthy();
    expect(files2).toContain('wasi-worker.mjs');
    expect(files2).toContain('wasi-worker-browser.mjs');
  });
});
