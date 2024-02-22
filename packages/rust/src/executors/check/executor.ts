import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { CheckExecutorSchema } from './schema';

export default async function* runExecutor(
  options: CheckExecutorSchema,
  context: ExecutorContext
): AsyncGenerator<{ success: boolean }> {
  const command = buildCommand('check', options, context);

  const { success } = await cargoCommand(...command);
  yield {
    success,
  };
}
