import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import libraryGenerator from '../library/generator';
import generator from './generator';
import { AddWasmGeneratorSchema } from './schema';

describe('add-wasm generator', () => {
  let appTree: Tree;
  const options: AddWasmGeneratorSchema = {
    project: 'test_lib',
    generateDefaultLib: true,
    useWebSys: false,
  };

  beforeEach(async () => {
    appTree = createTreeWithEmptyWorkspace();
    await libraryGenerator(appTree, {
      name: 'test_lib',
    });
  });

  it('should add wasm to an existing library', async () => {
    await generator(appTree, options);
    const lib = appTree.read('./libs/test_lib/src/lib.rs')?.toString();
    expect(lib).toMatchInlineSnapshot(`undefined`);

    const cargoString =
      appTree.read('./libs/test_lib/Cargo.toml')?.toString() ?? '';
    expect(cargoString).toMatchInlineSnapshot(`""`);
  });

  it('should add wasm to an existing library with webSys', async () => {
    await generator(appTree, { ...options, useWebSys: true });
    const lib = appTree.read('./libs/test_lib/src/lib.rs')?.toString();
    expect(lib).toMatchInlineSnapshot(`undefined`);

    const cargoString =
      appTree.read('./libs/test_lib/Cargo.toml')?.toString() ?? '';
    expect(cargoString).toMatchInlineSnapshot(`""`);
  });
});
