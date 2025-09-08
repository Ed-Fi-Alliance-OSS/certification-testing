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

// Env var helpers -----------------------------------------------------
function setVars(bru, kv) {
  Object.entries(kv).forEach(([k, v]) => bru.setEnvVar(k, v));
}

function setVarsMessage(entityName) {
  console.info(`${entityName} data was cached correctly.`);
}

function wipeVars(bru, keys) {
  keys.forEach(k => bru.setEnvVar(k, null));
}

function wipeVarsWarning(entityName) {
  console.warn(`${entityName} cached data was wiped because no record was found or multiple records were returned. Please check the input "Params".`);
}

// Single item picker --------------------------------------------------
function pickSingle(arr) {
  return Array.isArray(arr) && arr.length === 1 ? arr[0] : null;
}

// Generic log builder -------------------------------------------------
function buildLogObject(source, spec) {
  return Object.entries(spec).reduce((acc, [k, resolver]) => {
    if (typeof resolver === 'function') acc[k] = resolver(source);
    else {
      // path string
      acc[k] = resolver.split('.').reduce((val, p) => (val ? val[p] : undefined), source);
    }
    return acc;
  }, {});
}

function logScenario(name, source, spec, filterKeys, filterFn = filterObjectByKeys) {
  const fullObj = buildLogObject(source, spec);
  const finalObj = filterFn(fullObj, filterKeys);
  console.info(name, JSON.stringify(finalObj, null, 2));
  return finalObj;
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

// Export spec builders (optional central definitions) -----------------
const logSpecCalendar = {
  calendarCode: 'calendarCode',
  schoolId: r => r.schoolReference.schoolId,
  schoolYear: r => r.schoolYearTypeReference.schoolYear,
  calendarTypeDescriptor: r => extractDescriptor(r.calendarTypeDescriptor),
  gradeLevels: r => mapDescriptors(r.gradeLevels, gl => gl.gradeLevelDescriptor)
};

const logSpecCalendarDate = {
  date: 'date',
  calendarCode: r => r.calendarReference.calendarCode,
  schoolId: r => r.calendarReference.schoolId,
  schoolYear: r => r.calendarReference.schoolYear,
  calendarEvents: r => mapDescriptors(r.calendarEvents, ev => ev.calendarEventDescriptor)
};

module.exports = {
  validateDependency,
  filterObjectByKeys,
  extractDescriptor,
  mapDescriptors,
  joinDescriptors,
  setVars,
  setVarsMessage,
  wipeVars,
  wipeVarsWarning,
  pickSingle,
  buildLogObject,
  logScenario,
  expectChanged,
  expectUnchanged,
  logSpecCalendar,
  logSpecCalendarDate
};
