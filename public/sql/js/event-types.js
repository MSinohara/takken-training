import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { adminListEventTypes, adminSaveEventType, connectorConfig } from "./generated.js?v=35";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

function optional(value) {
  const text = String(value == null ? "" : value).trim();
  return text || null;
}

function mapRow(row) {
  return {
    eventTypeId: row.eventTypeId || "",
    eventTypeName: row.eventTypeName || "",
    attendanceConfirmDefault: row.attendanceConfirmDefault ? "TRUE" : "FALSE",
    active: row.active ? "TRUE" : "FALSE",
    sortOrder: String(row.sortOrder == null ? "" : row.sortOrder),
    note: row.note || "",
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleString("ja-JP") : "",
  };
}

async function list() {
  await requireSqlAdmin(app, document.getElementById("message") || document.getElementById("result") || document.body);
  let response = await adminListEventTypes(dc, {});
  if (!(response.data.eventTypes || []).length) {
    const now = new Date().toISOString();
    await adminSaveEventType(dc, {
      eventTypeId: "ET-001", eventTypeName: "研修会",
      attendanceConfirmDefault: false, active: true, sortOrder: 10,
      note: null, updatedAt: now,
    });
    response = await adminListEventTypes(dc, {});
  }
  return (response.data.eventTypes || []).map(mapRow);
}

async function save(data) {
  await requireSqlAdmin(app, document.getElementById("message") || document.getElementById("result") || document.body);
  const name = String(data.eventTypeName || "").trim();
  if (!name) throw new Error("イベント種別名を入力してください。");
  if (name === "研修会" && data.active === "FALSE") {
    throw new Error("基本種別の「研修会」は無効化できません。");
  }
  let eventTypeId = String(data.eventTypeId || "").trim();
  if (!eventTypeId) {
    const rows = await list();
    const maxNo = rows.reduce((max, row) => {
      const match = String(row.eventTypeId).match(/^ET-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    eventTypeId = `ET-${String(maxNo + 1).padStart(3, "0")}`;
  }
  const sortOrder = Number(data.sortOrder);
  await adminSaveEventType(dc, {
    eventTypeId,
    eventTypeName: name,
    attendanceConfirmDefault: data.attendanceConfirmDefault === "TRUE",
    active: data.active !== "FALSE",
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 9999,
    note: optional(data.note),
    updatedAt: new Date().toISOString(),
  });
  return { ok: true, eventTypeId, message: "イベント種別を保存しました。" };
}

window.sqlEventTypes = { list, save };
