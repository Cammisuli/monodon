import { ExecutorContext, getPackageManagerCommand } from '@nx/devkit';
import { NapiExecutorSchema } from './schema';
import { runProcess } from '../../utils/run-process';
import { join } from 'path';
import { fileExists } from 'nx/src/utils/fileutils';

export default async function runExecutor(
  options: NapiExecutorSchema,
  context: ExecutorContext
) {
  const { exec } = getPackageManagerCommand();
  const command = `${exec} napi build`;
  const args: string[] = [];
  if (options.release) {
    args.push('--release');
  }

  if (options.target) {
    args.push('--target');
    args.push(options.target);
  }

  args.push('--platform');

  const projectRoot =
    context.projectGraph?.nodes[context.projectName ?? ''].data.root;
  const projectJson = join(projectRoot ?? '.', 'package.json');
  if (!fileExists(projectJson)) {
    throw new Error(`Could not find package.json at ${projectJson}`);
  }

  args.push('-c');
  args.push(projectJson);

  if (typeof projectRoot == 'string') {
    args.push('--cargo-cwd');
    args.push(projectRoot);
  }

  args.push('--js');
  args.push(options.jsFile);

  args.push(options.dist);

  if (options.zig) {
    args.push('--zig');
  }

  return runProcess(command, ...args);
}
