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

// Real @usebruno/cli 3.4.2 output (Windows paths): three passing Reset steps, one step with
// 2 failed post-response tests and 2 failed assertions, and the 3.x summary table. If a CLI
// upgrade changes the format, these tests fail instead of every CI step turning NOT_EXECUTED.
const REAL_OUTPUT = fs.readFileSync(path.join(__dirname, 'fixtures', 'bru-cli-3.4.2-output.txt'), 'utf8');
const STEP_03 = '029 - 03 - 1st Intervention - endDate & maxDosage were Updated';

test('parseMtssRequests reads real CLI 3.4.2 output, counting failed tests and assertions', () => {
  assert.deepEqual(rs.parseMtssRequests(REAL_OUTPUT), [
    { name: '001 - Down 1 - Event 1', statusCode: 404, passed: 1, failed: 0 },
    { name: '002 - Down 2 - Event 2', statusCode: 404, passed: 1, failed: 0 },
    { name: '003 - Down 3 - Event 3', statusCode: 404, passed: 1, failed: 0 },
    { name: STEP_03, statusCode: 200, passed: 26, failed: 4 }
  ]);
});

test('parseBrunoSummary reads the CLI 3.x summary table (passed/total)', () => {
  assert.deepEqual(rs.parseBrunoSummary(REAL_OUTPUT), { assertionsPassed: 106, assertionsFailed: 2 });
});

test('parseBrunoSummary still reads the CLI 1.x/2.x summary line', () => {
  assert.deepEqual(rs.parseBrunoSummary('Requests:    3 passed, 3 total\nAssertions:  17 passed, 18 total\n'), { assertionsPassed: 17, assertionsFailed: 1 });
  assert.deepEqual(rs.parseBrunoSummary('no summary here'), { assertionsPassed: 0, assertionsFailed: 0 });
});

test('parseRequests (SIS) reads real CLI output with Windows and POSIX paths', () => {
  const posix = REAL_OUTPUT.split('\\').join('/');
  for (const out of [REAL_OUTPUT, posix]) {
    const requests = rs.parseRequests(out);
    assert.deepEqual(requests.map(r => r.name), ['001 - Down 1 - Event 1', '002 - Down 2 - Event 2', '003 - Down 3 - Event 3', STEP_03]);
    // SIS counts the Assertions block only.
    assert.deepEqual(requests.map(r => [r.statusCode, r.assertionsPassed, r.assertionsFailed]), [[404, 1, 0], [404, 1, 0], [404, 1, 0], [200, 26, 2]]);
  }
});

test('parseMtssRequests counts a throwing post-response script as a failure', () => {
  // Captured from @usebruno/cli: a post-response throw prints no ✕ line, only this header.
  const out = [
    'v5\\_e2e\\X\\001 - lookup in post-response (200 OK) - 76 ms',
    '[v5\\_e2e\\X\\001 - lookup in post-response.bru] Post-response script error:',
    'Error: Lookup of ed-fi/x failed (HTTP 401).'
  ].join('\n');
  assert.deepEqual(rs.parseMtssRequests(out), [
    { name: '001 - lookup in post-response', statusCode: 200, passed: 0, failed: 1 }
  ]);
});

test('a throwing pre-request script prints no request header, so the step is NOT_EXECUTED', () => {
  const out = [
    '[v5\\_e2e\\X\\001 - lookup in pre-request.bru] Pre-request script error:',
    'Error: Lookup of ed-fi/x failed (HTTP 401).'
  ].join('\n');
  const [result] = rs.mtssStepResults(['001 - lookup in pre-request'], rs.parseMtssRequests(out));
  assert.equal(result.status, 'NOT_EXECUTED');
});

test('mtssStepResults fails a step that ran but checked nothing, and counts it as a failure', () => {
  const [result] = rs.mtssStepResults(['001 - no asserts'], [{ name: '001 - no asserts', statusCode: 200, passed: 0, failed: 0 }]);
  assert.deepEqual(result, { file: '001 - no asserts', status: 'FAIL', httpStatus: 200, assertionsPassed: 0, assertionsFailed: 1 });
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
