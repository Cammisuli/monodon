import TOML from '@ltd/j-toml';
import {
  Tree,
  formatFiles,
  generateFiles,
  offsetFromRoot,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { addWasmPackExecutor } from '../../utils/add-executors';
import {
  modifyCargoNestedTable,
  modifyCargoTable,
  parseCargoTomlWithTree,
  stringifyCargoToml,
} from '../../utils/toml';
import { AddWasmGeneratorSchema } from './schema';

interface NormalizedSchema extends AddWasmGeneratorSchema {
  projectName: string;
  projectRoot: string;
}

function normalizeOptions(
  tree: Tree,
  options: AddWasmGeneratorSchema
): NormalizedSchema {
  const project = readProjectConfiguration(tree, options.project);

  const projectName = project.name ?? options.project ?? '';
  const projectRoot = project.root;

  return {
    ...options,
    projectName,
    projectRoot,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  if (!options.generateDefaultLib) {
    return;
  }

  const templateOptions = {
    ...options,
    offsetFromRoot: offsetFromRoot(options.projectRoot),
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

  modifyCargoTable(cargoToml, 'lib', 'crate-type', ['cdylib', 'rlib']);

  modifyCargoTable(cargoToml, 'feature', 'default', [
    'console_error_panic_hook',
  ]);

  modifyCargoTable(cargoToml, 'dependencies', 'wasm-bindgen', '0.2');

  if (options.useWebSys) {
    modifyCargoTable(cargoToml, 'dependencies', 'js-sys', '0.3');
    modifyCargoTable(cargoToml, 'dependencies', 'web-sys', {
      version: '0.3',
      features: ['Window'],
    });
  }

  modifyCargoTable(cargoToml, 'dependencies', 'console_error_panic_hook', {
    version: '0.1.6',
    optional: true,
  });

  modifyCargoTable(cargoToml, 'dependencies', 'wee_alloc', {
    version: '0.4',
    optional: true,
  });

  modifyCargoTable(cargoToml, 'dev-dependencies', 'wasm-bindgen-test', '0.3');

  modifyCargoNestedTable(cargoToml, 'profile', 'release', {
    [TOML.commentFor('opt-level')]:
      'Tell `rustc` to optimize for small code size.',
    'opt-level': 's',
  });

  tree.write(
    options.projectRoot + '/Cargo.toml',
    stringifyCargoToml(cargoToml)
  );
}

function updateBuildTarget(tree: Tree, options: NormalizedSchema) {
  const configuration = readProjectConfiguration(tree, options.projectName);
  configuration.targets ??= {};
  configuration.targets.build = addWasmPackExecutor({
    'target-dir': `dist/target/wasm/${options.projectName}`,
    release: false,
    target: 'bundler',
  });
  updateProjectConfiguration(tree, options.projectName, configuration);
}

export default async function wasmGenerator(
  tree: Tree,
  options: AddWasmGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);
  updateCargo(tree, normalizedOptions);
  updateBuildTarget(tree, normalizedOptions);
  await formatFiles(tree);
}
