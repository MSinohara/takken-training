import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, registerPersonalCheckin } from "./generated.js?v=6";
import { firebaseConfig } from "./config.js?v=16";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
const candidates = Array.from({ length: 10 }, (_, index) => {
  const number = String(90001 + index);
  return { memberNo: number, personalId: `${number}-001`, name: `検証参加者${index + 1}` };
});

function duplicate(error) { return /unique|duplicate|already exists|ALREADY_EXISTS/i.test(String(error?.message || error)); }
async function executeOne(trainingId, candidate, no) {
  const started = performance.now();
  try {
    await registerPersonalCheckin(dc, {
      checkinId: `${trainingId}:PERSONAL:${candidate.personalId}`,
      trainingId, memberNo: candidate.memberNo, personalId: candidate.personalId, checkinMethod: "SQL_LOAD_WEB"
    });
    return { no, ...candidate, result: "受付完了", elapsedMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { no, ...candidate, result: duplicate(error) ? "既受付" : "失敗", elapsedMs: Math.round(performance.now() - started), message: String(error?.message || error) };
  }
}

function metric(label, value) {
  const div = document.createElement("div"); div.className = "metric";
  const small = document.createElement("div"); small.className = "muted"; small.textContent = label;
  const strong = document.createElement("strong"); strong.textContent = value;
  div.append(small, strong); return div;
}

$("run").addEventListener("click", async () => {
  $("run").disabled = true; $("status").textContent = "同時受付を実行中..."; $("status").className = "status";
  const count = Number($("count").value), mode = $("mode").value, trainingId = $("slot").value;
  const targets = mode === "same" ? Array.from({ length: count }, () => candidates[0]) : candidates.slice(0, count);
  const started = performance.now();
  const results = await Promise.all(targets.map((candidate, index) => executeOne(trainingId, candidate, index + 1)));
  const totalMs = Math.round(performance.now() - started), times = results.map((row) => row.elapsedMs);
  const completed = results.filter((row) => row.result === "受付完了").length;
  const duplicated = results.filter((row) => row.result === "既受付").length;
  const failed = results.filter((row) => row.result === "失敗").length;
  const average = Math.round(times.reduce((sum, value) => sum + value, 0) / times.length);
  $("summary").replaceChildren(
    metric("総リクエスト", `${count}件`), metric("受付完了", `${completed}件`), metric("既受付", `${duplicated}件`), metric("失敗", `${failed}件`),
    metric("平均応答", `${average}ms`), metric("最短応答", `${Math.min(...times)}ms`), metric("最大応答", `${Math.max(...times)}ms`), metric("総処理時間", `${totalMs}ms`)
  );
  const table = document.createElement("table"); table.innerHTML = "<thead><tr><th>No</th><th>個人ID</th><th>結果</th><th>応答時間</th><th>メッセージ</th></tr></thead><tbody></tbody>";
  results.forEach((row) => { const tr = document.createElement("tr"); [row.no, row.personalId, row.result, `${row.elapsedMs}ms`, row.message || ""].forEach((value) => { const td = document.createElement("td"); td.textContent = value; tr.append(td); }); table.tBodies[0].append(tr); });
  $("details").replaceChildren(table); $("summaryPanel").hidden = false; $("detailPanel").hidden = false;
  $("status").textContent = failed ? "受付失敗があります。個別結果を確認してください。" : "試験が完了しました。";
  $("status").className = `status ${failed ? "error" : "ok"}`; $("run").disabled = false;
});
