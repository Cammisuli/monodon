import type { ProjectGraph, ProjectGraphProjectNode, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { ReleaseGroupWithName } from 'nx/src/command-line/release/config/filter-release-groups';
import type { FinalConfigForProject } from 'nx/src/command-line/release/utils/release-graph';
import RustVersionActions, { afterAllProjectsVersioned } from './version-actions';

// Minimal shapes are enough — we only exercise the methods that touch Cargo.toml
// directly, not the Nx release orchestrator.
const FINAL_CONFIG = {
  specifierSource: 'prompt',
  currentVersionResolver: 'disk',
  currentVersionResolverMetadata: {},
  fallbackCurrentVersionResolver: 'disk',
  versionPrefix: 'auto',
  preserveLocalDependencyProtocols: false,
  preserveMatchingDependencyRanges: false,
  adjustSemverBumpsForZeroMajorVersion: false,
  versionActionsOptions: {},
  manifestRootsToUpdate: [],
  dockerOptions: {},
} as unknown as FinalConfigForProject;

function makeProjectNode(name: string, root: string): ProjectGraphProjectNode {
  return {
    name,
    type: 'lib',
    data: { root },
  } as ProjectGraphProjectNode;
}

function makeReleaseGroup(): ReleaseGroupWithName {
  return { name: '__default__' } as ReleaseGroupWithName;
}

async function makeActions(
  tree: Tree,
  projectName: string,
  root: string
): Promise<RustVersionActions> {
  const actions = new RustVersionActions(
    makeReleaseGroup(),
    makeProjectNode(projectName, root),
    { ...FINAL_CONFIG, manifestRootsToUpdate: [] } as FinalConfigForProject
  );
  await actions.init(tree);
  return actions;
}

function writeCargoToml(tree: Tree, root: string, contents: string): void {
  tree.write(`${root}/Cargo.toml`, contents);
}

describe('RustVersionActions', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('readCurrentVersionFromSourceManifest', () => {
    it('reads [package].version from Cargo.toml', async () => {
      writeCargoToml(
        tree,
        'libs/my-lib',
        '[package]\nname = "my-lib"\nversion = "1.2.3"\n'
      );
      const actions = await makeActions(tree, 'my-lib', 'libs/my-lib');

      const result = await actions.readCurrentVersionFromSourceManifest(tree);

      expect(result).toEqual({
        currentVersion: '1.2.3',
        manifestPath: 'libs/my-lib/Cargo.toml',
      });
    });

    it('throws when Cargo.toml is missing', async () => {
      const actions = await makeActions(tree, 'missing', 'libs/missing');
      await expect(
        actions.readCurrentVersionFromSourceManifest(tree)
      ).rejects.toThrow(/Unable to read Cargo\.toml/);
    });

    it('throws when the version field is absent', async () => {
      writeCargoToml(tree, 'libs/no-version', '[package]\nname = "no-version"\n');
      const actions = await makeActions(tree, 'no-version', 'libs/no-version');
      await expect(
        actions.readCurrentVersionFromSourceManifest(tree)
      ).rejects.toThrow(/current version/);
    });
  });

  describe('readCurrentVersionOfDependency', () => {
    const projectGraph = {} as ProjectGraph;

    it('finds a string-form entry in [dependencies]', async () => {
      writeCargoToml(
        tree,
        'libs/consumer',
        '[package]\nname = "consumer"\nversion = "0.0.1"\n\n[dependencies]\nmy-lib = "^1.2.3"\n'
      );
      const actions = await makeActions(tree, 'consumer', 'libs/consumer');

      const result = await actions.readCurrentVersionOfDependency(
        tree,
        projectGraph,
        'my-lib'
      );

      expect(result).toEqual({
        currentVersion: '^1.2.3',
        dependencyCollection: 'dependencies',
      });
    });

    it('finds an object-form entry in [dev-dependencies]', async () => {
      writeCargoToml(
        tree,
        'libs/consumer',
        '[package]\nname = "consumer"\nversion = "0.0.1"\n\n[dev-dependencies]\nmy-lib = { version = "~1.0.0", features = ["a"] }\n'
      );
      const actions = await makeActions(tree, 'consumer', 'libs/consumer');

      const result = await actions.readCurrentVersionOfDependency(
        tree,
        projectGraph,
        'my-lib'
      );

      expect(result).toEqual({
        currentVersion: '~1.0.0',
        dependencyCollection: 'dev-dependencies',
      });
    });

    it('returns nulls when the dependency is not declared', async () => {
      writeCargoToml(
        tree,
        'libs/consumer',
        '[package]\nname = "consumer"\nversion = "0.0.1"\n'
      );
      const actions = await makeActions(tree, 'consumer', 'libs/consumer');

      const result = await actions.readCurrentVersionOfDependency(
        tree,
        projectGraph,
        'my-lib'
      );

      expect(result).toEqual({
        currentVersion: null,
        dependencyCollection: null,
      });
    });
  });

  describe('updateProjectVersion', () => {
    it('writes the new version back to Cargo.toml', async () => {
      writeCargoToml(
        tree,
        'libs/my-lib',
        '[package]\nname = "my-lib"\nversion = "1.0.0"\n'
      );
      const actions = await makeActions(tree, 'my-lib', 'libs/my-lib');

      const logs = await actions.updateProjectVersion(tree, '2.0.0');

      expect(tree.read('libs/my-lib/Cargo.toml', 'utf-8')).toMatch(
        /version = ['"]2\.0\.0['"]/
      );
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('2.0.0');
      expect(logs[0]).toContain('libs/my-lib/Cargo.toml');
    });
  });

  describe('updateProjectDependencies', () => {
    const projectGraph = {} as ProjectGraph;

    async function setupConsumer(depsBlock: string): Promise<RustVersionActions> {
      writeCargoToml(
        tree,
        'libs/consumer',
        `[package]\nname = "consumer"\nversion = "0.0.1"\n\n${depsBlock}`
      );
      return makeActions(tree, 'consumer', 'libs/consumer');
    }

    function readConsumer(): string {
      return tree.read('libs/consumer/Cargo.toml', 'utf-8') ?? '';
    }

    it.each([
      ['^', '[dependencies]\nmy-lib = "^1.0.0"\n'],
      ['~', '[dependencies]\nmy-lib = "~1.0.0"\n'],
      ['=', '[dependencies]\nmy-lib = "=1.0.0"\n'],
    ])('preserves an explicit %s prefix', async (prefix, depsBlock) => {
      const actions = await setupConsumer(depsBlock);

      await actions.updateProjectDependencies(tree, projectGraph, {
        'my-lib': '2.0.0',
      });

      expect(readConsumer()).toMatch(
        new RegExp(`my-lib = ['"]\\${prefix}2\\.0\\.0['"]`)
      );
    });

    it('keeps a dependency declared without a prefix prefix-less', async () => {
      const actions = await setupConsumer(
        '[dependencies]\nmy-lib = "1.0.0"\n'
      );

      await actions.updateProjectDependencies(tree, projectGraph, {
        'my-lib': '2.0.0',
      });

      expect(readConsumer()).toMatch(/my-lib = ['"]2\.0\.0['"]/);
    });

    it('updates an object-form dependency while keeping its other fields', async () => {
      const actions = await setupConsumer(
        '[dependencies]\nmy-lib = { version = "^1.0.0", features = ["a", "b"] }\n'
      );

      await actions.updateProjectDependencies(tree, projectGraph, {
        'my-lib': '2.0.0',
      });

      const contents = readConsumer();
      expect(contents).toMatch(/version = ['"]\^2\.0\.0['"]/);
      expect(contents).toMatch(/features = \[\s*['"]a['"]\s*,\s*['"]b['"]\s*\]/);
    });

    it('updates a dependency declared in [dev-dependencies]', async () => {
      const actions = await setupConsumer(
        '[dev-dependencies]\nmy-lib = "^1.0.0"\n'
      );

      await actions.updateProjectDependencies(tree, projectGraph, {
        'my-lib': '2.0.0',
      });

      expect(readConsumer()).toMatch(/my-lib = ['"]\^2\.0\.0['"]/);
    });

    it('returns no log messages when nothing needs updating', async () => {
      writeCargoToml(
        tree,
        'libs/consumer',
        '[package]\nname = "consumer"\nversion = "0.0.1"\n'
      );
      const actions = await makeActions(tree, 'consumer', 'libs/consumer');

      const logs = await actions.updateProjectDependencies(
        tree,
        projectGraph,
        {}
      );

      expect(logs).toEqual([]);
    });
  });

  describe('afterAllProjectsVersioned', () => {
    it('no-ops during a dry run', async () => {
      const result = await afterAllProjectsVersioned('/tmp', { dryRun: true });
      expect(result).toEqual({ changedFiles: [], deletedFiles: [] });
    });

    it('no-ops when skipLockFileUpdate is set', async () => {
      const result = await afterAllProjectsVersioned('/tmp', {
        rootVersionActionsOptions: { skipLockFileUpdate: true },
      });
      expect(result).toEqual({ changedFiles: [], deletedFiles: [] });
    });
  });
});
