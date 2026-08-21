const CHECKIN_LOAD_TEST_EVENT_ID_ =
  "2026-020";

function getCheckinLoadTestTargetsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getCheckinLoadTestTargets_(
        e.parameter || {}
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

function checkCheckinLoadTestConsistencyJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      checkCheckinLoadTestConsistency_(
        e.parameter || {}
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

function resetCheckinLoadTestJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      resetCheckinLoadTest_(
        e.parameter || {}
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

function checkCheckinLoadTestLockJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      checkCheckinLoadTestLock_();
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

function getCheckinLoadTestTargets_(params) {

  assertCheckinLoadTestAllowed_();

  const eventId =
    String(params.event || CHECKIN_LOAD_TEST_EVENT_ID_).trim();

  if (eventId !== CHECKIN_LOAD_TEST_EVENT_ID_) {
    throw new Error("負荷試験対象は開発環境の2026-020のみです。");
  }

  const limit =
    Math.max(
      1,
      Math.min(
        Number(params.limit || 20) || 20,
        50
      )
    );

  const includeChecked =
    String(params.includeChecked || "").toUpperCase() === "TRUE";

  const targets =
    getCheckinLoadTestTargetCandidates_(
      eventId,
      Math.max(limit * 3, 60)
    );

  const selected = [];

  for (let i = 0; i < targets.length; i++) {
    const target =
      targets[i];

    if (!includeChecked && isCheckinLoadTestCheckedStatus_(target.status)) {
      continue;
    }

    const readValue =
      buildCheckinLoadTestReadValue_(
        target
      );

    if (!readValue) {
      continue;
    }

    selected.push({
      targetKey: target.targetKey || "",
      memberNo: target.memberNo || "",
      personalId: target.personalId || "",
      plannedId: target.plannedId || "",
      companyName: target.companyName || "",
      participantName: target.participantName || "",
      block: target.block || "",
      branch: target.branch || "",
      district: target.district || "",
      status: target.status || "",
      targetType: target.targetType || "",
      readValue: readValue
    });

    if (selected.length >= limit) {
      break;
    }
  }

  return {
    ok: true,
    eventId: eventId,
    targets: selected,
    count: selected.length,
    source: "受付索引",
    message: selected.length + "件の負荷試験候補を取得しました。"
  };
}

function getCheckinLoadTestTargetCandidates_(
  eventId,
  limit
) {

  const indexTargets =
    searchCheckinIndexMembers_(
      eventId,
      "",
      "",
      limit
    );

  if (
    indexTargets &&
    indexTargets.members &&
    indexTargets.members.length > 0
  ) {
    return indexTargets.members;
  }

  if (
    typeof isFirestoreEnabled_ === "function" &&
    isFirestoreEnabled_()
  ) {
    try {
      const firestoreTargets =
        getCheckinLoadTestFirestoreTargets_(
          eventId,
          limit
        );

      if (firestoreTargets && firestoreTargets.length > 0) {
        return firestoreTargets;
      }
    } catch (firestoreErr) {
    }
  }

  return [];
}

function getCheckinLoadTestFirestoreTargets_(
  eventId,
  limit
) {

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    "/targets?pageSize=" +
    encodeURIComponent(
      Math.max(
        1,
        Math.min(Number(limit || 60), 100)
      )
    );

  const response =
    firestoreFetch_(
      url,
      {
        method: "get",
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  if (code === 404) {
    return [];
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの受付対象を取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const data =
    JSON.parse(
      response.getContentText() || "{}"
    );

  return (data.documents || []).map(function(doc) {
    return firestoreTargetDocumentToMember_(
      doc
    );
  });
}

function checkCheckinLoadTestConsistency_(params) {

  assertCheckinLoadTestAllowed_();

  const eventId =
    String(params.event || CHECKIN_LOAD_TEST_EVENT_ID_).trim();

  if (eventId !== CHECKIN_LOAD_TEST_EVENT_ID_) {
    throw new Error("負荷試験対象は開発環境の2026-020のみです。");
  }

  const personalIds =
    String(params.personalIds || "")
      .split(",")
      .map(function(value) {
        return String(value || "").trim();
      })
      .filter(function(value) {
        return value !== "";
      });

  const targetMap = {};

  personalIds.forEach(function(personalId) {
    targetMap[personalId] = true;
  });

  const histories =
    getCheckinLoadTestHistories_(
      eventId
    );

  const completedMap = {};
  const checkedRows = [];
  const firestoreRows = [];
  let pendingSheetSyncCount = 0;
  let syncedSheetSyncCount = 0;
  let firestoreCheckError = "";

  personalIds.forEach(function(personalId) {

    const attendanceKey =
      makeFirestorePersonalAttendanceKey_(
        personalId
      );

    try {

      const key =
        getFirestoreCheckinKey_(
          eventId,
          attendanceKey
        );

      if (
        key &&
        isCheckinLoadTestCompletedResult_(
          key.status
        )
      ) {

        const sheetSyncStatus =
          String(key.sheetSyncStatus || "").trim();

        if (sheetSyncStatus === "PENDING") {
          pendingSheetSyncCount++;
        }

        if (sheetSyncStatus === "SYNCED") {
          syncedSheetSyncCount++;
        }

        firestoreRows.push({
          personalId: personalId,
          memberNo: key.memberNo || "",
          companyName: key.companyName || "",
          participantName: key.participantName || "",
          checkedAt: key.checkedAt || "",
          sheetSyncStatus: sheetSyncStatus || ""
        });
      }

    } catch (err) {

      if (!firestoreCheckError) {
        firestoreCheckError =
          err.message || String(err);
      }
    }
  });

  histories.forEach(function(history) {

    const personalId =
      String(history.personalId || "").trim();

    if (personalIds.length > 0 && !targetMap[personalId]) {
      return;
    }

    if (!isCheckinLoadTestCompletedResult_(history.result)) {
      return;
    }

    if (!completedMap[personalId]) {
      completedMap[personalId] = [];
    }

    completedMap[personalId].push(history);

    checkedRows.push({
      personalId: personalId,
      memberNo: history.memberNo || "",
      companyName: history.companyName || "",
      participantName: history.participantName || "",
      checkedAt: history.date || "",
      method: history.method || "",
      rowNo: history.rowNo || ""
    });
  });

  const duplicates = [];

  Object.keys(completedMap).forEach(function(personalId) {
    if (completedMap[personalId].length > 1) {
      duplicates.push({
        personalId: personalId,
        count: completedMap[personalId].length,
        rows: completedMap[personalId].map(function(history) {
          return history.rowNo || "";
        })
      });
    }
  });

  return {
    ok: true,
    eventId: eventId,
    checkedCount: checkedRows.length,
    firestoreCheckedCount: firestoreRows.length,
    pendingSheetSyncCount: pendingSheetSyncCount,
    syncedSheetSyncCount: syncedSheetSyncCount,
    firestoreCheckError: firestoreCheckError,
    duplicateCount: duplicates.length,
    duplicates: duplicates,
    firestoreRows: firestoreRows.slice(0, 50),
    rows: checkedRows.slice(0, 50),
    pass: duplicates.length === 0,
    message: duplicates.length === 0
      ? "二重受付は検出されませんでした。"
      : "同一個人IDの受付完了が複数あります。"
  };
}

function resetCheckinLoadTest_(params) {

  assertCheckinLoadTestAllowed_();

  const eventId =
    String(params.event || CHECKIN_LOAD_TEST_EVENT_ID_).trim();

  if (eventId !== CHECKIN_LOAD_TEST_EVENT_ID_) {
    throw new Error("リセット対象は開発環境の2026-020のみです。");
  }

  if (String(params.confirm || "") !== "RESET") {
    throw new Error("リセット確認がありません。");
  }

  const now =
    new Date();

  const resetResult =
    resetCheckinLoadTestHistories_(
      eventId,
      now
    );

  const indexResult =
    resetCheckinLoadTestIndex_(
      eventId,
      now
    );

  const firestoreResult =
    resetCheckinLoadTestFirestoreAll_(
      eventId,
      now
    );

  return {
    ok: true,
    eventId: eventId,
    resetHistories: resetResult.count,
    resetIndexRows: indexResult.count,
    resetFirestoreKeys: firestoreResult.keys,
    resetFirestoreHistories: firestoreResult.histories,
    resetFirestoreTargets: firestoreResult.targets,
    message:
      "受付結果をリセットしました。受付履歴 " +
      resetResult.count +
      "件、受付索引 " +
      indexResult.count +
      "件、Firestore " +
      firestoreResult.total +
      "件を未受付に戻しました。"
  };
}

function checkCheckinLoadTestLock_() {

  assertCheckinLoadTestAllowed_();

  const lock =
    LockService.getScriptLock();

  const start =
    new Date();

  try {

    lock.waitLock(1000);

    const elapsed =
      new Date().getTime() - start.getTime();

    return {
      ok: true,
      locked: false,
      elapsedMs: elapsed,
      message: "受付ロックは取得できます。負荷試験を実行できます。"
    };

  } catch (err) {

    const elapsed =
      new Date().getTime() - start.getTime();

    return {
      ok: true,
      locked: true,
      elapsedMs: elapsed,
      message: "受付ロックを取得できません。別の受付処理や索引処理が動いている可能性があります。"
    };

  } finally {

    try {
      lock.releaseLock();
    } catch (releaseErr) {
    }
  }
}

function resetCheckinLoadTestHistories_(
  eventId,
  updatedAt
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      count: 0
    };
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const values =
    sheet.getDataRange().getValues();

  let count =
    0;

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== eventId) {
      continue;
    }

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (!isCheckinLoadTestCompletedResult_(result)) {
      continue;
    }

    const rowNo =
      i + 1;

    const member =
      {
        memberNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
        personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
        plannedId: getCheckinLoadTestPlannedIdFromReadValue_(
          getCellByHeader_(row, headerMap, "読取値")
        ),
        companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
        participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
        mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
        block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
        branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
        district: String(getCellByHeader_(row, headerMap, "地区") || "").trim()
      };

    sheet
      .getRange(rowNo, headerMap["結果"] + 1)
      .setValue("負荷試験リセット");

    if (headerMap["備考"] !== undefined) {
      sheet
        .getRange(rowNo, headerMap["備考"] + 1)
        .setValue("負荷試験のため未受付へリセット: " + formatDateTimeForClient_(updatedAt));
    }

    resetCheckinLoadTestFirestoreStatus_(
      eventId,
      rowNo,
      member,
      updatedAt
    );

    count++;
  }

  return {
    count: count
  };
}

function resetCheckinLoadTestIndex_(
  eventId,
  updatedAt
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("受付索引");

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      count: 0
    };
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const values =
    sheet.getDataRange().getValues();

  let count =
    0;

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== eventId) {
      continue;
    }

    sheet.getRange(i + 1, headerMap["受付状態"] + 1).setValue("未受付");
    sheet.getRange(i + 1, headerMap["受付日時"] + 1).setValue("");
    sheet.getRange(i + 1, headerMap["受付方法"] + 1).setValue("");
    sheet.getRange(i + 1, headerMap["参加履歴行番号"] + 1).setValue("");

    if (headerMap["更新日時"] !== undefined) {
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(updatedAt);
    }

    count++;
  }

  return {
    count: count
  };
}

function resetCheckinLoadTestFirestoreStatus_(
  eventId,
  historyRowNo,
  member,
  updatedAt
) {

  if (
    typeof isFirestoreEnabled_ !== "function" ||
    !isFirestoreEnabled_() ||
    typeof writeFirestoreDocument_ !== "function"
  ) {
    return;
  }

  const attendanceKey =
    member.personalId
      ? makeFirestorePersonalAttendanceKey_(member.personalId)
      : (
          member.memberNo
            ? makeFirestoreMemberAttendanceKey_(member.memberNo)
            : ""
        );

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/checkins/" +
    encodeURIComponent(makeFirestoreDocumentId_(historyRowNo)),
    {
      result: "負荷試験リセット",
      note: "負荷試験のため未受付へリセット",
      updatedAt: updatedAt
    }
  );

  if (attendanceKey) {
    writeFirestoreDocument_(
      "trainings/" +
      encodeURIComponent(eventId) +
      "/checkinKeys/" +
      encodeURIComponent(makeFirestoreDocumentId_(attendanceKey)),
      {
        status: "未受付",
        historyRowNo: "",
        checkedAt: "",
        sheetSyncStatus: "",
        sheetSyncMessage: "負荷試験のため未受付へリセット",
        updatedAt: updatedAt
      }
    );
  }

  if (typeof syncCheckinIndexTargetToFirestore_ === "function") {
    syncCheckinIndexTargetToFirestore_(
      eventId,
      member,
      "対象者",
      "未受付",
      "",
      "",
      "",
      "負荷試験のため未受付へリセット",
      updatedAt
    );
  }
}

function resetCheckinLoadTestFirestoreAll_(
  eventId,
  updatedAt
) {

  const result =
    {
      keys: 0,
      histories: 0,
      targets: 0,
      total: 0
    };

  if (
    typeof isFirestoreEnabled_ !== "function" ||
    !isFirestoreEnabled_() ||
    typeof firestoreFetch_ !== "function" ||
    typeof writeFirestoreDocument_ !== "function"
  ) {
    return result;
  }

  const keyDocs =
    queryCheckinLoadTestFirestoreDocs_(
      eventId,
      "checkinKeys",
      "status",
      "受付済み",
      500
    );

  keyDocs.forEach(function(doc) {
    const path =
      getFirestoreRelativePathFromDocumentName_(
        doc.name
      );

    if (!path) {
      return;
    }

    writeFirestoreDocument_(
      path,
      {
        status: "未受付",
        historyRowNo: "",
        checkedAt: "",
        sheetSyncStatus: "RESET",
        sheetSyncMessage: "負荷試験のため未受付へリセット",
        updatedAt: updatedAt
      }
    );

    result.keys++;
  });

  const historyDocs =
    queryCheckinLoadTestFirestoreDocs_(
      eventId,
      "checkins",
      "result",
      "受付完了",
      500
    );

  historyDocs.forEach(function(doc) {
    const path =
      getFirestoreRelativePathFromDocumentName_(
        doc.name
      );

    if (!path) {
      return;
    }

    writeFirestoreDocument_(
      path,
      {
        result: "負荷試験リセット",
        note: "負荷試験のため未受付へリセット",
        updatedAt: updatedAt
      }
    );

    result.histories++;
  });

  const targetDocs =
    queryCheckinLoadTestFirestoreDocs_(
      eventId,
      "targets",
      "status",
      "受付済み",
      500
    );

  targetDocs.forEach(function(doc) {
    const path =
      getFirestoreRelativePathFromDocumentName_(
        doc.name
      );

    if (!path) {
      return;
    }

    writeFirestoreDocument_(
      path,
      {
        status: "未受付",
        checkedAt: "",
        method: "",
        historyRowNo: "",
        note: "負荷試験のため未受付へリセット",
        updatedAt: updatedAt
      }
    );

    result.targets++;
  });

  result.total =
    result.keys +
    result.histories +
    result.targets;

  return result;
}

function queryCheckinLoadTestFirestoreDocs_(
  eventId,
  collectionId,
  fieldPath,
  value,
  limit
) {

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    ":runQuery";

  const payload =
    {
      structuredQuery: {
        from: [
          {
            collectionId: collectionId
          }
        ],
        where: {
          fieldFilter: {
            field: {
              fieldPath: fieldPath
            },
            op: "EQUAL",
            value: {
              stringValue: value
            }
          }
        },
        limit: Math.max(
          1,
          Math.min(
            Number(limit || 100),
            500
          )
        )
      }
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  if (code === 404) {
    return [];
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの負荷試験リセット対象を取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const rows =
    JSON.parse(
      response.getContentText() || "[]"
    );

  const docs =
    [];

  rows.forEach(function(row) {
    if (row && row.document) {
      docs.push(row.document);
    }
  });

  return docs;
}

function getFirestoreRelativePathFromDocumentName_(
  name
) {

  name =
    String(name || "");

  const marker =
    "/documents/";

  const index =
    name.indexOf(marker);

  if (index < 0) {
    return "";
  }

  return name.slice(index + marker.length);
}

function getCheckinLoadTestPlannedIdFromReadValue_(
  readValue
) {

  const match =
    String(readValue || "").trim().match(/^PLANNED:(.+)$/);

  return match
    ? String(match[1] || "").trim()
    : "";
}

function getCheckinLoadTestHistories_(
  eventId
) {

  if (
    typeof isFirestoreEnabled_ === "function" &&
    isFirestoreEnabled_() &&
    typeof getFirestoreCheckinHistories_ === "function"
  ) {
    try {
      const firestoreHistories =
        getFirestoreCheckinHistories_(
          eventId
        );

      if (firestoreHistories) {
        return firestoreHistories;
      }
    } catch (firestoreErr) {
    }
  }

  return getCheckinHistory_(
    eventId,
    {
      limit: 500
    }
  ).histories || [];
}

function buildCheckinLoadTestReadValue_(
  target
) {

  if (target.personalId) {
    return "PERSONAL:" + target.personalId;
  }

  if (target.plannedId) {
    return "PLANNED:" + target.plannedId;
  }

  if (target.memberNo) {
    return "MEMBER:" + target.memberNo;
  }

  return "";
}

function isCheckinLoadTestCheckedStatus_(
  status
) {

  const text =
    String(status || "");

  return text.indexOf("受付済") !== -1 ||
    text.indexOf("受付完了") !== -1;
}

function isCheckinLoadTestCompletedResult_(
  result
) {

  const text =
    String(result || "");

  return text.indexOf("受付完了") !== -1 ||
    text.indexOf("受付済") !== -1;
}

function assertCheckinLoadTestAllowed_() {

  const projectId =
    typeof getFirestoreProjectId_ === "function"
      ? String(getFirestoreProjectId_() || "").trim()
      : "";

  const publicUrl =
    PropertiesService
      .getScriptProperties()
      .getProperty("PUBLIC_WEB_URL");

  if (
    projectId === "takken-training-demo" ||
    String(publicUrl || "").indexOf("takken-training-demo") !== -1
  ) {
    return;
  }

  throw new Error("受付負荷試験は開発環境専用です。本番環境では実行できません。");
}
