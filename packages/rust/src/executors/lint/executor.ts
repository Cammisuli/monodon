import { LintExecutorSchema } from './schema';
import { runCargoSync } from '../../utils/cargo';
import { ExecutorContext } from '@nrwl/devkit';

export default async function runExecutor(
  options: LintExecutorSchema,
  context: ExecutorContext
) {
  const { success } = runCargoSync(`clippy -p ${context.projectName}`);
  return {
    success,
  };
}
