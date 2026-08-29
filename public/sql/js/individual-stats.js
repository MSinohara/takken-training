import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, annualTrainingData } from "./generated.js?v=30";
import { firebaseConfig } from "./config.js?v=17";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);

function companyUnit(training) {
  const unit = String(training.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function rate(value, total) {
  return total ? `${(value / total * 100).toFixed(1)}%` : "-";
}

function add(map, key, field) {
  const name = String(key || "未設定").trim() || "未設定";
  if (!map.has(name)) map.set(name, { name, targetCount: 0, attendedCount: 0, outsideAttendedCount: 0 });
  map.get(name)[field] += 1;
}

function finishGroups(map) {
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ja")).map((row) => ({
    ...row,
    totalAttendedCount: row.attendedCount + row.outsideAttendedCount,
    attendanceRate: rate(row.attendedCount, row.targetCount),
  }));
}

function methodCategory(method, guestCategory) {
  if (guestCategory) return guestCategory;
  const text = String(method || "");
  if (text.includes("STAFF") || text.includes("係員")) return "係員受付";
  if (text.includes("WEB") || text.includes("QR")) return "第十ブロック会員";
  return "その他";
}

async function loadTrainings() {
  const response = await listTrainings(dc, { limit: 1000 }, { fetchPolicy: "SERVER_ONLY" });
  return (response.data.trainings || []).filter((training) => training.active !== false).map((training) => ({
    ...training,
    eventId: training.trainingId,
  }));
}

async function loadStats(eventId, trainings) {
  const training = trainings.find((row) => row.eventId === eventId || row.trainingId === eventId);
  if (!training) throw new Error("SQLに研修会が登録されていません。");
  const unit = companyUnit(training) ? "COMPANY" : "PERSONAL";
  const response = await annualTrainingData(dc, {
    trainingId: eventId,
    targetType: unit,
  }, { fetchPolicy: "SERVER_ONLY" });
  const targets = response.data.targets || [];
  const checkins = response.data.checkins || [];
  const guests = response.data.guestCheckins || [];
  const targetIds = new Set(targets.map((row) => row.targetId));
  const branch = new Map();
  const district = new Map();
  const methods = new Map();
  const categories = new Map();

  targets.forEach((row) => {
    add(branch, row.company?.branch, "targetCount");
    add(district, row.company?.district, "targetCount");
  });
  checkins.forEach((row) => {
    const inside = targetIds.has(row.targetId);
    add(branch, row.company?.branch, inside ? "attendedCount" : "outsideAttendedCount");
    add(district, row.company?.district, inside ? "attendedCount" : "outsideAttendedCount");
    const method = row.checkinMethod || "未設定";
    methods.set(method, (methods.get(method) || 0) + 1);
    const category = methodCategory(method);
    categories.set(category, (categories.get(category) || 0) + 1);
  });
  guests.forEach((row) => {
    add(branch, row.branch || "一般参加", "outsideAttendedCount");
    add(district, "一般参加", "outsideAttendedCount");
    const method = row.checkinMethod || "未設定";
    methods.set(method, (methods.get(method) || 0) + 1);
    const category = methodCategory(method, row.receptionCategory);
    categories.set(category, (categories.get(category) || 0) + 1);
  });

  const attendedCount = checkins.filter((row) => targetIds.has(row.targetId)).length;
  const outsideAttendedCount = checkins.length - attendedCount + guests.length;
  const counts = (map) => [...map.entries()].map(([name, count]) => ({ name, count }));
  return {
    eventId,
    title: training.title || "研修会",
    targetCount: targets.length,
    sentCount: "-",
    attendedCount,
    outsideAttendedCount,
    absentCount: Math.max(0, targets.length - attendedCount),
    attendanceRate: rate(attendedCount, targets.length),
    branchStats: finishGroups(branch),
    districtStats: finishGroups(district),
    organizationStats: [],
    methodStats: counts(methods),
    receptionCategoryStats: counts(categories),
  };
}

window.sqlIndividualStats = { loadTrainings, loadStats };
window.dispatchEvent(new Event("sql-individual-stats-ready"));
