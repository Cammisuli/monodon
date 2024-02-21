/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { releasePublish, releaseVersion } from 'nx/release';

export default async () => {
  // local registry target to run
  const localRegistryTarget = 'monodon:local-registry';
  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  (global as any).stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: false,
  });

  await releaseVersion({
    specifier: '0.0.0-e2e',
    gitCommit: false,
    gitTag: false,
    stageChanges: false,
    firstRelease: true,
    verbose: true,
  });
  await releasePublish({
    tag: 'e2e',
    verbose: true,
  });
};
