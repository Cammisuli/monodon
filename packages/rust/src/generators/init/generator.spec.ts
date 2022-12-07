import { Tree, updateJson } from '@nrwl/devkit';
import TOML from '@ltd/j-toml';
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { readNxJson } from '@nrwl/devkit/src/generators/project-configuration';

describe('init generator', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyV1Workspace();
  });

  it('should run successfully', async () => {
    await generator(appTree);
    const cargoToml = appTree.read('./Cargo.toml')?.toString() ?? '';

    expect(TOML.parse(cargoToml)).toMatchInlineSnapshot(`
      Object {
        "workspace": Object {
          "members": Array [],
        },
      }
    `);
  });

  describe('project graph plugin inclusion', () => {
    it('should include the project graph plugin', async () => {
      await generator(appTree);
      const nxJson = readNxJson(appTree);
      expect(nxJson?.plugins).toMatchInlineSnapshot(`
        Array [
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
        Array [
          "@nrwl/graph/plugin",
          "@monodon/rust",
        ]
      `);
    });
  });
});
