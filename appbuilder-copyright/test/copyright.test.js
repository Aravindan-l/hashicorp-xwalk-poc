const { test } = require('node:test');
const assert = require('node:assert/strict');
const { main, buildCopyright, newYearInstant } = require('../actions/copyright/index.js');

const CONFIG = { OWNER: 'HashiCorp, an IBM Company', TIME_ZONE: 'America/Los_Angeles', START_YEAR: '' };
const at = (iso) => new Date(iso);
const opts = (extra = {}) => ({ owner: CONFIG.OWNER, timeZone: CONFIG.TIME_ZONE, ...extra });

test('one second before New Year in Pacific time is still 2026', () => {
  const r = buildCopyright(at('2026-12-31T23:59:59-08:00'), opts());
  assert.equal(r.year, 2026);
  assert.equal(r.text, '© 2026 HashiCorp, an IBM Company');
  assert.equal(r.maxAge, 1);
});

test('midnight on 1 January in Pacific time is 2027', () => {
  const r = buildCopyright(at('2027-01-01T00:00:00-08:00'), opts());
  assert.equal(r.year, 2027);
  assert.equal(r.text, '© 2027 HashiCorp, an IBM Company');
});

test('UTC is already in 2027 but Pacific time is not: company time zone wins', () => {
  const r = buildCopyright(at('2027-01-01T05:00:00Z'), opts()); // 21:00 on 31 Dec in California
  assert.equal(r.year, 2026);
});

test('the same instant gives 2027 for a company time zone east of UTC', () => {
  const r = buildCopyright(at('2027-01-01T05:00:00Z'), opts({ timeZone: 'Asia/Kolkata' }));
  assert.equal(r.year, 2027);
});

test('START_YEAR shows a range, and a single year when it is the current year', () => {
  assert.equal(buildCopyright(at('2027-06-01T12:00:00Z'), opts({ startYear: '2013' })).text, '© 2013–2027 HashiCorp, an IBM Company');
  assert.equal(buildCopyright(at('2027-06-01T12:00:00Z'), opts({ startYear: '2027' })).text, '© 2027 HashiCorp, an IBM Company');
  assert.equal(buildCopyright(at('2027-06-01T12:00:00Z'), opts({ startYear: 'abc' })).text, '© 2027 HashiCorp, an IBM Company');
});

test('cache lifetime is one hour, but never past New Year', () => {
  assert.equal(buildCopyright(at('2026-07-01T12:00:00Z'), opts()).maxAge, 3600);
  assert.equal(buildCopyright(at('2026-12-31T23:30:00-08:00'), opts()).maxAge, 1800);
});

test('New Year instant is computed in the company time zone', () => {
  assert.equal(newYearInstant(2027, 'America/Los_Angeles').toISOString(), '2027-01-01T08:00:00.000Z');
  assert.equal(newYearInstant(2027, 'Asia/Kolkata').toISOString(), '2026-12-31T18:30:00.000Z');
  assert.equal(newYearInstant(2027, 'UTC').toISOString(), '2027-01-01T00:00:00.000Z');
});

test('web action returns 200 JSON with a cache header', () => {
  const res = main(CONFIG, at('2027-03-15T10:00:00Z'));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { year: 2027, text: '© 2027 HashiCorp, an IBM Company' });
  assert.equal(res.headers['Cache-Control'], 'public, max-age=3600');
});

test('web action reports configuration problems with 500 and no caching', () => {
  const badZone = main({ ...CONFIG, TIME_ZONE: 'Mars/Olympus' }, at('2027-03-15T10:00:00Z'));
  assert.equal(badZone.statusCode, 500);
  assert.equal(badZone.body.error, 'TIME_ZONE is not a valid time zone');
  assert.equal(badZone.headers['Cache-Control'], 'no-store');
  const noOwner = main({ ...CONFIG, OWNER: ' ' }, at('2027-03-15T10:00:00Z'));
  assert.equal(noOwner.statusCode, 500);
  assert.equal(noOwner.body.error, 'OWNER is not configured');
});
