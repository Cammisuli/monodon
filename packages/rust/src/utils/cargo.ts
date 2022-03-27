import { execSync } from 'child_process';

interface CargoRun {
  success: boolean;
  output: string;
}

export function runCargoSync(args = ''): CargoRun {
  try {
    return {
      output: execSync(`cargo ${args}`, { encoding: 'utf8' }),
      success: true,
    };
  } catch (e) {
    return {
      output: e,
      success: false,
    };
  }
}
