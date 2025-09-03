// Cache the calendar response values in temporary variables
function cacheStoreCalendarDateResponse(bru, response) {
    const {
      id,
      calendarEvents
    } = response;

    const eventDescriptors = calendarEvents.map(event => event.calendarEventDescriptor.split('#').pop()).join(', ');

    bru.setEnvVar('tempCalendarDateUniqueId', id);
    bru.setEnvVar('tempCalendarDateEventDescriptors', eventDescriptors);

    console.log('Calendar Date data was fetched correctly.');
}

function cacheWipeCalendarDateResponse(bru) {
  bru.setEnvVar('tempCalendarDateUniqueId', null);
  bru.setEnvVar('tempCalendarDateEventDescriptors', null);

  console.warn('Calendar Date data was wiped. Because data not found or multiple records returned, please check the input "Params".');
}

function logCalendarDateResponse(scenarioName, response, filterArray = null) {
  const {
      date,
      calendarReference,
      calendarEvents
    } = response;
  
    const responseToLog = {
      date,
      'calendarCode': calendarReference.calendarCode,
      'schoolId': calendarReference.schoolId,
      'schoolYear': calendarReference.schoolYear,
      'calendarEvents': calendarEvents.map(event => event.calendarEventDescriptor.split('#').pop())
    };

    let objectToLog = responseToLog;

    if (filterArray && Array.isArray(filterArray) && filterArray.length > 0) {
      objectToLog = filterArray.reduce((acc, key) => {
        if (responseToLog.hasOwnProperty(key)) {
          acc[key] = responseToLog[key];
        }
        return acc;
      }, {});
    }

    console.info(scenarioName, JSON.stringify(objectToLog, null, 2));
}

module.exports = {
  cacheStoreCalendarDateResponse,
  cacheWipeCalendarDateResponse,
  logCalendarDateResponse
};
