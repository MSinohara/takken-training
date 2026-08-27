import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, listCheckinHistory, cancelCheckin, restoreCheckin } from "./generated.js?v=14";
import { firebaseConfig } from "./config.js?v=16";
import { requireSqlAdmin } from "./admin-auth.js?v=14";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);
const params = new URLSearchParams(location.search);
const eventId = params.get("event") || "";
const returnTo = params.get("return") || "";
const pageSize = 20;
let histories = [];
let currentPage = 1;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value)) : "";
}

function setupLinks() {
  $("monitorLink").href = `live-checkin.html?event=${encodeURIComponent(eventId)}&return=detail`;
  $("detailLink").href = returnTo === "monitor"
    ? `live-checkin.html?event=${encodeURIComponent(eventId)}&return=detail`
    : `training-detail.html?event=${encodeURIComponent(eventId)}`;
  $("detailLink").textContent = returnTo === "monitor" ? "受付モニターへ戻る" : "研修会詳細へ戻る";
}

async function loadTraining() {
  if (!eventId) {
    $("trainingInfo").innerHTML = '<span class="ng">研修IDが指定されていません。</span>';
    return;
  }
  try {
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    const row = (response.data.trainings || []).find((item) => item.trainingId === eventId);
    if (!row) throw new Error("SQLに研修会が登録されていません。");
    $("trainingInfo").innerHTML = `<strong>${esc(row.title)}</strong><br>${esc(row.trainingId)} / ${esc(row.hostType || "")} / ${esc(row.eventDate || "")}`;
  } catch (error) {
    $("trainingInfo").innerHTML = `<span class="ng">研修会情報を取得できませんでした。${esc(error.message || error)}</span>`;
  }
}

function filteredRows() {
  const keyword = $("keyword").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  return histories.filter((row) => {
    if (status === "active" && row.cancelled) return false;
    if (status === "canceled" && !row.cancelled) return false;
    if (!keyword) return true;
    return [row.company?.companyName, row.company?.memberNo, row.person?.name, row.checkinMethod]
      .join(" ").toLowerCase().includes(keyword);
  });
}

function actionCell(row) {
  if (!row.cancelled) {
    return `<select class="reason-select" id="cancelReason-${esc(row.checkinId)}"><option>会社選択間違い</option>` +
      '<option>二重受付</option><option>本人申出</option><option>テスト受付</option><option>その他</option></select> ' +
      `<button class="btn danger" onclick="sqlCancelCheckin('${esc(row.checkinId)}')">受付取消</button>`;
  }
  return `<select class="reason-select" id="restoreReason-${esc(row.checkinId)}"><option>取消操作間違い</option>` +
    '<option>再確認済み</option><option>その他</option></select> ' +
    `<button class="btn" onclick="sqlRestoreCheckin('${esc(row.checkinId)}')">受付復活</button>`;
}

function render() {
  const rows = filteredRows();
  const active = histories.filter((row) => !row.cancelled).length;
  const canceled = histories.length - active;
  $("summary").innerHTML = `<div class="summary-chip">受付済み ${active}件</div><div class="summary-chip">取消済み ${canceled}件</div>`;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  if (!pageRows.length) {
    $("status").textContent = "該当する受付履歴はありません。";
    $("historyTable").style.display = "none";
    $("pager").style.display = "none";
    return;
  }
  $("historyBody").innerHTML = pageRows.map((row) => `<tr><td>${esc(formatDate(row.checkedInAt))}</td>` +
    `<td>${esc(row.company?.companyName || "")}${row.person?.name ? `<div class="muted">${esc(row.person.name)}</div>` : ""}</td>` +
    `<td>${esc(row.company?.memberNo || "")}</td><td>${esc(row.checkinMethod || "")}</td>` +
    `<td>${row.cancelled ? "受付取消" : "受付完了"}</td><td>${actionCell(row)}</td></tr>`).join("");
  $("status").textContent = `${rows.length}件中 ${start + 1}〜${start + pageRows.length}件を表示中`;
  $("pageInfo").textContent = `${currentPage} / ${totalPages}ページ`;
  $("historyTable").style.display = "table";
  $("pager").style.display = totalPages > 1 ? "flex" : "none";
}

async function loadHistory() {
  $("status").textContent = "読み込み中...";
  try {
    await requireSqlAdmin(app, $("status"));
    const response = await listCheckinHistory(dc, { trainingId: eventId, limit: 500, offset: 0 }, { fetchPolicy: "SERVER_ONLY" });
    histories = response.data.checkins || [];
    currentPage = 1;
    render();
  } catch (error) {
    $("status").innerHTML = `<span class="ng">受付履歴を取得できませんでした。${esc(error.message || error)}</span>`;
  }
}

function operatorName() {
  const user = window.getCurrentAuthUser?.() || {};
  return user.loginId || user.name || user.userId || "";
}

async function changeStatus(checkinId, mode) {
  const selectId = `${mode === "cancel" ? "cancelReason" : "restoreReason"}-${checkinId}`;
  const reason = $(selectId)?.value || "";
  const label = mode === "cancel" ? "取り消し" : "復活";
  if (!confirm(`この受付を${label}します。\n理由：${reason}\n\nよろしいですか？`)) return;
  $("status").textContent = `受付を${label}中...`;
  try {
    const variables = { checkinId, changedAt: new Date().toISOString(), operator: operatorName(), reason };
    if (mode === "cancel") await cancelCheckin(dc, variables);
    else await restoreCheckin(dc, variables);
    await loadHistory();
  } catch (error) {
    alert(`受付状態を更新できませんでした。${error.message || error}`);
    render();
  }
}

window.loadHistory = loadHistory;
window.onSearchChanged = () => { currentPage = 1; render(); };
window.prevPage = () => { if (currentPage > 1) { currentPage--; render(); } };
window.nextPage = () => { if (currentPage < Math.ceil(filteredRows().length / pageSize)) { currentPage++; render(); } };
window.sqlCancelCheckin = (id) => changeStatus(id, "cancel");
window.sqlRestoreCheckin = (id) => changeStatus(id, "restore");

setupLinks();
loadTraining();
loadHistory();
