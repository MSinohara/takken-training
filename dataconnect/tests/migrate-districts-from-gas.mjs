import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const GAS_URL = "https://script.google.com/macros/s/AKfycbz89atrbyCIjnYNBMR8hhACapdhBbhuqNphHX6dlmmCsjrKg0YcZjdvRUghkH6cFIZx/exec";
const root = resolve(".");
const varsDir = resolve(".tmp/migration-vars");
const queries = resolve("dataconnect/admin/queries.gql");

const url = new URL(GAS_URL);
url.searchParams.set("action", "getDistrictsJsonp");
url.searchParams.set("callback", "migrateCallback");
const text = await (await fetch(url)).text();
const match = text.match(/^migrateCallback\((.*)\)\s*;?$/s);
if (!match) throw new Error("地区マスタの応答を解析できません。");
const response = JSON.parse(match[1]);
if (!response.ok) throw new Error(response.message || "地区マスタの取得に失敗しました。");
const now = new Date().toISOString();
const rows = [];
Object.entries(response.districts || {}).forEach(([branch, names]) => {
  names.forEach((districtName, index) => rows.push({
    branch, districtName, active: true, sortOrder: (index + 1) * 10,
    createdAt: now, updatedAt: now,
  }));
});
await mkdir(varsDir, { recursive: true });
const varsFile = resolve(varsDir, "AdminUpsertDistricts.json");
await writeFile(varsFile, JSON.stringify({ data: rows }), "utf8");
const command = process.platform === "win32" ? "npx.cmd" : "firebase";
const args = process.platform === "win32" ? ["firebase-tools"] : [];
const result = spawnSync(command, [
  ...args, "dataconnect:execute", queries, "AdminUpsertDistricts",
  "--service", "takken-training", "--location", "asia-northeast1",
  "--project", "takken-training-demo", "--no-debug-details",
  "--variables", `@${relative(root, varsFile).replaceAll("\\", "/")}`,
], { cwd: root, stdio: "inherit", windowsHide: true, shell: false, env: {
  ...process.env, NODE_OPTIONS: "--use-system-ca", npm_config_cache: resolve(".npm-cache"),
}});
if (result.status !== 0) throw new Error("地区マスタ移行に失敗しました。");
console.log(`地区マスタ移行完了: ${rows.length}件`);
