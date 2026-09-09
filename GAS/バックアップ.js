function backupTrainingJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      backupTrainingByEvent_(
        String(e.parameter.event || "").trim(),
        "手動"
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

function backupTrainingByEvent_(
  eventId,
  backupType
) {

  if (!eventId) {
    throw new Error("研修IDが指定されていません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const sourceSs =
    getSpreadsheet_();

  const backupSs =
    SpreadsheetApp.create(
      buildTrainingBackupFileName_(
        training,
        backupType
      )
    );

  const moveWarning =
    moveFileToBackupFolder_(
      backupSs.getId()
    );

  const defaultSheet =
    backupSs.getSheets()[0];

  writeBackupSummarySheet_(
    defaultSheet,
    training,
    backupType
  );

  defaultSheet.setName(
    "バックアップ概要"
  );

  writeTrainingInfoBackupSheet_(
    backupSs,
    sourceSs,
    eventId
  );

  const historyCount =
    writeTrainingHistoryBackupSheet_(
      backupSs,
      sourceSs,
      eventId
    );

  writeBackupLog_(
    training,
    backupType,
    backupSs.getId(),
    backupSs.getUrl(),
    historyCount
  );

  return {
    ok: true,
    message: moveWarning
      ? "研修会情報と参加履歴をバックアップしました。ただし、保存先フォルダへの移動に失敗しました。"
      : "研修会情報と参加履歴をバックアップしました。",
    eventId: eventId,
    title: training.title || "",
    historyCount: historyCount,
    fileId: backupSs.getId(),
    url: backupSs.getUrl(),
    warning: moveWarning
  };
}

function backupYesterdayTrainings_() {

  const targetDate =
    new Date();

  targetDate.setDate(
    targetDate.getDate() - 1
  );

  return backupTrainingsByDate_(
    targetDate,
    "翌日自動"
  );
}

function backupTrainingsByDate_(
  date,
  backupType
) {

  const targetDateText =
    Utilities.formatDate(
      date,
      "Asia/Tokyo",
      "yyyy/MM/dd"
    );

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    throw new Error("研修会シートがありません。");
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const eventIdCol =
    headerMap["研修ID"];

  const eventDateCol =
    headerMap["開催日"];

  const results = [];

  for (let i = 1; i < values.length; i++) {

    const rowDateText =
      normalizeBackupDateText_(
        values[i][eventDateCol]
      );

    if (rowDateText !== targetDateText) {
      continue;
    }

    const eventId =
      String(values[i][eventIdCol] || "").trim();

    if (!eventId) {
      continue;
    }

    results.push(
      backupTrainingByEvent_(
        eventId,
        backupType
      )
    );
  }

  return {
    ok: true,
    message: "対象日の研修会バックアップを作成しました。",
    date: targetDateText,
    count: results.length,
    results: results
  };
}

function backupMonthlySystem_() {

  const sourceSs =
    getSpreadsheet_();

  const now =
    new Date();

  const backupSs =
    SpreadsheetApp.create(
      "月次全体バックアップ_" +
      Utilities.formatDate(
        now,
        "Asia/Tokyo",
        "yyyy-MM"
      ) +
      "_" +
      Utilities.formatDate(
        now,
        "Asia/Tokyo",
        "yyyyMMdd_HHmmss"
      )
    );

  const moveWarning =
    moveFileToBackupFolder_(
      backupSs.getId()
    );

  const defaultSheet =
    backupSs.getSheets()[0];

  defaultSheet.setName(
    "バックアップ概要"
  );

  defaultSheet
    .getRange(1, 1, 4, 2)
    .setValues([
      ["バックアップ種別", "月次全体"],
      ["作成日時", new Date()],
      ["元スプレッドシート", sourceSs.getName()],
      ["備考", "月次確認用の全体バックアップです。"]
    ]);

  [
    "研修会",
    "参加履歴",
    "会員マスタ",
    "個人会員",
    "組織マスタ",
    "会員所属",
    "個人所属",
    "修了証対象",
    "修了証発行者",
    "修了証ルール",
    "送信履歴"
  ].forEach(function(sheetName) {
    copyWholeSheetIfExists_(
      sourceSs,
      backupSs,
      sheetName
    );
  });

  return {
    ok: true,
    message: moveWarning
      ? "月次全体バックアップを作成しました。ただし、保存先フォルダへの移動に失敗しました。"
      : "月次全体バックアップを作成しました。",
    fileId: backupSs.getId(),
    url: backupSs.getUrl(),
    warning: moveWarning
  };
}

// Apps Scriptエディタから月次バックアップを手動確認するための公開入口。
function backupMonthlySystem() {
  const result = backupMonthlySystem_();
  console.log(JSON.stringify(result));
  return result;
}

function writeBackupSummarySheet_(
  sheet,
  training,
  backupType
) {

  sheet.clear();

  sheet
    .getRange(1, 1, 8, 2)
    .setValues([
      ["バックアップ種別", backupType || ""],
      ["作成日時", new Date()],
      ["研修ID", training.eventId || ""],
      ["研修名", training.title || ""],
      ["開催日", training.eventDate || ""],
      ["主催区分", training.hostType || ""],
      ["受付方式", training.receptionType || ""],
      ["受付単位", training.attendanceUnit || "会社"]
    ]);

  sheet.autoResizeColumns(
    1,
    2
  );
}

function writeTrainingInfoBackupSheet_(
  backupSs,
  sourceSs,
  eventId
) {

  if (typeof isSqlTrainingRecordEnabled_ === "function" && isSqlTrainingRecordEnabled_()) {
    const source = sourceSs.getSheetByName("研修会");
    const values = source ? source.getDataRange().getValues() : [["研修ID"]];
    writeRowsToBackupSheet_(backupSs.insertSheet("研修会情報"), sqlTrainingBackupRows_(values, eventId));
    return;
  }

  const sourceSheet =
    sourceSs.getSheetByName("研修会");

  if (!sourceSheet) {
    throw new Error("研修会シートがありません。");
  }

  const values =
    sourceSheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sourceSheet
    );

  const eventIdCol =
    headerMap["研修ID"];

  const rows =
    [
      values[0]
    ];

  for (let i = 1; i < values.length; i++) {

    if (String(values[i][eventIdCol] || "").trim() === eventId) {
      rows.push(
        values[i]
      );
      break;
    }
  }

  const sheet =
    backupSs.insertSheet(
      "研修会情報"
    );

  writeRowsToBackupSheet_(
    sheet,
    rows
  );
}

function writeTrainingHistoryBackupSheet_(
  backupSs,
  sourceSs,
  eventId
) {

  if (typeof isSqlDataRuntime_ === "function" && isSqlDataRuntime_()) {
    return writeSqlTrainingHistoryBackupSheet_(backupSs, eventId, "参加履歴");
  }

  const sourceSheet =
    sourceSs.getSheetByName("参加履歴");

  const sheet =
    backupSs.insertSheet(
      "参加履歴"
    );

  if (!sourceSheet) {
    sheet
      .getRange(1, 1)
      .setValue("参加履歴シートがありません。");
    return 0;
  }

  const values =
    sourceSheet.getDataRange().getValues();

  const rows =
    [
      values[0]
    ];

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(values[i][1] || "").trim();

    if (rowEventId === eventId) {
      rows.push(
        values[i]
      );
    }
  }

  writeRowsToBackupSheet_(
    sheet,
    rows
  );

  return Math.max(
    rows.length - 1,
    0
  );
}

function writeRowsToBackupSheet_(
  sheet,
  rows
) {

  if (!rows || rows.length === 0) {
    return;
  }

  sheet
    .getRange(
      1,
      1,
      rows.length,
      rows[0].length
    )
    .setValues(rows);

  sheet.setFrozenRows(1);

  sheet.autoResizeColumns(
    1,
    rows[0].length
  );
}

function copyWholeSheetIfExists_(
  sourceSs,
  backupSs,
  sheetName
) {

  if(sheetName==='送信履歴'&&typeof isSqlMailHistoryEnabled_==='function'&&isSqlMailHistoryEnabled_())return backupSqlMailHistory_(backupSs);

  if (sheetName === "参加履歴" && typeof isSqlDataRuntime_ === "function" && isSqlDataRuntime_()) {
    writeSqlTrainingHistoryBackupSheet_(backupSs, "", "参加履歴");
    return;
  }

  if (typeof isSqlDataRuntime_ === "function" && isSqlDataRuntime_()) {
    const sqlMasterRows = readSqlMasterBackupRows_(sheetName);
    if (sqlMasterRows) {
      writeRowsToBackupSheet_(backupSs.insertSheet(sanitizeBackupSheetName_(sheetName)), sqlMasterRows);
      return;
    }
  }

  if (sheetName === "研修会" && typeof isSqlTrainingRecordEnabled_ === "function" && isSqlTrainingRecordEnabled_()) {
    const source = sourceSs.getSheetByName("研修会");
    const values = source ? source.getDataRange().getValues() : [["研修ID"]];
    writeRowsToBackupSheet_(backupSs.insertSheet("研修会"), sqlTrainingBackupRows_(values, ""));
    return;
  }

  const sourceSheet =
    sourceSs.getSheetByName(
      sheetName
    );

  if (!sourceSheet) {
    return;
  }

  const values =
    sourceSheet.getDataRange().getValues();

  if (!values || values.length === 0) {
    return;
  }

  const sheet =
    backupSs.insertSheet(
      sanitizeBackupSheetName_(
        sheetName
      )
    );

  writeRowsToBackupSheet_(
    sheet,
    values
  );
}

function readSqlCheckinBackupRows_(eventId) {
  const headers = [
    "受付ID", "研修ID", "受付日時", "受付区分", "受付単位", "受付対象ID",
    "業者番号", "会社名", "個人ID", "参加者名", "メール", "支部", "地区", "ブロック",
    "受付方法", "取消", "取消日時", "取消者", "取消理由", "復元日時", "復元者", "復元理由"
  ];
  const rows = [headers];
  const targetEventId = String(eventId || "").trim();

  function readPaged_(rootName, fields) {
    let after = "";
    const result = [];
    for (let page = 0; page < 100; page++) {
      const where = targetEventId
        ? "where:{trainingId:{eq:$eventId},checkinId:{gt:$after}},"
        : "where:{checkinId:{gt:$after}},";
      const variableDefinition = targetEventId
        ? "$eventId:String!,$after:String!"
        : "$after:String!";
      const query = "query(" + variableDefinition + "){rows:" + rootName + "(" + where +
        "orderBy:[{checkinId:ASC}],limit:1000){" + fields + "}}";
      const variables = {after: after};
      if (targetEventId) variables.eventId = targetEventId;
      const data = sqlMailHistoryRequest_(query, variables, false);
      const batch = data.rows;
      if (!Array.isArray(batch)) throw new Error("SQL参加履歴の取得結果が不正です。");
      if (batch.some(function(row, index) {
        return !row.checkinId || row.checkinId <= (index ? batch[index - 1].checkinId : after);
      })) throw new Error("SQL参加履歴の取得順が不正です。");
      Array.prototype.push.apply(result, batch);
      if (batch.length < 1000) return result;
      after = batch[batch.length - 1].checkinId;
    }
    throw new Error("SQL参加履歴が上限を超えたため、完全にバックアップできません。");
  }

  const checkins = readPaged_("checkins",
    "checkinId trainingId checkedInAt attendanceUnit targetId memberNo personalId checkinMethod cancelled " +
    "canceledAt canceledBy cancelReason restoredAt restoredBy restoreReason " +
    "company{companyName branch district block} person{name email}");
  checkins.forEach(function(row) {
    rows.push([
      row.checkinId || "", row.trainingId || "", row.checkedInAt || "", "会員", row.attendanceUnit || "", row.targetId || "",
      row.memberNo || "", row.company && row.company.companyName || "", row.personalId || "", row.person && row.person.name || "",
      row.person && row.person.email || "", row.company && row.company.branch || "", row.company && row.company.district || "",
      row.company && row.company.block || "", row.checkinMethod || "", row.cancelled === true ? "TRUE" : "FALSE",
      row.canceledAt || "", row.canceledBy || "", row.cancelReason || "", row.restoredAt || "", row.restoredBy || "", row.restoreReason || ""
    ]);
  });

  const guests = readPaged_("guestCheckins",
    "checkinId trainingId checkedInAt guestKey participantName organizationName email branch block receptionCategory checkinMethod cancelled");
  guests.forEach(function(row) {
    rows.push([
      row.checkinId || "", row.trainingId || "", row.checkedInAt || "", row.receptionCategory || "一般参加", "一般参加", row.guestKey || "",
      "", row.organizationName || "", "", row.participantName || "", row.email || "", row.branch || "", "", row.block || "",
      row.checkinMethod || "", row.cancelled === true ? "TRUE" : "FALSE", "", "", "", "", "", ""
    ]);
  });
  return rows;
}

function writeSqlTrainingHistoryBackupSheet_(backupSs, eventId, sheetName) {
  const rows = readSqlCheckinBackupRows_(eventId);
  const sheet = backupSs.insertSheet(sanitizeBackupSheetName_(sheetName || "参加履歴"));
  writeRowsToBackupSheet_(sheet, rows);
  return Math.max(rows.length - 1, 0);
}

function readSqlMasterBackupRows_(sheetName) {
  const definitions = {
    "会員マスタ": {
      root: "memberCompanies", key: "memberNo",
      fields: "memberNo companyName representativeName email branch district block sendTarget note active",
      headers: ["業者番号", "会社名", "代表者名", "メール", "支部", "地区", "ブロック", "送信対象", "備考", "有効"]
    },
    "個人会員": {
      root: "people", key: "personalId",
      fields: "personalId memberNo name email personType approvalStatus active source note autoGenerated",
      headers: ["個人ID", "業者番号", "氏名", "メール", "個人区分", "承認状態", "有効", "登録元", "備考", "自動生成"]
    },
    "組織マスタ": {
      root: "organizations", key: "orgId",
      fields: "orgId orgName senderName active hostAvailable csvImportName csvImportMode createdAt updatedAt",
      headers: ["組織ID", "組織名", "差出人名", "有効", "主催利用", "CSV取込名", "CSV取込方式", "作成日時", "更新日時"]
    }
  };
  const associationDefinitions = {
    "会員所属": {
      root: "memberOrganizations", firstKey: "memberNo", secondKey: "orgId", fields: "memberNo orgId createdAt",
      headers: ["業者番号", "組織ID", "作成日時"]
    },
    "個人所属": {
      root: "personOrganizations", firstKey: "personalId", secondKey: "orgId", fields: "personalId orgId source createdAt",
      headers: ["個人ID", "組織ID", "登録元", "作成日時"]
    }
  };
  const definition = definitions[sheetName];
  if (definition) {
    const rows = [definition.headers], key = definition.key;
    let after = "";
    for (let page = 0; page < 100; page++) {
      const query = "query($after:String!){rows:" + definition.root +
        "(where:{" + key + ":{gt:$after}},orderBy:[{" + key + ":ASC}],limit:1000){" + definition.fields + "}}";
      const batch = sqlMailHistoryRequest_(query, {after: after}, false).rows;
      if (!Array.isArray(batch)) throw new Error("SQL" + sheetName + "の取得結果が不正です。");
      validateSqlBackupPage_(batch, key, after, sheetName);
      batch.forEach(function(row) { rows.push(definition.fields.split(" ").map(function(field) { return sqlBackupCell_(row[field]); })); });
      if (batch.length < 1000) return rows;
      after = batch[batch.length - 1][key];
    }
    throw new Error("SQL" + sheetName + "が上限を超えたため、完全にバックアップできません。");
  }
  const association = associationDefinitions[sheetName];
  if (!association) return null;
  const associationRows = [association.headers];
  let afterFirst = "", afterSecond = "";
  for (let page = 0; page < 100; page++) {
    const query = "query($afterFirst:String!,$afterSecond:String!){rows:" + association.root +
      "(where:{_or:[{" + association.firstKey + ":{gt:$afterFirst}},{" + association.firstKey +
      ":{eq:$afterFirst}," + association.secondKey + ":{gt:$afterSecond}}]},orderBy:[{" + association.firstKey +
      ":ASC},{" + association.secondKey + ":ASC}],limit:1000){" + association.fields + "}}";
    const batch = sqlMailHistoryRequest_(query, {afterFirst: afterFirst, afterSecond: afterSecond}, false).rows;
    if (!Array.isArray(batch)) throw new Error("SQL" + sheetName + "の取得結果が不正です。");
    batch.forEach(function(row, index) {
      const previousFirst = index ? batch[index - 1][association.firstKey] : afterFirst;
      const previousSecond = index ? batch[index - 1][association.secondKey] : afterSecond;
      if (!row[association.firstKey] || !row[association.secondKey] ||
          row[association.firstKey] < previousFirst ||
          (row[association.firstKey] === previousFirst && row[association.secondKey] <= previousSecond)) {
        throw new Error("SQL" + sheetName + "の取得順が不正です。");
      }
      associationRows.push(association.fields.split(" ").map(function(field) { return sqlBackupCell_(row[field]); }));
    });
    if (batch.length < 1000) return associationRows;
    afterFirst = batch[batch.length - 1][association.firstKey];
    afterSecond = batch[batch.length - 1][association.secondKey];
  }
  throw new Error("SQL" + sheetName + "が上限を超えたため、完全にバックアップできません。");
}

function validateSqlBackupPage_(batch, key, after, sheetName) {
  batch.forEach(function(row, index) {
    if (!row[key] || row[key] <= (index ? batch[index - 1][key] : after)) {
      throw new Error("SQL" + sheetName + "の取得順が不正です。");
    }
  });
}

function sqlBackupCell_(value) {
  if (value === true) return "TRUE";
  if (value === false) return "FALSE";
  return value == null ? "" : value;
}

function writeBackupLog_(
  training,
  backupType,
  fileId,
  url,
  historyCount
) {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("バックアップ履歴");

  if (!sheet) {
    sheet =
      ss.insertSheet("バックアップ履歴");

    sheet.appendRow([
      "作成日時",
      "バックアップ種別",
      "研修ID",
      "研修名",
      "開催日",
      "参加履歴件数",
      "ファイルID",
      "URL"
    ]);
  }

  sheet.appendRow([
    new Date(),
    backupType || "",
    training.eventId || "",
    training.title || "",
    training.eventDate || "",
    historyCount || 0,
    fileId || "",
    url || ""
  ]);
}

function moveFileToBackupFolder_(
  fileId
) {

  try {

    const file =
      DriveApp.getFileById(
        fileId
      );

    const folder =
      getTrainingBackupFolder_();

    file.moveTo(
      folder
    );

    return "";

  } catch (err) {

    return err.message;
  }
}

function getTrainingBackupFolder_() {

  const folderId =
    getConfigOptional_("BACKUP_FOLDER_ID");

  if (folderId) {
    try {

      const folder =
        DriveApp.getFolderById(
          folderId
        );

      if (folder.getMimeType && folder.getMimeType() !== MimeType.FOLDER) {
        throw new Error("指定されたIDはフォルダではありません。");
      }

      return folder;

    } catch (err) {

      throw new Error(
        "BACKUP_FOLDER_ID には、バックアップファイルのIDではなく、保存先フォルダのIDを設定してください。詳細: " +
        err.message
      );
    }
  }

  const sourceFile =
    DriveApp.getFileById(
      getConfig_("SPREADSHEET_ID")
    );

  const parents =
    sourceFile.getParents();

  const parentFolder =
    parents.hasNext()
      ? parents.next()
      : DriveApp.getRootFolder();

  const folders =
    parentFolder.getFoldersByName(
      "研修会バックアップ"
    );

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(
    "研修会バックアップ"
  );
}

function buildTrainingBackupFileName_(
  training,
  backupType
) {

  return "研修会バックアップ_" +
    sanitizeBackupFileName_(training.eventId || "") +
    "_" +
    sanitizeBackupFileName_(training.eventDate || "") +
    "_" +
    sanitizeBackupFileName_(training.title || "") +
    "_" +
    sanitizeBackupFileName_(backupType || "") +
    "_" +
    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyyMMdd_HHmmss"
    );
}

function sanitizeBackupFileName_(value) {

  return String(value || "")
    .replace(/[\\\/:\*\?"<>\|]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 80);
}

function sanitizeBackupSheetName_(value) {

  return String(value || "シート")
    .replace(/[\[\]\*\?\/\\:]/g, "_")
    .substring(0, 90);
}

function normalizeBackupDateText_(value) {

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

  return String(value || "")
    .trim()
    .replace(/-/g, "/");
}
