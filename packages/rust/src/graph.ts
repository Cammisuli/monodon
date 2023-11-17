import {
  CreateDependencies,
  CreateNodes,
  NxPlugin,
  ProjectConfiguration,
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  ProjectTargetConfigurator,
  RawProjectGraphDependency,
  TargetConfiguration,
  workspaceRoot,
} from '@nx/devkit';
import { Package } from './models/cargo-metadata';
import { cargoMetadata } from './utils/cargo';
import {
  DependencyType,
  ProjectGraphExternalNode,
  ProjectGraphProcessor,
} from 'nx/src/config/project-graph';
import { isExternal } from 'util/types';
import { dirname, relative } from 'path';

export const createNodes: CreateNodes = [
  '*/**/Cargo.toml',
  (projectFile, opts, ctx) => {
    const metadata = cargoMetadata();
    if (!metadata) {
      return {};
    }

    const { packages: cargoPackages } = metadata;

    const externalNodes: Record<string, ProjectGraphExternalNode> = {};
    const projects: Record<string, ProjectConfiguration> = {};

    const cargoPackageMap = cargoPackages.reduce((acc, p) => {
      if (!acc.has(p.name)) {
        acc.set(p.name, p);
      }
      return acc;
    }, new Map<string, Package>());

    for (const pkg of cargoPackages) {
      if (!isExternal(pkg)) {
        const root = dirname(relative(ctx.workspaceRoot, pkg.manifest_path));
        projects[root] = {
          root,
          name: pkg.name,
          // TODO(cammisuli): provide defaults for non-project.json workspaces
          targets: {},
        };
      }
      for (const dep of pkg.dependencies) {
        if (isExternal(dep)) {
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
      externalNodes,
    };
  },
];

export const createDependencies: CreateDependencies = (
  _,
  { projects, externalNodes }
) => {
  const metadata = cargoMetadata();
  if (!metadata) {
    return [];
  }

  const { packages: cargoPackages } = metadata;

  const dependencies: RawProjectGraphDependency[] = [];

  for (const pkg of cargoPackages) {
    if (projects[pkg.name]) {
      for (const deps of pkg.dependencies) {
        // if the dependency is listed in nx projects, it's not an external dependency
        if (projects[deps.name]) {
          dependencies.push(getStaticDependency(pkg, deps.name));
        } else {
          const externalDepName = `cargo:${deps.name}`;
          if (externalDepName in (externalNodes ?? {})) {
            dependencies.push({
              source: pkg.name,
              target: externalDepName,
              type: DependencyType.static,
            });
          }
        }
      }
    }
  }

  return dependencies;
};

function getStaticDependency(
  pkg: Package,
  depName: string
): RawProjectGraphDependency {
  const target =
    // pkg.targets.find((target) => target.name === pkg.name)?.src_path ??
    pkg.manifest_path.replace(/\\/g, '/');

  const workspaceRootClean = workspaceRoot.replace(/\\/g, '/');

  return {
    type: DependencyType.static,
    source: pkg.name,
    target: depName,
    sourceFile: target.replace(`${workspaceRootClean}/`, ''),
  };
}
