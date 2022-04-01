import { RunExecutorSchema } from './schema';
import { runCargoSync } from '../../utils/cargo';
import { ExecutorContext } from '@nrwl/devkit';

export default async function runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  const { success } = runCargoSync(`run -p ${context.projectName}`);

  return {
    success,
  };
}
