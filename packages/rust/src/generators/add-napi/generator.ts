import TOML from '@ltd/j-toml';
import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getProjects,
  getWorkspaceLayout,
  logger,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { AddNapiGeneratorSchema } from './schema';
import {
  modifyCargoNestedTable,
  modifyCargoTable,
  parseCargoTomlWithTree,
  stringifyCargoToml,
} from '../../utils/toml';

interface NormalizedSchema extends AddNapiGeneratorSchema {
  projectName: string;
  projectRoot: string;
  packageName: string;
}

export default async function (tree: Tree, options: AddNapiGeneratorSchema) {
  const project = getProjects(tree).get(options.project);
  if (!project) {
    throw 'Project not found';
  }

  const normalizedOptions = normalizeOptions(tree, options, project);
  addFiles(tree, normalizedOptions);
  updateCargo(tree, normalizedOptions);
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
