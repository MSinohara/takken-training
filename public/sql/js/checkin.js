import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, searchMemberCompanies, registerPersonalCheckin } from "./generated.js?v=8";
import { firebaseConfig } from "./config.js?v=8";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
const $ = (id) => document.getElementById(id);
let selectedCompany = null;
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
    if (!rows.length) setStatus("SQLに研修会が登録されていません。", "error");
  } catch (error) {
    $("training").replaceChildren(new Option("研修会を取得できませんでした", ""));
    setStatus(`研修会の取得に失敗しました: ${error.message || error}`, "error");
  } finally {
    $("training").disabled = false;
  }
}

function setStatus(message, type = "") {
  $("searchStatus").textContent = message;
  $("searchStatus").className = `status ${type}`;
}

function duplicateError(error) {
  return /unique|duplicate|already exists|ALREADY_EXISTS/i.test(String(error?.message || error));
}

function renderPeople(company) {
  selectedCompany = company;
  $("selectedCompany").textContent = `${company.companyName} / 業者番号 ${company.memberNo}`;
  $("people").replaceChildren();
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
    await registerPersonalCheckin(dc, {
      checkinId: `${trainingId}:PERSONAL:${person.personalId}`,
      trainingId,
      memberNo: selectedCompany.memberNo,
      personalId: person.personalId,
      checkinMethod: "SQL_WEB"
    });
    $("resultTitle").textContent = "受付完了";
    $("resultBody").textContent = `${selectedCompany.companyName} ${person.name} 様`;
  } catch (error) {
    $("resultTitle").textContent = duplicateError(error) ? "既に受付済みです" : "受付できませんでした";
    $("resultBody").textContent = duplicateError(error) ? `${selectedCompany.companyName} ${person.name} 様` : String(error?.message || error);
  } finally {
    $("resultPanel").hidden = false;
    $("resultPanel").scrollIntoView({ behavior: "smooth", block: "center" });
    button.disabled = false;
    button.textContent = "この人を受付";
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
loadTrainings();
