import TOML from '@ltd/j-toml';
import { Tree, logger } from '@nx/devkit';
import { CargoToml } from '../models/cargo.toml';

export function parseCargoTomlWithTree(
  tree: Tree,
  projectRoot: string,
  projectName: string
) {
  const cargoTomlString = tree.read(projectRoot + '/Cargo.toml')?.toString();
  if (!cargoTomlString) {
    logger.error(`Cannot find a Cargo.toml file in the ${projectName}`);
    throw new Error();
  }

  return parseCargoToml(cargoTomlString);
}

export function parseCargoToml(cargoString: string) {
  return TOML.parse(cargoString, {
    x: { comment: true },
  }) as unknown as CargoToml;
}

export function stringifyCargoToml(cargoToml: CargoToml) {
  const tomlString = TOML.stringify(cargoToml, {
    newlineAround: 'section',
  });

  if (Array.isArray(tomlString)) {
    return tomlString.join('\n');
  }

  return tomlString;
}

export function modifyCargoTable(
  toml: CargoToml,
  section: string,
  key: string,
  value: string | object | Array<any> | (() => any)
) {
  toml[section] ??= TOML.Section({});
  toml[section][key] =
    typeof value === 'object' && !Array.isArray(value)
      ? TOML.inline(value as any)
      : typeof value === 'function'
      ? value()
      : value;
}

export function modifyCargoNestedTable(
  toml: CargoToml,
  section: string,
  key: string,
  value: object
) {
  toml[section] ??= {};
  toml[section][key] = TOML.Section(value as any);
}
