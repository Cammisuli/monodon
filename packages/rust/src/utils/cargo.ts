import { execSync } from 'child_process';

export function runCargo(args = '') {
  execSync(`cargo ${args}`, { stdio: 'inherit' });
}
