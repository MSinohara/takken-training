import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings, trainingCheckinSummary } from "./generated.js?v=13";
import { firebaseConfig } from "./config.js?v=16";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char]));
}

function isCompanyUnit(training) {
  const unit = String(training?.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function card(label, value, view) {
  const href = view
    ? `live-checkin.html?event=${encodeURIComponent(new URLSearchParams(location.search).get("event") || "")}&return=detail&view=${view}`
    : "";
  return `<div class="stats-item${href ? " clickable" : ""}"${href ? ` onclick="location.href='${href}'"` : ""}>` +
    `<div class="stats-label">${esc(label)}</div><div class="stats-value">${esc(value)}</div>` +
    (href ? '<div class="stats-link">一覧を見る</div>' : "") + "</div>";
}

async function render(eventId, box) {
  try {
    const trainingsResponse = await listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" });
    const training = (trainingsResponse.data.trainings || []).find((row) => row.trainingId === eventId);
    if (!training) throw new Error("SQLに研修会が登録されていません。");
    const companyUnit = isCompanyUnit(training);
    const unit = companyUnit ? "COMPANY" : "PERSONAL";
    const response = await trainingCheckinSummary(dc, {
      trainingId: eventId,
      targetType: unit,
      attendanceUnit: unit,
    }, { fetchPolicy: "SERVER_ONLY" });
    const target = Number(response.data.targets?.[0]?._count || 0);
    const total = Number(response.data.received?.[0]?._count || 0);
    const targetReceived = Number((companyUnit
      ? response.data.companyTargetReceived
      : response.data.personalTargetReceived)?.[0]?._count || 0);
    const outside = Math.max(0, total - targetReceived);
    const absent = Math.max(0, target - targetReceived);
    const rate = target ? `${(targetReceived / target * 100).toFixed(1)}%` : "-";
    const suffix = companyUnit ? "件" : "名";
    box.innerHTML = '<h2>参加状況集計</h2><div class="stats-summary">' +
      card("対象人数", `${target}${suffix}`, "target") +
      card("対象内参加", `${targetReceived}${suffix}`, "checked") +
      card("対象外参加", `${outside}${suffix}`, "") +
      card("未参加人数", `${absent}${suffix}`, "unchecked") +
      card("参加率", rate, "") +
      '</div><div class="actions"><a class="btn" href="live-checkin.html?event=' +
      encodeURIComponent(eventId) + '&return=detail">受付モニター</a></div>';
  } catch (error) {
    box.innerHTML = '<h2>参加状況集計</h2><div class="ng">参加状況を取得できませんでした。' + esc(error.message || error) + '</div>';
  }
}

window.sqlDetailStats = { render };
window.dispatchEvent(new Event("sql-detail-stats-ready"));
