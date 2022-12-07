export interface WasmPackExecutorSchema {
  ['target-dir']: string;
  target: 'bundler' | 'nodejs' | 'web' | 'no-module';
  release: boolean;
}
