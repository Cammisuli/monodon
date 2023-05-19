import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { TestExecutorSchema } from './schema';

export default async function* runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  const command = buildCommand('test', options, context);

  const { success } = await cargoCommand(...command);
  yield {
    success,
  };
}
