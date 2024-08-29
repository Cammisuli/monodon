import { Tree, logger } from '@nx/devkit';
import { parseCargoToml, stringifyCargoToml } from './toml';

export function addToCargoWorkspace(tree: Tree, projectPath: string) {
  const cargoTomlString = tree.read('./Cargo.toml')?.toString();
  if (!cargoTomlString) {
    return;
  }

  const cargoToml = parseCargoToml(cargoTomlString);
  const workspace = cargoToml.workspace;
  if (!workspace) {
    throw new Error('Cargo.toml does not contain a workspace section');
  }

  const members = workspace.members;
  if (!members) {
    throw new Error('Cargo.toml workspace section does not contain members');
  }

  // Remove leading './' if it exists
  const cleanProjectPath = projectPath.replace(/^\.\//, '');

  if (members.includes(cleanProjectPath)) {
    logger.info(`${cleanProjectPath} already exists in the Cargo.toml members`);
  } else {
    workspace.members = members.concat([cleanProjectPath]);
  }

  const newCargoToml = stringifyCargoToml(cargoToml);
  tree.write('./Cargo.toml', newCargoToml);
}
