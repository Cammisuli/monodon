import { BaseOptions } from '../../models/base-options';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TestExecutorSchema extends BaseOptions {
  'no-run'?: boolean;
  'no-fail-fast'?: boolean;
}
