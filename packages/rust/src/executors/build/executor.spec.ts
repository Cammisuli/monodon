// import * as cargoUtils from '../../utils/cargo';
// jest.mock('../../utils/cargo', (): Partial<typeof cargoUtils> => {
//   return { runCargoSync: jest.fn(() => ({ output: 'output', success: true })) };
// });

import {} from '@nx/devkit/testing';
import { BuildExecutorSchema } from './schema';

const options: BuildExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    // e2es should cover this
  });
});
