const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { lintScenarios } = require('../scripts/lib/scenario-lint.cjs');

const step = (name, seq) => `meta {\n  name: ${name}\n  type: http\n  seq: ${seq}\n}\n\nget {\n  url: {{resourceBaseUrl}}/x\n}\n`;
const folder = (name, seq, types) =>
  `meta {\n  name: ${name}\n  seq: ${seq}\n}\n\ndocs {\n  ## Scenarios tasks\n\n${types.map((t, i) => `  ${i + 1}. __${t}__ something`).join('\n')}\n}\n`;

// Builds a valid two-scenario domain; `mutate(dir)` breaks it for a rule.
function domain(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scn-lint-'));
  const a = path.join(dir, 'Alpha');
  const b = path.join(dir, 'Beta - [PATH 2]');
  fs.mkdirSync(a);
  fs.mkdirSync(b);
  fs.writeFileSync(path.join(a, 'folder.bru'), folder('Alpha', 1, ['CREATE', 'UPDATE']));
  fs.writeFileSync(path.join(a, '01 - 1st X is valid.bru'), step('01 - 1st X is valid', 1));
  fs.writeFileSync(path.join(a, '02 - [optional] - 1st X was Updated.bru'), step('02 - [optional] - 1st X was Updated', 2));
  fs.writeFileSync(path.join(a, 'scenario.config.json'), JSON.stringify({
    version: 1, provides: ['firstXUniqueId'],
    steps: { '02 - [optional] - 1st X was Updated.bru': { optional: true } }
  }));
  fs.writeFileSync(path.join(b, 'folder.bru'), folder('Beta - [PATH 2]', 2, ['DELETE']));
  fs.writeFileSync(path.join(b, '01 - 1st X was Deleted.bru'), step('01 - 1st X was Deleted', 1));
  fs.writeFileSync(path.join(b, 'scenario.config.json'), JSON.stringify({
    version: 1, path: { group: 'g', choice: 2 }, provides: [],
    needs: [{ scenario: 'Alpha', vars: ['firstXUniqueId'] }]
  }));
  if (mutate) mutate({ dir, a, b });
  return dir;
}
const messages = dir => lintScenarios(dir).map(p => `${p.level} ${p.message}`);
const editJson = (file, fn) => fs.writeFileSync(file, JSON.stringify(fn(JSON.parse(fs.readFileSync(file, 'utf8')))));

test('valid domain has no problems', () => {
  assert.deepEqual(messages(domain()), []);
});

test('missing scenario.config.json is an error', () => {
  const m = messages(domain(({ a }) => fs.rmSync(path.join(a, 'scenario.config.json'))));
  assert.ok(m.some(x => x.startsWith('ERROR') && /scenario\.config\.json is missing/.test(x)));
});

test('config without version or with unknown keys is an error', () => {
  const m = messages(domain(({ a }) => editJson(path.join(a, 'scenario.config.json'), c => ({ provides: c.provides, extra: 1 }))));
  assert.ok(m.some(x => /version/.test(x)));
  assert.ok(m.some(x => /unknown key "extra"/.test(x)));
});

test('duplicate step seq is an error', () => {
  const m = messages(domain(({ a }) => fs.writeFileSync(path.join(a, '02 - [optional] - 1st X was Updated.bru'), step('02 - [optional] - 1st X was Updated', 1))));
  assert.ok(m.some(x => x.startsWith('ERROR') && /duplicate seq 1/.test(x)));
});

test('docs task count different from step count is an error', () => {
  const m = messages(domain(({ a }) => fs.writeFileSync(path.join(a, 'folder.bru'), folder('Alpha', 1, ['CREATE']))));
  assert.ok(m.some(x => x.startsWith('ERROR') && /docs list 1 task\(s\) but the scenario has 2 step\(s\)/.test(x)));
});

test('docs task number without a step of that seq is an error', () => {
  const m = messages(domain(({ a }) => fs.writeFileSync(path.join(a, '02 - [optional] - 1st X was Updated.bru'), step('02 - [optional] - 1st X was Updated', 3))));
  assert.ok(m.some(x => /docs task 2 has no step with seq 2/.test(x)));
});

test('steps entry naming a missing file is an error', () => {
  const m = messages(domain(({ a }) => editJson(path.join(a, 'scenario.config.json'), c => ({ ...c, steps: { ...c.steps, 'nope.bru': { optional: true } } }))));
  assert.ok(m.some(x => /steps entry "nope\.bru" does not match a step file/.test(x)));
});

test('needs pointing to an unknown scenario or an unprovided var is an error', () => {
  const m = messages(domain(({ b }) => editJson(path.join(b, 'scenario.config.json'), c => ({
    ...c, needs: [{ scenario: 'Gamma', vars: ['a'] }, { scenario: 'Alpha', vars: ['missingVar'] }]
  }))));
  assert.ok(m.some(x => /needs scenario "Gamma" is not a scenario folder/.test(x)));
  assert.ok(m.some(x => /"missingVar" is not in "Alpha" provides/.test(x)));
});

test('[PATH N] or [optional] names without a matching marker are warnings', () => {
  const m = messages(domain(({ a, b }) => {
    editJson(path.join(b, 'scenario.config.json'), c => { delete c.path; return c; });
    editJson(path.join(a, 'scenario.config.json'), c => ({ ...c, steps: {} }));
  }));
  assert.ok(m.some(x => x.startsWith('WARN') && /\[PATH 2\] but has no path 2 marker/.test(x)));
  assert.ok(m.some(x => x.startsWith('WARN') && /\[optional\] but is not marked optional/.test(x)));
});

test('the retired "option" key is an error; "path" is the marker key', () => {
  const m = messages(domain(({ b }) => editJson(path.join(b, 'scenario.config.json'), c => {
    const { path: marker, ...rest } = c;
    return { ...rest, option: marker };
  })));
  assert.ok(m.some(x => x.startsWith('ERROR') && /unknown key "option"/.test(x)));
});

test('invalid JSON is an error', () => {
  const m = messages(domain(({ a }) => fs.writeFileSync(path.join(a, 'scenario.config.json'), '{ nope')));
  assert.ok(m.some(x => x.startsWith('ERROR') && /not valid JSON/.test(x)));
});
