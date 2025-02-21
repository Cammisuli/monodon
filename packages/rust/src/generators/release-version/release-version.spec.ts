const originalExit = process.exit;
let stubProcessExit = false;

const processExitSpy = jest
  .spyOn(process, 'exit')
  .mockImplementation((...args) => {
    if (stubProcessExit) {
      return undefined as never;
    }
    return originalExit(...args);
  });

import { ProjectGraph, Tree, output } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import enquirer from 'enquirer';
import { ReleaseGroupWithName } from 'nx/src/command-line/release/config/filter-release-groups';
import { parseCargoTomlWithTree } from '../../utils/toml';
import { releaseVersionGenerator } from './release-version';
import { createWorkspaceWithPackageDependencies } from './test-utils/create-workspace-with-package-dependencies';

jest.mock('enquirer');

// Using the daemon in unit tests would cause jest to never exit
process.env.NX_DAEMON = 'false';

describe('release-version', () => {
  let tree: Tree;
  let projectGraph: ProjectGraph;

  beforeEach(() => {
    // @ts-expect-error read-only property
    process.exit = processExitSpy;

    tree = createTreeWithEmptyWorkspace();

    projectGraph = createWorkspaceWithPackageDependencies(tree, {
      'my-lib': {
        projectRoot: 'libs/my-lib',
        packageName: 'my-lib',
        version: '0.0.1',
        cargoTomlPath: 'libs/my-lib/Cargo.toml',
        localDependencies: [],
      },
      'project-with-dependency-on-my-pkg': {
        projectRoot: 'libs/project-with-dependency-on-my-pkg',
        packageName: 'project-with-dependency-on-my-pkg',
        version: '0.0.1',
        cargoTomlPath: 'libs/project-with-dependency-on-my-pkg/Cargo.toml',
        localDependencies: [
          {
            projectName: 'my-lib',
            dependencyCollection: 'dependencies',
            version: '0.0.1',
          },
        ],
      },
      'project-with-devDependency-on-my-pkg': {
        projectRoot: 'libs/project-with-devDependency-on-my-pkg',
        packageName: 'project-with-devDependency-on-my-pkg',
        version: '0.0.1',
        cargoTomlPath: 'libs/project-with-devDependency-on-my-pkg/Cargo.toml',
        localDependencies: [
          {
            projectName: 'my-lib',
            dependencyCollection: 'dev-dependencies',
            version: '0.0.1',
          },
        ],
      },
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
    stubProcessExit = false;
  });
  afterAll(() => {
    process.exit = originalExit;
  });

  it('should return a versionData object', async () => {
    expect(
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'major',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      })
    ).toMatchInlineSnapshot(`
      Object {
        "callback": [Function],
        "data": Object {
          "my-lib": Object {
            "currentVersion": "0.0.1",
            "dependentProjects": Array [
              Object {
                "dependencyCollection": "dependencies",
                "source": "project-with-dependency-on-my-pkg",
                "target": "my-lib",
                "type": "static",
              },
              Object {
                "dependencyCollection": "dev-dependencies",
                "source": "project-with-devDependency-on-my-pkg",
                "target": "my-lib",
                "type": "static",
              },
            ],
            "newVersion": "1.0.0",
          },
          "project-with-dependency-on-my-pkg": Object {
            "currentVersion": "0.0.1",
            "dependentProjects": Array [],
            "newVersion": "1.0.0",
          },
          "project-with-devDependency-on-my-pkg": Object {
            "currentVersion": "0.0.1",
            "dependentProjects": Array [],
            "newVersion": "1.0.0",
          },
        },
      }
    `);
  });

  describe('not all given projects have Cargo.toml files', () => {
    beforeEach(() => {
      tree.delete('libs/my-lib/Cargo.toml');
    });

    it(`should exit with code one and print guidance when not all of the given projects are appropriate for Rust versioning`, async () => {
      stubProcessExit = true;

      const outputSpy = jest
        .spyOn(output, 'error')
        .mockImplementationOnce(() => {
          return undefined as never;
        });

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'major',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });

      expect(outputSpy).toHaveBeenCalledWith({
        title: `The project "my-lib" does not have a Cargo.toml available at libs/my-lib/Cargo.toml.

To fix this you will either need to add a Cargo.toml file at that location, or configure "release" within your nx.json to exclude "my-lib" from the current release group, or amend the packageRoot configuration to point to where the Cargo.toml should be.`,
      });

      outputSpy.mockRestore();
      expect(processExitSpy).toHaveBeenCalledWith(1);

      stubProcessExit = false;
    });
  });

  describe('fixed release group', () => {
    it(`should work with semver keywords and exact semver versions`, async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'major',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('1.0.0');

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'minor',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('1.1.0');

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'patch',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('1.1.1');

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '1.2.3', // exact version
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('1.2.3');
    });

    it(`should apply the updated version to the projects, including updating dependents`, async () => {
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'major',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });

      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "1.0.0",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "1.0.0",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "1.0.0",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "1.0.0",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "1.0.0",
          },
        }
      `);
    });
  });

  describe('independent release group', () => {
    describe('specifierSource: prompt', () => {
      it(`should appropriately prompt for each project independently and apply the version updates across all Cargo.toml files`, async () => {
        enquirer.prompt = jest
          .fn()
          // First project will be minor
          .mockReturnValueOnce(Promise.resolve({ specifier: 'minor' }))
          // Next project will be patch
          .mockReturnValueOnce(Promise.resolve({ specifier: 'patch' }))
          // Final project will be custom explicit version
          .mockReturnValueOnce(Promise.resolve({ specifier: 'custom' }))
          .mockReturnValueOnce(Promise.resolve({ specifier: '1.2.3' }));

        expect(
          parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
        ).toEqual('0.0.1');
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          ).package.version
        ).toEqual('0.0.1');
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          ).package.version
        ).toEqual('0.0.1');

        await releaseVersionGenerator(tree, {
          projects: Object.values(projectGraph.nodes), // version all projects
          projectGraph,
          specifier: '', // no specifier override set, each individual project will be prompted
          currentVersionResolver: 'disk',
          specifierSource: 'prompt',
          releaseGroup: createReleaseGroup('independent'),
        });

        expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
          .toMatchInlineSnapshot(`
          Object {
            "package": Object {
              "name": "my-lib",
              "version": "0.1.0",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {
              "my-lib": Object {
                "version": "0.1.0",
              },
            },
            "package": Object {
              "name": "project-with-dependency-on-my-pkg",
              "version": "0.0.2",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dev-dependencies": Object {
              "my-lib": Object {
                "version": "0.1.0",
              },
            },
            "package": Object {
              "name": "project-with-devDependency-on-my-pkg",
              "version": "1.2.3",
            },
          }
        `);
      });

      it(`should respect an explicit user CLI specifier for all, even when projects are independent, and apply the version updates across all Cargo.toml files`, async () => {
        expect(
          parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
        ).toEqual('0.0.1');
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          ).package.version
        ).toEqual('0.0.1');
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          ).package.version
        ).toEqual('0.0.1');

        await releaseVersionGenerator(tree, {
          projects: Object.values(projectGraph.nodes), // version all projects
          projectGraph,
          specifier: '4.5.6', // user CLI specifier override set, no prompting should occur
          currentVersionResolver: 'disk',
          specifierSource: 'prompt',
          releaseGroup: createReleaseGroup('independent'),
        });

        expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
          .toMatchInlineSnapshot(`
          Object {
            "package": Object {
              "name": "my-lib",
              "version": "4.5.6",
            },
          }
        `);

        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {
              "my-lib": Object {
                "version": "4.5.6",
              },
            },
            "package": Object {
              "name": "project-with-dependency-on-my-pkg",
              "version": "4.5.6",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dev-dependencies": Object {
              "my-lib": Object {
                "version": "4.5.6",
              },
            },
            "package": Object {
              "name": "project-with-devDependency-on-my-pkg",
              "version": "4.5.6",
            },
          }
        `);
      });

      it(`should update dependents even when filtering to a subset of projects which do not include those dependents`, async () => {
        expect(
          parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
        ).toEqual('0.0.1');
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {
              "my-lib": Object {
                "version": "0.0.1",
              },
            },
            "package": Object {
              "name": "project-with-dependency-on-my-pkg",
              "version": "0.0.1",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dev-dependencies": Object {
              "my-lib": Object {
                "version": "0.0.1",
              },
            },
            "package": Object {
              "name": "project-with-devDependency-on-my-pkg",
              "version": "0.0.1",
            },
          }
        `);

        await releaseVersionGenerator(tree, {
          projects: [projectGraph.nodes['my-lib']], // version only my-lib
          projectGraph,
          specifier: '9.9.9', // user CLI specifier override set, no prompting should occur
          currentVersionResolver: 'disk',
          specifierSource: 'prompt',
          releaseGroup: createReleaseGroup('independent'),
        });

        expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
          .toMatchInlineSnapshot(`
          Object {
            "package": Object {
              "name": "my-lib",
              "version": "9.9.9",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-dependency-on-my-pkg',
            'project-with-dependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {
              "my-lib": Object {
                "version": "9.9.9",
              },
            },
            "package": Object {
              "name": "project-with-dependency-on-my-pkg",
              "version": "0.0.1",
            },
          }
        `);
        expect(
          parseCargoTomlWithTree(
            tree,
            'libs/project-with-devDependency-on-my-pkg',
            'project-with-devDependency-on-my-pkg'
          )
        ).toMatchInlineSnapshot(`
          Object {
            "dev-dependencies": Object {
              "my-lib": Object {
                "version": "9.9.9",
              },
            },
            "package": Object {
              "name": "project-with-devDependency-on-my-pkg",
              "version": "0.0.1",
            },
          }
        `);
      });

      it(`should not throw with project without cargo.toml and even when filtering to a subset of projects which do not include those dependents`, async () => {
        // Add project without Cargo.toml
        const projectWithoutCargoToml = 'project-without-cargoToml';
        projectGraph.nodes[projectWithoutCargoToml] = {
          name: projectWithoutCargoToml,
          type: 'lib',
          data: {
            root: `libs/${projectWithoutCargoToml}`,
          },
        };
        projectGraph.dependencies[projectWithoutCargoToml] = [
          {
            target: projectWithoutCargoToml,
            source: 'project-with-dependency-on-my-pkg',
            type: 'static',
          },
        ];
        tree.write(
          `libs/${projectWithoutCargoToml}/package.json`,
          JSON.stringify({ name: projectWithoutCargoToml, version: '0.0.1' })
        );

        await releaseVersionGenerator(tree, {
          projects: [projectGraph.nodes['my-lib']], // version only my-lib
          projectGraph,
          specifier: '9.9.9', // user CLI specifier override set, no prompting should occur
          currentVersionResolver: 'disk',
          specifierSource: 'prompt',
          releaseGroup: createReleaseGroup('independent'),
        });

        expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
          .toMatchInlineSnapshot(`
          Object {
            "package": Object {
              "name": "my-lib",
              "version": "9.9.9",
            },
          }
        `);
      });
    });
  });

  describe('leading v in version', () => {
    it(`should strip a leading v from the provided specifier`, async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'v8.8.8',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
      });

      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "8.8.8",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "8.8.8",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "8.8.8",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "8.8.8",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "8.8.8",
          },
        }
      `);
    });
  });

  describe('dependent version prefix', () => {
    beforeEach(() => {
      projectGraph = createWorkspaceWithPackageDependencies(tree, {
        'my-lib': {
          projectRoot: 'libs/my-lib',
          packageName: 'my-lib',
          version: '0.0.1',
          cargoTomlPath: 'libs/my-lib/Cargo.toml',
          localDependencies: [],
        },
        'project-with-dependency-on-my-pkg': {
          projectRoot: 'libs/project-with-dependency-on-my-pkg',
          packageName: 'project-with-dependency-on-my-pkg',
          version: '0.0.1',
          cargoTomlPath: 'libs/project-with-dependency-on-my-pkg/Cargo.toml',
          localDependencies: [
            {
              projectName: 'my-lib',
              dependencyCollection: 'dependencies',
              version: '~0.0.1', // already has ~
            },
          ],
        },
        'project-with-devDependency-on-my-pkg': {
          projectRoot: 'libs/project-with-devDependency-on-my-pkg',
          packageName: 'project-with-devDependency-on-my-pkg',
          version: '0.0.1',
          cargoTomlPath: 'libs/project-with-devDependency-on-my-pkg/Cargo.toml',
          localDependencies: [
            {
              projectName: 'my-lib',
              dependencyCollection: 'dev-dependencies',
              version: '^0.0.1', // already has ^
            },
          ],
        },
        'another-project-with-devDependency-on-my-pkg': {
          projectRoot: 'libs/another-project-with-devDependency-on-my-pkg',
          packageName: 'another-project-with-devDependency-on-my-pkg',
          version: '0.0.1',
          cargoTomlPath:
            'libs/another-project-with-devDependency-on-my-pkg/Cargo.toml',
          localDependencies: [
            {
              projectName: 'my-lib',
              dependencyCollection: 'dev-dependencies',
              version: '0.0.1', // has no prefix
            },
          ],
        },
      });
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should work with an empty prefix', async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '9.9.9',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: '',
      });
      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/another-project-with-devDependency-on-my-pkg',
          'another-project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "9.9.9",
            },
          },
          "package": Object {
            "name": "another-project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
    });

    it('should work with a ^ prefix', async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '9.9.9',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: '^',
      });
      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "^9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "^9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/another-project-with-devDependency-on-my-pkg',
          'another-project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "^9.9.9",
            },
          },
          "package": Object {
            "name": "another-project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
    });

    it('should work with a ~ prefix', async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '9.9.9',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: '~',
      });
      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "~9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "~9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/another-project-with-devDependency-on-my-pkg',
          'another-project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "~9.9.9",
            },
          },
          "package": Object {
            "name": "another-project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
    });

    it('should respect any existing prefix when set to "auto"', async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '9.9.9',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: 'auto',
      });
      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "~9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "^9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/another-project-with-devDependency-on-my-pkg',
          'another-project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "9.9.9",
            },
          },
          "package": Object {
            "name": "another-project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
    });

    it('should use the behavior of "auto" by default', async () => {
      expect(
        parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib').package.version
      ).toEqual('0.0.1');
      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: '9.9.9',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: undefined,
      });
      expect(parseCargoTomlWithTree(tree, 'libs/my-lib', 'my-lib'))
        .toMatchInlineSnapshot(`
        Object {
          "package": Object {
            "name": "my-lib",
            "version": "9.9.9",
          },
        }
      `);

      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-dependency-on-my-pkg',
          'project-with-dependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "my-lib": Object {
              "version": "~9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-dependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/project-with-devDependency-on-my-pkg',
          'project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "^9.9.9",
            },
          },
          "package": Object {
            "name": "project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
      expect(
        parseCargoTomlWithTree(
          tree,
          'libs/another-project-with-devDependency-on-my-pkg',
          'another-project-with-devDependency-on-my-pkg'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "dev-dependencies": Object {
            "my-lib": Object {
              "version": "9.9.9",
            },
          },
          "package": Object {
            "name": "another-project-with-devDependency-on-my-pkg",
            "version": "9.9.9",
          },
        }
      `);
    });

    it(`should exit with code one and print guidance for invalid prefix values`, async () => {
      stubProcessExit = true;

      const outputSpy = jest
        .spyOn(output, 'error')
        .mockImplementationOnce(() => {
          return undefined as never;
        });

      await releaseVersionGenerator(tree, {
        projects: Object.values(projectGraph.nodes), // version all projects
        projectGraph,
        specifier: 'major',
        currentVersionResolver: 'disk',
        releaseGroup: createReleaseGroup('fixed'),
        versionPrefix: '$' as any,
      });

      expect(outputSpy).toHaveBeenCalledWith({
        title: `Invalid value for version.generatorOptions.versionPrefix: "$"

Valid values are: "auto", "", "~", "^", "="`,
      });

      outputSpy.mockRestore();
      expect(processExitSpy).toHaveBeenCalledWith(1);

      stubProcessExit = false;
    });
  });
});

function createReleaseGroup(
  relationship: ReleaseGroupWithName['projectsRelationship'],
  partialGroup: Partial<ReleaseGroupWithName> = {}
): ReleaseGroupWithName {
  return {
    name: 'myReleaseGroup',
    releaseTagPattern: '{projectName}@v{version}',
    ...partialGroup,
    projectsRelationship: relationship,
  } as ReleaseGroupWithName;
}
