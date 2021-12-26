import { Tree } from '@nrwl/devkit';
import TOML from '@ltd/j-toml';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import generator from './generator';

describe('init generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree);
    const cargoToml = appTree.read('./Cargo.toml')?.toString() ?? '';

    expect(appTree.exists('./Cargo.toml')).toBeTruthy();
    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "workspace": Object {
          "members": Array [
            "libs/*",
          ],
        },
      }
    `);
  });
});
