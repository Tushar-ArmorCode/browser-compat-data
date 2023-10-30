/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import chalk from 'chalk-template';

/**
 * newBrowserEntry - Add a new browser entry in the JSON list
 * @param {object} json json file to update
 * @param {object} browser the entry name where to add it in the bcd file
 * @param {string} version new version to add
 * @param {string} status new status
 * @param {string} engine name of the engine
 * @param {string} releaseDate new release date
 * @param {string} releaseNotesURL url of the release notes
 */
export const newBrowserEntry = (
  json,
  browser,
  version,
  status,
  engine,
  releaseDate,
  releaseNotesURL,
) => {
  const release = (json.browsers[browser].releases[version] = new Object());
  if (releaseDate) {
    release['release_date'] = releaseDate;
  }
  if (releaseNotesURL) {
    release['release_notes'] = releaseNotesURL;
  }
  release['status'] = status;
  release['engine'] = engine;
  release['engine_version'] = version.toString();
  console.log(
    chalk`{yellow - New release detected for {bold ${browser}}: Version {bold ${version}} as a {bold ${status}} release. }`,
  );
};

/**
 * updateBrowserEntry - Update browser entry in the JSON list
 * @param {object} json json file to update
 * @param {object} browser the entry name where to add it in the bcd file
 * @param {string} version new version to add
 * @param {string} releaseDate new release date
 * @param {string} status new status
 * @param {string} releaseNotesURL url of the release notes
 */
export const updateBrowserEntry = (
  json,
  browser,
  version,
  releaseDate,
  status,
  releaseNotesURL,
) => {
  const entry = json.browsers[browser].releases[version];
  if (entry['status'] !== status) {
    console.log(
      chalk`{cyan - New status for {bold ${browser} ${version}}: {bold ${status}}, previously ${entry['status']}}`,
    );
    entry['status'] = status;
  }
  if (entry['release_date'] !== releaseDate) {
    console.log(
      chalk`{cyan - New release date for {bold ${browser} ${version}}: {bold ${releaseDate}}, previously ${entry['release_date']}}`,
    );
    entry['release_date'] = releaseDate;
  }
  if (releaseNotesURL && entry['release_notes'] !== releaseNotesURL) {
    console.log(
      chalk`{cyan - New release notes for {bold ${browser} ${version}}: {bold ${releaseNotesURL}}, previously ${entry['release_notes']}}`,
    );
    entry['release_notes'] = releaseNotesURL;
  }
};
