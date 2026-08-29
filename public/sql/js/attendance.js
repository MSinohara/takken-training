import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  adminAttendanceConfig,
  replaceAttendanceItems,
  publicAttendanceAnswer,
  saveAttendanceResponse,
  adminAttendanceResponses,
} from "./generated.js?v=30";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

function item(row) {
  return {
    itemId: row.itemId || "",
    eventId: row.trainingId || "",
    itemName: row.itemName || "",
    answerType: row.answerType || "出欠",
    options: row.options || "",
    optionList: String(row.options || "").split(",").map((value) => value.trim()).filter(Boolean),
    targetScope: row.targetScope || "全員",
    targetKeys: row.targetKeys || "",
    active: row.active === false ? "FALSE" : "TRUE",
    displayOrder: Number(row.displayOrder || 0),
  };
}

function response(row) {
  let answers = {};
  try { answers = JSON.parse(row.answersJson || "{}"); } catch (_) {}
  return {
    respondentKey: row.respondentKey || "",
    memberNo: row.memberNo || "",
    personalId: row.personalId || "",
    companyName: row.companyName || "",
    participantName: row.participantName || "",
    mail: row.email || "",
    answers,
    note: row.note || "",
    answeredAt: row.answeredAt || "",
    updatedAt: row.updatedAt || "",
  };
}

async function adminReady(statusElement) {
  await requireSqlAdmin(app, statusElement || document.getElementById("status"));
}

async function loadAdminConfig(trainingId, statusElement) {
  await adminReady(statusElement);
  const result = await adminAttendanceConfig(dc, { trainingId }, { fetchPolicy: "SERVER_ONLY" });
  return {
    training: result.data.training || null,
    items: (result.data.items || []).map(item),
  };
}

async function saveAdminConfig(trainingId, items) {
  const data = items.map((row, index) => ({
    itemId: row.itemId || `${trainingId}-attendance-${crypto.randomUUID()}`,
    trainingId,
    itemName: String(row.itemName || "").trim(),
    answerType: row.answerType || "出欠",
    options: row.options || "",
    targetScope: row.targetScope || "全員",
    targetKeys: row.targetKeys || "",
    active: String(row.active || "TRUE").toUpperCase() !== "FALSE",
    displayOrder: index + 1,
  }));
  await replaceAttendanceItems(dc, { trainingId, data });
  return data.map(item);
}

async function loadPublicAnswer(trainingId, respondentKey) {
  const result = await publicAttendanceAnswer(dc, { trainingId, respondentKey }, { fetchPolicy: "SERVER_ONLY" });
  const data = result.data;
  return {
    training: data.training || null,
    items: (data.items || []).map(item),
    response: data.response ? response(data.response) : null,
    publicResponses: (data.publicResponses || []).map(response),
  };
}

async function savePublicAnswer(values) {
  await saveAttendanceResponse(dc, {
    trainingId: values.trainingId,
    respondentKey: values.respondentKey,
    memberNo: values.memberNo || null,
    personalId: values.personalId || null,
    companyName: values.companyName || null,
    participantName: values.participantName || null,
    email: values.email || null,
    answersJson: JSON.stringify(values.answers || {}),
    note: values.note || null,
  });
}

async function loadAdminResponses(trainingId, statusElement) {
  await adminReady(statusElement);
  const result = await adminAttendanceResponses(dc, { trainingId }, { fetchPolicy: "SERVER_ONLY" });
  return {
    training: result.data.training || null,
    items: (result.data.items || []).map(item),
    responses: (result.data.responses || []).map(response),
  };
}

export const sqlAttendance = {
  loadAdminConfig,
  saveAdminConfig,
  loadPublicAnswer,
  savePublicAnswer,
  loadAdminResponses,
};
