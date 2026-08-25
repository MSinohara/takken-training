import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, registerPersonalCheckin } from "@takken-training/sql-dataconnect";

const required = ["FIREBASE_API_KEY", "FIREBASE_APP_ID"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`不足している環境変数: ${missing.join(", ")}`);
  console.error("Cloud SQLへData Connectを反映した後、Firebase Webアプリの設定値を指定してください。");
  process.exit(1);
}

const mode = process.argv[2] || "different";
if (!new Set(["different", "same"]).has(mode)) {
  console.error("実行モードは different または same を指定してください。");
  process.exit(1);
}

const requestCount = Number(process.argv[3] || 5);
const trainingId = process.argv[4] || "SQL-TEST-005";
if (!Number.isInteger(requestCount) || requestCount < 1 || requestCount > 10) {
  console.error("同時受付数は1から10で指定してください。");
  process.exit(1);
}

const emulatorHost = process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST;
if (emulatorHost && !emulatorHost.includes("://")) {
  process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST = `http://${emulatorHost}`;
}

initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  appId: process.env.FIREBASE_APP_ID,
  projectId: process.env.FIREBASE_PROJECT_ID || "takken-training-sql-demo",
});
const dataConnect = getDataConnect(connectorConfig);

const candidates = [
  ["90001", "90001-001"],
  ["90002", "90002-001"],
  ["90003", "90003-001"],
  ["90004", "90004-001"],
  ["90005", "90005-001"],
  ["90006", "90006-001"],
  ["90007", "90007-001"],
  ["90008", "90008-001"],
  ["90009", "90009-001"],
  ["90010", "90010-001"],
];
const requests = mode === "same"
  ? Array.from({ length: requestCount }, () => candidates[0])
  : candidates.slice(0, requestCount);

function makeCheckinId(trainingId, personalId) {
  return `${trainingId}:PERSONAL:${personalId}`;
}

async function executeOne([memberNo, personalId], index) {
  const startedAt = performance.now();
  try {
    await registerPersonalCheckin(dataConnect, {
      checkinId: makeCheckinId(trainingId, personalId),
      trainingId,
      memberNo,
      personalId,
      checkinMethod: "LOAD_TEST",
    });
    return { no: index + 1, personalId, result: "受付完了", elapsedMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    const message = String(error?.message || error);
    const duplicate = /unique|duplicate|already exists|ALREADY_EXISTS/i.test(message);
    return {
      no: index + 1,
      personalId,
      result: duplicate ? "既に受付済み" : "失敗",
      elapsedMs: Math.round(performance.now() - startedAt),
      message,
    };
  }
}

const startedAt = performance.now();
const results = await Promise.all(requests.map(executeOne));
const elapsed = Math.round(performance.now() - startedAt);
const completed = results.filter((row) => row.result === "受付完了").length;
const duplicated = results.filter((row) => row.result === "既に受付済み").length;
const failed = results.filter((row) => row.result === "失敗").length;
const elapsedValues = results.map((row) => row.elapsedMs);
const minElapsedMs = Math.min(...elapsedValues);
const maxElapsedMs = Math.max(...elapsedValues);
const averageElapsedMs = Math.round(
  elapsedValues.reduce((sum, value) => sum + value, 0) / elapsedValues.length
);

console.table(results);
console.log({
  mode,
  trainingId,
  total: results.length,
  completed,
  duplicated,
  failed,
  minElapsedMs,
  averageElapsedMs,
  maxElapsedMs,
  totalElapsedMs: elapsed,
});

if (mode === "same" && (completed !== 1 || duplicated !== requestCount - 1)) {
  console.error("FAIL: 同一人物の二重受付防止結果が期待値と一致しません。");
  process.exitCode = 1;
} else if (failed > 0) {
  console.error("FAIL: 受付失敗があります。");
  process.exitCode = 1;
} else {
  console.log("PASS");
}
