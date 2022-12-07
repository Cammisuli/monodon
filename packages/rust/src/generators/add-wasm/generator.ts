import {
  formatFiles,
  generateFiles,
  logger,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import * as path from 'path';
import { parseCargoToml, stringifyCargoToml } from '../../utils/toml';
import { AddWasmGeneratorSchema } from './schema';
import TOML from '@ltd/j-toml';
import { addWasmPackExecutor } from '../../utils/add-executors';

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
  const cargoTomlString = tree
    .read(options.projectRoot + '/Cargo.toml')
    ?.toString();
  if (!cargoTomlString) {
    logger.error(`Cannot find a Cargo.toml file in the ${options.projectName}`);
    throw new Error();
  }

  const cargoToml = parseCargoToml(cargoTomlString);

  cargoToml['lib'] ??= TOML.Section({});
  cargoToml['lib']['crate-type'] = ['cdylib', 'rlib'];

  cargoToml['feature'] ??= TOML.Section({});
  cargoToml['feature']['default'] = ['console_error_panic_hook'];

  cargoToml.dependencies ??= TOML.Section({});

  cargoToml.dependencies['wasm-bindgen'] = '0.2';
  if (options.useWebSys) {
    cargoToml.dependencies['js-sys'] = '0.3';
    cargoToml.dependencies['web-sys'] = TOML.inline({
      version: '0.3',
      features: ['Window'],
    });
  }

  cargoToml.dependencies['console_error_panic_hook'] = TOML.inline({
    version: '0.1.6',
    optional: true,
  });

  cargoToml.dependencies['wee_alloc'] = TOML.inline({
    version: '0.4',
    optional: true,
  });

  cargoToml['dev-dependencies'] ??= TOML.Section({});

  cargoToml['dev-dependencies']['wasm-bindgen-test'] = '0.3';

  cargoToml.profile ??= {};
  cargoToml.profile['release'] = TOML.Section({
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
