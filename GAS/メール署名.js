const MAIL_SIGNATURE_SHEET_NAME_ =
  "メール署名";

const MAIL_SIGNATURE_HEADERS_ =
  [
    "署名ID",
    "署名名",
    "署名本文",
    "有効",
    "備考",
    "作成日時",
    "更新日時"
  ];

function getMailSignaturesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result = {
      ok: true,
      signatures: getMailSignatures_()
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

function saveMailSignatureJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      saveMailSignature_(
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

function getMailSignatures_() {

  const sheet =
    getMailSignatureSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const list = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const signatureId =
      String(getCellByHeader_(row, headerMap, "署名ID") || "").trim();

    if (!signatureId) {
      continue;
    }

    list.push({
      signatureId: signatureId,
      signatureName: String(getCellByHeader_(row, headerMap, "署名名") || "").trim(),
      signatureBody: String(getCellByHeader_(row, headerMap, "署名本文") || ""),
      active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE",
      note: String(getCellByHeader_(row, headerMap, "備考") || ""),
      updatedAt: formatDateTimeForClient_(
        getCellByHeader_(row, headerMap, "更新日時")
      )
    });
  }

  return list;
}

function saveMailSignature_(
  params
) {

  const sheet =
    getMailSignatureSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  let signatureId =
    String(params.signatureId || "").trim();

  const signatureName =
    String(params.signatureName || "").trim();

  const signatureBody =
    String(params.signatureBody || "");

  if (!signatureName || !signatureBody.trim()) {
    throw new Error("署名名と署名本文を入力してください。");
  }

  if (!signatureId) {
    signatureId =
      getNextMailSignatureId_();
  }

  let rowNo = 0;

  for (let i = 1; i < values.length; i++) {

    const rowSignatureId =
      String(getCellByHeader_(values[i], headerMap, "署名ID") || "").trim();

    if (rowSignatureId === signatureId) {
      rowNo =
        i + 1;
      break;
    }
  }

  if (!rowNo) {
    rowNo =
      sheet.getLastRow() + 1;
    sheet.getRange(rowNo, headerMap["作成日時"] + 1).setValue(now);
  }

  sheet.getRange(rowNo, headerMap["署名ID"] + 1).setValue(signatureId);
  sheet.getRange(rowNo, headerMap["署名名"] + 1).setValue(signatureName);
  sheet.getRange(rowNo, headerMap["署名本文"] + 1).setValue(signatureBody);
  sheet.getRange(rowNo, headerMap["有効"] + 1).setValue(
    String(params.active || "TRUE").toUpperCase() === "FALSE"
      ? "FALSE"
      : "TRUE"
  );
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(
    String(params.note || "")
  );
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "メール署名を保存しました。",
    signatureId: signatureId
  };
}

function getMailSignatureBodyById_(
  signatureId
) {

  const targetId =
    String(signatureId || "").trim();

  if (!targetId) {
    return "";
  }

  const signatures =
    getMailSignatures_();

  for (let i = 0; i < signatures.length; i++) {

    if (
      signatures[i].signatureId === targetId &&
      signatures[i].active !== "FALSE"
    ) {
      return signatures[i].signatureBody || "";
    }
  }

  return "";
}

function getMailSignatureNameById_(
  signatureId
) {

  const targetId =
    String(signatureId || "").trim();

  if (!targetId) {
    return "";
  }

  const signatures =
    getMailSignatures_();

  for (let i = 0; i < signatures.length; i++) {
    if (
      signatures[i].signatureId === targetId &&
      signatures[i].active !== "FALSE"
    ) {
      return signatures[i].signatureName || "";
    }
  }

  return "";
}

function getNextMailSignatureId_() {

  const sheet =
    getMailSignatureSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  let maxNo = 0;

  for (let i = 1; i < values.length; i++) {

    const signatureId =
      String(getCellByHeader_(values[i], headerMap, "署名ID") || "").trim();

    const match =
      signatureId.match(/^MS-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(maxNo, Number(match[1]));
    }
  }

  return "MS-" +
    String(maxNo + 1).padStart(3, "0");
}

function getMailSignatureSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(MAIL_SIGNATURE_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(MAIL_SIGNATURE_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    MAIL_SIGNATURE_HEADERS_
  );

  return sheet;
}
