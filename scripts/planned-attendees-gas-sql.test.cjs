const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('GAS/受付.js', 'utf8');

test('staff planned attendee list stops before the legacy sheet in SQL runtime', () => {
  const start = source.indexOf('function getPlannedAttendeesForEvent_(');
  const end = source.indexOf('\nfunction ', start + 30);
  const body = source.slice(start, end);
  assert.ok(body.indexOf('isSqlDataRuntime_()') < body.indexOf('getOrCreatePlannedAttendeeSheet_()'));
  assert.match(body, /return getSqlPlannedAttendeesForEvent_\(eventId\)/);
});

test('SQL planned attendee result preserves reception status and location link fields', () => {
  assert.match(source, /function getSqlPlannedAttendeesForEvent_/);
  assert.match(source, /plannedAttendees\(where:/);
  assert.match(source, /checkins\(where:/);
  assert.match(source, /status: checked \? "受付済み" : "未受付"/);
  assert.match(source, /buildPlannedLocationCheckinUrl_/);
});
