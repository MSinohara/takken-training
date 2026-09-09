const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const gql = fs.readFileSync('dataconnect/example/queries.gql', 'utf8');
const gas = fs.readFileSync('GAS/位置情報受付.js', 'utf8');

test('admin cancellation and restoration update location token in the same transaction', () => {
  const cancel = gql.slice(gql.indexOf('mutation CancelCheckin('), gql.indexOf('mutation RestoreCheckin('));
  const restore = gql.slice(gql.indexOf('mutation RestoreCheckin('), gql.indexOf('# 係員が取り消した受付'));
  assert.match(cancel, /@transaction/);
  assert.match(cancel, /locationCheckinToken_updateMany/);
  assert.match(cancel, /usedAt: null/);
  assert.match(restore, /@transaction/);
  assert.match(restore, /locationCheckinToken_updateMany/);
  assert.match(restore, /usedAt: \$changedAt/);
});

test('location reception can restore its own cancelled SQL checkin', () => {
  const fn = gas.slice(gas.indexOf('function registerSqlLocationCheckin_'), gas.indexOf('function checkLocationCheckinTime_'));
  assert.match(fn, /RestoreLocationCheckin/);
  assert.match(fn, /checkin_updateMany/);
  assert.match(fn, /cancelled:\{eq:true\}/);
  assert.match(fn, /checkinMethod:\\\"位置情報受付\\\"/);
  assert.match(fn, /checkedInAt:\$usedAt/);
});
