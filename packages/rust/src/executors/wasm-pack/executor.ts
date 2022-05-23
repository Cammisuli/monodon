import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/build-command';
import { runProcess } from '../../utils/run-process';
import { WasmExecutorSchema } from './schema';

interface WasmPackOptions extends Omit<WasmExecutorSchema, 'output'> {
  'out-dir': string;
}

export default async function runExecutor(
  options: WasmExecutorSchema,
  context: ExecutorContext
) {
  const wasmPackOptions = wasmPackArgs(options);
  const args = buildCommand('build', wasmPackOptions, context);
  return runWasmPack(...args);
}

function runWasmPack(...args: string[]) {
  return runProcess('wasm-pack', ...args);
}

function wasmPackArgs(options: WasmExecutorSchema): WasmPackOptions {
  return {
    release: options.release,
    target: options.target,
    'out-dir': options.output,
  };
}
