/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import chalk from 'chalk';

import { Logger } from '../utils.js';

import bcd from '../../index.js';
const { browsers } = bcd;

/**
 * @typedef {import('../../types').Identifier} Identifier
 */

/**
 * @param {Identifier} data
 * @param {Logger} logger
 * @param {string} path
 */
function checkStatus(data, logger, path = '') {
  const compat = data.__compat;
  if (compat?.status) {
    if (compat.status.experimental && compat.status.deprecated) {
      logger.error(
        chalk`{red Unexpected simultaneous experimental and deprecated status in ${path}}`,
        chalk`Run {bold npm run fix} to fix this issue automatically`,
      );
    }

    if (compat.spec_url && compat.status.standard_track === false) {
      logger.error(
        chalk`{red → {bold ${path}} is marked as {bold non-standard}, but has a {bold spec_url}}`,
      );
    }

    if (compat.status.experimental) {
      // Check if experimental should be false (code copied from migration 007)

      const browserSupport = new Set();

      for (const [browser, support] of Object.entries(compat.support)) {
        // Consider only the first part of an array statement.
        const statement = Array.isArray(support) ? support[0] : support;
        // Ignore anything behind flag, prefix or alternative name
        if (statement.flags || statement.prefix || statement.alternative_name) {
          continue;
        }
        if (statement.version_added && !statement.version_removed) {
          browserSupport.add(browser);
        }
      }

      // Now check which of Blink, Gecko and WebKit support it.

      const engineSupport = new Set();

      for (const browser of browserSupport) {
        const currentRelease = Object.values(browsers[browser].releases).find(
          (r) => r.status === 'current',
        );
        const engine = currentRelease.engine;
        engineSupport.add(engine);
      }

      let engineCount = 0;
      for (const engine of ['Blink', 'Gecko', 'WebKit']) {
        if (engineSupport.has(engine)) {
          engineCount++;
        }
      }

      if (engineCount > 1) {
        logger.error(
          chalk`{red → Experimental should be set to {bold false} for {bold ${path}} as the feature is supported in multiple browser engines.}`,
        );
      }
    }
  }

  // Check children
  for (const member in data) {
    if (member === '__compat') {
      continue;
    }
    checkStatus(
      data[member],
      logger,
      path && path.length > 0 ? `${path}.${member}` : member,
    );
  }
}

/**
 * @param {Identifier} data The contents of the file to test
 * @returns {boolean} If the file contains errors
 */
export default function testStatus(data) {
  const logger = new Logger('Feature Status');

  checkStatus(data, logger);

  logger.emit();
  return logger.hasErrors();
}
