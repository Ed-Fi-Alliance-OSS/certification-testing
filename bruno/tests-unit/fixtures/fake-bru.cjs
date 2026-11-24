// Stand-in for the Bruno CLI used by run-scenarios-main.test.cjs. Called as
// `bru run "<folder>" --env "<env>"` from the automation root, it prints each request of the
// folder (in meta seq order) in the CLI 3.x format, then the 3.x summary table.
// Markers in a .bru file: FAKE_FAIL → the assertion fails; FAKE_NO_ASSERT → no assertions.
const fs = require('fs');
const path = require('path');

const folder = process.argv[3];
const dir = path.resolve(process.cwd(), folder);
const items = fs.readdirSync(dir)
  .filter(f => f.endsWith('.bru') && f !== 'folder.bru')
  .map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const seq = Number((text.match(/seq:\s*(\d+)/) || [])[1] || 0);
    const name = ((text.match(/name:\s*(.+)/) || [])[1] || f.replace(/\.bru$/, '')).trim();
    return { text, seq, name };
  })
  .sort((a, b) => a.seq - b.seq);

let passed = 0;
let total = 0;
for (const item of items) {
  const fail = item.text.includes('FAKE_FAIL');
  console.log(`${folder}/${item.name} (${fail ? '400 Bad Request' : '200 OK'}) - 1 ms`);
  if (item.text.includes('FAKE_NO_ASSERT')) continue;
  console.log('Assertions');
  console.log(fail ? '   ✕ res.status: eq 200' : '   ✓ res.status: eq 200');
  total += 1;
  if (!fail) passed += 1;
  console.log('');
}
console.log('📊 Execution Summary');
console.log(`│ Assertions    │ ${passed}/${total} │`);
process.exit(passed === total ? 0 : 1);
