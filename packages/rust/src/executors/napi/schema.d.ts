export interface NapiExecutorSchema {
  dist: string;
  jsFile: string;
  release?: boolean;
  target?: string;
  zig?: boolean;
}
