/**
 * IMPORTANT:
 * Duplicate of SIS/utils.js (see that file for notes). Keep in sync.
 */

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
  const value = getVar(bru, variableName);
  if (value !== undefined && value !== null && value !== '') {
    return true;
  }

  const baseMsg = `Run "${dependencyName}" first to populate it. Missing required variable "${variableName}". `;
  const fullMsg = actionHint ? `${baseMsg} \n\n > ${actionHint}` : baseMsg;

  if (throwOnMissing) {
    console.error(fullMsg);
    throw new Error(fullMsg);
  } else {
    console.warn(fullMsg);
    return false;
  }
}

// Descriptor helpers -------------------------------------------------
function extractDescriptor(value) {
  // keeps pop logic centralized and token standarized 
  return typeof value === 'string' ? value.split('#').pop() : value;
}

function mapDescriptors(items, accessorFn) {
  // keeps map logic centralized
  if (!Array.isArray(items)) return [];
  return items.map(it => extractDescriptor(accessorFn(it)));
}

function joinDescriptors(items) {
  // keeps join logic centralized and token standarized
  if (!Array.isArray(items)) return '';
  return items.join(', ');
}

// just wrappers around bru methods for consistency and centralization
function getVar(bru, key) {
  return bru.getVar(key);
}

function setVar(bru, key, value) {
  bru.setVar(key, value);
}

function wipeVar(bru, key) {
  bru.deleteVar(key);
}

// Variable helpers -----------------------------------------------------
function getVars(bru, keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return {};
  return Object.fromEntries(keys.map(k => [k, getVar(bru, k)]));
} 

function setVars(bru, kv, entityName = null) {
  Object.entries(kv).forEach(([k, v]) => setVar(bru, k, v));
  if (entityName) setVarsMessage(entityName);
}

function setVarsMessage(entityName) {
  console.log(`${entityName} data was cached correctly.`);
}

function wipeVars(bru, keys, entityName = null, throwError = false) {
  keys.forEach(k => wipeVar(bru, k));
  if (entityName) wipeVarsWarning(entityName);
  if (throwError) throwNotFoundOrSpecificError(entityName);
}

function wipeVarsWarning(entityName) {
  console.warn(`${entityName} cached data was wiped because no record was found or multiple records were returned. Please check the input "Params".`);
}

function throwNotFoundOrSpecificError(entityName) {
  throw new Error(`No ${entityName} found, or multiple records were returned. Check your parameters and try again.`);
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


// Change expectation helper ------------------------------------------
function expectChanged(previous, current, label) {
  test(`${label} changed`, () => {
    expect(current).not.equals(previous);
  });
}

// Positive (equality) expectation helper --------------------------------
function expectUnchanged(previous, current, label) {
  test(`${label} unchanged`, () => {
    expect(current).equals(previous);
  });
}

module.exports = {
  validateDependency,
  extractDescriptor,
  mapDescriptors,
  joinDescriptors,
  getVar,
  getVars,
  setVar,
  setVars,
  setVarsMessage,
  wipeVar,
  wipeVars,
  wipeVarsWarning,
  pickSingle,
  generateId,
  expectChanged,
  expectUnchanged,
  throwNotFoundOrSpecificError
};