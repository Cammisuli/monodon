import { TargetConfiguration } from '@nx/devkit';
import { BuildExecutorSchema } from '../executors/build/schema';
import { LintExecutorSchema } from '../executors/lint/schema';
import { RunExecutorSchema } from '../executors/run/schema';
import { TestExecutorSchema } from '../executors/test/schema';
import { WasmPackExecutorSchema } from '../executors/wasm-pack/schema';

export function addBuildExecutor(
  additionalOptions?: BuildExecutorSchema
): TargetConfiguration {
  return {
    cache: true,
    executor: '@monodon/rust:build',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
    configurations: {
      production: {
        release: true,
      },
    },
  };
}

export function addCheckExecutor(
  additionalOptions?: BuildExecutorSchema
): TargetConfiguration {
  return {
    executor: '@monodon/rust:check',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
  };
}

export function addTestExecutor(
  additionalOptions?: TestExecutorSchema
): TargetConfiguration {
  return {
    cache: true,
    executor: '@monodon/rust:test',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
    configurations: {
      production: {
        release: true,
      },
    },
  };
}

export function addRunExecutor(
  additionalOptions?: RunExecutorSchema
): TargetConfiguration {
  return {
    executor: '@monodon/rust:run',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
    configurations: {
      production: {
        release: true,
      },
    },
  };
}

export function addLintExecutor(
  additionalOptions?: LintExecutorSchema
): TargetConfiguration {
  return {
    cache: true,
    executor: '@monodon/rust:lint',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
  };
}

export function addWasmPackExecutor(
  additionalOptions?: WasmPackExecutorSchema
): TargetConfiguration {
  return {
    cache: true,
    executor: '@monodon/rust:wasm-pack',
    outputs: ['{options.target-dir}'],
    options: {
      ...additionalOptions,
    },
    configurations: {
      production: {
        release: true,
      },
    },
  };
}
