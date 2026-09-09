const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('GAS/メール送信管理.js','utf8');
const venueSource=fs.readFileSync('GAS/会場.js','utf8');
const recordSource=fs.readFileSync('GAS/SQL研修記録接続.js','utf8');

test('mail preview uses the same recipient-specific location URL builder as sending',()=>{
  const start=source.indexOf('function getMailPreviewUrls_(');
  const end=source.indexOf('\nfunction hasLocationCheckinVenue_',start);
  const block=source.slice(start,end);
  assert.match(block,/buildLocationCheckinUrl_\(training, member\)/);
  assert.doesNotMatch(block,/token=preview/);
});

test('location mail resolves venue coordinates from SQL after cutover',()=>{
  assert.match(venueSource,/isSqlTrainingRecordEnabled_\(\)/);
  assert.match(venueSource,/getSqlVenueMastersForGas_\(\)/);
  assert.match(recordSource,/venues\(limit:1000\)\{[^}]*latitude longitude geoRadius geoCheckedAt geoMemo active/);
  assert.match(recordSource,/function getSqlVenueMastersForGas_\(\)/);
});
