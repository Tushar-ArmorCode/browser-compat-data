/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import { BrowserName } from '../../types/types.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compareVersions from 'compare-versions';
import esMain from 'es-main';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import bcd from '../index.js';
import { IS_WINDOWS } from '../test/utils.js';

const dirname = fileURLToPath(new URL('.', import.meta.url));

const getEarliestVersion = (...args: string[]) => {
  const versions = args
    .filter((version) => typeof version === 'string' && version !== 'preview')
    .map((version) => version.replace('≤', ''));

  let earliestVersion;

  for (const version of versions) {
    if (
      !earliestVersion ||
      earliestVersion === 'preview' ||
      (version !== 'preview' &&
        compareVersions.compare(earliestVersion, version, '>'))
    )
      earliestVersion = version;
  }

  return earliestVersion;
};

export const removeRedundantFlags = (
  key: string,
  value: any,
  limitBrowser: BrowserName | null,
  cutoffDate: Date,
) => {
  if (key === '__compat') {
    for (const [browser, rawSupportData] of Object.entries(value.support)) {
      if (limitBrowser && browser != limitBrowser) continue;

      const supportData = Array.isArray(rawSupportData)
        ? rawSupportData
        : [rawSupportData];
      const result = [];

      const simpleStatement = supportData.find((statement) => {
        const ignoreKeys = new Set([
          'version_removed',
          'notes',
          'partial_implementation',
        ]);
        const keys = Object.keys(statement).filter(
          (key) => !ignoreKeys.has(key),
        );
        return keys.length === 1;
      });

      for (let i = 0; i < supportData.length; i++) {
        let addData = true;

        if (supportData[i].flags) {
          const versionToCheck = getEarliestVersion(
            supportData[i].version_removed ||
              (simpleStatement && simpleStatement.version_added),
            simpleStatement && simpleStatement.version_added,
          );

          if (typeof versionToCheck === 'string') {
            const releaseDate = new Date(
              bcd.browsers[browser].releases[versionToCheck].release_date,
            );

            if (
              (!(simpleStatement && simpleStatement.version_removed) ||
                compareVersions.compare(
                  supportData[i].version_added.replace('≤', ''),
                  simpleStatement.version_removed.replace('≤', ''),
                  '<',
                )) &&
              releaseDate <= cutoffDate
            ) {
              addData = false;
            }
          }
        }

        if (addData) result.push(supportData[i]);
      }

      if (result.length == 1) {
        value.support[browser] = result[0];
      } else if (result.length == 0) {
        value.support[browser] = { version_added: false };
      } else {
        value.support[browser] = result;
      }
    }
  }
  return value;
};

export const fixRedundantFlags = (
  filename: string,
  limitBrowser: BrowserName | null,
  cutoffDate: Date,
) => {
  let actual = fs.readFileSync(filename, 'utf-8').trim();
  let expected = JSON.stringify(
    JSON.parse(actual, (k, v) =>
      removeRedundantFlags(k, v, limitBrowser, cutoffDate),
    ),
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

const main = (
  files_or_folders: string[],
  browser: BrowserName | null,
  cutoffDate: Date,
) => {
  for (let file of files_or_folders) {
    if (file.indexOf(dirname) !== 0) {
      file = path.resolve(dirname, '..', file);
    }

    if (!fs.existsSync(file)) {
      continue; // Ignore non-existent files
    }

    if (fs.statSync(file).isFile()) {
      if (path.extname(file) === '.json') {
        fixRedundantFlags(file, browser, cutoffDate);
      }

      continue;
    }

    const subFiles = fs.readdirSync(file).map((subfile) => {
      return path.join(file, subfile);
    });

    main(subFiles, browser, cutoffDate);
  }
};

if (esMain(import.meta)) {
  const { argv } = yargs(hideBin(process.argv)).command(
    '$0 [file]',
    'Remove data for flags that have been removed two years back or more',
    (yargs) => {
      yargs
        .positional('file', {
          describe: 'The file(s) and/or folder(s) to test',
          type: 'string',
          array: true,
          default: [
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
          ],
        })
        .option('browser', {
          alias: 'b',
          describe: 'The browser to test for',
          type: 'string',
        });
    },
  );

  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

  main((argv as any).file, (argv as any).browser, cutoffDate);
}
