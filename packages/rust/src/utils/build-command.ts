import { ExecutorContext } from '@nx/devkit';
import { BaseOptions } from '../models/base-options';

function prebuildCommand(
  baseCommand: string,
  options: BaseOptions,
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
  return args;
}

function getProjectPath(context: ExecutorContext) {
  return context.projectsConfigurations!/*is here 16+*/.projects[context.projectName!/*has to be here for it all to work*/].root;
}

export function buildCommand(
  baseCommand: string,
  options: BaseOptions,
  context: ExecutorContext
): string[] {
  const args = prebuildCommand(baseCommand, options);
  args.push('-p', getProjectPath(context));
  return args;
}

export function buildWasmPackCommand(
  baseCommand: string,
  options: BaseOptions,
  context: ExecutorContext
): string[] {
  const args = prebuildCommand(baseCommand, options);
  args.push(getProjectPath(context));
  return args;
}
