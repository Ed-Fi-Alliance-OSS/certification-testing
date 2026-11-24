// Pull request comments for CI reports, one comment per report: the first run creates it,
// later runs edit it in place (found by a hidden marker), so re-runs don't add comments.
// Used from actions/github-script by the DataStandard V4/V5 workflows (QA scenarios
// summaries) and the lint workflow (Bruno Lint Report); unit-tested in
// bruno/tests-unit/qa-summary-comment.test.cjs.
const fs = require('fs');

// Markdown summary of run-scenarios' summary.json.
function buildSummaryComment(summaryPath, title, { firstColumn = 'Entity', footer = '' } = {}) {
  if (!fs.existsSync(summaryPath)) {
    const missing = [`### ${title}`, '', ':warning: The run did not produce a summary.json file.'];
    if (footer) missing.push('', footer);
    return missing.join('\n');
  }
  const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const t = data.totals || {};
  const lines = [
    `### ${title}`,
    `Status: **${data.exitStatus}**`,
    `Entities Processed: **${t.entitiesProcessed}**`,
    `Assertions: Passed **${t.assertionsPassed}**, Failed **${t.assertionsFailed}**, Total **${t.assertionsTotal}**`
  ];
  if (Array.isArray(data.entities) && data.entities.length) {
    lines.push('', `| ${firstColumn} | Passed | Failed | Total |`, '|---|---|---|---|');
    for (const e of data.entities) {
      const a = e.assertions || {};
      lines.push(`| ${e.entity} | ${a.passed} | ${a.failed} | ${a.total} |`);
    }
  }
  if (footer) lines.push('', footer);
  return lines.join('\n');
}

// "Updated for <sha> · run <link>" line, so an edited comment shows which run it reflects.
function runFooter(context) {
  const pr = context.payload && context.payload.pull_request;
  const sha = pr && pr.head && pr.head.sha ? pr.head.sha.slice(0, 7) : '';
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  return `<sub>Updated for ${sha ? `\`${sha}\`` : 'this run'} · [workflow run](${runUrl})</sub>`;
}

// Creates the comment, or edits the bot comment that carries the same marker.
async function upsertComment({ github, context, marker, body }) {
  const tag = `<!-- ${marker} -->`;
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;
  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number, per_page: 100 });
  const existing = comments.find(c => c.user && c.user.type === 'Bot' && typeof c.body === 'string' && c.body.includes(tag));
  const fullBody = `${tag}\n${body}`;
  if (existing) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body: fullBody });
    return 'updated';
  }
  await github.rest.issues.createComment({ owner, repo, issue_number, body: fullBody });
  return 'created';
}

// One call per workflow step.
async function postSummary({ github, context, summaryPath, title, marker, firstColumn }) {
  const body = buildSummaryComment(summaryPath, title, { firstColumn, footer: runFooter(context) });
  return upsertComment({ github, context, marker, body });
}

module.exports = { buildSummaryComment, runFooter, upsertComment, postSummary };
