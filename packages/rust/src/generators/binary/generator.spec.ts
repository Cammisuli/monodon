import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';
import TOML from '@ltd/j-toml';
import generator from './generator';
import { RustBinaryGeneratorSchema } from './schema';

describe('rust generator', () => {
  let appTree: Tree;
  const options: RustBinaryGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });

  it('should create a Cargo.toml project', async () => {
    await generator(appTree, { ...options });
    const cargoToml = appTree.read('./apps/test/Cargo.toml')?.toString() ?? '';
    expect(cargoToml).toBeDefined();
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "package": Object {
          "edition": "2021",
          "name": "test",
          "version": "0.1.0",
        },
      }
    `);
  });

  it('should create a project with a specified edition', async () => {
    await generator(appTree, { ...options, edition: '2018' });
    const cargoToml = appTree.read('./apps/test/Cargo.toml')?.toString() ?? '';
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {},
        "package": Object {
          "edition": "2018",
          "name": "test",
          "version": "0.1.0",
        },
      }
    `);
  });
});
