import chalk from 'chalk';
import {
  ChildProcess,
  execSync,
  ProcessEnvOptions,
  spawn,
  StdioOptions,
} from 'child_process';

interface CargoRun {
  success: boolean;
  output: string;
}

interface RunCargoOptions {
  stdio: StdioOptions;
  env: NodeJS.ProcessEnv | undefined;
}

let childProcess: ChildProcess | null;

export async function runCargo(
  ...args: string[]
): Promise<{ success: boolean }> {
  console.log(chalk.dim(`> cargo ${args.join(' ')}`));
  return new Promise((resolve, reject) => {
    childProcess = spawn('cargo', [...args, '--color', 'always'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        RUSTC_WRAPPER: '',
      },
      stdio: ['pipe'],
    });

    // cargo outputs to stderr instead of stdout. Redirect to stdout.
    childProcess.stderr?.pipe(process.stdout);

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

export function runCargoSync(
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
