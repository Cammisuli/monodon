export interface NapiExecutorSchema {
  dist: string;
  jsFile: string;
  dts?: string;
  release?: boolean;
  target?: string;
  zig?: boolean;
}
