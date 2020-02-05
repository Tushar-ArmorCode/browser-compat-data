#!/usr/bin/env node
/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';
const fs = require('fs');
const path = require('path');
const fixBrowserOrder = require('./fix-browser-order');
const fixFeatureOrder = require('./fix-feature-order');
const format = require('./fix-format');

/**
 * Recursively load one or more files and/or directories passed as arguments and perform automatic fixes.
 *
 * @param {string[]} files The files to load and perform fix upon
 * @returns {void}
 */
const load = (...files) => {
  for (let file of files) {
    if (file.indexOf(__dirname) !== 0) {
      file = path.resolve(__dirname, '..', file);
    }

    if (!fs.existsSync(file)) {
      console.warn('File not found, skipping:', file);
      continue; // Ignore non-existent files
    }

    if (fs.statSync(file).isFile()) {
      if (path.extname(file) === '.json') {
        fixBrowserOrder(file);
        fixFeatureOrder(file);
      }

      continue;
    }

    const subFiles = fs.readdirSync(file).map(subfile => {
      return path.join(file, subfile);
    });

    load(...subFiles);
  }
};

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

  format();
}
