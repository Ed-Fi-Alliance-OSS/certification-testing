const { setVars, setVarsMessage, wipeVars, wipeVarsWarning, extractDescriptor, mapDescriptors, logScenario, logSpecCalendar } = require('../../../utils');

// Cache the calendar response values in temporary variables using generic helpers
function cacheStoreCalendarResponse(bru, response) {
  setVars(bru, {
    tempCalendarUniqueId: response.id,
    tempCalendarCode: response.calendarCode,
    tempCalendarSchoolYear: response.schoolYearTypeReference.schoolYear,
    tempCalendarGradeLevels: mapDescriptors(response.gradeLevels || [], gl => gl.gradeLevelDescriptor).join(', '),
    tempCalendarTypeDescriptor: extractDescriptor(response.calendarTypeDescriptor)
  });
  setVarsMessage('Calendar Date');
}

function cacheWipeCalendarResponse(bru) {
  wipeVars(bru, [
    'tempCalendarUniqueId',
    'tempCalendarCode',
    'tempCalendarSchoolYear',
    'tempCalendarGradeLevels',
    'tempCalendarTypeDescriptor'
  ]);
  wipeVarsWarning('Calendar Date');
}

function logCalendarResponse(scenarioName, response, filterArray = null) {
  logScenario(scenarioName, response, logSpecCalendar, filterArray);
}

module.exports = {
  cacheStoreCalendarResponse,
  cacheWipeCalendarResponse,
  logCalendarResponse
};
