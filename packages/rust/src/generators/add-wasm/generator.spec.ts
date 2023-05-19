import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
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
    const lib = appTree.read('./test_lib/src/lib.rs')?.toString();
    expect(lib).toMatchInlineSnapshot(`
      "mod utils;

      use wasm_bindgen::prelude::*;

      // When the \`wee_alloc\` feature is enabled, use \`wee_alloc\` as the global
      // allocator.
      #[cfg(feature = \\"wee_alloc\\")]
      #[global_allocator]
      static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

      #[wasm_bindgen]
      extern {
          fn alert(s: &str);
      }

      #[wasm_bindgen]
      pub fn greet() {
          alert(\\"Hello, test_lib!\\");
      }
      "
    `);

    const cargoString = appTree.read('./test_lib/Cargo.toml')?.toString() ?? '';
    expect(cargoString).toMatchInlineSnapshot(`
      "
      [package]
      name = 'test_lib'
      version = '0.1.0'
      edition = '2021'

      [dependencies]
      wasm-bindgen = '0.2'
      console_error_panic_hook = { version = '0.1.6', optional = true }
      wee_alloc = { version = '0.4', optional = true }

      [lib]
      crate-type = [
      	'cdylib',
      	'rlib',
      ]

      [feature]
      default = [
      	'console_error_panic_hook',
      ]

      [dev-dependencies]
      wasm-bindgen-test = '0.3'

      [profile.release]
      opt-level = 's' #Tell \`rustc\` to optimize for small code size.
      "
    `);
  });

  it('should add wasm to an existing library with webSys', async () => {
    await generator(appTree, { ...options, useWebSys: true });
    const lib = appTree.read('./test_lib/src/lib.rs')?.toString();
    expect(lib).toMatchInlineSnapshot(`
      "mod utils;

      use wasm_bindgen::prelude::*;
      use web_sys::window;

      // When the \`wee_alloc\` feature is enabled, use \`wee_alloc\` as the global
      // allocator.
      #[cfg(feature = \\"wee_alloc\\")]
      #[global_allocator]
      static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

      #[wasm_bindgen]
      pub fn greet() -> Result<(), JsValue> {
          window()
              .ok_or(\\"no window\\")?
              .alert_with_message(\\"Hello, world!\\")
      }
      "
    `);

    const cargoString = appTree.read('./test_lib/Cargo.toml')?.toString() ?? '';
    expect(cargoString).toMatchInlineSnapshot(`
      "
      [package]
      name = 'test_lib'
      version = '0.1.0'
      edition = '2021'

      [dependencies]
      wasm-bindgen = '0.2'
      js-sys = '0.3'
      web-sys = { version = '0.3', features = [
      	'Window',
      ] }
      console_error_panic_hook = { version = '0.1.6', optional = true }
      wee_alloc = { version = '0.4', optional = true }

      [lib]
      crate-type = [
      	'cdylib',
      	'rlib',
      ]

      [feature]
      default = [
      	'console_error_panic_hook',
      ]

      [dev-dependencies]
      wasm-bindgen-test = '0.3'

      [profile.release]
      opt-level = 's' #Tell \`rustc\` to optimize for small code size.
      "
    `);
  });
});
