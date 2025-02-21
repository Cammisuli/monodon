import { ExecutorContext } from '@nx/devkit';
import { BaseOptions } from '../models/base-options';

export function buildCommand(
  baseCommand: string,
  options: BaseOptions,
  context: ExecutorContext
): string[] {
  const args = [];

  if (options.toolchain && options.toolchain !== 'stable') {
    args.push(`+${options.toolchain}`);
  }

  args.push(baseCommand);

  // flags after '-- ' should be passed to binaries after any other option
  const argstobinaries = ['--'];
  for (const [key, value] of Object.entries(options)) {
    if (key === 'toolchain') {
      continue;
    }
    if (key === '-- --test-threads' && value === 0) {
      // -- --test-threads=0 comes from schema default to avoid setting thread number if not rquested
      continue;
    }
    if (key.startsWith('-- ') ) {
      // use '-- ' only once, save argument to append to the end of args
      argstobinaries.push(key.substring(3), value);
      continue;
    }

    if (typeof value === 'boolean') {
      // false flags should not be added to the cargo args
      if (value) {
        args.push(`--${key}`);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        args.push(`--${key}`, item);
      }
    } else {
      args.push(`--${key}`, value);
    }
  }

  if (!args.includes("--package")) {
    args.push("-p", context.projectName);
  }
  if (argstobinaries.length > 1) {
    args.push(...argstobinaries);
  }

  return args;
}
