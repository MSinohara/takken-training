import { initializeApp, getApps } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { firebaseConfig } from "../sql/js/config.js?v=9";
import {
  connectorConfig,
  listTrainings
} from "../sql/js/generated.js?v=9";

const app = getApps()[0] || initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

function mapTraining(row) {
  if (!row) return null;
  return {
    eventId: row.trainingId || "",
    title: row.title || "",
    eventDate: row.eventDate || "",
    hostType: row.hostType || "",
    receptionType: row.receptionType || "",
    attendanceUnit: row.attendanceUnit || "会社",
    checkinTargetMode: row.checkinTargetMode || "対象設定",
    eventType: row.eventType || "研修会",
    venueId: row.venueId || "",
    targetBlock: row.targetBlock || "",
    targetBranch: row.targetBranch || "",
    targetDistrict: row.targetDistrict || "",
    targetOrgIdsNew: row.targetOrgIdsNew || "",
    senderOrganizationId: row.senderOrganizationId || "",
    certificateEnabled: row.certificateEnabled === true,
    active: row.active !== false,
    locationCheckEnabled: row.locationCheckEnabled === true,
    locationCheckinStart: row.locationCheckinStart || "",
    locationCheckinEnd: row.locationCheckinEnd || "",
    attendanceConfirmEnabled: row.attendanceConfirmEnabled === true,
    attendanceStatusPublic: row.attendanceStatusPublic === true,
    subject: row.subject || "",
    body: row.body || ""
  };
}

export const sqlTrainingData = {
  async listAll() {
    const response = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    return (response.data.trainings || []).map(mapTraining);
  },

  async list() {
    const rows = await this.listAll();
    return rows.filter((row) => row.active);
  },

  async get(trainingId) {
    const rows = await this.listAll();
    return rows.find((row) => row.eventId === trainingId) || null;
  },

  async nextId(now = new Date()) {
    const tokyoParts = new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
    }).formatToParts(now);
    const year = Number(tokyoParts.find((part) => part.type === "year")?.value || 0);
    const month = Number(tokyoParts.find((part) => part.type === "month")?.value || 0);
    const fiscalYear = month <= 3 ? year - 1 : year;
    const pattern = new RegExp(`^${fiscalYear}-(\\d+)$`);
    const rows = await this.listAll();
    const maxNo = rows.reduce((max, row) => {
      const match = String(row.eventId || "").match(pattern);
      return match ? Math.max(max, Number(match[1]) || 0) : max;
    }, 0);
    return `${fiscalYear}-${String(maxNo + 1).padStart(3, "0")}`;
  }
};
