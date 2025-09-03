// Cache the calendar response values in temporary variables
function cacheStoreCalendarResponse(bru, response) {
    const {
      id,
      calendarCode,
      schoolYearTypeReference: schoolYearType,
      gradeLevels,
      calendarTypeDescriptor
    } = response;
  
    const typeDescriptor = calendarTypeDescriptor.split('#').pop();
    const gradeLevelDescriptors = gradeLevels.map(gl => gl.gradeLevelDescriptor.split('#').pop()).join(', ');
  
    bru.setEnvVar('tempCalendarUniqueId', id);
    bru.setEnvVar('tempCalendarCode', calendarCode);
    bru.setEnvVar('tempCalendarSchoolYear', schoolYearType.schoolYear);
    bru.setEnvVar('tempCalendarGradeLevels', gradeLevelDescriptors);
    bru.setEnvVar('tempCalendarTypeDescriptor', typeDescriptor);
  
    console.log('Calendar data was fetched correctly.');
}

function cacheWipeCalendarResponse(bru) {
  bru.setEnvVar('tempCalendarUniqueId', null);
  bru.setEnvVar('tempCalendarCode', null);
  bru.setEnvVar('tempCalendarSchoolYear', null);
  bru.setEnvVar('tempCalendarGradeLevels', null);
  bru.setEnvVar('tempCalendarTypeDescriptor', null);

  console.warn('Calendar data was wiped. Because data not found or multiple records returned, please check the input "Params".');
}

function logCalendarResponse(scenarioName, response, filterArray = null) {
  const {
      calendarCode,
      schoolReference,
      schoolYearTypeReference,
      calendarTypeDescriptor,
      gradeLevels
    } = response;
  
    const responseToLog = {
      calendarCode,
      'schoolId': schoolReference.schoolId,
      'schoolYear': schoolYearTypeReference.schoolYear,
      'calendarTypeDescriptor': calendarTypeDescriptor.split('#').pop(),
      'gradeLevels': gradeLevels.map(level => level.gradeLevelDescriptor.split('#').pop())
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
  cacheStoreCalendarResponse,
  cacheWipeCalendarResponse,
  logCalendarResponse
};
