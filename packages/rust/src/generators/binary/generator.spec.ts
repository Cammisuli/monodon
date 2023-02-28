import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import TOML from '@ltd/j-toml';
import generator from './generator';
import { RustBinaryGeneratorSchema } from './schema';

describe('rust generator', () => {
  let appTree: Tree;
  const options: RustBinaryGeneratorSchema = { name: 'test-name' };

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
      {
        "dependencies": {},
        "package": {
          "edition": "2021",
          "name": "test_name",
          "version": "0.1.0",
        },
      }
    `);
  });

  it('should create a project with a specified edition', async () => {
    await generator(appTree, { ...options, edition: '2018' });
    const cargoToml =
      appTree.read('./apps/test_name/Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`{}`);
  });

  it('should add a project to the main Cargo.toml workspace members', async () => {
    await generator(appTree, options);
    const cargoToml = appTree.read('Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      {
        "profile": {
          "release": {
            "lto": true,
          },
        },
        "workspace": {
          "members": [
            "./test_name",
          ],
        },
      }
    `);
  });

  it('should generate into a directory', async () => {
    await generator(appTree, { ...options, directory: 'test-dir' });
    const cargoToml =
      appTree.read('./apps/test_dir/test_name/Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`{}`);
  });
});
