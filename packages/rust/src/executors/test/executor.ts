import { ExecutorContext } from '@nrwl/devkit';
import { buildCommand } from '../../utils/build-command';
import { runCargo } from '../../utils/cargo';
import { TestExecutorSchema } from './schema';

export default async function* runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  const command = buildCommand('test', options, context);

  const { success } = await runCargo(...command);
  yield {
    success,
  };
}
