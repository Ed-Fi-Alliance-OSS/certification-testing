// Function-level tests for bruno/MTSS/logging.js and its parity with bruno/SIS/logging.js.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const log = require('../MTSS/logging.js');

const MTSS_ONLY = ['logSpecIntervention', 'logSpecStudentInterventionAssociation', 'logSpecStudentInterventionAttendanceEvent', 'logDosageMeasures'];

// Source text of a function, or of a spec object with its resolvers' source, ignoring line
// endings (the two copies may be checked out with different EOLs). Normalise inside the
// replacer: JSON.stringify escapes real line breaks, so a later replace would miss them.
const fnText = f => String(f).replace(/\r\n/g, '\n');
const source = v => (typeof v === 'function' ? fnText(v) : JSON.stringify(v, (k, x) => (typeof x === 'function' ? fnText(x) : x)));

// A record where any property path resolves: Array.isArray is true, array methods call their
// callbacks and string methods return a string, so every spec resolver and nested callback runs.
function deepRecord(depth = 0) {
  const target = depth > 6 ? [] : [null];
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (prop === Symbol.toPrimitive) return () => 'x';
      if (prop === 'then' || prop === 'toJSON') return undefined;
      if (prop === '0') return depth > 6 ? undefined : deepRecord(depth + 1);
      if (prop === 'length') return t.length;
      if (typeof prop === 'symbol' || prop in Array.prototype) {
        const v = Reflect.get(t, prop, proxy);
        return typeof v === 'function' ? v.bind(proxy) : v;
      }
      if (prop in String.prototype) return () => 'x';
      return depth > 6 ? undefined : deepRecord(depth + 1);
    }
  });
  return proxy;
}

const silent = fn => {
  const { info, error } = console;
  const lines = [];
  console.info = (...a) => lines.push(a.join(' '));
  console.error = (...a) => lines.push(a.join(' '));
  try { return { value: fn(), lines }; } finally { Object.assign(console, { info, error }); }
};

test('logging.js shares every SIS function unchanged and adds only the MTSS specs', () => {
  const sis = require('../SIS/logging.js');
  const differ = Object.keys(sis).filter(k => k in log && source(sis[k]) !== source(log[k]));
  assert.deepEqual(differ, []);
  assert.deepEqual(Object.keys(sis).filter(k => !(k in log)), [], 'every SIS export also exists in MTSS');
  assert.deepEqual(Object.keys(log).filter(k => !(k in sis)).sort(), [...MTSS_ONLY].sort());
});

test('every logSpec resolves all of its keys (no resolver throws)', () => {
  const specs = Object.entries(log).filter(([k]) => k.startsWith('logSpec'));
  assert.equal(specs.length, 48);
  for (const [name, spec] of specs) {
    for (const [key, resolver] of Object.entries(spec)) {
      assert.ok(typeof resolver === 'function' || typeof resolver === 'string', `${name}.${key} must be a resolver or a path`);
    }
    const { value } = silent(() => log.buildLogObject(deepRecord(), spec));
    assert.deepEqual(Object.keys(spec).filter(k => !(k in value)), [], `${name} lost keys`);
  }
});

test('buildLogObject resolves path strings, adds id and lastModifiedDate, and returns {} when a resolver throws', () => {
  const o = log.buildLogObject({ id: 'a', school: { id: 7 } }, { schoolId: 'school.id', missing: 'nope.deeper' });
  assert.deepEqual(Object.keys(o), ['schoolId', 'missing', 'id', 'lastModifiedDate']);
  assert.equal(o.schoolId, 7);
  assert.equal(o.missing, undefined);
  assert.equal(o.id, 'a');
  const { value, lines } = silent(() => log.buildLogObject({}, { boom: r => r.not.there }));
  assert.deepEqual(value, {});
  assert.match(lines[0], /Error building log object/);
});

test('lastModifiedDate is annotated with dayjs when available, else passed through', () => {
  const when = '2020-01-02T03:04:05Z';
  const { lastModifiedDate } = log.buildLogObject({ _lastModifiedDate: when }, {});
  assert.ok(lastModifiedDate === when || /^2020-01-0[12]T\d\d:04:05Z \(CST\) \(before today\)$/.test(lastModifiedDate), lastModifiedDate);
  assert.equal(log.buildLogObject({}, {}).lastModifiedDate, undefined);
});

test('logScenario logs only the filter keys plus id and lastModifiedDate', () => {
  const { value, lines } = silent(() => log.logScenario('Intervention', '01 - x', { id: 'i1', a: 1, b: 2 }, { a: 'a', b: 'b' }, ['a']));
  assert.deepEqual(Object.keys(value), ['id', 'a', 'lastModifiedDate']);
  assert.match(lines[0], /^Intervention > Scenario 01 - x - API Response:/);
  const all = silent(() => log.logScenario('E', 's', { id: 'i1', a: 1 }, { a: 'a' })).value;
  assert.deepEqual(Object.keys(all), ['a', 'id', 'lastModifiedDate']);
});

test('logExpectedVsActual returns the actual values for the expected keys', () => {
  const { value, lines } = silent(() => log.logExpectedVsActual('Cohort', { id: 'c1', code: 'G1', other: 9 }, { code: 'code', other: 'other' }, { code: 'G1' }));
  assert.deepEqual(Object.keys(value), ['id', 'code', 'lastModifiedDate']);
  assert.match(lines[0], /^Cohort - Actual:/);
  assert.match(lines[1], /^Cohort - Expected:/);
});

test('logActualAndExpectedMerged marks matches (case-insensitive), mismatches and missing expectations', () => {
  const actual = { id: 'x', name: 'Small Group', code: 'A', extra: 'e' };
  const spec = { name: 'name', code: 'code', extra: 'extra' };
  const { value } = silent(() => log.logActualAndExpectedMerged('E', 's', actual, spec, { name: 'small group', code: 'B', extra: '' }));
  assert.deepEqual(value, {
    name: 'Small Group', '✓-name-expected': 'small group',
    code: 'A', '✗-code-expected': 'B',
    extra: 'e', '✓-extra-expected': '(Not Provided)',
    lastModifiedDate: undefined
  });
  const strict = silent(() => log.logActualAndExpectedMerged('E', 's', actual, spec, { name: 'small group' }, { ignoreCase: false, displayLastModifiedDate: false })).value;
  assert.deepEqual(strict, { name: 'Small Group', '✗-name-expected': 'small group' });
});
