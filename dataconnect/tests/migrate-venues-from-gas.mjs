import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const GAS_URL = "https://script.google.com/macros/s/AKfycbz89atrbyCIjnYNBMR8hhACapdhBbhuqNphHX6dlmmCsjrKg0YcZjdvRUghkH6cFIZx/exec";
const root = resolve(".");
const varsDir = resolve(".tmp/migration-vars");
const queries = resolve("dataconnect/admin/queries.gql");

async function gas() {
  const url = new URL(GAS_URL);
  url.searchParams.set("action", "getVenueMastersJsonp");
  url.searchParams.set("callback", "migrateCallback");
  const text = await (await fetch(url)).text();
  const match = text.match(/^migrateCallback\((.*)\)\s*;?$/s);
  if (!match) throw new Error("会場マスタの応答を解析できません。");
  const result = JSON.parse(match[1]);
  if (!result.ok) throw new Error(result.message || "会場マスタの取得に失敗しました。");
  return result.venues || [];
}

function optional(value) {
  const text = String(value == null ? "" : value).trim();
  return text || null;
}

function numberOrNull(value) {
  const text = String(value == null ? "" : value).trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

await mkdir(varsDir, { recursive: true });
const now = new Date().toISOString();
const rows = (await gas()).map((row) => ({
  venueId: String(row.venueId), venueName: String(row.venueName),
  venueAddress: optional(row.venueAddress), venueContactName: optional(row.venueContactName),
  venueContactPhone: optional(row.venueContactPhone), venueContactMail: optional(row.venueContactMail),
  venueUrl: optional(row.venueUrl), venueApplicationUrl: optional(row.venueApplicationUrl),
  venueCapacity: numberOrNull(row.venueCapacity), latitude: numberOrNull(row.latitude),
  longitude: numberOrNull(row.longitude), geoRadius: numberOrNull(row.geoRadius) || 200,
  geoCheckedAt: row.geoCheckedAt ? new Date(row.geoCheckedAt).toISOString() : null,
  geoMemo: optional(row.geoMemo), active: row.active !== "FALSE", createdAt: now, updatedAt: now,
}));
const varsFile = resolve(varsDir, "AdminUpsertVenues.json");
await writeFile(varsFile, JSON.stringify({ data: rows }), "utf8");
const result = spawnSync("npx.cmd", [
  "firebase-tools", "dataconnect:execute", queries, "AdminUpsertVenues",
  "--service", "takken-training", "--location", "asia-northeast1",
  "--project", "takken-training-demo", "--no-debug-details",
  "--variables", `@${relative(root, varsFile).replaceAll("\\", "/")}`,
], { cwd: root, stdio: "inherit", windowsHide: true, shell: true, env: {
  ...process.env, NODE_OPTIONS: "--use-system-ca", npm_config_cache: resolve(".npm-cache"),
}});
if (result.status !== 0) throw new Error("会場マスタ移行に失敗しました。");
console.log(`会場マスタ移行完了: ${rows.length}件`);
