import TOML from '@ltd/j-toml';
import { Tree } from '@nrwl/devkit';
import { parseCargoToml, stringifyCargoToml } from './toml';

export type TomlTable = ReturnType<typeof TOML.parse>;

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

  workspace.members = members.concat([projectPath]);

  const newCargoToml = stringifyCargoToml(cargoToml);
  tree.write('./Cargo.toml', newCargoToml);
}
