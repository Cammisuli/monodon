import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LocalCargoRegistry, startCargoRegistry } from './cargo-registry';
import {
  crateRoot,
  createTestProject,
  installPlugin,
  runNxCommand,
} from './utils';

/**
 * Exercises the Nx 22 release pipeline end-to-end against a real (local) cargo
 * registry:
 *
 *   1. `nx release version` drives RustVersionActions — bumping each crate's
 *      version, rewriting lib2's local dependency on lib1, and refreshing
 *      Cargo.lock via afterAllProjectsVersioned.
 *   2. `nx release publish` drives the release-publish executor — running
 *      `cargo publish` for each crate, in dependency order, into the registry.
 */
describe('rust release (version + publish against a local cargo registry)', () => {
  let projectDirectory: string;
  let registryDirectory: string;
  let registry: LocalCargoRegistry;
  // Crate roots relative to the workspace (e.g. "packages/lib1") — the exact
  // location depends on the generated workspace's layout, so we ask Nx.
  let lib1Root: string;
  let lib2Root: string;

  beforeAll(async () => {
    // Compute the project graph fresh on every nx invocation. The daemon can
    // serve a stale (empty) graph after crates are generated, which makes
    // `nx release` report that no projects match the release group.
    process.env.NX_DAEMON = 'false';

    projectDirectory = createTestProject('release');
    registryDirectory = `${projectDirectory}-registry`;

    installPlugin(projectDirectory);

    registry = await startCargoRegistry(registryDirectory);
    // cargo-http-registry performs no token validation, but cargo still
    // requires *a* credential to be present for the target registry. This is
    // inherited by the `nx release publish` subprocess.
    process.env.CARGO_REGISTRIES_LOCAL_TOKEN = 'e2e';

    ({ lib1Root, lib2Root } = scaffoldWorkspace(
      projectDirectory,
      registry.registryRoot
    ));
  }, 600_000);

  afterAll(() => {
    registry?.stop();
    rmSync(projectDirectory, { recursive: true, force: true });
    rmSync(registryDirectory, { recursive: true, force: true });
  });

  it('bumps versions, rewrites the local dependency, and updates Cargo.lock', () => {
    runNxCommand('release version 0.1.1', projectDirectory);

    const lib1Toml = readCargoToml(projectDirectory, lib1Root);
    const lib2Toml = readCargoToml(projectDirectory, lib2Root);

    // RustVersionActions re-serializes the manifest via j-toml, which emits
    // single-quoted strings — so match either quote style.
    expect(lib1Toml).toMatch(/version = ['"]0\.1\.1['"]/);
    expect(lib2Toml).toMatch(/version = ['"]0\.1\.1['"]/);
    // lib2's dependency on lib1 is rewritten to the new version, preserving the
    // (prefix-free) form it was declared in — exercises updateProjectDependencies.
    expect(lib2Toml).toMatch(/lib1 = \{ version = ['"]0\.1\.1['"]/);

    // afterAllProjectsVersioned ran `cargo update --workspace`, so the lockfile
    // reflects the bumped versions.
    const lock = readFileSync(join(projectDirectory, 'Cargo.lock'), 'utf-8');
    expect(lock).toMatch(/name = "lib1"\nversion = "0\.1\.1"/);
    expect(lock).toMatch(/name = "lib2"\nversion = "0\.1\.1"/);
  });

  it('publishes both crates to the local registry in dependency order', () => {
    runNxCommand('release publish', projectDirectory);

    // cargo-http-registry stores each uploaded crate as `<name>-<version>.crate`
    // at the registry root. Their presence proves the executor's `cargo publish`
    // reached the registry. lib2 depends on lib1, so cargo's verify step also
    // confirms lib1 was published first (topological `^nx-release-publish`).
    const published = readdirSync(registry.registryRoot);
    expect(published).toContain('lib1-0.1.1.crate');
    expect(published).toContain('lib2-0.1.1.crate');
  });
});

/**
 * Generates a two-crate cargo workspace where lib2 depends on lib1, constrains
 * publishing to the local registry, and seeds a lockfile. Returns each crate's
 * root relative to the workspace.
 */
function scaffoldWorkspace(
  workspace: string,
  registryRoot: string
): { lib1Root: string; lib2Root: string } {
  runNxCommand('generate @monodon/rust:lib lib1', workspace);
  runNxCommand('generate @monodon/rust:lib lib2', workspace);

  const lib1Root = crateRoot(workspace, 'lib1');
  const lib2Root = crateRoot(workspace, 'lib2');

  // Guard against ever reaching crates.io, and give nx release a local
  // dependency to rewrite / cargo a registry dependency to verify against.
  addPublishField(workspace, lib1Root);
  addPublishField(workspace, lib2Root);
  addLocalDependency(workspace, lib2Root, lib1Root, 'lib1');

  appendRegistryConfig(workspace, registryRoot);
  configureRelease(workspace);

  // afterAllProjectsVersioned bumps Cargo.lock, so it has to exist first.
  execSync('cargo generate-lockfile', { cwd: workspace, stdio: 'inherit' });

  initIsolatedGitRepo(workspace);

  // Clear any stale cached/daemon project graph so nx release sees the crates.
  runNxCommand('reset', workspace);

  return { lib1Root, lib2Root };
}

/**
 * The workspace is created with --skipGit (it lives under the monodon repo's
 * gitignored tmp/). nx release needs a git repo, so give it its own isolated one.
 */
function initIsolatedGitRepo(workspace: string): void {
  const run = (command: string) =>
    execSync(command, { cwd: workspace, stdio: 'inherit' });
  run('git init');
  run('git config user.email "e2e@example.com"');
  run('git config user.name "rust-e2e"');
  run('git config commit.gpgsign false');
  run('git add -A');
  run('git commit -m "initial" --no-verify');
}

function readCargoToml(workspace: string, crateRootDir: string): string {
  return readFileSync(join(workspace, crateRootDir, 'Cargo.toml'), 'utf-8');
}

/** Inserts `publish = ["local"]` into a crate's `[package]` table. */
function addPublishField(workspace: string, crateRootDir: string): void {
  const cargoTomlPath = join(workspace, crateRootDir, 'Cargo.toml');
  const contents = readFileSync(cargoTomlPath, 'utf-8');
  const updated = contents.replace(
    /(\[package\][\s\S]*?\nversion = "[^"]*"\n)/,
    `$1publish = ["local"]\n`
  );
  writeFileSync(cargoTomlPath, updated);
}

/** Adds a versioned path-dependency from one crate to another. */
function addLocalDependency(
  workspace: string,
  fromCrateRoot: string,
  toCrateRoot: string,
  depName: string
): void {
  const cargoTomlPath = join(workspace, fromCrateRoot, 'Cargo.toml');
  const relativePath = relative(fromCrateRoot, toCrateRoot);
  const contents = readFileSync(cargoTomlPath, 'utf-8');
  const updated = contents.replace(
    /\[dependencies\]\n/,
    `[dependencies]\n${depName} = { version = "0.1.0", path = "${relativePath}" }\n`
  );
  writeFileSync(cargoTomlPath, updated);
}

/** Appends a local registry to the `.cargo/config.toml` the init generator wrote. */
function appendRegistryConfig(workspace: string, registryRoot: string): void {
  const configPath = join(workspace, '.cargo', 'config.toml');
  const indexUrl = pathToFileURL(registryRoot).href;
  const existing = readFileSync(configPath, 'utf-8');
  writeFileSync(
    configPath,
    `${existing}\n[registries.local]\nindex = "${indexUrl}"\n\n[registry]\ndefault = "local"\n`
  );
}

function configureRelease(workspace: string): void {
  const nxJsonPath = join(workspace, 'nx.json');
  const nxJson = JSON.parse(readFileSync(nxJsonPath, 'utf-8'));
  nxJson.release = {
    projects: ['lib1', 'lib2'],
    version: { conventionalCommits: false },
  };
  writeFileSync(nxJsonPath, JSON.stringify(nxJson, null, 2));
}
