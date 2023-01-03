import chalk from 'chalk';
import { ChildProcess, execSync, spawn, StdioOptions } from 'child_process';
import { runProcess } from './run-process';

interface CargoRun {
  success: boolean;
  output: string;
}

interface RunCargoOptions {
  stdio: StdioOptions;
  env: NodeJS.ProcessEnv | undefined;
}

export let childProcess: ChildProcess | null;

export async function cargoCommand(
  ...args: string[]
): Promise<{ success: boolean }> {
  console.log(chalk.dim(`> cargo ${args.join(' ')}`));
  args.push('--color', 'always');
  return runProcess('cargo', ...args);
}

export function cargoRunCommand(
  ...args: string[]
): Promise<{ success: boolean }> {
  console.log(chalk.dim(`> cargo ${args.join(' ')}`));
  return new Promise((resolve, reject) => {
    childProcess = spawn('cargo', [...args, '--color', 'always'], {
      cwd: process.cwd(),
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    // Ensure the child process is killed when the parent exits
    process.on('exit', () => childProcess?.kill());
    process.on('SIGTERM', () => childProcess?.kill());

    childProcess.on('error', (err) => {
      reject({ success: false });
    });

    childProcess.on('exit', (code) => {
      childProcess = null;
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject({ success: false });
      }
    });
  });
}

export function cargoCommandSync(
  args = '',
  options?: Partial<RunCargoOptions>
): CargoRun {
  const normalizedOptions: RunCargoOptions = {
    stdio: options?.stdio ?? 'inherit',
    env: {
      ...process.env,
      ...options?.env,
    },
  };

  try {
    return {
      output: execSync(`cargo ${args}`, {
        encoding: 'utf8',
        stdio: normalizedOptions.stdio,
        env: normalizedOptions.env,
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
