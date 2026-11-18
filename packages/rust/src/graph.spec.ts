import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createDependencies, createNodesV2 } from './graph';

describe('Cargo workspace graph', () => {
  it('infers the same projects and edges through a workspace directory alias', async () => {
    const originalCwd = process.cwd();
    const root = mkdtempSync(join(tmpdir(), 'monodon-graph-'));
    const alias = join(root, 'editor');
    const workspace = join(root, 'workspace');
    try {
      for (const name of ['app', 'shared']) {
        const dir = join(workspace, 'libs', name);
        mkdirSync(join(dir, 'src'), { recursive: true });
        writeFileSync(join(dir, 'src/lib.rs'), '');
        const dependencies =
          name === 'app'
            ? '[dependencies]\nshared = { path = "../shared" }\n'
            : '';
        writeFileSync(
          join(dir, 'Cargo.toml'),
          `[package]\nname = "${name}"\nversion = "0.1.0"\n${dependencies}`
        );
      }
      writeFileSync(
        join(workspace, 'Cargo.toml'),
        '[workspace]\nmembers = ["libs/*"]\nresolver = "2"\n'
      );
      symlinkSync(workspace, alias, 'junction');
      process.chdir(workspace);
      const files = ['libs/app/Cargo.toml', 'libs/shared/Cargo.toml'];
      for (const workspaceRoot of [workspace, alias]) {
        const context = { workspaceRoot, nxJsonConfiguration: {} };
        const nodes = await createNodesV2[1](files, {}, context);
        expect(
          nodes.map(([, node]) => Object.keys(node.projects ?? {}))
        ).toEqual([['libs/app'], ['libs/shared']]);
        expect(nodes[0][1].externalNodes).toEqual({});
        const fileMap = { projectFileMap: {}, nonProjectFiles: [] };
        const edges = await createDependencies(
          {},
          {
            ...context,
            externalNodes: {},
            fileMap,
            filesToProcess: fileMap,
            projects: {
              app: { root: 'libs/app' },
              shared: { root: 'libs/shared' },
            },
          }
        );
        expect(edges).toEqual([
          {
            type: 'static',
            source: 'app',
            target: 'shared',
            sourceFile: files[0],
          },
        ]);
      }
    } finally {
      process.chdir(originalCwd);
      rmSync(root, { recursive: true, force: true });
    }
  });
});
