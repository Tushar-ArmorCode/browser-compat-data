const assert = require('assert');

const bcd = require('..');

function testToken(feature, matches, misses) {
  const str = feature.__compat.matches.regex_token || feature.__compat.matches.regex_value;
  const regexp = new RegExp(str);

  matches.forEach(match => assert.ok(regexp.test(match), `${regexp} did not match ${match}`));
  misses.forEach(miss => assert.ok(!regexp.test(miss), `${regexp} erroneously matched ${miss}`));
}

const tests = [
  {
    features: [
      bcd.css.properties.color.alpha_hexadecimal_notation
    ],
    matches: [
      '#003399ff',
      '#0af9',
    ],
    misses: [
      '#00aaff',
      '#0af',
      'green',
      '#greenish',
    ]
  },
  {
    features: [
      css.properties['transform-origin'].three_value_syntax
    ],
    matches: [
      '2px 30% 10px',  // length, percentage, length
      'right bottom -2cm',  // two keywords and length
      'calc(50px - 25%) 2px 1px'  // lengths with calc
    ],
    misses: [
      'center',  // one value syntax
      'left 5px',  // two value syntax
      'left calc(10px - 50%)'  // two value syntax with calc
    ]
  }
];

tests.forEach(({features, matches, misses}) => {
  features.forEach(feature => testToken(feature, matches, misses));
});
