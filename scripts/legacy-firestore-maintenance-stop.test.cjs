const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const firestore = fs.readFileSync('GAS/Firestore.js', 'utf8');
const members = fs.readFileSync('GAS/会員.js', 'utf8');
const page = fs.readFileSync('public/system-check.html', 'utf8');
const systemCheck = fs.readFileSync('GAS/システム確認.js', 'utf8');

test('pending Firestore reception import stops before creating a trigger', () => {
  const start = firestore.indexOf('function queuePendingCheckinSheetSync_()');
  const guard = firestore.indexOf('!isFirestoreEnabled_()', start);
  const trigger = firestore.indexOf('schedulePendingCheckinSheetSyncTrigger_', start);
  assert.ok(start >= 0 && guard > start && trigger > guard);
});

test('member Firestore sync stops before reading the spreadsheet master', () => {
  const start = members.indexOf('function syncCurrentMemberMasterToFirestoreChunk_(');
  const guard = members.indexOf('!isFirestoreEnabled_()', start);
  const read = members.indexOf('getMemberRowsFromMaster_()', start);
  assert.ok(start >= 0 && guard > start && read > guard);
});

test('system check page exposes no legacy Firestore maintenance buttons', () => {
  assert.doesNotMatch(page, /onclick="(?:syncMembersToFirestore|syncCheckinsToFirestore|syncPendingCheckinsToSheet)\(\)"/);
});

test('SQL runtime system check tells administrators not to re-enable Firestore', () => {
  assert.match(systemCheck, /SQL移行済みのため使用していません。/);
  assert.match(systemCheck, /FIRESTORE_ENABLEDは再有効化しないでください。/);
});
