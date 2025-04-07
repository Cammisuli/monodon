import TOML from '@ltd/j-toml';
import { Tree, logger } from '@nx/devkit';
import { CargoToml } from '../models/cargo.toml';

type TOMLBasicString = ReturnType<typeof TOML.basic>;
type TOMLValue =
  | string
  | number
  | boolean
  | Date
  | TOMLArray
  | TOMLTable
  | TOMLBasicString;
type TOMLArray = TOMLValue[];
type TOMLTable = { [key: string]: TOMLValue };

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

export function stringifyCargoToml(cargoToml: CargoToml): string {
  function isTable(value: TOMLValue): value is TOMLTable {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  function formatValue(value: TOMLValue): string {
    if (typeof value === 'string') {
      return value.includes('"') ? `'${value}'` : `"${value}"`;
    } else if (Array.isArray(value)) {
      return `[${value.map(formatValue).join(', ')}]`;
    } else if (isTable(value)) {
      if (TOML.isInline(value)) {
        return `{ ${Object.entries(value).map(([k, v]) => `${k} = ${formatValue(v)}`).join(', ')} }`;
      } else {
        return '';
      }
    } else {
      return String(value);
    }
  }

  function stringifyTable(table: TOMLTable, prefix: string = ''): string[] {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(table)) {
      if (isTable(value) && !TOML.isInline(value)) {
        if (lines.length > 0) lines.push('');
        const fullKey = prefix ? `${prefix}.${key}` : key;
        lines.push(`[${fullKey}]`);
        lines.push(...stringifyTable(value, fullKey));
      } else {
        lines.push(`${key} = ${formatValue(value)}`);
      }
    }
    return lines;
  }

  const tomlLines = stringifyTable(cargoToml);
  return tomlLines.join('\n');
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
