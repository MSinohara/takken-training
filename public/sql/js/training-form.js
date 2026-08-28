import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, saveTraining } from "./generated.js?v=25";
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

window.sqlTrainingForm = { save };
