/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import assert from 'node:assert/strict';

import { removeWebViewFlags } from './002-remove-webview-flags';

/**
 * @typedef {import('../../types').Identifier} Identifier
 */

/**
 * @constant {{input: Identifier, output: Identifier}[]} Objects of each test, with input and expected output
 */
const tests = [
  {
    input: {
      test1: {
        __compat: {
          support: {
            webview_android: {
              version_added: '61',
              flags: [
                {
                  type: 'preference',
                  name: '#service-worker-payment-apps',
                  value_to_set: 'Enabled',
                },
              ],
            },
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
    output: {
      test1: {
        __compat: {
          support: {
            webview_android: {
              version_added: false,
            },
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
  },
  {
    input: {
      test2: {
        __compat: {
          support: {
            webview_android: {
              version_added: true,
            },
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
    output: {
      test2: {
        __compat: {
          support: {
            webview_android: {
              version_added: true,
            },
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
  },
  {
    input: {
      test3: {
        __compat: {
          support: {
            webview_android: [
              {
                version_added: '40',
                flags: [
                  {
                    type: 'preference',
                    name: '#service-worker-payment-apps',
                    value_to_set: 'Enabled',
                  },
                ],
              },
              {
                version_added: '56',
              },
            ],
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
    output: {
      test3: {
        __compat: {
          support: {
            webview_android: {
              version_added: '56',
            },
          },
          status: {
            experimental: true,
            standard_track: false,
            deprecated: false,
          },
        },
      },
    },
  },
];

describe('migration scripts', () => {
  it('`removeWebViewFlags()` works correctly', () => {
    for (const test of tests) {
      const expected = test.output;
      const output = JSON.parse(JSON.stringify(test.input), removeWebViewFlags);
      assert.deepStrictEqual(output, expected);
    }
  });
});
