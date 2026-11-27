// End-to-end tests for scripts/run-scenarios.cjs main(): the real script runs against a
// throwaway repository (RUN_SCENARIOS_ROOT) with a fake `bru` first on PATH, in SIS and MTSS mode.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'run-scenarios.cjs');
const FAKE_BRU = path.join(__dirname, 'fixtures', 'fake-bru.cjs');

// Every temp directory this file creates is removed when the tests finish.
const tempDirs = [];
const tempDir = prefix => { const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix)); tempDirs.push(d); return d; };
after(() => tempDirs.forEach(d => fs.rmSync(d, { recursive: true, force: true })));

// A directory with `bru` (POSIX) and `bru.cmd` (Windows) wrappers around fake-bru.cjs.
function fakeBin() {
  const bin = tempDir('fake-bru-');
  fs.writeFileSync(path.join(bin, 'bru'), `#!/bin/sh\nexec node "${FAKE_BRU}" "$@"\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'bru.cmd'), `@node "${FAKE_BRU}" %*\r\n`);
  return bin;
}
const BIN = fakeBin();

const req = (name, { seq, url = '{{resourceBaseUrl}}/x', marker = '' } = {}) =>
  `meta {\n  name: ${name}\n  type: http\n${seq ? `  seq: ${seq}\n` : ''}}\n\nget {\n  url: ${url}\n}\n${marker ? `\n# ${marker}\n` : ''}`;

function write(root, rel, content) {
  const file = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
}

// Minimal repository: one SIS entity chain and one MTSS chain, both passing.
function repo(mutate) {
  const root = tempDir('rs-main-');
  write(root, 'bruno/Tests/environments/local.bru', 'vars {\n}\n');
  const bell = 'bruno/Tests/v5/MasterSchedule/BellSchedules';
  write(root, `${bell}/01 - CREATE School.bru`, req('01 - CREATE School', { seq: 9, url: '{{resourceBaseUrl}}/schools/[SCHOOL_ID]' }));
  write(root, `${bell}/02 - DELETE School.bru`, req('02 - DELETE School', { seq: 8 }));
  write(root, 'bruno/SIS/v5/MasterSchedule/BellSchedules/01 - BellSchedule is valid.bru', req('01 - BellSchedule is valid'));
  write(root, `${bell}/test-config.json`, {
    name: 'BellSchedules',
    data: { SCHOOL_ID: 1122334455 },
    order: [`${bell}/01 - CREATE School.bru`, 'bruno/SIS/v5/MasterSchedule/BellSchedules/01 - BellSchedule is valid.bru', `${bell}/02 - DELETE School.bru`]
  });
  write(root, 'bruno/Sample Data/MTSS/Dependencies/Dep 1 - School.bru', req('Dep 1 - School', { seq: 2, url: '{{resourceBaseUrl}}/schools/[SCHOOL_ID]' }));
  write(root, 'bruno/MTSS/v5/intervention/Publish/01 - 1st Intervention is valid.bru', req('01 - 1st Intervention is valid', { seq: 1 }));
  write(root, 'bruno/MTSS/bruno.json', '{}');
  write(root, 'bruno/Tests/v5/Intervention/PathOne/test-config.json', {
    name: 'MTSS PathOne',
    data: { SCHOOL_ID: 9999999911 },
    order: ['bruno/Sample Data/MTSS/Dependencies/Dep 1 - School.bru', 'bruno/MTSS/v5/intervention/Publish/01 - 1st Intervention is valid.bru']
  });
  if (mutate) mutate(root);
  return root;
}

function run(root, args) {
  const env = { ...process.env, RUN_SCENARIOS_ROOT: root, FORCE_COLOR: '0' };
  const pathKey = Object.keys(env).find(k => k.toUpperCase() === 'PATH') || 'PATH';
  env[pathKey] = BIN + path.delimiter + env[pathKey];
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 60000 });
  const summaryFile = path.join(root, 'automation-testing', 'results', 'summary.json');
  return { ...r, out: r.stdout + r.stderr, summary: fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, 'utf8')) : null };
}

const steps = summary => summary.entities.flatMap(e => e.steps.map(s => [e.entity, path.basename(s.file).replace(/\.bru$/, ''), s.status]));

test('SIS mode runs the SIS chains only, mirrors placeholders and seq, and passes', () => {
  const root = repo();
  const r = run(root, ['--env', 'local', '--include-steps']);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.summary.exitStatus, 'PASS');
  assert.deepEqual(steps(r.summary), [
    ['BellSchedules', '01 - CREATE School', 'PASS'],
    ['BellSchedules', '01 - BellSchedule is valid', 'PASS'],
    ['BellSchedules', '02 - DELETE School', 'PASS']
  ]);
  assert.deepEqual(r.summary.totals, { entitiesProcessed: 1, assertionsPassed: 3, assertionsFailed: 0, assertionsTotal: 3 });
  const mirrored = dir => fs.readFileSync(path.join(root, 'automation-testing', 'v5', 'MasterSchedule', 'BellSchedules', dir), 'utf8');
  assert.match(mirrored('01 - CREATE School.bru'), /schools\/1122334455/);
  assert.match(mirrored('01 - CREATE School.bru'), /seq: 1\n/);
  assert.match(mirrored('01 - BellSchedule is valid.bru'), /type: http\n  seq: 2\n/, 'seq inserted when missing');
  assert.match(mirrored('02 - DELETE School.bru'), /seq: 3\n/);
  assert.ok(fs.existsSync(path.join(root, 'automation-testing', 'results', 'last-output.txt')));
});

test('SIS mode reports config errors, missing folders/files and failing steps, and exits 1', () => {
  const root = repo(r => {
    write(r, 'bruno/Tests/v5/MasterSchedule/Broken/test-config.json', {});
    write(r, 'bruno/Tests/v5/MasterSchedule/BellSchedules/02 - DELETE School.bru', req('02 - DELETE School', { seq: 8, marker: 'FAKE_FAIL' }));
    const cfg = 'bruno/Tests/v5/MasterSchedule/BellSchedules/test-config.json';
    const c = JSON.parse(fs.readFileSync(path.join(r, cfg), 'utf8'));
    c.order.push('bruno/Tests/v5/Nowhere/Missing/01 - x.bru', 'bruno/Tests/v5/MasterSchedule/BellSchedules/09 - not there.bru');
    write(r, cfg, c);
  });
  const r = run(root, ['--env', 'local', '--include-steps', '--entities', 'BellSchedules,Broken']);
  assert.equal(r.status, 1, r.out);
  assert.equal(r.summary.exitStatus, 'FAIL');
  const byEntity = Object.fromEntries(r.summary.entities.map(e => [e.entity, e.steps.map(s => [s.file, s.status])]));
  assert.deepEqual(byEntity.Broken, [['CONFIG_ERROR: missing name', 'FAIL'], ['CONFIG_ERROR: missing order', 'FAIL']]);
  assert.deepEqual(byEntity.BellSchedules.map(([, status]) => status), ['PASS', 'PASS', 'FAIL', 'FOLDER_NOT_FOUND', 'NOT_EXECUTED']);
  assert.match(r.out, /Missing folder for ordered items: v5\/Nowhere\/Missing/);
});

test('MTSS mode runs each Intervention chain as one Bruno folder and fails a step with no assertions', () => {
  const pass = run(repo(), ['--collection', 'mtss', '--env', 'local', '--include-steps']);
  assert.equal(pass.status, 0, pass.out);
  assert.deepEqual(steps(pass.summary), [
    ['MTSS PathOne', '001 - Dep 1 - School', 'PASS'],
    ['MTSS PathOne', '002 - 01 - 1st Intervention is valid', 'PASS']
  ]);

  const root = repo(r => write(r, 'bruno/MTSS/v5/intervention/Publish/01 - 1st Intervention is valid.bru',
    req('01 - 1st Intervention is valid', { seq: 1, marker: 'FAKE_NO_ASSERT' })));
  const fail = run(root, ['--collection', 'mtss', '--env', 'local', '--include-steps']);
  assert.equal(fail.status, 1, fail.out);
  assert.deepEqual(steps(fail.summary).map(s => s[2]), ['PASS', 'FAIL']);
  assert.equal(fail.summary.totals.assertionsFailed, 1);
});

test('MTSS mode reports a chain whose ordered file is missing as a config error', () => {
  const root = repo(r => {
    const cfg = 'bruno/Tests/v5/Intervention/PathOne/test-config.json';
    const c = JSON.parse(fs.readFileSync(path.join(r, cfg), 'utf8'));
    c.order.push('bruno/MTSS/v5/intervention/Publish/99 - gone.bru');
    write(r, cfg, c);
  });
  const r = run(root, ['--collection', 'mtss', '--env', 'local']);
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /MTSS config 'PathOne'/);
  assert.equal(r.summary.entities[0].steps, undefined, 'steps omitted without --include-steps');
});

test('version filter, unknown environment warning, and a repository without configs', () => {
  const v4 = run(repo(), ['--version', 'v4', '--env', 'not-an-env']);
  assert.equal(v4.status, 0, v4.out);
  assert.match(v4.out, /\[WARN\] Environment 'not-an-env' not found/);
  assert.equal(v4.summary.totals.entitiesProcessed, 0);

  const empty = tempDir('rs-empty-');
  write(empty, 'bruno/Tests/environments/local.bru', 'vars {\n}\n');
  const none = run(empty, ['--env', 'local']);
  assert.equal(none.status, 0, none.out);
  assert.match(none.out, /No test-config.json files found/);
});

test('invalid arguments stop the run with a clear error', () => {
  const r = run(repo(), ['--collection', 'tpdm']);
  assert.notEqual(r.status, 0);
  assert.match(r.out, /Unknown --collection 'tpdm'/);
});
