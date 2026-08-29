import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, annualTrainingData } from "./generated.js?v=29";
import { firebaseConfig } from "./config.js?v=17";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);

async function loadOptions() {
  const response = await listTrainings(
    dc,
    { limit: 1000 },
    { fetchPolicy: "SERVER_ONLY" },
  );
  const trainings = response.data.trainings || [];
  const eventTypes = [...new Set(
    trainings
      .map((training) => String(training.eventType || "研修会").trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, "ja"));

  return {
    trainings,
    eventTypes: eventTypes.length ? eventTypes : ["研修会"],
  };
}

function companyUnit(training) {
  const unit = String(training.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function percent(value, total) {
  return total ? `${(value / total * 100).toFixed(1)}%` : "-";
}

function addCount(map, name, count = 1) {
  const key = String(name || "未設定").trim() || "未設定";
  map.set(key, (map.get(key) || 0) + count);
}

function receptionCategory(method, guestCategory) {
  if (guestCategory) return guestCategory;
  const text = String(method || "");
  if (text.includes("STAFF") || text.includes("係員")) return "係員受付";
  if (text.includes("WEB") || text.includes("QR")) return "QR・WEB受付";
  return "その他受付";
}

async function inBatches(items, size, task) {
  const results = [];
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(task)));
  }
  return results;
}

async function loadStats(trainings, year, eventType) {
  const rows = await inBatches(trainings, 3, async (training) => {
    const unit = companyUnit(training) ? "COMPANY" : "PERSONAL";
    const response = await annualTrainingData(dc, {
      trainingId: training.trainingId,
      targetType: unit,
    }, { fetchPolicy: "SERVER_ONLY" });
    return { training, unit, data: response.data };
  });

  const branchTargets = new Map();
  const branchAttended = new Map();
  const districtTargets = new Map();
  const districtAttended = new Map();
  const methods = new Map();
  const categories = new Map();
  const uniqueTargets = new Set();
  const uniqueAttended = new Set();
  const trainingStats = [];
  let targetTotal = 0;
  let attendedTotal = 0;
  let outsideTotal = 0;

  rows.forEach(({ training, data }) => {
    const targets = data.targets || [];
    const checkins = data.checkins || [];
    const guests = data.guestCheckins || [];
    const targetIds = new Set(targets.map((row) => row.targetId));
    const inside = checkins.filter((row) => targetIds.has(row.targetId));
    const outside = checkins.length - inside.length + guests.length;

    targets.forEach((row) => {
      const company = row.company || {};
      uniqueTargets.add(company.memberNo || row.targetId);
      addCount(branchTargets, company.branch);
      addCount(districtTargets, company.district);
    });
    checkins.forEach((row) => {
      const company = row.company || {};
      uniqueAttended.add(company.memberNo || row.targetId);
      addCount(branchAttended, company.branch);
      addCount(districtAttended, company.district);
      addCount(methods, row.checkinMethod || "未設定");
      addCount(categories, receptionCategory(row.checkinMethod));
    });
    guests.forEach((row) => {
      addCount(branchAttended, row.branch || "一般参加");
      addCount(methods, row.checkinMethod || "未設定");
      addCount(categories, receptionCategory(row.checkinMethod, row.receptionCategory));
    });

    targetTotal += targets.length;
    attendedTotal += inside.length;
    outsideTotal += outside;
    trainingStats.push({
      eventDate: training.eventDate || "",
      eventId: training.trainingId,
      eventType: training.eventType || "研修会",
      title: training.title || "",
      hostType: training.hostType || "",
      targetBranch: training.targetBranch || "",
      targetOrgNames: training.targetOrgIdsNew || "",
      targetCount: targets.length,
      attendedCount: inside.length,
      outsideAttendedCount: outside,
      totalAttendedCount: checkins.length + guests.length,
      absentCount: Math.max(0, targets.length - inside.length),
      attendanceRate: percent(inside.length, targets.length),
    });
  });

  const groupStats = (targetMap, attendedMap) =>
    [...new Set([...targetMap.keys(), ...attendedMap.keys()])].sort((a, b) => a.localeCompare(b, "ja")).map((name) => {
      const targetCount = targetMap.get(name) || 0;
      const totalAttendedCount = attendedMap.get(name) || 0;
      return { name, targetCount, attendedCount: totalAttendedCount, outsideAttendedCount: 0,
        totalAttendedCount, attendanceRate: percent(totalAttendedCount, targetCount) };
    });
  const countStats = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return {
    year,
    eventType,
    trainingCount: rows.length,
    targetTotal,
    attendedTotal,
    outsideTotal,
    totalAttended: attendedTotal + outsideTotal,
    uniqueAttendedCount: uniqueAttended.size,
    uniqueTargetCount: uniqueTargets.size,
    attendanceRate: percent(attendedTotal, targetTotal),
    uniqueAttendanceRate: percent(uniqueAttended.size, uniqueTargets.size),
    branchStats: groupStats(branchTargets, branchAttended),
    districtStats: groupStats(districtTargets, districtAttended),
    receptionCategoryStats: countStats(categories),
    methodStats: countStats(methods),
    trainingStats,
  };
}

window.sqlAnnualStats = { loadOptions, loadStats };
window.dispatchEvent(new Event("sql-annual-stats-ready"));
