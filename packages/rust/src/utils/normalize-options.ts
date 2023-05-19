import { getWorkspaceLayout, Tree } from '@nx/devkit';
import snake_case from './snake_case';

export interface NormalizedSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  targetDir: string;
}

export function normalizeOptions<
  T extends {
    name: string;
    edition?: '2015' | '2018' | '2021';
    tags?: string;
    directory?: string;
  }
>(tree: Tree, type: 'app' | 'lib', options: T): NormalizedSchema & T {
  const name = snake_case(options.name);
  const projectDirectory = options.directory
    ? `${options.directory
        .split('/')
        .map((p) => snake_case(p))
        .join('/')}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '_');

  const { appsDir, libsDir } = getWorkspaceLayout(tree);
  let baseDir = '';
  if (appsDir && libsDir) {
    baseDir = (type === 'app' ? appsDir : libsDir) + '/';
  }
  const projectRoot = `${baseDir}${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  // rust specifics
  options.edition ??= '2021';
  const targetDir = `dist/target/${projectName}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    targetDir,
  };
}
