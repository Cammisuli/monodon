import {
  NxPlugin,
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  ProjectTargetConfigurator,
  TargetConfiguration,
  workspaceRoot,
} from '@nx/devkit';
import { Package } from './models/cargo-metadata';
import { cargoMetadata } from './utils/cargo';

type ProjectGraphProcessor = NonNullable<NxPlugin['processProjectGraph']>;
export const processProjectGraph: ProjectGraphProcessor = (
  graph: ProjectGraph,
  ctx: ProjectGraphProcessorContext
): ProjectGraph => {
  const metadata = cargoMetadata();
  if (!metadata) {
    return graph;
  }

  const { packages: cargoPackages } = metadata;

  const builder = new ProjectGraphBuilder(graph);

  const cargoPackageMap = cargoPackages.reduce((acc, p) => {
    if (!acc.has(p.name)) {
      acc.set(p.name, p);
    }
    return acc;
  }, new Map<string, Package>());

  for (const pkg of cargoPackages) {
    if (graph.nodes[pkg.name]) {
      for (const deps of pkg.dependencies) {
        // if the dependency is listed in nx projects, it's not an external dependency
        if (graph.nodes[deps.name]) {
          addExplicitDependency(pkg, builder, deps.name);
        } else {
          const externalDepName = `cargo:${deps.name}`;
          if (!graph.externalNodes?.[externalDepName]) {
            builder.addExternalNode({
              type: 'cargo' as any,
              name: externalDepName as any,
              data: {
                packageName: deps.name,
                version: cargoPackageMap.get(deps.name)?.version ?? '0.0.0',
              },
            });
          }
          addExplicitDependency(pkg, builder, externalDepName);
        }
      }
    }
  }

  return builder.getUpdatedProjectGraph();
};

// TODO(cammisuli): provide defaults for non-workspace.json workspaces
export const registerProjectTargets: ProjectTargetConfigurator = (
  file: string
): Record<string, TargetConfiguration> => {
  return {};
};

function addExplicitDependency(
  pkg: Package,
  builder: ProjectGraphBuilder,
  depName: string
) {
  const target =
    // pkg.targets.find((target) => target.name === pkg.name)?.src_path ??
    pkg.manifest_path.replace(/\\/g, '/');

  const workspaceRootClean = workspaceRoot.replace(/\\/g, '/');

  builder.addStaticDependency(
    pkg.name,
    depName,
    target.replace(`${workspaceRootClean}/`, '')
  );
}
