const { test } = require('node:test');
const assert = require('node:assert/strict');
const log = require('../MTSS/logging.js');

test('logSpecIntervention extracts keys, descriptors and joined collections', () => {
  const o = log.buildLogObject({
    id: 'i1',
    interventionIdentificationCode: 'READ-T2-001',
    educationOrganizationReference: { educationOrganizationId: 255901 },
    interventionClassDescriptor: 'uri://ed-fi.org/InterventionClassDescriptor#Practice',
    deliveryMethodDescriptor: 'uri://ed-fi.org/DeliveryMethodDescriptor#Small Group',
    beginDate: '2026-08-24',
    maxDosage: 1200,
    diagnoses: [{ diagnosisDescriptor: 'uri://x/DiagnosisDescriptor#Reading Fluency' }],
    staffs: [{ staffReference: { staffUniqueId: '207289' } }, { staffReference: { staffUniqueId: '207288' } }]
  }, log.logSpecIntervention);
  assert.equal(o.interventionIdentificationCode, 'READ-T2-001');
  assert.equal(o.educationOrganizationId, 255901);
  assert.equal(o.interventionClassDescriptor, 'Practice');
  assert.equal(o.diagnoses, 'Reading Fluency');
  assert.equal(o.staffs, '207288,207289');
});

test('logSpecStudentInterventionAssociation extracts student, intervention, dosage, cohort', () => {
  const o = log.buildLogObject({
    studentReference: { studentUniqueId: '604863' },
    interventionReference: { educationOrganizationId: 255901, interventionIdentificationCode: 'READ-T2-001' },
    cohortReference: { cohortIdentifier: 'GRP-A', educationOrganizationId: 255901 },
    dosage: 900
  }, log.logSpecStudentInterventionAssociation);
  assert.deepEqual(
    [o.studentUniqueId, o.interventionIdentificationCode, o.dosage, o.cohortIdentifier],
    ['604863', 'READ-T2-001', 900, 'GRP-A']
  );
});

test('logSpecStudentInterventionAttendanceEvent shortens the category descriptor', () => {
  const o = log.buildLogObject({
    studentReference: { studentUniqueId: '604863' },
    interventionReference: { interventionIdentificationCode: 'READ-T2-001' },
    eventDate: '2026-09-10',
    attendanceEventCategoryDescriptor: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Partial',
    interventionDuration: 15
  }, log.logSpecStudentInterventionAttendanceEvent);
  assert.equal(o.attendanceEventCategoryDescriptor, 'Partial');
  assert.equal(o.interventionDuration, 15);
});

test('logDosageMeasures logs the measures under the scenario name', () => {
  const lines = [];
  const orig = console.info;
  console.info = (...a) => lines.push(a.map(String).join(' '));
  try {
    log.logDosageMeasures('02 - ALL', { delivered: 70 });
  } finally {
    console.info = orig;
  }
  assert.match(lines[0], /Dosage > Scenario 02 - ALL - Measures:/);
  assert.match(lines[0], /"delivered":70/);
});
