import {
  ProjectGraph,
  ProjectGraphProcessorContext,
  ProjectGraphBuilder,
  NxPlugin,
  ProjectTargetConfigurator,
  TargetConfiguration,
} from '@nrwl/devkit';
import { CargoMetadata, Package } from './models/cargo-metadata';
import { runCargoSync } from './utils/cargo';

type ProjectGraphProcessor = NonNullable<NxPlugin['processProjectGraph']>;
export const processProjectGraph: ProjectGraphProcessor = (
  graph: ProjectGraph,
  ctx: ProjectGraphProcessorContext
): ProjectGraph => {
  const metadata = runCargoSync('metadata --format-version=1');
  if (!metadata) {
    return graph;
  }

  const {
    packages: cargoPackages,
    workspace_members: cargoMembers,
    resolve: { nodes: cargoDeps },
  } = JSON.parse(metadata) as CargoMetadata;

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
          // TODO(cammisuli): figure out the file link. Look into the targets
          builder.addExplicitDependency(pkg.name, pkg.manifest_path, deps.name);
        } else {
          const externalDepName = `cargo:${deps.name}`;
          builder.addExternalNode({
            type: 'cargo' as any,
            name: externalDepName as any,
            data: {
              packageName: deps.name,
              version: cargoPackageMap.get(deps.name)?.version ?? '0.0.0',
            },
          });
          builder.addExplicitDependency(
            pkg.name,
            pkg.manifest_path,
            externalDepName
          );
        }
      }
    }
  }

  return builder.getUpdatedProjectGraph();
};

export const registerProjectTargets: ProjectTargetConfigurator = (
  file: string
): Record<string, TargetConfiguration> => {
  return {};
};
