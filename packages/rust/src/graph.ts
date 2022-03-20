import {
  ProjectGraph,
  ProjectGraphProcessorContext,
  ProjectGraphBuilder,
} from '@nrwl/devkit';
import { runCargoSync } from './utils/cargo';

export function processProjectGraph(
  graph: ProjectGraph,
  ctx: ProjectGraphProcessorContext
): ProjectGraph {
  const metadata = runCargoSync('metadata --format-version=1');
  // let metadata = cp.execSync('cargo metadata --format-version=1', {
  //   encoding: 'utf8',
  // });
  if (!metadata) {
    return graph;
  }

  const { packages, workspace_members } = JSON.parse(metadata);
  const builder = new ProjectGraphBuilder(graph);
  console.log(packages, workspace_members);
  // workspace_members
  //   .map((id) => packages.find((pkg) => pkg.id === id))
  //   .filter((pkg) => Object.keys(ctx.fileMap).includes(pkg.name))
  //   .forEach((pkg) => {
  //     pkg.dependencies.forEach((dep) => {
  //       let depName = dep.source == null ? dep.name : `cargo:${dep.name}`;

  //       if (!Object.keys(graph.nodes).includes(depName)) {
  //         let depPkg = packages.find((pkg) =>
  //           pkg.source.startsWith(dep.source)
  //         );
  //         if (!depPkg) {
  //           console.log(
  //             `${chalk.yellowBright.bold.inverse(
  //               ' WARN '
  //             )} Failed to find package for dependency:`
  //           );
  //           console.log(util.inspect(dep));

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
}
