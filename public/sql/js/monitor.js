import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  listTrainings,
  recentCheckins,
  trainingCheckinSummary,
  trainingCheckinsByBranchDistrict,
  searchUncheckedTargets,
  searchUncheckedCompanyTargets,
} from "./generated.js?v=11";
import { firebaseConfig } from "./config.js?v=17";
import { checkinMethodLabel } from "./checkin-methods.js?v=1";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
let trainings = [];
let uncheckedOffset = 0;
let uncheckedRows = [];
const pageSize = 50;
const requestedTrainingId = new URLSearchParams(location.search).get("event") || "";

async function loadTrainings() {
  $("training").replaceChildren(new Option("研修会を読み込み中...", ""));
  $("training").disabled = true;
  try {
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.trainings || [];
    trainings = rows;
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

function selectedTraining() {
  return trainings.find((row) => row.trainingId === $("training").value) || null;
}

function isCompanyUnit() {
  const unit = String(selectedTraining()?.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function sqlUnit() {
  return isCompanyUnit() ? "COMPANY" : "PERSONAL";
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
    const variables = {
      trainingId: $("training").value,
      targetType: sqlUnit(),
      attendanceUnit: sqlUnit(),
    };
    const [response, summaryResponse] = await Promise.all([
      recentCheckins(dc, { trainingId: variables.trainingId, limit: 10 }, { fetchPolicy: "SERVER_ONLY" }),
      trainingCheckinSummary(dc, variables, { fetchPolicy: "SERVER_ONLY" }),
    ]);
    const rows = response.data.checkins || [];
    const targetCount = Number(summaryResponse.data.targets?.[0]?._count || 0);
    const receivedCount = Number(summaryResponse.data.received?.[0]?._count || 0);
    const uncheckedCount = Math.max(0, targetCount - receivedCount);
    $("target-count").textContent = `${targetCount}件`;
    $("received-count").textContent = `${receivedCount}件`;
    $("unchecked-count").textContent = `${uncheckedCount}件`;
    $("attendance-rate").textContent = targetCount ? `${(receivedCount / targetCount * 100).toFixed(1)}%` : "-";
    if (!rows.length) {
      $("list").className = "empty";
      $("list").textContent = "受付履歴はまだありません。";
    } else {
      const table = document.createElement("table");
      table.innerHTML = "<thead><tr><th>受付日時</th><th>会社名</th><th>参加者</th><th>受付方法</th></tr></thead><tbody></tbody>";
      rows.forEach((row) => {
        const tr = document.createElement("tr");
        [formatTimestamp(row.checkedInAt), row.company?.companyName || "-", row.person?.name || "会社受付", checkinMethodLabel(row.checkinMethod)].forEach((value) => {
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

async function loadBreakdown() {
  $("breakdown").disabled = true;
  $("breakdown-list").hidden = false;
  $("breakdown-list").className = "empty";
  $("breakdown-list").textContent = "支部・地区別を集計中...";
  try {
    const response = await trainingCheckinsByBranchDistrict(dc, {
      trainingId: $("training").value,
      attendanceUnit: sqlUnit(),
    }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.checkins || [];
    if (!rows.length) {
      $("breakdown-list").textContent = "受付済みの参加者はまだいません。";
      return;
    }
    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>支部</th><th>地区</th><th>受付人数</th></tr></thead><tbody></tbody>";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      [row.company?.branch || "未設定", row.company?.district || "未設定", `${row._count || 0}件`].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      table.tBodies[0].append(tr);
    });
    $("breakdown-list").className = "";
    $("breakdown-list").replaceChildren(table);
  } catch (error) {
    $("breakdown-list").textContent = `支部・地区別集計の取得に失敗しました: ${error.message || error}`;
    $("breakdown-list").className = "status error";
  } finally {
    $("breakdown").disabled = false;
  }
}

function renderUnchecked(rows) {
  if (!rows.length) {
    $("unchecked-list").className = "empty";
    $("unchecked-list").textContent = "この条件に該当する未受付者はいません。";
    return;
  }

  const table = document.createElement("table");
  const participantLabel = isCompanyUnit() ? "受付対象" : "参加者";
  table.innerHTML = `<thead><tr><th>業者番号</th><th>会社名</th><th>${participantLabel}</th><th>支部・地区</th></tr></thead><tbody></tbody>`;
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const values = [
      row.company?.memberNo || row.targetId || "-",
      row.company?.companyName || "-",
      isCompanyUnit() ? "会社単位" : row.person?.name || "-",
      [row.branch, row.district].filter(Boolean).join(" / ") || "-",
    ];
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.append(td);
    });
    table.tBodies[0].append(tr);
  });
  $("unchecked-list").className = "";
  $("unchecked-list").replaceChildren(table);
}

async function searchUnchecked(resetPage = true) {
  if (resetPage) uncheckedOffset = 0;
  $("search-unchecked").disabled = true;
  $("previous").disabled = true;
  $("next").disabled = true;
  $("unchecked-status").className = "status";
  $("unchecked-status").textContent = "未受付者を検索中...";

  const vars = {
    trainingId: $("training").value,
    limit: pageSize,
    offset: uncheckedOffset,
  };
  const branch = $("branch").value.trim();
  const district = $("district").value.trim();
  if (branch) vars.branch = branch;
  if (district) vars.district = district;

  try {
    const query = isCompanyUnit() ? searchUncheckedCompanyTargets : searchUncheckedTargets;
    const response = await query(dc, vars, { fetchPolicy: "SERVER_ONLY" });
    uncheckedRows = response.data.trainingTargets || [];
    renderUnchecked(uncheckedRows);
    const start = uncheckedRows.length ? uncheckedOffset + 1 : 0;
    const end = uncheckedOffset + uncheckedRows.length;
    $("unchecked-status").textContent = `${isCompanyUnit() ? "会社" : "個人"}単位 / ${start}～${end}件を表示`;
    $("previous").disabled = uncheckedOffset === 0;
    $("next").disabled = uncheckedRows.length < pageSize;
  } catch (error) {
    $("unchecked-status").textContent = `未受付者の取得に失敗しました: ${error.message || error}`;
    $("unchecked-status").className = "status error";
    $("unchecked-list").className = "empty";
    $("unchecked-list").textContent = "取得できませんでした。条件を確認して再度お試しください。";
    $("previous").disabled = uncheckedOffset === 0;
  } finally {
    $("search-unchecked").disabled = false;
  }
}

function resetUnchecked() {
  uncheckedOffset = 0;
  uncheckedRows = [];
  $("previous").disabled = true;
  $("next").disabled = true;
  $("unchecked-status").textContent = "";
  $("unchecked-list").className = "empty";
  $("unchecked-list").textContent = "支部・地区を必要に応じて指定し、「未受付者を検索」を押してください。";
}

$("refresh").addEventListener("click", refresh);
$("breakdown").addEventListener("click", loadBreakdown);
$("training").addEventListener("change", () => {
  resetUnchecked();
  $("breakdown-list").hidden = true;
  refresh();
});
$("search-unchecked").addEventListener("click", () => searchUnchecked(true));
$("previous").addEventListener("click", () => {
  uncheckedOffset = Math.max(0, uncheckedOffset - pageSize);
  searchUnchecked(false);
});
$("next").addEventListener("click", () => {
  uncheckedOffset += pageSize;
  searchUnchecked(false);
});
loadTrainings();
