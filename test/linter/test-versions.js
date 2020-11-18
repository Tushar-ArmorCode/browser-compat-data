'use strict';
const path = require('path');
const compareVersions = require('compare-versions');
const chalk = require('chalk');
const { Logger } = require('./utils.js');

/**
 * @typedef {import('../../types').Identifier} Identifier
 * @typedef {import('../../types').SimpleSupportStatement} SimpleSupportStatement
 * @typedef {import('../../types').SupportBlock} SupportBlock
 * @typedef {import('../../types').VersionValue} VersionValue
 */
const browsers = require('../..').browsers;

/** @type {Object<string, string[]>} */
const validBrowserVersions = {};

/** @type {Object<string, string[]>} */
const VERSION_RANGE_BROWSERS = {
  edge: ['≤18', '≤79'],
  ie: ['≤6'],
  opera: ['≤12.1', '≤15'],
  opera_android: ['≤12.1', '≤14'],
  safari: ['≤4'],
  safari_ios: ['≤3'],
  webview_android: ['≤37'],
};

for (const browser of Object.keys(browsers)) {
  validBrowserVersions[browser] = Object.keys(browsers[browser].releases);
  if (VERSION_RANGE_BROWSERS[browser]) {
    validBrowserVersions[browser].push(...VERSION_RANGE_BROWSERS[browser]);
  }
}

/** @type string[] */
const FLAGLESS_BROWSERS = ['samsunginternet_android', 'webview_android'];

/** @type {string[]} */
const blockMany = [
  'chrome',
  'chrome_android',
  'edge',
  'firefox',
  'firefox_android',
  'ie',
  'opera',
  'opera_android',
  'safari',
  'safari_ios',
  'samsunginternet_android',
  'webview_android',
];

/** @type {Record<string, string[]>} */
const blockList = {
  api: [],
  css: blockMany,
  html: [],
  http: [],
  svg: [],
  javascript: blockMany,
  mathml: blockMany,
  webdriver: blockMany,
  webextensions: [],
  xpath: [],
  xslt: [],
};

/**
 * @param {string} browserIdentifier
 * @param {VersionValue} version
 */
function isValidVersion(browser, category, version) {
  if (typeof version === 'string') {
    return validBrowserVersions[browser].includes(version);
  } else if (blockList[category].includes(browser) && version !== false) {
    return false;
  } else {
    return true;
  }
}

/**
 * @param {SupportBlock} supportData
 * @param {string} relPath
 * @param {Logger} logger
 */
function checkVersions(supportData, category, relPath, logger) {
  const browsersToCheck = Object.keys(supportData);
  for (const browser of browsersToCheck) {
    if (validBrowserVersions[browser]) {
      /** @type {SimpleSupportStatement[]} */
      const supportStatements = Array.isArray(supportData[browser])
        ? supportData[browser]
        : [supportData[browser]];

      const validBrowserVersionsString = validBrowserVersions[browser].join(
        ', ',
      );
      const validBrowserVersionsNonReal = `true, null, false, ${validBrowserVersionsString}`;
      const validBrowserVersionsTruthy = `true, ${validBrowserVersionsString}`;

      for (const statement of supportStatements) {
        if (statement === undefined) {
          if (blockList[category].includes(browser)) {
            logger.error(
              chalk`{red → {bold ${browser}} must be defined for {bold ${relPath}}}`,
            );
          }
        } else {
          if (!isValidVersion(browser, category, statement.version_added)) {
            logger.error(
              chalk`{red → {bold ${relPath}} - {bold version_added: "${
                statement.version_added
              }"} is {bold NOT} a valid version number for {bold ${browser}}\n    Valid {bold ${browser}} versions are: ${
                blockList[category].includes(browser)
                  ? `false, ${validBrowserVersions[browser].join(', ')}`
                  : `true, false, null, ${validBrowserVersions[browser].join(
                      ', ',
                    )}`
              }}`,
            );
          }
          if (
            'version_removed' in statement &&
            !isValidVersion(browser, category, statement.version_removed)
          ) {
            logger.error(
              chalk`{red → {bold ${relPath}} - {bold version_removed: "${
                statement.version_removed
              }"} is {bold NOT} a valid version number for {bold ${browser}}\n    Valid {bold ${browser}} versions are: ${
                blockList[category].includes(browser)
                  ? `false, ${validBrowserVersions[browser].join(', ')}`
                  : `true, false, null, ${validBrowserVersions[browser].join(
                      ', ',
                    )}`
              }}`,
            );
          }
          if ('version_removed' in statement && 'version_added' in statement) {
            if (
              typeof statement.version_added !== 'string' &&
              statement.version_added !== true
            ) {
              logger.error(
                chalk`{red → {bold ${relPath}} - {bold version_added: "${
                  statement.version_added
                }"} is {bold NOT} a valid version number for {bold ${browser}} when {bold version_removed} is present\n    Valid {bold ${browser}} versions are: ${
                  blockList[category].includes(browser)
                    ? validBrowserVersions[browser].join(', ')
                    : `true, ${validBrowserVersions[browser].join(', ')}`
                }}`,
              );
            } else if (
              typeof statement.version_added === 'string' &&
              typeof statement.version_removed === 'string'
            ) {
              if (
                (statement.version_added.startsWith('≤') &&
                  statement.version_removed.startsWith('≤') &&
                  compareVersions.compare(
                    statement.version_added.replace('≤', ''),
                    statement.version_removed.replace('≤', ''),
                    '<',
                  )) ||
                ((!statement.version_added.startsWith('≤') ||
                  !statement.version_removed.startsWith('≤')) &&
                  compareVersions.compare(
                    statement.version_added.replace('≤', ''),
                    statement.version_removed.replace('≤', ''),
                    '>=',
                  ))
              ) {
                logger.error(
                  chalk`{red → {bold ${relPath}} - {bold version_removed: "${statement.version_removed}"} must be greater than {bold version_added: "${statement.version_added}"}}`,
                );
              }
            }
          }
          if ('flags' in statement) {
            if (FLAGLESS_BROWSERS.includes(browser)) {
              logger.error(
                chalk`{red → {bold ${relPath}} - This browser ({bold ${browser}}) does not support flags, so support cannot be behind a flag for this feature.}`,
              );
            }
          }
        }
      }
    }
  }
}

/**
 * @param {string} filename
 */
function testVersions(filename) {
  const relativePath = path.relative(
    path.resolve(__dirname, '..', '..'),
    filename,
  );
  const category =
    relativePath.includes(path.sep) && relativePath.split(path.sep)[0];
  /** @type {Identifier} */
  const data = require(filename);

  const logger = new Logger('Versions');

  /**
   * @param {Identifier} data
   * @param {string} [relPath]
   */
  function findSupport(data, relPath) {
    for (const prop in data) {
      if (prop === '__compat' && data[prop].support) {
        checkVersions(data[prop].support, category, relPath, logger);
      }
      const sub = data[prop];
      if (typeof sub === 'object') {
        findSupport(sub, relPath ? `${relPath}.${prop}` : `${prop}`);
      }
    }
  }
  findSupport(data);

  logger.emit();
  return logger.hasErrors();
}

module.exports = testVersions;
