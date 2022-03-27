import { ExecutorContext } from '@nrwl/devkit';
import { runCargoSync } from '../../utils/cargo';
import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const { success } = runCargoSync(`build -p ${context.projectName}`);
  return {
    success,
  };
}
