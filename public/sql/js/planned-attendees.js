import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDataConnect } from "firebase/data-connect";
import {
  addPlannedAttendee,
  connectorConfig,
  listPlannedAttendees,
  listTrainings,
  removePlannedAttendee,
  searchMemberCompanies,
} from "./generated.js?v=17";
import { firebaseConfig } from "./config.js?v=16";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);
const auth = getAuth(app);
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const eventId = params.get("event") || "";
const pageSize = 50;
let offset = 0;
let training = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

function companyUnit() {
  const value = String(training?.attendanceUnit || "").toUpperCase();
  return value === "COMPANY" || value.startsWith("会社");
}

function makePlannedId(type, targetId) {
  return `${eventId}:${type}:${targetId}`;
}

function setBusy(button, busy, busyText, normalText) {
  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

async function addPerson(company, person) {
  const type = companyUnit() ? "COMPANY" : "PERSONAL";
  const targetId = companyUnit() ? company.memberNo : person.personalId;
  const button = document.querySelector(`[data-add-id="${CSS.escape(targetId)}"]`);
  if (button) setBusy(button, true, "追加中...", "予定者へ追加");
  try {
    await addPlannedAttendee(dc, {
      plannedId: makePlannedId(type, targetId), trainingId: eventId, targetType: type, targetId,
      memberNo: company.memberNo, personalId: companyUnit() ? null : person.personalId,
      participantName: companyUnit() ? null : person.name,
      email: companyUnit() ? company.email : person.email,
      branch: company.branch, district: company.district, block: company.block, source: "MEMBER_MASTER",
    });
    $("searchStatus").innerHTML = `<span class="result-ok">${esc(company.companyName)} ${esc(companyUnit() ? "会社単位" : person.name)}を追加しました。</span>`;
    offset = 0;
    await loadPlanned();
  } catch (error) {
    $("searchStatus").innerHTML = `<span class="ng">追加できませんでした。${esc(error.message || error)}</span>`;
  } finally {
    if (button) setBusy(button, false, "追加中...", "予定者へ追加");
  }
}

function renderCompanies(rows) {
  if (!rows.length) {
    $("searchResults").innerHTML = '<p class="muted">該当する会員は見つかりませんでした。</p>';
    return;
  }
  $("searchResults").innerHTML = rows.map((company) => {
    const candidates = companyUnit()
      ? [{ personalId: company.memberNo, name: "会社単位", email: company.email }]
      : (company.people_on_company || []);
    return `<div class="result-card"><strong>${esc(company.companyName)}</strong><br><span class="muted">${esc(company.memberNo)} / ${esc([company.branch, company.district].filter(Boolean).join(" / "))}</span>` +
      (candidates.length ? candidates.map((person) =>
        `<div class="person-row"><span>${esc(person.name)}${person.email ? `<br><span class="muted">${esc(person.email)}</span>` : ""}</span>` +
        `<button data-add-id="${esc(companyUnit() ? company.memberNo : person.personalId)}">予定者へ追加</button></div>`
      ).join("") : '<p class="muted">登録されている個人がいません。</p>') + "</div>";
  }).join("");
  rows.forEach((company) => {
    const candidates = companyUnit()
      ? [{ personalId: company.memberNo, name: "会社単位", email: company.email }]
      : (company.people_on_company || []);
    candidates.forEach((person) => {
      const targetId = companyUnit() ? company.memberNo : person.personalId;
      document.querySelector(`[data-add-id="${CSS.escape(targetId)}"]`)?.addEventListener("click", () => addPerson(company, person));
    });
  });
}

async function search() {
  setBusy($("search"), true, "検索中...", "検索");
  $("searchStatus").textContent = "会員を検索中...";
  try {
    const variables = { limit: 50, offset: 0 };
    const values = {
      branch: $("branch").value, district: $("district").value.trim(),
      memberNo: $("memberNo").value.trim(), companyName: $("companyName").value.trim(),
    };
    Object.entries(values).forEach(([key, value]) => { if (value) variables[key] = value; });
    const response = await searchMemberCompanies(dc, variables, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.memberCompanies || [];
    $("searchStatus").textContent = `${rows.length}件表示しています。`;
    renderCompanies(rows);
  } catch (error) {
    $("searchStatus").innerHTML = `<span class="ng">検索できませんでした。${esc(error.message || error)}</span>`;
  } finally {
    setBusy($("search"), false, "検索中...", "検索");
  }
}

async function remove(row) {
  const name = row.person?.name || row.participantName || row.company?.companyName || "この予定者";
  if (!confirm(`${name}を予定者一覧から外しますか？`)) return;
  try {
    await removePlannedAttendee(dc, {
      plannedId: row.plannedId, changedAt: new Date().toISOString(), operator: auth.currentUser?.email || "",
    });
    await loadPlanned();
  } catch (error) {
    $("listStatus").innerHTML = `<span class="ng">削除できませんでした。${esc(error.message || error)}</span>`;
  }
}

function renderPlanned(rows) {
  if (!rows.length) {
    $("plannedList").innerHTML = '<p class="muted">この範囲に登録されている予定者はいません。</p>';
    return;
  }
  $("plannedList").innerHTML = '<table><thead><tr><th>業者番号</th><th>会社名</th><th>参加者</th><th>支部・地区</th><th>操作</th></tr></thead><tbody>' +
    rows.map((row, index) => `<tr><td>${esc(row.company?.memberNo || "-")}</td><td>${esc(row.company?.companyName || "-")}</td>` +
      `<td>${esc(row.person?.name || row.participantName || (row.targetType === "COMPANY" ? "会社単位" : "-"))}</td>` +
      `<td>${esc([row.branch, row.district].filter(Boolean).join(" / ") || "-")}</td>` +
      `<td><button class="secondary" data-remove-index="${index}">削除</button></td></tr>`).join("") + "</tbody></table>";
  rows.forEach((row, index) => {
    document.querySelector(`[data-remove-index="${index}"]`)?.addEventListener("click", () => remove(row));
  });
}

async function loadPlanned() {
  $("listStatus").textContent = "予定者一覧を読み込み中...";
  try {
    const response = await listPlannedAttendees(dc, { trainingId: eventId, limit: pageSize, offset }, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.plannedAttendees || [];
    renderPlanned(rows);
    $("listStatus").textContent = rows.length ? `${offset + 1}～${offset + rows.length}件を表示しています。` : "登録されている予定者はいません。";
    $("prev").disabled = offset === 0;
    $("next").disabled = rows.length < pageSize;
  } catch (error) {
    $("listStatus").innerHTML = `<span class="ng">予定者一覧を取得できませんでした。${esc(error.message || error)}</span>`;
  }
}

async function init() {
  $("detailLink").href = eventId ? `training-detail.html?event=${encodeURIComponent(eventId)}` : "training-list.html";
  if (!eventId) {
    $("trainingInfo").innerHTML = '<span class="ng">研修IDが指定されていません。</span>';
    return;
  }
  try {
    await requireSqlAdmin(app, $("trainingInfo"));
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    training = (response.data.trainings || []).find((row) => row.trainingId === eventId);
    if (!training) throw new Error("SQLにイベントが登録されていません。");
    $("trainingInfo").innerHTML = `<strong>${esc(training.title)}</strong><br>${esc(training.trainingId)} / 開催日：${esc(training.eventDate || "")} / 受付単位：${esc(training.attendanceUnit || "-")}`;
    ["search", "clear", "reload"].forEach((id) => $(id).disabled = false);
    await loadPlanned();
  } catch (error) {
    console.error(error);
  }
}

$("search").addEventListener("click", search);
$("reload").addEventListener("click", loadPlanned);
$("clear").addEventListener("click", () => {
  ["district", "memberNo", "companyName"].forEach((id) => $(id).value = "");
  $("branch").value = "";
  $("searchResults").innerHTML = "";
  $("searchStatus").textContent = "条件を入力して検索してください。";
});
$("prev").addEventListener("click", () => { offset = Math.max(0, offset - pageSize); loadPlanned(); });
$("next").addEventListener("click", () => { offset += pageSize; loadPlanned(); });
$("companyName").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
$("memberNo").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
init();
