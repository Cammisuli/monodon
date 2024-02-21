import { ExecutorContext, joinPathFragments, output } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { env as appendLocalEnv } from 'npm-run-path';
import { parseCargoToml } from '../../utils/toml';
import { PublishExecutorSchema } from './schema';
import chalk = require('chalk');

const LARGE_BUFFER = 1024 * 1000000;

function processEnv(color: boolean) {
  const env = {
    ...process.env,
    ...appendLocalEnv(),
  };

  if (color) {
    env.FORCE_COLOR = `${color}`;
  }
  return env;
}

export default async function runExecutor(
  options: PublishExecutorSchema,
  context: ExecutorContext
) {
  /**
   * We need to check both the env var and the option because the executor may have been triggered
   * indirectly via dependsOn, in which case the env var will be set, but the option will not.
   */
  const isDryRun = process.env.NX_DRY_RUN === 'true' || options.dryRun || false;

  const projectConfig =
    context.projectsConfigurations!.projects[context.projectName!]!;

  const packageRoot = joinPathFragments(
    context.root,
    options.packageRoot ?? projectConfig.root
  );
  const workspaceRelativePackageRoot = relative(context.root, packageRoot);

  const cargoTomlPath = joinPathFragments(packageRoot, 'Cargo.toml');
  const cargoTomlContents = readFileSync(cargoTomlPath, 'utf-8');
  const cargoToml = parseCargoToml(cargoTomlContents);
  const crateName = cargoToml.package.name;

  const cargoPublishCommandSegments = [
    `cargo publish --allow-dirty -p ${crateName}`,
  ];

  if (isDryRun) {
    cargoPublishCommandSegments.push(`--dry-run`);
  }

  try {
    const command = cargoPublishCommandSegments.join(' ');
    output.logSingleLine(`Running "${command}"...`);

    execSync(command, {
      maxBuffer: LARGE_BUFFER,
      env: processEnv(true),
      cwd: packageRoot,
      stdio: 'inherit',
    });

    console.log('');

    if (isDryRun) {
      console.log(
        `Would publish to https://crates.io, but ${chalk.keyword('orange')(
          '[dry-run]'
        )} was set`
      );
    } else {
      console.log(`Published to https://crates.io`);
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
    };
  }
}
