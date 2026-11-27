const { test } = require('node:test');
const assert = require('node:assert/strict');
const u = require('../MTSS/utils.js');

const ev = (code, min, date = '2026-09-08', ns = 'uri://ed-fi.org') => ({
  attendanceEventCategoryDescriptor: `${ns}/AttendanceEventCategoryDescriptor#${code}`,
  interventionDuration: min,
  eventDate: date,
  studentReference: { studentUniqueId: '604863' },
  interventionReference: { educationOrganizationId: 255901, interventionIdentificationCode: 'READ-T2-001' }
});
const NOT_HELD = 'uri://www.intervention-provider.com/AttendanceEventCategoryDescriptor#Session Not Held';
const sample = [
  ev('In Attendance', 30),
  ev('In Attendance', 25, '2026-09-09'),
  ev('Partial', 15, '2026-09-10'),
  ev('Excused Absence', 0, '2026-09-11'),
  { ...ev('x', 0, '2026-09-14'), attendanceEventCategoryDescriptor: NOT_HELD }
];

test('codeValueOf returns the lower-cased code after #', () => {
  assert.equal(u.codeValueOf('uri://ed-fi.org/X#In Attendance '), 'in attendance');
  assert.equal(u.codeValueOf(undefined), '');
});

test('sample data matches the Confluence table', () => {
  assert.deepEqual(u.computeDosageMeasures(900, sample, NOT_HELD), {
    assigned: 900, delivered: 70, percentDelivered: 7.8, remaining: 830,
    attended: 3, missed: 1, notHeld: 1, unmapped: []
  });
});

test('no session-not-held category gives notHeld 0 and lists the code as unmapped', () => {
  const m = u.computeDosageMeasures(900, sample, undefined);
  assert.equal(m.notHeld, 0);
  assert.equal(m.delivered, 70);
  assert.deepEqual(m.unmapped, ['session not held']);
});

test('vendor namespace and casing still map to attended', () => {
  assert.equal(u.computeDosageMeasures(60, [ev('in ATTENDANCE', 30, undefined, 'uri://acme.org')]).attended, 1);
});

test('over-delivery gives negative remaining and >100 percent', () => {
  const m = u.computeDosageMeasures(20, [ev('Present', 30)]);
  assert.equal(m.remaining, -10);
  assert.equal(m.percentDelivered, 150);
});

test('toDosageVars returns seven flat numbers', () => {
  const v = u.toDosageVars(u.computeDosageMeasures(900, sample, NOT_HELD));
  assert.deepEqual(Object.keys(v).sort(), [
    'dosageAssignedMinutes', 'dosageDeliveredMinutes', 'dosageMinutesRemaining', 'dosagePercentDelivered',
    'dosageSessionsAttended', 'dosageSessionsMissed', 'dosageSessionsNotHeld'
  ]);
  assert.ok(Object.values(v).every(x => typeof x === 'number'));
});

test('findEventProblems reports missing duration, out-of-range date and a deleted key', () => {
  const bad = [ev('Present', undefined), ev('Present', 10, '2026-08-01'), ev('Unexcused Absence', 0, '2026-09-11')];
  const p = u.findEventProblems(bad, {
    beginDate: '2026-08-24',
    endDate: '2027-05-28',
    deletedKey: { eventDate: '2026-09-11', category: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Unexcused Absence' }
  });
  assert.equal(p.length, 3);
});

test('findEventProblems reports a missing studentReference', () => {
  const { studentReference, ...noStudent } = ev('Present', 10);
  assert.equal(u.findEventProblems([noStudent], { beginDate: '2026-08-24' }).length, 1);
});

// One test per rule, asserting the message the tester sees.
const only = (event, opts = {}) => u.findEventProblems([event], opts);

test('findEventProblems: missing interventionReference', () => {
  const { interventionReference, ...e } = ev('Present', 10);
  assert.deepEqual(only(e), ['Event #1 (2026-09-08): missing interventionReference']);
});

test('findEventProblems: interventionReference.educationOrganizationId must be a non-zero number', () => {
  const base = ev('Present', 10);
  const withEdOrg = edOrg => ({ ...base, interventionReference: { ...base.interventionReference, educationOrganizationId: edOrg } });
  const msg = ['Event #1 (2026-09-08): missing interventionReference.educationOrganizationId'];
  assert.deepEqual(only(withEdOrg(undefined)), msg);
  assert.deepEqual(only(withEdOrg(0)), msg);
  assert.deepEqual(only(withEdOrg('255901')), msg);
  assert.deepEqual(only(withEdOrg(255901)), []);
});

test('findEventProblems: missing eventDate is labelled "no date"', () => {
  const { eventDate, ...e } = ev('Present', 10);
  assert.deepEqual(only(e), ['Event #1 (no date): missing eventDate']);
});

test('findEventProblems: missing attendanceEventCategoryDescriptor', () => {
  const { attendanceEventCategoryDescriptor, ...e } = ev('Present', 10);
  assert.deepEqual(only(e), ['Event #1 (2026-09-08): missing attendanceEventCategoryDescriptor']);
});

test('findEventProblems: interventionDuration must be a number >= 0; 0 (absence) is valid', () => {
  const msg = 'Event #1 (2026-09-08): interventionDuration must be a number >= 0 (absences use 0)';
  assert.deepEqual(only(ev('Present', -1)), [msg]);
  assert.deepEqual(only(ev('Present', '30')), [msg]);
  assert.deepEqual(only(ev('Unexcused Absence', 0)), []);
});

test('findEventProblems: beginDate and endDate are inclusive boundaries', () => {
  const range = { beginDate: '2026-08-24', endDate: '2027-05-28' };
  assert.deepEqual(only(ev('Present', 10, '2026-08-24'), range), []);
  assert.deepEqual(only(ev('Present', 10, '2027-05-28'), range), []);
  assert.deepEqual(only(ev('Present', 10, '2026-08-23'), range), ['Event #1 (2026-08-23): eventDate is before the intervention beginDate 2026-08-24']);
  assert.deepEqual(only(ev('Present', 10, '2027-05-29'), range), ['Event #1 (2027-05-29): eventDate is after the intervention endDate 2027-05-28']);
});

test('findEventProblems: a deleted key matches date and category code across namespaces', () => {
  const deletedKey = { eventDate: '2026-09-11', category: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Unexcused Absence' };
  assert.deepEqual(only(ev('Unexcused Absence', 0, '2026-09-11', 'uri://gbisd.edu'), { deletedKey }),
    ['Event #1 (2026-09-11): this event was deleted earlier and must not be present']);
  assert.deepEqual(only(ev('Excused Absence', 0, '2026-09-11'), { deletedKey }), []);
  assert.deepEqual(only(ev('Unexcused Absence', 0, '2026-09-12'), { deletedKey }), []);
});

test('findEventProblems: a non-array input has no problems', () => {
  assert.deepEqual(u.findEventProblems(undefined), []);
});

test('findEventProblems on the clean sample without endDate returns []', () => {
  assert.deepEqual(u.findEventProblems(sample, { beginDate: '2026-08-24' }), []);
});

test('changeProblem: a missing current value is never a change (null/undefined/empty)', () => {
  assert.match(u.changeProblem('', undefined), /no value/);
  assert.match(u.changeProblem(null, undefined), /no value/);
  assert.match(u.changeProblem(undefined, null), /no value/);
  assert.match(u.changeProblem('2027-05-28', ''), /no value/);
});

test('changeProblem: same value is not a change; a new value is', () => {
  assert.match(u.changeProblem(1200, 1200), /did not change/);
  assert.equal(u.changeProblem(1200, 1800), null);
  assert.equal(u.changeProblem(null, '2027-05-28'), null);
  assert.equal(u.changeProblem(undefined, 0), null);
});

test('cohortKeyOf flattens a cohortReference and returns "none" without one', () => {
  assert.equal(u.cohortKeyOf({ cohortIdentifier: 'READ-T2-001-GRP-A', educationOrganizationId: 9999999911 }), 'READ-T2-001-GRP-A|9999999911');
  assert.equal(u.cohortKeyOf(undefined), 'none');
  assert.equal(u.cohortKeyOf({}), 'none');
  // Adding a cohort counts as a change; keeping the same one does not.
  assert.equal(u.changeProblem('none', 'READ-T2-001-GRP-A|9999999911'), null);
  assert.match(u.changeProblem('READ-T2-001-GRP-A|9999999911', 'READ-T2-001-GRP-A|9999999911'), /did not change/);
});

test('joinIds sorts and joins without spaces', () => {
  assert.equal(u.joinIds(['207289', '207288']), '207288,207289');
});

test('meetingTimesKeyOf is order-independent and returns "none" without times', () => {
  const a = [{ startTime: '09:00:00', endTime: '09:30:00' }, { startTime: '08:00:00', endTime: '08:30:00' }];
  assert.equal(u.meetingTimesKeyOf(a), '08:00:00-08:30:00|09:00:00-09:30:00');
  assert.equal(u.meetingTimesKeyOf([...a].reverse()), u.meetingTimesKeyOf(a));
  assert.equal(u.meetingTimesKeyOf(undefined), 'none');
  assert.equal(u.meetingTimesKeyOf([]), 'none');
  assert.equal(u.meetingTimesKeyOf([{ startTime: '08:00:00' }]), 'none');
});

test('diagnosesKeyOf is order-independent and returns "none" without descriptors', () => {
  const rf = 'uri://gbisd.edu/DiagnosisDescriptor#Reading Fluency';
  const la = 'uri://ed-fi.org/DiagnosisDescriptor#Low Attendance';
  assert.equal(u.diagnosesKeyOf([{ diagnosisDescriptor: rf }, { diagnosisDescriptor: la }]), `${la}|${rf}`);
  assert.equal(u.diagnosesKeyOf([{ diagnosisDescriptor: la }, { diagnosisDescriptor: rf }]), `${la}|${rf}`);
  assert.equal(u.diagnosesKeyOf(undefined), 'none');
  assert.equal(u.diagnosesKeyOf([{}]), 'none');
  // A restored record without diagnoses never matches a saved list.
  assert.notEqual(u.diagnosesKeyOf([]), u.diagnosesKeyOf([{ diagnosisDescriptor: rf }]));
});

test('isEdFiDefaultDescriptor flags only the uri://ed-fi.org namespace', () => {
  assert.equal(u.isEdFiDefaultDescriptor('uri://ed-fi.org/AttendanceEventCategoryDescriptor#Excused Absence'), true);
  assert.equal(u.isEdFiDefaultDescriptor('  URI://Ed-Fi.org/AttendanceEventCategoryDescriptor#X'), true);
  assert.equal(u.isEdFiDefaultDescriptor('uri://gbisd.edu/AttendanceEventCategoryDescriptor#Session Not Held'), false);
  assert.equal(u.isEdFiDefaultDescriptor('uri://ed-fi.org.example/AttendanceEventCategoryDescriptor#X'), false);
  assert.equal(u.isEdFiDefaultDescriptor(undefined), false);
});

test('dependencyName joins scenario and step', () => {
  assert.equal(u.dependencyName('A', '01 - x'), 'A › 01 - x');
});

// fetchRecords / resolveCurrentId are covered for both copies in lookup-helpers.test.cjs.
