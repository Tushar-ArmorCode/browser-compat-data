/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import esMain from 'es-main';
import ora from 'ora';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk-template';

import {
  testBrowsersData,
  testBrowsersPresence,
  testConsistency,
  testDescriptions,
  testLinks,
  testNotes,
  testPrefix,
  testSchema,
  testStatus,
  testStyle,
  testVersions,
} from './linter/index.js';
import { IS_CI, pluralize } from './utils.js';

const dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {object} */
const spinner = ora({
  stream: process.stdout,
});

/**
 * Recursively checks files for any errors.
 *
 * @param {string[]} files The files to test
 * @returns {object} Errors by relative file path.
 */
const checkFiles = (...files) => {
  let errors = {};
  for (let file of files) {
    if (file.indexOf(dirname) !== 0) {
      file = path.resolve(dirname, '..', file);
    }

    if (!fs.existsSync(file)) {
      console.warn(chalk`{yellow File {bold ${file}} doesn't exist!}`);
      return;
    }

    if (fs.statSync(file).isFile() && path.extname(file) === '.json') {
      const relativeFilePath = path.relative(process.cwd(), file);

      spinner.text = relativeFilePath;

      if (!IS_CI) {
        // Continuous integration environments don't allow overwriting
        // previous lines using VT escape sequences, which is how
        // the spinner animation is implemented.
        spinner.start();
      }

      // Catch console errors and report them as file errors
      const console_error = console.error;
      console.error = (...args) => {
        if (!(relativeFilePath in errors)) {
          // Set spinner to failure when first error is found
          // Setting on every error causes duplicate output
          spinner['stream'] = process.stderr;
          spinner.fail(chalk`{red.bold ${relativeFilePath}}`);

          errors[relativeFilePath] = [];
        }
        console_error(...args);
        errors[relativeFilePath].push(...args);
      };

      try {
        if (file.indexOf('browsers' + path.sep) !== -1) {
          testSchema(file, './../../schemas/browsers.schema.json');
          testLinks(file);
          testBrowsersData(file);
        } else {
          testBrowsersPresence(file);
          testConsistency(file);
          testDescriptions(file);
          testLinks(file);
          testPrefix(file);
          testSchema(file);
          testStatus(file);
          testStyle(file);
          testVersions(file);
          testNotes(file);
        }
      } catch (e) {
        console.error(e);
      }

      // Reset console.error
      console.error = console_error;

      if (!(relativeFilePath in errors)) {
        spinner.succeed();
      }
    }

    if (fs.statSync(file).isDirectory()) {
      const subFiles = fs.readdirSync(file).map((subfile) => {
        return path.join(file, subfile);
      });

      errors = { ...errors, ...checkFiles(...subFiles) };
    }
  }

  return errors;
};

/**
 * Test for any errors in specified file(s) and/or folder(s), or all of BCD
 *
 * @param {?string} files The file(s) and/or folder(s) to test. Leave null for everything.
 * @returns {boolean} Whether there were any errors
 */
const main = (
  files = [
    'api',
    'browsers',
    'css',
    'html',
    'http',
    'svg',
    'javascript',
    'mathml',
    'webdriver',
    'webextensions',
  ],
) => {
  const errors = checkFiles(...files);

  const filesWithErrors = Object.keys(errors).length;

  if (filesWithErrors) {
    console.error('');
    console.error(
      chalk`{red Problems in {bold ${pluralize('file', filesWithErrors)}}:}`,
    );

    for (const [fp, errorMsgs] of Object.entries(errors)) {
      console.error(chalk`{red.bold ✖ ${fp}}`);
      for (const error of errorMsgs) {
        console.error(error);
      }
    }
  }

  return filesWithErrors > 0;
};

if (esMain(import.meta)) {
  const { argv } = yargs(hideBin(process.argv)).command(
    '$0 [files..]',
    false,
    (yargs) =>
      yargs.positional('files...', {
        description: 'The files to lint (leave blank to test everything)',
        type: 'string',
      }),
  );

  process.exit(main(argv.files) ? 1 : 0);
}

export default main;
