/**
 * NOTE: When trying to share the utils.js file in the parent directory for all collections, 
 * Bruno sandbox appears to block parent directory traversal for require() in some contexts. 
 * Because of that, we keep a self‑contained copy of the utilities inside each collection. 
 * 
 * Keep this file in sync with the equivalent one under Sample Data and/or Assessment.
 */

let dayjs;
try {
  dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  dayjs.extend(utc);
  try {
    const timezone = require('dayjs/plugin/timezone');
    dayjs.extend(timezone);
  } catch (tzErr) {
    // timezone plugin not available; will fallback
  }
} catch (e) {
  // optional dependency not installed
}

const CENTRAL_TZ = 'America/Chicago';

// Helper to annotate a date string (adds relative tag + CST conversion)
function annotateDate(date) {
  if (!date || !dayjs) return date; // Fallback: no date or no dayjs

  // Parse as UTC first
  let dUtc = dayjs.utc(date);
  if (!dUtc.isValid()) return date;

  // Convert to CST (America/Chicago) if tz plugin present; else fallback offset
  let dCst;
  if (typeof dUtc.tz === 'function') {
    dCst = dUtc.tz(CENTRAL_TZ);
  } else {
    // Fallback: assume standard -6 offset (does not handle DST)
    dCst = dUtc.add(-6, 'hour');
  }

  // Format CST
  const cstFormatted = dCst.format('YYYY-MM-DDTHH:mm:ss[Z]'); // keep consistent shape
  const todayCst = (typeof dayjs().tz === 'function') ? dayjs().tz(CENTRAL_TZ) : dayjs();

  let relativeTag = '';
  if (dCst.isSame(todayCst, 'day')) relativeTag = ' (today)';
  else if (dCst.isBefore(todayCst, 'day')) relativeTag = ' (before today)';

  return `${cstFormatted} (CST)${relativeTag}`;
}

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
  console.info(`${entityName} data was cached correctly.`);
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

// Generic log builder -------------------------------------------------
function buildLogObject(source, spec) {
  try {
    return Object.entries(spec).reduce((acc, [k, resolver]) => {
      if (typeof resolver === 'function') acc[k] = resolver(source);
      else {
        // path string
        acc[k] = resolver.split('.').reduce((val, p) => (val ? val[p] : undefined), source);
      }
      return acc;
    }, {});
  } catch (error) {
    console.error('Error building log object:', error);
    return {};
  }
}

/**
 * logScenario
 * Extracts a canonical subset of a raw API response (actualResponse) using a specification map
 * (spec) plus an optional list of keys (filterKeys) and logs it in a consistent format.
 *
 * Flow:
 *  1. buildLogObject(actualResponse, spec) produces a flat object of resolved fields.
 *     - Each spec entry can be:
 *         a) A path string: "schoolReference.schoolId"
 *         b) A resolver function: r => r.schoolReference.schoolId
 *  2. filterFn (default: filterObjectByKeys) narrows the object to only the keys in filterKeys.
 *  3. Logs the final subset as JSON for traceability:
 *       "<EntityName> - Scenario <ScenarioName> - API Response: { ... }"
 *
 * Use cases:
 *  - Standardizing output across different test steps.
 *  - Ensuring only relevant fields appear in logs (noise reduction).
 *
 * @param {string} entityName       Logical entity label (e.g. "Class Period").
 * @param {string} scenarioName     Scenario / request name (often this.req.name).
 * @param {object} actualResponse   Raw response object from Bruno (res.getBody()).
 * @param {object} spec             Field resolution map (see buildLogObject docs).
 * @param {string[]} filterKeys     Optional - Keys to include in the final log (if omitted, all spec keys kept).
 * @param {Function} [filterFn=filterObjectByKeys] Optional - Custom filtering strategy.
 *
 * @returns {object} finalObj       The filtered/logged object (helpful for chaining or assertions).
 *
 * @example
 * // Given:
 * // const spec = { classPeriodName: r => r.classPeriodName, schoolId: 'schoolReference.schoolId' };
 * // logScenario('Class Period', '01 - Fetch', responseBody, spec, ['classPeriodName']);
 * //
 * // Console:
 * // Class Period - Scenario 01 - Fetch - API Response: {
 * //   "classPeriodName": "PERIOD 1"
 * // }
 */
function logScenario(entityName, scenarioName, actualResponse, spec, filterKeys, filterFn = filterObjectByKeys) {
  const fullObj = buildLogObject(actualResponse, spec);
  const finalActualResponse = filterFn(fullObj, filterKeys);
  console.info(`${entityName} - Scenario ${scenarioName} - API Response:`, JSON.stringify(finalActualResponse, null, 2));
  return finalActualResponse;
}

/**
 * logExpectedVsActual
 * Logs two separate JSON blocks: the actual subset (derived from `actualResponse`
 * using the `specification` map) and the expected values you provide.
 *
 * Use when you want a simple, unmerged comparison (as opposed to
 * logActualAndExpectedMerged which interleaves values).
 *
 * Extraction:
 *  - Each entry in `specification` can be a path string (e.g. "schoolReference.schoolId")
 *    or a resolver function (r => r.schoolReference.schoolId).
 *  - Only keys present in `expected` are picked from the built log object.
 *
 * @param {string} entityName          Entity name for console output.
 * @param {object} actualResponse      Raw response object.
 * @param {object} specification       Map of fields to extract (path strings or resolver fns).
 * @param {object} expectedResponse    Key/value map of expected values.
 * @param {Function} [filterFn]        Optional - Filter function (defaults to filterObjectByKeys).
 *
 * @returns {object} actualSubset The filtered actual object that was logged.
 *
 * @example
 * logExpectedVsActual(
 *   'ClassPeriod Check',
 *   responseBody,
 *   logSpecClassPeriod,
 *   { classPeriodName: 'FIRST PERIOD', schoolId: 123 }
 * );
 */
function logExpectedVsActual(entityName, actualResponse, specification, expectedResponse, filterFn = filterObjectByKeys) {
  const fullObj = buildLogObject(actualResponse, specification);
  const filterKeys = Object.keys(expectedResponse);
  const finalActualResponse = filterFn(fullObj, filterKeys);
  console.info(`${entityName} - Actual:`, JSON.stringify(finalActualResponse, null, 2));
  console.info(`${entityName} - Expected:`, JSON.stringify(expectedResponse, null, 2));
  return finalActualResponse;
}

/**
 * logActualAndExpectedMerged
 * Produces a side‑by‑side, ordered structure of actual vs expected values and logs it.
 * For each key in `expected`, two properties are emitted (in order):
 *   1) <key>                -> actual value
 *   2) <✓|✗>-<key>-expected -> expected value (key is prefixed with a match symbol)
 *
 * Matching rules:
 *   - If ignoreCase = true and both values are strings, comparison is case-insensitive.
 *   - If an expected value is undefined/null/empty, it is shown as "(Not Provided)" and treated as matched.
 *
 * Extra:
 *   - When displayLastModifiedDate = true, adds lastModifiedDate annotated with (today) if applicable.
 *   - Date annotation uses annotateDate().
 *
 * @param {string} entityName       Logical entity name (e.g. "Class Period").
 * @param {string} scenarioName     Scenario or request name.
 * @param {object} actualResponse   Raw response object.
 * @param {object} specification    Spec map used by buildLogObject to extract canonical fields (not all must appear in expected).
 * @param {object} expected         Key/value map of expected values to compare.
 * @param {object} [options]        OPTIONAL settings.
 * @param {string} [options.suffix='-expected']  Suffix appended after the original key before symbol.
 * @param {Function} [options.filterFn]          Function to filter actual fields (defaults to filterObjectByKeys).
 * @param {Object} [options.matchSymbols]        Symbols used for match / mismatch (default ✓ / ✗).
 * @param {boolean} [options.ignoreCase=true]    Case-insensitive comparison for strings.
 * @param {boolean} [options.displayLastModifiedDate=true] Append annotated lastModifiedDate.
 *
 * @returns {object} merged Ordered merged object { actualKey, <symbol>-actualKey-expected, ... }.
 *
 * @example
 * logActualAndExpectedMerged(
 *   'Class Period',
 *   'Scenario 02',
 *   response,
 *   logSpecClassPeriod,
 *   { classPeriodName: 'Class Period 1' }
 * );
 *
 * Console output example:
 * Class Period - Scenario 02 - Results: {
 *   "classPeriodName": "Class Period 1",
 *   "✓-classPeriodName-expected": "Class Period 1",
 *   "lastModifiedDate": "2025-09-16T10:00:00Z (today)"
 * }
 */
function logActualAndExpectedMerged(
  entityName,
  scenarioName,
  actualResponse,
  specification,
  expectedResponse,
  {
    suffix = '-expected',
    filterFn = filterObjectByKeys,
    matchSymbols = { true: '✓', false: '✗' },
    ignoreCase = true,
    displayLastModifiedDate = true
  } = {}
) {
  const fullObj = buildLogObject(actualResponse, specification);
  const keys = Object.keys(expectedResponse);
  const finalActualResponse = filterFn(fullObj, keys);

  const equals = (a, b) => {
    if (ignoreCase && typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() === b.toLowerCase();
    }
    return a === b;
  };

  const merged = {};
  keys.forEach(k => {
    const actualVal = finalActualResponse[k];
    const expectedVal = expectedResponse[k] ? expectedResponse[k] : '(Not Provided)';
    const matched = expectedResponse[k] ? equals(actualVal, expectedVal) : true;
    const expectedKey = `${matched ? matchSymbols.true : matchSymbols.false}-${k}${suffix}`;
    merged[k] = actualVal;
    merged[expectedKey] = expectedVal;
  });

  if (displayLastModifiedDate) {
    merged['lastModifiedDate'] = annotateDate(actualResponse?._lastModifiedDate);
  }

  console.info(`${entityName} - ${scenarioName} - Results:`, JSON.stringify(merged, null, 2));
  return merged;
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
const logSpecBellSchedule = {
  bellScheduleName: r => r?.bellScheduleName,
  schoolId: r => r?.schoolReference?.schoolId,
  classPeriods: r => r?.classPeriods.map(cp => cp.classPeriodReference.classPeriodName),
  dates: r => r?.dates,
  startTime: r => r?.startTime,
  endTime: r => r?.endTime,
  alternateDayName: r => r?.alternateDayName,
  totalInstructionalTime: r => r?.totalInstructionalTime,
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

const logSpecCalendar = {
  calendarCode: 'calendarCode',
  schoolId: r => r.schoolReference.schoolId,
  schoolYear: r => r.schoolYearTypeReference.schoolYear,
  calendarTypeDescriptor: r => extractDescriptor(r.calendarTypeDescriptor),
  gradeLevels: r => mapDescriptors(r.gradeLevels, gl => gl.gradeLevelDescriptor),
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

const logSpecCalendarDate = {
  date: 'date',
  calendarCode: r => r.calendarReference.calendarCode,
  schoolId: r => r.calendarReference.schoolId,
  schoolYear: r => r.calendarReference.schoolYear,
  calendarEvents: r => mapDescriptors(r.calendarEvents, ev => ev.calendarEventDescriptor),
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

const logSpecClassPeriod = {
  classPeriodName: r => r?.classPeriodName,
  schoolId: r => r?.schoolReference?.schoolId,
  meetingTimes: r => r?.meetingTimes,
  officialAttendancePeriod: r => r?.officialAttendancePeriod,
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

const logSpecCohorts = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  cohortIdentifier: 'cohortIdentifier',
  cohortTypeDescriptor: 'cohortTypeDescriptor',
  cohortDescription: 'cohortDescription',
  cohortScopeDescriptor: 'cohortScopeDescriptor',
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

const logSpecCourses = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  courseCode: 'courseCode',
  courseTitle: 'courseTitle',
  academicSubjectDescriptor: r => extractDescriptor(r.academicSubjectDescriptor),
  levelCharacteristicDescriptor: r => extractDescriptor(r.levelCharacteristics[0].courseLevelCharacteristicDescriptor),
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

// CourseOffering logging spec (needed for CourseOffering certification scenarios)
const logSpecCourseOffering = {
  localCourseCode: 'localCourseCode',
  localCourseTitle: 'localCourseTitle',
  courseCode: r => r?.courseReference?.courseCode,
  educationOrganizationId: r => r?.courseReference?.educationOrganizationId,
  schoolId: r => r?.schoolReference?.schoolId,
  sessionName: r => r?.sessionReference?.sessionName,
  sessionSchoolYear: r => r?.sessionReference?.schoolYear,
  sessionSchoolId: r => r?.sessionReference?.schoolId,
  courseLevelCharacteristics: r => mapDescriptors(r?.courseLevelCharacteristics, c => c.courseLevelCharacteristicDescriptor),
  curriculumUseds: r => mapDescriptors(r?.curriculumUseds, u => u.curriculumUsedDescriptor),
  offeredGradeLevels: r => mapDescriptors(r?.offeredGradeLevels, g => g.gradeLevelDescriptor),
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

// School logging spec (added for School certification scenarios)
const logSpecSchool = {
  schoolId: r => r?.schoolId,
  localEducationAgencyId: r => r?.localEducationAgencyReference?.localEducationAgencyId,
  nameOfInstitution: 'nameOfInstitution',
  gradeLevels: r => mapDescriptors(r?.gradeLevels, gl => gl.gradeLevelDescriptor),
  educationOrganizationCategories: r => mapDescriptors(r?.educationOrganizationCategories, c => c.educationOrganizationCategoryDescriptor),
  streetNumberName: r => r?.addresses?.[0]?.streetNumberName,
  postalCode: r => r?.addresses?.[0]?.postalCode,
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

// Grading Period logging spec
const logSpecGradingPeriod = {
  schoolId: r => r?.schoolReference?.schoolId,
  schoolYear: r => r?.schoolYearTypeReference?.schoolYear,
  gradingPeriodDescriptor: r => extractDescriptor(r?.gradingPeriodDescriptor),
  periodSequence: 'periodSequence',
  beginDate: 'beginDate',
  endDate: 'endDate',
  totalInstructionalDays: 'totalInstructionalDays',
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

// Session logging spec (new for Session certification scenarios)
const logSpecSession = {
  sessionName: 'sessionName',
  schoolId: r => r?.schoolReference?.schoolId,
  schoolYear: r => r?.schoolYearTypeReference?.schoolYear,
  termDescriptor: r => extractDescriptor(r?.termDescriptor),
  beginDate: 'beginDate',
  endDate: 'endDate',
  totalInstructionalDays: 'totalInstructionalDays',
  gradingPeriods: r => (r?.gradingPeriods || []).map(gp => {
    const ref = gp?.gradingPeriodReference;
    if (!ref) return null;
    const desc = extractDescriptor(ref.gradingPeriodDescriptor);
    return `${desc}:${ref.periodSequence}`;
  }).filter(Boolean),
  lastModifiedDate: r => annotateDate(r?._lastModifiedDate)
};

module.exports = {
  validateDependency,
  filterObjectByKeys,
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
  buildLogObject,
  logScenario,
  logExpectedVsActual,
  logActualAndExpectedMerged,
  expectChanged,
  expectUnchanged,
  logSpecBellSchedule,
  logSpecCalendar,
  logSpecCalendarDate,
  logSpecClassPeriod,
  logSpecCohorts,
  logSpecCourses,
  logSpecCourseOffering,
  logSpecSchool,
  logSpecGradingPeriod,
  logSpecSession,
  throwNotFoundOrSpecificError
};
