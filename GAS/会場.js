const VENUE_MASTER_SHEET_NAME_ =
  "会場マスタ";

const VENUE_MASTER_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "会場ID",
    "会場名",
    "会場住所",
    "会場担当者",
    "会場連絡先",
    "会場メール",
    "会場URL",
    "申込URL",
    "会場定員",
    "緯度",
    "経度",
    "受付可能距離m",
    "位置情報最終確認日時",
    "位置情報確認メモ",
    "有効"
  ];

function getVenueMastersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result = {
      ok: true,
      venues: getVenueMasters_()
    };

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

function saveVenueMasterJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      saveVenueMaster_(e.parameter);

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

function importVenueMastersFromTrainingsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      importVenueMastersFromTrainings_();

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

function getVenueMasterSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(VENUE_MASTER_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(VENUE_MASTER_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    VENUE_MASTER_HEADERS_
  );

  return sheet;
}

function getVenueMasters_() {

  const sheet =
    getVenueMasterSheet_();

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const venues = [];

  values.forEach(function(row) {

    const venueId =
      String(getCellByHeader_(row, headerMap, "会場ID") || "").trim();

    const venueName =
      String(getCellByHeader_(row, headerMap, "会場名") || "").trim();

    if (!venueId || !venueName) {
      return;
    }

    venues.push({
      venueId: venueId,
      venueName: venueName,
      venueAddress: String(getCellByHeader_(row, headerMap, "会場住所") || "").trim(),
      venueContactName: String(getCellByHeader_(row, headerMap, "会場担当者") || "").trim(),
      venueContactPhone: String(getCellByHeader_(row, headerMap, "会場連絡先") || "").trim(),
      venueContactMail: String(getCellByHeader_(row, headerMap, "会場メール") || "").trim(),
      venueUrl: String(getCellByHeader_(row, headerMap, "会場URL") || "").trim(),
      venueApplicationUrl: String(getCellByHeader_(row, headerMap, "申込URL") || "").trim(),
      venueCapacity: String(getCellByHeader_(row, headerMap, "会場定員") || "").trim(),
      latitude: String(getCellByHeader_(row, headerMap, "緯度") || "").trim(),
      longitude: String(getCellByHeader_(row, headerMap, "経度") || "").trim(),
      geoRadius: String(getCellByHeader_(row, headerMap, "受付可能距離m") || "").trim(),
      geoCheckedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "位置情報最終確認日時")),
      geoMemo: String(getCellByHeader_(row, headerMap, "位置情報確認メモ") || "").trim(),
      active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE"
    });
  });

  venues.sort(function(a, b) {
    return a.venueName.localeCompare(b.venueName, "ja");
  });

  return venues;
}

function getVenueMasterMap_() {

  const map = {};

  getVenueMasters_().forEach(function(venue) {
    if (venue.venueId) {
      map[String(venue.venueId)] =
        venue;
    }
  });

  return map;
}

function getVenueMasterById_(venueId) {

  const targetVenueId =
    String(venueId || "").trim();

  if (!targetVenueId) {
    return null;
  }

  const map =
    getVenueMasterMap_();

  return map[targetVenueId] || null;
}

function getNextVenueId_() {

  const sheet =
    getVenueMasterSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  let maxNo =
    0;

  for (let i = 1; i < values.length; i++) {

    const venueId =
      String(getCellByHeader_(values[i], headerMap, "会場ID") || "").trim();

    const match =
      venueId.match(/^V-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(maxNo, Number(match[1]));
    }
  }

  return "V-" + String(maxNo + 1).padStart(3, "0");
}

function saveVenueMaster_(params) {

  const sheet =
    getVenueMasterSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  let venueId =
    String(params.venueId || "").trim();

  const venueName =
    String(params.venueName || "").trim();

  const venueAddress =
    String(params.venueAddress || "").trim();

  if (!venueName) {
    throw new Error("会場名を入力してください。");
  }

  let rowNo =
    0;

  let matchedExistingVenue =
    false;

  const inputVenueKey =
    makeVenueKey_(
      venueName,
      venueAddress
    );

  for (let i = 1; i < values.length; i++) {

    const rowVenueId =
      String(getCellByHeader_(values[i], headerMap, "会場ID") || "").trim();

    if (venueId && rowVenueId === venueId) {
      rowNo =
        i + 1;
      break;
    }

    if (!venueId && inputVenueKey) {

      const rowVenueKey =
        makeVenueKey_(
          getCellByHeader_(values[i], headerMap, "会場名"),
          getCellByHeader_(values[i], headerMap, "会場住所")
        );

      if (rowVenueKey === inputVenueKey) {
        venueId =
          rowVenueId;
        rowNo =
          i + 1;
        matchedExistingVenue =
          true;
        break;
      }
    }
  }

  if (!venueId) {
    venueId =
      getNextVenueId_();
  }

  const row =
    rowNo
      ? sheet.getRange(rowNo, 1, 1, sheet.getLastColumn()).getValues()[0]
      : new Array(sheet.getLastColumn()).fill("");

  if (!rowNo) {
    row[headerMap["作成日時"]] =
      now;
  }

  row[headerMap["更新日時"]] = now;
  row[headerMap["会場ID"]] = venueId;
  row[headerMap["会場名"]] = venueName;
  row[headerMap["会場住所"]] = venueAddress;
  row[headerMap["会場担当者"]] = String(params.venueContactName || "").trim();
  row[headerMap["会場連絡先"]] = String(params.venueContactPhone || "").trim();
  row[headerMap["会場メール"]] = String(params.venueContactMail || "").trim();
  row[headerMap["会場URL"]] = String(params.venueUrl || "").trim();
  row[headerMap["申込URL"]] = String(params.venueApplicationUrl || "").trim();
  row[headerMap["会場定員"]] = String(params.venueCapacity || "").trim();
  row[headerMap["緯度"]] = String(params.latitude || "").trim();
  row[headerMap["経度"]] = String(params.longitude || "").trim();
  row[headerMap["受付可能距離m"]] = String(params.geoRadius || "").trim() || "200";
  row[headerMap["位置情報確認メモ"]] = String(params.geoMemo || "").trim();
  row[headerMap["有効"]] = String(params.active || "TRUE").toUpperCase() === "FALSE"
    ? "FALSE"
    : "TRUE";

  if (
    String(params.updateGeoCheckedAt || "").toUpperCase() === "TRUE" &&
    row[headerMap["緯度"]] &&
    row[headerMap["経度"]]
  ) {
    row[headerMap["位置情報最終確認日時"]] =
      now;
  }

  if (rowNo) {
    sheet
      .getRange(rowNo, 1, 1, row.length)
      .setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return {
    ok: true,
    message: matchedExistingVenue
      ? "同じ会場名・住所の会場があるため、既存会場を更新しました。"
      : "会場マスタを保存しました。",
    venueId: venueId,
    matchedExistingVenue: matchedExistingVenue
  };
}

function importVenueMastersFromTrainings_() {

  const ss =
    getSpreadsheet_();

  const trainingSheet =
    ss.getSheetByName("研修会");

  if (!trainingSheet || trainingSheet.getLastRow() < 2) {
    return {
      ok: true,
      message: "取り込み対象の研修会がありません。",
      imported: 0
    };
  }

  const trainingValues =
    trainingSheet.getDataRange().getValues();

  const trainingHeaders =
    trainingValues[0].map(function(h) {
      return String(h || "").trim();
    });

  function col(name) {
    return trainingHeaders.indexOf(name);
  }

  const existingMap = {};

  getVenueMasters_().forEach(function(venue) {
    const key =
      makeVenueKey_(
        venue.venueName,
        venue.venueAddress
      );

    existingMap[key] =
      true;
  });

  let imported =
    0;

  for (let i = 1; i < trainingValues.length; i++) {

    const row =
      trainingValues[i];

    const venueName =
      col("会場名") >= 0
        ? String(row[col("会場名")] || "").trim()
        : "";

    const venueAddress =
      col("会場住所") >= 0
        ? String(row[col("会場住所")] || "").trim()
        : "";

    if (!venueName) {
      continue;
    }

    const key =
      makeVenueKey_(
        venueName,
        venueAddress
      );

    if (existingMap[key]) {
      continue;
    }

    saveVenueMaster_({
      venueName: venueName,
      venueAddress: venueAddress,
      venueContactName: col("会場担当者") >= 0 ? row[col("会場担当者")] : "",
      venueContactPhone: col("会場連絡先") >= 0 ? row[col("会場連絡先")] : "",
      venueContactMail: col("会場メール") >= 0 ? row[col("会場メール")] : "",
      venueUrl: col("会場URL") >= 0 ? row[col("会場URL")] : "",
      venueApplicationUrl: col("申込URL") >= 0 ? row[col("申込URL")] : "",
      venueCapacity: col("会場定員") >= 0 ? row[col("会場定員")] : "",
      active: "TRUE"
    });

    existingMap[key] =
      true;

    imported++;
  }

  return {
    ok: true,
    message: "研修会の会場情報から会場マスタを作成しました。",
    imported: imported
  };
}

function makeVenueKey_(
  venueName,
  venueAddress
) {

  return String(venueName || "")
    .replace(/\s/g, "")
    .trim()
    .toLowerCase() +
    "\n" +
    String(venueAddress || "")
      .replace(/\s/g, "")
      .trim()
      .toLowerCase();
}
