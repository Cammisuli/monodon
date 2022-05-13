import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import {
  addBuildExecutor,
  addLintExecutor,
  addRunExecutor,
  addTestExecutor,
} from '../../utils/add-executors';
import { addToCargoWorkspace } from '../../utils/add-to-workspace';
import {
  NormalizedSchema,
  normalizeOptions,
} from '../../utils/normalize-options';
import wasmGenerator from '../add-wasm/generator';
import init from '../init/generator';

import { RustLibraryGeneratorSchema } from './schema';

function addFiles(
  tree: Tree,
  options: NormalizedSchema & RustLibraryGeneratorSchema
) {
  const templateOptions = {
    ...options,
    ...names(options.name),
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

export default async function libraryGenerator(
  tree: Tree,
  options: RustLibraryGeneratorSchema
) {
  await init(tree);
  const normalizedOptions = normalizeOptions(tree, 'lib', options);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: addBuildExecutor({ 'target-dir': normalizedOptions.targetDir }),
      test: addTestExecutor({ 'target-dir': normalizedOptions.targetDir }),
      lint: addLintExecutor({ 'target-dir': normalizedOptions.targetDir }),
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  addToCargoWorkspace(tree, normalizedOptions.projectRoot);

  if (options.wasm) {
    await wasmGenerator(tree, {
      generateDefaultLib: true,
      useWebSys: true,
      project: normalizedOptions.projectName,
    });
  }

  await formatFiles(tree);
}
