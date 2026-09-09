const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/planned-attendees.html', 'utf8');
const js = fs.readFileSync('public/sql/js/planned-attendees.js', 'utf8');

test('planned attendee district is a branch-linked select', () => {
  assert.match(html, /<select id="district" disabled>/);
  assert.doesNotMatch(html, /<input id="district"/);
  assert.match(js, /adminListDistricts/);
  assert.match(js, /function refreshDistrictOptions\(\)/);
  assert.match(js, /districtMap\[branch\]/);
  assert.match(js, /\$\("branch"\)\.addEventListener\("change"/);
});
