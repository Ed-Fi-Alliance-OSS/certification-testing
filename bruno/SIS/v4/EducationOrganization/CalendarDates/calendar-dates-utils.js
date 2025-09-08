const { setVars, setVarsMessage, wipeVars, wipeVarsWarning, mapDescriptors, logScenario, logSpecCalendarDate } = require('../../../utils');

// Cache the calendar date response values using generic helpers
function cacheStoreCalendarDateResponse(bru, response) {
  setVars(bru, {
    tempCalendarDateUniqueId: response.id,
    tempCalendarDateEventDescriptors: mapDescriptors(response.calendarEvents || [], ev => ev.calendarEventDescriptor).join(', ')
  });
  setVarsMessage('Calendar Date');
}

function cacheWipeCalendarDateResponse(bru) {
  wipeVars(bru, [
    'tempCalendarDateUniqueId',
    'tempCalendarDateEventDescriptors'
  ]);
  wipeVarsWarning('Calendar Date');
}

function logCalendarDateResponse(scenarioName, response, filterArray = null) {
  logScenario(scenarioName, response, logSpecCalendarDate, filterArray);
}

module.exports = {
  cacheStoreCalendarDateResponse,
  cacheWipeCalendarDateResponse,
  logCalendarDateResponse
};
