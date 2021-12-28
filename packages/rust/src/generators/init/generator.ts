import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  Tree,
} from '@nrwl/devkit';

import * as path from 'path';

type NormalizedSchema = {
  libsDir: string;
  appsDir: string;
  cargoMembers: string;
};

function normalizeOptions(tree: Tree): NormalizedSchema {
  const { libsDir, appsDir } = getWorkspaceLayout(tree);
  return {
    libsDir,
    appsDir,
    cargoMembers: Array.from(
      new Set([`"${libsDir}/*"`, `"${appsDir}/*"`])
    ).join(','),
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
