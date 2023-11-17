import { NxPlugin } from '@nx/devkit';
import { createDependencies, createNodes } from './graph';

const nxPlugin: NxPlugin = {
  name: '@monodon/rust',
  createDependencies,
  createNodes,
};

export = nxPlugin;
