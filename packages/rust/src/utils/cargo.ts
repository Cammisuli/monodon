import { execSync } from 'child_process';

export function runCargoSync(args = '') {
  try {
    return execSync(`cargo ${args}`, { encoding: 'utf8' });
  } catch (e) {
    return;
  }
}
