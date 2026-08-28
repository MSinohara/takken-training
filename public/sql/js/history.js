import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listCheckinHistory } from "./generated.js?v=14";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";
import { checkinMethodLabel } from "./checkin-methods.js?v=1";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);
const params = new URLSearchParams(location.search);
const eventId = params.get("event") || "";
const returnTo = params.get("return") || "";
const pageSize = 10;
let histories = [];
let currentPage = 1;
let selectedBranch = "";
let selectedDistrict = "";

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function fiscalYear(row) {
  const date = new Date(row.rawDate || row.checkedInAt);
  return String(date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear());
}

function mapRow(row) {
  return {
    checkinId: row.checkinId,
    checkedInAt: row.checkedInAt,
    rawDate: row.training?.eventDate,
    date: formatDate(row.checkedInAt),
    eventId: row.trainingId,
    trainingTitle: row.training?.title || "",
    method: checkinMethodLabel(row.checkinMethod),
    attendanceUnit: row.attendanceUnit || "",
    memberNo: row.company?.memberNo || "",
    companyName: row.company?.companyName || "",
    participantName: row.person?.name || "",
    personalId: row.person?.personalId || "",
    block: row.company?.block || "",
    branch: row.company?.branch || "",
    district: row.company?.district || "",
    mail: row.person?.email || row.company?.email || "",
    result: row.cancelled ? "受付取消" : "受付完了",
    note: row.cancelled ? (row.cancelReason || "") : "",
    canceledAt: formatDate(row.canceledAt),
    canceledBy: row.canceledBy || "",
    cancelReason: row.cancelReason || "",
    restoredAt: formatDate(row.restoredAt),
    restoredBy: row.restoredBy || "",
    restoreReason: row.restoreReason || "",
  };
}

function setupBackLink() {
  const link = $("detailLink");
  if (eventId && returnTo === "checkin") {
    link.href = "checkin-select.html";
    link.textContent = "受付メニューへ戻る";
  } else if (eventId) {
    link.href = `training-detail.html?event=${encodeURIComponent(eventId)}&return=history`;
    link.textContent = "研修会詳細へ戻る";
  } else {
    link.href = "training-list.html";
    link.textContent = "研修会一覧へ戻る";
  }
  if (eventId) {
    $("yearFilter").style.display = "none";
    document.querySelector(".search").style.gridTemplateColumns = "1fr 160px";
  }
}

function filteredRows() {
  const keyword = $("keyword").value.trim().toLowerCase();
  const year = $("yearFilter").value;
  return histories.filter((row) => {
    if (selectedBranch && row.branch !== selectedBranch) return false;
    if (selectedDistrict && row.district !== selectedDistrict) return false;
    if (!eventId && year && year !== "all" && fiscalYear(row) !== year) return false;
    if (!keyword) return true;
    return [row.trainingTitle, row.eventId, row.companyName, row.participantName, row.personalId,
      row.memberNo, row.method, row.result].join(" ").toLowerCase().includes(keyword);
  });
}

function buildFilters() {
  const years = [...new Set(histories.map(fiscalYear))].sort().reverse();
  $("yearFilter").innerHTML = '<option value="all">すべての年度</option>' +
    years.map((year) => `<option value="${esc(year)}">${esc(year)}年度</option>`).join("");
  const branches = [...new Set(histories.map((row) => row.branch).filter(Boolean))].sort();
  const districts = [...new Set(histories.filter((row) => !selectedBranch || row.branch === selectedBranch)
    .map((row) => row.district).filter(Boolean))].sort();
  $("branchFilters").innerHTML = filterButtons("branch", branches, selectedBranch);
  $("districtFilters").innerHTML = filterButtons("district", districts, selectedDistrict);
  $("areaFilterSummary").textContent = [selectedBranch, selectedDistrict].filter(Boolean).join(" / ") || "全体";
}

function filterButtons(type, values, selected) {
  return `<button type="button" class="filter-button${selected ? "" : " active"}" onclick="sqlHistoryFilter('${type}','')">すべて</button>` +
    values.map((value) => `<button type="button" class="filter-button${selected === value ? " active" : ""}" ` +
      `onclick="sqlHistoryFilter('${type}','${encodeURIComponent(value)}')">${esc(value)}</button>`).join("");
}

function render() {
  const rows = filteredRows();
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  if (!pageRows.length) {
    $("status").textContent = "条件に一致する参加履歴はありません。";
    $("historyTable").style.display = "none";
    $("pager").style.display = "none";
    return;
  }
  $("historyBody").innerHTML = pageRows.map((row) => {
    const index = histories.indexOf(row);
    return `<tr><td>${esc(row.date)}</td><td>${esc(row.trainingTitle)}<div class="muted">${esc(row.eventId)}</div></td>` +
      `<td>${esc(row.method)}</td><td>${esc(row.memberNo)}</td><td>${esc(row.companyName)}` +
      `${row.participantName ? `<div class="muted">${esc(row.participantName)}</div>` : ""}` +
      `${row.personalId ? `<div class="muted">個人ID：${esc(row.personalId)}</div>` : ""}</td>` +
      `<td>${esc(row.result)}</td><td>${esc(row.note)}</td>` +
      `<td><button type="button" class="btn sub" onclick="sqlHistoryDetail(${index})">詳細</button></td></tr>`;
  }).join("");
  $("status").textContent = `${rows.length}件中 ${start + 1}〜${start + pageRows.length}件を表示中`;
  $("pagerInfo").textContent = `${currentPage} / ${totalPages}ページ`;
  $("historyTable").style.display = "table";
  $("pager").style.display = totalPages > 1 ? "flex" : "none";
}

async function loadHistory() {
  $("status").textContent = "読み込み中...";
  $("historyTable").style.display = "none";
  try {
    await requireSqlAdmin(app, $("status"));
    const variables = { limit: eventId ? 500 : 300, offset: 0 };
    if (eventId) variables.trainingId = eventId;
    const response = await listCheckinHistory(dc, variables, { fetchPolicy: "SERVER_ONLY" });
    histories = (response.data.checkins || []).map(mapRow);
    currentPage = 1;
    buildFilters();
    render();
  } catch (error) {
    $("status").innerHTML = `<span class="ng">参加履歴を取得できませんでした。${esc(error.message || error)}</span>`;
  }
}

function detail(index) {
  const row = histories[index];
  if (!row) return;
  const fields = [
    ["受付日時", row.date], ["研修会", `${row.trainingTitle} / ${row.eventId}`], ["受付単位", row.attendanceUnit],
    ["会社名", row.companyName], ["参加者名", row.participantName], ["個人ID", row.personalId],
    ["業者番号", row.memberNo], ["受付方法", row.method], ["結果", row.result],
    ["所属", [row.block, row.branch, row.district].filter(Boolean).join(" / ")], ["メール", row.mail],
    ["取消日時", row.canceledAt], ["取消者", row.canceledBy], ["取消理由", row.cancelReason],
    ["復活日時", row.restoredAt], ["復活者", row.restoredBy], ["復活理由", row.restoreReason],
  ];
  openAppModal("参加履歴詳細", `<table><tbody>${fields.map(([label, value]) =>
    `<tr><th>${esc(label)}</th><td>${esc(value || "-")}</td></tr>`).join("")}</tbody></table>`, { wide: true });
}

window.loadHistory = loadHistory;
window.onSearchChanged = () => { currentPage = 1; render(); };
window.prevPage = () => { if (currentPage > 1) { currentPage--; render(); } };
window.nextPage = () => { if (currentPage < Math.ceil(filteredRows().length / pageSize)) { currentPage++; render(); } };
window.sqlHistoryDetail = detail;
window.sqlHistoryFilter = (type, encoded) => {
  const value = decodeURIComponent(encoded);
  if (type === "branch") { selectedBranch = value; selectedDistrict = ""; } else selectedDistrict = value;
  currentPage = 1;
  buildFilters();
  render();
};
window.toggleAreaFilterPanel = () => {
  const panel = $("areaFilterPanel");
  const opening = panel.classList.contains("collapsed");
  panel.classList.toggle("collapsed");
  $("areaFilterToggleButton").textContent = opening ? "閉じる" : "開く";
};

setupBackLink();
loadHistory();
