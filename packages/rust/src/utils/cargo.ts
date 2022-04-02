import { execSync, StdioOptions } from 'child_process';

interface CargoRun {
  success: boolean;
  output: string;
}

export function runCargoSync(
  args = '',
  stdio: StdioOptions = 'inherit'
): CargoRun {
  try {
    return {
      output: execSync(`cargo ${args}`, {
        encoding: 'utf8',
        stdio,
      }),
      success: true,
    };
  } catch (e) {
    return {
      output: e as string,
      success: false,
    };
  }
}
