/**
 * Centralized logging module for SIS collection.
 */

const {
  extractDescriptor,
  mapDescriptors
} = require('./utils'); // relies on existing helpers in utils

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
  // optional dependency not installed – add a visible warning so it's obvious why date annotations are plain
  console.warn('[logging] dayjs not available; date annotations will not be enriched. Install dayjs in the active working directory to enable. Error:', e && e.message);
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
  if (dCst.isSame(todayCst, 'day')) {
    const diffMinutes = todayCst.diff(dCst, 'minute'); // positive if dCst is earlier (in the past)
    if (diffMinutes >= 0 && diffMinutes < 60) {
      if (diffMinutes === 0) relativeTag = ' (just now)';
      else if (diffMinutes === 1) relativeTag = ' (1 minute ago)';
      else relativeTag = ` (${diffMinutes} minutes ago)`;
    } else {
      // 60+ minutes earlier (still today) OR future timestamp today
      relativeTag = ' (today)';
    }
  } else if (dCst.isBefore(todayCst, 'day')) relativeTag = ' (before today)';

  return `${cstFormatted} (CST)${relativeTag}`;
}

// ---------------- Core log builders ----------------

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

  // Ensure id and lastModifiedDate are always included
  keys = keys.includes('id') ? keys : ['id', ...keys];
  keys = keys.includes('lastModifiedDate') ? keys : [...keys, 'lastModifiedDate'];
  
  return keys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}

function buildLogObject(source, spec) {
  try {
    // Always ensure base fields are present unless explicitly overridden in the provided spec.
    // This allows callers to omit id / lastModifiedDate in each spec map while still
    // guaranteeing they appear in all log outputs.
    const effectiveSpec = { ...(spec || {}) };
    if (!Object.prototype.hasOwnProperty.call(effectiveSpec, 'id')) {
      effectiveSpec.id = r => r?.id;
    }
    if (!Object.prototype.hasOwnProperty.call(effectiveSpec, 'lastModifiedDate')) {
      effectiveSpec.lastModifiedDate = r => annotateDate(r?._lastModifiedDate);
    }

    return Object.entries(effectiveSpec).reduce((acc, [k, resolver]) => {
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
 *  2. Logs the final subset as JSON for traceability:
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
function logScenario(entityName, scenarioName, actualResponse, spec, filterKeys) {
  const fullObj = buildLogObject(actualResponse, spec);
  const finalActualResponse = filterObjectByKeys(fullObj, filterKeys);
  //console.info(`${entityName} - Scenario ${scenarioName} - API Response:`, JSON.stringify(finalActualResponse, null, 2));
  console.info(`${entityName} > Scenario ${scenarioName} - API Response:`, finalActualResponse);
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

// ---------------- Spec Maps ----------------
const logSpecBellSchedule = {
  bellScheduleName: r => r?.bellScheduleName,
  schoolId: r => r?.schoolReference?.schoolId,
  classPeriods: r => r?.classPeriods.map(cp => cp.classPeriodReference.classPeriodName),
  dates: r => r?.dates,
  startTime: r => r?.startTime,
  endTime: r => r?.endTime,
  alternateDayName: r => r?.alternateDayName,
  totalInstructionalTime: r => r?.totalInstructionalTime,
};

const logSpecCalendar = {
  calendarCode: 'calendarCode',
  schoolId: r => r.schoolReference.schoolId,
  schoolYear: r => r.schoolYearTypeReference.schoolYear,
  calendarTypeDescriptor: r => extractDescriptor(r.calendarTypeDescriptor),
  gradeLevels: r => mapDescriptors(r.gradeLevels, gl => gl.gradeLevelDescriptor),
};

const logSpecCalendarDate = {
  date: 'date',
  calendarCode: r => r.calendarReference.calendarCode,
  schoolId: r => r.calendarReference.schoolId,
  schoolYear: r => r.calendarReference.schoolYear,
  calendarEvents: r => mapDescriptors(r.calendarEvents, ev => ev.calendarEventDescriptor),
};

const logSpecClassPeriod = {
  classPeriodName: r => r?.classPeriodName,
  schoolId: r => r?.schoolReference?.schoolId,
  meetingTimes: r => r?.meetingTimes,
  officialAttendancePeriod: r => r?.officialAttendancePeriod,
};

const logSpecCohorts = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  cohortIdentifier: 'cohortIdentifier',
  cohortTypeDescriptor: r => extractDescriptor(r.cohortTypeDescriptor),
  cohortDescription: 'cohortDescription',
  cohortScopeDescriptor: r => extractDescriptor(r.cohortScopeDescriptor),
};

const logSpecCourses = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  identificationCode: r => r?.courseIdentificationCodes?.[0]?.identificationCode,
  courseCode: 'courseCode',
  courseTitle: 'courseTitle',
  courseIdentificationSystemDescriptor: r => extractDescriptor(r?.courseIdentificationCodes?.[0]?.courseIdentificationSystemDescriptor),
  academicSubjectDescriptor: r => extractDescriptor(r.academicSubjectDescriptor),
  levelCharacteristics: r => extractDescriptor(r.levelCharacteristics[0].courseLevelCharacteristicDescriptor),
  numberOfParts: r => r?.numberOfParts,
};

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
};

const logSpecSchool = {
  schoolId: r => r?.schoolId,
  localEducationAgencyId: r => r?.localEducationAgencyReference?.localEducationAgencyId,
  nameOfInstitution: 'nameOfInstitution',
  shortNameOfInstitution: 'shortNameOfInstitution',
  gradeLevels: r => mapDescriptors(r?.gradeLevels, gl => gl.gradeLevelDescriptor),
  educationOrganizationCategories: r => mapDescriptors(r?.educationOrganizationCategories, c => c.educationOrganizationCategoryDescriptor),
  addressTypeDescriptor: r => extractDescriptor(r?.addresses?.[0]?.addressTypeDescriptor),
  stateAbbreviationDescriptor: r => extractDescriptor(r?.addresses?.[0]?.stateAbbreviationDescriptor),
  city: r => r?.addresses?.[0]?.city,
  streetNumberName: r => r?.addresses?.[0]?.streetNumberName,
  postalCode: r => r?.addresses?.[0]?.postalCode,
};

const logSpecGradingPeriod = {
  schoolId: r => r?.schoolReference?.schoolId,
  schoolYear: r => r?.schoolYearTypeReference?.schoolYear,
  gradingPeriodDescriptor: r => extractDescriptor(r?.gradingPeriodDescriptor),
  periodSequence: 'periodSequence',
  beginDate: 'beginDate',
  endDate: 'endDate',
  totalInstructionalDays: 'totalInstructionalDays',
};

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
};

// Location spec map (EducationOrganization > Locations)
// Required identifying fields: classroomIdentificationCode (natural id), schoolId (from reference).
// Includes both seat counts for potential future optional mutation of optimalNumberOfSeats.
const logSpecLocation = {
  classroomIdentificationCode: r => r?.classroomIdentificationCode,
  schoolId: r => r?.schoolReference?.schoolId,
  maximumNumberOfSeats: r => r?.maximumNumberOfSeats,
  optimalNumberOfSeats: r => r?.optimalNumberOfSeats,
};

// Section spec map (MasterSchedule > Sections)
// Focus on identifying keys + mutated field availableCredits and key references.
const logSpecSection = {
  sectionIdentifier: r => r?.sectionIdentifier,
  localCourseCode: r => r?.courseOfferingReference?.localCourseCode,
  schoolId: r => r?.courseOfferingReference?.schoolId, // PK constituent appears multiple places; using courseOfferingReference
  schoolYear: r => r?.courseOfferingReference?.schoolYear,
  sessionName: r => r?.courseOfferingReference?.sessionName,
  classroomIdentificationCode: r => r?.locationReference?.classroomIdentificationCode,
  locationSchoolId: r => r?.locationReference?.schoolId,
  classPeriodName: r => r?.classPeriods?.[0]?.classPeriodReference?.classPeriodName,
  classPeriodSchoolId: r => r?.classPeriods?.[0]?.classPeriodReference?.schoolId,
  availableCredits: r => r?.availableCredits,
  educationalEnvironmentDescriptor: r => extractDescriptor(r?.educationalEnvironmentDescriptor),
};

// Student spec map (Student > Students)
// Include identifiers and mutated fields (birthDate, birthCity) plus selected required personal info.
const logSpecStudent = {
  studentUniqueId: r => r?.studentUniqueId,
  firstName: r => r?.firstName,
  middleName: r => r?.middleName,
  lastSurname: r => r?.lastSurname,
  birthDate: r => r?.birthDate,
  birthCity: r => r?.birthCity,
  birthCountryDescriptor: r => extractDescriptor(r?.birthCountryDescriptor),
};

// GraduationPlan spec map (StudentEnrollment > GraduationPlans)
// NaturalIdField is null per config; log system id implicitly and key constituents + mutable field.
// NOTE: Config uses primaryKeyFields: educationOrganizationId, graduationPlanTypeDescriptorId, graduationSchoolYear.
// API response + docs use: educationOrganizationReference.educationOrganizationId, graduationSchoolYearTypeReference.schoolYear, graduationPlanTypeDescriptor.
// Potential mismatch for descriptor key (Id vs descriptor string) and schoolYear field name.
const logSpecGraduationPlan = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  schoolYear: r => r?.graduationSchoolYearTypeReference?.schoolYear,
  graduationPlanTypeDescriptor: r => extractDescriptor(r?.graduationPlanTypeDescriptor),
  totalRequiredCredits: r => r?.totalRequiredCredits,
};

// StudentEducationOrganizationAssociation spec map
// Includes PK constituents, required descriptors, and mutated telephone/address fields.
const logSpecStudentEdOrgAssociation = {
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  studentUniqueId: r => r?.studentReference?.studentUniqueId,
  limitedEnglishProficiencyDescriptor: r => extractDescriptor(r?.limitedEnglishProficiencyDescriptor),
  sexDescriptor: r => extractDescriptor(r?.sexDescriptor),
  hispanicLatinoEthnicity: r => r?.hispanicLatinoEthnicity,
  telephoneNumber: r => r?.telephones?.[0]?.telephoneNumber,
  streetNumberName: r => r?.addresses?.[0]?.streetNumberName,
  city: r => r?.addresses?.[0]?.city,
  postalCode: r => r?.addresses?.[0]?.postalCode,
  stateAbbreviationDescriptor: r => extractDescriptor(r?.addresses?.[0]?.stateAbbreviationDescriptor),
  studentIdentificationCodes: r => (r?.studentIdentificationCodes || []).map(c => `${extractDescriptor(c.studentIdentificationSystemDescriptor)}:${c.identificationCode}`),
  studentCharacteristicDescriptors: r => (r?.studentCharacteristics || []).map(ch => extractDescriptor(ch.studentCharacteristicDescriptor)),
  raceDescriptors: r => (r?.races || []).map(rc => extractDescriptor(rc.raceDescriptor)),
};

// StudentSchoolAssociation spec map (StudentEnrollment > StudentSchoolAssociations)
// Primary keys per config: schoolId, studentUniqueId, entryDate (naturalIdField null)
// Include required descriptors & mutated-capable fields (entryDate, exitWithdrawDate, exitWithdrawTypeDescriptor, graduationPlanReference constituents, calendarReference.calendarCode)
// Optional/conditional fields omitted unless mutated; calendarCode included due to explicit update scenario mutation.
const logSpecStudentSchoolAssociation = {
  schoolId: r => r?.schoolReference?.schoolId,
  studentUniqueId: r => r?.studentReference?.studentUniqueId,
  entryDate: r => r?.entryDate,
  entryGradeLevelDescriptor: r => extractDescriptor(r?.entryGradeLevelDescriptor),
  entryTypeDescriptor: r => extractDescriptor(r?.entryTypeDescriptor),
  repeatGradeIndicator: r => r?.repeatGradeIndicator,
  residencyStatusDescriptor: r => extractDescriptor(r?.residencyStatusDescriptor),
  schoolChoiceTransfer: r => r?.schoolChoiceTransfer,
  exitWithdrawDate: r => r?.exitWithdrawDate,
  exitWithdrawTypeDescriptor: r => extractDescriptor(r?.exitWithdrawTypeDescriptor),
  graduationPlanEducationOrganizationId: r => r?.graduationPlanReference?.educationOrganizationId,
  graduationPlanSchoolYear: r => r?.graduationPlanReference?.graduationSchoolYear,
  graduationPlanTypeDescriptor: r => extractDescriptor(r?.graduationPlanReference?.graduationPlanTypeDescriptor),
  calendarCode: r => r?.calendarReference?.calendarCode,
};

// StudentSectionAssociation spec map (StudentEnrollment > StudentSectionAssociations)
// Primary keys per config: schoolId, schoolYear, localCourseCode, sessionName, sectionIdentifier, studentUniqueId, beginDate
// Required fields include all sectionReference constituents, studentUniqueId, beginDate, endDate.
// Mutation target per scenarios: endDate.
// Optional/conditional fields (homeroomIndicator, repeatIdentifierDescriptor, teacherStudentDataLinkExclusion, attemptStatusDescriptor) omitted unless future mutation added.
const logSpecStudentSectionAssociation = {
  schoolId: r => r?.sectionReference?.schoolId,
  schoolYear: r => r?.sectionReference?.schoolYear,
  localCourseCode: r => r?.sectionReference?.localCourseCode,
  sessionName: r => r?.sectionReference?.sessionName,
  sectionIdentifier: r => r?.sectionReference?.sectionIdentifier,
  studentUniqueId: r => r?.studentReference?.studentUniqueId,
  beginDate: r => r?.beginDate,
  endDate: r => r?.endDate,
};


// Grade spec map (StudentGrade > Grades)
// REQUIRED identifying/minimum fields only; excludes OPTIONAL/CONDITIONAL fields unless mutated.
// Mutations target: letterGradeEarned, numericGradeEarned.
const logSpecGrade = {
  gradeTypeDescriptor: r => extractDescriptor(r?.gradeTypeDescriptor),
  gradingPeriodDescriptor: r => extractDescriptor(r?.gradingPeriodReference?.gradingPeriodDescriptor),
  gradingPeriodPeriodSequence: r => r?.gradingPeriodReference?.periodSequence,
  gradingPeriodSchoolId: r => r?.gradingPeriodReference?.schoolId,
  gradingPeriodSchoolYear: r => r?.gradingPeriodReference?.schoolYear,
  studentUniqueId: r => r?.studentSectionAssociationReference?.studentUniqueId,
  schoolId: r => r?.studentSectionAssociationReference?.schoolId,
  localCourseCode: r => r?.studentSectionAssociationReference?.localCourseCode,
  sectionIdentifier: r => r?.studentSectionAssociationReference?.sectionIdentifier,
  sessionName: r => r?.studentSectionAssociationReference?.sessionName,
  beginDate: r => r?.studentSectionAssociationReference?.beginDate,
  letterGradeEarned: r => r?.letterGradeEarned,
  numericGradeEarned: r => r?.numericGradeEarned,
};

// StudentAcademicRecord spec map (StudentTranscript > StudentAcademicRecords)
// Primary keys: educationOrganizationId, schoolYear, studentUniqueId, termDescriptor
// Required credit & GPA fields plus graduation plan reference fields (only present for second baseline)
// Mutation scenario targets cumulativeAttemptedCredits, cumulativeEarnedCredits, sessionEarnedCredits (+ sessionAttemptedCredits implicitly)
const logSpecStudentAcademicRecord = {
  educationOrganizationId: r => r?.educationOrganizationId || r?.educationOrganizationReference?.educationOrganizationId,
  schoolYear: r => r?.schoolYear,
  studentUniqueId: r => r?.studentUniqueId || r?.studentReference?.studentUniqueId,
  termDescriptor: r => extractDescriptor(r?.termDescriptor),
  cumulativeAttemptedCredits: r => r?.cumulativeAttemptedCredits,
  cumulativeEarnedCredits: r => r?.cumulativeEarnedCredits,
  cumulativeGradePointAverage: r => r?.cumulativeGradePointAverage,
  sessionAttemptedCredits: r => r?.sessionAttemptedCredits,
  sessionEarnedCredits: r => r?.sessionEarnedCredits,
  graduationPlanEducationOrganizationId: r => r?.graduationPlans?.[0]?.educationOrganizationId,
  graduationPlanSchoolYear: r => r?.graduationPlans?.[0]?.graduationSchoolYear,
  graduationPlanTypeDescriptor: r => extractDescriptor(r?.graduationPlans?.[0]?.graduationPlanTypeDescriptor),
};

// CourseTranscript spec map (StudentTranscript > CourseTranscript)
// Primary key constituents (per config): educationOrganizationId, courseEducationOrganizationId, schoolYear, termDescriptor, studentUniqueId, courseCode, courseAttemptResultDescriptor
// Include key academic performance fields + attempted/earned credits and final grades.
const logSpecCourseTranscript = {
  educationOrganizationId: r => r?.courseReference?.educationOrganizationId,
  courseCode: r => r?.courseReference?.courseCode,
  schoolYear: r => r?.studentAcademicRecordReference?.schoolYear,
  termDescriptor: r => extractDescriptor(r?.studentAcademicRecordReference?.termDescriptor),
  studentUniqueId: r => r?.studentAcademicRecordReference?.studentUniqueId,
  courseAttemptResultDescriptor: r => extractDescriptor(r?.courseAttemptResultDescriptor),
  attemptedCredits: r => r?.attemptedCredits,
  earnedCredits: r => r?.earnedCredits,
  finalLetterGradeEarned: r => r?.finalLetterGradeEarned,
  finalNumericGradeEarned: r => r?.finalNumericGradeEarned,
};

// Staff spec map (StaffAssociation > Staffs)
// Include identifiers and mutated fields (highlyQualifiedTeacher, hispanicLatinoEthnicity) plus selected required personal info.
const logSpecStaff = {
  staffUniqueId: r => r?.staffUniqueId,
  firstName: r => r?.firstName,
  middleName: r => r?.middleName,
  lastSurname: r => r?.lastSurname,
  highlyQualifiedTeacher: r => r?.highlyQualifiedTeacher,
  hispanicLatinoEthnicity: r => r?.hispanicLatinoEthnicity,
  sexDescriptor: r => extractDescriptor(r?.sexDescriptor),
  highestCompletedLevelOfEducationDescriptor: r => extractDescriptor(r?.highestCompletedLevelOfEducationDescriptor),
  electronicMailAddress: r => r?.electronicMails?.[0]?.electronicMailAddress,
};

// StaffEducationOrganizationAssignmentAssociation spec map (StaffAssociation > StaffEdOrgAssociation)
// Include identifiers and mutated fields (positionTitle, endDate) plus selected required info.
const logSpecStaffEdOrgAssociation = {
  staffUniqueId: r => r?.staffReference?.staffUniqueId,
  educationOrganizationId: r => r?.educationOrganizationReference?.educationOrganizationId,
  beginDate: r => r?.beginDate,
  endDate: r => r?.endDate,
  staffClassificationDescriptor: r => extractDescriptor(r?.staffClassificationDescriptor),
  positionTitle: r => r?.positionTitle,
  orderOfAssignment: r => r?.orderOfAssignment,
};

// StaffSchoolAssociation spec map (StaffAssociation > StaffSchoolAssociations)
// Include identifiers and programAssignmentDescriptor
const logSpecStaffSchoolAssociation = {
  staffUniqueId: r => r?.staffReference?.staffUniqueId,
  schoolId: r => r?.schoolReference?.schoolId,
  programAssignmentDescriptor: r => extractDescriptor(r?.programAssignmentDescriptor),
  schoolYear: r => r?.schoolYearTypeReference?.schoolYear,
  calendarCode: r => r?.calendarReference?.calendarCode,
  academicSubjects: r => r?.academicSubjects && r.academicSubjects.length > 0
    ? mapDescriptors(r.academicSubjects, s => s.academicSubjectDescriptor).join(', ')
    : undefined,
  gradeLevels: r => r?.gradeLevels && r.gradeLevels.length > 0
    ? mapDescriptors(r.gradeLevels, g => g.gradeLevelDescriptor).join(', ')
    : undefined,
};

// DisciplineIncident spec map (StudentDiscipline > DisciplineIncident)
// Include identifiers and mutated fields (reporterName, incidentLocationDescriptor) plus required info.
const logSpecDisciplineIncident = {
  schoolId: r => r?.schoolReference?.schoolId,
  incidentIdentifier: r => r?.incidentIdentifier,
  incidentDate: r => r?.incidentDate,
  behaviors: r => r?.behaviors && r.behaviors.length > 0
    ? mapDescriptors(r.behaviors, b => b.behaviorDescriptor).join(', ')
    : undefined,
  incidentLocationDescriptor: r => extractDescriptor(r?.incidentLocationDescriptor),
  reporterDescriptionDescriptor: r =>      extractDescriptor(r?.reporterDescriptionDescriptor),
  incidentDescription: r => r?.incidentDescription,
  reporterName: r => r?.reporterName
};

// DisciplineAction spec map (StudentDiscipline > DisciplineAction)
// Include identifiers and mutated field (disciplineDescriptor in disciplines collection) plus required info.
const logSpecDisciplineAction = {
  responsibilitySchoolId: r => r?.responsibilitySchoolReference?.schoolId,
  assignmentSchoolId: r => r?.assignmentSchoolReference?.schoolId, // optional
  studentUniqueId: r => r?.studentReference?.studentUniqueId,
  disciplineDate: r => r?.disciplineDate,
  disciplineActionIdentifier: r => r?.disciplineActionIdentifier,
  disciplines: r => r?.disciplines && r.disciplines.length > 0
    ? mapDescriptors(r.disciplines, d => d.disciplineDescriptor).join(', ')
    : undefined,
  actualDisciplineActionLength: r => r?.actualDisciplineActionLength, // optional
  iepPlacementMeetingIndicator: r => r?.iepPlacementMeetingIndicator, // optional
};

module.exports = {
  buildLogObject
  ,logScenario
  ,logExpectedVsActual
  ,logActualAndExpectedMerged
  ,logSpecBellSchedule
  ,logSpecCalendar
  ,logSpecCalendarDate
  ,logSpecClassPeriod
  ,logSpecCohorts
  ,logSpecCourses
  ,logSpecCourseOffering
  ,logSpecSchool
  ,logSpecGradingPeriod
  ,logSpecSession
  ,logSpecLocation
  ,logSpecSection
  ,logSpecStudent
  ,logSpecGraduationPlan
  ,logSpecStudentEdOrgAssociation
  ,logSpecStudentSchoolAssociation
  ,logSpecStudentSectionAssociation
  ,logSpecGrade
  ,logSpecStudentAcademicRecord
  ,logSpecCourseTranscript
  ,logSpecStaff
  ,logSpecStaffEdOrgAssociation
  ,logSpecStaffSchoolAssociation
  ,logSpecDisciplineIncident
  ,logSpecDisciplineAction
};
