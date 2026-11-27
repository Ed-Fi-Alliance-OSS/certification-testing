// Tests for .github/scripts/qa-summary-comment.cjs: the PR summary body and the
// create-once-then-update comment behaviour used by the DataStandard V4/V5 workflows.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const q = require('../../.github/scripts/qa-summary-comment.cjs');

const summaryFile = data => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qa-sum-')), 'summary.json');
  fs.writeFileSync(f, JSON.stringify(data));
  return f;
};

const context = {
  serverUrl: 'https://github.com', runId: 42, repo: { owner: 'o', repo: 'r' },
  payload: { pull_request: { number: 143, head: { sha: '6d3313d0123456789' } } }
};

// Fake Octokit: an in-memory comment list with list/create/update.
function fakeGithub(comments = []) {
  const calls = [];
  const rest = {
    issues: {
      listComments: 'listComments',
      createComment: async args => { calls.push(['create', args]); comments.push({ id: comments.length + 1, user: { type: 'Bot' }, body: args.body }); },
      updateComment: async args => { calls.push(['update', args]); comments.find(c => c.id === args.comment_id).body = args.body; }
    }
  };
  return { calls, comments, rest, paginate: async (fn, args) => { calls.push(['list', args]); return comments; } };
}

test('buildSummaryComment renders status, totals and a per-entity table', () => {
  const f = summaryFile({
    exitStatus: 'PASS',
    totals: { entitiesProcessed: 2, assertionsPassed: 10, assertionsFailed: 0, assertionsTotal: 10 },
    entities: [{ entity: 'PathOne', assertions: { passed: 6, failed: 0, total: 6 } }, { entity: 'PathTwo', assertions: { passed: 4, failed: 0, total: 4 } }]
  });
  const body = q.buildSummaryComment(f, 'MTSS QA Scenarios Summary (DataStandard V5)', { firstColumn: 'Path chain', footer: 'foot' });
  assert.equal(body, [
    '### MTSS QA Scenarios Summary (DataStandard V5)',
    'Status: **PASS**',
    'Entities Processed: **2**',
    'Assertions: Passed **10**, Failed **0**, Total **10**',
    '',
    '| Path chain | Passed | Failed | Total |',
    '|---|---|---|---|',
    '| PathOne | 6 | 0 | 6 |',
    '| PathTwo | 4 | 0 | 4 |',
    '',
    'foot'
  ].join('\n'));
});

test('buildSummaryComment warns when summary.json is missing', () => {
  const body = q.buildSummaryComment(path.join(os.tmpdir(), 'no-such-summary.json'), 'SIS QA Scenarios Summary (DataStandard V4)');
  assert.match(body, /^### SIS QA Scenarios Summary \(DataStandard V4\)\n\n:warning: The run did not produce a summary\.json file\.$/);
});

test('runFooter names the short head sha and links the workflow run', () => {
  assert.equal(q.runFooter(context), '<sub>Updated for `6d3313d` · [workflow run](https://github.com/o/r/actions/runs/42)</sub>');
});

test('upsertComment creates the comment on the first run, then updates it in place', async () => {
  const gh = fakeGithub();
  assert.equal(await q.upsertComment({ github: gh, context, marker: 'qa-scenarios-summary:sis:v5', body: 'first' }), 'created');
  assert.equal(await q.upsertComment({ github: gh, context, marker: 'qa-scenarios-summary:sis:v5', body: 'second' }), 'updated');
  assert.equal(gh.comments.length, 1);
  assert.equal(gh.comments[0].body, '<!-- qa-scenarios-summary:sis:v5 -->\nsecond');
  assert.deepEqual(gh.calls.filter(c => c[0] !== 'list').map(c => c[0]), ['create', 'update']);
  assert.deepEqual(gh.calls[0][1], { owner: 'o', repo: 'r', issue_number: 143, per_page: 100 });
});

test('upsertComment keeps one comment per marker (SIS and MTSS do not overwrite each other)', async () => {
  const gh = fakeGithub();
  await q.upsertComment({ github: gh, context, marker: 'qa-scenarios-summary:sis:v5', body: 'sis' });
  await q.upsertComment({ github: gh, context, marker: 'qa-scenarios-summary:mtss:v5', body: 'mtss' });
  assert.equal(gh.comments.length, 2);
});

test('upsertComment never edits a human comment that quotes the marker', async () => {
  const gh = fakeGithub([{ id: 1, user: { type: 'User' }, body: 'see <!-- qa-scenarios-summary:sis:v5 -->' }]);
  assert.equal(await q.upsertComment({ github: gh, context, marker: 'qa-scenarios-summary:sis:v5', body: 'x' }), 'created');
  assert.equal(gh.comments[0].body, 'see <!-- qa-scenarios-summary:sis:v5 -->');
});

test('postSummary builds the body with the run footer and upserts it', async () => {
  const gh = fakeGithub();
  const f = summaryFile({ exitStatus: 'FAIL', totals: { entitiesProcessed: 1, assertionsPassed: 1, assertionsFailed: 1, assertionsTotal: 2 } });
  await q.postSummary({ github: gh, context, summaryPath: f, title: 'SIS QA Scenarios Summary (DataStandard V5)', marker: 'm', firstColumn: 'Entity' });
  assert.match(gh.comments[0].body, /^<!-- m -->\n### SIS QA Scenarios Summary \(DataStandard V5\)\nStatus: \*\*FAIL\*\*/);
  assert.match(gh.comments[0].body, /Updated for `6d3313d`/);
});
