import { buildCommand } from './build-command';

describe('build command', () => {
  const context = {
    projectName: 'project',
    cwd: '',
    isVerbose: false,
    root: '',
    workspace: {} as any,
  };

  it('should build a command for cargo with no arguments', () => {
    const command = buildCommand('run', {}, context);
    expect(command).toMatchInlineSnapshot(`
      [
        "run",
        "-p",
        "project",
      ]
    `);
  });

  it('should always have the toolchain before all other arguments with a "+"', () => {
    const command = buildCommand(
      'run',
      { toolchain: 'beta', 'all-features': true, profile: 'release' },
      context
    );
    expect(command).toMatchInlineSnapshot(`
      [
        "+beta",
        "run",
        "--all-features",
        "--profile",
        "release",
        "-p",
        "project",
      ]
    `);
  });

  describe('boolean arguments', () => {
    it('false arguments should not be present', () => {
      const command = buildCommand('run', { release: false }, context);
      expect(command).toMatchInlineSnapshot(`
        [
          "run",
          "-p",
          "project",
        ]
      `);
    });

    it('true arguments should be present', () => {
      const command = buildCommand('run', { release: true }, context);
      expect(command).toMatchInlineSnapshot(`
        [
          "run",
          "--release",
          "-p",
          "project",
        ]
      `);
    });
  });

  describe('array arguments', () => {
    it('should include multiple flags for arrays', () => {
      const command = buildCommand(
        'run',
        {
          features: ['foo', 'bar'],
        },
        context
      );
      expect(command).toMatchInlineSnapshot(`
        [
          "run",
          "--features",
          "foo",
          "--features",
          "bar",
          "-p",
          "project",
        ]
      `);
    });
  });
});
