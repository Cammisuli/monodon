import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  Tree,
} from '@nrwl/devkit';

import * as path from 'path';

type NormalizedSchema = {
  libsPath: string;
  appsPath: string;
};

function normalizeOptions(tree: Tree): NormalizedSchema {
  const layout = getWorkspaceLayout(tree);
  return {
    libsPath: layout.libsDir,
    appsPath: layout.appsDir,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    template: '',
  };
  generateFiles(tree, path.join(__dirname, 'files'), './', templateOptions);
}

export default async function (tree: Tree) {
  if (tree.exists('./Cargo.toml')) {
    return;
  }

  const normalizedOptions = normalizeOptions(tree);
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
