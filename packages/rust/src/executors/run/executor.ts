import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoRunCommand } from '../../utils/cargo';
import { RunExecutorSchema } from './schema';

export default async function* runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  // TODO(@jcammisuli): support watch command

  const command = buildCommand('run', options, context);

  const { success } = await cargoRunCommand(...command);
  yield {
    success,
  };
}
