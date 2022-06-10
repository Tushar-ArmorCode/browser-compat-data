/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import chalk from 'chalk-template';
import bcd from '../../index.js';
const { browsers } = bcd;

/**
 * @param {SupportBlock} support
 * @returns boolean
 */
export function neverImplemented(support) {
  for (const s in support) {
    let data = support[s];
    if (!Array.isArray(data)) data = [data];
    for (const d of data) if (d.version_added) return false;
  }
  return true;
}

const errorTime = new Date(),
  warningTime = new Date();
errorTime.setFullYear(errorTime.getFullYear() - 2.5);
warningTime.setFullYear(warningTime.getFullYear() - 2);

/**
 * @param {*} browsers
 * @param {SupportBlock} support
 * @returns 'warning' | 'error' | false
 */
function implementedAndRemoved(browsers, support) {
  /**
   * @type {false | 'warning' | 'error'}
   */
  let result = 'error';
  for (const browser in support) {
    let data = support[browser];
    // Feature is still supported
    if (!data.version_removed) return false;
    const releaseDate = new Date(
      browsers[browser].releases[data.version_removed].release_date,
    );
    // Feature was recently supported, no need to show warning
    if (warningTime < releaseDate) return false;
    // Feature was supported sufficiently recently to not show an error
    if (errorTime < releaseDate) result = 'warning';
  }
  return result;
}

/**
 * @param {Logger} logger
 * @param {CompatStatement} data The data to test
 * @param {object} browsers
 * @returns {void}
 */
function processData(logger, data, browsers) {
  if (data && data.support) {
    const { support, status } = data;

    const abandoned = status && status.standard_track === false;
    const rule1Fail = abandoned && neverImplemented(support);
    if (rule1Fail) {
      logger.error(
        chalk`feature was never implemented in any browser and the specification has been abandoned.`,
      );
      return;
    }

    // Note: This check is time-based
    const rule2Fail = implementedAndRemoved(browsers, support);
    if (rule2Fail) {
      logger[rule2Fail](
        chalk`feature was implemented and has since been removed from all browsers dating back two or more years ago.`,
      );
    }
  }
}

export default {
  name: 'Obsolete',
  description: 'Test for obsolete data in each support statement',
  scope: 'feature',
  check(logger, { data }) {
    processData(logger, data, browsers);
  },
  exceptions: [
    'api.VRDisplay.hardwareUnitId',
    'api.VREyeParameters.recommendedFieldOfView',
    'api.VREyeParameters.renderRect',
    'api.VRFieldOfView.VRFieldOfView',
    'api.VRPose.hasOrientation',
    'api.VRPose.hasPosition',
    'css.types.length.lh',
    'css.types.length.rlh',
    'http.headers.Cache-Control.stale-if-error',
    'http.headers.Feature-Policy.layout-animations',
    'http.headers.Feature-Policy.legacy-image-formats',
    'http.headers.Feature-Policy.oversized-images',
    'http.headers.Feature-Policy.unoptimized-images',
    'http.headers.Feature-Policy.unsized-media',
    'svg.attributes.presentation.color-rendering',
    'svg.elements.view.zoomAndPan',
  ],
};
