import TOML from '@ltd/j-toml';
import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';

function readNxJson(tree: Tree) {
  return readJson(tree, 'nx.json');
}

describe('init generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree);
    const cargoToml = appTree.read('./Cargo.toml')?.toString() ?? '';

    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      {
        "profile": {
          "release": {
            "lto": true,
          },
        },
        "workspace": {
          "members": [],
        },
      }
    `);
  });

  describe('project graph plugin inclusion', () => {
    it('should include the project graph plugin', async () => {
      await generator(appTree);
      const nxJson = readNxJson(appTree);
      expect(nxJson?.plugins).toMatchInlineSnapshot(`
        [
          "@monodon/rust",
        ]
      `);
    });

    it('should not remove previous plugins', async () => {
      updateJson(appTree, 'nx.json', (json) => {
        json.plugins = ['@nrwl/graph/plugin'];
        return json;
      });
      await generator(appTree);
      const nxJson = readNxJson(appTree);
      expect(nxJson?.plugins).toMatchInlineSnapshot(`
        [
          "@nrwl/graph/plugin",
          "@monodon/rust",
        ]
      `);
    });
  });
});
