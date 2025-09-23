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

// Var helpers -----------------------------------------------------
// Just for centralizing the bru var access pattern

function getVar(bru, k) {
  return bru.getVar(k)
}

function getVars(bru, kv) {
  return Object.fromEntries(
    Object.entries(kv).map(([k]) => [k, getVar(bru, k)])
  );
}

function setVars(bru, kv) {
  Object.entries(kv).forEach(([k, v]) => bru.setVar(k, v));
}

function setVarsMessage(entityName) {
  console.info(`${entityName} data was cached correctly.`);
}

function wipeVars(bru, keys) {
  keys.forEach(k => bru.setVar(k, null));
}

function wipeVarsWarning(entityName) {
  console.warn(`${entityName} cached data was wiped because no record was found or multiple records were returned. Please check the input "Params".`);
}

// Single item picker --------------------------------------------------
function pickSingle(arr) {
  return Array.isArray(arr) && arr.length === 1 ? arr[0] : null;
}

// ID generators -----------------------------------------------------
function generateId() {
  const base = 1000010000;
  const maxIncrement = 899999999;
  return (base + Math.floor(Math.random() * maxIncrement)).toString();
}

function generateUUID() {
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

module.exports = {
  validateDependency,
  getVar,
  getVars,
  setVars,
  setVarsMessage,
  wipeVars,
  wipeVarsWarning,
  pickSingle,
  generateId,
  generateUUID
};
