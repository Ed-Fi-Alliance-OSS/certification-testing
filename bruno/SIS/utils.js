// utility.js
/**
 * validateDependency
 * Ensures a required environment variable is present before executing a request.
 * If missing, it throws a descriptive error instructing the user which prior step to run.
 *
 * @param {object} bru - Bruno runtime object (provides getEnvVar, etc.).
 * @param {string} variableName - Name of the environment variable to validate.
 * @param {string} dependencyName - Human-friendly name of the prerequisite request / step.
 * @param {object} [opts] - Optional settings.
 * @param {boolean} [opts.throwOnMissing=true] - Whether to throw (default) or just log a warning.
 * @param {string} [opts.actionHint] - Optional extra hint appended to the message.
 *
 * @returns {boolean} true if variable exists; false otherwise (only when throwOnMissing = false)
 */
function validateDependency(bru, variableName, dependencyName, opts = {}) {
  const { throwOnMissing = true, actionHint } = opts;
  const value = bru.getEnvVar(variableName);
  if (value !== undefined && value !== null && value !== '') {
    return true;
  }

  const baseMsg = `Missing required variable "${variableName}". Run "${dependencyName}" first to populate it.`;
  const fullMsg = actionHint ? `${baseMsg} ${actionHint}` : baseMsg;

  if (throwOnMissing) {
    console.error(fullMsg);
    throw new Error(fullMsg);
  } else {
    console.warn(fullMsg);
    return false;
  }
}

/**
 * filterObjectByKeys
 * Returns a new object with only the specified keys from the original object.
 * If the keys array is empty or not provided, returns the original object.
 *
 * @param {object} obj - The source object.
 * @param {array} keys - The keys to pick from the source object.
 *
 * @returns {object} A new object with only the picked keys.
 */
function filterObjectByKeys(obj, keys) {
  if (!Array.isArray(keys) || keys.length === 0) return obj;
  return keys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}

module.exports = {
  validateDependency,
  filterObjectByKeys
};
