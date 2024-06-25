import { Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import libraryGenerator from '../library/generator';
import generator from './generator';
import { AddNapiGeneratorSchema } from './schema';

jest.mock('@nx/devkit', (): typeof import('@nx/devkit') => {
  const originalModule = jest.requireActual('@nx/devkit');
  return {
    ...originalModule,
    ensurePackage: jest.fn(),
  };
});

describe('add-napi generator', () => {
  let appTree: Tree;
  const options: AddNapiGeneratorSchema = { project: 'test' };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace();
    await libraryGenerator(appTree, { name: 'test' });
  });

  it('should update the Cargo.toml file', async () => {
    await generator(appTree, options);
    const cargoString = appTree.read('./test/Cargo.toml')?.toString() ?? '';
    expect(cargoString).toMatchInlineSnapshot(`
      "
      [package]
      name = 'test'
      version = '0.1.0'
      edition = '2021'

      [dependencies]
      napi = { version = '2.10.2', default-features = false, features = [
      	'napi4',
      ] }
      napi-derive = '2.9.3'

      [lib]
      crate-type = [
      	'cdylib',
      ]

      [build-dependencies]
      napi-build = '2.0.1'
      "
    `);
  });

  it('should update the base tsconfig file', async () => {
    await generator(appTree, options);
    expect(JSON.parse(appTree.read('tsconfig.base.json')?.toString() ?? ''))
      .toMatchInlineSnapshot(`
      Object {
        "compilerOptions": Object {
          "paths": Object {
            "@proj/test": Array [
              "test/index.d.ts",
            ],
          },
        },
      }
    `);
  });

  it('should update a project', async () => {
    await generator(appTree, options);
    const project = readProjectConfiguration(appTree, 'test');
    expect(project.targets?.build).toMatchInlineSnapshot(`
      Object {
        "cache": true,
        "configurations": Object {
          "production": Object {
            "dist": "dist/test",
            "release": true,
          },
        },
        "executor": "@monodon/rust:napi",
        "options": Object {
          "dist": "test",
          "jsFile": "index.js",
        },
        "outputs": Array [
          "{workspaceRoot}/test",
        ],
      }
    `);
  });
});
