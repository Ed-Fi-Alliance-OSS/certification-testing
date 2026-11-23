const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rs = require('../../scripts/run-scenarios.cjs');

// Captured from @usebruno/cli 3.x on Windows (backslashes) against a local stub server.
const CLI_OUTPUT = [
  'v5\\_e2e\\X\\001 - probe ok (200 OK) - 15 ms',
  'Post-Response Tests',
  '   ✕ fails',
  '      expected 1 to equal 2',
  '   ✓ passes',
  'Assertions',
  '   ✓ res.status: eq 200',
  'v5/_e2e/X/002 - probe delete (404 Not Found) - 3 ms',
  'Post-Response Tests',
  '   ✓ var carried',
  'Assertions',
  '   ✓ res.status: in 204,404',
  '',
  '📊 Execution Summary'
].join('\n');

test('parseMtssRequests reads both slash styles and counts tests plus assertions', () => {
  assert.deepEqual(rs.parseMtssRequests(CLI_OUTPUT), [
    { name: '001 - probe ok', statusCode: 200, passed: 2, failed: 1 },
    { name: '002 - probe delete', statusCode: 404, passed: 2, failed: 0 }
  ]);
});

test('mtssStepResults passes on zero failures whatever the status code, and fails missing steps', () => {
  const requests = rs.parseMtssRequests(CLI_OUTPUT);
  const results = rs.mtssStepResults(['001 - probe ok', '002 - probe delete', '003 - never ran'], requests);
  assert.deepEqual(results.map(r => r.status), ['FAIL', 'PASS', 'NOT_EXECUTED']);
  assert.equal(results[1].httpStatus, 404);
  assert.equal(results[2].assertionsFailed, 1);
});

test('buildE2eFolder copies ordered files with new seq, prefixed names and placeholders replaced', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-repo-'));
  const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dest-')), 'X');
  fs.mkdirSync(path.join(repo, 'a'), { recursive: true });
  fs.mkdirSync(path.join(repo, 'b'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'a', '01 - seed.bru'), 'meta {\n  name: 01 - seed\n  type: http\n  seq: 7\n}\n\npost {\n  url: {{resourceBaseUrl}}/x/[LEA_ID]\n}\n');
  fs.writeFileSync(path.join(repo, 'b', '01 - check.bru'), 'meta {\n  name: 01 - check\n  type: http\n  seq: 1\n}\n\nget {\n  url: {{resourceBaseUrl}}/y?id=[ENTER FIRST ID]\n}\n');

  const names = rs.buildE2eFolder(['a/01 - seed.bru', 'b/01 - check.bru'], dest, { LEA_ID: 255901, 'ENTER FIRST ID': 'abc' }, repo);

  assert.deepEqual(names, ['001 - 01 - seed', '002 - 01 - check']);
  const second = fs.readFileSync(path.join(dest, '002 - 01 - check.bru'), 'utf8');
  assert.match(second, /name: 002 - 01 - check\n/);
  assert.match(second, /seq: 2\n/);
  assert.match(second, /y\?id=abc/);
  assert.match(fs.readFileSync(path.join(dest, '001 - 01 - seed.bru'), 'utf8'), /\/x\/255901/);
});

test('buildE2eFolder throws when an ordered file does not exist', () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-dest-'));
  assert.throws(() => rs.buildE2eFolder(['nope.bru'], path.join(dest, 'X'), {}, dest), /not found/);
});

test('collectionGroupFilter keeps Intervention configs for mtss only', () => {
  assert.equal(rs.includeGroup('mtss', 'Intervention'), true);
  assert.equal(rs.includeGroup('mtss', 'MasterSchedule'), false);
  assert.equal(rs.includeGroup('sis', 'Intervention'), false);
  assert.equal(rs.includeGroup('sis', 'MasterSchedule'), true);
});
