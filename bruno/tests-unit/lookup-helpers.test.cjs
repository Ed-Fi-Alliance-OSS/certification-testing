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
const httpError = status => Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });

for (const [name, u] of [['MTSS', mtss], ['Sample Data', sampleData]]) {
  test(`${name}: resolveCurrentId returns the single match's id, sending the bearer token`, async () => {
    const b = fake([{ id: 'abc' }]);
    assert.equal(await u.resolveCurrentId(b, 'ed-fi/cohorts', { cohortIdentifier: 'G A' }, 'zero'), 'abc');
    assert.equal(b.calls[0].url, 'http://x/ed-fi/cohorts?cohortIdentifier=G%20A');
    assert.equal(b.calls[0].headers.Authorization, 'Bearer tok');
  });

  test(`${name}: resolveCurrentId uses the fallback only when the lookup succeeds and finds nothing`, async () => {
    assert.equal(await u.resolveCurrentId(fake([]), 'p', {}, 'zero'), 'zero');
  });

  test(`${name}: resolveCurrentId throws on an ambiguous natural key`, async () => {
    await assert.rejects(u.resolveCurrentId(fake([{ id: 'a' }, { id: 'b' }]), 'ed-fi/cohorts', {}, 'zero'),
      /Lookup of ed-fi\/cohorts matched 2 records instead of one/);
  });

  test(`${name}: resolveCurrentId throws instead of falling back when the lookup fails`, async () => {
    await assert.rejects(u.resolveCurrentId(fake(null, httpError(401)), 'ed-fi/cohorts', {}, 'zero'),
      /Lookup of ed-fi\/cohorts failed \(HTTP 401\)/);
  });

  test(`${name}: fetchRecords returns the array body`, async () => {
    assert.deepEqual(await u.fetchRecords(fake([{ id: 1 }]), 'p', {}), [{ id: 1 }]);
    assert.deepEqual(await u.fetchRecords(fake([]), 'p', {}), []);
  });

  test(`${name}: fetchRecords throws on HTTP errors, network errors, non-list bodies and transport throws`, async () => {
    await assert.rejects(u.fetchRecords(fake(null, httpError(403)), 'p', {}), /\(HTTP 403\)/);
    await assert.rejects(u.fetchRecords(fake(null, new Error('connect ECONNREFUSED')), 'p', {}), /\(connect ECONNREFUSED\)/);
    await assert.rejects(u.fetchRecords(fake({ message: 'bad' }), 'p', {}), /\(the response is not a list\)/);
    const throwing = { getEnvVar: () => 'x', sendRequest: async () => { throw new Error('sandbox'); } };
    await assert.rejects(u.fetchRecords(throwing, 'p', {}), /\(sandbox\)/);
  });
}

test('Sample Data lookup helpers are identical to the MTSS copies', () => {
  assert.equal(sampleData.fetchRecords.toString(), mtss.fetchRecords.toString());
  assert.equal(sampleData.resolveCurrentId.toString(), mtss.resolveCurrentId.toString());
});
