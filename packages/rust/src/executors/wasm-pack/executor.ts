import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { runProcess } from '../../utils/run-process';
import { WasmPackExecutorSchema } from './schema';

interface WasmPackOptions extends Omit<WasmPackExecutorSchema, 'target-dir'> {
  'out-dir': string;
}

export default async function runExecutor(
  options: WasmPackExecutorSchema,
  context: ExecutorContext
) {
  const wasmPackOptions = wasmPackArgs(options);
  const args = buildCommand('build', wasmPackOptions, context);
  return runWasmPack(...args);
}

function runWasmPack(...args: string[]) {
  return runProcess('wasm-pack', ...args);
}

function wasmPackArgs(options: WasmPackExecutorSchema): WasmPackOptions {
  return {
    release: options.release,
    target: options.target,
    'out-dir': options['target-dir'],
  };
}
