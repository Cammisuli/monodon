import {
  ProjectConfiguration,
  Tree,
  ensurePackage,
  formatFiles,
  generateFiles,
  getProjects,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import * as path from 'path';
import {
  modifyCargoNestedTable,
  modifyCargoTable,
  parseCargoTomlWithTree,
  stringifyCargoToml,
} from '../../utils/toml';
import { AddNapiGeneratorSchema } from './schema';
import { NAPI_VERSION } from '../../utils/versions';

interface NormalizedSchema extends AddNapiGeneratorSchema {
  projectName: string;
  projectRoot: string;
  packageName: string;
  offsetFromRoot: string;
}

export default async function (tree: Tree, options: AddNapiGeneratorSchema) {
  const project = getProjects(tree).get(options.project);
  if (!project) {
    throw 'Project not found';
  }

  const normalizedOptions = normalizeOptions(tree, options, project);
  addFiles(tree, normalizedOptions);
  updateCargo(tree, normalizedOptions);
  await ensurePackage(tree, '@napi-api/cli', NAPI_VERSION, { dev: true });
  updateProjectConfiguration(tree, normalizedOptions.projectName, {
    ...project,
    targets: {
      ...project.targets,
      napi: {
        executor: '@monodon/rust:napi',
        options: {
          dist:
            normalizedOptions.offsetFromRoot +
            '/dist/' +
            normalizedOptions.projectName,
          jsFile: 'index.js',
        },
        configurations: {
          production: {
            release: true,
          },
        },
      },
    },
  });
  await formatFiles(tree);
}

function normalizeOptions(
  tree: Tree,
  options: AddNapiGeneratorSchema,
  project: ProjectConfiguration
): NormalizedSchema {
  const { npmScope } = getWorkspaceLayout(tree);
  const projectName = project.name ?? options.project;
  const packageName = npmScope ? `@${npmScope}/${projectName}` : projectName;
  return {
    ...options,
    projectName,
    projectRoot: project.root,
    packageName,
    offsetFromRoot: offsetFromRoot(project.root),
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.project),
    // offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

function updateCargo(tree: Tree, options: NormalizedSchema) {
  const cargoToml = parseCargoTomlWithTree(
    tree,
    options.projectRoot,
    options.projectName
  );

  modifyCargoTable(cargoToml, 'lib', 'crate-type', ['cdylib']);
  modifyCargoTable(cargoToml, 'dependencies', 'napi', {
    version: '2.10.2',
    'default-features': false,
    features: ['napi4'],
  });
  modifyCargoTable(cargoToml, 'dependencies', 'napi-derive', '2.9.3');
  modifyCargoTable(cargoToml, 'build-dependencies', 'napi-build', '2.0.1');

  // [profile.release]
  // lto = true
  modifyCargoNestedTable(cargoToml, 'profile', 'release', { lto: true });

  tree.write(
    options.projectRoot + '/Cargo.toml',
    stringifyCargoToml(cargoToml)
  );
}
