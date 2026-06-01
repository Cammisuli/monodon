import { ProjectGraph } from '@nx/devkit';
import { execSync } from 'child_process';
import { readFileSync, rmSync } from 'fs';
import { join } from 'path';
import {
  crateRoot,
  createTestProject,
  installPlugin,
  runNxCommand,
} from './utils';

describe('rust', () => {
  let projectDirectory: string;

  beforeAll(() => {
    projectDirectory = createTestProject();

    installPlugin(projectDirectory);
  });

  afterAll(() => {
    // Cleanup the test project
    rmSync(projectDirectory, {
      recursive: true,
      force: true,
    });
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls @monodon/rust', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });

  it('should generate a cargo project and update the project graph', () => {
    runNxCommand(`generate @monodon/rust:bin hello-world`, projectDirectory);
    runNxCommand(`generate @monodon/rust:lib lib1`, projectDirectory);

    // Crates are generated under a layout-dependent base dir (e.g. packages/),
    // so resolve lib1's actual path rather than assuming ./lib1.
    const lib1Root = crateRoot(projectDirectory, 'lib1');
    execSync('cargo add itertools -p lib1', { cwd: projectDirectory });
    execSync(`cargo add lib1 --path ${lib1Root} -p hello_world`, {
      cwd: projectDirectory,
    });
    expect(() =>
      runNxCommand(`build hello_world`, projectDirectory)
    ).not.toThrow();

    const projectGraph: ProjectGraph = JSON.parse(
      readFileSync(
        join(projectDirectory, '.nx/workspace-data/project-graph.json')
      ).toString()
    );

    expect(projectGraph.dependencies['hello_world']).toMatchInlineSnapshot(`
      Array [
        Object {
          "source": "hello_world",
          "target": "lib1",
          "type": "static",
        },
      ]
    `);
    expect(projectGraph.dependencies['lib1']).toMatchInlineSnapshot(`
      Array [
        Object {
          "source": "lib1",
          "target": "cargo:itertools",
          "type": "static",
        },
      ]
    `);
  });
});
