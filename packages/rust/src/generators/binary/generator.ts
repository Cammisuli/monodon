import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import {
  addBuildExecutor,
  addTestExecutor,
  addLintExecutor,
  addRunExecutor,
} from '../../utils/add-executors';
import { addToCargoWorkspace } from '../../utils/add-to-workspace';
import {
  NormalizedSchema,
  normalizeOptions,
} from '../../utils/normalize-options';
import init from '../init/generator';
import { RustBinaryGeneratorSchema } from './schema';

function addFiles(
  tree: Tree,
  options: NormalizedSchema & RustBinaryGeneratorSchema
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

export default async function binaryGenerator(
  tree: Tree,
  options: RustBinaryGeneratorSchema
) {
  await init(tree);
  const normalizedOptions = normalizeOptions(tree, 'app', options);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: addBuildExecutor({ 'target-dir': normalizedOptions.targetDir }),
      test: addTestExecutor({ 'target-dir': normalizedOptions.targetDir }),
      lint: addLintExecutor({ 'target-dir': normalizedOptions.targetDir }),
      run: addRunExecutor({ 'target-dir': normalizedOptions.targetDir }),
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  addToCargoWorkspace(tree, normalizedOptions.projectRoot);
  await formatFiles(tree);
}
