import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/buildCommand';
import { runCargo } from '../../utils/cargo';
import { RunExecutorSchema } from './schema';

export default async function* runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  // TODO(@jcammisuli): support watch command

  const command = buildCommand('run', options, context);

  const { success } = await runCargo(...command);
  yield {
    success,
  };
}
