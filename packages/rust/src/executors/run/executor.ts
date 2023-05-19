import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoRunCommand } from '../../utils/cargo';
import { RunExecutorSchema } from './schema';

export default async function* runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  const command = buildCommand('run', options, context);

  const { success } = await cargoRunCommand(...command);
  yield {
    success,
  };
}
