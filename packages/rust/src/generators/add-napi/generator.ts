import {
  ProjectConfiguration,
  Tree,
  ensurePackage,
  formatFiles,
  generateFiles,
  getPackageManagerCommand,
  getProjects,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  updateJson,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import * as path from 'path';
import {
  modifyCargoTable,
  parseCargoTomlWithTree,
  stringifyCargoToml,
} from '../../utils/toml';
import { NAPI_VERSION } from '../../utils/versions';
import { AddNapiGeneratorSchema } from './schema';
import { runProcess } from '../../utils/run-process';

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
  await ensurePackage(tree, '@napi-rs/cli', NAPI_VERSION, { dev: true });
  updateGitIgnore(tree);
  updateTsConfig(tree, normalizedOptions);
  updateProjectConfiguration(tree, normalizedOptions.projectName, {
    ...project,
    targets: {
      ...project.targets,
      napi: {
        executor: '@monodon/rust:napi',
        options: {
          dist: normalizedOptions.projectRoot,
          jsFile: normalizedOptions.projectRoot + '/index.js',
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
  const packageName = npmScope
    ? `@${npmScope}/${names(projectName).fileName}`
    : projectName;
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

  tree.write(
    options.projectRoot + '/Cargo.toml',
    stringifyCargoToml(cargoToml)
  );
}

function updateGitIgnore(tree: Tree) {
  if (!tree.exists('.gitignore')) {
    return;
  }

  let gitIgnore = tree.read('.gitignore')?.toString() ?? '';
  gitIgnore += '\n*.node';
  tree.write('.gitignore', gitIgnore);
}

function updateTsConfig(tree: Tree, options: NormalizedSchema) {
  updateJson(tree, 'tsconfig.base.json', (json) => {
    const c = json.compilerOptions;
    c.paths = c.paths || {};

    if (c.paths[options.packageName]) {
      throw new Error(
        `You already have a library using the import path "${options.packageName}". Make sure to specify a unique one.`
      );
    }

    c.paths[options.packageName] = [
      joinPathFragments(options.projectRoot, 'index.d.ts'),
    ];

    return json;
  });
}
