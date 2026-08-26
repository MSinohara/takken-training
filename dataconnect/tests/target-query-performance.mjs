import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  getTrainingTargetForCheckin,
  searchUncheckedTargets,
} from "@takken-training/sql-dataconnect";

const required = ["FIREBASE_API_KEY", "FIREBASE_APP_ID"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`不足している環境変数: ${missing.join(", ")}`);
  process.exit(1);
}

const trainingId = process.argv[2];
const targetId = process.argv[3] || "";
const branch = process.argv[4] || undefined;
const district = process.argv[5] || undefined;
if (!trainingId) {
  console.error("研修IDを指定してください。");
  console.error("例: npm run target-query-test -- 2026-020 100737-001 杉並区支部 阿佐谷・西武");
  process.exit(1);
}

initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  appId: process.env.FIREBASE_APP_ID,
  projectId: process.env.FIREBASE_PROJECT_ID || "takken-training-demo",
});
const dataConnect = getDataConnect(connectorConfig);

async function measure(name, action) {
  const startedAt = performance.now();
  const response = await action();
  return {
    name,
    elapsedMs: Math.round(performance.now() - startedAt),
    response,
  };
}

const unchecked = await measure("未受付者50件検索", () =>
  searchUncheckedTargets(
    dataConnect,
    { trainingId, branch, district, limit: 50, offset: 0 },
    { fetchPolicy: "SERVER_ONLY" },
  ),
);
const rows = unchecked.response.data.trainingTargets || [];
const selectedTargetId = targetId || rows[0]?.targetId || "";

let direct = null;
if (selectedTargetId) {
  direct = await measure("受付対象1件確認", () =>
    getTrainingTargetForCheckin(
      dataConnect,
      { trainingId, targetType: "PERSONAL", targetId: selectedTargetId },
      { fetchPolicy: "SERVER_ONLY" },
    ),
  );
}

console.table([
  { test: unchecked.name, elapsedMs: unchecked.elapsedMs, rows: rows.length },
  direct
    ? {
        test: direct.name,
        elapsedMs: direct.elapsedMs,
        rows: direct.response.data.trainingTarget ? 1 : 0,
      }
    : { test: "受付対象1件確認", elapsedMs: "-", rows: 0 },
]);

const slow = unchecked.elapsedMs > 2000 || (direct && direct.elapsedMs > 1000);
if (slow) {
  console.log("WARNING: INDEX利用状況を確認してください。受付専用VIEWは実行計画確認後に判断します。");
} else {
  console.log("PASS: 現段階では受付専用VIEWを追加する必要はありません。");
}
