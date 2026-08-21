const CHECKIN_INDEX_SHEET_NAME_ =
  "受付索引";

const CHECKIN_INDEX_TRIGGER_FUNCTION_ =
  "runDailyCheckinIndexBuild_";

const CHECKIN_INDEX_JOB_TRIGGER_FUNCTION_ =
  "runCheckinIndexJob_";

const CHECKIN_INDEX_JOB_SHEET_NAME_ =
  "受付索引ジョブ";

const CHECKIN_INDEX_JOB_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "ジョブID",
    "研修ID",
    "状態",
    "次開始位置",
    "処理単位",
    "対象件数",
    "処理済件数",
    "追加件数",
    "更新件数",
    "リセット済み",
    "再試行回数",
    "メッセージ",
    "エラー"
  ];

const CHECKIN_INDEX_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "研修ID",
    "受付キー",
    "予定者ID",
    "業者番号",
    "個人ID",
    "会社名",
    "参加者名",
    "メール",
    "ブロック",
    "支部",
    "地区",
    "対象区分",
    "受付状態",
    "受付日時",
    "受付方法",
    "参加履歴行番号",
    "備考"
  ];

function shouldUseFirestoreForCheckinIndex_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_CHECKIN_INDEX_SYNC") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function buildCheckinIndexJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    const eventId =
      String(e.parameter.event || "").trim();

    if (eventId) {
      result =
        buildCheckinIndexForEvent_(
          eventId
        );
    } else {
      result =
        buildTodayCheckinIndexes_();
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

function buildCheckinIndexChunkJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      buildCheckinIndexForEventChunk_(
        String(e.parameter.event || "").trim(),
        Number(e.parameter.offset || 0),
        Number(e.parameter.limit || 300),
        String(e.parameter.reset || "").toUpperCase() === "TRUE"
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

function startCheckinIndexJobJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      startCheckinIndexJob_(
        String(e.parameter.event || "").trim()
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

function getCheckinIndexJobStatusJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      getCheckinIndexJobStatus_(
        String(e.parameter.event || "").trim()
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

function searchCheckinIndexMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      searchCheckinIndexMembers_(
        String(e.parameter.event || "").trim(),
        String(e.parameter.keyword || "").trim(),
        String(e.parameter.branch || "").trim(),
        Number(e.parameter.limit || 50)
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

function searchCheckinIndexMembers_(
  eventId,
  keyword,
  branch,
  limit
) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return {
      ok: true,
      indexReady: false,
      members: [],
      message: "研修IDがありません。"
    };
  }

  if (
    shouldUseFirestoreForCheckinIndex_() &&
    typeof searchFirestoreCheckinTargets_ === "function"
  ) {
    try {
      const firestoreResult =
        searchFirestoreCheckinTargets_(
          eventId,
          keyword,
          branch,
          limit
        );

      if (
        firestoreResult &&
        firestoreResult.indexReady
      ) {
        return firestoreResult;
      }
    } catch (err) {
    }
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      ok: true,
      indexReady: false,
      members: [],
      message: "この研修会の受付索引がまだ作成されていません。"
    };
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const eventIdCol =
    headerMap["研修ID"];

  if (eventIdCol === undefined) {
    return {
      ok: true,
      indexReady: false,
      members: [],
      message: "受付索引に研修ID列がありません。"
    };
  }

  const eventCells =
    sheet
      .getRange(
        2,
        eventIdCol + 1,
        sheet.getLastRow() - 1,
        1
      )
      .createTextFinder(eventId)
      .matchEntireCell(true)
      .findAll();

  if (eventCells.length === 0) {
    return {
      ok: true,
      indexReady: false,
      members: [],
      count: 0,
      source: "受付索引"
    };
  }

  let startRow =
    eventCells[0].getRow();

  let endRow =
    eventCells[0].getRow();

  eventCells.forEach(function(cell) {

    const rowNo =
      cell.getRow();

    startRow =
      Math.min(
        startRow,
        rowNo
      );

    endRow =
      Math.max(
        endRow,
        rowNo
      );
  });

  const values =
    sheet
      .getRange(
        startRow,
        1,
        endRow - startRow + 1,
        sheet.getLastColumn()
      )
      .getValues();

  const key =
    normalizeCheckinIndexSearchText_(
      keyword
    );

  const branchKey =
    normalizeCheckinIndexBranchName_(
      branch
    );

  const max =
    Math.max(
      1,
      Math.min(
        Number(limit || 50),
        100
      )
    );

  const list = [];
  let eventRowCount = 0;

  for (let i = 0; i < values.length; i++) {

    const row =
      values[i];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== eventId) {
      continue;
    }

    const targetType =
      String(getCellByHeader_(row, headerMap, "対象区分") || "").trim();

    if (targetType === "索引更新済み") {
      continue;
    }

    eventRowCount++;

    const memberNo =
      normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    const personalId =
      String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();

    const plannedId =
      headerMap["予定者ID"] !== undefined
        ? String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim()
        : "";

    const companyName =
      String(getCellByHeader_(row, headerMap, "会社名") || "").trim();

    const participantName =
      String(getCellByHeader_(row, headerMap, "参加者名") || "").trim();

    const mail =
      String(getCellByHeader_(row, headerMap, "メール") || "").trim();

    const block =
      String(getCellByHeader_(row, headerMap, "ブロック") || "").trim();

    const rowBranch =
      String(getCellByHeader_(row, headerMap, "支部") || "").trim();

    const district =
      String(getCellByHeader_(row, headerMap, "地区") || "").trim();

    if (
      branchKey &&
      normalizeCheckinIndexBranchName_(
        rowBranch
      ) !== branchKey
    ) {
      continue;
    }

    const searchText =
      normalizeCheckinIndexSearchText_(
        [
          memberNo,
          personalId,
          plannedId,
          companyName,
          participantName,
          mail,
          block,
          rowBranch,
          district,
          targetType
        ].join(" ")
      );

    if (
      key &&
      searchText.indexOf(key) === -1
    ) {
      continue;
    }

    list.push({
      memberNo: memberNo,
      personalId: personalId,
      plannedId: plannedId,
      companyName: companyName,
      participantName: participantName,
      representativeName: participantName,
      mail: mail,
      block: block,
      branch: rowBranch,
      district: district,
      targetType: targetType,
      status: String(getCellByHeader_(row, headerMap, "受付状態") || "未受付"),
      checkedAt: formatDateTimeForClient_(
        getCellByHeader_(row, headerMap, "受付日時")
      ),
      method: String(getCellByHeader_(row, headerMap, "受付方法") || ""),
      source: "受付索引"
    });

    if (list.length >= max) {
      break;
    }
  }

  return {
    ok: true,
    indexReady: eventRowCount > 0,
    members: list,
    count: list.length,
    source: "受付索引"
  };
}

function normalizeCheckinIndexSearchText_(
  value
) {

  if (typeof normalizeFirestoreCheckinSearchText_ === "function") {
    return normalizeFirestoreCheckinSearchText_(
      value
    );
  }

  let text =
    String(value || "");

  if (text.normalize) {
    text =
      text.normalize("NFKC");
  }

  return text
    .replace(/株式会社/g, "株")
    .replace(/有限会社/g, "有")
    .replace(/[ 　\t\r\n]/g, "")
    .replace(/区支部/g, "支部")
    .replace(/第十ブロック/g, "第十")
    .replace(/斉/g, "斎")
    .replace(/髙/g, "高")
    .toLowerCase();
}

function normalizeCheckinIndexBranchName_(
  value
) {

  return String(value || "")
    .trim()
    .replace("杉並区支部", "杉並支部")
    .replace("中野区支部", "中野支部")
    .replace("世田谷区支部", "世田谷支部");
}

function startCheckinIndexJob_(
  eventId
) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const sheet =
    getOrCreateCheckinIndexJobSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const existing =
    getCheckinIndexJobByEvent_(
      sheet,
      headerMap,
      eventId
    );

  const now =
    new Date();

  let rowNo;
  let jobId;
  let offset = 0;
  let resetDone = "FALSE";
  let added = 0;
  let updated = 0;
  let targetCount = "";
  let message = "受付索引の更新を開始しました。";

  if (
    existing &&
    (
      existing.status === "実行待ち" ||
      existing.status === "実行中" ||
      existing.status === "失敗"
    )
  ) {
    rowNo =
      existing.rowNo;

    jobId =
      existing.jobId;

    offset =
      existing.offset;

    resetDone =
      existing.resetDone;

    added =
      existing.added;

    updated =
      existing.updated;

    targetCount =
      existing.targetCount || "";

    message =
      "受付索引の更新を続きから再開します。";
  } else {
    rowNo =
      existing ? existing.rowNo : sheet.getLastRow() + 1;

    jobId =
      Utilities.getUuid();
  }

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] =
    existing && existing.createdAt
      ? existing.createdAt
      : now;

  row[headerMap["更新日時"]] =
    now;

  row[headerMap["ジョブID"]] =
    jobId;

  row[headerMap["研修ID"]] =
    eventId;

  row[headerMap["状態"]] =
    "実行待ち";

  row[headerMap["次開始位置"]] =
    offset;

  row[headerMap["処理単位"]] =
    100;

  row[headerMap["対象件数"]] =
    targetCount;

  row[headerMap["処理済件数"]] =
    offset;

  row[headerMap["追加件数"]] =
    added;

  row[headerMap["更新件数"]] =
    updated;

  row[headerMap["リセット済み"]] =
    resetDone;

  row[headerMap["再試行回数"]] =
    0;

  row[headerMap["メッセージ"]] =
    message;

  row[headerMap["エラー"]] =
    "";

  sheet
    .getRange(
      rowNo,
      1,
      1,
      row.length
    )
    .setValues([
      row
    ]);

  scheduleCheckinIndexJobTrigger_();

  return getCheckinIndexJobStatus_(
    eventId
  );
}

function runCheckinIndexJob_() {

  processNextCheckinIndexJob_();
}

function authorizeCheckinIndexJobTrigger() {

  const triggers =
    ScriptApp.getProjectTriggers();

  return {
    ok: true,
    message: "受付索引の裏処理権限を確認しました。",
    triggerCount: triggers.length
  };
}

function processNextCheckinIndexJob_() {

  const sheet =
    getOrCreateCheckinIndexJobSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const job =
    getNextRunnableCheckinIndexJob_(
      sheet,
      headerMap
    );

  if (!job) {
    return {
      ok: true,
      message: "実行待ちの受付索引ジョブはありません。"
    };
  }

  const now =
    new Date();

  try {

    updateCheckinIndexJobColumns_(
      sheet,
      headerMap,
      job.rowNo,
      {
        "更新日時": now,
        "状態": "実行中",
        "メッセージ": "受付索引を更新中...",
        "エラー": ""
      }
    );

    const reset =
      String(job.resetDone || "").toUpperCase() !== "TRUE" &&
      Number(job.offset || 0) === 0;

    const result =
      buildCheckinIndexForEventChunk_(
        job.eventId,
        job.offset,
        job.limit || 300,
        reset
      );

    const nextOffset =
      Number(result.nextOffset || 0);

    const added =
      Number(job.added || 0) +
      Number(result.added || 0);

    const updated =
      Number(job.updated || 0) +
      Number(result.updated || 0);

    updateCheckinIndexJobColumns_(
      sheet,
      headerMap,
      job.rowNo,
      {
        "更新日時": new Date(),
        "状態": result.done ? "完了" : "実行待ち",
        "次開始位置": nextOffset,
        "対象件数": result.targetCount || "",
        "処理済件数": nextOffset,
        "追加件数": added,
        "更新件数": updated,
        "リセット済み": "TRUE",
        "再試行回数": 0,
        "メッセージ": result.message || "",
        "エラー": ""
      }
    );

    if (!result.done) {
      scheduleCheckinIndexJobTrigger_();
    }

    return {
      ok: true,
      result: result
    };

  } catch (err) {

    const retryCount =
      Number(job.retryCount || 0) + 1;

    const shouldRetry =
      retryCount <= 2;

    updateCheckinIndexJobColumns_(
      sheet,
      headerMap,
      job.rowNo,
      {
        "更新日時": new Date(),
        "状態": shouldRetry ? "実行待ち" : "失敗",
        "再試行回数": retryCount,
        "メッセージ": shouldRetry
          ? "一時的に失敗しました。同じ位置から再試行します。"
          : "受付索引の更新が途中で止まりました。もう一度押すと続きから再開します。",
        "エラー": err.message
      }
    );

    if (shouldRetry) {
      scheduleCheckinIndexJobTrigger_();
    }

    return {
      ok: false,
      message: err.message
    };
  }
}

function getCheckinIndexJobStatus_(
  eventId
) {

  const sheet =
    getOrCreateCheckinIndexJobSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const job =
    getCheckinIndexJobByEvent_(
      sheet,
      headerMap,
      eventId
    );

  if (!job) {
    return {
      ok: true,
      exists: false,
      message: "受付索引ジョブはありません。"
    };
  }

  return {
    ok: true,
    exists: true,
    jobId: job.jobId,
    eventId: job.eventId,
    status: job.status,
    offset: job.offset,
    limit: job.limit,
    targetCount: job.targetCount,
    processedCount: job.processedCount,
    added: job.added,
    updated: job.updated,
    retryCount: job.retryCount,
    message: job.message,
    error: job.error,
    updatedAt: formatDateTimeForClient_(job.updatedAt)
  };
}

function getOrCreateCheckinIndexJobSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_JOB_SHEET_NAME_
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        CHECKIN_INDEX_JOB_SHEET_NAME_
      );
  }

  ensureHeaders_(
    sheet,
    CHECKIN_INDEX_JOB_HEADERS_
  );

  return sheet;
}

function getCheckinIndexJobByEvent_(
  sheet,
  headerMap,
  eventId
) {

  const targetEventId =
    String(eventId || "").trim();

  if (!targetEventId || sheet.getLastRow() < 2) {
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

  let found = null;

  values.forEach(function(row, index) {

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId === targetEventId) {
      found =
        makeCheckinIndexJobObject_(
          row,
          headerMap,
          index + 2
        );
    }
  });

  return found;
}

function getNextRunnableCheckinIndexJob_(
  sheet,
  headerMap
) {

  if (sheet.getLastRow() < 2) {
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

  for (let i = 0; i < values.length; i++) {

    const status =
      String(getCellByHeader_(values[i], headerMap, "状態") || "").trim();

    if (status === "実行待ち" || status === "実行中") {
      return makeCheckinIndexJobObject_(
        values[i],
        headerMap,
        i + 2
      );
    }
  }

  return null;
}

function makeCheckinIndexJobObject_(
  row,
  headerMap,
  rowNo
) {

  return {
    rowNo: rowNo,
    createdAt: getCellByHeader_(row, headerMap, "作成日時"),
    updatedAt: getCellByHeader_(row, headerMap, "更新日時"),
    jobId: String(getCellByHeader_(row, headerMap, "ジョブID") || "").trim(),
    eventId: String(getCellByHeader_(row, headerMap, "研修ID") || "").trim(),
    status: String(getCellByHeader_(row, headerMap, "状態") || "").trim(),
    offset: Number(getCellByHeader_(row, headerMap, "次開始位置") || 0),
    limit: Number(getCellByHeader_(row, headerMap, "処理単位") || 100),
    targetCount: Number(getCellByHeader_(row, headerMap, "対象件数") || 0),
    processedCount: Number(getCellByHeader_(row, headerMap, "処理済件数") || 0),
    added: Number(getCellByHeader_(row, headerMap, "追加件数") || 0),
    updated: Number(getCellByHeader_(row, headerMap, "更新件数") || 0),
    resetDone: String(getCellByHeader_(row, headerMap, "リセット済み") || "").trim(),
    retryCount: Number(getCellByHeader_(row, headerMap, "再試行回数") || 0),
    message: String(getCellByHeader_(row, headerMap, "メッセージ") || "").trim(),
    error: String(getCellByHeader_(row, headerMap, "エラー") || "").trim()
  };
}

function updateCheckinIndexJobColumns_(
  sheet,
  headerMap,
  rowNo,
  values
) {

  Object.keys(values || {}).forEach(function(header) {
    if (headerMap[header] === undefined) {
      return;
    }

    sheet
      .getRange(
        rowNo,
        headerMap[header] + 1
      )
      .setValue(values[header]);
  });
}

function scheduleCheckinIndexJobTrigger_() {

  removeCheckinIndexJobTriggers_();

  ScriptApp
    .newTrigger(
      CHECKIN_INDEX_JOB_TRIGGER_FUNCTION_
    )
    .timeBased()
    .after(30 * 1000)
    .create();
}

function removeCheckinIndexJobTriggers_() {

  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (trigger.getHandlerFunction() === CHECKIN_INDEX_JOB_TRIGGER_FUNCTION_) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    });
}


function runDailyCheckinIndexBuild_() {

  buildTodayCheckinIndexes_();
}


function buildTodayCheckinIndexes_() {

  const today =
    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy/MM/dd"
    );

  const trainings =
    getActiveTrainings();

  let built =
    0;

  let added =
    0;

  let updated =
    0;

  trainings.forEach(function(training) {

    const eventDate =
      normalizeCheckinIndexDateText_(
        training.eventDate
      );

    if (eventDate !== today) {
      return;
    }

    const result =
      buildCheckinIndexForEvent_(
        training.eventId
      );

    if (result.ok) {
      built++;
      added += result.added || 0;
      updated += result.updated || 0;
    }
  });

  return {
    ok: true,
    message:
      "本日開催の研修会 " +
      built +
      "件の受付索引を更新しました。",
    built: built,
    added: added,
    updated: updated
  };
}


function buildCheckinIndexForEvent_(eventId) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const targetCondition =
    typeof getTrainingTargetCondition_ === "function"
      ? getTrainingTargetCondition_(
          training
        )
      : {};

  const masterMembers =
    typeof getMemberRowsFromMaster_ === "function"
      ? getMemberRowsFromMaster_()
      : [];

  const masterCount =
    masterMembers.length;

  const masterBlockSummary =
    masterMembers.length
      ? makeCheckinIndexMasterBlockSummary_(
          masterMembers
        )
      : "";

  const targetMembers =
    getCheckinIndexTargetMembers_(
      training,
      masterMembers
    );

  const linkedTargetCount =
    targetMembers.filter(function(member) {
      return !!(
        normalizeMemberNo_(member.memberNo || "") ||
        String(member.personalId || "").trim()
      );
    }).length;

  const sheet =
    getOrCreateCheckinIndexSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const existingMap =
    getCheckinIndexRowsByEvent_(
      sheet,
      headerMap,
      eventId
    );

  const historyMap =
    getCheckinHistoryMapForCheckinIndex_(
      eventId
    );

  const now =
    new Date();

  let added =
    0;

  let updated =
    0;

  const rowUpdates =
    [];

  const rowsToAppend =
    [];

  const firestoreTargetItems =
    [];

  const targetKeyMap =
    {};

  ensureCheckinIndexBuildMarker_(
    sheet,
    headerMap,
    existingMap,
    eventId,
    now,
    "完了"
  );

  targetMembers.forEach(function(member) {

    const key =
      makeCheckinIndexKey_(
        member
      );

    if (!key) {
      return;
    }

    targetKeyMap[key] =
      true;

    const existing =
      existingMap[key];

    const history =
      historyMap[key];

    const memberTargetType =
      member.targetType || "対象者";

    if (existing) {

      existing.targetFound =
        true;

      const row =
        updateCheckinIndexMemberColumnsInRow_(
          existing.row.slice(),
          headerMap,
          member,
          memberTargetType,
          now
        );

      if (history) {
        row[headerMap["受付状態"]] =
          "受付済み";

        row[headerMap["受付日時"]] =
          history.checkedAt || "";

        row[headerMap["受付方法"]] =
          history.method || "";

        row[headerMap["参加履歴行番号"]] =
          history.historyRowNo || "";

        row[headerMap["備考"]] =
          "";
      }

      rowUpdates.push({
        rowNo: existing.rowNo,
        row: row
      });

      firestoreTargetItems.push({
        member: member,
        targetType: memberTargetType,
        status: history ? "受付済み" : String(existing.status || "未受付"),
        checkedAt: history ? history.checkedAt : "",
        method: history ? history.method : "",
        historyRowNo: history ? history.historyRowNo : "",
        note: "",
        updatedAt: now
      });

      updated++;
      return;
    }

    rowsToAppend.push(
      makeCheckinIndexRow_(
        sheet,
        headerMap,
        eventId,
        member,
        memberTargetType,
        history ? "受付済み" : "未受付",
        history ? history.checkedAt : "",
        history ? history.method : "",
        history ? history.historyRowNo : "",
        "",
        now
      )
    );

    added++;

    firestoreTargetItems.push({
      member: member,
      targetType: memberTargetType,
      status: history ? "受付済み" : "未受付",
      checkedAt: history ? history.checkedAt : "",
      method: history ? history.method : "",
      historyRowNo: history ? history.historyRowNo : "",
      note: "",
      updatedAt: now
    });
  });

  Object.keys(existingMap).forEach(function(key) {

    const existing =
      existingMap[key];

    if (existing.targetFound) {
      return;
    }

    const history =
      historyMap[key];

    if (existing.status === "受付済み") {
      return;
    }

    const row =
      existing.row.slice();

    row[headerMap["対象区分"]] =
      history ? "当日受付" : "対象外";

    row[headerMap["更新日時"]] =
      now;

    if (history) {
      row[headerMap["受付状態"]] =
        "受付済み";

      row[headerMap["受付日時"]] =
        history.checkedAt || "";

      row[headerMap["受付方法"]] =
        history.method || "";

      row[headerMap["参加履歴行番号"]] =
        history.historyRowNo || "";

      row[headerMap["備考"]] =
        "";
    }

    rowUpdates.push({
      rowNo: existing.rowNo,
      row: row
    });

    firestoreTargetItems.push({
      member: {
        plannedId:
          headerMap["予定者ID"] !== undefined
            ? getCellByHeader_(row, headerMap, "予定者ID")
            : "",
        memberNo: getCellByHeader_(row, headerMap, "業者番号"),
        personalId:
          headerMap["個人ID"] !== undefined
            ? getCellByHeader_(row, headerMap, "個人ID")
            : "",
        companyName: getCellByHeader_(row, headerMap, "会社名"),
        participantName:
          headerMap["参加者名"] !== undefined
            ? getCellByHeader_(row, headerMap, "参加者名")
            : "",
        mail:
          headerMap["メール"] !== undefined
            ? getCellByHeader_(row, headerMap, "メール")
            : "",
        block: getCellByHeader_(row, headerMap, "ブロック"),
        branch: getCellByHeader_(row, headerMap, "支部"),
        district: getCellByHeader_(row, headerMap, "地区")
      },
      targetType: row[headerMap["対象区分"]],
      status: row[headerMap["受付状態"]],
      checkedAt: row[headerMap["受付日時"]],
      method: row[headerMap["受付方法"]],
      historyRowNo: row[headerMap["参加履歴行番号"]],
      note:
        headerMap["備考"] !== undefined
          ? row[headerMap["備考"]]
          : "",
      updatedAt: now
    });
  });

  Object.keys(historyMap).forEach(function(key) {

    if (targetKeyMap[key] || existingMap[key]) {
      return;
    }

    const history =
      historyMap[key];

    rowsToAppend.push(
      makeCheckinIndexRow_(
        sheet,
        headerMap,
        eventId,
        history.member,
        "当日受付",
        "受付済み",
        history.checkedAt,
        history.method,
        history.historyRowNo,
        "",
        now
      )
    );

    firestoreTargetItems.push({
      member: history.member,
      targetType: "当日受付",
      status: "受付済み",
      checkedAt: history.checkedAt,
      method: history.method,
      historyRowNo: history.historyRowNo,
      note: "",
      updatedAt: now
    });
  });

  setCheckinIndexRowsInBatches_(
    sheet,
    rowUpdates
  );

  if (rowsToAppend.length) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        sheet.getLastColumn()
      )
      .setValues(
        rowsToAppend
      );
  }

  let firestoreSynced =
    0;

  if (
    shouldUseFirestoreForCheckinIndex_() &&
    typeof syncCheckinIndexTargetsToFirestore_ === "function" &&
    firestoreTargetItems.length > 0 &&
    firestoreTargetItems.length <= 120
  ) {
    firestoreSynced =
      syncCheckinIndexTargetsToFirestore_(
        eventId,
        firestoreTargetItems
      ).count || 0;
  }

  return {
    ok: true,
    message:
      "受付索引を更新しました。対象者 " +
      targetMembers.length +
      "件、追加 " +
      added +
      "件、更新 " +
      updated +
      "件。" +
      " 条件: ブロック=" +
      (targetCondition.targetBlock || "指定なし") +
      " / 支部=" +
      (targetCondition.targetBranch || "指定なし") +
      " / 地区=" +
      (targetCondition.targetDistrict || "指定なし") +
      " / 組織=" +
      (targetCondition.targetOrgIdsNew || "指定なし") +
      " / 会員マスタ=" +
      masterCount +
      "件" +
      (masterBlockSummary ? " / マスタ内ブロック=" + masterBlockSummary : "") +
      "。",
    eventId: eventId,
    targetCount: targetMembers.length,
    added: added,
    updated: updated,
    firestoreSynced: firestoreSynced,
    targetCondition: targetCondition,
    masterCount: masterCount,
    masterBlockSummary: masterBlockSummary
  };
}

function buildCheckinIndexForEventChunk_(
  eventId,
  offset,
  limit,
  reset
) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  offset =
    Math.max(0, Number(offset || 0));

  limit =
    Math.max(1, Math.min(Number(limit || 300), 400));

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const targetCondition =
    typeof getTrainingTargetCondition_ === "function"
      ? getTrainingTargetCondition_(
          training
        )
      : {};

  const masterMembers =
    typeof getMemberRowsFromMaster_ === "function"
      ? getMemberRowsFromMaster_()
      : [];

  const targetMembers =
    getCheckinIndexTargetMembers_(
      training,
      masterMembers
    );

  const sheet =
    getOrCreateCheckinIndexSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  if (reset) {
    clearCheckinIndexRowsForEvent_(
      sheet,
      headerMap,
      eventId
    );

    if (
      shouldUseFirestoreForCheckinIndex_() &&
      typeof clearFirestoreCheckinTargets_ === "function"
    ) {
      try {
        clearFirestoreCheckinTargets_(
          eventId
        );
      } catch (err) {
      }
    }
  }

  const historyMap =
    getCheckinHistoryMapForCheckinIndex_(
      eventId
    );

  const now =
    new Date();

  const chunkMembers =
    targetMembers.slice(
      offset,
      offset + limit
    );

  let added = 0;
  const rowsToAppend = [];
  const firestoreTargetItems = [];
  const targetKeyMap = {};

  updateCheckinIndexBuildMarkerBySearch_(
    sheet,
    headerMap,
    eventId,
    now,
    "作成中"
  );

  chunkMembers.forEach(function(member) {

    const key =
      makeCheckinIndexKey_(
        member
      );

    if (!key) {
      return;
    }

    const history =
      historyMap[key];

    targetKeyMap[key] =
      true;

    const memberTargetType =
      member.targetType || "対象者";

    rowsToAppend.push(
      makeCheckinIndexRow_(
        sheet,
        headerMap,
        eventId,
        member,
        memberTargetType,
        history ? "受付済み" : "未受付",
        history ? history.checkedAt : "",
        history ? history.method : "",
        history ? history.historyRowNo : "",
        "",
        now
      )
    );

    added++;

    firestoreTargetItems.push({
      member: member,
      targetType: memberTargetType,
      status: history ? "受付済み" : "未受付",
      checkedAt: history ? history.checkedAt : "",
      method: history ? history.method : "",
      historyRowNo: history ? history.historyRowNo : "",
      note: "",
      updatedAt: now
    });
  });

  const nextOffset =
    offset + chunkMembers.length;

  const done =
    nextOffset >= targetMembers.length;

  updateCheckinIndexBuildMarkerBySearch_(
    sheet,
    headerMap,
    eventId,
    now,
    done ? "完了" : "作成中"
  );

  if (done) {

    targetMembers.forEach(function(member) {
      const key =
        makeCheckinIndexKey_(
          member
        );

      if (key) {
        targetKeyMap[key] =
          true;
      }
    });

    Object.keys(historyMap).forEach(function(key) {

      if (targetKeyMap[key]) {
        return;
      }

      const history =
        historyMap[key];

      rowsToAppend.push(
        makeCheckinIndexRow_(
          sheet,
          headerMap,
          eventId,
          history.member,
          "当日受付",
          "受付済み",
          history.checkedAt,
          history.method,
          history.historyRowNo,
          "",
          now
        )
      );

      firestoreTargetItems.push({
        member: history.member,
        targetType: "当日受付",
        status: "受付済み",
        checkedAt: history.checkedAt,
        method: history.method,
        historyRowNo: history.historyRowNo,
        note: "",
        updatedAt: now
      });
    });
  }

  if (rowsToAppend.length) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rowsToAppend.length,
        sheet.getLastColumn()
      )
      .setValues(
        rowsToAppend
      );
  }

  let firestoreSynced =
    0;

  if (
    shouldUseFirestoreForCheckinIndex_() &&
    typeof syncCheckinIndexTargetsToFirestore_ === "function" &&
    firestoreTargetItems.length > 0
  ) {
    firestoreSynced =
      syncCheckinIndexTargetsToFirestore_(
        eventId,
        firestoreTargetItems
      ).count || 0;
  }

  return {
    ok: true,
    eventId: eventId,
    targetCount: targetMembers.length,
    added: added,
    updated: 0,
    firestoreSynced: firestoreSynced,
    offset: offset,
    nextOffset: nextOffset,
    limit: limit,
    done: done,
    message:
      done
        ? "受付索引を更新しました。対象者 " +
          targetMembers.length +
          "件。条件: ブロック=" +
          (targetCondition.targetBlock || "指定なし") +
          " / 支部=" +
          (targetCondition.targetBranch || "指定なし") +
          " / 地区=" +
          (targetCondition.targetDistrict || "指定なし") +
          " / 会員マスタ=" +
          masterMembers.length +
          "件。"
        : "受付索引を更新中... " +
          nextOffset +
          " / " +
          targetMembers.length +
          "件"
  };
}

function clearCheckinIndexRowsForEvent_(
  sheet,
  headerMap,
  eventId
) {

  if (!sheet || sheet.getLastRow() < 2) {
    return;
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

  const keptRows =
    values.filter(function(row) {
      return String(getCellByHeader_(row, headerMap, "研修ID") || "").trim() !== eventId;
    });

  sheet
    .getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    )
    .clearContent();

  if (keptRows.length) {
    sheet
      .getRange(
        2,
        1,
        keptRows.length,
        sheet.getLastColumn()
      )
      .setValues(
        keptRows
      );
  }
}

function makeCheckinIndexMasterBlockSummary_(
  members
) {

  const countMap = {};

  (members || []).forEach(function(member) {
    const block =
      String(member.block || "空欄").trim() || "空欄";

    if (!countMap[block]) {
      countMap[block] =
        0;
    }

    countMap[block]++;
  });

  return Object.keys(countMap)
    .sort(function(a, b) {
      return countMap[b] - countMap[a];
    })
    .slice(0, 3)
    .map(function(block) {
      return block + ":" + countMap[block] + "件";
    })
    .join(", ");
}

function getCheckinIndexTargetMembers_(
  training,
  masterMembers
) {

  if (
    String(training && training.checkinTargetMode || "").trim() ===
    "事前申込者のみ"
  ) {
    return getPlannedAttendeesAsCheckinIndexTargets_(
      training
    );
  }

  if (
    String(training && training.attendanceUnit || "会社").trim() === "個人" &&
    typeof getStatsTargetMembers_ === "function"
  ) {
    return getStatsTargetMembers_(
      training
    );
  }

  const condition =
    typeof getTrainingTargetCondition_ === "function"
      ? getTrainingTargetCondition_(
          training
        )
      : {
          targetBlock: "",
          targetBranch: "",
          targetDistrict: "",
          targetOrgIdsNew: ""
        };

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
    targetOrgIds.length > 0 &&
    typeof getOrganizationMemberMap_ === "function"
      ? getOrganizationMemberMap_(
          targetOrgIds
        )
      : {};

  const list = [];

  (masterMembers || []).forEach(function(member) {

    if (!member.memberNo || !member.companyName) {
      return;
    }

    if (
      typeof isMemberMatchedTrainingCondition_ === "function" &&
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

function getPlannedAttendeesAsCheckinIndexTargets_(
  training
) {

  const eventId =
    String(training && training.eventId || "").trim();

  if (!eventId || typeof getPlannedAttendeesForEvent_ !== "function") {
    return [];
  }

  const attendees =
    getPlannedAttendeesForEvent_(
      eventId
    );

  const memberMap =
    typeof getMemberMasterMapForCheckinHistory_ === "function"
      ? getMemberMasterMapForCheckinHistory_()
      : {};

  const personalLookup =
    makePlannedAttendeePersonalLookup_();

  return attendees
    .filter(function(item) {
      return !!String(item.plannedId || "").trim();
    })
    .map(function(item) {
      let memberNo =
        normalizeMemberNo_(item.memberNo || "");

      let personalId =
        String(item.personalId || "").trim();

      const matchedPersonal =
        !memberNo || !personalId
          ? findPersonalForPlannedAttendee_(
              personalLookup,
              item.companyName,
              item.participantName
            )
          : null;

      if (matchedPersonal) {
        memberNo =
          memberNo ||
          normalizeMemberNo_(
            matchedPersonal.memberNo || ""
          );

        personalId =
          personalId ||
          String(matchedPersonal.personalId || "").trim();
      }

      const master =
        memberNo && memberMap[memberNo]
          ? memberMap[memberNo]
          : {};

      return {
        plannedId: String(item.plannedId || "").trim(),
        memberNo: memberNo,
        personalId: personalId,
        companyName:
          item.companyName ||
          matchedPersonal && matchedPersonal.companyName ||
          master.companyName ||
          item.participantName ||
          "",
        participantName:
          item.participantName ||
          matchedPersonal && matchedPersonal.personName ||
          "",
        personName:
          item.participantName ||
          matchedPersonal && matchedPersonal.personName ||
          "",
        mail:
          item.mail ||
          matchedPersonal && matchedPersonal.mail ||
          master.mail ||
          "",
        block:
          item.block ||
          matchedPersonal && matchedPersonal.block ||
          master.block ||
          "",
        branch:
          item.branch ||
          matchedPersonal && matchedPersonal.branch ||
          master.branch ||
          "",
        district:
          item.district ||
          matchedPersonal && matchedPersonal.district ||
          master.district ||
          "",
        receptionCategory: item.receptionCategory || "",
        targetType:
          item.receptionCategory === "事前申込者"
            ? "事前申込者"
            : "事前申込者:" + (item.receptionCategory || "予定者"),
        status: item.status || "未受付",
        checkedAt: item.checkedAt || "",
        method: item.status === "受付済み" ? "予定者受付" : "",
        historyRowNo: item.historyRowNo || "",
        note: item.note || ""
      };
    });
}

function makePlannedAttendeePersonalLookup_() {

  const lookup = {
    byCompanyAndName: {}
  };

  if (typeof getPersonalMembers_ !== "function") {
    return lookup;
  }

  let members = [];

  try {
    members =
      getPersonalMembers_(
        {}
      ).members || [];
  } catch (err) {
    return lookup;
  }

  members.forEach(function(member) {

    if (
      String(member.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return;
    }

    const companyKey =
      normalizePlannedAttendeeCompanyKey_(
        member.companyName
      );

    const nameKey =
      normalizePlannedAttendeeNameKey_(
        member.personName
      );

    if (!companyKey || !nameKey) {
      return;
    }

    const key =
      companyKey + "\t" + nameKey;

    if (!lookup.byCompanyAndName[key]) {
      lookup.byCompanyAndName[key] =
        member;
      return;
    }

    lookup.byCompanyAndName[key] =
      {
        ambiguous: true
      };
  });

  return lookup;
}

function findPersonalForPlannedAttendee_(
  lookup,
  companyName,
  participantName
) {

  const companyKey =
    normalizePlannedAttendeeCompanyKey_(
      companyName
    );

  const nameKey =
    normalizePlannedAttendeeNameKey_(
      participantName
    );

  if (!companyKey || !nameKey) {
    return null;
  }

  const found =
    lookup &&
    lookup.byCompanyAndName
      ? lookup.byCompanyAndName[companyKey + "\t" + nameKey]
      : null;

  if (!found || found.ambiguous) {
    return null;
  }

  return found;
}

function normalizePlannedAttendeeCompanyKey_(
  value
) {

  let text =
    String(value || "");

  if (text.normalize) {
    text =
      text.normalize("NFKC");
  }

  return text
    .replace(/\(株\)|㈱/g, "株")
    .replace(/\(有\)|㈲/g, "有")
    .replace(/株式会社/g, "株")
    .replace(/有限会社/g, "有")
    .replace(/[ 　\t\r\n]/g, "")
    .toLowerCase();
}

function normalizePlannedAttendeeNameKey_(
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
    .replace(/髙/g, "高")
    .replace(/﨑/g, "崎")
    .replace(/斉/g, "斎")
    .toLowerCase();
}

function debugCheckinTargetJsonp_(
  e
) {

  try {
    return jsonpOutput_(
      e,
      debugCheckinTarget_(
        String(e.parameter.event || "").trim()
      )
    );
  } catch (err) {
    return jsonpOutput_(
      e,
      {
        ok: false,
        message: err.message
      }
    );
  }
}

function debugCheckinTarget_(
  eventId
) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const condition =
    typeof getTrainingTargetCondition_ === "function"
      ? getTrainingTargetCondition_(
          training
        )
      : {
          targetBlock: "",
          targetBranch: "",
          targetDistrict: "",
          targetOrgIdsNew: ""
        };

  const masterMembers =
    typeof getMemberRowsForFastRead_ === "function"
      ? getMemberRowsForFastRead_()
      : getMemberRowsFromMaster_();

  const conditionMatched =
    [];

  (masterMembers || []).forEach(function(member) {

    if (
      typeof isMemberMatchedTrainingCondition_ === "function" &&
      !isMemberMatchedTrainingCondition_(
        member,
        condition
      )
    ) {
      return;
    }

    conditionMatched.push(
      member
    );
  });

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
    targetOrgIds.length > 0 &&
    typeof getOrganizationMemberMap_ === "function"
      ? getOrganizationMemberMap_(
          targetOrgIds
        )
      : {};

  const orgMatched =
    targetOrgIds.length > 0
      ? conditionMatched.filter(function(member) {
          return !!orgMemberMap[member.memberNo];
        })
      : conditionMatched;

  const targetMembers =
    getCheckinIndexTargetMembers_(
      training,
      masterMembers
    );

  let firestoreCount = null;
  let firestoreTargetCount = null;

  try {
    if (
      shouldUseFirestoreForCheckinIndex_() &&
      typeof getFirestoreCheckinTargets_ === "function"
    ) {
      const firestoreTargets =
        getFirestoreCheckinTargets_(
          eventId
        ) || [];

      firestoreCount =
        firestoreTargets.length;

      firestoreTargetCount =
        firestoreTargets.filter(function(item) {
          return typeof isCheckinMonitorTargetType_ === "function"
            ? isCheckinMonitorTargetType_(item.targetType)
            : true;
        }).length;
    }
  } catch (err) {
    firestoreCount =
      "取得エラー: " + err.message;
  }

  const indexInfo =
    debugCheckinIndexRowsForEvent_(
      eventId
    );

  const linkedTargetCount =
    targetMembers.filter(function(member) {
      return !!(
        normalizeMemberNo_(member.memberNo || "") ||
        String(member.personalId || "").trim()
      );
    }).length;

  return {
    ok: true,
    eventId: eventId,
    training: {
      title: training.title || "",
      hostType: training.hostType || "",
      attendanceUnit: training.attendanceUnit || "",
      checkinTargetMode: training.checkinTargetMode || "",
      targetBlock: training.targetBlock || "",
      targetBranch: training.targetBranch || "",
      targetDistrict: training.targetDistrict || "",
      targetOrgIdsNew: training.targetOrgIdsNew || ""
    },
    condition: condition,
    masterCount: masterMembers.length,
    conditionMatchedCount: conditionMatched.length,
    targetOrgIds: targetOrgIds,
    orgMemberCount: Object.keys(orgMemberMap || {}).length,
    afterOrgMatchedCount: orgMatched.length,
    finalTargetCount: targetMembers.length,
    linkedTargetCount: linkedTargetCount,
    firestoreCount: firestoreCount,
    firestoreTargetCount: firestoreTargetCount,
    indexInfo: indexInfo,
    samples: targetMembers.slice(0, 10).map(function(member) {
      return {
        memberNo: member.memberNo || "",
        companyName: member.companyName || "",
        personalId: member.personalId || "",
        participantName: member.participantName || member.personName || "",
        block: member.block || "",
        branch: member.branch || "",
        district: member.district || "",
        targetType: member.targetType || ""
      };
    })
  };
}

function debugCheckinIndexRowsForEvent_(
  eventId
) {

  const sheet =
    getOrCreateCheckinIndexSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  if (sheet.getLastRow() < 2) {
    return {
      matchedRows: 0,
      targetRows: 0,
      types: {}
    };
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

  let matchedRows = 0;
  let targetRows = 0;
  const types = {};

  values.forEach(function(row) {

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== eventId) {
      return;
    }

    matchedRows++;

    const targetType =
      String(getCellByHeader_(row, headerMap, "対象区分") || "").trim();

    types[targetType || "空欄"] =
      (types[targetType || "空欄"] || 0) + 1;

    if (
      typeof isCheckinMonitorTargetType_ !== "function" ||
      isCheckinMonitorTargetType_(targetType)
    ) {
      targetRows++;
    }
  });

  return {
    matchedRows: matchedRows,
    targetRows: targetRows,
    types: types
  };
}


function ensureCheckinIndexBuildMarker_(
  sheet,
  headerMap,
  existingMap,
  eventId,
  now,
  buildStatus
) {

  const markerKey =
    "__INDEX_BUILT__:" + eventId;

  const existing =
    existingMap[markerKey];

  if (existing) {
    existing.targetFound =
      true;

    sheet
      .getRange(
        existing.rowNo,
        headerMap["更新日時"] + 1
      )
      .setValue(now);

    sheet
      .getRange(
        existing.rowNo,
        headerMap["対象区分"] + 1
      )
      .setValue("索引更新済み");

    if (headerMap["備考"] !== undefined) {
      sheet
        .getRange(
          existing.rowNo,
          headerMap["備考"] + 1
        )
        .setValue(
          buildStatus === "完了"
            ? "索引更新完了"
            : "索引更新中"
        );
    }

    return;
  }

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] =
    now;

  row[headerMap["更新日時"]] =
    now;

  row[headerMap["研修ID"]] =
    eventId;

  if (headerMap["受付キー"] !== undefined) {
    row[headerMap["受付キー"]] =
      markerKey;
  }

  row[headerMap["対象区分"]] =
    "索引更新済み";

  row[headerMap["備考"]] =
    buildStatus === "完了"
      ? "索引更新完了"
      : "索引更新中";

  sheet.appendRow(row);
}

function updateCheckinIndexBuildMarkerBySearch_(
  sheet,
  headerMap,
  eventId,
  now,
  buildStatus
) {

  const markerKey =
    "__INDEX_BUILT__:" + eventId;

  const keyCol =
    headerMap["受付キー"];

  let markerRowNo =
    0;

  if (keyCol !== undefined && sheet.getLastRow() >= 2) {
    const cells =
      sheet
        .getRange(
          2,
          keyCol + 1,
          sheet.getLastRow() - 1,
          1
        )
        .createTextFinder(
          markerKey
        )
        .matchEntireCell(true)
        .findAll();

    if (cells.length > 0) {
      markerRowNo =
        cells[0].getRow();
    }
  }

  const note =
    buildStatus === "完了"
      ? "索引更新完了"
      : "索引更新中";

  if (markerRowNo) {
    sheet
      .getRange(
        markerRowNo,
        headerMap["更新日時"] + 1
      )
      .setValue(now);

    sheet
      .getRange(
        markerRowNo,
        headerMap["対象区分"] + 1
      )
      .setValue("索引更新済み");

    if (headerMap["備考"] !== undefined) {
      sheet
        .getRange(
          markerRowNo,
          headerMap["備考"] + 1
        )
        .setValue(note);
    }

    return;
  }

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] =
    now;

  row[headerMap["更新日時"]] =
    now;

  row[headerMap["研修ID"]] =
    eventId;

  if (headerMap["受付キー"] !== undefined) {
    row[headerMap["受付キー"]] =
      markerKey;
  }

  row[headerMap["対象区分"]] =
    "索引更新済み";

  if (headerMap["備考"] !== undefined) {
    row[headerMap["備考"]] =
      note;
  }

  sheet.appendRow(row);
}


function getOrCreateCheckinIndexSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        CHECKIN_INDEX_SHEET_NAME_
      );
  }

  ensureHeaders_(
    sheet,
    CHECKIN_INDEX_HEADERS_
  );

  return sheet;
}


function makeCheckinIndexKey_(
  member
) {

  const plannedId =
    String(member && member.plannedId || "").trim();

  if (plannedId) {
    return "PLANNED:" + plannedId;
  }

  const personalId =
    String(member && member.personalId || "").trim();

  if (personalId) {
    return "P:" + personalId;
  }

  const memberNo =
    normalizeMemberNo_(
      member && member.memberNo
    );

  return memberNo
    ? "M:" + memberNo
    : "";
}


function makeCheckinIndexKeyFromRow_(
  row,
  headerMap
) {

  const existingKey =
    headerMap["受付キー"] !== undefined
      ? String(getCellByHeader_(row, headerMap, "受付キー") || "").trim()
      : "";

  if (existingKey) {
    return existingKey;
  }

  const personalId =
    headerMap["個人ID"] !== undefined
      ? String(getCellByHeader_(row, headerMap, "個人ID") || "").trim()
      : "";

  if (personalId) {
    return "P:" + personalId;
  }

  const plannedId =
    headerMap["予定者ID"] !== undefined
      ? String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim()
      : "";

  if (plannedId) {
    return "PLANNED:" + plannedId;
  }

  const memberNo =
    normalizeMemberNo_(
      getCellByHeader_(row, headerMap, "業者番号")
    );

  return memberNo
    ? "M:" + memberNo
    : "";
}


function getCheckinIndexRowsByEvent_(sheet, headerMap, eventId) {

  const lastRow =
    sheet.getLastRow();

  const map = {};

  if (lastRow < 2) {
    return map;
  }

  const eventIdCol =
    headerMap["研修ID"];

  if (eventIdCol === undefined) {
    return map;
  }

  const cells =
    sheet
      .getRange(
        2,
        eventIdCol + 1,
        lastRow - 1,
        1
      )
      .createTextFinder(
        String(eventId || "").trim()
      )
      .matchEntireCell(true)
      .findAll();

  if (!cells || cells.length === 0) {
    return map;
  }

  const rowNos =
    cells
      .map(function(cell) {
        return cell.getRow();
      })
      .sort(function(a, b) {
        return a - b;
      });

  const lastCol =
    sheet.getLastColumn();

  let groupStart =
    rowNos[0];

  let previousRow =
    rowNos[0];

  function readGroup(startRow, endRow) {

    const values =
      sheet
        .getRange(
          startRow,
          1,
          endRow - startRow + 1,
          lastCol
        )
        .getValues();

    values.forEach(function(row, index) {

      const rowNo =
        startRow + index;

      const key =
        makeCheckinIndexKeyFromRow_(
          row,
          headerMap
        );

      if (!key) {
        return;
      }

      map[key] = {
        rowNo: rowNo,
        row: row,
        status: String(getCellByHeader_(row, headerMap, "受付状態") || "").trim(),
        targetFound: false
      };
    });
  }

  rowNos.slice(1).forEach(function(rowNo) {

    if (rowNo === previousRow + 1) {
      previousRow =
        rowNo;
      return;
    }

    readGroup(
      groupStart,
      previousRow
    );

    groupStart =
      rowNo;

    previousRow =
      rowNo;
  });

  readGroup(
    groupStart,
    previousRow
  );

  return map;
}

function getCheckinHistoryMapForCheckinIndex_(
  eventId
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  const map = {};

  if (!sheet || sheet.getLastRow() < 2) {
    return map;
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const eventIdCol =
    headerMap["研修ID"];

  if (eventIdCol === undefined) {
    return map;
  }

  const eventCells =
    sheet
      .getRange(
        2,
        eventIdCol + 1,
        sheet.getLastRow() - 1,
        1
      )
      .createTextFinder(
        String(eventId || "").trim()
      )
      .matchEntireCell(true)
      .findAll();

  eventCells.forEach(function(cell) {

    const rowNo =
      cell.getRow();

    const row =
      sheet
        .getRange(
          rowNo,
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId !== String(eventId || "").trim() ||
      result !== "受付完了"
    ) {
      return;
    }

    const readValue =
      String(getCellByHeader_(row, headerMap, "読取値") || "").trim();

    const plannedMatch =
      readValue.match(/^PLANNED:(.+)$/);

    const member = {
      plannedId: plannedMatch
        ? String(plannedMatch[1] || "").trim()
        : "",
      memberNo: normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      ),
      personalId:
        headerMap["個人ID"] !== undefined
          ? String(getCellByHeader_(row, headerMap, "個人ID") || "").trim()
          : "",
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      participantName:
        headerMap["参加者名"] !== undefined
          ? String(getCellByHeader_(row, headerMap, "参加者名") || "").trim()
          : "",
      mail:
        headerMap["メール"] !== undefined
          ? String(getCellByHeader_(row, headerMap, "メール") || "").trim()
          : "",
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      district: String(getCellByHeader_(row, headerMap, "地区") || "").trim()
    };

    const key =
      makeCheckinIndexKey_(
        member
      );

    if (!key) {
      return;
    }

    map[key] = {
      member: member,
      checkedAt: getCellByHeader_(row, headerMap, "日時"),
      method: String(getCellByHeader_(row, headerMap, "受付方法") || "").trim(),
      historyRowNo: String(rowNo)
    };
  });

  return map;
}


function updateCheckinIndexMemberColumns_(
  sheet,
  headerMap,
  rowNo,
  member,
  targetType,
  now
) {

  const values = {
    "更新日時": now,
    "受付キー": makeCheckinIndexKey_(member),
    "予定者ID": member.plannedId || "",
    "個人ID": member.personalId || "",
    "会社名": member.companyName || "",
    "参加者名": member.participantName || member.personName || "",
    "メール": member.mail || "",
    "ブロック": member.block || "",
    "支部": member.branch || "",
    "地区": member.district || "",
    "対象区分": targetType
  };

  Object.keys(values).forEach(function(header) {
    sheet
      .getRange(
        rowNo,
        headerMap[header] + 1
      )
      .setValue(values[header]);
  });
}

function updateCheckinIndexMemberColumnsInRow_(
  row,
  headerMap,
  member,
  targetType,
  now
) {

  const values = {
    "更新日時": now,
    "受付キー": makeCheckinIndexKey_(member),
    "予定者ID": member.plannedId || "",
    "個人ID": member.personalId || "",
    "会社名": member.companyName || "",
    "参加者名": member.participantName || member.personName || "",
    "メール": member.mail || "",
    "ブロック": member.block || "",
    "支部": member.branch || "",
    "地区": member.district || "",
    "対象区分": targetType
  };

  Object.keys(values).forEach(function(header) {
    if (headerMap[header] !== undefined) {
      row[headerMap[header]] =
        values[header];
    }
  });

  return row;
}

function setCheckinIndexRowsInBatches_(
  sheet,
  updates
) {

  if (!updates.length) {
    return;
  }

  updates.sort(function(a, b) {
    return a.rowNo - b.rowNo;
  });

  let groupStartRow =
    updates[0].rowNo;

  let groupRows =
    [updates[0].row];

  let previousRowNo =
    updates[0].rowNo;

  for (let i = 1; i < updates.length; i++) {

    const item =
      updates[i];

    if (item.rowNo === previousRowNo + 1) {
      groupRows.push(
        item.row
      );
      previousRowNo =
        item.rowNo;
      continue;
    }

    sheet
      .getRange(
        groupStartRow,
        1,
        groupRows.length,
        sheet.getLastColumn()
      )
      .setValues(
        groupRows
      );

    groupStartRow =
      item.rowNo;

    groupRows =
      [item.row];

    previousRowNo =
      item.rowNo;
  }

  sheet
    .getRange(
      groupStartRow,
      1,
      groupRows.length,
      sheet.getLastColumn()
    )
    .setValues(
      groupRows
    );
}

function makeCheckinIndexRow_(
  sheet,
  headerMap,
  eventId,
  member,
  targetType,
  status,
  checkedAt,
  method,
  historyRowNo,
  note,
  now
) {

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] =
    now;

  row[headerMap["更新日時"]] =
    now;

  row[headerMap["研修ID"]] =
    eventId;

  if (headerMap["受付キー"] !== undefined) {
    row[headerMap["受付キー"]] =
      makeCheckinIndexKey_(
        member
      );
  }

  if (headerMap["予定者ID"] !== undefined) {
    row[headerMap["予定者ID"]] =
      member.plannedId || "";
  }

  row[headerMap["業者番号"]] =
    normalizeMemberNo_(
      member.memberNo
    );

  if (headerMap["個人ID"] !== undefined) {
    row[headerMap["個人ID"]] =
      member.personalId || "";
  }

  row[headerMap["会社名"]] =
    member.companyName || "";

  if (headerMap["参加者名"] !== undefined) {
    row[headerMap["参加者名"]] =
      member.participantName || member.personName || "";
  }

  row[headerMap["メール"]] =
    member.mail || "";

  row[headerMap["ブロック"]] =
    member.block || "";

  row[headerMap["支部"]] =
    member.branch || "";

  row[headerMap["地区"]] =
    member.district || "";

  row[headerMap["対象区分"]] =
    targetType || "";

  row[headerMap["受付状態"]] =
    status || "未受付";

  row[headerMap["受付日時"]] =
    checkedAt || "";

  row[headerMap["受付方法"]] =
    method || "";

  row[headerMap["参加履歴行番号"]] =
    historyRowNo || "";

  row[headerMap["備考"]] =
    note || "";

  return row;
}


function appendCheckinIndexRow_(
  sheet,
  headerMap,
  eventId,
  member,
  targetType,
  status,
  checkedAt,
  method,
  historyRowNo,
  note,
  now
) {

  const row =
    makeCheckinIndexRow_(
      sheet,
      headerMap,
      eventId,
      member,
      targetType,
      status,
      checkedAt,
      method,
      historyRowNo,
      note,
      now
    );

  sheet.appendRow(row);
}


function getCheckinIndexEntry_(eventId, memberNo, personalId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }

  const headerMap =
    getHeaderMap_(sheet);

  const key =
    makeCheckinIndexKey_(
      {
        memberNo: memberNo,
        personalId: personalId
      }
    );

  const keyCol =
    headerMap["受付キー"];

  let cells = [];

  if (key && keyCol !== undefined && keyCol >= 0) {
    cells =
      sheet
        .getRange(
          2,
          keyCol + 1,
          sheet.getLastRow() - 1,
          1
        )
        .createTextFinder(
          key
        )
        .matchEntireCell(true)
        .findAll();
  }

  if (cells.length === 0) {

    const memberNoCol =
      headerMap["業者番号"];

    if (memberNoCol === undefined || memberNoCol < 0) {
      return null;
    }

    cells =
      sheet
        .getRange(
          2,
          memberNoCol + 1,
          sheet.getLastRow() - 1,
          1
        )
        .createTextFinder(
          normalizeMemberNo_(memberNo)
        )
        .matchEntireCell(true)
        .findAll();
  }

  for (let i = cells.length - 1; i >= 0; i--) {

    const rowNo =
      cells[i].getRow();

    const row =
      sheet
        .getRange(
          rowNo,
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== String(eventId || "").trim()) {
      continue;
    }

    return makeCheckinIndexEntryObject_(
      row,
      headerMap,
      rowNo,
      rowEventId
    );
  }

  return null;
}

function getCheckinIndexEntryByRow_(
  eventId,
  rowNo
) {

  rowNo =
    Number(rowNo || 0);

  if (rowNo < 2) {
    return null;
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet || sheet.getLastRow() < rowNo) {
    return null;
  }

  const headerMap =
    getHeaderMap_(sheet);

  const row =
    sheet
      .getRange(
        rowNo,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];

  const rowEventId =
    String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

  if (rowEventId !== String(eventId || "").trim()) {
    return null;
  }

  return makeCheckinIndexEntryObject_(
    row,
    headerMap,
    rowNo,
    rowEventId
  );
}

function makeCheckinIndexEntryObject_(
  row,
  headerMap,
  rowNo,
  rowEventId
) {

  return {
    rowNo: rowNo,
    eventId: rowEventId,
    key: makeCheckinIndexKeyFromRow_(row, headerMap),
    plannedId: String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim(),
    memberNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
    personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
    companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
    participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
    mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
    block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
    branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
    district: String(getCellByHeader_(row, headerMap, "地区") || "").trim(),
    targetType: String(getCellByHeader_(row, headerMap, "対象区分") || "").trim(),
    status: String(getCellByHeader_(row, headerMap, "受付状態") || "").trim(),
    checkedAt: getCellByHeader_(row, headerMap, "受付日時"),
    method: String(getCellByHeader_(row, headerMap, "受付方法") || "").trim(),
    historyRowNo: String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim()
  };
}


function updateCheckinIndexAfterCheckin_(
  eventId,
  member,
  method,
  historyRowNo,
  checkedAt
) {

  const sheet =
    getOrCreateCheckinIndexSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const entry =
    getCheckinIndexEntry_(
      eventId,
      member.memberNo,
      member.personalId || ""
    );

  const now =
    new Date();

  if (entry) {

    updateCheckinIndexMemberColumns_(
      sheet,
      headerMap,
      entry.rowNo,
      member,
      "対象者",
      now
    );

    sheet.getRange(entry.rowNo, headerMap["受付状態"] + 1).setValue("受付済み");
    sheet.getRange(entry.rowNo, headerMap["受付日時"] + 1).setValue(checkedAt);
    sheet.getRange(entry.rowNo, headerMap["受付方法"] + 1).setValue(method);
    sheet.getRange(entry.rowNo, headerMap["参加履歴行番号"] + 1).setValue(historyRowNo || "");
    sheet.getRange(entry.rowNo, headerMap["備考"] + 1).setValue("");

    return;
  }

  appendCheckinIndexRow_(
    sheet,
    headerMap,
    eventId,
    member,
    "当日受付",
    "受付済み",
    checkedAt,
    method,
    historyRowNo,
    "",
    now
  );
}

function updateCheckinIndexAfterCheckinByRow_(
  rowNo,
  member,
  method,
  historyRowNo,
  checkedAt
) {

  rowNo =
    Number(rowNo || 0);

  if (rowNo < 2) {
    return false;
  }

  const sheet =
    getOrCreateCheckinIndexSheet_();

  if (sheet.getLastRow() < rowNo) {
    return false;
  }

  const headerMap =
    getHeaderMap_(sheet);

  const row =
    sheet
      .getRange(
        rowNo,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];

  const now =
    new Date();

  updateCheckinIndexMemberColumnsInRow_(
    row,
    headerMap,
    member,
    "対象者",
    now
  );

  row[headerMap["受付状態"]] =
    "受付済み";
  row[headerMap["受付日時"]] =
    checkedAt;
  row[headerMap["受付方法"]] =
    method;
  row[headerMap["参加履歴行番号"]] =
    historyRowNo || "";
  row[headerMap["備考"]] =
    "";

  sheet
    .getRange(
      rowNo,
      1,
      1,
      row.length
    )
    .setValues([row]);

  return true;
}


function updateCheckinIndexStatusByHistoryRow_(
  eventId,
  memberNo,
  personalId,
  mode,
  historyRowNo
) {

  const entry =
    getCheckinIndexEntry_(
      eventId,
      memberNo,
      personalId || ""
    );

  if (!entry) {
    return;
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet) {
    return;
  }

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  sheet.getRange(entry.rowNo, headerMap["更新日時"] + 1).setValue(now);
  sheet.getRange(entry.rowNo, headerMap["参加履歴行番号"] + 1).setValue(historyRowNo || "");

  if (mode === "cancel") {
    sheet.getRange(entry.rowNo, headerMap["受付状態"] + 1).setValue("取消済み");
    return;
  }

  if (mode === "restore") {
    sheet.getRange(entry.rowNo, headerMap["受付状態"] + 1).setValue("受付済み");
  }
}


function getSystemSettingSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SETTING_SHEET_NAME_
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        CHECKIN_INDEX_SETTING_SHEET_NAME_
      );
  }

  ensureHeaders_(
    sheet,
    CHECKIN_INDEX_SETTING_HEADERS_
  );

  return sheet;
}


function getSystemSettingValue_(key, defaultValue) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SETTING_SHEET_NAME_
    );

  if (!sheet) {
    return defaultValue;
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    if (String(values[i][0] || "").trim() === key) {
      const value =
        String(values[i][1] || "").trim();

      return value || defaultValue;
    }
  }

  return defaultValue;
}


function setSystemSettingValue_(key, value, note) {

  const sheet =
    getSystemSettingSheet_();

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    if (String(values[i][0] || "").trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(note || "");
      sheet.getRange(i + 1, 4).setValue(now);
      return;
    }
  }

  sheet.appendRow([
    key,
    value,
    note || "",
    now
  ]);
}


function normalizeCheckinIndexDateText_(value) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy/MM/dd"
    );
  }

  const text =
    String(value || "").trim();

  if (text.indexOf("-") !== -1) {
    const parts =
      text.split("-");

    if (parts.length >= 3) {
      return parts[0].padStart(4, "0") +
        "/" +
        parts[1].padStart(2, "0") +
        "/" +
        parts[2].padStart(2, "0");
    }
  }

  return text;
}
