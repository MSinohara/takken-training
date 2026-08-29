import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const GAS_URL = "https://script.google.com/macros/s/AKfycbz89atrbyCIjnYNBMR8hhACapdhBbhuqNphHX6dlmmCsjrKg0YcZjdvRUghkH6cFIZx/exec";
const root = resolve(".");
const varsDir = resolve(".tmp/migration-vars");
const queries = resolve("dataconnect/admin/queries.gql");

async function gas(action) {
  const url = new URL(GAS_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("callback", "migrateCallback");
  const text = await (await fetch(url)).text();
  const match = text.match(/^migrateCallback\((.*)\)\s*;?$/s);
  if (!match) throw new Error(`${action} の応答を解析できません。`);
  const result = JSON.parse(match[1]);
  if (!result.ok) throw new Error(result.message || `${action} に失敗しました。`);
  return result;
}

async function execute(operation, data) {
  const file = resolve(varsDir, `${operation}.json`);
  await writeFile(file, JSON.stringify({ data }), "utf8");
  const result = spawnSync("npx.cmd", [
    "firebase-tools", "dataconnect:execute", queries, operation,
    "--service", "takken-training", "--location", "asia-northeast1",
    "--project", "takken-training-demo", "--no-debug-details",
    "--variables", `@${relative(root, file).replaceAll("\\", "/")}`,
  ], { cwd: root, stdio: "inherit", windowsHide: true, shell: true, env: {
    ...process.env, NODE_OPTIONS: "--use-system-ca",
    npm_config_cache: resolve(".npm-cache"),
  }});
  if (result.status !== 0) throw new Error(`${operation} に失敗しました。`);
}

await mkdir(varsDir, { recursive: true });
const result = await gas("getEventTypesJsonp");
const now = new Date().toISOString();
const rows = (result.eventTypes || []).map((row) => ({
  eventTypeId: String(row.eventTypeId),
  eventTypeName: String(row.eventTypeName),
  attendanceConfirmDefault: row.attendanceConfirmDefault === "TRUE",
  active: row.active !== "FALSE",
  sortOrder: Number(row.sortOrder || 9999),
  note: row.note || null,
  createdAt: now,
  updatedAt: now,
}));
if (!rows.length) {
  rows.push({
    eventTypeId: "ET-001", eventTypeName: "研修会",
    attendanceConfirmDefault: false, active: true, sortOrder: 10,
    note: null, createdAt: now, updatedAt: now,
  });
}
await execute("AdminUpsertEventTypes", rows);
console.log(`イベント種別移行完了: ${rows.length}件`);
