/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import esMain from 'es-main';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { buildQuery, getRefDate, releaseYargsBuilder } from './utils.js';

const pullsBaseURL = new URL(
  'https://github.com/mdn/browser-compat-data/pulls',
);
const releaseNotesLabels = [
  'needs-release-note :newspaper:',
  'semver-major-bump 🚨',
  'semver-minor-bump ➕',
];

function queryToURL(query) {
  const searchUrl = new URL(pullsBaseURL);
  searchUrl.search = `q=${query}`;
  return searchUrl.href;
}

function appendLabel(query) {
  return `${query} label:${releaseNotesLabels.map((l) => `"${l}"`).join(',')}`;
}

function main({ start, end, quiet, allPRs, queryOnly }) {
  let query = buildQuery(end, start, !queryOnly);
  if (!allPRs) {
    query = appendLabel(query);
  }

  if (!quiet) {
    console.log(
      `From ${start} (${getRefDate(start)}) to ${end} (${getRefDate(end)}):`,
    );
    console.log();
  }

  if (queryOnly) {
    console.log(query);
  } else {
    console.log(queryToURL(query));
  }
}

if (esMain(import.meta)) {
  const { argv } = yargs(hideBin(process.argv)).command(
    '$0 [start-version-tag [end-version-tag]]',
    'Get a link to PRs labeled with "needs-release-note" and "semver-*" included between two tags (or other commits)',
    (yargs) => {
      releaseYargsBuilder(yargs);
      yargs.option('q', {
        alias: 'quiet',
        describe: 'Print the URL only',
        type: 'boolean',
      });
      yargs.option('all-prs', {
        describe:
          'Get all pull requests rather than just ones needing a release note',
        type: 'boolean',
      });
      yargs.option('query-only', {
        describe: 'Print the query only (such as for piping to `gh`)',
        type: 'boolean',
      });
      yargs.example(
        '$0 --quiet --query-only',
        'Get the query for piping to `gh`',
      );
    },
  );
  main({
    start: argv.startVersionTag,
    end: argv.endVersionTag,
    quiet: argv.quiet,
    allPRs: argv.allPrs,
    queryOnly: argv.queryOnly,
  });
}
