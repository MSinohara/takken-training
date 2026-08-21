function getCheckinHistoryJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const limit =
    Math.max(
      0,
      Math.min(
        Number(e.parameter.limit || 0) || 0,
        500
      )
    );

  let result;

  try {

    result =
      getCheckinHistory_(
        eventId,
        {
          limit: limit
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

function getCheckinMonitorJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const light =
    String(e.parameter.light || "").trim() === "1";

  const defaultLimit =
    light
      ? 30
      : 100;

  const limit =
    Math.max(
      0,
      Math.min(
        Number(e.parameter.limit || defaultLimit) || defaultLimit,
        300
      )
    );

  let result;

  try {

    result =
      getCheckinMonitor_(
        eventId,
        {
          light: light,
          limit: limit
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

function getCheckinTargetMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  let result;

  try {

    if (String(e.parameter.paged || "").trim() === "1") {
      result =
        getCheckinTargetMembersPaged_(
          eventId,
          e.parameter
        );
    } else {

      const filterOptions =
        getCheckinMonitorFilterOptions_(
          eventId
        );

      result = {
        ok: true,
        eventId: eventId,
        targetMembers:
          filterOptions && filterOptions.targetMembers
            ? filterOptions.targetMembers
            : [],
        filterOptions: filterOptions || {
          branches: [],
          districts: {},
          targetMembers: []
        }
      };
    }

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


function getCheckinTargetMembersPaged_(
  eventId,
  params
) {

  params =
    params || {};

  eventId =
    String(eventId || "").trim();

  const offset =
    Math.max(0, Number(params.offset || 0));

  const limit =
    Math.max(
      1,
      Math.min(
        Number(params.limit || 50),
        100
      )
    );

  const q =
    String(params.q || "").trim().toLowerCase();

  const branchFilter =
    String(params.branch || "").trim();

  const districtFilter =
    String(params.district || "").trim();

  const statusFilter =
    String(params.status || "").trim();

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDがありません。"
    };
  }

  const indexOptions =
    getCheckinMonitorFilterOptionsFromIndex_(
      eventId
    );

  const allMembers =
    indexOptions && indexOptions.targetMembers
      ? indexOptions.targetMembers
      : [];

  const filtered =
    allMembers.filter(function(member) {

      const status =
        String(member.status || "").trim();

      if (
        statusFilter === "checked" &&
        status !== "受付済み"
      ) {
        return false;
      }

      if (
        statusFilter === "absent" &&
        status === "受付済み"
      ) {
        return false;
      }

      if (branchFilter && member.branch !== branchFilter) {
        return false;
      }

      if (districtFilter && member.district !== districtFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack =
        [
          member.companyName,
          member.participantName,
          member.personalId,
          member.memberNo,
          member.branch,
          member.district
        ].join(" ").toLowerCase();

      return haystack.indexOf(q) !== -1;
    });

  const members =
    filtered.slice(
      offset,
      offset + limit
    );

  return {
    ok: true,
    eventId: eventId,
    targetMembers: members,
    total: filtered.length,
    offset: offset,
    limit: limit,
    hasMore: offset + members.length < filtered.length,
    filterOptions: {
      branches: indexOptions ? indexOptions.branches || [] : [],
      branchCounts: indexOptions ? indexOptions.branchCounts || {} : {},
      branchCheckedCounts: indexOptions ? indexOptions.branchCheckedCounts || {} : {},
      districts: indexOptions ? indexOptions.districts || {} : {},
      districtCounts: indexOptions ? indexOptions.districtCounts || {} : {},
      districtCheckedCounts: indexOptions ? indexOptions.districtCheckedCounts || {} : {},
      checkedTargetCount: indexOptions ? indexOptions.checkedTargetCount || 0 : 0,
      targetCount: indexOptions ? indexOptions.targetCount || 0 : 0
    }
  };
}

function getCheckinMonitor_(
  eventId,
  options
) {

  options =
    options || {};

  let firestoreHistories =
    null;

  if (shouldUseFirestoreForMonitor_()) {
    try {
      firestoreHistories =
        typeof getFirestoreRecentCheckinHistories_ === "function"
          ? getFirestoreRecentCheckinHistories_(
              eventId,
              30
            )
          : getFirestoreCheckinHistories_(
              eventId
            );
    } catch (firestoreErr) {
      firestoreHistories =
        null;
    }
  }

  if (firestoreHistories) {

    firestoreHistories =
      filterVisibleCheckinHistories_(
        firestoreHistories
      );

    if (
      firestoreHistories.length === 0 &&
      typeof getFirestoreRecentCheckinKeyHistories_ === "function"
    ) {
      try {
        firestoreHistories =
          filterVisibleCheckinHistories_(
            getFirestoreRecentCheckinKeyHistories_(
              eventId,
              30
            )
          );
      } catch (keyHistoryErr) {
      }
    }

    let filterOptions =
      {
        branches: [],
        districts: {}
      };

    let plannedSummary =
      {
        total: 0,
        checked: 0,
        unchecked: 0
      };

    if (!options.light) {

      try {
        filterOptions =
          getCheckinMonitorFilterOptions_(
            eventId
          );
      } catch (filterErr) {
      }

      try {
        plannedSummary =
          getPlannedAttendeeSummary_(
            eventId
          );
      } catch (plannedErr) {
      }

    } else {

      try {
        filterOptions =
          getCachedCheckinMonitorFilterOptions_(
            eventId
          ) || filterOptions;
      } catch (filterErr) {
      }
    }

    return {
      ok: true,
      light: !!options.light,
      histories: firestoreHistories,
      filterOptions: filterOptions,
      plannedSummary:
        options.light
          ? null
          : plannedSummary,
      source: "Firestore"
    };
  }

  return getCheckinHistory_(
    eventId,
    options
  );
}


function getCachedCheckinMonitorFilterOptions_(eventId) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return null;
  }

  const cache =
    CacheService.getScriptCache();

  const cacheKey =
    "MONITOR_FILTER_" + eventId;

  const cached =
    cache.get(cacheKey);

  if (!cached) {
    return null;
  }

  const options =
    JSON.parse(cached);

  if (options && options.targetMembers) {
    delete options.targetMembers;
  }

  return options;
}


function getCheckinHistory_(
  eventId,
  options
) {

  options =
    options || {};

  let firestoreHistories =
    null;

  if (shouldUseFirestoreForMonitor_()) {
    try {
      firestoreHistories =
        getFirestoreCheckinHistories_(
          eventId
        );
    } catch (firestoreErr) {
      firestoreHistories =
        null;
    }
  }

  if (
    firestoreHistories &&
    firestoreHistories.length > 0
  ) {
    firestoreHistories =
      filterVisibleCheckinHistories_(
        firestoreHistories
      );

    let filterOptions =
      {
        branches: [],
        districts: {}
      };

    let plannedSummary =
      {
        total: 0,
        checked: 0,
        unchecked: 0
      };

    try {

      filterOptions =
        getCheckinMonitorFilterOptions_(
          eventId
        );

    } catch (filterErr) {
    }

    try {

      plannedSummary =
        getPlannedAttendeeSummary_(
          eventId
        );

    } catch (plannedErr) {
    }

    return {
      ok: true,
      histories: firestoreHistories,
      filterOptions: filterOptions,
      plannedSummary: plannedSummary,
      source: "Firestore"
    };
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet) {
    return {
      ok: true,
      histories: [],
      filterOptions: getCheckinMonitorFilterOptions_(
        eventId
      )
    };
  }

  const histories = [];

  const rows =
    getCheckinHistoryRows_(
      sheet,
      eventId,
      options.limit
    );

  const trainingTitleMap =
    getTrainingTitleMapForCheckinHistory_(
      rows
    );

  const memberMap =
    eventId
      ? {}
      : getMemberMasterMapForCheckinHistory_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const filterOptions =
    getCheckinMonitorFilterOptions_(
      eventId
    );

  rows.forEach(function(item) {

    const rowEventId =
      String(item.row[1] || "").trim();

    const memberNo =
      String(item.row[4] || "").replace(".0", "").trim();

    const member =
      memberMap[memberNo] || {};

    const savedBlock =
      String(getCellByHeader_(item.row, headerMap, "ブロック") || "").trim();

    const savedBranch =
      String(getCellByHeader_(item.row, headerMap, "支部") || "").trim();

    const savedDistrict =
      String(getCellByHeader_(item.row, headerMap, "地区") || "").trim();

    const result =
      getCellByHeader_(item.row, headerMap, "結果") || item.row[6];

    if (!isVisibleCheckinHistoryResult_(result)) {
      return;
    }

    histories.push({
      rowNo: item.rowNo,
      date: formatDateTimeForClient_(item.row[0]),
      eventId: rowEventId,
      trainingTitle: trainingTitleMap[rowEventId] || "",
      method: item.row[2],
      readValue: item.row[3],
      memberNo: memberNo,
      companyName: item.row[5],
      receptionCategory: getCellByHeader_(item.row, headerMap, "受付区分") || "",
      verificationStatus: getCellByHeader_(item.row, headerMap, "照合状態") || "",
      attendanceUnit: getCellByHeader_(item.row, headerMap, "受付単位") || "",
      personalId: getCellByHeader_(item.row, headerMap, "個人ID") || "",
      participantName: getCellByHeader_(item.row, headerMap, "参加者名") || "",
      mail: getCellByHeader_(item.row, headerMap, "メール") || "",
      phone: getCellByHeader_(item.row, headerMap, "電話") || "",
      snapshotOrgIds: getCellByHeader_(item.row, headerMap, "受付時所属組織ID") || "",
      snapshotOrgNames: getCellByHeader_(item.row, headerMap, "受付時所属組織名") || "",
      block: savedBlock || member.block || "",
      branch: savedBranch || member.branch || "",
      district: savedDistrict || member.district || "",
      result: result,
      note: getCellByHeader_(item.row, headerMap, "備考") || item.row[7],
      canceledAt: formatDateTimeForClient_(getCellByHeader_(item.row, headerMap, "取消日時")),
      canceledBy: getCellByHeader_(item.row, headerMap, "取消者") || "",
      cancelReason: getCellByHeader_(item.row, headerMap, "取消理由") || "",
      restoredAt: formatDateTimeForClient_(getCellByHeader_(item.row, headerMap, "復活日時")),
      restoredBy: getCellByHeader_(item.row, headerMap, "復活者") || "",
      restoreReason: getCellByHeader_(item.row, headerMap, "復活理由") || ""
    });
  });

  histories.reverse();

  return {
    ok: true,
    histories: histories,
    filterOptions: filterOptions,
    plannedSummary: getPlannedAttendeeSummary_(eventId)
  };
}

function filterVisibleCheckinHistories_(
  histories
) {

  return (histories || []).filter(function(history) {
    return isVisibleCheckinHistoryResult_(
      history && history.result
    );
  });
}

function isVisibleCheckinHistoryResult_(
  result
) {

  return String(result || "").trim() !== "負荷試験リセット";
}


function getCheckinMonitorFilterOptions_(eventId) {

  const training =
    findTrainingById_(
      eventId
    );

  const indexOptions =
    getCheckinMonitorFilterOptionsFromIndex_(
      eventId
    );

  if (indexOptions) {
    return cacheCheckinMonitorFilterOptions_(
      eventId,
      indexOptions
    );
  }

  const firestoreOptions =
    shouldUseFirestoreForMonitor_()
      ? getCheckinMonitorFilterOptionsFromFirestoreTargets_(
          eventId
        )
      : null;

  if (firestoreOptions) {
    return cacheCheckinMonitorFilterOptions_(
      eventId,
      firestoreOptions
    );
  }

  if (!training) {
    return {
      branches: [],
      districts: {}
    };
  }

  const masterMembers =
    typeof getMemberRowsForFastRead_ === "function"
      ? getMemberRowsForFastRead_()
      : [];

  const members =
    typeof getCheckinIndexTargetMembers_ === "function"
      ? getCheckinIndexTargetMembers_(
          training,
          masterMembers
        )
      : getStatsTargetMembers_(
          training
        );

  return cacheCheckinMonitorFilterOptions_(
    eventId,
    buildCheckinMonitorFilterOptionsFromMembers_(
      members
    )
  );
}


function cacheCheckinMonitorFilterOptions_(
  eventId,
  options
) {

  if (!options) {
    return options;
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return options;
  }

  const cacheOptions =
    JSON.parse(
      JSON.stringify(options)
    );

  if (cacheOptions.targetMembers) {
    delete cacheOptions.targetMembers;
  }

  try {
    CacheService
      .getScriptCache()
      .put(
        "MONITOR_FILTER_" + eventId,
        JSON.stringify(cacheOptions),
        300
      );
  } catch (err) {
  }

  return options;
}

function shouldUseFirestoreForMonitor_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_MONITOR_ENABLED") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function buildCheckinMonitorFilterOptionsFromMembers_(members) {

  members =
    members || [];

  let memberMap = {};

  try {
    memberMap =
      getMemberMasterMapForCheckinHistory_();
  } catch (err) {
    memberMap =
      {};
  }

  members =
    members.map(function(member) {

      const memberNo =
        normalizeMemberNo_(
          member.memberNo || ""
        );

      const master =
        memberNo && memberMap[memberNo]
          ? memberMap[memberNo]
          : {};

      return {
        plannedId: member.plannedId || "",
        memberNo: memberNo,
        companyName: member.companyName || master.companyName || "",
        personalId: String(member.personalId || "").trim(),
        participantName: member.participantName || member.personName || "",
        personName: member.personName || member.participantName || "",
        mail: member.mail || master.mail || "",
        block: member.block || master.block || "",
        branch: member.branch || master.branch || "",
        district: member.district || master.district || "",
        receptionCategory: member.receptionCategory || "",
        targetType: member.targetType || "",
        status: member.status || "",
        checkedAt: member.checkedAt || "",
        method: member.method || "",
        historyRowNo: member.historyRowNo || "",
        note: member.note || ""
      };
    });

  const branchMap = {};
  const districtMap = {};
  const branchCounts = {};
  const districtCounts = {};
  const branchCheckedCounts = {};
  const districtCheckedCounts = {};
  let checkedTargetCount = 0;

  (members || []).forEach(function(member) {

    const branch =
      String(member.branch || "").trim();

    const district =
      String(member.district || "").trim();

    const isChecked =
      String(member.status || "").trim() === "受付済み";

    if (isChecked) {
      checkedTargetCount++;
    }

    if (!branch) {
      return;
    }

    branchMap[branch] =
      true;

    branchCounts[branch] =
      (branchCounts[branch] || 0) + 1;

    if (isChecked) {
      branchCheckedCounts[branch] =
        (branchCheckedCounts[branch] || 0) + 1;
    }

    if (!districtMap[branch]) {
      districtMap[branch] =
        {};
    }

    if (!districtCounts[branch]) {
      districtCounts[branch] =
        {};
    }

    if (!districtCheckedCounts[branch]) {
      districtCheckedCounts[branch] =
        {};
    }

    if (district) {
      districtMap[branch][district] =
        true;

      districtCounts[branch][district] =
        (districtCounts[branch][district] || 0) + 1;

      if (isChecked) {
        districtCheckedCounts[branch][district] =
          (districtCheckedCounts[branch][district] || 0) + 1;
      }
    }
  });

  const districts = {};

  Object.keys(districtMap).forEach(function(branch) {
    districts[branch] =
      Object.keys(districtMap[branch]).sort();
  });

  return {
    targetCount: members.length,
    checkedTargetCount: checkedTargetCount,
    branches: Object.keys(branchMap).sort(),
    branchCounts: branchCounts,
    branchCheckedCounts: branchCheckedCounts,
    districts: districts,
    districtCounts: districtCounts,
    districtCheckedCounts: districtCheckedCounts,
    targetMembersSource: "members",
    targetMembers: members.map(function(member) {
      return {
        plannedId: member.plannedId || "",
        memberNo: member.memberNo,
        companyName: member.companyName,
        personalId: member.personalId || "",
        participantName: member.participantName || member.personName || "",
        mail: member.mail || "",
        block: member.block || "",
        branch: member.branch,
        district: member.district,
        status: member.status || "",
        checkedAt: member.checkedAt || "",
        method: member.method || "",
        historyRowNo: member.historyRowNo || ""
      };
    })
  };
}

function getCheckinMonitorFilterOptionsFromFirestoreTargets_(eventId) {

  if (
    typeof getFirestoreCheckinTargets_ !== "function" ||
    !shouldUseFirestoreForMonitor_()
  ) {
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

  const targetMembers =
    targets.filter(function(item) {
      return isCheckinMonitorTargetType_(
        item.targetType
      );
    });

  if (targetMembers.length === 0) {
    return null;
  }

  return buildCheckinMonitorFilterOptionsFromMembers_(
    targetMembers
  );
}

function isCheckinMonitorTargetType_(targetType) {

  targetType =
    String(targetType || "").trim();

  if (!targetType) {
    return true;
  }

  if (
    targetType === "当日受付" ||
    targetType === "索引更新済み"
  ) {
    return false;
  }

  return true;
}

function getCheckinMonitorFilterOptionsFromIndex_(eventId) {

  const targetEventId =
    String(eventId || "").trim();

  if (!targetEventId) {
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

  const eventIdCol =
    headerMap["研修ID"];

  if (eventIdCol === undefined) {
    return null;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const branchMap = {};
  const districtMap = {};
  const branchCounts = {};
  const districtCounts = {};
  const branchCheckedCounts = {};
  const districtCheckedCounts = {};
  const targetMembers = [];
  let matchedRows = 0;
  let checkedTargetCount = 0;

  values.forEach(function(row) {

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== targetEventId) {
      return;
    }

    matchedRows++;

    const targetType =
      String(getCellByHeader_(row, headerMap, "対象区分") || "").trim();

    if (!isCheckinMonitorTargetType_(targetType)) {
      return;
    }

    const branch =
      String(getCellByHeader_(row, headerMap, "支部") || "").trim();

    const district =
      String(getCellByHeader_(row, headerMap, "地区") || "").trim();

    const status =
      String(getCellByHeader_(row, headerMap, "受付状態") || "").trim();

    const isChecked =
      status === "受付済み";

    if (isChecked) {
      checkedTargetCount++;
    }

    if (branch) {
      branchMap[branch] =
        true;

      branchCounts[branch] =
        (branchCounts[branch] || 0) + 1;

      if (isChecked) {
        branchCheckedCounts[branch] =
          (branchCheckedCounts[branch] || 0) + 1;
      }

      if (!districtMap[branch]) {
        districtMap[branch] =
          {};
      }

      if (!districtCounts[branch]) {
        districtCounts[branch] =
          {};
      }

      if (!districtCheckedCounts[branch]) {
        districtCheckedCounts[branch] =
          {};
      }

      if (district) {
        districtMap[branch][district] =
          true;

        districtCounts[branch][district] =
          (districtCounts[branch][district] || 0) + 1;

        if (isChecked) {
          districtCheckedCounts[branch][district] =
            (districtCheckedCounts[branch][district] || 0) + 1;
        }
      }
    }

    targetMembers.push({
      memberNo: normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      ),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
      branch: branch,
      district: district,
      status: status,
      checkedAt: getCellByHeader_(row, headerMap, "受付日時") || "",
      method: String(getCellByHeader_(row, headerMap, "受付方法") || "").trim(),
      historyRowNo: String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim()
    });
  });

  if (matchedRows === 0) {
    return null;
  }

  if (targetMembers.length === 0) {
    return null;
  }

  const districts = {};

  Object.keys(districtMap).forEach(function(branch) {
    districts[branch] =
      Object.keys(districtMap[branch]).sort();
  });

  return {
    targetCount: targetMembers.length,
    checkedTargetCount: checkedTargetCount,
    branches: Object.keys(branchMap).sort(),
    branchCounts: branchCounts,
    branchCheckedCounts: branchCheckedCounts,
    districts: districts,
    districtCounts: districtCounts,
    districtCheckedCounts: districtCheckedCounts,
    targetMembersSource: "index",
    targetMembers: targetMembers
  };
}


function getTrainingTitleMapForCheckinHistory_(rows) {

  const eventMap =
    {};

  rows.forEach(function(item) {

    const eventId =
      String(item.row[1] || "").trim();

    if (eventId) {
      eventMap[eventId] =
        true;
    }
  });

  const eventIds =
    Object.keys(eventMap);

  if (eventIds.length === 0) {
    return {};
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    return {};
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {};
  }

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  const eventIdCol =
    headers.indexOf("研修ID");

  const titleCol =
    headers.indexOf("研修名");

  if (eventIdCol < 0 || titleCol < 0) {
    return {};
  }

  const titleMap =
    {};

  for (let i = 1; i < values.length; i++) {

    const eventId =
      String(values[i][eventIdCol] || "").trim();

    if (eventMap[eventId]) {
      titleMap[eventId] =
        String(values[i][titleCol] || "").trim();
    }
  }

  return titleMap;
}


function getCheckinHistoryRows_(
  sheet,
  eventId,
  limit
) {

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const lastColumn =
    Math.max(sheet.getLastColumn(), 8);

  const targetEventId =
    String(eventId || "").trim();

  if (!targetEventId) {

    const maxRows =
      Math.max(
        0,
        Number(limit || 0) || 0
      );

    const rowCount =
      maxRows
        ? Math.min(
            lastRow - 1,
            maxRows
          )
        : lastRow - 1;

    const startRow =
      lastRow - rowCount + 1;

    return sheet
      .getRange(
        startRow,
        1,
        rowCount,
        lastColumn
      )
      .getValues()
      .map(function(row, index) {
        return {
          rowNo: startRow + index,
          row: row
        };
      });
  }

  const cells =
    sheet
      .getRange(
        2,
        2,
        lastRow - 1,
        1
      )
      .createTextFinder(targetEventId)
      .matchEntireCell(true)
      .findAll();

  const maxCells =
    Number(limit || 0) || cells.length;

  const limitedCells =
    cells.slice(
      Math.max(
        0,
        cells.length - maxCells
      )
    );

  return limitedCells.map(function(cell) {

    return {
      rowNo: cell.getRow(),
      row:
        sheet
          .getRange(
            cell.getRow(),
            1,
            1,
            lastColumn
          )
          .getValues()[0]
    };
  });
}

const CHECKIN_CONTROL_HEADERS_ = [
  "取消日時",
  "取消者",
  "取消理由",
  "復活日時",
  "復活者",
  "復活理由"
];

function ensureCheckinHistoryControlHeaders_(sheet) {

  const headers =
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(function(h) {
        return String(h || "").trim();
      });

  CHECKIN_CONTROL_HEADERS_.forEach(function(header) {

    if (headers.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function updateCheckinStatusJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      updateCheckinStatus_(e.parameter);

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

function updateCheckinStatus_(params) {

  const eventId =
    String(params.event || "").trim();

  const rowNo =
    Number(params.rowNo || 0);

  const mode =
    String(params.mode || "").trim();

  const reason =
    String(params.reason || "").trim();

  const operator =
    String(params.operator || "不明").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!rowNo || rowNo < 2) {
    throw new Error("対象行が不正です。");
  }

  if (!reason) {
    throw new Error("理由を選択してください。");
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet) {
    throw new Error("参加履歴シートがありません。");
  }

  ensureCheckinHistoryControlHeaders_(sheet);

  const headers =
    sheet.getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(function(h) {
        return String(h || "").trim();
      });

  const col = {};

  headers.forEach(function(header, index) {
    col[header] = index + 1;
  });

  const row =
    sheet.getRange(rowNo, 1, 1, sheet.getLastColumn())
      .getValues()[0];

  const rowEventId =
    String(row[col["研修ID"] - 1] || "").trim();

  if (rowEventId !== eventId) {
    throw new Error("研修IDが一致しません。画面を再読み込みしてください。");
  }

  const currentResult =
    String(row[col["結果"] - 1] || "").trim();

  const memberNo =
    normalizeMemberNo_(
      row[col["業者番号"] - 1]
    );

  const personalId =
    col["個人ID"]
      ? String(row[col["個人ID"] - 1] || "").trim()
      : "";

  const attendanceKey =
    personalId
      ? makeFirestorePersonalAttendanceKey_(
          personalId
        )
      : makeFirestoreMemberAttendanceKey_(
          memberNo
        );

  const historyMember = {
    memberNo: memberNo,
    personalId: personalId,
    companyName:
      col["会社名"]
        ? String(row[col["会社名"] - 1] || "").trim()
        : "",
    participantName:
      col["参加者名"]
        ? String(row[col["参加者名"] - 1] || "").trim()
        : "",
    mail:
      col["メール"]
        ? String(row[col["メール"] - 1] || "").trim()
        : "",
    block:
      col["ブロック"]
        ? String(row[col["ブロック"] - 1] || "").trim()
        : "",
    branch:
      col["支部"]
        ? String(row[col["支部"] - 1] || "").trim()
        : "",
    district:
      col["地区"]
        ? String(row[col["地区"] - 1] || "").trim()
        : ""
  };

  const checkinMethod =
    col["受付方法"]
      ? String(row[col["受付方法"] - 1] || "").trim()
      : "";

  const now =
    new Date();

  if (mode === "cancel") {

    if (currentResult !== "受付完了") {
      throw new Error("受付完了の履歴だけ取消できます。");
    }

    sheet.getRange(rowNo, col["結果"]).setValue("受付取消");
    sheet.getRange(rowNo, col["取消日時"]).setValue(now);
    sheet.getRange(rowNo, col["取消者"]).setValue(operator);
    sheet.getRange(rowNo, col["取消理由"]).setValue(reason);

    updateCheckinIndexStatusByHistoryRow_(
      eventId,
      memberNo,
      personalId,
      "cancel",
      rowNo
    );

    if (
      typeof shouldUseFirestoreForCheckinHistorySync_ === "function" &&
      shouldUseFirestoreForCheckinHistorySync_()
    ) {
      try {
        updateFirestoreCheckinStatus_(
          eventId,
          rowNo,
          attendanceKey,
          "cancel",
          reason,
          operator,
          now
        );
      } catch (firestoreErr) {
      }
    }

    if (
      typeof shouldUseFirestoreForCheckinIndex_ === "function" &&
      shouldUseFirestoreForCheckinIndex_() &&
      typeof syncCheckinIndexTargetToFirestore_ === "function"
    ) {
      try {
        syncCheckinIndexTargetToFirestore_(
          eventId,
          historyMember,
          "対象者",
          "取消済み",
          "",
          checkinMethod,
          rowNo,
          reason,
          now
        );
      } catch (firestoreTargetErr) {
      }
    }

    return {
      ok: true,
      message: "受付を取り消しました。"
    };
  }

  if (mode === "restore") {

    if (currentResult !== "受付取消") {
      throw new Error("受付取消の履歴だけ復活できます。");
    }

    sheet.getRange(rowNo, col["結果"]).setValue("受付完了");
    sheet.getRange(rowNo, col["復活日時"]).setValue(now);
    sheet.getRange(rowNo, col["復活者"]).setValue(operator);
    sheet.getRange(rowNo, col["復活理由"]).setValue(reason);

    updateCheckinIndexStatusByHistoryRow_(
      eventId,
      memberNo,
      personalId,
      "restore",
      rowNo
    );

    if (
      typeof shouldUseFirestoreForCheckinHistorySync_ === "function" &&
      shouldUseFirestoreForCheckinHistorySync_()
    ) {
      try {
        updateFirestoreCheckinStatus_(
          eventId,
          rowNo,
          attendanceKey,
          "restore",
          reason,
          operator,
          now
        );
      } catch (firestoreErr) {
      }
    }

    if (
      typeof shouldUseFirestoreForCheckinIndex_ === "function" &&
      shouldUseFirestoreForCheckinIndex_() &&
      typeof syncCheckinIndexTargetToFirestore_ === "function"
    ) {
      try {
        syncCheckinIndexTargetToFirestore_(
          eventId,
          historyMember,
          "対象者",
          "受付済み",
          now,
          checkinMethod,
          rowNo,
          "",
          now
        );
      } catch (firestoreTargetErr) {
      }
    }

    return {
      ok: true,
      message: "受付を復活しました。"
    };
  }

  throw new Error("処理区分が不正です。");
}


function formatDateTimeForClient_(value) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy/MM/dd HH:mm:ss"
    );
  }

  return String(value);
}

function getMemberMasterMapForCheckinHistory_() {

  const map = {};

  let members;

  try {

    members =
      typeof getMemberRowsForFastRead_ === "function"
        ? getMemberRowsForFastRead_()
        : getMemberRowsFromMaster_();

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
      branch: member.branch,
      district: member.district,
      block: member.block
    };
  });

  return map;
}
