import { NxPlugin } from '@nx/devkit';
import { createDependencies, createNodesV2 } from './graph';

const nxPlugin: NxPlugin = {
  name: '@monodon/rust',
  createDependencies,
  createNodesV2,
};

export = nxPlugin;
