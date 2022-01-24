import { Tree } from '@nrwl/devkit';
import TOML from '@ltd/j-toml';

export function addToWorkspace(tree: Tree, projectPath: string) {
  const cargoTomlString = tree.read('./Cargo.toml')?.toString();
  if (!cargoTomlString) {
    return;
  }

  const cargoToml = parseCargoToml(cargoTomlString);
  const workspace = cargoToml.workspace as any as { members: string[] };
  if (!workspace) {
    throw new Error('Cargo.toml does not contain a workspace section');
  }

  const members = workspace.members;
  if (!members) {
    throw new Error('Cargo.toml workspace section does not contain members');
  }

  const newMembers = members.concat([projectPath]);
  workspace.members = newMembers.join(',') as any;

  const newCargoToml = stringifyCargoToml(cargoToml);
  tree.write('./Cargo.toml', newCargoToml);
}

function parseCargoToml(cargoString: string) {
  return TOML.parse(cargoString);
}

function stringifyCargoToml(cargoToml: any) {
  return TOML.stringify(cargoToml);
}
