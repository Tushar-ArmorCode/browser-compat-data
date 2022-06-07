/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import { Identifier, CompatStatement, StatusBlock } from '../../types/types.js';

import fs from 'node:fs';

import { IS_WINDOWS } from '../../test/utils.js';

const propOrder = {
  __compat: [
    'description',
    'mdn_url',
    'spec_url',
    'matches',
    'support',
    'status',
  ],
  status: ['experimental', 'standard_track', 'deprecated'],
};

function doOrder(value: CompatStatement, order: string[]): CompatStatement;
function doOrder(value: StatusBlock, order: string[]): StatusBlock;
function doOrder(
  value: CompatStatement | StatusBlock,
  order: string[],
): CompatStatement | StatusBlock {
  return order.reduce((result, key) => {
    if (key in value) (result as any)[key] = (value as any)[key];
    return result;
  }, {}) as CompatStatement | StatusBlock;
}

/**
 * Return a new feature object whose first-level properties have been
 * ordered according to doOrder, and so will be stringified in that
 * order as well. This relies on guaranteed "own" property ordering,
 * which is insertion order for non-integer keys (which is our case).
 *
 * @param {string} key The key in the object
 * @param {Identifier} value The value of the key
 *
 * @returns {Identifier} The new value
 */
export function orderProperties(key: string, value: Identifier): Identifier {
  if (value instanceof Object && '__compat' in value) {
    value.__compat = doOrder(
      value.__compat as CompatStatement,
      propOrder.__compat,
    );

    if ('status' in value.__compat) {
      value.__compat.status = doOrder(
        value.__compat.status as StatusBlock,
        propOrder.status,
      );
    }
  }
  return value;
}

/**
 * @param {string} filename
 */
const fixPropertyOrder = (filename: string): void => {
  let actual = fs.readFileSync(filename, 'utf-8').trim();
  let expected = JSON.stringify(JSON.parse(actual, orderProperties), null, 2);

  if (IS_WINDOWS) {
    // prevent false positives from git.core.autocrlf on Windows
    actual = actual.replace(/\r/g, '');
    expected = expected.replace(/\r/g, '');
  }

  if (actual !== expected) {
    fs.writeFileSync(filename, expected + '\n', 'utf-8');
  }
};

export default fixPropertyOrder;
