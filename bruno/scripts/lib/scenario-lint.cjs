/**
 * Scenario-level lint for collections whose scenarios carry a scenario.config.json (MTSS).
 *
 * The meta/seq and docs regexes match the Admin App catalog parser
 * (packages/api/src/certification/catalog/catalog.service.ts), so this lint fails
 * exactly where the catalog would mis-load a scenario.
 */
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'scenario.config.json';
const SEQ_RE = /^meta \{[\s\S]*?\bseq:\s*(\d+)/m;
const DOCS_RE = /^docs \{([\s\S]*?)\n\}/m;
const DOCS_TASK_RE = /^\s*(\d+)\.\s*__(CREATE|UPDATE|DELETE)__/gm;
const TOP_KEYS = ['$schema', 'version', 'option', 'provides', 'needs', 'steps'];
const STEP_KEYS = ['optional', 'option'];

function isOption(o) {
  return o && typeof o === 'object' && typeof o.group === 'string' && Number.isInteger(o.choice) && o.choice >= 1
    && Object.keys(o).every(k => k === 'group' || k === 'choice');
}

function isStringArray(a) {
  return Array.isArray(a) && a.every(x => typeof x === 'string');
}

function shapeProblems(cfg) {
  const out = [];
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) return ['config must be a JSON object'];
  Object.keys(cfg).filter(k => !TOP_KEYS.includes(k)).forEach(k => out.push(`unknown key "${k}"`));
  if (!Number.isInteger(cfg.version) || cfg.version < 1) out.push('"version" must be an integer >= 1');
  if (cfg.option !== undefined && !isOption(cfg.option)) out.push('"option" must be { group: string, choice: integer >= 1 }');
  if (cfg.provides !== undefined && !isStringArray(cfg.provides)) out.push('"provides" must be an array of strings');
  if (cfg.needs !== undefined) {
    const ok = Array.isArray(cfg.needs) && cfg.needs.every(n => n && typeof n.scenario === 'string' && isStringArray(n.vars)
      && Object.keys(n).every(k => k === 'scenario' || k === 'vars'));
    if (!ok) out.push('"needs" must be an array of { scenario: string, vars: string[] }');
  }
  if (cfg.steps !== undefined) {
    if (!cfg.steps || typeof cfg.steps !== 'object' || Array.isArray(cfg.steps)) {
      out.push('"steps" must be an object keyed by step file name');
    } else {
      for (const [file, s] of Object.entries(cfg.steps)) {
        const ok = s && typeof s === 'object' && Object.keys(s).every(k => STEP_KEYS.includes(k))
          && (s.optional === undefined || typeof s.optional === 'boolean')
          && (s.option === undefined || isOption(s.option));
        if (!ok) out.push(`steps entry "${file}" must be { optional?: boolean, option?: { group, choice } }`);
      }
    }
  }
  return out;
}

function readConfig(scenarioDir, report) {
  const file = path.join(scenarioDir, CONFIG_FILE);
  if (!fs.existsSync(file)) {
    report(file, `${CONFIG_FILE} is missing`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    report(file, `${CONFIG_FILE} is not valid JSON: ${e.message}`);
    return null;
  }
}

/**
 * Lints every scenario folder directly under `domainDir`.
 * @param {string} domainDir e.g. bruno/MTSS/v5/intervention
 * @returns {Array<{file: string, level: 'ERROR'|'WARN', message: string}>}
 */
function lintScenarios(domainDir) {
  const problems = [];
  const report = (file, message, level = 'ERROR') => problems.push({ file, level, message });

  const scenarios = fs.readdirSync(domainDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const configs = {};
  for (const name of scenarios) configs[name] = readConfig(path.join(domainDir, name), report);

  for (const name of scenarios) {
    const dir = path.join(domainDir, name);
    const cfgFile = path.join(dir, CONFIG_FILE);
    const cfg = configs[name];
    const stepFiles = fs.readdirSync(dir).filter(f => f.endsWith('.bru') && f !== 'folder.bru').sort();

    // Unique seq per scenario (catalog keys step order and docs types by seq).
    const seqs = new Map();
    for (const f of stepFiles) {
      const m = fs.readFileSync(path.join(dir, f), 'utf8').match(SEQ_RE);
      const seq = m ? parseInt(m[1], 10) : null;
      if (seq === null) {
        report(path.join(dir, f), 'step has no meta seq');
        continue;
      }
      if (seqs.has(seq)) report(path.join(dir, f), `duplicate seq ${seq} (also "${seqs.get(seq)}")`);
      else seqs.set(seq, f);
    }

    // folder.bru docs: one `N. __TYPE__` line per step, N = step seq.
    const folderBru = path.join(dir, 'folder.bru');
    const folderContent = fs.existsSync(folderBru) ? fs.readFileSync(folderBru, 'utf8') : '';
    const docs = (folderContent.match(DOCS_RE) || [])[1] || '';
    const tasks = [...docs.matchAll(DOCS_TASK_RE)].map(m => parseInt(m[1], 10));
    if (tasks.length !== stepFiles.length) {
      report(folderBru, `docs list ${tasks.length} task(s) but the scenario has ${stepFiles.length} step(s)`);
    }
    for (const n of tasks) {
      if (!seqs.has(n)) report(folderBru, `docs task ${n} has no step with seq ${n}`);
    }

    if (!cfg) continue;
    shapeProblems(cfg).forEach(msg => report(cfgFile, msg));

    const steps = cfg.steps && typeof cfg.steps === 'object' ? cfg.steps : {};
    for (const key of Object.keys(steps)) {
      if (!stepFiles.includes(key)) report(cfgFile, `steps entry "${key}" does not match a step file`);
    }

    for (const need of Array.isArray(cfg.needs) ? cfg.needs : []) {
      if (!need || typeof need.scenario !== 'string') continue;
      if (!scenarios.includes(need.scenario)) {
        report(cfgFile, `needs scenario "${need.scenario}" is not a scenario folder`);
        continue;
      }
      const provided = (configs[need.scenario] && configs[need.scenario].provides) || [];
      for (const v of Array.isArray(need.vars) ? need.vars : []) {
        if (!provided.includes(v)) report(cfgFile, `needs var "${v}" is not in "${need.scenario}" provides`);
      }
    }

    // Human markers in names must have machine-readable markers.
    const folderOption = name.match(/\[OPTION (\d+)\]/);
    if (folderOption && !(cfg.option && cfg.option.choice === parseInt(folderOption[1], 10))) {
      report(cfgFile, `folder name has [OPTION ${folderOption[1]}] but has no option ${folderOption[1]} marker`, 'WARN');
    }
    for (const f of stepFiles) {
      const s = steps[f] || {};
      const opt = f.match(/\[OPTION (\d+)\]/);
      if (opt && !(s.option && s.option.choice === parseInt(opt[1], 10))
        && !(cfg.option && cfg.option.choice === parseInt(opt[1], 10))) {
        report(cfgFile, `"${f}" has [OPTION ${opt[1]}] but has no option ${opt[1]} marker`, 'WARN');
      }
      if (/\[optional\]/i.test(f) && s.optional !== true) {
        report(cfgFile, `"${f}" has [optional] but is not marked optional`, 'WARN');
      }
    }
  }
  return problems;
}

module.exports = { lintScenarios, CONFIG_FILE };
