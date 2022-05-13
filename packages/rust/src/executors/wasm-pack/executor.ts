import { WasmExecutorSchema } from './schema';

export default async function runExecutor(
  options: WasmExecutorSchema,
) {
  console.log('Executor ran for Wasm', options)
  return {
    success: true
  }
}

