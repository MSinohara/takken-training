import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, recentCheckins } from "./generated.js?v=8";
import { firebaseConfig } from "./config.js?v=8";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
let timer = null;
const requestedTrainingId = new URLSearchParams(location.search).get("event") || "";

async function loadTrainings() {
  $("training").replaceChildren(new Option("研修会を読み込み中...", ""));
  $("training").disabled = true;
  try {
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.trainings || [];
    $("training").replaceChildren();
    rows.forEach((training) => {
      $("training").add(new Option(`${training.title} (${training.trainingId})`, training.trainingId));
    });
    if (requestedTrainingId && rows.some((row) => row.trainingId === requestedTrainingId)) {
      $("training").value = requestedTrainingId;
    }
    if (rows.length) await refresh();
    else $("status").textContent = "SQLに研修会が登録されていません。";
  } catch (error) {
    $("training").replaceChildren(new Option("研修会を取得できませんでした", ""));
    $("status").textContent = `研修会の取得に失敗しました: ${error.message || error}`;
    $("status").className = "status error";
  } finally {
    $("training").disabled = false;
  }
}

function formatTimestamp(value) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value.toDate?.() || new Date(value);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

async function refresh() {
  $("refresh").disabled = true;
  $("status").textContent = "更新中...";
  try {
    const response = await recentCheckins(dc, { trainingId: $("training").value, limit: 10 }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.checkins || [];
    if (!rows.length) {
      $("list").className = "empty";
      $("list").textContent = "受付履歴はまだありません。";
    } else {
      const table = document.createElement("table");
      table.innerHTML = "<thead><tr><th>受付日時</th><th>会社名</th><th>参加者</th><th>受付方法</th></tr></thead><tbody></tbody>";
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        [formatTimestamp(row.checkedInAt), row.company?.companyName || "-", row.person?.name || "会社受付", row.checkinMethod].forEach((value) => {
          const td = document.createElement("td"); td.textContent = value; tr.append(td);
        });
        table.tBodies[0].append(tr);
      });
      $("list").className = "";
      $("list").replaceChildren(table);
    }
    $("status").className = "status";
    $("status").textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")} / 直近${rows.length}件`;
  } catch (error) {
    $("status").textContent = `取得に失敗しました: ${error.message || error}`;
    $("status").className = "status error";
  } finally {
    $("refresh").disabled = false;
  }
}

$("refresh").addEventListener("click", refresh);
$("training").addEventListener("change", refresh);
$("auto").addEventListener("click", () => {
  if (timer) {
    clearInterval(timer); timer = null; $("auto").textContent = "自動更新開始";
  } else {
    timer = setInterval(refresh, 10000); $("auto").textContent = "自動更新停止"; refresh();
  }
});
loadTrainings();
