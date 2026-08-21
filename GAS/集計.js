function getStatsTrainingOptionsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      getStatsTrainingOptions_();

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getStatsTrainingOptions_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    return {
      ok: true,
      trainings: []
    };
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return {
      ok: true,
      trainings: []
    };
  }

  const headers =
    sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(function(h) {
        return String(h || "").trim();
      });

  const col = {
    eventId: headers.indexOf("研修ID"),
    title: headers.indexOf("研修名"),
    eventType: headers.indexOf("イベント種別"),
    hostType: headers.indexOf("主催区分"),
    targetBranch: headers.indexOf("対象支部"),
    targetOrgIdsNew: headers.indexOf("対象組織ID"),
    receptionType: headers.indexOf("受付方式"),
    eventDate: headers.indexOf("開催日"),
    active: headers.indexOf("有効")
  };

  if (col.eventId < 0 || col.title < 0) {
    return {
      ok: false,
      message: "研修会シートに研修IDまたは研修名の列がありません。"
    };
  }

  const maxCol =
    Math.max(
      col.eventId,
      col.title,
      col.eventType,
      col.hostType,
      col.targetBranch,
      col.targetOrgIdsNew,
      col.receptionType,
      col.eventDate,
      col.active
    ) + 1;

  const values =
    sheet
      .getRange(2, 1, lastRow - 1, maxCol)
      .getValues();

  const list = [];

  for (let i = 0; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(row[col.eventId] || "").trim();

    const title =
      String(row[col.title] || "").trim();

    if (!eventId || !title) {
      continue;
    }

    const active =
      col.active >= 0
        ? String(row[col.active] || "").toUpperCase()
        : "TRUE";

    if (active !== "TRUE") {
      continue;
    }

    list.push({
      eventId: eventId,
      title: title,
      eventType: col.eventType >= 0 ? String(row[col.eventType] || "研修会").trim() || "研修会" : "研修会",
      hostType: col.hostType >= 0 ? String(row[col.hostType] || "").trim() : "",
      targetBranch: col.targetBranch >= 0 ? String(row[col.targetBranch] || "").trim() : "",
      targetOrgIdsNew: col.targetOrgIdsNew >= 0 ? String(row[col.targetOrgIdsNew] || "").trim() : "",
      targetOrgNames: getOrganizationNamesText_(
        col.targetOrgIdsNew >= 0
          ? String(row[col.targetOrgIdsNew] || "").trim()
          : ""
      ),
      receptionType: col.receptionType >= 0 ? String(row[col.receptionType] || "").trim() : "",
      eventDate: col.eventDate >= 0 ? formatDateForClient_(row[col.eventDate]) : ""
    });
  }

  return {
    ok: true,
    trainings: list,
    eventTypes: getStatsEventTypes_(
      list
    )
  };
}


function getStatsEventTypes_(trainings) {

  try {

    const eventTypes =
      getEventTypes_()
        .filter(function(eventType) {
          return String(eventType.active || "TRUE").toUpperCase() !== "FALSE";
        })
        .map(function(eventType) {
          return String(eventType.eventTypeName || "").trim();
        })
        .filter(function(eventTypeName) {
          return eventTypeName !== "";
        });

    if (eventTypes.length > 0) {
      return eventTypes;
    }

  } catch (err) {
  }

  const map = {};

  (trainings || []).forEach(function(training) {

    const eventType =
      String(training.eventType || "研修会").trim() || "研修会";

    map[eventType] =
      true;
  });

  const names =
    Object.keys(map);

  if (names.length === 0) {
    names.push(
      "研修会"
    );
  }

  return names.sort(function(a, b) {
    return a.localeCompare(b, "ja");
  });
}


function getTrainingStatsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    String(e.parameter.event || "").trim();

  let result;

  try {

    result =
      getTrainingStats_(
        eventId
      );

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getTrainingStatsSummaryJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    String(e.parameter.event || "").trim();

  let result;

  try {

    result =
      getTrainingStatsSummary_(
        eventId
      );

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getTrainingStatsSummary_(
  eventId
) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const jobSummary =
    getTrainingStatsSummaryFromCheckinIndexJob_(
      training
    );

  if (jobSummary) {
    return jobSummary;
  }

  const indexSummary =
    getTrainingStatsSummaryFromCheckinIndex_(
      training
    );

  if (indexSummary) {
    return indexSummary;
  }

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: null,
      targetCountText: "受付索引未作成",
      sentCount: null,
      sentCountText: "-",
      attendedCount: null,
      attendedCountText: "-",
      outsideAttendedCount: null,
      outsideAttendedCountText: "-",
      totalAttendedCount: null,
      targetCompanyCount: null,
      targetCompanyCountText: "-",
      attendedCompanyCount: null,
      attendedCompanyCountText: "-",
      outsideAttendedCompanyCount: null,
      outsideAttendedCompanyCountText: "-",
      absentCount: null,
      absentCountText: "-",
      absentCompanyCount: null,
      absentCompanyCountText: "-",
      attendanceRate: "-",
      companyAttendanceRate: "-",
      summaryOnly: true,
      source: "受付索引なし",
      summaryNote: "受付索引が未作成のため、集計件数を表示できません。研修会詳細の「受付索引を更新」を押してください。"
    }
  };

  const targetMembers =
    getStatsTargetMembers_(
      training
    );

  const targetMap = {};

  targetMembers.forEach(function(member) {

    const key =
      makeStatsAttendanceKey_(
        training,
        member
      );

    if (!key) {
      return;
    }

    targetMap[key] = {
      statsKey: key,
      memberNo: normalizeMemberNoForStats_(member.memberNo),
      personalId: String(member.personalId || "").trim()
    };
  });

  const checkinMap =
    getCheckinMemberMapForStats_(
      eventId
    );

  const mailMap =
    getMailSuccessMemberMapForStats_(
      eventId
    );

  const targetKeys =
    Object.keys(targetMap);

  const checkinKeys =
    Object.keys(checkinMap);

  let attended = 0;
  let outsideAttended = 0;
  let sent = 0;

  targetKeys.forEach(function(statsKey) {

    if (checkinMap[statsKey]) {
      attended++;
    }

    if (mailMap[statsKey]) {
      sent++;
    }
  });

  checkinKeys.forEach(function(statsKey) {

    if (!targetMap[statsKey]) {
      outsideAttended++;
    }
  });

  const companyCounts =
    countCompanyStatsForStats_(
      targetMap,
      checkinMap
    );

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetKeys.length,
      sentCount: sent,
      attendedCount: attended,
      outsideAttendedCount: outsideAttended,
      totalAttendedCount: attended + outsideAttended,
      targetCompanyCount: companyCounts.targetCompanyCount,
      attendedCompanyCount: companyCounts.attendedCompanyCount,
      outsideAttendedCompanyCount: companyCounts.outsideAttendedCompanyCount,
      absentCount: targetKeys.length - attended,
      attendanceRate: makeRateForStats_(
        attended,
        targetKeys.length
      ),
      summaryOnly: true
    }
  };
}

function shouldUseFirestoreForStats_() {

  return (
    typeof getConfigOptional_ === "function" &&
    String(getConfigOptional_("FIRESTORE_STATS_ENABLED") || "").toUpperCase() === "TRUE" &&
    typeof isFirestoreEnabled_ === "function" &&
    isFirestoreEnabled_()
  );
}

function getTrainingStatsSummaryFromCheckinIndexJob_(
  training
) {

  if (
    typeof getCheckinIndexJobStatus_ !== "function" ||
    !training ||
    !training.eventId
  ) {
    return null;
  }

  let job;

  try {
    job =
      getCheckinIndexJobStatus_(
        training.eventId
      );
  } catch (err) {
    return null;
  }

  if (
    !job ||
    !job.exists ||
    (
      job.status !== "実行待ち" &&
      job.status !== "実行中"
    )
  ) {
    return null;
  }

  const processed =
    Number(job.processedCount || job.offset || 0);

  const target =
    Number(job.targetCount || 0);

  const progress =
    target
      ? processed + " / " + target + "件"
      : processed + "件処理済み";

  return {
    ok: true,
    stats: {
      eventId: training.eventId || "",
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: null,
      targetCountText: "受付索引更新中",
      sentCount: null,
      sentCountText: "-",
      attendedCount: null,
      attendedCountText: "-",
      outsideAttendedCount: null,
      outsideAttendedCountText: "-",
      totalAttendedCount: null,
      targetCompanyCount: null,
      targetCompanyCountText: "-",
      attendedCompanyCount: null,
      attendedCompanyCountText: "-",
      outsideAttendedCompanyCount: null,
      outsideAttendedCompanyCountText: "-",
      absentCount: null,
      absentCountText: "-",
      absentCompanyCount: null,
      absentCompanyCountText: "-",
      attendanceRate: "-",
      companyAttendanceRate: "-",
      summaryOnly: true,
      source: "受付索引更新中",
      summaryNote:
        "受付索引を裏で更新中です。進捗: " +
        progress +
        "。完了後に自動で再読み込みします。"
    }
  };
}

function getTrainingStatsSummaryFromFirestoreTargetsOnly_(
  training
) {

  if (
    typeof getFirestoreCheckinTargets_ !== "function" ||
    !shouldUseFirestoreForStats_()
  ) {
    return null;
  }

  const eventId =
    String(training && training.eventId || "").trim();

  if (!eventId) {
    return null;
  }

  let targets;

  try {
    targets =
      getFirestoreCheckinTargets_(
        eventId
      );
  } catch (err) {
    return null;
  }

  if (!targets || targets.length === 0) {
    return null;
  }

  const targetMap = {};
  const attendedMap = {};
  const targetCompanyMap = {};
  const attendedCompanyMap = {};

  targets.forEach(function(item) {

    const targetType =
      String(item.targetType || "").trim();

    if (!isStatsTargetType_(targetType)) {
      return;
    }

    const key =
      makeStatsKeyFromItemForSummary_(
        item
      );

    if (!key) {
      return;
    }

    targetMap[key] =
      true;

    const memberNo =
      normalizeMemberNoForStats_(
        item.memberNo
      );

    if (memberNo) {
      targetCompanyMap[memberNo] =
        true;
    }

    if (String(item.status || "").trim() === "受付済み") {
      attendedMap[key] =
        true;

      if (memberNo) {
        attendedCompanyMap[memberNo] =
          true;
      }
    }
  });

  const targetCount =
    Object.keys(targetMap).length;

  const attendedCount =
    Object.keys(attendedMap).length;

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetCount,
      sentCount: null,
      sentCountText: "-",
      attendedCount: attendedCount,
      outsideAttendedCount: null,
      outsideAttendedCountText: "-",
      totalAttendedCount: attendedCount,
      targetCompanyCount: Object.keys(targetCompanyMap).length,
      attendedCompanyCount: Object.keys(attendedCompanyMap).length,
      outsideAttendedCompanyCount: null,
      outsideAttendedCompanyCountText: "-",
      absentCount: Math.max(targetCount - attendedCount, 0),
      attendanceRate: makeRateForStats_(
        attendedCount,
        targetCount
      ),
      summaryOnly: true,
      source: "Firestore",
      summaryNote: "対象人数・対象内参加・未参加人数を先に表示しています。対象外参加は一覧を開いた時に確認できます。"
    }
  };
}

function isStatsTargetType_(targetType) {

  targetType =
    String(targetType || "").trim();

  if (!targetType) {
    return true;
  }

  if (
    targetType === "当日受付" ||
    targetType === "索引更新済み" ||
    targetType === "対象外"
  ) {
    return false;
  }

  return true;
}

function getTrainingStatsSummaryFromFirestore_(
  training
) {

  if (
    typeof getFirestoreCheckinTargets_ !== "function" ||
    typeof getFirestoreCheckinHistories_ !== "function" ||
    !shouldUseFirestoreForStats_()
  ) {
    return null;
  }

  const eventId =
    String(training && training.eventId || "").trim();

  if (!eventId) {
    return null;
  }

  let targets;
  let histories;

  try {
    targets =
      getFirestoreCheckinTargets_(
        eventId
      );

    histories =
      getFirestoreCheckinHistories_(
        eventId
      );
  } catch (err) {
    return null;
  }

  if (!targets || targets.length === 0) {
    return null;
  }

  const targetMap = {};
  const targetCompanyMap = {};

  targets.forEach(function(item) {

    const targetType =
      String(item.targetType || "").trim();

    if (!isStatsTargetType_(targetType)) {
      return;
    }

    const key =
      makeStatsKeyFromItemForSummary_(
        item
      );

    if (!key) {
      return;
    }

    targetMap[key] =
      true;

    const memberNo =
      normalizeMemberNoForStats_(
        item.memberNo
      );

    if (memberNo) {
      targetCompanyMap[memberNo] =
        true;
    }
  });

  const attendedMap = {};
  const outsideAttendedMap = {};
  const attendedCompanyMap = {};
  const outsideCompanyMap = {};

  (histories || []).forEach(function(history) {

    const result =
      String(history.result || "").trim();

    if (result !== "受付完了") {
      return;
    }

    const key =
      makeStatsKeyFromItemForSummary_(
        history
      );

    if (!key) {
      return;
    }

    const memberNo =
      normalizeMemberNoForStats_(
        history.memberNo
      );

    if (targetMap[key]) {
      attendedMap[key] =
        true;

      if (memberNo) {
        attendedCompanyMap[memberNo] =
          true;
      }
    } else {
      outsideAttendedMap[key] =
        true;

      if (memberNo) {
        outsideCompanyMap[memberNo] =
          true;
      }
    }
  });

  const targetCount =
    Object.keys(targetMap).length;

  const attendedCount =
    Object.keys(attendedMap).length;

  const outsideAttendedCount =
    Object.keys(outsideAttendedMap).length;

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetCount,
      sentCount: null,
      sentCountText: "-",
      attendedCount: attendedCount,
      outsideAttendedCount: outsideAttendedCount,
      totalAttendedCount: attendedCount + outsideAttendedCount,
      targetCompanyCount: Object.keys(targetCompanyMap).length,
      attendedCompanyCount: Object.keys(attendedCompanyMap).length,
      outsideAttendedCompanyCount: Object.keys(outsideCompanyMap).length,
      absentCount: Math.max(targetCount - attendedCount, 0),
      attendanceRate: makeRateForStats_(
        attendedCount,
        targetCount
      ),
      summaryOnly: true,
      source: "Firestore"
    }
  };
}

function makeStatsKeyFromItemForSummary_(
  item
) {

  const personalId =
    String(item && item.personalId || "").trim();

  if (personalId) {
    return "P:" + personalId;
  }

  const plannedId =
    String(item && item.plannedId || "").trim();

  if (plannedId) {
    return "PLANNED:" + plannedId;
  }

  const memberNo =
    normalizeMemberNoForStats_(
      item && item.memberNo
    );

  if (memberNo) {
    return "M:" + memberNo;
  }

  const guestKey =
    [
      item && item.receptionCategory,
      item && item.companyName,
      item && item.participantName,
      item && item.mail,
      item && item.phone
    ].map(function(value) {
      return normalizeStatsGuestKeyText_(
        value
      );
    }).join("|");

  return guestKey.replace(/\|/g, "")
    ? "G:" + guestKey
    : "";
}

function normalizeStatsGuestKeyText_(
  value
) {

  let text =
    String(value || "");

  if (text.normalize) {
    text =
      text.normalize("NFKC");
  }

  return text
    .replace(/[ 　\t\r\n]/g, "")
    .replace(/株式会社/g, "株")
    .replace(/有限会社/g, "有")
    .replace(/髙/g, "高")
    .replace(/﨑/g, "崎")
    .replace(/斉/g, "斎")
    .toLowerCase();
}

function getTrainingStatsSummaryFromCheckinIndex_(
  training
) {

  const eventId =
    String(training && training.eventId || "").trim();

  if (!eventId) {
    return null;
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("受付索引");

  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const indexRowsByKey =
    typeof getCheckinIndexRowsByEvent_ === "function"
      ? getCheckinIndexRowsByEvent_(
          sheet,
          headerMap,
          eventId
        )
      : {};

  const rows =
    Object
      .keys(indexRowsByKey)
      .map(function(key) {
        return indexRowsByKey[key].row;
      });

  let targetCount = 0;
  let attendedCount = 0;
  let outsideAttendedCount = 0;
  const targetCompanyMap = {};
  const attendedCompanyMap = {};
  const outsideCompanyMap = {};
  let matchedRows = 0;
  let indexBuildInProgress = false;

  rows.forEach(function(row) {

    matchedRows++;

    const targetType =
      String(getCellByHeader_(row, headerMap, "対象区分") || "").trim();

    if (targetType === "索引更新済み") {
      const note =
        String(getCellByHeader_(row, headerMap, "備考") || "").trim();

      if (note === "索引更新中") {
        indexBuildInProgress =
          true;
      }

      return;
    }

    const status =
      String(getCellByHeader_(row, headerMap, "受付状態") || "").trim();

    const memberNo =
      normalizeMemberNoForStats_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    const isTarget =
      isStatsTargetType_(
        targetType
      );

    if (isTarget) {
      targetCount++;

      if (memberNo) {
        targetCompanyMap[memberNo] =
          true;
      }
    }

    if (status !== "受付済み") {
      return;
    }

    if (isTarget) {
      attendedCount++;

      if (memberNo) {
        attendedCompanyMap[memberNo] =
          true;
      }
    } else {
      outsideAttendedCount++;

      if (memberNo) {
        outsideCompanyMap[memberNo] =
          true;
      }
    }
  });

  if (indexBuildInProgress) {
    return {
      ok: true,
      stats: {
        eventId: eventId,
        title: training.title || "",
        attendanceUnit: training.attendanceUnit || "会社",
        targetCount: null,
        targetCountText: "受付索引更新中",
        sentCount: null,
        sentCountText: "-",
        attendedCount: null,
        attendedCountText: "-",
        outsideAttendedCount: null,
        outsideAttendedCountText: "-",
        absentCount: null,
        absentCountText: "-",
        attendanceRate: "-",
        summaryOnly: true,
        source: "受付索引更新中",
        summaryNote: "受付索引を更新中です。完了後に自動で再読み込みします。"
      }
    };
  }

  if (matchedRows === 0) {
    return null;
  }

  if (targetCount === 0) {
    return null;
  }

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetCount,
      sentCount: null,
      sentCountText: "-",
      attendedCount: attendedCount,
      outsideAttendedCount: outsideAttendedCount,
      totalAttendedCount: attendedCount + outsideAttendedCount,
      targetCompanyCount: Object.keys(targetCompanyMap).length,
      attendedCompanyCount: Object.keys(attendedCompanyMap).length,
      outsideAttendedCompanyCount: Object.keys(outsideCompanyMap).length,
      absentCount: Math.max(targetCount - attendedCount, 0),
      attendanceRate: makeRateForStats_(
        attendedCount,
        targetCount
      ),
      summaryOnly: true,
      source: "受付索引"
    }
  };
}

function getAnnualTrainingStatsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const year =
    String(e.parameter.year || "").trim();
  const eventType =
    String(e.parameter.eventType || "研修会").trim() || "研修会";
  const hostType =
    String(e.parameter.hostType || "").trim();
  const targetBranch =
    String(e.parameter.targetBranch || "").trim();
  const targetOrgId =
    String(e.parameter.targetOrgId || "").trim();

  let result;

  try {

    result =
      getAnnualTrainingStats_(
        year,
        {
          eventType: eventType,
          hostType: hostType,
          targetBranch: targetBranch,
          targetOrgId: targetOrgId
        }
      );

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getAnnualTrainingStats_(
  year,
  filters
) {

  filters =
    filters || {};

  if (!year) {
    return {
      ok: false,
      message: "年度が指定されていません。"
    };
  }

  const optionsResult =
    getStatsTrainingOptions_();

  if (!optionsResult.ok) {
    return optionsResult;
  }

  const trainings =
    (optionsResult.trainings || []).filter(function(training) {
      if (
        getTrainingFiscalYearForStats_(
          training
        ) !== year
      ) {
        return false;
      }

      if (
        filters.eventType &&
        filters.eventType !== "all" &&
        String(training.eventType || "研修会").trim() !== filters.eventType
      ) {
        return false;
      }

      if (
        filters.hostType &&
        String(training.hostType || "") !== filters.hostType
      ) {
        return false;
      }

      if (
        filters.targetBranch &&
        String(training.targetBranch || "") !== filters.targetBranch
      ) {
        return false;
      }

      if (filters.targetOrgId) {

        const trainingTargetOrgIds =
          splitStatsCsvText_(
            training.targetOrgIdsNew
          );

        if (
          filters.targetOrgId === "__NONE__" &&
          trainingTargetOrgIds.length > 0
        ) {
          return false;
        }

        if (filters.targetOrgId === "__NONE__") {
          return true;
        }

        if (
          trainingTargetOrgIds.indexOf(filters.targetOrgId) < 0
        ) {
          return false;
        }
      }

      return true;
    });

  const branchMap = {};
  const districtMap = {};
  const methodMap = {};
  const categoryMap = {};
  const uniqueTargetMap = {};
  const uniqueAttendedMap = {};
  const trainingStats = [];

  let targetTotal = 0;
  let sentTotal = 0;
  let attendedTotal = 0;
  let outsideTotal = 0;
  let absentTotal = 0;

  if (trainings.length === 0) {
    return makeEmptyAnnualTrainingStatsResult_(
      year,
      filters.eventType || "研修会"
    );
  }

  const annualContext =
    buildAnnualStatsContext_(
      trainings.map(function(training) {
        return training.eventId;
      })
    );

  trainings.forEach(function(training) {

    const result =
      getTrainingStatsWithContext_(
        training,
        annualContext
      );

    if (!result.ok) {
      return;
    }

    const stats =
      result.stats;

    targetTotal +=
      Number(stats.targetCount || 0);

    sentTotal +=
      Number(stats.sentCount || 0);

    attendedTotal +=
      Number(stats.attendedCount || 0);

    outsideTotal +=
      Number(stats.outsideAttendedCount || 0);

    absentTotal +=
      Number(stats.absentCount || 0);

    mergeAnnualAttributeStats_(
      branchMap,
      stats.branchStats || []
    );

    mergeAnnualAttributeStats_(
      districtMap,
      stats.districtStats || []
    );

    mergeAnnualMethodStats_(
      methodMap,
      stats.methodStats || []
    );

    mergeAnnualMethodStats_(
      categoryMap,
      stats.receptionCategoryStats || []
    );

    addAnnualUniqueTargetMembersFromMap_(
      uniqueTargetMap,
      result.targetMap || {}
    );

    addAnnualUniqueAttendedMembers_(
      uniqueAttendedMap,
      training.eventId,
      annualContext.checkinMaps
    );

    trainingStats.push({
      eventId: stats.eventId,
      title: stats.title,
      eventType: training.eventType || "研修会",
      eventDate: training.eventDate || "",
      hostType: training.hostType || "",
      targetBranch: training.targetBranch || "",
      targetOrgIdsNew: training.targetOrgIdsNew || "",
      targetOrgNames: training.targetOrgNames || "",
      targetCount: stats.targetCount,
      attendedCount: stats.attendedCount,
      outsideAttendedCount: stats.outsideAttendedCount || 0,
      totalAttendedCount: stats.totalAttendedCount || stats.attendedCount || 0,
      absentCount: stats.absentCount,
      attendanceRate: stats.attendanceRate
    });
  });

  trainingStats.sort(function(a, b) {
    return String(a.eventDate || "") > String(b.eventDate || "") ? 1 : -1;
  });

  const totalAttended =
    attendedTotal + outsideTotal;

  return {
    ok: true,
    annualStats: {
      year: year,
      eventType: filters.eventType || "研修会",
      trainingCount: trainings.length,
      targetTotal: targetTotal,
      sentTotal: sentTotal,
      attendedTotal: attendedTotal,
      outsideTotal: outsideTotal,
      totalAttended: totalAttended,
      absentTotal: absentTotal,
      uniqueTargetCount: Object.keys(uniqueTargetMap).length,
      uniqueAttendedCount: Object.keys(uniqueAttendedMap).length,
      attendanceRate: makeRateForStats_(
        attendedTotal,
        targetTotal
      ),
      uniqueAttendanceRate: makeRateForStats_(
        Object.keys(uniqueAttendedMap).length,
        Object.keys(uniqueTargetMap).length
      ),
      branchStats: annualStatsMapToList_(
        branchMap
      ),
      districtStats: annualStatsMapToList_(
        districtMap
      ),
      methodStats: annualMethodMapToList_(
        methodMap
      ),
      receptionCategoryStats: annualMethodMapToList_(
        categoryMap
      ),
      trainingStats: trainingStats
    }
  };
}


function makeEmptyAnnualTrainingStatsResult_(
  year,
  eventType
) {

  return {
    ok: true,
    annualStats: {
      year: year,
      eventType: eventType,
      trainingCount: 0,
      targetTotal: 0,
      sentTotal: 0,
      attendedTotal: 0,
      outsideTotal: 0,
      totalAttended: 0,
      absentTotal: 0,
      uniqueTargetCount: 0,
      uniqueAttendedCount: 0,
      attendanceRate: "0.0%",
      uniqueAttendanceRate: "0.0%",
      branchStats: [],
      districtStats: [],
      methodStats: [],
      receptionCategoryStats: [],
      trainingStats: []
    }
  };
}


function getTrainingFiscalYearForStats_(
  training
) {

  const eventId =
    String(training && training.eventId || "").trim();

  const match =
    eventId.match(/^(\d{4})-/);

  if (match) {
    return match[1];
  }

  const eventDate =
    String(training && training.eventDate || "").trim();

  const dateMatch =
    eventDate.match(/^(\d{4})[\/\-](\d{1,2})/);

  if (!dateMatch) {
    return "";
  }

  const year =
    Number(dateMatch[1]);

  const month =
    Number(dateMatch[2]);

  return String(month <= 3 ? year - 1 : year);
}

function splitStatsCsvText_(
  text
) {

  return String(text || "")
    .split(",")
    .map(function(value) {
      return String(value || "").trim();
    })
    .filter(function(value) {
      return value !== "";
    });
}


function mergeAnnualAttributeStats_(
  target,
  list
) {

  list.forEach(function(item) {

    const name =
      String(item.name || "未設定").trim() || "未設定";

    if (!target[name]) {
      target[name] = {
        name: name,
        targetCount: 0,
        attendedCount: 0,
        outsideAttendedCount: 0,
        totalAttendedCount: 0,
        attendanceRate: "0.0%"
      };
    }

    target[name].targetCount +=
      Number(item.targetCount || 0);

    target[name].attendedCount +=
      Number(item.attendedCount || 0);

    target[name].outsideAttendedCount +=
      Number(item.outsideAttendedCount || 0);
  });
}


function annualStatsMapToList_(
  map
) {

  return Object.keys(map)
    .sort()
    .map(function(name) {

      const item =
        map[name];

      item.totalAttendedCount =
        item.attendedCount +
        item.outsideAttendedCount;

      item.attendanceRate =
        makeRateForStats_(
          item.attendedCount,
          item.targetCount
        );

      return item;
    });
}


function mergeAnnualMethodStats_(
  target,
  list
) {

  list.forEach(function(item) {

    const name =
      String(item.name || "未設定").trim() || "未設定";

    if (!target[name]) {
      target[name] = {
        name: name,
        count: 0
      };
    }

    target[name].count +=
      Number(item.count || 0);
  });
}


function annualMethodMapToList_(
  map
) {

  return Object.keys(map)
    .sort()
    .map(function(name) {
      return map[name];
    });
}


function addAnnualUniqueTargetMembersFromMap_(
  map,
  targetMap
) {

  Object.keys(targetMap || {}).forEach(function(statsKey) {

    const member =
      targetMap[statsKey] || {};

    const memberNo =
      normalizeMemberNoForStats_(
        member.memberNo
      );

    if (memberNo) {
      map[memberNo] =
        true;
    }
  });
}


function addAnnualUniqueAttendedMembers_(
  map,
  eventId,
  checkinMaps
) {

  const checkinMap =
    checkinMaps && checkinMaps[eventId]
      ? checkinMaps[eventId]
      : getCheckinMemberMapForStats_(
          eventId
        );

  Object.keys(checkinMap).forEach(function(memberNo) {
    map[memberNo] =
      true;
  });
}


function buildAnnualStatsContext_(
  eventIds
) {

  const eventIdMap =
    makeAnnualEventIdMap_(
      eventIds
    );

  return {
    memberMap: getMemberMasterMapForStats_(),
    checkinMaps: getAllCheckinMapsForStats_(
      eventIdMap
    ),
    mailMaps: getAllMailSuccessMapsForStats_(
      eventIdMap
    )
  };
}


function makeAnnualEventIdMap_(
  eventIds
) {

  const map = {};

  (eventIds || []).forEach(function(eventId) {

    eventId =
      String(eventId || "").trim();

    if (eventId) {
      map[eventId] =
        true;
    }
  });

  return map;
}


function getTrainingStatsWithContext_(
  trainingOption,
  context
) {

  const training =
    findTrainingById_(
      trainingOption.eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const targetMap =
    buildTargetMapForStats_(
      training,
      context.memberMap
    );

  const checkinMap =
    context.checkinMaps[training.eventId] || {};

  const mailMap =
    context.mailMaps[training.eventId] || {};

  const result =
    buildTrainingStatsFromMaps_(
    training,
    targetMap,
      checkinMap,
      mailMap,
      {
        memberMap: context.memberMap
      }
    );

  if (result && result.ok) {
    result.targetMap =
      targetMap;
  }

  return result;
}


function buildTargetMapForStats_(
  training,
  memberMap
) {

  const firestoreTargetMap =
    buildTargetMapForStatsFromFirestore_(
      training,
      memberMap
    );

  if (firestoreTargetMap) {
    return firestoreTargetMap;
  }

  const targetMembers =
    getStatsTargetMembers_(
      training
    );

  const targetMap = {};

  targetMembers.forEach(function(member) {

    const memberNo =
      normalizeMemberNoForStats_(
        member.memberNo
      );

    const key =
      makeStatsAttendanceKey_(
        training,
        member
      );

    if (!key) {
      return;
    }

    const master =
      memberMap[memberNo] || {};

    targetMap[key] = {
      statsKey: key,
      memberNo: memberNo,
      companyName: member.companyName || master.companyName || "",
      personalId: member.personalId || "",
      participantName: member.participantName || member.personName || "",
      mail: member.mail || master.mail || "",
      branch: member.branch || master.branch || "",
      district: member.district || master.district || "",
      block: master.block || ""
    };
  });

  return targetMap;
}


function buildTargetMapForStatsFromFirestore_(
  training,
  memberMap
) {

  if (
    typeof getFirestoreCheckinTargets_ !== "function" ||
    !shouldUseFirestoreForStats_()
  ) {
    return null;
  }

  const eventId =
    String(training && training.eventId || "").trim();

  if (!eventId) {
    return null;
  }

  let targets;

  try {
    targets =
      getFirestoreCheckinTargets_(
        eventId
      );
  } catch (err) {
    return null;
  }

  if (!targets || targets.length === 0) {
    return null;
  }

  const targetMap = {};

  targets.forEach(function(member) {

    if (!isStatsTargetType_(member.targetType)) {
      return;
    }

    const memberNo =
      normalizeMemberNoForStats_(
        member.memberNo
      );

    const key =
      makeStatsAttendanceKey_(
        training,
        member
      );

    if (!key) {
      return;
    }

    const master =
      memberMap && memberMap[memberNo]
        ? memberMap[memberNo]
        : {};

    targetMap[key] = {
      statsKey: key,
      memberNo: memberNo,
      companyName: member.companyName || master.companyName || "",
      personalId: member.personalId || "",
      participantName: member.participantName || member.personName || "",
      mail: member.mail || master.mail || "",
      branch: member.branch || master.branch || "",
      district: member.district || master.district || "",
      block: member.block || master.block || ""
    };
  });

  return Object.keys(targetMap).length > 0
    ? targetMap
    : null;
}

function getStatsTargetMembers_(
  training
) {

  if (
    String(training && training.attendanceUnit || "会社").trim() === "個人" &&
    typeof getTargetMembers_ === "function"
  ) {
    return getTargetMembers_(
      training,
      {
        includeWithoutMail: true
      }
    );
  }

  return getTrainingTargetMembers_(
    training
  );
}

function makeStatsAttendanceKey_(
  training,
  item
) {

  const attendanceUnit =
    String(training && training.attendanceUnit || "会社").trim();

  const personalId =
    String(item && item.personalId || "").trim();

  if (attendanceUnit === "個人" && personalId) {
    return "P:" + personalId;
  }

  const memberNo =
    normalizeMemberNoForStats_(
      item && item.memberNo
    );

  return memberNo
    ? "M:" + memberNo
    : "";
}

function makeStatsCheckinKeyFromRow_(
  row,
  headerMap
) {

  const personalId =
    headerMap && headerMap["個人ID"] !== undefined
      ? String(getCellByHeader_(row, headerMap, "個人ID") || "").trim()
      : "";

  if (personalId) {
    return "P:" + personalId;
  }

  const memberNo =
    normalizeMemberNoForStats_(
      getCellByHeader_(row, headerMap, "業者番号")
    );

  return memberNo
    ? "M:" + memberNo
    : "";
}

function makeStatsMailKeyFromRow_(
  row,
  headerMap
) {

  const personalId =
    headerMap && headerMap["個人ID"] !== undefined
      ? String(getCellByHeader_(row, headerMap, "個人ID") || "").trim()
      : "";

  if (personalId) {
    return "P:" + personalId;
  }

  const memberNo =
    normalizeMemberNoForStats_(
      getCellByHeader_(row, headerMap, "業者番号")
    );

  return memberNo
    ? "M:" + memberNo
    : "";
}


function buildTrainingStatsFromMaps_(
  training,
  targetMap,
  checkinMap,
  mailMap,
  options
) {

  options =
    options || {};

  const targetKeys =
    Object.keys(targetMap);

  const checkinKeys =
    Object.keys(checkinMap);

  let attended = 0;
  let outsideAttended = 0;
  let sent = 0;

  targetKeys.forEach(function(statsKey) {

    if (checkinMap[statsKey]) {
      attended++;
    }

    if (mailMap[statsKey]) {
      sent++;
    }
  });

  checkinKeys.forEach(function(statsKey) {

    if (!targetMap[statsKey]) {
      outsideAttended++;
    }
  });

  const totalAttended =
    attended + outsideAttended;

  const companyCounts =
    countCompanyStatsForStats_(
      targetMap,
      checkinMap
    );

  return {
    ok: true,
    stats: {
      eventId: training.eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetKeys.length,
      sentCount: sent,
      attendedCount: attended,
      outsideAttendedCount: outsideAttended,
      totalAttendedCount: totalAttended,
      targetCompanyCount: companyCounts.targetCompanyCount,
      attendedCompanyCount: companyCounts.attendedCompanyCount,
      outsideAttendedCompanyCount: companyCounts.outsideAttendedCompanyCount,
      absentCount: targetKeys.length - attended,
      attendanceRate: makeRateForStats_(
        attended,
        targetKeys.length
      ),
      branchStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "branch",
        options.memberMap
      ),
      districtStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "district",
        options.memberMap
      ),
      blockStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "block",
        options.memberMap
      ),
      methodStats: makeMethodStatsFromCheckinMap_(
        checkinMap
      ),
      receptionCategoryStats: makeReceptionCategoryStatsFromCheckinMap_(
        checkinMap
      ),
      organizationStats: []
    }
  };
}


function getTrainingStats_(eventId) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const targetMembers =
    getStatsTargetMembers_(
      training
    );

  const memberMap =
    getMemberMasterMapForStats_();

  const targetMap = {};

  targetMembers.forEach(function(member) {

    const memberNo =
      normalizeMemberNoForStats_(
        member.memberNo
      );

    const key =
      makeStatsAttendanceKey_(
        training,
        member
      );

    if (!key) {
      return;
    }

    const master =
      memberMap[memberNo] || {};

    targetMap[key] = {
      statsKey: key,
      memberNo: memberNo,
      companyName: member.companyName || master.companyName || "",
      personalId: member.personalId || "",
      participantName: member.participantName || member.personName || "",
      mail: member.mail || master.mail || "",
      branch: member.branch || master.branch || "",
      district: master.district || "",
      block: master.block || ""
    };
  });

  const checkinMap =
    getCheckinMemberMapForStats_(
      eventId
    );

  const mailMap =
    getMailSuccessMemberMapForStats_(
      eventId
    );

  const targetKeys =
    Object.keys(targetMap);

  const checkinKeys =
    Object.keys(checkinMap);

  let attended =
    0;

  let outsideAttended =
    0;

  let sent =
    0;

  targetKeys.forEach(function(statsKey) {

    if (checkinMap[statsKey]) {
      attended++;
    }

    if (mailMap[statsKey]) {
      sent++;
    }
  });

  checkinKeys.forEach(function(statsKey) {

    if (!targetMap[statsKey]) {
      outsideAttended++;
    }
  });

  const totalAttended =
    attended + outsideAttended;

  const companyCounts =
    countCompanyStatsForStats_(
      targetMap,
      checkinMap
    );

  return {
    ok: true,
    stats: {
      eventId: eventId,
      title: training.title || "",
      attendanceUnit: training.attendanceUnit || "会社",
      targetCount: targetKeys.length,
      sentCount: sent,
      attendedCount: attended,
      outsideAttendedCount: outsideAttended,
      totalAttendedCount: totalAttended,
      targetCompanyCount: companyCounts.targetCompanyCount,
      attendedCompanyCount: companyCounts.attendedCompanyCount,
      outsideAttendedCompanyCount: companyCounts.outsideAttendedCompanyCount,
      absentCount: targetKeys.length - attended,
      attendanceRate: makeRateForStats_(
        attended,
        targetKeys.length
      ),
      branchStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "branch"
      ),
      districtStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "district"
      ),
      blockStats: makeAttributeStatsForStats_(
        targetMap,
        checkinMap,
        "block"
      ),
      methodStats: makeCheckinMethodStatsForStats_(
        eventId
      ),
      receptionCategoryStats: makeReceptionCategoryStatsForStats_(
        eventId
      ),
      organizationStats: makeOrganizationStatsForStats_(
        targetMap,
        checkinMap,
        getStatsDisplayOrgIdsForTraining_(
          training
        )
      )
    }
  };
}


function getMemberMasterMapForStats_() {

  const map = {};

  let members;

  try {

    members =
      getMemberRowsFromMaster_();

  } catch (err) {

    return map;
  }

  members.forEach(function(member) {

    if (!member.memberNo) {
      return;
    }

    map[member.memberNo] = {
      memberNo: member.memberNo,
      companyName: member.companyName,
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district
    };
  });

  return map;
}


function getCheckinMemberMapForStats_(eventId) {

  const firestoreMap =
    getCheckinMemberMapForStatsFromFirestore_(
      eventId
    );

  if (firestoreMap) {
    return firestoreMap;
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const key =
      makeStatsCheckinKeyFromRow_(
        row,
        headerMap
      );

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId === String(eventId).trim() &&
      key &&
      result === "受付完了"
    ) {
      map[key] = {
        memberNo: normalizeMemberNoForStats_(getCellByHeader_(row, headerMap, "業者番号")),
        personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
        participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
        companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
        snapshotOrgIds: String(getCellByHeader_(row, headerMap, "受付時所属組織ID") || "").trim(),
        snapshotOrgNames: String(getCellByHeader_(row, headerMap, "受付時所属組織名") || "").trim(),
        branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
        district: String(getCellByHeader_(row, headerMap, "地区") || "").trim(),
        block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
        receptionCategory: String(getCellByHeader_(row, headerMap, "受付区分") || "").trim()
      };
    }
  }

  return map;
}

function getCheckinMemberMapForStatsFromFirestore_(
  eventId
) {

  if (
    typeof getFirestoreCheckinHistories_ !== "function" ||
    !shouldUseFirestoreForStats_()
  ) {
    return null;
  }

  let histories;

  try {
    histories =
      getFirestoreCheckinHistories_(
        eventId
      );
  } catch (err) {
    return null;
  }

  if (!histories || histories.length === 0) {
    return null;
  }

  const map = {};

  histories.forEach(function(history) {

    const result =
      String(history.result || "").trim();

    if (result !== "受付完了") {
      return;
    }

    let key = "";

    const personalId =
      String(history.personalId || "").trim();

    if (personalId) {
      key =
        "P:" + personalId;
    } else {
      const memberNo =
        normalizeMemberNoForStats_(
          history.memberNo
        );

      key =
        memberNo
          ? "M:" + memberNo
          : "";
    }

    if (!key) {
      return;
    }

    map[key] = {
      method: String(history.method || "未設定").trim() || "未設定",
      memberNo: normalizeMemberNoForStats_(history.memberNo),
      personalId: personalId,
      participantName: String(history.participantName || "").trim(),
      companyName: String(history.companyName || "").trim(),
      snapshotOrgIds: String(history.snapshotOrgIds || "").trim(),
      snapshotOrgNames: String(history.snapshotOrgNames || "").trim(),
      branch: String(history.branch || "").trim(),
      district: String(history.district || "").trim(),
      block: String(history.block || "").trim(),
      receptionCategory: String(history.receptionCategory || "").trim()
    };
  });

  return map;
}

function getAllCheckinMapsForStats_(
  eventIdMap
) {

  const hasEventIdFilter =
    eventIdMap &&
    Object.keys(eventIdMap).length > 0;

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  const maps = {};

  if (!sheet) {
    return maps;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (
      hasEventIdFilter &&
      !eventIdMap[eventId]
    ) {
      continue;
    }

    const key =
      makeStatsCheckinKeyFromRow_(
        row,
        headerMap
      );

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    const method =
      String(getCellByHeader_(row, headerMap, "受付方法") || "未設定").trim() || "未設定";

    if (!eventId || !key || result !== "受付完了") {
      continue;
    }

    if (!maps[eventId]) {
      maps[eventId] = {};
    }

    maps[eventId][key] = {
      method: method,
      memberNo: normalizeMemberNoForStats_(getCellByHeader_(row, headerMap, "業者番号")),
      personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      snapshotOrgIds: String(getCellByHeader_(row, headerMap, "受付時所属組織ID") || "").trim(),
      snapshotOrgNames: String(getCellByHeader_(row, headerMap, "受付時所属組織名") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      district: String(getCellByHeader_(row, headerMap, "地区") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      receptionCategory: String(getCellByHeader_(row, headerMap, "受付区分") || "").trim()
    };
  }

  return maps;
}


function getMailSuccessMemberMapForStats_(eventId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("送信履歴");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const key =
      makeStatsMailKeyFromRow_(
        row,
        headerMap
      );

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId === String(eventId).trim() &&
      key &&
      result === "送信完了"
    ) {
      map[key] =
        true;
    }
  }

  return map;
}

function getAllMailSuccessMapsForStats_(
  eventIdMap
) {

  const hasEventIdFilter =
    eventIdMap &&
    Object.keys(eventIdMap).length > 0;

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("送信履歴");

  const maps = {};

  if (!sheet) {
    return maps;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (
      hasEventIdFilter &&
      !eventIdMap[eventId]
    ) {
      continue;
    }

    const key =
      makeStatsMailKeyFromRow_(
        row,
        headerMap
      );

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (!eventId || !key || result !== "送信完了") {
      continue;
    }

    if (!maps[eventId]) {
      maps[eventId] = {};
    }

    maps[eventId][key] =
      true;
  }

  return maps;
}


function makeAttributeStatsForStats_(
  targetMap,
  checkinMap,
  attributeName,
  memberMap
) {

  memberMap =
    memberMap || getMemberMasterMapForStats_();

  const statsMap = {};

  Object.keys(targetMap).forEach(function(statsKey) {

    const member =
      targetMap[statsKey];

    const name =
      String(member[attributeName] || "未設定").trim() || "未設定";

    if (!statsMap[name]) {
      statsMap[name] = {
        name: name,
        targetCount: 0,
        attendedCount: 0,
        outsideAttendedCount: 0,
        totalAttendedCount: 0,
        attendanceRate: "0.0%",
        targetOnly: false
      };
    }

    statsMap[name].targetCount++;

    if (checkinMap[statsKey]) {
      statsMap[name].attendedCount++;
    }
  });

  Object.keys(checkinMap).forEach(function(statsKey) {

    if (targetMap[statsKey]) {
      return;
    }

    const checkin =
      checkinMap[statsKey] || {};

    const memberNo =
      normalizeMemberNoForStats_(
        checkin.memberNo || String(statsKey || "").replace(/^M:/, "")
      );

    const master =
      memberMap[memberNo] || {};

    const member =
      {
        block: checkin.block || master.block || "",
        branch: checkin.branch || master.branch || "",
        district: checkin.district || master.district || ""
      };

    const name =
      String(member[attributeName] || "未設定").trim() || "未設定";

    if (!statsMap[name]) {
      statsMap[name] = {
        name: name,
        targetCount: null,
        attendedCount: null,
        outsideAttendedCount: 0,
        totalAttendedCount: 0,
        attendanceRate: "-",
        targetOnly: true
      };
    }

    statsMap[name].outsideAttendedCount++;
  });

  return Object.keys(statsMap)
    .sort()
    .map(function(name) {

      const item =
        statsMap[name];

      if (item.targetCount === null) {

        item.totalAttendedCount =
          item.outsideAttendedCount;

        item.attendanceRate =
          "-";

        return item;
      }

      item.totalAttendedCount =
        item.attendedCount +
        item.outsideAttendedCount;

      item.attendanceRate =
        makeRateForStats_(
          item.attendedCount,
          item.targetCount
        );

      return item;
    });
}

function countCompanyStatsForStats_(
  targetMap,
  checkinMap
) {

  const targetCompanyMap = {};
  const attendedCompanyMap = {};
  const outsideCompanyMap = {};

  Object.keys(targetMap || {}).forEach(function(statsKey) {

    const target =
      targetMap[statsKey] || {};

    const memberNo =
      normalizeMemberNoForStats_(
        target.memberNo
      );

    if (memberNo) {
      targetCompanyMap[memberNo] =
        true;
    }

    if (memberNo && checkinMap && checkinMap[statsKey]) {
      attendedCompanyMap[memberNo] =
        true;
    }
  });

  Object.keys(checkinMap || {}).forEach(function(statsKey) {

    if (targetMap && targetMap[statsKey]) {
      return;
    }

    const checkin =
      checkinMap[statsKey] || {};

    const memberNo =
      normalizeMemberNoForStats_(
        checkin.memberNo || String(statsKey || "").replace(/^M:/, "")
      );

    if (memberNo) {
      outsideCompanyMap[memberNo] =
        true;
    }
  });

  return {
    targetCompanyCount: Object.keys(targetCompanyMap).length,
    attendedCompanyCount: Object.keys(attendedCompanyMap).length,
    outsideAttendedCompanyCount: Object.keys(outsideCompanyMap).length
  };
}


function makeCheckinMethodStatsForStats_(eventId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  const statsMap = {};

  if (!sheet) {
    return [];
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(values[i][1] || "").trim();

    const method =
      String(values[i][2] || "未設定").trim() || "未設定";

    const result =
      String(values[i][6] || "").trim();

    if (
      rowEventId !== String(eventId).trim() ||
      result !== "受付完了"
    ) {
      continue;
    }

    if (!statsMap[method]) {
      statsMap[method] = {
        name: method,
        count: 0
      };
    }

    statsMap[method].count++;
  }

  return Object.keys(statsMap)
    .sort()
    .map(function(name) {
      return statsMap[name];
    });
}

function makeReceptionCategoryStatsForStats_(eventId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  const statsMap = {};

  if (!sheet) {
    return [];
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId !== String(eventId).trim() ||
      result !== "受付完了"
    ) {
      continue;
    }

    const category =
      String(getCellByHeader_(row, headerMap, "受付区分") || "").trim() ||
      "第十ブロック会員";

    if (!statsMap[category]) {
      statsMap[category] = {
        name: category,
        count: 0
      };
    }

    statsMap[category].count++;
  }

  return Object.keys(statsMap)
    .sort()
    .map(function(name) {
      return statsMap[name];
    });
}

function makeReceptionCategoryStatsFromCheckinMap_(
  checkinMap
) {

  const statsMap = {};

  Object.keys(checkinMap || {}).forEach(function(statsKey) {

    const item =
      checkinMap[statsKey] || {};

    const category =
      String(item.receptionCategory || "").trim() ||
      "第十ブロック会員";

    if (!statsMap[category]) {
      statsMap[category] = {
        name: category,
        count: 0
      };
    }

    statsMap[category].count++;
  });

  return Object.keys(statsMap)
    .sort()
    .map(function(name) {
      return statsMap[name];
    });
}

function makeMethodStatsFromCheckinMap_(
  checkinMap
) {

  const statsMap = {};

  Object.keys(checkinMap || {}).forEach(function(memberNo) {

    const item =
      checkinMap[memberNo];

    const method =
      String(item && item.method || "未設定").trim() || "未設定";

    if (!statsMap[method]) {
      statsMap[method] = {
        name: method,
        count: 0
      };
    }

    statsMap[method].count++;
  });

  return Object.keys(statsMap)
    .sort()
    .map(function(name) {
      return statsMap[name];
    });
}


function makeOrganizationStatsForStats_(
  targetMap,
  checkinMap,
  displayOrgIds
) {

  displayOrgIds =
    displayOrgIds || [];

  if (displayOrgIds.length === 0) {
    return [];
  }

  const ss =
    getSpreadsheet_();

  const orgSheet =
    ss.getSheetByName("組織マスタ");

  if (!orgSheet) {
    return [];
  }

  const orgValues =
    orgSheet.getDataRange().getValues();

  const orgList = [];

  for (let i = 1; i < orgValues.length; i++) {

    const orgId =
      String(orgValues[i][0] || "").trim();

    const orgName =
      String(orgValues[i][1] || "").trim();

    const active =
      String(orgValues[i][3] || "").toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE";

    const csvImportMode =
      String(orgValues[i][8] || "").trim();

    if (!orgId || !orgName || active === "FALSE") {
      continue;
    }

    if (displayOrgIds.indexOf(orgId) < 0) {
      continue;
    }

    orgList.push({
      orgId: orgId,
      orgName: orgName,
      csvImportMode: csvImportMode
    });
  }

  const memberOrgMap =
    getMemberOrganizationMapForStats_();

  const personalOrgMap =
    getPersonalOrganizationMap_();

  const targetKeys =
    Object.keys(targetMap);

  const result = [];

  orgList.forEach(function(org) {

    let targetCount = 0;
    let attendedCount = 0;

    targetKeys.forEach(function(statsKey) {

      const target =
        targetMap[statsKey] || {};

      const memberNo =
        normalizeMemberNoForStats_(
          target.memberNo
        );

      const personalId =
        String(target.personalId || "").trim();

      const checkin =
        checkinMap[statsKey] || null;

      const snapshotOrgIds =
        checkin
          ? splitStatsCsvText_(
              checkin.snapshotOrgIds || ""
            )
          : [];

      const belongs =
        org.csvImportMode === "全会員自動" ||
        (
          snapshotOrgIds.length > 0 &&
          snapshotOrgIds.indexOf(org.orgId) >= 0
        ) ||
        (
          snapshotOrgIds.length === 0 &&
          personalId &&
          personalOrgMap[personalId] &&
          personalOrgMap[personalId][org.orgId]
        ) ||
        (
          snapshotOrgIds.length === 0 &&
          !personalId &&
          memberOrgMap[memberNo] &&
          memberOrgMap[memberNo][org.orgId]
        );

      if (!belongs) {
        return;
      }

      targetCount++;

      if (checkinMap[statsKey]) {
        attendedCount++;
      }
    });

    if (targetCount === 0) {
      return;
    }

    result.push({
      orgId: org.orgId,
      name: org.orgName,
      targetCount: targetCount,
      attendedCount: attendedCount,
      attendanceRate: makeRateForStats_(
        attendedCount,
        targetCount
      )
    });
  });

  return result;
}

function getStatsDisplayOrgIdsForTraining_(
  training
) {

  const mode =
    String(training && training.statsOrgMode || "none").trim() || "none";

  if (mode === "target") {
    return splitStatsCsvText_(
      training.targetOrgIdsNew || ""
    );
  }

  if (mode === "custom") {
    return splitStatsCsvText_(
      training.statsOrgIds || ""
    );
  }

  return [];
}


function getMemberOrganizationMapForStats_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員所属");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      normalizeMemberNoForStats_(
        values[i][0]
      );

    const orgId =
      String(values[i][1] || "").trim();

    if (!memberNo || !orgId) {
      continue;
    }

    if (!map[memberNo]) {
      map[memberNo] = {};
    }

    map[memberNo][orgId] =
      true;
  }

  return map;
}


function makeRateForStats_(
  count,
  total
) {

  if (!total) {
    return "0.0%";
  }

  return (
    Math.round(
      count / total * 1000
    ) / 10
  ).toFixed(1) + "%";
}


function normalizeMemberNoForStats_(value) {

  return String(value || "")
    .replace(".0", "")
    .trim();
}

function saveTrainingStatsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    String(e.parameter.event || "").trim();

  let result;

  try {

    result =
      saveTrainingStats_(
        eventId
      );

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function saveTrainingStats_(eventId) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  const result =
    getTrainingStats_(
      eventId
    );

  if (!result.ok) {
    return result;
  }

  const stats =
    result.stats;

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("研修会集計");

    const headers = [
      "更新日時",
      "研修ID",
      "研修名",
      "対象人数",
      "送信成功",
      "対象内参加",
      "対象外参加",
      "参加者合計",
      "未参加人数",
      "参加率",
      "会場費",
      "講師費",
      "資料印刷費",
      "飲み物代",
      "その他費用",
      "費用合計"
    ];

  if (!sheet) {
    sheet =
      ss.insertSheet("研修会集計");

    sheet.appendRow(headers);
  }

  const values =
    sheet.getDataRange().getValues();

  const currentHeaders =
    values.length > 0
      ? values[0].map(function(h) {
          return String(h || "").trim();
        })
      : [];

  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      currentHeaders.push(header);
    }
  });

  const finalValues =
    sheet.getDataRange().getValues();

  const finalHeaders =
    finalValues[0].map(function(h) {
      return String(h || "").trim();
    });

  const col = {};

  finalHeaders.forEach(function(header, index) {
    col[header] =
      index + 1;
  });

  const venueCost =
    toNumberForStatsSave_(
      training.venueCost
    );

  const lecturerCost =
    toNumberForStatsSave_(
      training.lecturerCost
    );

  const printCost =
    toNumberForStatsSave_(
      training.printCost
    );

  const drinkCost =
    toNumberForStatsSave_(
      training.drinkCost
    );

  const otherCost =
    toNumberForStatsSave_(
      training.otherCost
    );

  const totalCost =
    venueCost +
    lecturerCost +
    printCost +
    drinkCost +
    otherCost;

  const rowValues =
    new Array(finalHeaders.length).fill("");

  rowValues[col["更新日時"] - 1] =
    new Date();

  rowValues[col["研修ID"] - 1] =
    stats.eventId;

  rowValues[col["研修名"] - 1] =
    stats.title;

  rowValues[col["対象人数"] - 1] =
    stats.targetCount;

  rowValues[col["送信成功"] - 1] =
    stats.sentCount;

  if (col["参加人数"]) {
    rowValues[col["参加人数"] - 1] =
      stats.attendedCount;
  }

  rowValues[col["対象内参加"] - 1] =
    stats.attendedCount;

  rowValues[col["対象外参加"] - 1] =
    stats.outsideAttendedCount || 0;

  rowValues[col["参加者合計"] - 1] =
    stats.totalAttendedCount || stats.attendedCount || 0;

  rowValues[col["未参加人数"] - 1] =
    stats.absentCount;

  rowValues[col["参加率"] - 1] =
    stats.attendanceRate;

  rowValues[col["会場費"] - 1] =
    venueCost;

  rowValues[col["講師費"] - 1] =
    lecturerCost;

  rowValues[col["資料印刷費"] - 1] =
    printCost;

  rowValues[col["飲み物代"] - 1] =
    drinkCost;

  rowValues[col["その他費用"] - 1] =
    otherCost;

  rowValues[col["費用合計"] - 1] =
    totalCost;

  for (let i = 1; i < finalValues.length; i++) {

    const rowEventId =
      String(finalValues[i][col["研修ID"] - 1] || "").trim();

    if (rowEventId === String(eventId).trim()) {

      sheet
        .getRange(
          i + 1,
          1,
          1,
          rowValues.length
        )
        .setValues([
          rowValues
        ]);

      return {
        ok: true,
        message: "集計を更新しました。",
        stats: stats,
        totalCost: totalCost
      };
    }
  }

  sheet.appendRow(
    rowValues
  );

  return {
    ok: true,
    message: "集計を保存しました。",
    stats: stats,
    totalCost: totalCost
  };
}


function toNumberForStatsSave_(value) {

  const n =
    Number(
      String(value || "")
        .replace(/,/g, "")
        .trim()
    );

  return isNaN(n)
    ? 0
    : n;
}

function getTrainingStatsSummariesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getTrainingStatsSummaries_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getTrainingStatsSummaries_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会集計");

  if (!sheet) {
    return {
      ok: true,
      summaries: {}
    };
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      summaries: {}
    };
  }

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  const col = {
    updatedAt: headers.indexOf("更新日時"),
    eventId: headers.indexOf("研修ID"),
    title: headers.indexOf("研修名"),
    targetCount: headers.indexOf("対象人数"),
    sentCount: headers.indexOf("送信成功"),
    attendedCount: headers.indexOf("対象内参加"),
    oldAttendedCount: headers.indexOf("参加人数"),
    outsideAttendedCount: headers.indexOf("対象外参加"),
    totalAttendedCount: headers.indexOf("参加者合計"),
    absentCount: headers.indexOf("未参加人数"),
    attendanceRate: headers.indexOf("参加率"),
    venueCost: headers.indexOf("会場費"),
    lecturerCost: headers.indexOf("講師費"),
    printCost: headers.indexOf("資料印刷費"),
    drinkCost: headers.indexOf("飲み物代"),
    otherCost: headers.indexOf("その他費用"),
    totalCost: headers.indexOf("費用合計")
  };

  const summaries = {};

  for (let i = 1; i < values.length; i++) {

    const eventId =
      col.eventId >= 0
        ? String(values[i][col.eventId] || "").trim()
        : "";

    if (!eventId) {
      continue;
    }

    summaries[eventId] = {
      updatedAt: col.updatedAt >= 0 ? formatDateTimeForClient_(values[i][col.updatedAt]) : "",
      eventId: eventId,
      title: col.title >= 0 ? String(values[i][col.title] || "").trim() : "",
      targetCount: col.targetCount >= 0 ? values[i][col.targetCount] || 0 : 0,
      sentCount: col.sentCount >= 0 ? values[i][col.sentCount] || 0 : 0,
      attendedCount:
        col.attendedCount >= 0
          ? values[i][col.attendedCount] || 0
          : col.oldAttendedCount >= 0
            ? values[i][col.oldAttendedCount] || 0
            : 0,

      outsideAttendedCount:
        col.outsideAttendedCount >= 0
          ? values[i][col.outsideAttendedCount] || 0
          : 0,

      totalAttendedCount:
        col.totalAttendedCount >= 0
          ? values[i][col.totalAttendedCount] || 0
          : col.attendedCount >= 0
            ? values[i][col.attendedCount] || 0
            : col.oldAttendedCount >= 0
              ? values[i][col.oldAttendedCount] || 0
              : 0,

      absentCount:
        col.absentCount >= 0
          ? values[i][col.absentCount] || 0
          : 0,

      attendanceRate:
        col.attendanceRate >= 0
          ? formatRateForStatsSummary_(values[i][col.attendanceRate])
          : "",
      venueCost: col.venueCost >= 0 ? values[i][col.venueCost] || 0 : 0,
      lecturerCost: col.lecturerCost >= 0 ? values[i][col.lecturerCost] || 0 : 0,
      printCost: col.printCost >= 0 ? values[i][col.printCost] || 0 : 0,
      drinkCost: col.drinkCost >= 0 ? values[i][col.drinkCost] || 0 : 0,
      otherCost: col.otherCost >= 0 ? values[i][col.otherCost] || 0 : 0,
      totalCost: col.totalCost >= 0 ? values[i][col.totalCost] || 0 : 0
    };
  }

  return {
    ok: true,
    summaries: summaries
  };
}

function formatRateForStatsSummary_(value) {

  if (value === "" || value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return (
      Math.round(value * 1000) / 10
    ).toFixed(1) + "%";
  }

  const text =
    String(value || "").trim();

  if (!text) {
    return "";
  }

  if (text.indexOf("%") !== -1) {
    return text;
  }

  const numberValue =
    Number(text);

  if (!isNaN(numberValue)) {
    return (
      Math.round(numberValue * 1000) / 10
    ).toFixed(1) + "%";
  }

  return text;
}

function getTrainingRecordsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getTrainingRecords_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getTrainingRecords_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    return {
      ok: true,
      records: []
    };
  }

  const summaryResult =
    getTrainingStatsSummaries_();

  const summaries =
    summaryResult.ok
      ? summaryResult.summaries || {}
      : {};

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      records: []
    };
  }

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  function col(name) {
    return headers.indexOf(name);
  }

  const venueMap =
    getVenueMasterMap_();

  const records = [];

  for (let i = 1; i < values.length; i++) {

    const eventId =
      String(values[i][col("研修ID")] || "").trim();

    if (!eventId) {
      continue;
    }

    const active =
      String(values[i][col("有効")] || "").toUpperCase();

    if (active === "FALSE") {
      continue;
    }

    const summary =
      summaries[eventId] || {};

    const venueId =
      col("会場ID") >= 0
        ? String(values[i][col("会場ID")] || "").trim()
        : "";

    const masterVenue =
      venueMap[venueId] || {};

    records.push({
      eventId: eventId,
      title: col("研修名") >= 0 ? values[i][col("研修名")] : "",
      hostType: col("主催区分") >= 0 ? values[i][col("主催区分")] : "",
      eventDate: col("開催日") >= 0 ? formatDateForClient_(values[i][col("開催日")]) : "",

      venueId: venueId,
      venueName: masterVenue.venueName || (col("会場名") >= 0 ? values[i][col("会場名")] : ""),
      venueAddress: masterVenue.venueAddress || (col("会場住所") >= 0 ? values[i][col("会場住所")] : ""),
      venueContactName: masterVenue.venueContactName || (col("会場担当者") >= 0 ? values[i][col("会場担当者")] : ""),
      venueContactPhone: masterVenue.venueContactPhone || (col("会場連絡先") >= 0 ? values[i][col("会場連絡先")] : ""),
      venueContactMail: masterVenue.venueContactMail || (col("会場メール") >= 0 ? values[i][col("会場メール")] : ""),
      venueUrl: masterVenue.venueUrl || (col("会場URL") >= 0 ? values[i][col("会場URL")] : ""),
      venueCapacity: masterVenue.venueCapacity || (col("会場定員") >= 0 ? values[i][col("会場定員")] : ""),
      startTime: col("開始時刻") >= 0 ? formatTimeForTrainingRecord_(values[i][col("開始時刻")]) : "",
      endTime: col("終了時刻") >= 0 ? formatTimeForTrainingRecord_(values[i][col("終了時刻")]) : "",
      lecturerName: col("講師名") >= 0 ? values[i][col("講師名")] : "",
      lecturerOrg: col("講師所属") >= 0 ? values[i][col("講師所属")] : "",
      lecturerContact: col("講師連絡先") >= 0 ? values[i][col("講師連絡先")] : "",
      venueCost: col("会場費") >= 0 ? values[i][col("会場費")] : "",
      venueFeeMemo: col("会場費メモ") >= 0 ? values[i][col("会場費メモ")] : "",
      lecturerCost: col("講師費") >= 0 ? values[i][col("講師費")] : "",
      printCost: col("資料印刷費") >= 0 ? values[i][col("資料印刷費")] : "",
      drinkCost: col("飲み物代") >= 0 ? values[i][col("飲み物代")] : "",
      otherCost: col("その他費用") >= 0 ? values[i][col("その他費用")] : "",
      costNote: col("費用備考") >= 0 ? values[i][col("費用備考")] : "",
      eventMemo: col("実施メモ") >= 0 ? values[i][col("実施メモ")] : "",

      targetCount: summary.targetCount || 0,
      attendedCount: summary.attendedCount || 0,
      outsideAttendedCount: summary.outsideAttendedCount || 0,
      totalAttendedCount: summary.totalAttendedCount || summary.attendedCount || 0,
      attendanceRate: summary.attendanceRate || "未集計",
      totalCost: summary.totalCost || 0,
      statsUpdatedAt: summary.updatedAt || ""
    });
  }

  records.sort(function(a, b) {
    return String(a.eventDate || "") < String(b.eventDate || "") ? 1 : -1;
  });

  return {
    ok: true,
    records: records
  };
}

function formatTimeForTrainingRecord_(value) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "HH:mm"
    );
  }

  const text =
    String(value || "").trim();

  if (!text) {
    return "";
  }

  if (text.indexOf("T") !== -1) {
    const date =
      new Date(text);

    if (!isNaN(date.getTime())) {
      return Utilities.formatDate(
        date,
        "Asia/Tokyo",
        "HH:mm"
      );
    }
  }

  return text;
}

function getTrainingTargetMembers_(training) {

  const members =
    typeof getMemberRowsForFastRead_ === "function"
      ? getMemberRowsForFastRead_()
      : getMemberRowsFromMaster_();

  const condition =
    getTrainingTargetCondition_(
      training
    );

  const targetOrgIds =
    condition.targetOrgIdsNew
      ? condition.targetOrgIdsNew
          .split(",")
          .map(function(v) {
            return String(v || "").trim();
          })
          .filter(function(v) {
            return v !== "";
          })
      : [];

  const orgMemberMap =
    targetOrgIds.length > 0
      ? getOrganizationMemberMap_(
          targetOrgIds
        )
      : {};

  const list = [];

  members.forEach(function(member) {

    if (!member.memberNo || !member.companyName) {
      return;
    }

    if (
      !isMemberMatchedTrainingCondition_(
        member,
        condition
      )
    ) {
      return;
    }

    if (
      targetOrgIds.length > 0 &&
      !orgMemberMap[member.memberNo]
    ) {
      return;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district
    });
  });

  return list;
}
