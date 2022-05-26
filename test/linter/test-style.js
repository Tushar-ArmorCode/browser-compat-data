/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import chalk from 'chalk-template';
import compareVersions from 'compare-versions';

import { IS_WINDOWS, indexToPos, jsonDiff } from '../utils.js';
import compareFeatures from '../../scripts/lib/compare-features.js';
import { Logger } from '../utils.js';

/**
 * @typedef {import('../utils').Logger} Logger
 */

/**
 * Return a new "support_block" object whose first-level properties
 * (browser names) have been ordered according to Array.prototype.sort,
 * and so will be stringified in that order as well. This relies on
 * guaranteed "own" property ordering, which is insertion order for
 * non-integer keys (which is our case).
 *
 * @param {string} key The key in the object
 * @param {*} value The value of the key
 *
 * @returns {*} The new value
 */
function orderSupportBlock(key, value) {
  if (key === '__compat') {
    value.support = Object.keys(value.support)
      .sort()
      .reduce((result, key) => {
        result[key] = value.support[key];
        return result;
      }, {});
  }
  return value;
}

/**
 * Return a new feature object whose first-level properties have been
 * ordered according to Array.prototype.sort, and so will be
 * stringified in that order as well. This relies on guaranteed "own"
 * property ordering, which is insertion order for non-integer keys
 * (which is our case).
 *
 * @param {string} key The key in the object
 * @param {*} value The value of the key
 *
 * @returns {*} The new value
 */
function orderFeatures(key, value) {
  if (value instanceof Object && '__compat' in value) {
    value = Object.keys(value)
      .sort(compareFeatures)
      .reduce((result, key) => {
        result[key] = value[key];
        return result;
      }, {});
  }
  return value;
}

/**
 * Return a new feature object whose first-level properties have been
 * ordered according to compareVersions, and so will be
 * stringified in that order as well. This relies on guaranteed "own"
 * property ordering, which is insertion order for non-integer keys
 * (which is our case).
 *
 * @param {string} key The key in the object
 * @param {*} value The value of the key
 *
 * @returns {*} The new value
 */
function orderReleases(key, value) {
  if (key === 'releases') {
    value = Object.keys(value)
      .sort(compareVersions)
      .reduce((result, key) => {
        result[key] = value[key];
        return result;
      }, {});
  }
  return value;
}

/**
 * Process the data for any styling errors that cannot be caught by Prettier or the schema
 *
 * @param {string} rawData The raw contents of the file to test
 * @param {string} category The category of the file
 * @param {Logger} logger The logger to output errors to
 */
function processData(rawData, category, logger) {
  let actual = rawData;
  /** @type {import('../../types').CompatData} */
  const dataObject = JSON.parse(actual);

  // prevent false positives from git.core.autocrlf on Windows
  if (IS_WINDOWS) {
    actual = actual.replace(/\r/g, '');
  }

  if (category === 'browsers') {
    let expected = JSON.stringify(dataObject, orderReleases, 2);

    if (IS_WINDOWS) {
      expected = expected.replace(/\r/g, '');
    }

    if (expected !== expected) {
      logger.error(
        chalk`Browser release sorting error on ${jsonDiff(actual, expected)}`,
        chalk`Run {bold npm run fix} to fix sorting automatically`,
      );
    }
  } else {
    let expected = JSON.stringify(dataObject, null, 2);

    let expectedBrowserSorting = JSON.stringify(
      dataObject,
      orderSupportBlock,
      2,
    );
    let expectedFeatureSorting = JSON.stringify(dataObject, orderFeatures, 2);

    if (IS_WINDOWS) {
      expected = expected.replace(/\r/g, '');
      expectedBrowserSorting = expectedBrowserSorting.replace(/\r/g, '');
      expectedFeatureSorting = expectedFeatureSorting.replace(/\r/g, '');
    }

    if (actual !== expected) {
      logger.error(chalk`{red → Error on ${jsonDiff(actual, expected)}}`);
    }

    if (expected !== expectedBrowserSorting) {
      logger.error(
        chalk`Browser sorting error on ${jsonDiff(
          actual,
          expectedBrowserSorting,
        )}`,
        chalk`Run {bold npm run fix} to fix sorting automatically`,
      );
    }

    if (expected !== expectedFeatureSorting) {
      logger.error(
        chalk`Feature sorting error on ${jsonDiff(
          actual,
          expectedFeatureSorting,
        )}`,
        chalk`Run {bold npm run fix} to fix sorting automatically`,
      );
    }
  }

  const hrefDoubleQuoteIndex = actual.indexOf('href=\\"');
  if (hrefDoubleQuoteIndex >= 0) {
    logger.error(
      chalk`${indexToPos(
        actual,
        hrefDoubleQuoteIndex,
      )} - Found {yellow \\"}, but expected {green \'} for <a href>.`,
    );
  }
}

/**
 * Test the data for any styling errors that cannot be caught by Prettier or the schema
 *
 * @param {string} rawData The raw contents of the file to test
 * @returns {boolean} If the file contains errors
 */
export default function testStyle(rawData, filePath) {
  const logger = new Logger('Style');

  processData(rawData, filePath.category, logger);

  logger.emit();
  return logger.hasErrors();
}
