const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('GAS/バックアップ.js', 'utf8');

test('event backup reads attendance history from paged SQL sources', () => {
  assert.match(source, /function writeTrainingHistoryBackupSheet_[\s\S]*?isSqlDataRuntime_[\s\S]*?writeSqlTrainingHistoryBackupSheet_/);
  assert.match(source, /readPaged_\("checkins"/);
  assert.match(source, /readPaged_\("guestCheckins"/);
  assert.match(source, /checkinId:\{gt:\$after\}/);
  assert.match(source, /cancelReason restoredAt restoredBy restoreReason/);
});

test('monthly backup also replaces legacy attendance sheet with SQL history', () => {
  const start = source.indexOf('function copyWholeSheetIfExists_(');
  const end = source.indexOf('\nfunction ', start + 20);
  const body = source.slice(start, end < 0 ? source.length : end);
  assert.match(body, /sheetName === "参加履歴"[\s\S]*?writeSqlTrainingHistoryBackupSheet_/);
});

test('monthly member and organization sheets are read from paged SQL sources', () => {
  for (const sheet of ['会員マスタ', '個人会員', '組織マスタ', '会員所属', '個人所属']) {
    assert.match(source, new RegExp('"' + sheet + '"'));
  }
  assert.match(source, /root: "memberCompanies", key: "memberNo"/);
  assert.match(source, /root: "people", key: "personalId"/);
  assert.match(source, /root: "organizations", key: "orgId"/);
  assert.match(source, /root: "memberOrganizations", firstKey: "memberNo", secondKey: "orgId"/);
  assert.match(source, /root: "personOrganizations", firstKey: "personalId", secondKey: "orgId"/);
  assert.match(source, /_or:\[\{/);
  assert.match(source, /limit:1000/);
});
