import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, annualTrainingData } from "./generated.js?v=30";
import { firebaseConfig } from "./config.js?v=17";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);

function fiscalYear(training) {
  const idMatch = String(training.trainingId || "").match(/^(\d{4})-/);
  if (idMatch) return idMatch[1];
  const date = String(training.eventDate || "");
  const [year, month] = date.split("-").map(Number);
  return year ? String(month <= 3 ? year - 1 : year) : "";
}

function companyUnit(training) {
  const unit = String(training.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

async function inBatches(items, size, task) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(...await Promise.all(items.slice(index, index + size).map(task)));
  }
  return result;
}

function memberStatus(events, attendedCount) {
  if (!attendedCount) return { status: "未参加", statusRank: 1 };
  const rate = attendedCount / events.length;
  if (events.length >= 3 && rate < 0.3) return { status: "低参加", statusRank: 2 };
  const recent = events.slice().sort((a, b) => String(b.eventDate).localeCompare(String(a.eventDate))).slice(0, 3);
  if (recent.length >= 3 && recent.every((event) => !event.attended)) {
    return { status: "最近未参加", statusRank: 3 };
  }
  if (rate >= 0.8) return { status: "継続参加", statusRank: 5 };
  return { status: "参加中", statusRank: 4 };
}

async function load(year, eventType) {
  const trainingResponse = await listTrainings(dc, { limit: 1000 }, { fetchPolicy: "SERVER_ONLY" });
  const allTrainings = (trainingResponse.data.trainings || []).filter((training) => training.active !== false);
  const years = [...new Set(allTrainings.map(fiscalYear).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const eventTypes = [...new Set(allTrainings.map((training) => training.eventType || "研修会"))]
    .sort((a, b) => String(a).localeCompare(String(b), "ja"));
  const selectedYear = year && year !== "読み込み中" ? year : years[0] || "";
  const selectedType = eventType && eventType !== "読み込み中..." ? eventType : "研修会";
  const trainings = allTrainings.filter((training) =>
    fiscalYear(training) === selectedYear &&
    (selectedType === "all" || String(training.eventType || "研修会") === selectedType));

  const sources = await inBatches(trainings, 3, async (training) => {
    const targetType = companyUnit(training) ? "COMPANY" : "PERSONAL";
    const response = await annualTrainingData(dc, {
      trainingId: training.trainingId,
      targetType,
    }, { fetchPolicy: "SERVER_ONLY" });
    return { training, data: response.data };
  });

  const members = new Map();
  sources.forEach(({ training, data }) => {
    const attendedCompanies = new Set((data.checkins || []).map((row) => row.company?.memberNo).filter(Boolean));
    const eventCompanies = new Set();
    (data.targets || []).forEach((target) => {
      const company = target.company || {};
      const memberNo = company.memberNo || "";
      if (!memberNo || eventCompanies.has(memberNo)) return;
      eventCompanies.add(memberNo);
      if (!members.has(memberNo)) {
        members.set(memberNo, {
          memberNo,
          companyName: company.companyName || "",
          block: company.block || "",
          branch: company.branch || "",
          district: company.district || "",
          events: [],
        });
      }
      members.get(memberNo).events.push({
        eventId: training.trainingId,
        eventDate: training.eventDate || "",
        title: training.title || "",
        attended: attendedCompanies.has(memberNo),
      });
    });
  });

  const memberRows = [...members.values()].map((member) => {
    const attendedEvents = member.events.filter((event) => event.attended);
    const attendedCount = attendedEvents.length;
    const state = memberStatus(member.events, attendedCount);
    const last = attendedEvents.slice().sort((a, b) => String(b.eventDate).localeCompare(String(a.eventDate)))[0];
    return {
      ...member,
      targetCount: member.events.length,
      attendedCount,
      attendanceRate: `${(attendedCount / member.events.length * 100).toFixed(1)}%`,
      rateNumber: attendedCount / member.events.length,
      lastAttendedAtText: last?.eventDate || "",
      ...state,
    };
  });
  const countStatus = (status) => memberRows.filter((member) => member.status === status).length;
  const participated = memberRows.filter((member) => member.attendedCount > 0).length;

  return {
    ok: true,
    year: selectedYear,
    eventType: selectedType,
    years,
    eventTypes: eventTypes.length ? eventTypes : ["研修会"],
    trainingCount: trainings.length,
    members: memberRows,
    summary: {
      targetMembers: memberRows.length,
      participatedMembers: participated,
      neverAttended: countStatus("未参加"),
      lowParticipation: countStatus("低参加"),
      recentAbsent: countStatus("最近未参加"),
      participationRate: memberRows.length ? `${(participated / memberRows.length * 100).toFixed(1)}%` : "0.0%",
    },
  };
}

window.sqlFollowAnalysis = { load };
window.dispatchEvent(new Event("sql-follow-analysis-ready"));
