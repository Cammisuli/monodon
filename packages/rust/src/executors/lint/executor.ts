import { LintExecutorSchema } from './schema';

export default async function runExecutor(
  options: LintExecutorSchema,
) {
  console.log('Executor ran for Lint', options)
  return {
    success: true
  }
}

