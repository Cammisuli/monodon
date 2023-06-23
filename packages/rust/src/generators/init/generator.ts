import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  readNxJson,
  Tree,
  updateNxJson,
} from '@nx/devkit';

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
  tree.write(
    '.cargo/config.toml',
    `[build]
target-dir = 'dist/target'
`
  );
}

function includeProjectGraphPlugin(tree: Tree) {
  const config = readNxJson(tree);
  if (!config) {
    return;
  }
  (config.plugins ??= []).push('@monodon/rust');
  updateNxJson(tree, config);
}

export default async function init(tree: Tree) {
  if (tree.exists('./Cargo.toml')) {
    return;
  }

  const normalizedOptions = normalizeOptions(tree);
  addFiles(tree, normalizedOptions);
  includeProjectGraphPlugin(tree);
  await formatFiles(tree);
}
