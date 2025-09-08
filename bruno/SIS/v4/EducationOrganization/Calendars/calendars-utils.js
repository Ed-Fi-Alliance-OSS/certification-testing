const { setVars, setVarsMessage, wipeVars, wipeVarsWarning, extractDescriptor, mapDescriptors, joinDescriptors, logScenario, logSpecCalendar } = require('../../../utils');

// Cache the calendar response values in temporary variables using generic helpers
function cacheStoreCalendarResponse(bru, response) {
  setVars(bru, {
    tempCalendarUniqueId: response.id,
    tempCalendarCode: response.calendarCode,
    tempCalendarSchoolYear: response.schoolYearTypeReference.schoolYear,
    tempCalendarGradeLevels: joinDescriptors(mapDescriptors(response.gradeLevels || [], gl => gl.gradeLevelDescriptor)),
    tempCalendarTypeDescriptor: extractDescriptor(response.calendarTypeDescriptor)
  });
  setVarsMessage('Calendar');
}

function cacheWipeCalendarResponse(bru) {
  wipeVars(bru, [
    'tempCalendarUniqueId',
    'tempCalendarCode',
    'tempCalendarSchoolYear',
    'tempCalendarGradeLevels',
    'tempCalendarTypeDescriptor'
  ]);
  wipeVarsWarning('Calendar');
}

function logCalendarResponse(scenarioName, response, filterArray = null) {
  logScenario(scenarioName, response, logSpecCalendar, filterArray);
}

module.exports = {
  cacheStoreCalendarResponse,
  cacheWipeCalendarResponse,
  logCalendarResponse
};
