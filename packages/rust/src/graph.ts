import {
  ProjectGraph,
  ProjectGraphProcessorContext,
  ProjectGraphBuilder,
  NxPlugin,
  ProjectTargetConfigurator,
  TargetConfiguration,
} from '@nrwl/devkit';
import { CargoMetadata } from './models/cargo-metadata';
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

  console.log(cargoPackages, cargoMembers, cargoDeps);
  // workspace_members
  //   .map((id: string) => packages.find((pkg) => pkg.id === id))
  //   .filter((pkg) => Object.keys(ctx.fileMap).includes(pkg.name))
  //   .forEach((pkg) => {
  //     pkg.dependencies.forEach((dep) => {
  //       let depName = dep.source == null ? dep.name : `cargo:${dep.name}`;

  //       if (!Object.keys(graph.nodes).includes(depName)) {
  //         let depPkg = packages.find((pkg) =>
  //           pkg.source.startsWith(dep.source)
  //         );
  //         if (!depPkg) {
  //           return;
  //         }

  //         builder.addNode({
  //           name: depName,
  //           type: 'cargo' as any,
  //           data: {
  //             version: depPkg.version,
  //             packageName: depPkg.name,
  //             files: [],
  //           },
  //         });
  //       }

  //       builder.addImplicitDependency(pkg.name, depName);
  //     });
  //   });

  return builder.getUpdatedProjectGraph();
};

export const registerProjectTargets: ProjectTargetConfigurator = (
  file: string
): Record<string, TargetConfiguration> => {
  return {};
};
