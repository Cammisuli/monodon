import { ProjectGraph } from '@nx/devkit';
import { execSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';

describe('rust', () => {
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

    execSync('cargo add itertools -p lib1', { cwd: projectDirectory });
    execSync(`cargo add lib1 --path ./lib1 -p hello_world`, {
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

function runNxCommand(command: string, projectDir: string) {
  execSync(`npx nx ${command}`, { cwd: projectDir, stdio: 'inherit' });
}

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}
