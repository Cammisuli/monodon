import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import TOML from '@ltd/j-toml';
import generator from './generator';
import { RustLibraryGeneratorSchema } from './schema';

describe('rust generator', () => {
  let appTree: Tree;
  const options: RustLibraryGeneratorSchema = { name: 'test-name' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test_name');
    expect(config).toBeDefined();
  });

  it('should create a Cargo.toml project', async () => {
    await generator(appTree, { ...options });
    const cargoToml = appTree.read('./test_name/Cargo.toml')?.toString() ?? '';
    expect(cargoToml.length).toBeGreaterThan(0);
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "package": Object {
          "edition": "2021",
          "name": "test_name",
          "version": "0.1.0",
        },
      }
    `);
  });

  it('should create a project with a specified edition', async () => {
    await generator(appTree, { ...options, edition: '2018' });
    const cargoToml = appTree.read('./test_name/Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "package": Object {
          "edition": "2018",
          "name": "test_name",
          "version": "0.1.0",
        },
      }
    `);
  });

  it('should add a project to the main Cargo.toml workspace members', async () => {
    await generator(appTree, options);
    const cargoToml = appTree.read('Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "profile": Object {
          "release": Object {
            "lto": true,
          },
        },
        "workspace": Object {
          "members": Array [
            "test_name",
          ],
          "resolver": "2",
        },
      }
    `);
  });

  it('should generate into a directory', async () => {
    await generator(appTree, { ...options, directory: 'test-dir' });
    const cargoToml =
      appTree.read('./test_dir/test_name/Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "package": Object {
          "edition": "2021",
          "name": "test_dir_test_name",
          "version": "0.1.0",
        },
      }
    `);
  });
});
