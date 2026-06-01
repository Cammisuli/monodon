import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REGISTRY_BIN = 'cargo-http-registry';

export interface LocalCargoRegistry {
  /**
   * Absolute path to the registry root. Doubles as the `file://` index that
   * cargo reads, and is where published `<name>-<version>.crate` tarballs land.
   */
  registryRoot: string;
  /** Stops the background registry process. */
  stop: () => void;
}

/**
 * Starts a local cargo registry (cargo-http-registry) for e2e publish testing.
 *
 * The binary must already be installed. Developers install it once with
 * `cargo install cargo-http-registry`; CI installs it via
 * `.github/workflows/setup`.
 */
export async function startCargoRegistry(
  registryRoot: string
): Promise<LocalCargoRegistry> {
  const bin = resolveBinary();
  mkdirSync(registryRoot, { recursive: true });

  const proc = spawn(bin, [registryRoot], { stdio: 'inherit' });
  proc.on('error', (err) => {
    throw err;
  });

  // The registry writes config.json (recording its api/dl URLs) only once it has
  // bound its socket and is ready to accept publishes. Poll for that file rather
  // than guessing readiness with a fixed sleep.
  await waitForFile(join(registryRoot, 'config.json'), 10_000);

  return {
    registryRoot,
    stop: () => {
      proc.kill();
    },
  };
}

/**
 * Resolves the registry binary. It is usually on the PATH, but cargo installs
 * to `$CARGO_HOME/bin` (default `~/.cargo/bin`), which is not always on the PATH
 * of the node process that runs the tests — so fall back to that location.
 */
function resolveBinary(): string {
  // Prefer the canonical install location — it's an absolute path, so it works
  // even when the test runner's PATH doesn't include the cargo bin dir. (Note:
  // we can't probe with `<bin> --version`; cargo-http-registry prints its
  // version but exits non-zero, so that would look like a failure.)
  const cargoBin = join(
    process.env.CARGO_HOME ?? join(homedir(), '.cargo'),
    'bin',
    REGISTRY_BIN
  );
  if (existsSync(cargoBin)) {
    return cargoBin;
  }
  // Otherwise fall back to PATH resolution.
  try {
    execSync(`command -v ${REGISTRY_BIN}`, { stdio: 'ignore' });
    return REGISTRY_BIN;
  } catch {
    throw new Error(
      `"${REGISTRY_BIN}" was not found on the PATH or in ${cargoBin}. The ` +
        `rust-e2e release test needs it to stand up a local cargo registry.\n\n` +
        `Install it with:\n\n` +
        `  cargo install cargo-http-registry\n\n` +
        `(CI installs it automatically via .github/workflows/setup.)`
    );
  }
}

async function waitForFile(path: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (!existsSync(path)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for the cargo registry to ` +
          `become ready (${path} never appeared).`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
