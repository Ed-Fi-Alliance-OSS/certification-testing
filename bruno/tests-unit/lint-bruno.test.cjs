// Smoke tests for the lint-bruno.cjs CLI against a throwaway collection (BRU_LINT_ROOT),
// covering the MTSS scenario wiring: clean collection passes, a broken scenario.config.json fails.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const LINT = path.join(__dirname, '..', 'scripts', 'lint-bruno.cjs');

function collection(mutate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bru-lint-'));
  const scenario = path.join(root, 'MTSS', 'v5', 'domain', 'Alpha');
  fs.mkdirSync(scenario, { recursive: true });
  fs.writeFileSync(path.join(scenario, 'folder.bru'),
    'meta {\n  name: Alpha\n  seq: 1\n}\n\ndocs {\n  ## Scenarios tasks\n\n  1. __CREATE__ a first X\n}\n');
  fs.writeFileSync(path.join(scenario, '01 - 1st X is valid.bru'),
    'meta {\n  name: 01 - 1st X is valid\n  type: http\n  seq: 1\n}\n\nget {\n  url: {{resourceBaseUrl}}/x\n}\n\nsettings {\n  encodeUrl: true\n}\n');
  fs.writeFileSync(path.join(scenario, 'scenario.config.json'), JSON.stringify({ version: 1, provides: ['firstXUniqueId'] }));
  if (mutate) mutate(scenario);
  return root;
}

const lint = (root, ...args) => spawnSync(process.execPath, [LINT, ...args], {
  encoding: 'utf8', env: { ...process.env, BRU_LINT_ROOT: root }
});

test('lint-bruno passes a clean collection with an MTSS scenario', () => {
  const run = lint(collection());
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /All Bruno files passed lint checks/);
});

test('lint-bruno --json fails and reports the MTSS scenario.config.json problem', () => {
  const run = lint(collection(dir => fs.writeFileSync(path.join(dir, 'scenario.config.json'), JSON.stringify({ provides: [] }))), '--json');
  assert.equal(run.status, 1);
  const { summary, problems } = JSON.parse(run.stdout);
  assert.equal(summary.filesScanned, 2);
  assert.ok(summary.errors >= 1);
  assert.ok(problems.some(p => /scenario\.config\.json/.test(p.file) && /version/.test(p.message)), JSON.stringify(problems));
});

test('lint-bruno warns (exit 0) on a request file without settings encodeUrl', () => {
  const run = lint(collection(dir => fs.writeFileSync(path.join(dir, '01 - 1st X is valid.bru'),
    'meta {\n  name: 01 - 1st X is valid\n  type: http\n  seq: 1\n}\n\nget {\n  url: {{resourceBaseUrl}}/x\n}\n')));
  assert.equal(run.status, 0);
  assert.match(run.stdout, /\[WARN\].*Missing settings encodeUrl/);
  assert.match(run.stdout, /Lint completed with warnings/);
});

test('lint-bruno exits 1 in human mode when a scenario has errors', () => {
  const run = lint(collection(dir => fs.rmSync(path.join(dir, 'scenario.config.json'))));
  assert.equal(run.status, 1);
  assert.match(run.stdout, /scenario\.config\.json is missing/);
  assert.match(run.stdout, /error\(s\) detected/);
});
