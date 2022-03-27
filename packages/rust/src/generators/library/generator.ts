import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { addToCargoWorkspace } from '../../utils/add-to-workspace';
import {
  NormalizedSchema,
  normalizeOptions,
} from '../../utils/normalize-options';
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
      build: {
        executor: '@monodon/rust:build',
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  addToCargoWorkspace(tree, normalizedOptions.projectRoot);
  await formatFiles(tree);
}
