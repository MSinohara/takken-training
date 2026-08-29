import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const GAS_URL = "https://script.google.com/macros/s/AKfycbz89atrbyCIjnYNBMR8hhACapdhBbhuqNphHX6dlmmCsjrKg0YcZjdvRUghkH6cFIZx/exec";
const root = resolve(".");
const varsDir = resolve(".tmp/migration-vars");
const queries = resolve("dataconnect/admin/queries.gql");

async function gas(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("callback", "migrateCallback");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const text = await (await fetch(url)).text();
  const match = text.match(/^migrateCallback\((.*)\)\s*;?$/s);
  if (!match) throw new Error(`${action} の応答を解析できません。`);
  const result = JSON.parse(match[1]);
  if (!result.ok) throw new Error(result.message || `${action} に失敗しました。`);
  return result;
}

async function execute(operation, data) {
  if (!data.length) return;
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
const orgResult = await gas("getOrganizationsJsonp");
const now = new Date().toISOString();
const organizations = (orgResult.organizations || []).map((o) => ({
  orgId: String(o.orgId), orgName: String(o.orgName), senderName: String(o.senderName || o.orgName),
  active: o.active !== "FALSE", hostAvailable: o.hostAvailable === "TRUE",
  csvImportName: o.csvImportName || null, csvImportMode: o.csvImportMode || "所属入替",
  createdAt: now, updatedAt: now,
}));
const memberPairs = new Map();
const personPairs = new Map();
for (const org of organizations) {
  const result = await gas("getOrganizationMembersJsonp", { orgId: org.orgId });
  for (const member of result.members || []) {
    const personalId = String(member.personalId || "").trim();
    const memberNo = String(member.memberNo || "").trim();
    if (!personalId || !memberNo) continue;
    if (personalId.endsWith("-001")) {
      memberPairs.set(`${memberNo}:${org.orgId}`, { memberNo, orgId: org.orgId, createdAt: now });
    } else {
      personPairs.set(`${personalId}:${org.orgId}`, { personalId, orgId: org.orgId, source: "既存組織設定", createdAt: now });
    }
  }
}
await execute("AdminUpsertOrganizations", organizations);
await execute("AdminUpsertMemberOrganizations", [...memberPairs.values()]);
await execute("AdminUpsertPersonOrganizations", [...personPairs.values()]);
console.log(`組織移行完了: 組織 ${organizations.length}件 / 会社所属 ${memberPairs.size}件 / 個人所属 ${personPairs.size}件`);
