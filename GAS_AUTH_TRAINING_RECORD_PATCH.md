# GAS追加コード: 研修会場履歴・ログイン権限土台

作成日: 2026-06-24

このファイルは、宅建研修システムの Google Apps Script 側へ貼り付ける追加・差し替え用コードです。

対象GAS:

```text
1x6VS29Olp_HZES95ApKdWqCMHZ_dN6tajTulgutb4BA3GSG4SBl-IQ7J
```

WEB側は現状維持のまま、GAS側に以下を用意します。

- `training-record-edit.html` から送られる会場・講師・費用・メモを `研修会` シートへ保存
- `venue-history.html` / `training-record.html` が使う `getTrainingRecordsJsonp` を返却
- 将来WEBログインをONにできる `ログインユーザー` シート、セッション、権限見直し処理
- デモ中は `WEB_AUTH_ENABLED = FALSE` のため認証なしで従来通り動作

## 1. doGet の action ルーティングに追加

既存の `doGet(e)` または action 分岐に、以下を追加してください。

```javascript
if (action === "getTrainingRecordsJsonp") return getTrainingRecordsJsonp_(e);
if (action === "saveTrainingJsonp") return saveTrainingJsonp_(e);

if (action === "loginJsonp") return loginJsonp_(e);
if (action === "logoutJsonp") return logoutJsonp_(e);
if (action === "getAuthUsersJsonp") return getAuthUsersJsonp_(e);
if (action === "saveAuthUserJsonp") return saveAuthUserJsonp_(e);
if (action === "deactivateVendorAuthUsersJsonp") return deactivateVendorAuthUsersJsonp_(e);
if (action === "updateAuthUsersActiveJsonp") return updateAuthUsersActiveJsonp_(e);
```

既に `getTrainingRecordsJsonp` / `saveTrainingJsonp` がある場合は、このファイル内の同名関数で差し替えてください。

## 2. 追加・差し替えコード

```javascript
const TRAINING_SHEET_NAME =
  "研修会";

const TRAINING_STATS_SHEET_NAME =
  "研修会集計";

const AUTH_USER_SHEET_NAME =
  "ログインユーザー";

const AUTH_SESSION_SHEET_NAME =
  "ログインセッション";

const OPERATION_LOG_SHEET_NAME =
  "操作ログ";

const WEB_AUTH_SETTING_KEY =
  "WEB_AUTH_ENABLED";

const AUTH_SESSION_EXPIRE_HOURS =
  12;

const TRAINING_HEADERS_ =
  [
    "研修ID",
    "研修名",
    "主催区分",
    "受付方式",
    "開催日",
    "対象ブロック",
    "対象支部",
    "対象地区",
    "対象組織ID",
    "差出人組織ID",
    "修了証発行",
    "件名",
    "本文",
    "PDFファイルID",
    "有効",
    "会場名",
    "会場住所",
    "開始時刻",
    "終了時刻",
    "講師名",
    "講師所属",
    "講師連絡先",
    "会場費",
    "講師費",
    "資料印刷費",
    "飲み物代",
    "その他費用",
    "費用備考",
    "実施メモ",
    "会場担当者",
    "会場連絡先",
    "会場メール",
    "会場URL",
    "会場定員",
    "会場費メモ",
    "作成日時",
    "更新日時"
  ];

const TRAINING_STATS_HEADERS_ =
  [
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

const AUTH_USER_HEADERS_ =
  [
    "ユーザーID",
    "ログインID",
    "パスワードハッシュ",
    "パスワードソルト",
    "権限",
    "業者番号",
    "表示名",
    "メール",
    "有効",
    "初回PW変更",
    "見直し対象",
    "最終見直し日時",
    "メモ",
    "作成日時",
    "更新日時",
    "最終ログイン日時"
  ];

const AUTH_SESSION_HEADERS_ =
  [
    "セッショントークン",
    "ユーザーID",
    "ログインID",
    "権限",
    "発行日時",
    "期限日時",
    "無効",
    "更新日時"
  ];

function jsonpOutput_(e, result) {

  const callback =
    e && e.parameter && e.parameter.callback
      ? e.parameter.callback
      : "callback";

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result || {}) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getSs_() {

  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(sheetName, headers) {

  const ss =
    getSs_();

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet =
      ss.insertSheet(sheetName);
  }

  ensureHeaders_(sheet, headers);

  return sheet;
}

function ensureHeaders_(sheet, headers) {

  if (!headers || headers.length === 0) {
    return;
  }

  const lastColumn =
    Math.max(sheet.getLastColumn(), 1);

  const current =
    sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(function(value) {
        return String(value || "").trim();
      });

  if (sheet.getLastRow() === 0 || current.join("") === "") {
    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);
    return;
  }

  const existing =
    {};

  current.forEach(function(header) {
    if (header) {
      existing[header] =
        true;
    }
  });

  headers.forEach(function(header) {
    if (!existing[header]) {
      sheet
        .getRange(1, sheet.getLastColumn() + 1)
        .setValue(header);
    }
  });
}

function getHeaderMap_(sheet) {

  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn < 1) {
    return {};
  }

  const headers =
    sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0];

  const map =
    {};

  headers.forEach(function(header, index) {

    const name =
      String(header || "").trim();

    if (name) {
      map[name] =
        index;
    }
  });

  return map;
}

function getCellByHeader_(row, headerMap, headerName) {

  const index =
    headerMap[headerName];

  if (index === undefined || index < 0) {
    return "";
  }

  return row[index];
}

function setCellByHeader_(rowValues, headerMap, headerName, value) {

  const index =
    headerMap[headerName];

  if (index === undefined || index < 0) {
    return;
  }

  rowValues[index] =
    value;
}

function normalizeFlag_(value, defaultValue) {

  const text =
    String(value === undefined || value === null ? "" : value)
      .trim()
      .toUpperCase();

  if (text === "TRUE" || text === "1" || text === "YES") {
    return "TRUE";
  }

  if (text === "FALSE" || text === "0" || text === "NO") {
    return "FALSE";
  }

  return defaultValue
    ? "TRUE"
    : "FALSE";
}

function normalizeMemberNo_(value) {

  return String(value || "")
    .replace(/\.0$/, "")
    .trim();
}

function formatDateTime_(value) {

  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy/MM/dd HH:mm:ss"
    );
  }

  return String(value || "");
}

function getSystemSetting_(key) {

  const ss =
    getSs_();

  const sheet =
    ss.getSheetByName("管理設定");

  if (!sheet) {
    return "";
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === key) {
      return String(values[i][1] || "").trim();
    }
  }

  return "";
}

function isWebAuthEnabled_() {

  return normalizeFlag_(
    getSystemSetting_(WEB_AUTH_SETTING_KEY),
    false
  ) === "TRUE";
}

function requireWebAuth_(e, allowedRoles) {

  if (!isWebAuthEnabled_()) {
    return {
      ok: true,
      demo: true,
      user: {
        role: "admin",
        loginId: "demo"
      }
    };
  }

  const token =
    String(e && e.parameter && e.parameter.sessionToken || "").trim();

  const session =
    getValidAuthSession_(token);

  if (!session) {
    return {
      ok: false,
      message: "ログインが必要です。"
    };
  }

  if (
    allowedRoles &&
    allowedRoles.length &&
    allowedRoles.indexOf(session.role) === -1
  ) {
    return {
      ok: false,
      message: "この操作を行う権限がありません。"
    };
  }

  return {
    ok: true,
    user: session
  };
}

function getTrainingRecordsJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin", "staff"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  return jsonpOutput_(e, getTrainingRecords_());
}

function getTrainingRecords_() {

  const trainingSheet =
    getOrCreateSheet_(TRAINING_SHEET_NAME, TRAINING_HEADERS_);

  const statsMap =
    getTrainingStatsSummaryMap_();

  const values =
    trainingSheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      records: []
    };
  }

  const headerMap =
    getHeaderMap_(trainingSheet);

  const records =
    [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (!eventId) {
      continue;
    }

    const stats =
      statsMap[eventId] || {};

    records.push({
      eventId: eventId,
      title: getCellByHeader_(row, headerMap, "研修名"),
      hostType: getCellByHeader_(row, headerMap, "主催区分"),
      receptionType: getCellByHeader_(row, headerMap, "受付方式"),
      eventDate: formatDateOnly_(getCellByHeader_(row, headerMap, "開催日")),
      targetBlock: getCellByHeader_(row, headerMap, "対象ブロック"),
      targetBranch: getCellByHeader_(row, headerMap, "対象支部"),
      targetDistrict: getCellByHeader_(row, headerMap, "対象地区"),
      targetOrgIdsNew: getCellByHeader_(row, headerMap, "対象組織ID"),
      senderOrgId: getCellByHeader_(row, headerMap, "差出人組織ID"),
      certificateEnabled: getCellByHeader_(row, headerMap, "修了証発行"),
      subject: getCellByHeader_(row, headerMap, "件名"),
      body: getCellByHeader_(row, headerMap, "本文"),
      pdfFileId: getCellByHeader_(row, headerMap, "PDFファイルID"),
      active: normalizeFlag_(getCellByHeader_(row, headerMap, "有効"), true),
      venueName: getCellByHeader_(row, headerMap, "会場名"),
      venueAddress: getCellByHeader_(row, headerMap, "会場住所"),
      startTime: getCellByHeader_(row, headerMap, "開始時刻"),
      endTime: getCellByHeader_(row, headerMap, "終了時刻"),
      lecturerName: getCellByHeader_(row, headerMap, "講師名"),
      lecturerOrg: getCellByHeader_(row, headerMap, "講師所属"),
      lecturerContact: getCellByHeader_(row, headerMap, "講師連絡先"),
      venueCost: getCellByHeader_(row, headerMap, "会場費"),
      lecturerCost: getCellByHeader_(row, headerMap, "講師費"),
      printCost: getCellByHeader_(row, headerMap, "資料印刷費"),
      drinkCost: getCellByHeader_(row, headerMap, "飲み物代"),
      otherCost: getCellByHeader_(row, headerMap, "その他費用"),
      costNote: getCellByHeader_(row, headerMap, "費用備考"),
      eventMemo: getCellByHeader_(row, headerMap, "実施メモ"),
      venueContactName: getCellByHeader_(row, headerMap, "会場担当者"),
      venueContactPhone: getCellByHeader_(row, headerMap, "会場連絡先"),
      venueContactMail: getCellByHeader_(row, headerMap, "会場メール"),
      venueUrl: getCellByHeader_(row, headerMap, "会場URL"),
      venueCapacity: getCellByHeader_(row, headerMap, "会場定員"),
      venueFeeMemo: getCellByHeader_(row, headerMap, "会場費メモ"),
      targetCount: stats.targetCount || "",
      sentCount: stats.sentCount || "",
      attendedCount: stats.attendedCount || "",
      outsideAttendedCount: stats.outsideAttendedCount || "",
      totalAttendedCount: stats.totalAttendedCount || "",
      absentCount: stats.absentCount || "",
      attendanceRate: stats.attendanceRate || ""
    });
  }

  return {
    ok: true,
    records: records
  };
}

function getTrainingStatsSummaryMap_() {

  const ss =
    getSs_();

  const sheet =
    ss.getSheetByName(TRAINING_STATS_SHEET_NAME);

  if (!sheet) {
    return {};
  }

  ensureHeaders_(sheet, TRAINING_STATS_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {};
  }

  const headerMap =
    getHeaderMap_(sheet);

  const map =
    {};

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (!eventId) {
      continue;
    }

    map[eventId] = {
      targetCount: getCellByHeader_(row, headerMap, "対象人数"),
      sentCount: getCellByHeader_(row, headerMap, "送信成功"),
      attendedCount: getCellByHeader_(row, headerMap, "対象内参加"),
      outsideAttendedCount: getCellByHeader_(row, headerMap, "対象外参加"),
      totalAttendedCount: getCellByHeader_(row, headerMap, "参加者合計"),
      absentCount: getCellByHeader_(row, headerMap, "未参加人数"),
      attendanceRate: getCellByHeader_(row, headerMap, "参加率")
    };
  }

  return map;
}

function saveTrainingJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin", "staff"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  const p =
    e.parameter || {};

  const result =
    saveTraining_({
      eventId: p.eventId,
      title: p.title,
      hostType: p.hostType,
      receptionType: p.receptionType,
      eventDate: p.eventDate,
      targetBlock: p.targetBlock,
      targetBranch: p.targetBranch,
      targetDistrict: p.targetDistrict,
      targetOrgIdsNew: p.targetOrgIdsNew || p.targetOrgIds,
      senderOrgId: p.senderOrgId,
      certificateEnabled: p.certificateEnabled,
      subject: p.subject,
      body: getLongBodyIfNeeded_(p),
      pdfFileId: p.pdfFileId,
      active: p.active,
      venueName: p.venueName,
      venueAddress: p.venueAddress,
      startTime: p.startTime,
      endTime: p.endTime,
      lecturerName: p.lecturerName,
      lecturerOrg: p.lecturerOrg,
      lecturerContact: p.lecturerContact,
      venueCost: p.venueCost,
      lecturerCost: p.lecturerCost,
      printCost: p.printCost,
      drinkCost: p.drinkCost,
      otherCost: p.otherCost,
      costNote: p.costNote,
      eventMemo: p.eventMemo,
      venueContactName: p.venueContactName,
      venueContactPhone: p.venueContactPhone,
      venueContactMail: p.venueContactMail,
      venueUrl: p.venueUrl,
      venueCapacity: p.venueCapacity,
      venueFeeMemo: p.venueFeeMemo
    });

  if (result.ok) {
    writeOperationLog_(
      auth.user,
      "SAVE_TRAINING",
      result.eventId,
      "研修会・会場記録を保存"
    );
  }

  return jsonpOutput_(e, result);
}

function getLongBodyIfNeeded_(params) {

  if (params.bodyToken && typeof getLongTextByToken_ === "function") {
    return getLongTextByToken_(params.bodyToken);
  }

  return params.body || "";
}

function saveTraining_(data) {

  const eventId =
    String(data.eventId || "").trim();

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDがありません。"
    };
  }

  const sheet =
    getOrCreateSheet_(TRAINING_SHEET_NAME, TRAINING_HEADERS_);

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  let rowNumber =
    0;

  for (let i = 1; i < values.length; i++) {
    if (String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim() === eventId) {
      rowNumber =
        i + 1;
      break;
    }
  }

  const now =
    new Date();

  const rowValues =
    rowNumber
      ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
      : new Array(sheet.getLastColumn()).fill("");

  setCellByHeader_(rowValues, headerMap, "研修ID", eventId);
  setCellByHeader_(rowValues, headerMap, "研修名", data.title || getCellByHeader_(rowValues, headerMap, "研修名"));
  setCellByHeader_(rowValues, headerMap, "主催区分", data.hostType || getCellByHeader_(rowValues, headerMap, "主催区分"));
  setCellByHeader_(rowValues, headerMap, "受付方式", data.receptionType || getCellByHeader_(rowValues, headerMap, "受付方式"));
  setCellByHeader_(rowValues, headerMap, "開催日", data.eventDate || getCellByHeader_(rowValues, headerMap, "開催日"));
  setCellByHeader_(rowValues, headerMap, "対象ブロック", data.targetBlock || "");
  setCellByHeader_(rowValues, headerMap, "対象支部", data.targetBranch || "");
  setCellByHeader_(rowValues, headerMap, "対象地区", data.targetDistrict || "");
  setCellByHeader_(rowValues, headerMap, "対象組織ID", data.targetOrgIdsNew || "");
  setCellByHeader_(rowValues, headerMap, "差出人組織ID", data.senderOrgId || "");
  setCellByHeader_(rowValues, headerMap, "修了証発行", normalizeFlag_(data.certificateEnabled, false));
  setCellByHeader_(rowValues, headerMap, "件名", data.subject || "");
  setCellByHeader_(rowValues, headerMap, "本文", data.body || "");
  setCellByHeader_(rowValues, headerMap, "PDFファイルID", data.pdfFileId || "");
  setCellByHeader_(rowValues, headerMap, "有効", normalizeFlag_(data.active, true));
  setCellByHeader_(rowValues, headerMap, "会場名", data.venueName || "");
  setCellByHeader_(rowValues, headerMap, "会場住所", data.venueAddress || "");
  setCellByHeader_(rowValues, headerMap, "開始時刻", data.startTime || "");
  setCellByHeader_(rowValues, headerMap, "終了時刻", data.endTime || "");
  setCellByHeader_(rowValues, headerMap, "講師名", data.lecturerName || "");
  setCellByHeader_(rowValues, headerMap, "講師所属", data.lecturerOrg || "");
  setCellByHeader_(rowValues, headerMap, "講師連絡先", data.lecturerContact || "");
  setCellByHeader_(rowValues, headerMap, "会場費", toNumberOrBlank_(data.venueCost));
  setCellByHeader_(rowValues, headerMap, "講師費", toNumberOrBlank_(data.lecturerCost));
  setCellByHeader_(rowValues, headerMap, "資料印刷費", toNumberOrBlank_(data.printCost));
  setCellByHeader_(rowValues, headerMap, "飲み物代", toNumberOrBlank_(data.drinkCost));
  setCellByHeader_(rowValues, headerMap, "その他費用", toNumberOrBlank_(data.otherCost));
  setCellByHeader_(rowValues, headerMap, "費用備考", data.costNote || "");
  setCellByHeader_(rowValues, headerMap, "実施メモ", data.eventMemo || "");
  setCellByHeader_(rowValues, headerMap, "会場担当者", data.venueContactName || "");
  setCellByHeader_(rowValues, headerMap, "会場連絡先", data.venueContactPhone || "");
  setCellByHeader_(rowValues, headerMap, "会場メール", data.venueContactMail || "");
  setCellByHeader_(rowValues, headerMap, "会場URL", data.venueUrl || "");
  setCellByHeader_(rowValues, headerMap, "会場定員", toNumberOrBlank_(data.venueCapacity));
  setCellByHeader_(rowValues, headerMap, "会場費メモ", data.venueFeeMemo || "");
  setCellByHeader_(rowValues, headerMap, "更新日時", now);

  if (!rowNumber) {
    setCellByHeader_(rowValues, headerMap, "作成日時", now);
    sheet.appendRow(rowValues);
  } else {
    sheet
      .getRange(rowNumber, 1, 1, rowValues.length)
      .setValues([rowValues]);
  }

  return {
    ok: true,
    eventId: eventId,
    message: "保存しました。"
  };
}

function toNumberOrBlank_(value) {

  const text =
    String(value === undefined || value === null ? "" : value)
      .replace(/,/g, "")
      .trim();

  if (!text) {
    return "";
  }

  const number =
    Number(text);

  return isNaN(number)
    ? ""
    : number;
}

function formatDateOnly_(value) {

  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  return String(value || "").substring(0, 10);
}

function loginJsonp_(e) {

  const p =
    e.parameter || {};

  const loginId =
    String(p.loginId || "").trim();

  const password =
    String(p.password || "");

  const result =
    loginAuthUser_(loginId, password);

  return jsonpOutput_(e, result);
}

function logoutJsonp_(e) {

  const token =
    String(e.parameter.sessionToken || "").trim();

  if (token) {
    invalidateAuthSession_(token);
  }

  return jsonpOutput_(e, {
    ok: true,
    message: "ログアウトしました。"
  });
}

function getAuthUsersJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  return jsonpOutput_(e, getAuthUsers_());
}

function saveAuthUserJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  const p =
    e.parameter || {};

  const result =
    saveAuthUser_({
      userId: p.userId,
      loginId: p.loginId,
      password: p.password,
      role: p.role,
      vendorNo: p.vendorNo,
      displayName: p.displayName,
      email: p.email,
      active: p.active,
      mustChangePw: p.mustChangePw,
      reviewRequired: p.reviewRequired,
      note: p.note
    });

  if (result.ok) {
    writeOperationLog_(
      auth.user,
      "SAVE_AUTH_USER",
      result.userId,
      "ログイン権限を保存"
    );
  }

  return jsonpOutput_(e, result);
}

function deactivateVendorAuthUsersJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  const result =
    deactivateVendorAuthUsers_();

  writeOperationLog_(
    auth.user,
    "DEACTIVATE_VENDOR_AUTH_USERS",
    "",
    "vendor一括停止: " + result.updated + "件"
  );

  return jsonpOutput_(e, result);
}

function updateAuthUsersActiveJsonp_(e) {

  const auth =
    requireWebAuth_(e, ["admin"]);

  if (!auth.ok) {
    return jsonpOutput_(e, auth);
  }

  const ids =
    String(e.parameter.userIds || "")
      .split(",")
      .map(function(id) {
        return String(id || "").trim();
      })
      .filter(function(id) {
        return id !== "";
      });

  const result =
    updateAuthUsersActive_(
      ids,
      e.parameter.active
    );

  writeOperationLog_(
    auth.user,
    "UPDATE_AUTH_USERS_ACTIVE",
    ids.join(","),
    "active=" + normalizeFlag_(e.parameter.active, false)
  );

  return jsonpOutput_(e, result);
}

function getAuthUsers_() {

  const sheet =
    getOrCreateSheet_(AUTH_USER_SHEET_NAME, AUTH_USER_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      users: []
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const users =
    [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const userId =
      String(getCellByHeader_(row, headerMap, "ユーザーID") || "").trim();

    const loginId =
      String(getCellByHeader_(row, headerMap, "ログインID") || "").trim();

    if (!userId && !loginId) {
      continue;
    }

    users.push({
      userId: userId,
      loginId: loginId,
      role: String(getCellByHeader_(row, headerMap, "権限") || "vendor"),
      vendorNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
      displayName: getCellByHeader_(row, headerMap, "表示名"),
      email: getCellByHeader_(row, headerMap, "メール"),
      active: normalizeFlag_(getCellByHeader_(row, headerMap, "有効"), true),
      mustChangePw: normalizeFlag_(getCellByHeader_(row, headerMap, "初回PW変更"), false),
      reviewRequired: normalizeFlag_(getCellByHeader_(row, headerMap, "見直し対象"), String(getCellByHeader_(row, headerMap, "権限") || "vendor") === "vendor"),
      lastReviewedAt: formatDateTime_(getCellByHeader_(row, headerMap, "最終見直し日時")),
      note: getCellByHeader_(row, headerMap, "メモ"),
      createdAt: formatDateTime_(getCellByHeader_(row, headerMap, "作成日時")),
      updatedAt: formatDateTime_(getCellByHeader_(row, headerMap, "更新日時")),
      lastLoginAt: formatDateTime_(getCellByHeader_(row, headerMap, "最終ログイン日時"))
    });
  }

  return {
    ok: true,
    users: users
  };
}

function saveAuthUser_(data) {

  const loginId =
    String(data.loginId || "").trim();

  const displayName =
    String(data.displayName || "").trim();

  const role =
    normalizeRole_(data.role);

  const vendorNo =
    normalizeMemberNo_(data.vendorNo);

  if (!loginId || !displayName) {
    return {
      ok: false,
      message: "ログインIDと表示名は必須です。"
    };
  }

  if (role === "vendor" && !vendorNo) {
    return {
      ok: false,
      message: "vendorの場合は業者番号が必須です。"
    };
  }

  const sheet =
    getOrCreateSheet_(AUTH_USER_SHEET_NAME, AUTH_USER_HEADERS_);

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  let rowNumber =
    0;

  let userId =
    String(data.userId || "").trim();

  for (let i = 1; i < values.length; i++) {

    const rowUserId =
      String(getCellByHeader_(values[i], headerMap, "ユーザーID") || "").trim();

    const rowLoginId =
      String(getCellByHeader_(values[i], headerMap, "ログインID") || "").trim();

    if ((userId && rowUserId === userId) || (!userId && rowLoginId === loginId)) {
      rowNumber =
        i + 1;

      if (!userId) {
        userId =
          rowUserId;
      }

      break;
    }
  }

  if (!userId) {
    userId =
      "U" + Utilities.getUuid();
  }

  const now =
    new Date();

  const rowValues =
    rowNumber
      ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
      : new Array(sheet.getLastColumn()).fill("");

  if (data.password) {
    const salt =
      Utilities.getUuid();

    setCellByHeader_(rowValues, headerMap, "パスワードソルト", salt);
    setCellByHeader_(rowValues, headerMap, "パスワードハッシュ", hashPassword_(data.password, salt));
  }

  setCellByHeader_(rowValues, headerMap, "ユーザーID", userId);
  setCellByHeader_(rowValues, headerMap, "ログインID", loginId);
  setCellByHeader_(rowValues, headerMap, "権限", role);
  setCellByHeader_(rowValues, headerMap, "業者番号", vendorNo);
  setCellByHeader_(rowValues, headerMap, "表示名", displayName);
  setCellByHeader_(rowValues, headerMap, "メール", String(data.email || "").trim());
  setCellByHeader_(rowValues, headerMap, "有効", normalizeFlag_(data.active, true));
  setCellByHeader_(rowValues, headerMap, "初回PW変更", normalizeFlag_(data.mustChangePw, !!data.password));
  setCellByHeader_(rowValues, headerMap, "見直し対象", normalizeFlag_(data.reviewRequired, role === "vendor"));
  setCellByHeader_(rowValues, headerMap, "メモ", data.note || "");
  setCellByHeader_(rowValues, headerMap, "更新日時", now);

  if (!rowNumber) {
    setCellByHeader_(rowValues, headerMap, "作成日時", now);
    sheet.appendRow(rowValues);
  } else {
    sheet
      .getRange(rowNumber, 1, 1, rowValues.length)
      .setValues([rowValues]);
  }

  return {
    ok: true,
    userId: userId,
    message: "ログイン権限を保存しました。"
  };
}

function deactivateVendorAuthUsers_() {

  const sheet =
    getOrCreateSheet_(AUTH_USER_SHEET_NAME, AUTH_USER_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      updated: 0,
      message: "対象のvendorはありません。"
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  let updated =
    0;

  for (let i = 1; i < values.length; i++) {

    const role =
      normalizeRole_(getCellByHeader_(values[i], headerMap, "権限"));

    if (role !== "vendor") {
      continue;
    }

    const active =
      normalizeFlag_(getCellByHeader_(values[i], headerMap, "有効"), true);

    if (active !== "TRUE") {
      continue;
    }

    sheet.getRange(i + 1, headerMap["有効"] + 1).setValue("FALSE");
    sheet.getRange(i + 1, headerMap["見直し対象"] + 1).setValue("FALSE");
    sheet.getRange(i + 1, headerMap["最終見直し日時"] + 1).setValue(now);
    sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);

    updated++;
  }

  return {
    ok: true,
    updated: updated,
    message: "vendorを" + updated + "件停止しました。"
  };
}

function updateAuthUsersActive_(userIds, activeValue) {

  const ids =
    {};

  (userIds || []).forEach(function(id) {
    ids[String(id || "").trim()] =
      true;
  });

  const active =
    normalizeFlag_(activeValue, false);

  const sheet =
    getOrCreateSheet_(AUTH_USER_SHEET_NAME, AUTH_USER_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  let updated =
    0;

  for (let i = 1; i < values.length; i++) {

    const userId =
      String(getCellByHeader_(values[i], headerMap, "ユーザーID") || "").trim();

    const loginId =
      String(getCellByHeader_(values[i], headerMap, "ログインID") || "").trim();

    if (!ids[userId] && !ids[loginId]) {
      continue;
    }

    sheet.getRange(i + 1, headerMap["有効"] + 1).setValue(active);
    sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);

    if (active === "FALSE" && headerMap["最終見直し日時"] !== undefined) {
      sheet.getRange(i + 1, headerMap["最終見直し日時"] + 1).setValue(now);
    }

    updated++;
  }

  return {
    ok: true,
    updated: updated,
    message: updated + "件更新しました。"
  };
}

function loginAuthUser_(loginId, password) {

  if (!loginId || !password) {
    return {
      ok: false,
      message: "ログインIDとパスワードを入力してください。"
    };
  }

  const sheet =
    getOrCreateSheet_(AUTH_USER_SHEET_NAME, AUTH_USER_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "ログインID") || "").trim() !== loginId) {
      continue;
    }

    if (normalizeFlag_(getCellByHeader_(row, headerMap, "有効"), true) !== "TRUE") {
      return {
        ok: false,
        message: "このアカウントは停止されています。"
      };
    }

    const salt =
      String(getCellByHeader_(row, headerMap, "パスワードソルト") || "");

    const storedHash =
      String(getCellByHeader_(row, headerMap, "パスワードハッシュ") || "");

    if (!storedHash || storedHash !== hashPassword_(password, salt)) {
      return {
        ok: false,
        message: "ログインIDまたはパスワードが違います。"
      };
    }

    const user =
      {
        userId: String(getCellByHeader_(row, headerMap, "ユーザーID") || ""),
        loginId: loginId,
        role: normalizeRole_(getCellByHeader_(row, headerMap, "権限")),
        vendorNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
        displayName: String(getCellByHeader_(row, headerMap, "表示名") || ""),
        mustChangePw: normalizeFlag_(getCellByHeader_(row, headerMap, "初回PW変更"), false)
      };

    const session =
      createAuthSession_(user);

    sheet.getRange(i + 1, headerMap["最終ログイン日時"] + 1).setValue(new Date());

    return {
      ok: true,
      sessionToken: session.sessionToken,
      user: user
    };
  }

  return {
    ok: false,
    message: "ログインIDまたはパスワードが違います。"
  };
}

function createAuthSession_(user) {

  const sheet =
    getOrCreateSheet_(AUTH_SESSION_SHEET_NAME, AUTH_SESSION_HEADERS_);

  const now =
    new Date();

  const expiresAt =
    new Date(now.getTime() + AUTH_SESSION_EXPIRE_HOURS * 60 * 60 * 1000);

  const token =
    Utilities.getUuid() + Utilities.getUuid();

  sheet.appendRow([
    token,
    user.userId,
    user.loginId,
    user.role,
    now,
    expiresAt,
    "FALSE",
    now
  ]);

  return {
    sessionToken: token,
    expiresAt: expiresAt
  };
}

function getValidAuthSession_(token) {

  if (!token) {
    return null;
  }

  const sheet =
    getOrCreateSheet_(AUTH_SESSION_SHEET_NAME, AUTH_SESSION_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  for (let i = values.length - 1; i >= 1; i--) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "セッショントークン") || "") !== token) {
      continue;
    }

    if (normalizeFlag_(getCellByHeader_(row, headerMap, "無効"), false) === "TRUE") {
      return null;
    }

    const expiresAt =
      getCellByHeader_(row, headerMap, "期限日時");

    if (expiresAt instanceof Date && expiresAt.getTime() < now.getTime()) {
      return null;
    }

    return {
      userId: String(getCellByHeader_(row, headerMap, "ユーザーID") || ""),
      loginId: String(getCellByHeader_(row, headerMap, "ログインID") || ""),
      role: normalizeRole_(getCellByHeader_(row, headerMap, "権限"))
    };
  }

  return null;
}

function invalidateAuthSession_(token) {

  const sheet =
    getOrCreateSheet_(AUTH_SESSION_SHEET_NAME, AUTH_SESSION_HEADERS_);

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(getCellByHeader_(values[i], headerMap, "セッショントークン") || "") === token) {
      sheet.getRange(i + 1, headerMap["無効"] + 1).setValue("TRUE");
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(new Date());
      return;
    }
  }
}

function hashPassword_(password, salt) {

  const raw =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(salt || "") + ":" + String(password || ""),
      Utilities.Charset.UTF_8
    );

  return raw.map(function(byte) {
    const value =
      byte < 0
        ? byte + 256
        : byte;

    const hex =
      value.toString(16);

    return hex.length === 1
      ? "0" + hex
      : hex;
  }).join("");
}

function normalizeRole_(role) {

  const text =
    String(role || "").trim().toLowerCase();

  if (text === "admin" || text === "staff" || text === "vendor") {
    return text;
  }

  return "vendor";
}

function writeOperationLog_(user, action, targetId, detail) {

  try {
    const sheet =
      getOrCreateSheet_(
        OPERATION_LOG_SHEET_NAME,
        [
          "日時",
          "ログインID",
          "権限",
          "操作",
          "対象ID",
          "詳細"
        ]
      );

    sheet.appendRow([
      new Date(),
      user && user.loginId ? user.loginId : "",
      user && user.role ? user.role : "",
      action || "",
      targetId || "",
      detail || ""
    ]);
  } catch (error) {
    if (typeof writeSystemErrorLog === "function") {
      writeSystemErrorLog(error, "writeOperationLog_");
    }
  }
}
```

## 3. 管理設定シート

`管理設定` シートに以下を追加してください。

```text
設定キー,設定値,説明,更新日時
WEB_AUTH_ENABLED,FALSE,TRUEにするとWEB側のsessionToken認証を必須にする,
```

デモ中は `FALSE` のままで従来通り認証なしで動きます。

WEBログイン画面を実装・デプロイした後に `TRUE` にすると、`sessionToken` がない管理系操作は拒否されます。

## 4. ログインユーザーシート

初回はGASが自動作成します。

列:

```text
ユーザーID
ログインID
パスワードハッシュ
パスワードソルト
権限
業者番号
表示名
メール
有効
初回PW変更
見直し対象
最終見直し日時
メモ
作成日時
更新日時
最終ログイン日時
```

運用:

- `admin` / `staff`: 事務局用。2年ごとの一括停止対象外。
- `vendor`: 会員用。初期ログインIDは業者番号でよい。
- 業者番号はログインIDとは別列で保持。
- 2年ごとの見直しでは `vendor` を一括停止し、必要な会員を再登録または有効化。

## 5. 注意

既存GASに同名の共通関数がある場合、重複定義になります。

特に以下が既にある場合は、既存のものを優先し、このコード内の同名関数は貼らないでください。

```text
getHeaderMap_
getCellByHeader_
ensureHeaders_
normalizeMemberNo_
getSystemSetting_
```

`saveTrainingJsonp_` は既存の研修会作成・編集でも使われるため、既存処理がある場合は丸ごと二重に置くのではなく、`saveTraining_` 内へ会場関連列の保存処理を統合してください。
