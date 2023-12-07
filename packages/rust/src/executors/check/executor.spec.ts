// import * as cargoUtils from '../../utils/cargo';
// jest.mock('../../utils/cargo', (): Partial<typeof cargoUtils> => {
//   return { runCargoSync: jest.fn(() => ({ output: 'output', success: true })) };
// });

import {} from '@nx/devkit/testing';
import { CheckExecutorSchema } from './schema';

const options: CheckExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    // e2es should cover this
  });
});
