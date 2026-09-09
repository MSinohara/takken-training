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

test('monthly backup has a public Apps Script editor entry point', () => {
  assert.match(source, /function backupMonthlySystem\(\)\s*\{[\s\S]*?backupMonthlySystem_\(\)/);
});

test('backup pagination does not compare SQL collation using JavaScript lexical order', () => {
  const start = source.indexOf('function validateSqlBackupPage_(');
  const end = source.indexOf('\nfunction ', start + 20);
  const body = source.slice(start, end < 0 ? source.length : end);
  assert.doesNotMatch(body, /row\[key\]\s*<=/);
  assert.match(body, /row\[key\]\s*===/);
});

test('scheduled date backup discovers trainings from SQL instead of the legacy sheet', () => {
  const start = source.indexOf('function backupTrainingsByDate_(');
  const end = source.indexOf('\nfunction ', start + 20);
  const body = source.slice(start, end < 0 ? source.length : end);
  assert.ok(body.indexOf('isSqlDataRuntime_()') < body.indexOf('getSpreadsheet_()'));
  assert.match(body, /readSqlTrainingRecordStore_\(\)\.trainings/);
  assert.match(body, /normalizeBackupDateText_\(training\.eventDate\)/);
});

test('development and production can install the same non-duplicated backup triggers', () => {
  assert.match(source, /function setupBackupTriggers\(\)/);
  assert.match(source, /removeBackupTriggers_\(\)/);
  assert.match(source, /everyDays\(1\)[\s\S]*?atHour\(3\)/);
  assert.match(source, /onMonthDay\(1\)[\s\S]*?atHour\(4\)/);
  assert.match(source, /function getBackupTriggerStatus\(\)/);
  assert.match(source, /configured:/);
});
