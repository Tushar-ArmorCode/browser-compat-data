#!/usr/bin/env node
/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';
const fs = require('fs');
const path = require('path');
const { platform } = require('os');

const compareVersions = require('compare-versions');

const bcd = require('../..');

/** Determines if the OS is Windows */
const IS_WINDOWS = platform() === 'win32';

let twoYearsAgo = new Date(Date.now());
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

const getEarliestVersion = (...args) => {
  const versions = args
    .filter(version => typeof version === 'string')
    .map(version => version.replace('≤', ''));

  let earliestVersion = versions[0];

  for (const version of versions) {
    if (compareVersions.compare(earliestVersion, version, '>'))
      earliestVersion = version;
  }

  return earliestVersion;
};

const removeRedundantFlags = (key, value) => {
  if (key === '__compat') {
    for (const [browser, originalSupportData] of Object.entries(
      value.support,
    )) {
      if (originalSupportData !== undefined) {
        const supportData = Array.isArray(originalSupportData)
          ? originalSupportData
          : [originalSupportData];
        const result = [];

        const simpleStatement = supportData.find(statement => {
          const ignoreKeys = new Set([
            'version_removed',
            'notes',
            'partial_implementation',
          ]);
          const keys = Object.keys(statement).filter(
            key => !ignoreKeys.has(key),
          );
          return keys.length === 1;
        });

        for (let i = 0; i < supportData.length; i++) {
          let addData = true;

          if (supportData[i].flags) {
            const versionToCheck = getEarliestVersion(
              supportData[i].version_removed ||
                (simpleStatement && supportData[i].version_added),
              simpleStatement && simpleStatement.version_added,
            );

            if (typeof versionToCheck === 'string') {
              const releaseDate = new Date(
                bcd.browsers[browser].releases[
                  versionToCheck.replace('≤', '')
                ].release_date,
              );

              if (releaseDate <= twoYearsAgo) {
                addData = false;
              }
            }
          }

          if (addData) result.push(supportData[i]);
        }

        if (result.length == 0) {
          if (!simpleStatement) {
            value.support[browser] = { version_added: false };
          } else {
            continue;
          }
        } else if (result.length == 1) {
          value.support[browser] = result[0];
        } else {
          value.support[browser] = result;
        }
      }
    }
  }
  return value;
};

/**
 * @param {Promise<void>} filename
 */
const fixRedundantFlags = filename => {
  const actual = fs.readFileSync(filename, 'utf-8').trim();
  const expected = JSON.stringify(
    JSON.parse(actual, removeRedundantFlags),
    null,
    2,
  );

  if (IS_WINDOWS) {
    // prevent false positives from git.core.autocrlf on Windows
    actual = actual.replace(/\r/g, '');
    expected = expected.replace(/\r/g, '');
  }

  if (actual !== expected) {
    fs.writeFileSync(filename, expected + '\n', 'utf-8');
  }
};

if (require.main === module) {
  /**
   * @param {string[]} files
   */
  function load(...files) {
    for (let file of files) {
      if (file.indexOf(__dirname) !== 0) {
        file = path.resolve(__dirname, '..', '..', file);
      }

      if (!fs.existsSync(file)) {
        continue; // Ignore non-existent files
      }

      if (fs.statSync(file).isFile()) {
        if (path.extname(file) === '.json') {
          fixRedundantFlags(file);
        }

        continue;
      }

      const subFiles = fs.readdirSync(file).map(subfile => {
        return path.join(file, subfile);
      });

      load(...subFiles);
    }
  }

  if (process.argv[2]) {
    load(process.argv[2]);
  } else {
    load(
      'api',
      'css',
      'html',
      'http',
      'svg',
      'javascript',
      'mathml',
      'test',
      'webdriver',
      'webextensions',
    );
  }
}

module.exports = { removeRedundantFlags, fixRedundantFlags };
