/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import chalk from 'chalk-template';
import { IS_WINDOWS, indexToPos, jsonDiff } from '../utils.js';
import { orderSupportBlock } from '../../scripts/fix/browser-order.js';
import { orderFeatures } from '../../scripts/fix/feature-order.js';
import { orderStatements } from '../../scripts/fix/statement-order.js';

/**
 * @typedef {import('../utils').Logger} Logger
 */

/**
 * Process the data for any styling errors that cannot be caught by Prettier or the schema
 *
 * @param {string} rawData The raw contents of the file to test
 * @param {Logger} logger The logger to output errors to
 */
function processData(rawData, logger) {
  let actual = rawData;
  /** @type {import('../../types').CompatData} */
  const dataObject = JSON.parse(actual);
  let expected = JSON.stringify(dataObject, null, 2);
  let expectedBrowserSorting = JSON.stringify(dataObject, orderSupportBlock, 2);
  let expectedFeatureSorting = JSON.stringify(dataObject, orderFeatures, 2);
  let expectedStatementSorting = JSON.stringify(dataObject, orderStatements, 2);

  // prevent false positives from git.core.autocrlf on Windows
  if (IS_WINDOWS) {
    actual = actual.replace(/\r/g, '');
    expected = expected.replace(/\r/g, '');
    expectedBrowserSorting = expectedBrowserSorting.replace(/\r/g, '');
    expectedFeatureSorting = expectedFeatureSorting.replace(/\r/g, '');
    expectedStatementSorting = expectedStatementSorting.replace(/\r/g, '');
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
      { fixable: true },
    );
  }

  if (expected !== expectedFeatureSorting) {
    logger.error(
      chalk`Feature sorting error on ${jsonDiff(
        actual,
        expectedFeatureSorting,
      )}`,
      { fixable: true },
    );
  }

  if (expected !== expectedStatementSorting) {
    logger.error(
      chalk`Statement sorting error on ${jsonDiff(
        actual,
        expectedFeatureSorting,
      )}`,
      { fixable: true },
    );
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

export default {
  name: 'Style',
  description: 'Tests the style and formatting of the JSON file',
  scope: 'file',
  check(logger, { rawdata, path: { category } }) {
    if (category !== 'browsers') {
      processData(rawdata, logger);
    }
  },
};
