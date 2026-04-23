// @napi-rs/cli v3 is ESM-only and its published .d.ts resolves to `any`
// when imported via dynamic `await import(...)` from a CJS TypeScript build
// under `moduleResolution: "node16"`. A minimal shim keeps type safety at
// the one call site while avoiding `any` at the compile boundary.
declare module '@napi-rs/cli' {
  export class NapiCli {
    build(options: Record<string, unknown>): Promise<{ task: Promise<string> }>;
    createNpmDirs(options: {
      npmDir: string;
      packageJsonPath: string;
      dryRun?: boolean;
    }): Promise<unknown>;
  }
}
