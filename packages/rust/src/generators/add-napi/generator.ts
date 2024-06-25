import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  getProjects,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readJson,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import {
  modifyCargoTable,
  parseCargoTomlWithTree,
  stringifyCargoToml,
} from '../../utils/toml';
import {
  NAPI_EMNAPI,
  NAPI_VERSION,
  NAPI_WASM_RUNTIME,
} from '../../utils/versions';
import { AddNapiGeneratorSchema } from './schema';

interface NormalizedSchema extends AddNapiGeneratorSchema {
  projectName: string;
  projectRoot: string;
  packageName: string;
  offsetFromRoot: string;
  dryRun?: boolean;
}

export default async function (tree: Tree, options: AddNapiGeneratorSchema) {
  const project = getProjects(tree).get(options.project);
  if (!project) {
    throw 'Project not found';
  }

  const normalizedOptions = normalizeOptions(tree, options, project);
  addFiles(tree, normalizedOptions);
  updateCargo(tree, normalizedOptions);
  const addPackage = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@napi-rs/cli': NAPI_VERSION,
      '@napi-rs/wasm-runtime': NAPI_WASM_RUNTIME,
      emnapi: NAPI_EMNAPI,
    }
  );
  updateGitIgnore(tree);
  updateTsConfig(tree, normalizedOptions);
  updateProjectConfiguration(tree, normalizedOptions.projectName, {
    ...project,
    targets: {
      ...project.targets,
      build: {
        cache: true,
        outputs: [`{workspaceRoot}/${normalizedOptions.projectRoot}`],
        executor: '@monodon/rust:napi',
        options: {
          dist: normalizedOptions.projectRoot,
          jsFile: 'index.js',
        },
        configurations: {
          production: {
            dist: `dist/${normalizedOptions.projectName}`,
            release: true,
          },
        },
      },
    },
  });
  await formatFiles(tree);

  return async () => {
    await addPackage();
    const { NapiCli } = await import('@napi-rs/cli');
    const napi = new NapiCli();

    await napi.createNpmDirs({
      npmDir: `${normalizedOptions.projectRoot}/npm`,
      packageJsonPath: `${normalizedOptions.projectRoot}/package.json`,
      dryRun: normalizedOptions.dryRun,
    });
  };
}

function normalizeOptions(
  tree: Tree,
  options: AddNapiGeneratorSchema,
  project: ProjectConfiguration
): NormalizedSchema {
  const npmScope = getNpmScope(tree);
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

/**
 * Read the npm scope that a workspace should use by default
 */
function getNpmScope(tree: Tree) {
  const { name } = tree.exists('package.json')
    ? readJson(tree, 'package.json')
    : { name: null };
  if (name?.startsWith('@')) {
    return name.split('/')[0].substring(1);
  }
}

function getRootTsConfigPathInTree(tree: Tree) {
  for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
    if (tree.exists(path)) {
      return path;
    }
  }
  return 'tsconfig.base.json';
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
  if (!tree.exists('tsconfig.base.json')) {
    return;
  }

  const tsConfig = getRootTsConfigPathInTree(tree);

  if (!tsConfig) {
    return;
  }

  updateJson(tree, tsConfig, (json) => {
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
