import { ExecutorContext } from '@nrwl/devkit';
import { runCargoSync } from '../../utils/cargo';
import { TestExecutorSchema } from './schema';

export default async function runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  const { success, output } = runCargoSync(`test -p ${context.projectName}`);

  return {
    output,
    success,
  };
}
