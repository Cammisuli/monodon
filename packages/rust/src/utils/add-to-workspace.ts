import { Tree } from '@nrwl/devkit';
import TOML, { stringify } from '@ltd/j-toml';

type TomlTable = ReturnType<typeof TOML.parse>;

export function addToCargoWorkspace(tree: Tree, projectPath: string) {
  const cargoTomlString = tree.read('./Cargo.toml')?.toString();
  if (!cargoTomlString) {
    return;
  }

  const cargoToml = parseCargoToml(cargoTomlString);
  const workspace = cargoToml.workspace as never as { members: string[] };
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

function parseCargoToml(cargoString: string) {
  return TOML.parse(cargoString);
}

function stringifyCargoToml(cargoToml: TomlTable) {
  const tomlString = TOML.stringify(cargoToml);

  if (Array.isArray(tomlString)) {
    return tomlString.join('\n');
  }

  return tomlString;
}
