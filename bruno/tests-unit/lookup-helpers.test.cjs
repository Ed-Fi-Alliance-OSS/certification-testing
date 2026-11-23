// The natural-key lookup helpers exist in two collections (Bruno's sandbox blocks require()
// from parent folders). Both copies must behave the same and stay textually in sync.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const mtss = require('../MTSS/utils.js');
const sampleData = require('../Sample Data/utils.js');

const fake = (body, err) => {
  const calls = [];
  return {
    calls,
    getEnvVar: k => (k === 'edFiCertToken' ? 'tok' : 'http://x'),
    sendRequest: async (opts, cb) => { calls.push(opts); return cb(err || null, { data: body }); }
  };
};

for (const [name, u] of [['MTSS', mtss], ['Sample Data', sampleData]]) {
  test(`${name}: resolveCurrentId returns the single id with the bearer token, else the fallback`, async () => {
    const b = fake([{ id: 'abc' }]);
    assert.equal(await u.resolveCurrentId(b, 'ed-fi/cohorts', { cohortIdentifier: 'G A' }, 'zero'), 'abc');
    assert.equal(b.calls[0].url, 'http://x/ed-fi/cohorts?cohortIdentifier=G%20A');
    assert.equal(b.calls[0].headers.Authorization, 'Bearer tok');
    assert.equal(await u.resolveCurrentId(fake([]), 'p', {}, 'zero'), 'zero');
    assert.equal(await u.resolveCurrentId(fake(null, new Error('x')), 'p', {}, 'zero'), 'zero');
  });

  test(`${name}: fetchRecords returns the array body or null`, async () => {
    assert.deepEqual(await u.fetchRecords(fake([{ id: 1 }]), 'p', {}), [{ id: 1 }]);
    assert.equal(await u.fetchRecords(fake({ message: 'bad' }), 'p', {}), null);
  });
}

test('Sample Data lookup helpers are identical to the MTSS copies', () => {
  assert.equal(sampleData.fetchRecords.toString(), mtss.fetchRecords.toString());
  assert.equal(sampleData.resolveCurrentId.toString(), mtss.resolveCurrentId.toString());
});
