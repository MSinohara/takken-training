const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

function page(name, sql) {
  const elements = new Map();
  const requests = [];
  const renders = [];
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { style: {}, value: '', textContent: '', innerHTML: '' });
      return elements.get(id);
    },
  };
  const context = vm.createContext({
    document, URLSearchParams, location: { search: '?event=TEST' },
    window: { sqlAttendanceReady: Promise.resolve(sql) },
    console: { error() {} }, escapeHtml: String,
    jsonp(action, values, callback) { requests.push({ action, values, callback }); },
    capture(value) { renders.push(value); },
  });
  const html = readFileSync(resolve(__dirname, '../public', name), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const source = scripts.at(-1)[1].replace(/load(?:Responses|AttendanceList)\(\);\s*$/, '');
  new vm.Script(source).runInContext(context);
  vm.runInContext(name.includes('print')
    ? 'renderItemFilter = function() {}; renderPrintContent = function() { capture(currentResponses); };'
    : 'renderYearOptions = function() {}; renderAttendanceList = function(rows) { capture(rows); };', context);
  return { context, document, requests, renders, run: (code) => vm.runInContext(code, context) };
}

test('SQL print succeeds without any GAS request, including zero responses', async () => {
  const p = page('attendance-print.html', { loadAdminResponses: async () => ({ training: {}, items: [{ itemId: 'one' }], responses: [] }) });
  await p.run('loadResponses()');
  assert.equal(p.requests.length, 0);
  assert.equal(p.renders.length, 1);
  assert.equal(p.renders[0].length, 0);
});

test('SQL responses without items never fall back to legacy', async () => {
  const p = page('attendance-print.html', { loadAdminResponses: async () => ({ items: [], responses: [{ note: 'current' }] }) });
  await p.run('loadResponses()');
  assert.equal(p.requests.length, 0);
  assert.equal(p.renders[0][0].note, 'current');
});

test('empty SQL attendance falls back to legacy once', async () => {
  const p = page('attendance-print.html', { loadAdminResponses: async () => ({ items: [], responses: [] }) });
  await p.run('loadResponses()');
  assert.equal(p.requests.length, 1);
  p.requests[0].callback({ ok: true, responses: [{ note: 'legacy' }] });
  assert.equal(p.renders[0][0].note, 'legacy');
});

test('SQL failure prevents stale legacy print', async () => {
  const p = page('attendance-print.html', { loadAdminResponses: async () => { throw new Error('offline'); } });
  await p.run('loadResponses()');
  assert.equal(p.requests.length, 0);
  assert.equal(p.renders.length, 0);
  assert.match(p.document.getElementById('status').textContent, /取得できません/);
});

test('later search wins even if earlier SQL response arrives last', async () => {
  const pending = [];
  const p = page('attendance-list.html', { mergeAdminAttendanceList: (rows) => new Promise(resolve => pending.push(() => resolve(rows))) });
  p.run('loadAttendanceList()');
  const old = p.requests[0].callback({ ok: true, attendances: [{ eventId: 'old' }] });
  await new Promise(setImmediate);
  p.run('loadAttendanceList()');
  const latest = p.requests[1].callback({ ok: true, attendances: [{ eventId: 'latest' }] });
  await new Promise(setImmediate);
  pending[1]();
  await latest;
  pending[0]();
  await old;
  assert.equal(p.renders.length, 1);
  assert.equal(p.renders[0][0].eventId, 'latest');
});

test('list SQL failure does not display legacy counts as current', async () => {
  const p = page('attendance-list.html', { mergeAdminAttendanceList: async () => { throw new Error('offline'); } });
  p.run('loadAttendanceList()');
  await p.requests[0].callback({ ok: true, attendances: [{ answeredCount: 99 }] });
  assert.equal(p.renders.length, 0);
  assert.match(p.document.getElementById('status').textContent, /取得できません/);
});
