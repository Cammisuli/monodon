import { NxPlugin } from '@nrwl/devkit';
import { processProjectGraph } from './graph';

const nxPlugin: NxPlugin = {
  name: '@monodon/rust',
  processProjectGraph,
  projectFilePatterns: ['Cargo.toml'],
  // TODO(cammisuli): add support for registering targets
  // registerProjectTargets,
};

export = nxPlugin;
