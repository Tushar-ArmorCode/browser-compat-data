#!/usr/bin/env node
/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

'use strict';
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { platform } = require('os');

const { removeWebViewFlags } = require('./002-remove-webview-flags.js');

const tests = [
  [
    {
      "test1": {
        "__compat": {
          "support": {
            "webview_android": {
              "version_added": "61",
              "flags": [
                {
                  "type": "preference",
                  "name": "#service-worker-payment-apps",
                  "value_to_set": "Enabled"
                }
              ]
            }
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    },
    {
      "test1": {
        "__compat": {
          "support": {
            "webview_android": {
              "version_added": false
            }
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    }
  ],
  [
    {
      "test2": {
        "__compat": {
          "support": {
            "webview_android": {
              "version_added": true
            }
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    },
    {
      "test2": {
        "__compat": {
          "support": {
            "webview_android": {
              "version_added": true
            }
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    }
  ],
  [
    {
      "test3": {
        "__compat": {
          "support": {
            "webview_android": [
              {
                "version_added": "40",
                "flags": [
                  {
                    "type": "preference",
                    "name": "#service-worker-payment-apps",
                    "value_to_set": "Enabled"
                  }
                ]
              },
              {
                "version_added": "56"
              }
            ]
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    },
    {
      "test3": {
        "__compat": {
          "support": {
            "webview_android": {
              "version_added": "56"
            }
          },
          "status": {
            "experimental": true,
            "standard_track": false,
            "deprecated": false
          }
        }
      }
    }
  ]
];

const testFixWebViewFlags = (logger = console) => {
  var hasErrors = false;
  for (let i = 0; i < tests.length; i++) {
    let expected = JSON.stringify(tests[i][1], null, 2);
    let output = JSON.stringify(JSON.parse(JSON.stringify(tests[i][0]), removeWebViewFlags), null, 2);

    if (output !== expected) {
      logger.error(chalk`WebView flags aren't removed properly!\n      Actual: {yellow ${output}}\n      Expected: {green ${expected}}`);
      hasErrors = true;
    }
  }

  return hasErrors;
}

if (require.main === module) {
  testFixWebViewFlags();
}

module.exports = testFixWebViewFlags;
