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

  for (const [key, value] of Object.entries(options)) {
    if (key === 'toolchain') {
      continue;
    }

    if (key === 'args') {
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

  if (options.args && Array.isArray(options.args)) {
    args.push("--", ...options.args);
  } else if (options.args && !Array.isArray(options.args)) {
    args.push("--", options.args);
  }

  return args;
}
