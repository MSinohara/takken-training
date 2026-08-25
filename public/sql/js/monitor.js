import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, recentCheckins } from "./generated.js?v=6";
import { firebaseConfig, trainings } from "./config.js?v=6";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
let timer = null;
trainings.forEach(({ id, label }) => $("training").add(new Option(`${label} (${id})`, id)));

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
refresh();
