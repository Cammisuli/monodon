import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { BuildExecutorSchema } from './schema';

export default async function* runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
): AsyncGenerator<{ success: boolean }> {
  const command = buildCommand('build', options, context);

  const { success } = await cargoCommand(...command);
  yield {
    success,
  };
}
