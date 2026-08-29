import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { adminTrainingTargetSource, connectorConfig, replaceTrainingTargets, saveTraining } from "./generated.js?v=28";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

function flag(value) {
  return String(value || "").toUpperCase() === "TRUE" || String(value) === "1";
}

function optional(value) {
  const text = String(value || "").trim();
  return text || null;
}

async function save(data) {
  await requireSqlAdmin(app, document.getElementById("result"));
  await saveTraining(dc, {
    trainingId: data.eventId,
    title: data.title,
    eventDate: data.eventDate,
    hostType: optional(data.hostType),
    receptionType: optional(data.receptionType),
    attendanceUnit: optional(data.attendanceUnit),
    checkinTargetMode: optional(data.checkinTargetMode),
    eventType: optional(data.eventType),
    venueId: optional(data.venueId),
    targetBlock: optional(data.targetBlock),
    targetBranch: optional(data.targetBranch),
    targetDistrict: optional(data.targetDistrict),
    targetOrgIdsNew: optional(data.targetOrgIdsNew),
    senderOrganizationId: optional(data.senderOrgId),
    certificateEnabled: flag(data.certificateEnabled),
    active: data.active !== "FALSE",
    locationCheckEnabled: flag(data.locationCheckEnabled),
    locationCheckinStart: optional(data.locationCheckinStart),
    locationCheckinEnd: optional(data.locationCheckinEnd),
    attendanceConfirmEnabled: flag(data.attendanceConfirmEnabled),
    attendanceStatusPublic: flag(data.attendanceStatusPublic),
    subject: optional(data.subject),
    body: data.body || "",
  });
  return { ok: true };
}

function normalizeBlock(value) {
  const text = String(value || "").replace(/\s/g, "").replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  return ["第十ブロック", "第十", "第10ブロック", "10ブロック", "十ブロック", "10"].includes(text)
    ? "第十ブロック"
    : text;
}

function normalizeBranch(value) {
  return String(value || "").replace(/\s/g, "")
    .replace("杉並区支部", "杉並支部")
    .replace("中野区支部", "中野支部")
    .replace("世田谷区支部", "世田谷支部");
}

function normalizeDistrict(value) {
  return String(value || "").replace(/\s/g, "").replace(/地区$/, "");
}

function matchesCondition(company, data) {
  return (!data.targetBlock || normalizeBlock(company.block) === normalizeBlock(data.targetBlock)) &&
    (!data.targetBranch || normalizeBranch(company.branch) === normalizeBranch(data.targetBranch)) &&
    (!data.targetDistrict || normalizeDistrict(company.district) === normalizeDistrict(data.targetDistrict));
}

function organizationSet(rows, idName, targetOrgIds) {
  const selected = new Set(targetOrgIds);
  const result = new Set();
  (rows || []).forEach((row) => {
    if (selected.has(String(row.orgId || ""))) result.add(String(row[idName] || ""));
  });
  return result;
}

function normalizeTargetRows(data, source) {
  const personalUnit =
    String(data.attendanceUnit || "").toUpperCase() === "PERSONAL" ||
    String(data.attendanceUnit || "").startsWith("個人");
  const rows = [];
  const seen = new Set();
  const targetOrgIds = String(data.targetOrgIdsNew || "").split(",").map((id) => id.trim()).filter(Boolean);
  const companyOrg = organizationSet(source.memberOrganizations, "memberNo", targetOrgIds);
  const personOrg = organizationSet(source.personOrganizations, "personalId", targetOrgIds);
  const companies = new Map((source.companies || []).map((company) => [String(company.memberNo || ""), company]));

  function add(memberNo, personalId, targetType, company) {
    const targetId = targetType === "PERSONAL" ? personalId : memberNo;
    if (!memberNo || !targetId || !company) return;

    const key = `${targetType}:${targetId}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      trainingId: data.eventId,
      targetType,
      targetId,
      memberNo,
      personalId: targetType === "PERSONAL" ? personalId : null,
      branch: String(company.branch || "").trim(),
      district: optional(company.district),
      block: String(company.block || "").trim(),
    });
  }

  const plannedOnly = ["事前申込者のみ", "事前申込", "事前申込者", "事前受付", "planned", "plannedOnly"]
    .includes(String(data.checkinTargetMode || "").trim());

  if (!plannedOnly) {
    if (personalUnit) {
      (source.persons || []).forEach((person) => {
        const memberNo = String(person.memberNo || "").trim();
        const personalId = String(person.personalId || "").trim();
        const company = companies.get(memberNo);
        if (!company || !matchesCondition(company, data)) return;
        if (targetOrgIds.length && !companyOrg.has(memberNo) && !personOrg.has(personalId)) return;
        add(memberNo, personalId, "PERSONAL", company);
      });
    } else {
      (source.companies || []).forEach((company) => {
        const memberNo = String(company.memberNo || "").trim();
        if (!matchesCondition(company, data)) return;
        if (targetOrgIds.length && !companyOrg.has(memberNo)) return;
        add(memberNo, "", "COMPANY", company);
      });
    }
  }

  (source.plannedAttendees || []).forEach((planned) => {
    const memberNo = String(planned.memberNo || "").trim();
    const personalId = String(planned.personalId || "").trim();
    const type = String(planned.targetType || "").toUpperCase();
    if (!memberNo || (type !== "PERSONAL" && type !== "COMPANY")) return;
    add(memberNo, personalId, type, companies.get(memberNo));
  });

  return rows;
}

async function resolveTargetRows(data) {
  await requireSqlAdmin(app, document.getElementById("result"));
  const response = await adminTrainingTargetSource(dc, { trainingId: data.eventId }, { fetchPolicy: "SERVER_ONLY" });
  return normalizeTargetRows(data, response.data || {});
}

async function replaceTargets(data) {
  const rows = await resolveTargetRows(data);
  await replaceTrainingTargets(dc, {
    trainingId: data.eventId,
    data: rows,
  });
  return { ok: true, targetCount: rows.length };
}

async function previewTargets(data) {
  const rows = await resolveTargetRows(data);
  return { targetCount: rows.length };
}

window.sqlTrainingForm = { previewTargets, replaceTargets, save };
