import { ProjectGraph, Tree } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { AfterAllProjectsVersioned, VersionActions } from 'nx/release';
import {
  modifyCargoTable,
  parseCargoToml,
  stringifyCargoToml,
} from '../utils/toml';

type DependencyCollection = 'dependencies' | 'dev-dependencies';

const DEPENDENCY_COLLECTIONS: DependencyCollection[] = [
  'dependencies',
  'dev-dependencies',
];

export const afterAllProjectsVersioned: AfterAllProjectsVersioned = async (
  cwd,
  { dryRun, rootVersionActionsOptions }
) => {
  if (dryRun || rootVersionActionsOptions?.skipLockFileUpdate) {
    return { changedFiles: [], deletedFiles: [] };
  }
  try {
    execSync('cargo update --workspace', {
      cwd,
      maxBuffer: 1024 * 1024 * 1024,
      stdio: 'pipe',
    });
  } catch {
    // cargo update failures are non-fatal for the release flow; the user can re-run manually
    return { changedFiles: [], deletedFiles: [] };
  }
  return {
    changedFiles: hasGitDiff(cwd, 'Cargo.lock') ? ['Cargo.lock'] : [],
    deletedFiles: [],
  };
};

export default class RustVersionActions extends VersionActions {
  validManifestFilenames = ['Cargo.toml'];

  async readCurrentVersionFromSourceManifest(
    tree: Tree
  ): Promise<{ currentVersion: string; manifestPath: string }> {
    const manifestPath = `${this.projectGraphNode.data.root}/Cargo.toml`;
    const contents = tree.read(manifestPath)?.toString('utf-8');
    if (!contents) {
      throw new Error(
        `Unable to read Cargo.toml for project "${this.projectGraphNode.name}" at ${manifestPath}`
      );
    }
    const parsed = parseCargoToml(contents);
    const currentVersion = parsed.package?.version;
    if (typeof currentVersion !== 'string') {
      throw new Error(
        `Unable to determine the current version for project "${this.projectGraphNode.name}" from ${manifestPath}. Ensure [package].version is set.`
      );
    }
    return { manifestPath, currentVersion };
  }

  async readCurrentVersionFromRegistry(): Promise<{
    currentVersion: string | null;
    logText: string;
  } | null> {
    return null;
  }

  async readCurrentVersionOfDependency(
    tree: Tree,
    _projectGraph: ProjectGraph,
    dependencyProjectName: string
  ): Promise<{
    currentVersion: string | null;
    dependencyCollection: string | null;
  }> {
    const manifestPath = `${this.projectGraphNode.data.root}/Cargo.toml`;
    const contents = tree.read(manifestPath)?.toString('utf-8');
    if (!contents) {
      return { currentVersion: null, dependencyCollection: null };
    }
    const parsed = parseCargoToml(contents);
    for (const collection of DEPENDENCY_COLLECTIONS) {
      const entry = parsed[collection]?.[dependencyProjectName];
      if (entry === undefined) continue;
      const version = typeof entry === 'string' ? entry : entry.version ?? null;
      return { currentVersion: version, dependencyCollection: collection };
    }
    return { currentVersion: null, dependencyCollection: null };
  }

  async updateProjectVersion(
    tree: Tree,
    newVersion: string
  ): Promise<string[]> {
    const logMessages: string[] = [];
    for (const manifest of this.manifestsToUpdate) {
      const contents = tree.read(manifest.manifestPath)?.toString('utf-8');
      if (!contents) continue;
      const parsed = parseCargoToml(contents);
      parsed.package.version = newVersion;
      tree.write(manifest.manifestPath, stringifyCargoToml(parsed));
      logMessages.push(
        `✍️  New version ${newVersion} written to manifest: ${manifest.manifestPath}`
      );
    }
    return logMessages;
  }

  async updateProjectDependencies(
    tree: Tree,
    _projectGraph: ProjectGraph,
    dependenciesToUpdate: Record<string, string>
  ): Promise<string[]> {
    const entries = Object.entries(dependenciesToUpdate);
    if (entries.length === 0) return [];

    const logMessages: string[] = [];
    for (const manifest of this.manifestsToUpdate) {
      const contents = tree.read(manifest.manifestPath)?.toString('utf-8');
      if (!contents) continue;
      const parsed = parseCargoToml(contents);

      let updatedCount = 0;
      for (const [depName, newVersion] of entries) {
        for (const collection of DEPENDENCY_COLLECTIONS) {
          const existing = parsed[collection]?.[depName];
          if (existing === undefined) continue;

          const versionPrefix = inferVersionPrefix(existing);
          const newVersionWithPrefix = `${versionPrefix}${newVersion}`;

          const updated =
            typeof existing === 'string'
              ? newVersionWithPrefix
              : { ...existing, version: newVersionWithPrefix };

          modifyCargoTable(parsed, collection, depName, updated);
          updatedCount++;
          break;
        }
      }

      if (updatedCount > 0) {
        tree.write(manifest.manifestPath, stringifyCargoToml(parsed));
        const depText = updatedCount === 1 ? 'dependency' : 'dependencies';
        logMessages.push(
          `✍️  Updated ${updatedCount} ${depText} in manifest: ${manifest.manifestPath}`
        );
      }
    }
    return logMessages;
  }
}

// Cargo defaults to ^ when no prefix is given. To preserve the user's declared
// form, treat an implicit-^ declaration ("1.2.3") differently from an explicit
// one ("^1.2.3") so we don't add a `^` they didn't write.
function inferVersionPrefix(
  existing: string | { version?: string }
): '' | '~' | '^' | '=' {
  const version =
    typeof existing === 'string' ? existing : existing.version ?? '';
  const match = version.match(/^[~^=]/);
  return (match?.[0] as '~' | '^' | '=') ?? '';
}

function hasGitDiff(cwd: string, filePath: string): boolean {
  try {
    const result = execSync(`git diff --name-only "${filePath}"`, {
      cwd,
    }).toString();
    return result.trim() === filePath;
  } catch {
    return false;
  }
}
