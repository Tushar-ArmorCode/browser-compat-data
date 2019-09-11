const chalk = require('chalk');

/**
 * @param {Identifier} apiData
 * @param {String} apiName
 * @param {import('../utils').Logger} logger
 */
function hasValidConstrutorDescription(apiData, apiName, logger) {
  const constructor = apiData[apiName];
  if (constructor && constructor.__compat.description !== `<code>${apiName}()</code> constructor`) {
      logger.error(chalk`{red Incorrect constructor description for {bold ${apiName}()}
Actual: {yellow "${constructor.__compat.description || ""}"}
Expected: {green "<code>${apiName}()</code> constructor"}}`);
  }
}

/**
 * @param {Identifier} apiData
 * @param {String} apiName
 * @param {import('../utils').Logger} logger
 */
function hasCorrectDOMEventsDescription(apiData, apiName, logger) {
  for (let methodName in apiData) {
    if (methodName.endsWith("_event")) {
      const event = apiData[methodName];
      const eventName = methodName.replace("_event", "");
      if (event.__compat.description !== `<code>${eventName}</code> event`) {
        logger.error(chalk`{red Incorrect event description for {bold ${apiName}#${methodName}}
Actual: {yellow "${event.__compat.description || ""}"}
Expected: {green "<code>${eventName}</code> event"}}`);
      }
    }
  }
}

/**
 * @param {Identifier} apiData
 * @param {String} apiName
 * @param {import('../utils').Logger} logger
 */
function hasCorrectSecureContextRequiredDescription(apiData, apiName, logger) {
  const secureContext = apiData.secure_context_required;
  if (secureContext && secureContext.__compat.description !== `Secure context required`) {
      logger.error(chalk`{red Incorrect secure context required description for {bold ${apiName}()}
Actual: {yellow "${secureContext.__compat.description || ""}"}
Expected: {green {bold "Secure context required"}}}`);
  }
}

/**
 * @param {Identifier} apiData
 * @param {String} apiName
 * @param {import('../utils').Logger} logger
 */
function hasCorrectWebWorkersDescription(apiData, apiName, logger) {
  const workerSupport = apiData.worker_support;
  if (workerSupport && workerSupport.__compat.description !== `Available in workers`) {
      logger.error(chalk`{red Incorrect worker support description for {bold ${apiName}()}
Actual: {yellow "${workerSupport.__compat.description || ""}"}
Expected: {green {bold "Available in workers"}}}`);
  }
}


/**
 * @param {string} filename
 */
function testGuidelines(filename) {
  /** @type {Identifier} */
  const data = require(filename);

  /** @type {string[]} */
  const errors = [];
  const logger = {
    /** @param {...unknown} message */
    error: (...message) => {
      errors.push(message.join(' '));
    },
  };

  if (data.api) {
    for (let apiName in data.api) {
      const apiData = data.api[apiName];
      hasValidConstrutorDescription(apiData, apiName, logger);
      hasCorrectDOMEventsDescription(apiData, apiName, logger);
      hasCorrectSecureContextRequiredDescription(apiData, apiName, logger);
      hasCorrectWebWorkersDescription(apiData, apiName, logger);
    }
  }

  if (errors.length) {
    console.error(chalk`{red   Guidelines – {bold ${errors.length}} ${errors.length === 1 ? 'error' : 'errors'}:}`);
    for (const error of errors) {
      console.error(`    ${error}`);
    }
    return true;
  }
  return false;
}

module.exports = testGuidelines;
