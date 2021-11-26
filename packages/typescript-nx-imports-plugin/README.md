# @monodon/typescript-nx-imports-plugin

Adds support for TypeScript to include external files for TypeScript projects on demand. This allows for cross library imports within Nx workspaces.

## Usage

Within the `tsconfig.base.json` file, add the following plugin:

```
"plugins": [
      {
        "name": "@monodon/typescript-nx-imports-plugin",
        "externalFiles": [
          {
            "mainFile": "/Users/jon/Dev/monodon/packages/typescript-nx-imports-plugin/src/index.ts",
            "directory": "/Users/jon/Dev/monodon/packages/typescript-nx-imports-plugin"
          },
          {
            "mainFile": "/Users/jon/Dev/monodon/packages/test-lib/src/index.ts",
            "directory": "/Users/jon/Dev/monodon/packages/test-lib"
          },
          {
            "mainFile": "/Users/jon/Dev/monodon/packages/rust/src/index.ts",
            "directory": "/Users/jon/Dev/monodon/packages/rust"
          }
        ]
      }
    ],
```

> Note: mainFile and directory should be the absolute paths.

This plugin was also made to work well with Nx Console. Using it outside of this extension probably won't work :frown:

### Local development

Build the `@monodon/typescript-nx-imports-plugin` with `yarn nx build typescript-nx-imports-plugin --watch`. Navigate to the `dist/packages/typescript-nx-imports-plugin` directory and run `npm link`. Navigate back to the root of this project and run `npm link @monodon/typescript-nx-imports-plugin`.

This allows TypeScript to find the package within the `node_modules` directory.
