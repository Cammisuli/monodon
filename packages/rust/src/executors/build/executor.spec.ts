import * as cargoUtils from '../../utils/cargo';
jest.mock('../../utils/cargo', (): Partial<typeof cargoUtils> => {
  return { runCargoSync: jest.fn(() => ({ output: 'output', success: true })) };
});

import { BuildExecutorSchema } from './schema';
import {} from '@nrwl/devkit/testing';
import executor from './executor';

const options: BuildExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options, {} as any);
    expect(output.success).toBe(true);
  });
});
