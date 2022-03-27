import { RunExecutorSchema } from './schema';

export default async function runExecutor(
  options: RunExecutorSchema,
) {
  console.log('Executor ran for Run', options)
  return {
    success: true
  }
}

