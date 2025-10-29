#!/usr/bin/env node
/**
 * run-scenarios.cjs
 *
 * Purpose:
 *  Orchestrates automated QA runs for Bruno collections. It creates a clean
 *  mirror under automation-testing/, applies data placeholders from each
 *  entity's test-config.json, rewrites meta.seq to match declared order, and
 *  executes Bruno once per unique folder referenced in the order list.
 *
 * Key behaviors:
 *  - Discovers entity folders by locating test-config.json under bruno/Tests.
 *  - Requires both `name` and `order` in test-config.json; each missing item
 *    is recorded as a config error step (FAIL).
 *  - Performs exact placeholder replacement for keys or [KEY] across .bru/.json files.
 *  - Executes Bruno folder(s) with stderr merged into stdout for chronological output.
 *  - Parses per-request HTTP status and assertion pass/fail counts.
 *  - Generates per-entity JSON result files and a slim aggregate summary.json.
 *  - Optional flag `--include-steps` adds per-step details to the aggregate summary.
 *  - Always writes last-output.txt for debugging the most recent Bruno execution.
 *
 * Flags:
 *  --entities A,B,C    Limit processing to specified folder entity names.
 *  --include-steps     Include detailed per-step data in aggregate summary.json.
 *
 * Exit code:
 *  0 if all processed entities have zero failed assertions and no config errors.
 *  1 otherwise.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TESTS_ROOT = path.join(ROOT, 'bruno', 'Tests');
const SIS_ROOT = path.join(ROOT, 'bruno', 'SIS');
const AUTOMATION_ROOT = path.join(ROOT, 'automation-testing');

function log(msg) { console.log(msg); }
function error(msg) { console.error(msg); }

/**
 * Parse CLI arguments.
 * Supported options:
 *  --entities <csv>     Filter by entity folder names (matches directory name, not cfg.name)
 *  --include-steps      Include per-step details inside aggregate summary.json
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const entities = [];
  let includeSteps = false;
  let envName = 'ci.ed-fi.org';
  for (let i=0; i<args.length; i++) {
    if (args[i] === '--entities') {
      const list = args[i+1];
      i++;
      if (list) list.split(',').map(s=>s.trim()).filter(Boolean).forEach(e=>entities.push(e));
    } else if (args[i] === '--include-steps') {
      includeSteps = true;
    } else if (args[i] === '--env' || args[i] === '-env') {
      const val = args[i+1];
      i++;
      if (val) envName = val.trim();
    }
  }
  return { entitiesFilter: entities, includeSteps, envName };
}

/**
 * Recursively find all test-config.json files under the Tests root.
 * Returns absolute file paths.
 */
function findEntityConfigs() {
  const results = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name === 'test-config.json') {
        // entity folder is parent
        results.push(full);
      }
    }
  };
  walk(TESTS_ROOT);
  return results;
}

/**
 * Load and parse JSON test-config file. Throws with contextual error on invalid JSON.
 */
function loadTestConfig(configPath) {
  const raw = fs.readFileSync(configPath, 'utf8');
  try { return JSON.parse(raw); } catch (e) { throw new Error(`Invalid JSON in ${configPath}: ${e.message}`); }
}

/**
 * Derive group and entity folder names from a test-config path.
 * Expected structure: .../Tests/v4/<group>/<entity>/test-config.json
 */
function deriveEntityInfo(configPath) {
  // Expect pattern .../Tests/v4/<group>/<entity>/test-config.json
  const parts = configPath.split(path.sep);
  const idx = parts.lastIndexOf('v4');
  if (idx === -1) throw new Error(`Cannot derive v4 segment from ${configPath}`);
  const group = parts[idx+1];
  const entity = parts[idx+2];
  return { group, entity };
}

/**
 * Delete and recreate automation-testing root. Retries transient Windows lock errors.
 */
function resetAutomationRoot() {
  if (fs.existsSync(AUTOMATION_ROOT)) {
    let attempts = 0;
    while (attempts < 5) {
      try {
        fs.rmSync(AUTOMATION_ROOT, { recursive: true, force: true });
        break;
      } catch (e) {
        if (e.code === 'EBUSY' || e.code === 'EPERM') {
          attempts++;
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200); // small delay
          continue;
        } else {
          throw e;
        }
      }
    }
  }
  fs.mkdirSync(AUTOMATION_ROOT, { recursive: true });
}

/**
 * Copy entire Tests and SIS collections into automation root for isolated mutation.
 */
function copyEntireCollections() {
  copyDirRecursive(TESTS_ROOT, AUTOMATION_ROOT);
  copyDirRecursive(SIS_ROOT, AUTOMATION_ROOT);
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (e.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

/**
 * Apply placeholder replacements for a single entity's mirrored folder.
 * Only processes .bru and .json files at the entity root level.
 */
function mirrorEntity(group, entity, dataMap) {
  // After full copy, just apply replacements in the mirrored entity folders
  const mirrorSISDir = path.join(AUTOMATION_ROOT, 'v4', group, entity);
  [mirrorSISDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isFile() && (f.endsWith('.bru') || f.endsWith('.json'))) {
        let content = fs.readFileSync(fp, 'utf8');
        content = replacePlaceholders(content, dataMap);
        fs.writeFileSync(fp, content, 'utf8');
      }
    }
  });
}

/**
 * Replace raw or bracketed occurrences of each key with its mapped value.
 * Example: KEY or [KEY] -> value
 */
function replacePlaceholders(content, dataMap) {
  for (const [key, value] of Object.entries(dataMap)) {
    const val = typeof value === 'string' ? value : String(value);
    // Replace raw occurrences optionally wrapped in [] already
    // If value currently appears as [KEY] or KEY inside brackets keep only value
    content = content.replace(new RegExp(`\\[?${escapeRegExp(key)}\\]?`, 'g'), val);
  }
  return content;
}

/**
 * Execute ordered .bru requests grouping by folder to minimize Bruno invocations.
 * Returns per-step result objects with assertion counts and HTTP status.
 */
 function executeOrder(orderList, envName) {
  // Group ordered items by folder so each folder is executed only once.
  const byFolder = new Map();
  for (const item of orderList) {
    const folderRel = deriveMergedFolderRelative(item);
    if (!byFolder.has(folderRel)) byFolder.set(folderRel, []);
    byFolder.get(folderRel).push(item);
  }

  const folderExecutions = new Map(); // folderRel -> { raw, requestsParsed }
  for (const [folderRel, items] of byFolder.entries()) {
    const folderAbs = path.join(AUTOMATION_ROOT, folderRel);
    if (!fs.existsSync(folderAbs)) {
      error(`Missing folder for ordered items: ${folderRel}`);
      folderExecutions.set(folderRel, { error: 'FOLDER_NOT_FOUND', requestsParsed: [] });
      continue;
    }
  const exec = runBrunoFolder(folderRel, envName);
    const parsedRequests = parseRequests(exec.raw);
    folderExecutions.set(folderRel, { ...exec, requestsParsed: parsedRequests });
  }

  // Map each order item to its parsed request
  const results = [];
  for (const item of orderList) {
    const folderRel = deriveMergedFolderRelative(item);
    const exec = folderExecutions.get(folderRel);
    if (!exec || exec.error) {
      results.push({ file: item, folder: folderRel, status: 'FOLDER_NOT_FOUND', assertionsPassed: 0, assertionsFailed: 1 });
      continue;
    }
    const requestName = path.basename(item).replace(/\.bru$/,'');
    const req = exec.requestsParsed.find(r => r.name === requestName);
    if (!req) {
      results.push({ file: item, folder: folderRel, status: 'NOT_EXECUTED', assertionsPassed: 0, assertionsFailed: 1 });
      continue;
    }
    // Determine pass/fail: HTTP 2xx AND assertionsFailed=0
    const passHttp = req.statusCode && req.statusCode >=200 && req.statusCode <300;
    const status = (passHttp && req.assertionsFailed === 0) ? 'PASS' : 'FAIL';
    results.push({
      file: item,
      folder: folderRel,
      status,
      httpStatus: req.statusCode,
      assertionsPassed: req.assertionsPassed,
      assertionsFailed: req.assertionsFailed
    });
  }
  return results;
 }

/**
 * Given an original .bru path, derive relative folder path (e.g., v4/Group/Entity).
 */
 function deriveMergedFolderRelative(originalPath) {
  // Original examples: bruno/Tests/v4/MasterSchedule/BellSchedules/01 - CREATE a BellSchedule.bru
  // We need: v4/MasterSchedule/BellSchedules
  const norm = originalPath.replace(/\\/g,'/');
  const parts = norm.split('/');
  const v4Index = parts.indexOf('v4');
  if (v4Index === -1) return norm; // fallback
  // folder path components up to entity (exclude file name)
  const relParts = parts.slice(v4Index, parts.length - 1);
  return relParts.join('/');
 }

/**
 * Invoke Bruno CLI for a folder, attempt PATH first then fallback to npx install.
 * Merges stderr into stdout to preserve chronological ordering.
 * Writes last-output.txt for each execution (overwrites each time).
 */
 function runBrunoFolder(relativeFolder, envName) {
  // Run Bruno with stderr redirected to stdout to preserve chronological ordering.
  // Previous approach concatenated stdout + stderr which caused out-of-order lines.
  const baseCmd = `bru run "${relativeFolder}" --env ${envName} 2>&1`;
  let proc = spawnSync(baseCmd, {
    encoding: 'utf8', cwd: AUTOMATION_ROOT, env: { ...process.env, FORCE_COLOR: '0' }, shell: true
  });
  let combined = proc.stdout || '';
  let exitCode = proc.status;
  // Fallback to npx package invocation if summary line not detected (CLI not on PATH)
  if (!/Assertions:\s+\d+\s+passed/i.test(combined)) {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const fallbackCmd = `${npxCmd} -p @usebruno/cli bru run "${relativeFolder}" --env ${envName} 2>&1`;
    proc = spawnSync(fallbackCmd, {
      encoding: 'utf8', cwd: AUTOMATION_ROOT, env: { ...process.env, FORCE_COLOR: '0' }, shell: true
    });
    combined = proc.stdout || '';
    exitCode = proc.status;
  }
  if (!runBrunoFolder._printedSample) {
    const head = combined.split(/\r?\n/).slice(0,40).join('\n');
    const tail = combined.split(/\r?\n/).slice(-15).join('\n');
    log('[DEBUG] Bruno output (head):\n' + head);
    log('[DEBUG] Bruno output (tail):\n' + tail);
    log('[DEBUG] Exit code: ' + exitCode);
    runBrunoFolder._printedSample = true;
  }
  const summary = parseBrunoSummary(combined);
  // Always write last-output.txt for debugging (overwrites each folder execution)
  try {
    const resultsDir = path.join(AUTOMATION_ROOT, 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, 'last-output.txt'), combined, 'utf8');
  } catch {}
  const status = summary.assertionsFailed === 0 && exitCode === 0 ? 'PASS' : 'FAIL';
  return {
    status,
    assertionsPassed: summary.assertionsPassed,
    assertionsFailed: summary.assertionsFailed,
    raw: combined
  };
 }

/**
 * Parse the final Assertions summary line from Bruno output.
 * Uses the last occurrence if multiple appear.
 */
 function parseBrunoSummary(output) {
  // Expected lines similar to:
  // Requests:    3 passed, 3 total
  // Tests:       0 passed, 0 total
  // Assertions:  17 passed, 17 total
  let assertionsPassed = 0;
  let assertionsTotal = 0;
  const lines = output.split(/\r?\n/);
  // Some executions print summary twice; take the last occurrence
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    const m = l.match(/Assertions:\s+(\d+)\s+passed,\s+(\d+)\s+total/i);
    if (m) {
      assertionsPassed = parseInt(m[1],10);
      assertionsTotal = parseInt(m[2],10);
      break;
    }
  }
  return { assertionsPassed, assertionsFailed: assertionsTotal - assertionsPassed };
 }

// Helper (currently unused externally) to map original source to mirrored path if needed later.
function getMirroredPath(original) {
  // Map bruno/Tests/... to automation-testing/Tests/... similarly for SIS
  const rel = path.relative(ROOT, original);
  if (rel.startsWith(path.join('bruno', 'Tests'))) {
    return path.join(AUTOMATION_ROOT, rel.substring(path.join('bruno', 'Tests').length + 1));
  }
  if (rel.startsWith(path.join('bruno', 'SIS'))) {
    return path.join(AUTOMATION_ROOT, rel.substring(path.join('bruno', 'SIS').length + 1));
  }
  return null;
}

/**
 * Parse per-request sections from Bruno output: request header + assertions block.
 * Collects status code, timing, and raw assertion pass/fail counts.
 */
function parseRequests(output) {
  const lines = output.split(/\r?\n/);
  const requestHeaderRegex = /^v4\\.*\\(.+?) \((\d{3}) [A-Za-z ]+\) - (\d+) ms$/;
  const requestHeaderRegexAlt = /^v4\\.*\\(.+?) \((\d{3})\) - (\d+) ms$/; // fallback variant
  const requests = [];
  let current = null;
  let inAssertions = false;
  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    const m = line.match(requestHeaderRegex) || line.match(requestHeaderRegexAlt);
    if (m) {
      // Starting a new request
      current = {
        name: m[1].trim(),
        statusCode: parseInt(m[2],10),
        timeMs: parseInt(m[3],10),
        assertionsPassed: 0,
        assertionsFailed: 0
      };
      requests.push(current);
      inAssertions = false;
      continue;
    }
    if (/^Assertions\s*$/i.test(line.trim())) {
      // Assertions section belongs to last request
      inAssertions = true;
      continue;
    }
    if (inAssertions) {
      if (/^Requests:\s+/i.test(line) || requestHeaderRegex.test(line) || line.trim()==='') {
        inAssertions = false;
        continue;
      }
      // Assertion lines: pass (✓ or encoding artifact Γ£ô), fail (✕ or x / X)
      if (current) {
        if (/^\s+[✓Γ£ô]/.test(line)) {
          current.assertionsPassed += 1;
        } else if (/^\s+[✕xX]/.test(line)) {
          current.assertionsFailed += 1;
        }
      }
    }
  }
  return requests;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Persist per-entity results as JSON and log concise console summary.
 */
function summarizeEntity(entity, results) {
  const totalPass = results.reduce((a,r)=>a+r.assertionsPassed,0);
  const totalFail = results.reduce((a,r)=>a+r.assertionsFailed,0);
  const summary = { entity, totalPass, totalFail, steps: results };
  const resultsDir = path.join(AUTOMATION_ROOT, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const jsonPath = path.join(resultsDir, `${entity}.json`);
  // For console visibility still print a concise summary
  const lines = [`Entity: ${entity}`, `Assertions Passed: ${totalPass}`, `Assertions Failed: ${totalFail}`];
  for (const r of results) lines.push(`${r.status} - ${r.file} (pass:${r.assertionsPassed} fail:${r.assertionsFailed})`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
  log(lines.join('\n'));
  return summary;
}

// Removed dynamic ordering helpers; execution order must come explicitly from test-config.json

/**
 * Rewrite meta.seq inside each ordered .bru file to reflect declared order.
 */
function rewriteMetaSeq(group, entity, orderedPaths) {
  // After placeholders: update meta seq values inside mirrored automation directory
  const targetDir = path.join(AUTOMATION_ROOT, 'v4', group, entity);
  if (!fs.existsSync(targetDir)) return;
  let seq = 1;
  for (const originalPath of orderedPaths) {
    const fileName = path.basename(originalPath);
    const mirroredFile = path.join(targetDir, fileName);
    if (!fs.existsSync(mirroredFile)) continue;
    let content = fs.readFileSync(mirroredFile, 'utf8');
    // Replace existing meta seq line or insert if missing
    if (/meta\s*{[\s\S]*?seq:\s*\d+/m.test(content)) {
      content = content.replace(/(meta\s*{[\s\S]*?seq:)\s*\d+/m, `$1 ${seq}`);
    } else {
      // Insert seq after 'type: http' if present
      content = content.replace(/(meta\s*{[\s\S]*?type:\s*http)/m, `$1\n  seq: ${seq}`);
    }
    fs.writeFileSync(mirroredFile, content, 'utf8');
    seq++;
  }
}

/**
 * Main orchestration: parse args, mirror collections, process each entity config,
 * execute ordered tests, write aggregate summary, set exit code.
 */
function main() {
  const { entitiesFilter, includeSteps, envName } = parseArgs();
  // Ensure results directory exists early so last-output.txt can be written by first folder execution
  try { fs.mkdirSync(path.join(AUTOMATION_ROOT, 'results'), { recursive: true }); } catch {}
  verifyEnvironmentExists(envName);
  resetAutomationRoot();
  copyEntireCollections();

  const configs = findEntityConfigs();
  if (configs.length === 0) {
    log('No test-config.json files found. Exiting.');
    return;
  }

  const summaries = [];

  // No master entity list; process all found configs unless --entities filters provided.

  for (const cfgPath of configs) {
    const { group, entity } = deriveEntityInfo(cfgPath);
    // Load config early to check optional name override
    const cfg = loadTestConfig(cfgPath);
    const cfgName = typeof cfg.name === 'string' && cfg.name.trim().length ? cfg.name.trim() : entity;
    // Filter precedence: if entitiesFilter provided, match against folder entity identifier only
    if (entitiesFilter.length && !entitiesFilter.includes(entity)) {
      continue;
    }
    const dataMap = cfg.data || {};
    const order = Array.isArray(cfg.order) ? cfg.order : [];

    // Handle missing name and order as config failures. If both missing, report missing name first.
    const configErrors = [];
    if (!cfg.name || !cfg.name.trim().length) {
      configErrors.push('missing name');
    }
    if (!order.length) {
      configErrors.push('missing order');
    }
    if (configErrors.length) {
      for (const ce of configErrors) {
        error(`Entity folder '${entity}' has config error: ${ce}. Marking as failure.`);
      }
      const pseudo = configErrors.map(err => ({
        file: `CONFIG_ERROR: ${err}`,
        folder: '',
        status: 'FAIL',
        httpStatus: undefined,
        assertionsPassed: 0,
        assertionsFailed: 1
      }));
      const summary = summarizeEntity(cfgName, pseudo);
      summaries.push(summary);
      continue; // move to next entity
    }

    log(`Processing entity ${entitiesFilter.length ? entity : cfgName} (${group}) with ${order.length} steps.`);
    // Use folder entity name for directory operations; cfgName only for reporting label
    mirrorEntity(group, entity, dataMap);
    try { rewriteMetaSeq(group, entity, order); } catch (e) { error(`Failed to rewrite meta.seq for ${cfgName}: ${e.message}`); }
  const resultSteps = executeOrder(order, envName);
    const summary = summarizeEntity(cfgName, resultSteps);
    summaries.push(summary);
  }

  // Overall exit code: fail if any entity had failures
  const overallFail = summaries.some(s => s.totalFail > 0);

  // Write aggregate summary.json
  try {
    const aggregate = {
      generatedAt: new Date().toISOString(),
      entities: summaries.map(s => {
        const base = {
          entity: s.entity,
          assertions: {
            passed: s.totalPass,
            failed: s.totalFail,
            total: s.totalPass + s.totalFail
          }
        };
        if (includeSteps) {
          base.steps = s.steps.map(step => ({
            file: step.file,
            status: step.status,
            httpStatus: step.httpStatus,
            assertionsPassed: step.assertionsPassed,
            assertionsFailed: step.assertionsFailed
          }));
        }
        return base;
      }),
      totals: {
        entitiesProcessed: summaries.length,
        assertionsPassed: summaries.reduce((a,s)=>a+s.totalPass,0),
        assertionsFailed: summaries.reduce((a,s)=>a+s.totalFail,0),
        assertionsTotal: summaries.reduce((a,s)=>a+s.totalPass+s.totalFail,0)
      },
      exitStatus: overallFail ? 'FAIL' : 'PASS'
    };
    const resultsDir = path.join(AUTOMATION_ROOT, 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, 'summary.json'), JSON.stringify(aggregate, null, 2), 'utf8');
  log(`Wrote aggregate summary.json with status ${aggregate.exitStatus}${includeSteps ? ' (steps included)' : ' (steps omitted; use --include-steps to add)'}`);
  } catch (e) {
    error('Failed to write aggregate summary.json: ' + e.message);
  }

  process.exit(overallFail ? 1 : 0);
}

main();

function verifyEnvironmentExists(envName) {
  const testsEnv = path.join(TESTS_ROOT, 'environments', `${envName}.bru`);
  if (!fs.existsSync(testsEnv)) {
    log(`[WARN] Environment '${envName}' not found in Tests environments (expected at ${testsEnv}). Proceeding, but Bruno may error if the env name is invalid.`);
  }
}
