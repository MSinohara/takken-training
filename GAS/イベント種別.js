const EVENT_TYPE_HEADERS_ = [
  "イベント種別ID",
  "イベント種別名",
  "出欠確認",
  "有効",
  "表示順",
  "備考",
  "作成日時",
  "更新日時"
];

const DEFAULT_EVENT_TYPES_ = [
  ["ET-001", "研修会", "FALSE", "TRUE", 10, ""]
];

function getEventTypesJsonp_(e) {

  try {
    return jsonpOutput_(
      e,
      {
        ok: true,
        eventTypes: getEventTypes_()
      }
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

function saveEventTypeJsonp_(e) {

  try {
    return jsonpOutput_(
      e,
      saveEventType_(e.parameter)
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

function getEventTypes_() {

  const sheet =
    getEventTypeSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const list =
    [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventTypeId =
      String(getCellByHeader_(row, headerMap, "イベント種別ID") || "").trim();

    const eventTypeName =
      String(getCellByHeader_(row, headerMap, "イベント種別名") || "").trim();

    if (!eventTypeId || !eventTypeName) {
      continue;
    }

    list.push({
      eventTypeId: eventTypeId,
      eventTypeName: eventTypeName,
      attendanceConfirmDefault: String(getCellByHeader_(row, headerMap, "出欠確認") || "FALSE").toUpperCase() === "TRUE" ? "TRUE" : "FALSE",
      active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE" ? "FALSE" : "TRUE",
      sortOrder: String(getCellByHeader_(row, headerMap, "表示順") || ""),
      note: String(getCellByHeader_(row, headerMap, "備考") || ""),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時") || "")
    });
  }

  list.sort(function(a, b) {
    const orderA =
      Number(a.sortOrder || 9999);
    const orderB =
      Number(b.sortOrder || 9999);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.eventTypeName.localeCompare(b.eventTypeName, "ja");
  });

  return list;
}

function saveEventType_(params) {

  const sheet =
    getEventTypeSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  let eventTypeId =
    String(params.eventTypeId || "").trim();

  const eventTypeName =
    String(params.eventTypeName || "").trim();

  if (!eventTypeName) {
    throw new Error("イベント種別名を入力してください。");
  }

  if (
    eventTypeName === "研修会" &&
    String(params.active || "TRUE").toUpperCase() === "FALSE"
  ) {
    throw new Error("基本種別の「研修会」は無効化できません。");
  }

  if (!eventTypeId) {
    eventTypeId =
      getNextEventTypeId_();
  }

  let rowNo =
    0;

  for (let i = 1; i < values.length; i++) {
    const existingId =
      String(getCellByHeader_(values[i], headerMap, "イベント種別ID") || "").trim();

    if (existingId === eventTypeId) {
      rowNo =
        i + 1;
      break;
    }
  }

  const now =
    new Date();

  if (!rowNo) {
    rowNo =
      sheet.getLastRow() + 1;

    sheet
      .getRange(rowNo, headerMap["作成日時"] + 1)
      .setValue(now);
  }

  sheet.getRange(rowNo, headerMap["イベント種別ID"] + 1).setValue(eventTypeId);
  sheet.getRange(rowNo, headerMap["イベント種別名"] + 1).setValue(eventTypeName);
  sheet.getRange(rowNo, headerMap["出欠確認"] + 1).setValue(String(params.attendanceConfirmDefault || "FALSE").toUpperCase() === "TRUE" ? "TRUE" : "FALSE");
  sheet.getRange(rowNo, headerMap["有効"] + 1).setValue(String(params.active || "TRUE").toUpperCase() === "FALSE" ? "FALSE" : "TRUE");
  sheet.getRange(rowNo, headerMap["表示順"] + 1).setValue(String(params.sortOrder || "").trim());
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(String(params.note || "").trim());
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "イベント種別を保存しました。",
    eventTypeId: eventTypeId
  };
}

function getEventTypeSheet_() {

  const sheet =
    getOrCreateSheetWithHeaders_(
      "イベント種別",
      EVENT_TYPE_HEADERS_
    );

  ensureDefaultEventTypes_(
    sheet
  );

  return sheet;
}

function ensureDefaultEventTypes_(sheet) {

  const values =
    sheet.getDataRange().getValues();

  if (values.length > 1) {
    return;
  }

  const now =
    new Date();

  const rows =
    DEFAULT_EVENT_TYPES_.map(function(item) {
      return [
        item[0],
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        now,
        now
      ];
    });

  sheet
    .getRange(
      2,
      1,
      rows.length,
      EVENT_TYPE_HEADERS_.length
    )
    .setValues(rows);
}

function getNextEventTypeId_() {

  const sheet =
    getEventTypeSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  let maxNo =
    0;

  for (let i = 1; i < values.length; i++) {

    const eventTypeId =
      String(getCellByHeader_(values[i], headerMap, "イベント種別ID") || "").trim();

    const match =
      eventTypeId.match(/^ET-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(
          maxNo,
          Number(match[1])
        );
    }
  }

  return "ET-" + String(maxNo + 1).padStart(3, "0");
}
