// @ts-check

const { execSync } = require('node:child_process');
const {
  releaseChangelog,
  releaseVersion,
  releasePublish,
} = require('nx/src/command-line/release');
const yargs = require('yargs');

(async () => {
  try {
    const options = await yargs
      .version(false)
      .option('version', {
        description:
          'Explicit version specifier to use, if overriding conventional commits',
        type: 'string',
      })
      .option('dryRun', {
        alias: 'd',
        description:
          'Whether or not to perform a dry-run of the release process, defaults to true',
        type: 'boolean',
        default: true,
      })
      .option('verbose', {
        description:
          'Whether or not to enable verbose logging, defaults to false',
        type: 'boolean',
        default: false,
      })
      .option('local', {
        description: 'Whether or not you are running a local release',
        type: 'boolean',
        default: true,
      })
      .option('gitRemote', {
        description:
          'The name of the git remote to push the release to, defaults to origin',
        type: 'string',
      })
      .option('otp', {
        description: 'The otp code used for publishing in npm',
        type: 'number'
      })
      .parseAsync();
    if (!options.dryRun && !options.local) {
      if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
        throw new Error(
          `GH_TOKEN or GITHUB_TOKEN environment variable must be set in order to run a real release`
        );
      }
    }

    if (!options.gitRemote) {
      options.gitRemote = getRemoteFor('git@github.com:Cammisuli/monodon.git');
    }

    console.log();
    console.info(`********* Release Options **********`);
    console.info(
      `version   : ${options.version ?? 'use conventional commits'}`
    );
    console.info(
      `dryRun    : ${options.dryRun} ${options.dryRun ? '😅' : '🚨🚨🚨'}`
    );
    console.info(`verbose   : ${options.verbose}`);
    console.info(`gitRemote : ${options.gitRemote}`);
    console.log();

    // Prepare the packages for publishing
    execSync('yarn nx run-many -t build', {
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 1024, // 1GB
    });

    const { workspaceVersion, projectsVersionData } = await releaseVersion({
      specifier: options.version,
      dryRun: options.dryRun,
      verbose: options.verbose,
      stageChanges: false,
    });

    if (options.dryRun || !options.local) {
      await releaseChangelog({
        versionData: projectsVersionData,
        version: workspaceVersion,
        interactive: 'workspace',
        gitRemote: options.gitRemote,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    }

    const status = await releasePublish({
      dryRun: options.dryRun,
      verbose: options.verbose,
      otp: options.otp,
    });
    process.exit(status);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

/**
 * Gets the name of the git remote for the given URL, if
 * the remote is not found an error is thrown.
 * @param {string} url
 * @returns The name of the git remote for the given URL
 */
function getRemoteFor(url) {
  const stdout = execSync('git remote -v').toString();
  const lines = stdout.split('\n');
  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length > 1 && parts[1] === url) {
      return parts[0];
    }
  }
  throw new Error(`Could not find remote for "${url}"`);
}
