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

test('joinIds sorts and joins without spaces', () => {
  assert.equal(u.joinIds(['207289', '207288']), '207288,207289');
});

test('dependencyName joins scenario and step', () => {
  assert.equal(u.dependencyName('A', '01 - x'), 'A › 01 - x');
});

test('resolveCurrentId returns the single id, else the fallback', async () => {
  let url;
  const fake = body => ({
    getEnvVar: () => 'http://x',
    sendRequest: async (opts, cb) => { url = opts.url; return cb(null, { data: body }); }
  });
  assert.equal(await u.resolveCurrentId(fake([{ id: 'new' }]), 'ed-fi/interventions', { a: '1 2' }, 'old'), 'new');
  assert.equal(url, 'http://x/ed-fi/interventions?a=1%202');
  assert.equal(await u.resolveCurrentId(fake([]), 'ed-fi/interventions', { a: '1' }, 'old'), 'old');
  assert.equal(await u.resolveCurrentId(fake([{ id: 1 }, { id: 2 }]), 'ed-fi/interventions', {}, 'old'), 'old');
});

test('fetchRecords returns the array body, or null on error / non-array', async () => {
  const fake = (err, data) => ({ getEnvVar: () => 'http://x', sendRequest: async (_o, cb) => cb(err, { data }) });
  assert.deepEqual(await u.fetchRecords(fake(null, [{ id: 'a' }]), 'p', { q: '1' }), [{ id: 'a' }]);
  assert.equal(await u.fetchRecords(fake(new Error('x')), 'p', {}), null);
  assert.equal(await u.fetchRecords(fake(null, { message: 'bad' }), 'p', {}), null);
});

test('resolveCurrentId sends the collection bearer token (sendRequest does not inherit auth)', async () => {
  let headers;
  const fake = {
    getEnvVar: k => (k === 'edFiCertToken' ? 'tok' : 'http://x'),
    sendRequest: async (opts, cb) => { headers = opts.headers; return cb(null, { data: [] }); }
  };
  await u.resolveCurrentId(fake, 'p', {}, 'old');
  assert.equal(headers.Authorization, 'Bearer tok');
});

test('resolveCurrentId returns the fallback on request error', async () => {
  const fake = { getEnvVar: () => 'http://x', sendRequest: async (_o, cb) => cb(new Error('boom')) };
  assert.equal(await u.resolveCurrentId(fake, 'p', {}, 'old'), 'old');
});
