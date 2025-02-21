export interface BaseOptions {
  package?: string;
  toolchain?: 'stable' | 'beta' | 'nightly';
  target?: string;
  profile?: string;
  release?: boolean;
  'target-dir'?: string;
  features?: string | string[];
  'all-features'?: boolean;
  args?: string | string[];
}
