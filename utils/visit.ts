/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import bcd from '../index.js';
import query from './query.js';
import { descendantKeys, joinPath, isFeature } from './walkingUtils.js';

const BREAK = Symbol('break');
const CONTINUE = Symbol('continue');

export default function visit(visitor: Function, options: any = {}): any {
  const { entryPoint, data } = options;
  const test = options.test !== undefined ? options.test : () => true;

  const tree = entryPoint === undefined ? bcd : query(entryPoint, data);

  let outcome;
  if (isFeature(tree) && test(entryPoint, tree.__compat)) {
    outcome = visitor(entryPoint, tree.__compat);
  }
  if (outcome === BREAK) {
    return outcome;
  }
  if (outcome !== CONTINUE) {
    for (const key of descendantKeys(tree)) {
      const suboutcome = visit(visitor, {
        entryPoint: joinPath(entryPoint, key),
        test,
        data,
      });
      if (suboutcome === BREAK) {
        return suboutcome;
      }
    }
  }
  return outcome;
}

visit.BREAK = BREAK;
visit.CONTINUE = CONTINUE;
