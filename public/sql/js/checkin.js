import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  getTrainingTargetForCheckin,
  listTrainings,
  registerCompanyCheckin,
  registerPersonalCheckin,
  searchMemberCompanies
} from "./generated.js?v=9";
import { firebaseConfig } from "./config.js?v=9";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
let selectedCompany = null;
let trainings = [];
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
    updateMonitorLink();
    if (!rows.length) setStatus("SQLに研修会が登録されていません。", "error");
  } catch (error) {
    $("training").replaceChildren(new Option("研修会を取得できませんでした", ""));
    setStatus(`研修会の取得に失敗しました: ${error.message || error}`, "error");
  } finally {
    $("training").disabled = false;
  }
}

function updateMonitorLink() {
  const trainingId = $("training").value;
  $("monitor-link").href = trainingId
    ? `monitor.html?event=${encodeURIComponent(trainingId)}`
    : "monitor.html";
}

function setStatus(message, type = "") {
  $("searchStatus").textContent = message;
  $("searchStatus").className = `status ${type}`;
}

function duplicateError(error) {
  return /unique|duplicate|already exists|ALREADY_EXISTS/i.test(String(error?.message || error));
}

function selectedTraining() {
  return trainings.find((training) => training.trainingId === $("training").value) || null;
}

function isCompanyUnit() {
  const unit = String(selectedTraining()?.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

async function lookupTarget(targetType, targetId) {
  const response = await getTrainingTargetForCheckin(dc, {
    trainingId: $("training").value,
    targetType,
    targetId
  }, { fetchPolicy: "SERVER_ONLY" });
  return response.data.trainingTarget || null;
}

function showResult(title, body) {
  $("resultTitle").textContent = title;
  $("resultBody").textContent = body;
  $("resultPanel").hidden = false;
  $("resultPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderPeople(company) {
  selectedCompany = company;
  $("selectedCompany").textContent = `${company.companyName} / 業者番号 ${company.memberNo}`;
  $("people").replaceChildren();
  if (isCompanyUnit()) {
    $("peopleHeading").textContent = "会社を受付";
    const button = document.createElement("button");
    button.textContent = "この会社を受付";
    button.addEventListener("click", () => checkinCompany(button));
    $("people").append(button);
    $("peoplePanel").hidden = false;
    $("peoplePanel").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  $("peopleHeading").textContent = "参加者を選択";
  (company.people_on_company || []).forEach((person) => {
    const row = document.createElement("div");
    row.className = "person";
    const text = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = person.name;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `個人ID: ${person.personalId}`;
    text.append(name, meta);
    const button = document.createElement("button");
    button.textContent = "この人を受付";
    button.addEventListener("click", () => checkin(person, button));
    row.append(text, button);
    $("people").append(row);
  });
  if (!company.people_on_company?.length) $("people").textContent = "登録されている個人がいません。";
  $("peoplePanel").hidden = false;
  $("peoplePanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCompanies(rows) {
  $("companies").replaceChildren();
  rows.forEach((company) => {
    const button = document.createElement("button");
    button.className = "company";
    button.innerHTML = `<strong></strong><br><span class="muted"></span>`;
    button.querySelector("strong").textContent = company.companyName;
    button.querySelector("span").textContent = `業者番号 ${company.memberNo} / ${company.branch}${company.district ? ` / ${company.district}` : ""}`;
    button.addEventListener("click", () => {
      document.querySelectorAll(".company").forEach((node) => node.classList.remove("selected"));
      button.classList.add("selected");
      renderPeople(company);
    });
    $("companies").append(button);
  });
  $("companiesPanel").hidden = false;
}

async function search() {
  $("search").disabled = true;
  $("peoplePanel").hidden = true;
  setStatus("検索中...");
  try {
    const variables = { limit: 50, offset: 0 };
    const values = {
      memberNo: $("memberNo").value.trim(),
      companyName: $("companyName").value.trim(),
      branch: $("branch").value,
      district: $("district").value.trim()
    };
    Object.entries(values).forEach(([key, value]) => { if (value) variables[key] = value; });
    const response = await searchMemberCompanies(dc, variables, { fetchPolicy: "SERVER_ONLY" });
    const rows = response.data.memberCompanies || [];
    renderCompanies(rows);
    setStatus(rows.length ? `${rows.length}社見つかりました。` : "該当する会社はありません。", rows.length ? "ok" : "");
  } catch (error) {
    setStatus(`検索に失敗しました: ${error.message || error}`, "error");
  } finally {
    $("search").disabled = false;
  }
}

async function checkin(person, button) {
  button.disabled = true;
  button.textContent = "受付中...";
  const trainingId = $("training").value;
  try {
    const target = await lookupTarget("PERSONAL", person.personalId);
    await registerPersonalCheckin(dc, {
      checkinId: `${trainingId}:PERSONAL:${person.personalId}`,
      trainingId,
      memberNo: selectedCompany.memberNo,
      personalId: person.personalId,
      checkinMethod: "SQL_WEB"
    });
    showResult("受付完了", `${selectedCompany.companyName} ${person.name} 様${target ? "" : "（対象外参加）"}`);
  } catch (error) {
    showResult(
      duplicateError(error) ? "既に受付済みです" : "受付できませんでした",
      duplicateError(error) ? `${selectedCompany.companyName} ${person.name} 様` : String(error?.message || error)
    );
  } finally {
    button.disabled = false;
    button.textContent = "この人を受付";
  }
}

async function checkinCompany(button) {
  button.disabled = true;
  button.textContent = "受付中...";
  const trainingId = $("training").value;
  try {
    const target = await lookupTarget("COMPANY", selectedCompany.memberNo);
    await registerCompanyCheckin(dc, {
      checkinId: `${trainingId}:COMPANY:${selectedCompany.memberNo}`,
      trainingId,
      memberNo: selectedCompany.memberNo,
      checkinMethod: "SQL_WEB"
    });
    showResult("受付完了", `${selectedCompany.companyName}${target ? "" : "（対象外参加）"}`);
  } catch (error) {
    showResult(
      duplicateError(error) ? "既に受付済みです" : "受付できませんでした",
      duplicateError(error) ? selectedCompany.companyName : String(error?.message || error)
    );
  } finally {
    button.disabled = false;
    button.textContent = "この会社を受付";
  }
}

$("search").addEventListener("click", search);
$("clear").addEventListener("click", () => {
  ["memberNo", "companyName", "district"].forEach((id) => $(id).value = "");
  $("branch").value = "";
  $("companiesPanel").hidden = true;
  $("peoplePanel").hidden = true;
  setStatus("条件を入力して検索してください。");
});
$("next").addEventListener("click", () => {
  $("resultPanel").hidden = true;
  $("peoplePanel").hidden = true;
  $("companyName").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("companyName").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
$("memberNo").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
$("training").addEventListener("change", () => {
  updateMonitorLink();
  $("companiesPanel").hidden = true;
  $("peoplePanel").hidden = true;
  $("resultPanel").hidden = true;
  setStatus("会社を検索してください。");
});
loadTrainings();
