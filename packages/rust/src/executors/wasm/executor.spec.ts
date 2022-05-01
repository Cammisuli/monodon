import { WasmExecutorSchema } from './schema';
import executor from './executor';

const options: WasmExecutorSchema = {};

describe('Wasm Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});