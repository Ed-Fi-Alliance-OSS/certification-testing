// Cache the calendar response values in temporary variables
function cacheCalendarResponse(bru, response) {
  if (!!response && response.length === 1) {
    const {
      id,
      calendarCode,
      schoolYearTypeReference: schoolYearType,
      gradeLevels,
      calendarTypeDescriptor
    } = response[0];
  
    const typeDescriptor = calendarTypeDescriptor.split('#').pop();
    const gradeLevelDescriptors = gradeLevels.map(gl => gl.gradeLevelDescriptor.split('#').pop());
    console.log(`Grade Levels: ${gradeLevelDescriptors.join(', ')}`);
  
    bru.setEnvVar('tempCalendarUniqueId', id);
    bru.setEnvVar('tempCalendarCode', calendarCode);
    bru.setEnvVar('tempCalendarSchoolYear', schoolYearType.schoolYear);
    bru.setEnvVar('tempCalendarGradeLevels', gradeLevelDescriptors);
    bru.setEnvVar('tempCalendarTypeDescriptor', typeDescriptor);
  
    console.log('Calendar data was fetched correctly.');
  } else {
    console.warn('Calendar data not found or multiple records returned, please check the input "Params".');
  
    bru.setEnvVar('tempCalendarUniqueId', null);
    bru.setEnvVar('tempCalendarCode', null);
    bru.setEnvVar('tempCalendarSchoolYear', null);
    bru.setEnvVar('tempCalendarGradeLevels', null);
    bru.setEnvVar('tempCalendarTypeDescriptor', null);
  }
}

module.exports = {
  cacheCalendarResponse
};
