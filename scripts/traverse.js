/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import esMain from 'es-main';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import bcd from '../index.js';

/**
 * @typedef {import('../../types').Identifier} Identifier
 */

/**
 * Traverse all of the features within a specified object and find all features that have one of the specified values
 *
 * @param {Identifier} obj The compat data to traverse through
 * @param {string[]} browsers The browsers to test for
 * @param {string[]} values The values to test for
 * @param {number} depth The depth to traverse
 * @param {string} identifier The identifier of the current object
 * @returns {void}
 */
function* iterateFeatures(obj, browsers, values, depth, identifier) {
  depth--;
  if (depth >= 0) {
    for (const i in obj) {
      if (!!obj[i] && typeof obj[i] == 'object' && i !== '__compat') {
        if (obj[i].__compat) {
          const comp = obj[i].__compat.support;
          for (const browser of browsers) {
            let browserData = comp[browser];

            if (!browserData) {
              if (values.length == 0 || values.includes('null'))
                yield `${identifier}${i}`;
              continue;
            }
            if (!Array.isArray(browserData)) {
              browserData = [browserData];
            }

            for (const range in browserData) {
              if (browserData[range] === undefined) {
                if (values.length == 0 || values.includes('null'))
                  yield `${identifier}${i}`;
              } else if (
                values.length == 0 ||
                values.includes(String(browserData[range].version_added)) ||
                values.includes(String(browserData[range].version_removed))
              ) {
                let f = `${identifier}${i}`;
                if (browserData[range].prefix)
                  f += ` (${browserData[range].prefix} prefix)`;
                if (browserData[range].alternative_name)
                  f += ` (as ${browserData[range].alternative_name})`;
                yield f;
              }
            }
          }
        }
        yield* iterateFeatures(
          obj[i],
          browsers,
          values,
          depth,
          identifier + i + '.',
        );
      }
    }
  }
}

/**
 * Traverse all of the features within a specified object and find all features that have one of the specified values
 *
 * @param {Identifier} obj The compat data to traverse through
 * @param {string[]} browsers The browsers to traverse for
 * @param {string[]} values The version values to traverse for
 * @param {number} depth The depth to traverse
 * @param {string} identifier The identifier of the current object
 * @returns {void}
 */
function traverseFeatures(obj, browsers, values, depth, identifier) {
  const features = Array.from(
    iterateFeatures(obj, browsers, values, depth, identifier),
  );

  return features.filter((item, pos) => features.indexOf(item) == pos);
}

const main = (
  folders = [
    'api',
    'css',
    'html',
    'http',
    'svg',
    'javascript',
    'mathml',
    'webdriver',
  ],
  browsers = Object.keys(bcd.browsers),
  values = ['null', 'true'],
  depth = 100,
) => {
  let features = [];

  for (const folder in folders) {
    features.push(
      ...traverseFeatures(
        bcd[folders[folder]],
        browsers,
        values,
        depth,
        folders[folder] + '.',
      ),
    );
  }

  return features;
};

if (esMain(import.meta)) {
  const { argv } = yargs(hideBin(process.argv)).command(
    '$0 [folder...]',
    'Print feature names in the folder (and optionally filter features to specific browser or version values)',
    (yargs) => {
      yargs
        .positional('folder', {
          describe: 'The folder(s) to traverse',
          type: 'array',
          default: Object.keys(bcd).filter((k) => k !== 'browsers'),
        })
        .option('browser', {
          alias: 'b',
          describe: 'Filter by a browser. May repeat.',
          type: 'array',
          nargs: 1,
          default: Object.keys(bcd.browsers),
        })
        .option('filter', {
          alias: 'f',
          describe: 'Filter by version value. May repeat.',
          type: 'array',
          nargs: 1,
          default: [],
        })
        .option('non-real', {
          describe:
            'Filter to features with non-real values. Alias for "-f true -f null"',
          type: 'boolean',
          nargs: 0,
        })
        .option('depth', {
          alias: 'd',
          describe:
            'Depth of features to traverse (ex. "2" will capture "api.CSSStyleSheet.insertRule" but not "api.CSSStyleSheet.insertRule.optional_index")',
          type: 'number',
          nargs: 1,
          default: 10,
        })
        .example(
          'npm run traverse -- --browser=safari --non-real',
          'Find all features containing non-real Safari entries',
        )
        .example(
          'npm run traverse -- -b webview_android -f true',
          'Find all features marked as true for WebVeiw',
        )
        .example(
          'npm run traverse -- -b firefox -f 10',
          'Find all features marked as supported since Firefox 10',
        );
    },
  );

  const filter = [...argv.filter, ...(argv.nonReal ? ['true', 'null'] : [])];

  const features = main(argv.folder, argv.browser, filter, argv.depth);
  console.log(features.join('\n'));
  console.log(features.length);
}

export default main;
