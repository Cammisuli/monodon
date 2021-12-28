import { Tree, updateJson } from '@nrwl/devkit';
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

    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "workspace": Object {
          "members": Array [
            "libs/*",
            "apps/*",
          ],
        },
      }
    `);
  });

  it('should only have one member in the array if the appsDir and libsDir are the same', async () => {
    updateJson(appTree, './nx.json', (json) => ({
      ...json,
      workspaceLayout: { appsDir: 'packages', libsDir: 'packages' },
    }));

    await generator(appTree);
    const cargoToml = appTree.read('./Cargo.toml')?.toString() ?? '';

    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "workspace": Object {
          "members": Array [
            "packages/*",
          ],
        },
      }
    `);
  });
});
