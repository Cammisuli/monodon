import { ExecutorContext, joinPathFragments, workspaceRoot } from '@nx/devkit';
import { NapiExecutorSchema } from './schema.js';
import { join } from 'path';
import { fileExists } from 'nx/src/utils/fileutils.js';
import { cargoMetadata } from '../../utils/cargo';

export default async function runExecutor(
  options: NapiExecutorSchema,
  context: ExecutorContext
) {
  const { NapiCli } = await import('@napi-rs/cli');
  const projectRoot =
    context.projectGraph?.nodes[context.projectName ?? ''].data.root;
  const packageJson = join(projectRoot ?? '.', 'package.json');
  if (!fileExists(packageJson)) {
    throw new Error(`Could not find package.json at ${packageJson}`);
  }

  const napi = new NapiCli();

  const buildOptions: Parameters<typeof napi.build>[0] = {};

  buildOptions.platform = true;
  buildOptions.jsBinding = options.jsFile;
  buildOptions.dts = options.dts;
  buildOptions.outputDir = options.dist;
  buildOptions.manifestPath = join(projectRoot ?? '.', 'Cargo.toml');
  buildOptions.packageJsonPath = packageJson;
  if (options.release) {
    buildOptions.release = true;
  }

  if (options.target) {
    buildOptions.target = options.target;
  }

  if (options.zig) {
    buildOptions.crossCompile = true;
  }

  const metadata = cargoMetadata();
  buildOptions.targetDir =
    metadata?.target_directory ??
    joinPathFragments(workspaceRoot, 'dist', 'cargo');

  if (process.env.VERCEL) {
    // Vercel doesnt have support for cargo atm, so auto success builds
    return { success: true };
  }

  const { task } = await napi.build(buildOptions);
  const output = await task;
  return { success: true, terminalOutput: output };
}
