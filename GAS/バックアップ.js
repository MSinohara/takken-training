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
