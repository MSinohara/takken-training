import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import {
  connectorConfig,
  getCheckin,
  getPersonForCheckin,
  getTrainingTargetForCheckin,
  listTrainings,
  registerCompanyCheckin,
  registerPersonalCheckin,
  restoreCancelledCheckinPublic,
  searchMemberCompanies,
} from "./generated.js?v=20";
import { firebaseConfig } from "./config.js?v=17";
import { CHECKIN_METHODS } from "./checkin-methods.js?v=1";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);
let trainingsPromise = null;

function loadTrainings() {
  if (!trainingsPromise) {
    trainingsPromise = listTrainings(dc, { limit: 200 }, { fetchPolicy: "SERVER_ONLY" })
      .then((response) => response.data.trainings || []);
  }
  return trainingsPromise;
}

function isCompanyUnit(training) {
  const unit = String(training?.attendanceUnit || "").toUpperCase();
  return unit === "COMPANY" || unit.startsWith("会社");
}

function duplicateError(error) {
  return /unique|duplicate|already exists|ALREADY_EXISTS/i.test(String(error?.message || error));
}

async function isCancelled(checkinId) {
  const response = await getCheckin(dc, { checkinId }, { fetchPolicy: "SERVER_ONLY" });
  return Boolean(response.data.checkin?.cancelled);
}

async function restoreCancelled(checkinId) {
  if (!(await isCancelled(checkinId))) return false;
  await restoreCancelledCheckinPublic(dc, {
    checkinId,
    changedAt: new Date().toISOString(),
  });
  return true;
}

async function findTraining(trainingId) {
  const rows = await loadTrainings();
  const training = rows.find((row) => row.trainingId === trainingId);
  if (!training) throw new Error("SQLに研修会が登録されていません。");
  return training;
}

async function findCompany(memberNo) {
  const response = await searchMemberCompanies(dc, { memberNo, limit: 5, offset: 0 }, { fetchPolicy: "SERVER_ONLY" });
  const rows = response.data.memberCompanies || [];
  const company = rows.find((row) => row.memberNo === memberNo);
  if (!company) throw new Error("業者番号に該当する会社がありません。");
  return company;
}

async function registerCompany(trainingId, memberNo, method) {
  const company = await findCompany(memberNo);
  const targetResponse = await getTrainingTargetForCheckin(dc, {
    trainingId,
    targetType: "COMPANY",
    targetId: memberNo,
  }, { fetchPolicy: "SERVER_ONLY" });
  try {
    const checkinId = `${trainingId}:COMPANY:${memberNo}`;
    await registerCompanyCheckin(dc, {
      checkinId,
      trainingId,
      memberNo,
      checkinMethod: method,
    });
    return { ok: true, message: "受付完了", companyName: company.companyName, memberNo, checkedAt: new Date().toLocaleString("ja-JP"), outside: !targetResponse.data.trainingTarget };
  } catch (error) {
    if (!duplicateError(error)) throw error;
    if (await restoreCancelled(`${trainingId}:COMPANY:${memberNo}`)) {
      return { ok: true, message: "受付完了", companyName: company.companyName, memberNo, checkedAt: new Date().toLocaleString("ja-JP"), restored: true };
    }
    return { ok: true, duplicate: true, message: "既に受付済みです", companyName: company.companyName, memberNo };
  }
}

async function registerPerson(trainingId, personalId, method) {
  const response = await getPersonForCheckin(dc, { personalId }, { fetchPolicy: "SERVER_ONLY" });
  const person = response.data.person;
  if (!person) throw new Error("個人IDに該当する参加者がありません。");
  const company = person.company;
  const targetResponse = await getTrainingTargetForCheckin(dc, {
    trainingId,
    targetType: "PERSONAL",
    targetId: personalId,
  }, { fetchPolicy: "SERVER_ONLY" });
  try {
    await registerPersonalCheckin(dc, {
      checkinId: `${trainingId}:PERSONAL:${personalId}`,
      trainingId,
      memberNo: company.memberNo,
      personalId,
      checkinMethod: method,
    });
    return { ok: true, message: "受付完了", companyName: company.companyName, participantName: person.name, memberNo: company.memberNo, personalId, checkedAt: new Date().toLocaleString("ja-JP"), outside: !targetResponse.data.trainingTarget };
  } catch (error) {
    if (!duplicateError(error)) throw error;
    if (await restoreCancelled(`${trainingId}:PERSONAL:${personalId}`)) {
      return { ok: true, message: "受付完了", companyName: company.companyName, participantName: person.name, memberNo: company.memberNo, personalId, checkedAt: new Date().toLocaleString("ja-JP"), restored: true };
    }
    return { ok: true, duplicate: true, message: "既に受付済みです", companyName: company.companyName, participantName: person.name, memberNo: company.memberNo, personalId };
  }
}

export async function getSqlTraining(trainingId) {
  return findTraining(trainingId);
}

export async function registerSqlQrCheckin(trainingId, rawCode, method = CHECKIN_METHODS.DIRECT_QR) {
  const training = await findTraining(trainingId);
  const code = String(rawCode || "").trim();
  if (code.startsWith("MEMBER:")) {
    if (!isCompanyUnit(training)) throw new Error("この研修会は個人単位受付です。個人QRを読み取ってください。");
    return registerCompany(trainingId, code.slice(7).trim(), method);
  }
  if (code.startsWith("PERSONAL:")) {
    if (isCompanyUnit(training)) throw new Error("この研修会は会社単位受付です。会社QRを読み取ってください。");
    return registerPerson(trainingId, code.slice(9).trim(), method);
  }
  if (code.startsWith("PLANNED:")) {
    throw new Error("予定者QRはSQL移行準備中です。係員用検索受付をご利用ください。");
  }
  throw new Error("対応している受付QRではありません。");
}

window.sqlQrCheckin = { getTraining: getSqlTraining, register: registerSqlQrCheckin };
