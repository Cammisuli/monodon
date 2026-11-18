import {
  createNodesFromFiles,
  normalizePath,
  type CreateDependencies,
  type CreateNodesContextV2,
  type CreateNodesV2,
  type ProjectConfiguration,
  type RawProjectGraphDependency,
} from '@nx/devkit';
import {
  DependencyType,
  ProjectGraphExternalNode,
} from 'nx/src/config/project-graph';
import { realpathSync } from 'fs';
import { dirname, relative } from 'path';
import type { Package } from './models/cargo-metadata';
import { cargoMetadata, isExternal } from './utils/cargo';

const cargoGlob = '*/**/Cargo.toml';

export const createNodesV2: CreateNodesV2 = [
  cargoGlob,
  async (configFilePaths, options, context) => {
    const result = processCargoMetadata(context);

    return await createNodesFromFiles(
      async (configFile) => {
        const projects = filterProject(result.projects, configFile);
        if (!projects) {
          return { projects: {}, externalNodes: {} };
        }

        return { projects, externalNodes: result.externalNodes };
      },
      configFilePaths,
      options,
      context
    );
  },
];

function processCargoMetadata(ctx: CreateNodesContextV2): {
  projects: Record<string, ProjectConfiguration>;
  externalNodes: Record<string, ProjectGraphExternalNode>;
} {
  const metadata = cargoMetadata();
  if (!metadata) {
    return { projects: {}, externalNodes: {} };
  }

  const { packages: cargoPackages } = metadata;

  const workspaceRoot = realpathSync(ctx.workspaceRoot);
  const externalNodes: Record<string, ProjectGraphExternalNode> = {};
  const projects: Record<string, ProjectConfiguration> = {};

  const cargoPackageMap = cargoPackages.reduce((acc, p) => {
    if (!acc.has(p.name)) {
      acc.set(p.name, p);
    }
    return acc;
  }, new Map<string, Package>());

  for (const pkg of cargoPackages) {
    if (!isExternal(pkg, workspaceRoot)) {
      const root = normalizePath(
        dirname(relative(workspaceRoot, pkg.manifest_path))
      );

      // TODO(cammisuli): provide defaults for non-project.json workspaces
      const targets: ProjectConfiguration['targets'] = {};

      // Apply nx-release-publish target for non-private projects
      const isPrivate = pkg.publish?.length === 0;
      if (!isPrivate) {
        targets['nx-release-publish'] = {
          dependsOn: ['^nx-release-publish'],
          executor: '@monodon/rust:release-publish',
          options: {},
        };
      }

      projects[root] = {
        root,
        name: pkg.name,
        targets,
        release: {
          version: {
            versionActions: '@monodon/rust/src/release/version-actions',
          },
        },
      };
    }
    for (const dep of pkg.dependencies) {
      if (isExternal(dep, workspaceRoot)) {
        const externalDepName = `cargo:${dep.name}`;
        if (!externalNodes?.[externalDepName]) {
          externalNodes[externalDepName] = {
            type: 'cargo' as any,
            name: externalDepName as any,
            data: {
              packageName: dep.name,
              version: cargoPackageMap.get(dep.name)?.version ?? '0.0.0',
            },
          };
        }
      }
    }
  }

  return {
    projects,
    externalNodes,
  };
}

function filterProject(
  projects: Record<string, ProjectConfiguration>,
  configFile: string
): Record<string, ProjectConfiguration> | null {
  const configDir = normalizePath(dirname(configFile));

  if (projects[configDir]) {
    return { [configDir]: projects[configDir] };
  }

  return null;
}

export const createDependencies: CreateDependencies = (
  _,
  { projects, externalNodes, workspaceRoot }
) => {
  const metadata = cargoMetadata();
  if (!metadata) {
    return [];
  }

  const { packages: cargoPackages } = metadata;

  const root = realpathSync(workspaceRoot);
  const dependencies: RawProjectGraphDependency[] = [];

  for (const pkg of cargoPackages) {
    if (projects[pkg.name]) {
      const sourceFile = normalizePath(relative(root, pkg.manifest_path));
      for (const deps of pkg.dependencies) {
        // if the dependency is listed in nx projects, it's not an external dependency
        if (projects[deps.name]) {
          dependencies.push(createDependency(pkg.name, deps.name, sourceFile));
        } else {
          const externalDepName = `cargo:${deps.name}`;
          if (externalDepName in (externalNodes ?? {})) {
            dependencies.push(
              createDependency(pkg.name, externalDepName, sourceFile)
            );
          }
        }
      }
    }
  }

  return dependencies;
};

function createDependency(
  source: string,
  target: string,
  sourceFile: string
): RawProjectGraphDependency {
  return { type: DependencyType.static, source, target, sourceFile };
}
