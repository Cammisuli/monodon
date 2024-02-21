import { ProjectGraph, Tree } from '@nx/devkit';
import { CargoToml } from '../../../models/cargo.toml';
import { modifyCargoTable, stringifyCargoToml } from '../../../utils/toml';

interface ProjectAndPackageData {
  [projectName: string]: {
    projectRoot: string;
    packageName: string;
    version: string;
    cargoTomlPath: string;
    localDependencies: {
      projectName: string;
      dependencyCollection: 'dependencies' | 'dev-dependencies';
      version: string;
    }[];
  };
}

export function createWorkspaceWithPackageDependencies(
  tree: Tree,
  projectAndPackageData: ProjectAndPackageData
): ProjectGraph {
  const projectGraph: ProjectGraph = {
    nodes: {},
    dependencies: {},
  };

  for (const [projectName, data] of Object.entries(projectAndPackageData)) {
    const cargoToml: CargoToml = {
      package: {
        name: data.packageName,
        version: data.version,
      },
    };
    for (const dependency of data.localDependencies) {
      const dependencyPackageName =
        projectAndPackageData[dependency.projectName].packageName;
      modifyCargoTable(
        cargoToml,
        dependency.dependencyCollection,
        dependencyPackageName,
        {
          version: dependency.version,
        }
      );
    }
    // add the project and its nx project level dependencies to the projectGraph
    projectGraph.nodes[projectName] = {
      name: projectName,
      type: 'lib',
      data: {
        root: data.projectRoot,
      },
    };
    projectGraph.dependencies[projectName] = data.localDependencies.map(
      (dependency) => ({
        source: projectName,
        target: dependency.projectName,
        type: 'static',
      })
    );

    // create the Cargo.toml in the tree
    tree.write(data.cargoTomlPath, stringifyCargoToml(cargoToml));
  }

  return projectGraph;
}
