import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { adminListVenues, adminSaveVenue, connectorConfig } from "./generated.js?v=37";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

function optional(value) {
  const text = String(value == null ? "" : value).trim();
  return text || null;
}

function numberOrNull(value) {
  const text = String(value == null ? "" : value).trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function mapRow(row) {
  return {
    ...row,
    venueCapacity: row.venueCapacity == null ? "" : String(row.venueCapacity),
    latitude: row.latitude == null ? "" : String(row.latitude),
    longitude: row.longitude == null ? "" : String(row.longitude),
    geoRadius: String(row.geoRadius == null ? 200 : row.geoRadius),
    geoCheckedAt: row.geoCheckedAt ? new Date(row.geoCheckedAt).toLocaleString("ja-JP") : "",
    active: row.active ? "TRUE" : "FALSE",
  };
}

async function list() {
  await requireSqlAdmin(app, document.getElementById("status") || document.body);
  const response = await adminListVenues(dc, {});
  return (response.data.venues || []).map(mapRow);
}

async function save(data) {
  await requireSqlAdmin(app, document.getElementById("modalGeoStatus") || document.body);
  const name = String(data.venueName || "").trim();
  if (!name) throw new Error("会場名を入力してください。");
  let venueId = String(data.venueId || "").trim();
  if (!venueId) {
    const rows = await list();
    const maxNo = rows.reduce((max, row) => {
      const match = String(row.venueId || "").match(/^V-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    venueId = `V-${String(maxNo + 1).padStart(3, "0")}`;
  }
  const now = new Date().toISOString();
  const checkedAt = data.updateGeoCheckedAt === "TRUE" && data.latitude && data.longitude
    ? now
    : null;
  await adminSaveVenue(dc, {
    venueId,
    venueName: name,
    venueAddress: optional(data.venueAddress),
    venueContactName: optional(data.venueContactName),
    venueContactPhone: optional(data.venueContactPhone),
    venueContactMail: optional(data.venueContactMail),
    venueUrl: optional(data.venueUrl),
    venueApplicationUrl: optional(data.venueApplicationUrl),
    venueCapacity: numberOrNull(data.venueCapacity),
    latitude: numberOrNull(data.latitude),
    longitude: numberOrNull(data.longitude),
    geoRadius: numberOrNull(data.geoRadius) || 200,
    geoCheckedAt: checkedAt,
    geoMemo: optional(data.geoMemo),
    active: data.active !== "FALSE",
    updatedAt: now,
  });
  return { ok: true, venueId, message: "会場マスタを保存しました。" };
}

window.sqlVenues = { list, save };
