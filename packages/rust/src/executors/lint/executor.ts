import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/build-command';
import { runCargo } from '../../utils/cargo';
import { LintExecutorSchema } from './schema';

export default async function* runExecutor(
  options: LintExecutorSchema,
  context: ExecutorContext
) {
  const command = buildCommand('clippy', options, context);

  const { success } = await runCargo(...command);
  yield {
    success,
  };
}
