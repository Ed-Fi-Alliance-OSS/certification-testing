// Unit tests for the general helpers in bruno/MTSS/utils.js (variables, dependency checks,
// descriptors, pickers) and for the expectChanged/expectUnchanged wiring to Bruno's sandbox
// globals `test` and `expect`.
const nodeTest = require('node:test');
const assert = require('node:assert/strict');
const u = require('../MTSS/utils.js');

const it = nodeTest.test;

function fakeBru(initial = {}) {
  const vars = { ...initial };
  return { vars, getVar: k => vars[k], setVar: (k, v) => { vars[k] = v; }, deleteVar: k => { delete vars[k]; } };
}

// Runs fn with Bruno-like `test`/`expect` globals; returns the recorded test results.
function withSandbox(fn) {
  const results = [];
  const expect = (actual, msg) => ({
    to: { equal: expected => { if (actual !== expected) throw new Error(msg || `${actual} !== ${expected}`); } },
    equals: expected => { if (actual !== expected) throw new Error(msg || `${actual} !== ${expected}`); }
  });
  const saved = { test: globalThis.test, expect: globalThis.expect };
  globalThis.test = (name, body) => { try { body(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.message }); } };
  globalThis.expect = expect;
  try { fn(); } finally { globalThis.test = saved.test; globalThis.expect = saved.expect; }
  return results;
}

const quiet = fn => {
  const { log, warn, error } = console;
  console.log = console.warn = console.error = () => {};
  try { return fn(); } finally { Object.assign(console, { log, warn, error }); }
};

it('helpers shared with SIS are identical, except the intentional expectChanged difference', () => {
  const sis = require('../SIS/utils.js');
  const ALLOWED_DIFFERENCES = ['expectChanged'];
  const shared = Object.keys(sis).filter(k => k in u);
  const differ = shared.filter(k => String(sis[k]) !== String(u[k]));
  assert.deepEqual(differ, ALLOWED_DIFFERENCES);
  assert.deepEqual(Object.keys(sis).filter(k => !(k in u)), [], 'every SIS helper also exists in MTSS');
});

it('validateDependency passes when the variable has a value', () => {
  assert.equal(u.validateDependency(fakeBru({ a: 'x' }), 'a', 'Scenario › 01'), true);
  assert.equal(u.validateDependency(fakeBru({ a: 0 }), 'a', 'Scenario › 01'), true);
});

it('validateDependency throws naming the step to run, with the action hint', () => {
  assert.throws(() => quiet(() => u.validateDependency(fakeBru({ a: '' }), 'a', 'Scenario › 01', { actionHint: 'Only for OPTION 2' })),
    e => /Run "Scenario › 01" first/.test(e.message) && /Missing required variable "a"/.test(e.message) && /> Only for OPTION 2/.test(e.message));
});

it('validateDependency only warns when throwOnMissing is false', () => {
  assert.equal(quiet(() => u.validateDependency(fakeBru(), 'a', 'S', { throwOnMissing: false })), false);
});

it('descriptor helpers extract, map and join code values', () => {
  assert.equal(u.extractDescriptor('uri://ed-fi.org/X#Small Group'), 'Small Group');
  assert.equal(u.extractDescriptor(5), 5);
  assert.deepEqual(u.mapDescriptors([{ d: 'uri://a#One' }, { d: 'uri://a#Two' }], x => x.d), ['One', 'Two']);
  assert.deepEqual(u.mapDescriptors(null, x => x), []);
  assert.equal(u.joinDescriptors(['One', 'Two']), 'One, Two');
  assert.equal(u.joinDescriptors(undefined), '');
});

it('variable helpers get, set and wipe through bru', () => {
  const bru = fakeBru({ a: 1, b: 2 });
  assert.deepEqual(u.getVars(bru, ['a', 'b']), { a: 1, b: 2 });
  assert.deepEqual(u.getVars(bru, []), {});
  quiet(() => u.setVars(bru, { c: 3 }, 'Entity'));
  assert.equal(bru.vars.c, 3);
  u.setVar(bru, 'd', 4);
  u.wipeVar(bru, 'd');
  assert.equal('d' in bru.vars, false);
  quiet(() => u.wipeVars(bru, ['a', 'b'], 'Entity'));
  assert.deepEqual(bru.vars, { c: 3 });
});

it('wipeVars can throw the not-found error after wiping', () => {
  const bru = fakeBru({ a: 1 });
  assert.throws(() => quiet(() => u.wipeVars(bru, ['a'], 'Intervention', true)), /No Intervention found, or multiple records were returned/);
  assert.equal('a' in bru.vars, false);
});

it('pickSingle returns the only item, else null', () => {
  assert.equal(u.pickSingle([1]), 1);
  assert.equal(u.pickSingle([1, 2]), null);
  assert.equal(u.pickSingle([]), null);
  assert.equal(u.pickSingle(undefined), null);
});

it('generateId returns a 10-digit numeric string', () => {
  assert.match(u.generateId(), /^\d{10}$/);
});

it('encodeDescriptorUri encodes the code value and #, leaving other input alone', () => {
  assert.equal(u.encodeDescriptorUri('uri://ed-fi.org/D#Small Group'), 'uri://ed-fi.org/D%23Small%20Group');
  assert.equal(u.encodeDescriptorUri('uri://ed-fi.org/D%23Small'), 'uri://ed-fi.org/D%23Small');
  assert.equal(u.encodeDescriptorUri('Small Group'), 'Small Group');
  assert.equal(u.encodeDescriptorUri(''), '');
});

it('encodeDescriptorParameter reads, decodes and re-encodes one query parameter', () => {
  const url = 'http://x/ed-fi/a?eventDate=2026-09-08&category=uri://ed-fi.org/C%23In%20Attendance';
  assert.equal(u.encodeDescriptorParameter(url, 'category'), 'uri://ed-fi.org/C%23In%20Attendance');
  assert.equal(u.encodeDescriptorParameter('http://x/a?b=1', 'category', 'uri://d#Code'), 'uri://d%23Code');
  assert.equal(u.encodeDescriptorParameter('http://x/a', 'category'), '');
});

it('expectChanged registers a passing test for a real change and a failing one otherwise', () => {
  const results = withSandbox(() => {
    u.expectChanged(1200, 1800, 'maxDosage');
    u.expectChanged(1200, 1200, 'maxDosage');
    u.expectChanged('2027-05-28', undefined, 'endDate', true);
  });
  assert.deepEqual(results.map(r => [r.name, r.ok]), [['maxDosage changed', true], ['maxDosage changed', false], ['endDate', false]]);
  assert.match(results[1].error, /maxDosage did not change/);
  assert.match(results[2].error, /endDate has no value after the update/);
});

it('expectUnchanged registers an equality test', () => {
  const results = withSandbox(() => {
    u.expectUnchanged(900, 900, 'dosage');
    u.expectUnchanged(900, 600, 'dosage restored', true);
  });
  assert.deepEqual(results.map(r => [r.name, r.ok]), [['dosage unchanged', true], ['dosage restored', false]]);
});
