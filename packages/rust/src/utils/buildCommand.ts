import { ExecutorContext } from '@nrwl/devkit';
import { BaseOptions } from '../models/base-options';

export function buildCommand(
  baseCommand: string,
  options: BaseOptions,
  context: ExecutorContext
): string[] {
  const args = [];

  if (options.toolchain) {
    args.push(`+${options.toolchain}`);
  }

  args.push(baseCommand);

  for (const [key, value] of Object.entries(options)) {
    if (key === 'toolchain') {
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

  args.push('-p', context.projectName);

  return args;
}
