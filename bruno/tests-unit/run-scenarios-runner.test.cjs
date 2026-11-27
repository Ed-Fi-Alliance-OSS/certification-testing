// Unit tests for the run-scenarios.cjs entry points used by the MTSS collection:
// argument parsing, the single-process Bruno runner and the MTSS chain executor.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const rs = require('../../scripts/run-scenarios.cjs');

const tmp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

test('parseArgs defaults to the SIS collection on api-v5 with no filters', () => {
  assert.deepEqual(rs.parseArgs([]), {
    entitiesFilter: [], includeSteps: false, envName: 'api-v5.ed-fi.org', versionFilter: 'v5', collection: 'sis'
  });
});

test('parseArgs reads every flag, trims values and lower-cases the collection', () => {
  const args = rs.parseArgs(['--entities', ' A, B ,', '--include-steps', '-env', 'ci-v5.ed-fi.org', '--version', 'v4', '--collection', 'MTSS']);
  assert.deepEqual(args, {
    entitiesFilter: ['A', 'B'], includeSteps: true, envName: 'ci-v5.ed-fi.org', versionFilter: 'v4', collection: 'mtss'
  });
});

test('parseArgs rejects an unknown collection', () => {
  assert.throws(() => rs.parseArgs(['--collection', 'tpdm']), /Unknown --collection 'tpdm'/);
});

test('parseArgs rejects an env name that could inject shell syntax', () => {
  assert.throws(() => rs.parseArgs(['--env', 'ci-v5; rm -rf /']), /Invalid --env/);
  assert.throws(() => rs.parseArgs(['--env', '$(whoami)']), /Invalid --env/);
});

test('runBrunoOnce runs bru in the automation root, quotes the env and saves last-output.txt', () => {
  const root = tmp('rs-root-');
  const calls = [];
  const spawn = (cmd, opts) => { calls.push({ cmd, opts }); return { stdout: 'v5/_e2e/X/001 - a (200 OK) - 1 ms\n' }; };
  const out = rs.runBrunoOnce('v5/_e2e/X', 'ci-v5.ed-fi.org', { spawn, root });
  assert.equal(out, 'v5/_e2e/X/001 - a (200 OK) - 1 ms\n');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].cmd, 'bru run "v5/_e2e/X" --env "ci-v5.ed-fi.org" 2>&1');
  assert.equal(calls[0].opts.cwd, root);
  assert.equal(calls[0].opts.env.FORCE_COLOR, '0');
  assert.equal(fs.readFileSync(path.join(root, 'results', 'last-output.txt'), 'utf8'), out);
});

test('runBrunoOnce falls back to npx when the bru CLI is not on PATH', () => {
  const root = tmp('rs-root-');
  const calls = [];
  const spawn = cmd => {
    calls.push(cmd);
    return calls.length === 1 ? { stdout: "'bru' is not recognized as an internal or external command" } : { stdout: 'ok' };
  };
  assert.equal(rs.runBrunoOnce('v5/_e2e/X', 'local', { spawn, root }), 'ok');
  assert.equal(calls.length, 2);
  assert.match(calls[1], /^npx(\.cmd)? -p @usebruno\/cli bru run "v5\/_e2e\/X" --env "local" 2>&1$/);
});

test('runBrunoOnce also falls back when the shell itself cannot be started (ENOENT)', () => {
  const calls = [];
  const enoent = Object.assign(new Error('spawn /bin/sh ENOENT'), { code: 'ENOENT' });
  const spawn = cmd => { calls.push(cmd); return calls.length === 1 ? { error: enoent } : { stdout: 'ok' }; };
  assert.equal(rs.runBrunoOnce('f', 'local', { spawn, root: tmp('rs-root-') }), 'ok');
  assert.equal(calls.length, 2);
});

test('runBrunoOnce falls back on Ubuntu/dash, where a missing command exits 127', () => {
  const calls = [];
  const spawn = cmd => { calls.push(cmd); return calls.length === 1 ? { status: 127, stdout: 'sh: 1: bru: not found\n' } : { stdout: 'ok' }; };
  assert.equal(rs.runBrunoOnce('f', 'local', { spawn, root: tmp('rs-root-') }), 'ok');
  assert.equal(calls.length, 2);
});

test('bruNotFound: missing command by exit code or message, but never on other failures', () => {
  assert.equal(rs.bruNotFound({ status: 127, stdout: '' }, ''), true);
  assert.equal(rs.bruNotFound({ status: 9009 }, ''), true);
  assert.equal(rs.bruNotFound({ status: 1 }, "'bru' is not recognized as an internal or external command"), true);
  assert.equal(rs.bruNotFound({ status: 1 }, 'bash: bru: command not found'), true);
  // A failing run, or output larger than the buffer, must not re-run the folder through npx.
  assert.equal(rs.bruNotFound({ status: 1 }, '│ Assertions    │ 3/4 │'), false);
  assert.equal(rs.bruNotFound({ error: Object.assign(new Error('spawnSync /bin/sh ENOBUFS'), { code: 'ENOBUFS' }) }, ''), false);
  assert.equal(rs.bruNotFound({ status: 0 }, ''), false);
});

test('executeMtssOrder builds the chain under <root>/<version>/_e2e/<entity> and maps Bruno output to steps', () => {
  const repo = tmp('rs-repo-');
  const root = tmp('rs-auto-');
  fs.mkdirSync(path.join(repo, 'a'));
  fs.writeFileSync(path.join(repo, 'a', '01 - seed.bru'), 'meta {\n  name: 01 - seed\n  type: http\n  seq: 3\n}\n');
  fs.writeFileSync(path.join(repo, 'a', '02 - check.bru'), 'meta {\n  name: 02 - check\n  type: http\n  seq: 4\n}\n');
  let ran;
  const runBruno = (folder, env) => {
    ran = { folder, env };
    return ['v5/_e2e/PathOne/001 - 01 - seed (201 Created) - 3 ms', '   ✓ res.status: eq 201',
      'v5/_e2e/PathOne/002 - 02 - check (200 OK) - 2 ms', '   ✕ value matches'].join('\n');
  };
  const results = rs.executeMtssOrder('v5', 'PathOne', ['a/01 - seed.bru', 'a/02 - check.bru'], {}, 'local', { runBruno, root, repoRoot: repo });
  assert.deepEqual(ran, { folder: 'v5/_e2e/PathOne', env: 'local' });
  assert.ok(fs.existsSync(path.join(root, 'v5', '_e2e', 'PathOne', '002 - 02 - check.bru')));
  assert.deepEqual(results.map(r => [r.file, r.status, r.folder.replace(/\\/g, '/')]), [
    ['001 - 01 - seed', 'PASS', 'v5/_e2e/PathOne'],
    ['002 - 02 - check', 'FAIL', 'v5/_e2e/PathOne']
  ]);
});

test('executeMtssOrder reports a config error without running Bruno when an ordered file is missing', () => {
  let called = false;
  const results = rs.executeMtssOrder('v5', 'PathTwo', ['missing/01 - x.bru'], {}, 'local', {
    runBruno: () => { called = true; return ''; }, root: tmp('rs-auto-'), repoRoot: tmp('rs-repo-')
  });
  assert.equal(called, false);
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'FAIL');
  assert.match(results[0].file, /^CONFIG_ERROR: /);
  assert.equal(results[0].assertionsFailed, 1);
});
