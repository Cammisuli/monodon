import TOML from '@ltd/j-toml';
import { CargoToml } from '../models/cargo.toml';
import { TomlTable } from './add-to-workspace';

export function parseCargoToml(cargoString: string) {
  return TOML.parse(cargoString, {
    x: { comment: true },
  }) as unknown as CargoToml;
}

export function stringifyCargoToml(cargoToml: object) {
  const tomlString = TOML.stringify(cargoToml as unknown as TomlTable, {
    newlineAround: 'section',
  });

  if (Array.isArray(tomlString)) {
    return tomlString.join('\n');
  }

  return tomlString;
}
