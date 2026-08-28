import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  getCheckin,
  getTrainingTargetForCheckin,
  listTrainings,
  registerCompanyCheckin,
  registerGuestCheckin,
  registerPersonalCheckin,
  restoreCheckin,
  searchMemberCompanies
} from "./generated.js?v=19";
import { firebaseConfig } from "./config.js?v=17";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);
const $ = (id) => document.getElementById(id);
let selectedCompany = null;
let trainings = [];
const requestedTrainingId = new URLSearchParams(location.search).get("event") || "";
const receiptStorageKey = requestedTrainingId ? `takken_sql_receipt:${requestedTrainingId}` : "";
const blockBranchMap = {
  "第一ブロック": ["千代田中央"],
  "第二ブロック": ["江東区", "江戸川区", "葛飾区"],
  "第三ブロック": ["台東区", "墨田区", "足立区"],
  "第四ブロック": ["文京区", "荒川区", "豊島区"],
  "第五ブロック": ["品川区", "大田区", "目黒区"],
  "第六ブロック": ["港区"],
  "第七ブロック": ["新宿区"],
  "第八ブロック": ["渋谷区"],
  "第九ブロック": ["北区", "板橋区", "練馬区"],
  "第十一ブロック": ["武蔵野中央", "北多摩", "国分寺国立", "調布狛江", "府中稲城"],
  "第十二ブロック": ["立川", "西多摩", "南多摩", "八王子", "町田"],
};

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
    const selected = selectedTraining();
    $("trainingName").textContent = selected
      ? `${selected.title} / 開催日：${selected.eventDate || "-"}`
      : "指定された研修会を確認できませんでした。";
    if (!requestedTrainingId || !selected) {
      setStatus("QRコードをもう一度読み取ってください。", "error");
      return false;
    }
    return true;
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

async function guestKey(values) {
  const source = [values.name, values.organization, values.email, values.phone]
    .map((value) => String(value || "").normalize("NFKC").replace(/\s+/g, "").toLowerCase())
    .join("|");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(bytes)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function checkinGuest() {
  const button = $("registerGuest");
  const otherBlock = $("guestPanel").dataset.mode === "otherBlock";
  const values = {
    name: $("guestName").value.trim(),
    organization: $("guestOrganization").value.trim(),
    email: $("guestEmail").value.trim(),
    phone: $("guestPhone").value.trim(),
    block: otherBlock ? $("guestBlock").value : "",
    branch: otherBlock ? $("guestBranch").value : "",
  };
  if (!values.name) {
    $("guestStatus").textContent = "参加者名を入力してください。";
    $("guestStatus").className = "status error";
    return;
  }
  if (otherBlock && (!values.block || !values.branch || !values.organization)) {
    $("guestStatus").textContent = "ブロック、支部、会社・団体名を入力してください。";
    $("guestStatus").className = "status error";
    return;
  }
  button.disabled = true;
  button.textContent = "受付中...";
  try {
    const key = await guestKey(values);
    await registerGuestCheckin(dc, {
      checkinId: `${$("training").value}:GUEST:${key}`,
      trainingId: $("training").value,
      guestKey: key,
      participantName: values.name,
      organizationName: values.organization || null,
      block: values.block || null,
      branch: values.branch || null,
      email: values.email || null,
      phone: values.phone || null,
      receptionCategory: otherBlock ? "他ブロック会員" : "一般参加",
      checkinMethod: "SQL_WEB",
    });
    showResult("受付完了", `${values.organization ? `${values.organization} ` : ""}${values.name} 様（${otherBlock ? "他ブロック会員" : "一般参加"}）`, true);
    $("guestStatus").textContent = "受付しました。";
    $("guestStatus").className = "status ok";
  } catch (error) {
    const duplicate = duplicateError(error);
    showResult(duplicate ? "既に受付済みです" : "受付できませんでした", duplicate ? `${values.name} 様` : String(error?.message || error));
  } finally {
    button.disabled = false;
    button.textContent = "この内容で受付する";
  }
}

async function restoreIfCancelled(checkinId) {
  try {
    const response = await getCheckin(dc, { checkinId }, { fetchPolicy: "SERVER_ONLY" });
    if (!response.data.checkin?.cancelled) return false;
    await restoreCheckin(dc, {
      checkinId,
      changedAt: new Date().toISOString(),
      operator: "係員受付",
      reason: "再受付",
    });
    return true;
  } catch (error) {
    console.error("取消済み受付の確認に失敗しました。", error);
    return false;
  }
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

function showResult(title, body, completed = false) {
  $("resultTitle").textContent = title;
  $("resultBody").textContent = body;
  if (completed) {
    if (receiptStorageKey) {
      try {
        localStorage.setItem(receiptStorageKey, JSON.stringify({ title, body }));
      } catch (error) {
        console.warn("受付完了情報を端末へ保存できませんでした。", error);
      }
    }
    ["receptionModePanel", "memberSearchPanel", "companiesPanel", "peoplePanel", "guestPanel"]
      .forEach((id) => $(id).hidden = true);
  }
  $("resultPanel").hidden = false;
  $("resultPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function restoreCompletedReceipt() {
  if (!receiptStorageKey) return false;
  try {
    const receipt = JSON.parse(localStorage.getItem(receiptStorageKey) || "null");
    if (!receipt?.title || !receipt?.body) return false;
    showResult(receipt.title, receipt.body, true);
    return true;
  } catch (error) {
    try {
      localStorage.removeItem(receiptStorageKey);
    } catch (storageError) {
      console.warn("端末の受付完了情報を消去できませんでした。", storageError);
    }
    return false;
  }
}

function renderPeople(company) {
  selectedCompany = company;
  $("checkinStatus").textContent = "";
  $("checkinStatus").className = "status";
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
    button.textContent = company.companyName;
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
  const branch = $("branch").value;
  const memberNo = $("memberNo").value.trim();
  const companyName = $("companyName").value.trim();
  if (!branch) {
    setStatus("先に支部を選択してください。", "error");
    $("branch").focus();
    return;
  }
  if (!memberNo && companyName.length < 2) {
    setStatus("会社名は2文字以上、または業者番号を入力してください。", "error");
    $("companyName").focus();
    return;
  }

  $("search").disabled = true;
  $("peoplePanel").hidden = true;
  setStatus("検索中...");
  try {
    const variables = { limit: 50, offset: 0 };
    const values = {
      memberNo,
      companyName,
      branch,
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
  $("checkinStatus").textContent = "受付処理中です。しばらくお待ちください。";
  $("checkinStatus").className = "status";
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
    showResult("受付完了", `${selectedCompany.companyName} ${person.name} 様${target ? "" : "（対象外参加）"}`, true);
  } catch (error) {
    if (duplicateError(error) && await restoreIfCancelled(`${trainingId}:PERSONAL:${person.personalId}`)) {
      showResult("受付完了", `${selectedCompany.companyName} ${person.name} 様`, true);
      return;
    }
    showResult(
      duplicateError(error) ? "既に受付済みです" : "受付できませんでした",
      duplicateError(error) ? `${selectedCompany.companyName} ${person.name} 様` : String(error?.message || error)
    );
  } finally {
    $("checkinStatus").textContent = "";
    button.disabled = false;
    button.textContent = "この人を受付";
  }
}

async function checkinCompany(button) {
  button.disabled = true;
  button.textContent = "受付中...";
  $("checkinStatus").textContent = "受付処理中です。しばらくお待ちください。";
  $("checkinStatus").className = "status";
  const trainingId = $("training").value;
  try {
    const target = await lookupTarget("COMPANY", selectedCompany.memberNo);
    await registerCompanyCheckin(dc, {
      checkinId: `${trainingId}:COMPANY:${selectedCompany.memberNo}`,
      trainingId,
      memberNo: selectedCompany.memberNo,
      checkinMethod: "SQL_WEB"
    });
    showResult("受付完了", `${selectedCompany.companyName}${target ? "" : "（対象外参加）"}`, true);
  } catch (error) {
    if (duplicateError(error) && await restoreIfCancelled(`${trainingId}:COMPANY:${selectedCompany.memberNo}`)) {
      showResult("受付完了", selectedCompany.companyName, true);
      return;
    }
    showResult(
      duplicateError(error) ? "既に受付済みです" : "受付できませんでした",
      duplicateError(error) ? selectedCompany.companyName : String(error?.message || error)
    );
  } finally {
    $("checkinStatus").textContent = "";
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
$("companyName").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
$("memberNo").addEventListener("keydown", (event) => { if (event.key === "Enter") search(); });
function renderGuestBranches() {
  const branches = blockBranchMap[$("guestBlock").value] || [];
  $("guestBranch").replaceChildren(...branches.map((branch) => new Option(branch, branch)));
}

function setReceptionMode(mode) {
  const guestMode = mode === "guest" || mode === "otherBlock";
  const otherBlock = mode === "otherBlock";
  $("memberSearchPanel").hidden = guestMode;
  $("companiesPanel").hidden = true;
  $("peoplePanel").hidden = true;
  $("guestPanel").hidden = !guestMode;
  $("showMemberMode").classList.toggle("active", !guestMode);
  $("showOtherBlockMode").classList.toggle("active", otherBlock);
  $("showGuestMode").classList.toggle("active", mode === "guest");
  $("showMemberMode").setAttribute("aria-pressed", String(!guestMode));
  $("showOtherBlockMode").setAttribute("aria-pressed", String(otherBlock));
  $("showGuestMode").setAttribute("aria-pressed", String(mode === "guest"));
  $("guestPanel").dataset.mode = otherBlock ? "otherBlock" : "guest";
  $("guestHeading").textContent = otherBlock ? "他ブロックの会員" : "一般参加者";
  $("guestGuidance").textContent = otherBlock
    ? "第十ブロック以外の宅建協会会員はこちらへ入力してください。"
    : "宅建協会の会員会社に所属していない方はこちらへ入力してください。";
  $("guestOrganizationLabel").textContent = otherBlock ? "会社・団体名" : "会社・団体名（任意）";
  $("otherBlockFields").hidden = !otherBlock;
  (guestMode ? $("guestName") : $("companyName")).focus();
}

$("showMemberMode").addEventListener("click", () => setReceptionMode("member"));
$("showOtherBlockMode").addEventListener("click", () => setReceptionMode("otherBlock"));
$("showGuestMode").addEventListener("click", () => setReceptionMode("guest"));
$("hideGuest").addEventListener("click", () => {
  setReceptionMode("member");
  $("receptionModePanel").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("guestBlock").addEventListener("change", renderGuestBranches);
$("registerGuest").addEventListener("click", checkinGuest);
async function initializePublicCheckin() {
  $("search").disabled = true;
  $("clear").disabled = true;
  try {
    const ready = await loadTrainings();
    if (ready && restoreCompletedReceipt()) return;
    $("search").disabled = !ready;
    $("clear").disabled = !ready;
  } catch (error) {
    console.error(error);
  }
}

initializePublicCheckin();
$("guestBlock").replaceChildren(...Object.keys(blockBranchMap).map((block) => new Option(block, block)));
renderGuestBranches();
