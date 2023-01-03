import { NapiExecutorSchema } from './schema';
import executor from './executor';

const options: NapiExecutorSchema = {};

describe('Napi Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});