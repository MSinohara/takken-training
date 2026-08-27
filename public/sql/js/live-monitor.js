import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  listTrainings,
  recentCheckins,
  trainingCheckinSummary,
  trainingCheckinsByBranchDistrict,
  searchTrainingTargets,
  searchCheckedTargets,
  searchCheckedCompanyTargets,
  searchUncheckedTargets,
  searchUncheckedCompanyTargets,
} from "./generated.js?v=13";
import { firebaseConfig } from "./config.js?v=13";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const params = new URLSearchParams(location.search);
const eventId = params.get("event") || "";
const returnTo = params.get("return") || "";
const initialView = params.get("view") || "";
const $ = (id) => document.getElementById(id);
let training = null;
let autoRefresh = false;
let timerId = null;
let listState = { type: "", offset: 0, branch: "", district: "" };
const pageSize = 50;

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

function companyUnit() {
  const unit = String(training?.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function sqlUnit() { return companyUnit() ? "COMPANY" : "PERSONAL"; }

function formatDate(value) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value.toDate?.() || new Date(value);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

function setupLinks() {
  $("detailLink").href = returnTo === "detail" && eventId
    ? `training-detail.html?event=${encodeURIComponent(eventId)}` : "checkin-select.html";
  $("detailLink").textContent = returnTo === "detail" ? "研修会詳細へ戻る" : "受付メニューへ戻る";
  $("manageLink").style.display = "none";
}

function renderRecent(rows) {
  if (!rows.length) {
    $("liveList").textContent = "受付履歴はまだありません。";
    return;
  }
  $("liveList").innerHTML = rows.map((row) => {
    const company = row.company?.companyName || "-";
    const person = row.person?.name || "会社受付";
    return `<div class="live-item"><div class="live-time">${esc(formatDate(row.checkedInAt))}<br><span class="result-ok">受付完了</span></div>` +
      `<div><div class="company">${esc(company)}</div><div>${esc(person)} 様</div></div>` +
      `<div class="live-meta">${esc(row.company?.memberNo || "")}<br>${esc(row.checkinMethod || "")}</div></div>`;
  }).join("");
}

async function loadAll() {
  if (!training) return;
  const unit = sqlUnit();
  try {
    const [recentResponse, summaryResponse] = await Promise.all([
      recentCheckins(dc, { trainingId: eventId, limit: 10 }, { fetchPolicy: "SERVER_ONLY" }),
      trainingCheckinSummary(dc, { trainingId: eventId, targetType: unit, attendanceUnit: unit }, { fetchPolicy: "SERVER_ONLY" }),
    ]);
    const target = Number(summaryResponse.data.targets?.[0]?._count || 0);
    const total = Number(summaryResponse.data.received?.[0]?._count || 0);
    const targetReceived = Number((companyUnit()
      ? summaryResponse.data.companyTargetReceived
      : summaryResponse.data.personalTargetReceived)?.[0]?._count || 0);
    $("targetCount").textContent = target;
    $("checkedCount").textContent = `${targetReceived} / ${target}`;
    $("totalCheckedCount").textContent = total;
    $("plannedCount").textContent = "-";
    $("plannedCheckedCount").textContent = "-";
    $("absentCount").textContent = Math.max(0, target - targetReceived);
    $("notFoundCount").textContent = Math.max(0, total - targetReceived);
    renderRecent(recentResponse.data.checkins || []);
    $("lastUpdated").textContent = new Date().toLocaleTimeString("ja-JP");
  } catch (error) {
    $("liveList").innerHTML = `<div class="ng">受付状況を取得できませんでした。${esc(error.message || error)}</div>`;
  }
}

function listTitle(type) {
  return type === "target" ? "参加対象" : type === "checked" ? "対象者受付" : "未受付";
}

function listQuery(type) {
  if (type === "target") return searchTrainingTargets;
  if (type === "checked") return companyUnit() ? searchCheckedCompanyTargets : searchCheckedTargets;
  return companyUnit() ? searchUncheckedCompanyTargets : searchUncheckedTargets;
}

function listVariables() {
  const variables = { trainingId: eventId, limit: pageSize, offset: listState.offset };
  if (listState.type !== "unchecked") variables.targetType = sqlUnit();
  if (listState.branch) variables.branch = listState.branch;
  if (listState.district) variables.district = listState.district;
  return variables;
}

function modalShell() {
  return `<div class="member-list-tools"><input id="sqlListBranch" placeholder="支部（指定なし）" value="${esc(listState.branch)}">` +
    `<input id="sqlListDistrict" placeholder="地区（指定なし）" value="${esc(listState.district)}">` +
    '<button class="btn" onclick="sqlMonitorSearchList()">検索</button></div>' +
    '<div id="sqlMemberList" class="status">一覧を読み込み中...</div>' +
    '<div class="member-list-pager"><button class="btn sub" id="sqlPrev" onclick="sqlMonitorPrevList()">前の50件</button>' +
    '<span class="muted" id="sqlPageInfo"></span><button class="btn sub" id="sqlNext" onclick="sqlMonitorNextList()">次の50件</button></div>';
}

async function loadMemberList() {
  const area = $("sqlMemberList");
  if (!area) return;
  area.textContent = "一覧を読み込み中...";
  try {
    const response = await listQuery(listState.type)(dc, listVariables(), { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.trainingTargets || [];
    if (!rows.length) {
      area.textContent = "該当する方はいません。";
    } else {
      area.innerHTML = '<table><thead><tr><th>業者番号</th><th>会社名</th><th>参加者</th><th>支部・地区</th></tr></thead><tbody>' +
        rows.map((row) => `<tr><td>${esc(row.company?.memberNo || row.targetId || "-")}</td><td>${esc(row.company?.companyName || "-")}</td>` +
          `<td>${esc(companyUnit() ? "会社単位" : row.person?.name || "-")}</td><td>${esc([row.branch, row.district].filter(Boolean).join(" / ") || "-")}</td></tr>`).join("") +
        "</tbody></table>";
    }
    $("sqlPageInfo").textContent = rows.length ? `${listState.offset + 1}～${listState.offset + rows.length}件` : "0件";
    $("sqlPrev").disabled = listState.offset === 0;
    $("sqlNext").disabled = rows.length < pageSize;
  } catch (error) {
    area.innerHTML = `<div class="ng">一覧を取得できませんでした。${esc(error.message || error)}</div>`;
  }
}

function openList(type) {
  listState = { type, offset: 0, branch: "", district: "" };
  openAppModal(listTitle(type), modalShell(), { wide: true });
  loadMemberList();
}

async function toggleFilterPanel() {
  const panel = $("filterPanel");
  const opening = panel.classList.contains("collapsed");
  panel.classList.toggle("collapsed");
  $("filterToggleButton").textContent = opening ? "閉じる" : "開く";
  if (!opening) return;
  $("branchFilters").innerHTML = '<span class="muted">支部・地区別を集計中...</span>';
  try {
    const response = await trainingCheckinsByBranchDistrict(dc, { trainingId: eventId, attendanceUnit: sqlUnit() }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.checkins || [];
    $("branchFilters").innerHTML = rows.length ? rows.map((row) =>
      `<span class="filter-button">${esc(row.company?.branch || "未設定")} / ${esc(row.company?.district || "未設定")}：${esc(row._count || 0)}件</span>`
    ).join("") : '<span class="muted">受付済みの参加者はまだいません。</span>';
    $("districtFilters").innerHTML = "";
  } catch (error) {
    $("branchFilters").innerHTML = `<span class="ng">集計を取得できませんでした。${esc(error.message || error)}</span>`;
  }
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh;
  $("autoButton").textContent = autoRefresh ? "自動更新停止" : "自動更新開始";
  $("refreshNote").firstChild.textContent = autoRefresh ? "10秒ごとに自動更新します。最終更新：" : "自動更新は停止中です。最終更新：";
}

async function init() {
  setupLinks();
  if (!eventId) {
    $("trainingInfo").innerHTML = '<span class="ng">研修IDが指定されていません。</span>';
    return;
  }
  try {
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    training = (response.data.trainings || []).find((row) => row.trainingId === eventId);
    if (!training) throw new Error("SQLに研修会が登録されていません。");
    $("trainingInfo").innerHTML = `<strong>研修会</strong><br>${esc(training.title)}<br>開催日：${esc(training.eventDate || "")}`;
    await loadAll();
    if (["target", "checked", "unchecked"].includes(initialView)) openList(initialView);
  } catch (error) {
    $("trainingInfo").innerHTML = `<span class="ng">研修会情報を取得できませんでした。${esc(error.message || error)}</span>`;
  }
  timerId = setInterval(() => { if (autoRefresh) loadAll(); }, 10000);
}

window.loadAll = loadAll;
window.toggleAutoRefresh = toggleAutoRefresh;
window.toggleFilterPanel = toggleFilterPanel;
window.openTargetMembersModal = () => openList("target");
window.openCheckedMembersModal = () => openList("checked");
window.openAbsentMembersModal = () => openList("unchecked");
window.openPlannedMembersModal = () => alert("当日参加予定者はSQL移行中です。");
window.openPlannedCheckedMembersModal = () => alert("当日参加予定者はSQL移行中です。");
window.sqlMonitorSearchList = () => {
  listState.branch = $("sqlListBranch").value.trim();
  listState.district = $("sqlListDistrict").value.trim();
  listState.offset = 0;
  loadMemberList();
};
window.sqlMonitorPrevList = () => { listState.offset = Math.max(0, listState.offset - pageSize); loadMemberList(); };
window.sqlMonitorNextList = () => { listState.offset += pageSize; loadMemberList(); };

window.addEventListener("beforeunload", () => { if (timerId) clearInterval(timerId); });
init();
