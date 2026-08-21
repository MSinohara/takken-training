const LOCATION_CHECKIN_TOKEN_SHEET_NAME_ =
  "位置情報受付トークン";

const LOCATION_CHECKIN_TOKEN_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "トークン",
    "研修ID",
    "業者番号",
    "会社名",
    "メール",
    "受付対象区分",
    "予定者ID",
    "個人ID",
    "参加者名",
    "受付区分",
    "ブロック",
    "支部",
    "有効",
    "使用日時",
    "参加履歴行番号",
    "備考"
  ];

function getOrCreateLocationCheckinToken_(
  training,
  member
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const eventId =
    String(training.eventId || "").trim();

  const memberNo =
    normalizeMemberNo_(member.memberNo);

  if (!eventId || !memberNo) {
    return "";
  }

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowMemberNo =
      normalizeMemberNo_(
        getCellByHeader_(values[i], headerMap, "業者番号")
      );

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowMemberNo === memberNo &&
      active !== "FALSE" &&
      token
    ) {
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(member.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(member.mail || "");
      return token;
    }
  }

  const token =
    createLocationCheckinTokenValue_();

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = memberNo;
  row[headerMap["会社名"]] = member.companyName || "";
  row[headerMap["メール"]] = member.mail || "";
  if (headerMap["受付対象区分"] !== undefined) {
    row[headerMap["受付対象区分"]] = "会員";
  }
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getOrCreateLocationCheckinTokenForPlanned_(
  training,
  attendee
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const eventId =
    String(training.eventId || "").trim();

  const plannedId =
    String(attendee.plannedId || "").trim();

  if (!eventId || !plannedId) {
    return "";
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowPlannedId =
      String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim();

    const targetType =
      String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim();

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowPlannedId === plannedId &&
      targetType === "当日予定者" &&
      active !== "FALSE" &&
      token
    ) {
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(attendee.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(attendee.mail || "");
      sheet.getRange(i + 1, headerMap["参加者名"] + 1).setValue(attendee.participantName || "");
      sheet.getRange(i + 1, headerMap["受付区分"] + 1).setValue(attendee.receptionCategory || "");
      sheet.getRange(i + 1, headerMap["ブロック"] + 1).setValue(attendee.block || "");
      sheet.getRange(i + 1, headerMap["支部"] + 1).setValue(attendee.branch || "");
      return token;
    }
  }

  const token =
    createLocationCheckinTokenValue_();

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = "";
  row[headerMap["会社名"]] = attendee.companyName || "";
  row[headerMap["メール"]] = attendee.mail || "";
  row[headerMap["受付対象区分"]] = "当日予定者";
  row[headerMap["予定者ID"]] = plannedId;
  row[headerMap["参加者名"]] = attendee.participantName || "";
  row[headerMap["受付区分"]] = attendee.receptionCategory || "";
  row[headerMap["ブロック"]] = attendee.block || "";
  row[headerMap["支部"]] = attendee.branch || "";
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getOrCreateLocationCheckinTokenForPersonal_(
  training,
  person
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const eventId =
    String(training.eventId || "").trim();

  const personalId =
    String(person.personalId || "").trim();

  if (!eventId || !personalId) {
    return "";
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const targetType =
      String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim();

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowPersonalId === personalId &&
      targetType === "個人会員" &&
      active !== "FALSE" &&
      token
    ) {
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["業者番号"] + 1).setValue(person.memberNo || "");
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(person.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(person.mail || "");
      sheet.getRange(i + 1, headerMap["参加者名"] + 1).setValue(person.participantName || person.personName || "");
      return token;
    }
  }

  const token =
    createLocationCheckinTokenValue_();

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = person.memberNo || "";
  row[headerMap["会社名"]] = person.companyName || "";
  row[headerMap["メール"]] = person.mail || "";
  row[headerMap["受付対象区分"]] = "個人会員";
  row[headerMap["個人ID"]] = personalId;
  row[headerMap["参加者名"]] = person.participantName || person.personName || "";
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getLocationCheckinTokenSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    LOCATION_CHECKIN_TOKEN_HEADERS_
  );

  return sheet;
}

function createLocationCheckinTokenValue_() {

  return Utilities
    .getUuid()
    .replace(/-/g, "") +
    Utilities
      .getUuid()
      .replace(/-/g, "")
      .substring(0, 12);
}

function isLocationCheckinEnabled_(training) {

  return training &&
    (
      training.locationCheckEnabled === true ||
      String(training.locationCheckEnabled || "").toUpperCase() === "TRUE"
    );
}

function buildLocationCheckinUrl_(
  training,
  member
) {

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return "";
  }

  const token =
    shouldUsePersonalLocationCheckin_(
      training,
      member
    )
      ? getOrCreateLocationCheckinTokenForPersonal_(
          training,
          member
        )
      : getOrCreateLocationCheckinToken_(
          training,
          member
        );

  if (!token) {
    return "";
  }

  return getConfig_("PUBLIC_WEB_URL") +
    "/location-checkin.html?token=" +
    encodeURIComponent(token);
}

function shouldUsePersonalLocationCheckin_(
  training,
  member
) {

  return String(training && training.attendanceUnit || "会社").trim() === "個人" &&
    !!(member && member.personalId);
}

function buildPlannedLocationCheckinUrl_(
  training,
  attendee
) {

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return "";
  }

  const token =
    getOrCreateLocationCheckinTokenForPlanned_(
      training,
      attendee
    );

  if (!token) {
    return "";
  }

  return getConfig_("PUBLIC_WEB_URL") +
    "/location-checkin.html?token=" +
    encodeURIComponent(token);
}

function getLocationCheckinTokenJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const token =
    String(e.parameter.token || "").trim();

  let result;

  try {
    result =
      getLocationCheckinTokenInfo_(
        token
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

function registerLocationCheckinJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      registerLocationCheckin_(
        e.parameter
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

function getDemoLocationMailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getDemoLocationMail_(
        e.parameter
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

function getDemoLocationMail_(
  params
) {

  const eventId =
    String(params.event || "2026-015").trim();

  const memberNo =
    normalizeMemberNo_(
      params.member
    );

  if (!eventId) {
    throw new Error("研修IDが指定されていません。");
  }

  if (!memberNo) {
    throw new Error("業者番号が指定されていません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const member =
    findMemberByNo_(
      memberNo
    );

  if (!member) {
    throw new Error("会員情報が見つかりません: " + memberNo);
  }

  const locationUrl =
    buildLocationCheckinUrl_(
      training,
      member
    );

  if (!locationUrl) {
    throw new Error("位置情報受付URLを作成できませんでした。研修会の位置情報受付設定と会場マスタを確認してください。");
  }

  const timeWindow =
    getLocationCheckinTimeWindow_(
      training
    );

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      body: training.body || "",
      locationCheckinStart: formatDateTimeForClient_(timeWindow.start),
      locationCheckinEnd: formatDateTimeForClient_(timeWindow.end)
    },
    member: {
      memberNo: member.memberNo,
      companyName: member.companyName,
      branch: member.branch || "",
      district: member.district || ""
    },
    locationUrl: locationUrl,
    signatureBody: getMailSignatureBodyById_(
      training.mailSignatureId
    )
  };
}

function getLocationCheckinTokenInfo_(
  token
) {

  const tokenRow =
    findLocationCheckinTokenRow_(
      token
    );

  if (!tokenRow) {
    return {
      ok: false,
      message: "受付URLを確認できませんでした。"
    };
  }

  const training =
    findTrainingById_(
      tokenRow.eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  if (!isLocationCheckinEnabled_(training)) {
    return {
      ok: false,
      message: "この研修会では位置情報受付を使用しない設定です。"
    };
  }

  const timeWindow =
    getLocationCheckinTimeWindow_(
      training
    );

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return {
      ok: false,
      message: "会場の位置情報が登録されていません。"
    };
  }

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      hostType: training.hostType,
      locationCheckinStart: formatDateTimeForClient_(timeWindow.start),
      locationCheckinEnd: formatDateTimeForClient_(timeWindow.end)
    },
    member: {
      memberNo: tokenRow.memberNo,
      companyName: tokenRow.companyName,
      personalId: tokenRow.personalId,
      participantName: tokenRow.participantName,
      receptionCategory: tokenRow.receptionCategory,
      targetType: tokenRow.targetType
    },
    venue: {
      venueName: venue.venueName,
      venueAddress: venue.venueAddress,
      latitude: venue.latitude,
      longitude: venue.longitude,
      geoRadius: venue.geoRadius || "200"
    },
    usedAt: tokenRow.usedAt
  };
}

function registerLocationCheckin_(
  params
) {

  const token =
    String(params.token || "").trim();

  const latitude =
    Number(params.latitude || "");

  const longitude =
    Number(params.longitude || "");

  if (!token) {
    throw new Error("受付トークンがありません。");
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error("位置情報を取得できませんでした。");
  }

  const tokenRow =
    findLocationCheckinTokenRow_(
      token
    );

  if (!tokenRow) {
    throw new Error("受付URLを確認できませんでした。");
  }

  const training =
    findTrainingById_(
      tokenRow.eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません。");
  }

  if (!isLocationCheckinEnabled_(training)) {
    throw new Error("この研修会では位置情報受付を使用しない設定です。");
  }

  const timeCheck =
    checkLocationCheckinTime_(
      training,
      new Date()
    );

  if (!timeCheck.ok) {
    return timeCheck;
  }

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    throw new Error("会場の位置情報が登録されていません。");
  }

  const distance =
    calculateDistanceMeters_(
      latitude,
      longitude,
      Number(venue.latitude),
      Number(venue.longitude)
    );

  const radius =
    Number(venue.geoRadius || 200);

  if (distance > radius) {
    return {
      ok: false,
      message: "会場から離れているため受付できません。",
      distance: Math.round(distance),
      radius: radius,
      venueName: venue.venueName || ""
    };
  }

  const result =
    tokenRow.targetType === "当日予定者"
      ? checkinPlannedAttendee_(
          training.eventId,
          tokenRow.plannedId,
          "位置情報受付",
          {
            verificationStatus: "受付トークン照合済み",
            locationToken: token,
            latitude: latitude,
            longitude: longitude,
            distanceMeters: Math.round(distance)
          }
        )
      : tokenRow.targetType === "個人会員"
        ? registerCheckin(
            training.eventId,
            "PERSONAL:" + tokenRow.personalId,
            "位置情報受付",
            {
              receptionCategory: "第十ブロック会員",
              verificationStatus: "受付トークン照合済み",
              locationToken: token,
              latitude: latitude,
              longitude: longitude,
              distanceMeters: Math.round(distance)
            }
          )
      : registerCheckin(
          training.eventId,
          "MEMBER:" + tokenRow.memberNo,
          "位置情報受付",
          {
            receptionCategory: "第十ブロック会員",
            verificationStatus: "受付トークン照合済み",
            locationToken: token,
            latitude: latitude,
            longitude: longitude,
            distanceMeters: Math.round(distance)
          }
        );

  markLocationCheckinTokenUsed_(
    tokenRow,
    result
  );

  result.distance =
    Math.round(distance);

  result.radius =
    radius;

  result.venueName =
    venue.venueName || "";

  return result;
}

function checkLocationCheckinTime_(
  training,
  now
) {

  const window =
    getLocationCheckinTimeWindow_(
      training
    );

  if (!window.start || !window.end) {
    return {
      ok: false,
      message: "位置情報受付の利用時間を確認できませんでした。"
    };
  }

  if (now < window.start) {
    return {
      ok: false,
      message: "位置情報受付の開始前です。",
      startsAt: formatDateTimeForClient_(window.start),
      endsAt: formatDateTimeForClient_(window.end)
    };
  }

  if (now > window.end) {
    return {
      ok: false,
      message: "位置情報受付の終了後です。",
      startsAt: formatDateTimeForClient_(window.start),
      endsAt: formatDateTimeForClient_(window.end)
    };
  }

  return {
    ok: true,
    startsAt: formatDateTimeForClient_(window.start),
    endsAt: formatDateTimeForClient_(window.end)
  };
}

function getLocationCheckinTimeWindow_(
  training
) {

  const start =
    parseLocationDateTime_(
      training.locationCheckinStart
    ) ||
    parseLocationDateTimeFromTrainingTime_(
      training.eventDate,
      training.startTime,
      -30
    ) ||
    parseLocationDateTimeFromEventDate_(
      training.eventDate,
      "00:00"
    );

  const end =
    parseLocationDateTime_(
      training.locationCheckinEnd
    ) ||
    parseLocationDateTimeFromTrainingTime_(
      training.eventDate,
      training.endTime,
      120
    ) ||
    parseLocationDateTimeFromEventDate_(
      training.eventDate,
      "23:59"
    );

  return {
    start: start,
    end: end
  };
}

function parseLocationDateTime_(
  value
) {

  if (!value) {
    return null;
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value;
  }

  const text =
    String(value || "").trim();

  if (!text) {
    return null;
  }

  const normalized =
    text
      .replace(/\//g, "-")
      .replace(" ", "T");

  const date =
    new Date(normalized);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseLocationDateTimeFromTrainingTime_(
  eventDate,
  timeValue,
  offsetMinutes
) {

  const timeText =
    parseLocationTimeText_(
      timeValue
    );

  if (!timeText) {
    return null;
  }

  const date =
    parseLocationDateTimeFromEventDate_(
      eventDate,
      timeText
    );

  if (!date) {
    return null;
  }

  date.setMinutes(
    date.getMinutes() + Number(offsetMinutes || 0)
  );

  return date;
}

function parseLocationTimeText_(
  value
) {

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

  const match =
    text.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return "";
  }

  return String(match[1]).padStart(2, "0") +
    ":" +
    match[2];
}

function parseLocationDateTimeFromEventDate_(
  eventDate,
  timeText,
  addDays
) {

  const dateText =
    String(eventDate || "")
      .replace(/\//g, "-")
      .substring(0, 10);

  if (!dateText) {
    return null;
  }

  const date =
    new Date(dateText + "T" + timeText + ":00+09:00");

  if (isNaN(date.getTime())) {
    return null;
  }

  if (addDays) {
    date.setDate(
      date.getDate() + Number(addDays)
    );
  }

  return date;
}

function findLocationCheckinTokenRow_(
  token
) {

  const targetToken =
    String(token || "").trim();

  if (!targetToken) {
    return null;
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const rowToken =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (rowToken !== targetToken) {
      continue;
    }

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    if (active === "FALSE") {
      return null;
    }

    return {
      sheet: sheet,
      rowNo: i + 1,
      headerMap: headerMap,
      token: rowToken,
      eventId: String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim(),
      memberNo: normalizeMemberNo_(getCellByHeader_(values[i], headerMap, "業者番号")),
      companyName: String(getCellByHeader_(values[i], headerMap, "会社名") || "").trim(),
      mail: String(getCellByHeader_(values[i], headerMap, "メール") || "").trim(),
      targetType: String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim() || "会員",
      plannedId: String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim(),
      personalId: String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(values[i], headerMap, "参加者名") || "").trim(),
      receptionCategory: String(getCellByHeader_(values[i], headerMap, "受付区分") || "").trim(),
      block: String(getCellByHeader_(values[i], headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(values[i], headerMap, "支部") || "").trim(),
      usedAt: formatDateTimeForClient_(getCellByHeader_(values[i], headerMap, "使用日時"))
    };
  }

  return null;
}

function markLocationCheckinTokenUsed_(
  tokenRow,
  result
) {

  if (!tokenRow || !tokenRow.sheet) {
    return;
  }

  const now =
    new Date();

  const sheet =
    tokenRow.sheet;

  const headerMap =
    tokenRow.headerMap;

  sheet.getRange(tokenRow.rowNo, headerMap["更新日時"] + 1).setValue(now);

  if (result && result.ok) {
    sheet.getRange(tokenRow.rowNo, headerMap["使用日時"] + 1).setValue(now);
  }

  if (result && result.historyRowNo && headerMap["参加履歴行番号"] !== undefined) {
    sheet.getRange(tokenRow.rowNo, headerMap["参加履歴行番号"] + 1).setValue(result.historyRowNo);
  }

  if (headerMap["備考"] !== undefined) {
    sheet.getRange(tokenRow.rowNo, headerMap["備考"] + 1).setValue(result && result.message ? result.message : "");
  }
}

function calculateDistanceMeters_(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const rad =
    Math.PI / 180;

  const r =
    6371000;

  const dLat =
    (lat2 - lat1) * rad;

  const dLon =
    (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
    Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
