import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/buildCommand';
import { runCargo } from '../../utils/cargo';
import { BuildExecutorSchema } from './schema';

export default async function* runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
): AsyncGenerator<{ success: boolean }> {
  const command = buildCommand('build', options, context);

  const { success } = await runCargo(...command);
  yield {
    success,
  };
}
