const CERTIFICATE_RULE_HEADERS_ = [
  "ルールID",
  "ルール名",
  "対象年度",
  "有効",
  "判定単位",
  "対象外参加の扱い",
  "証書タイトル",
  "証書本文",
  "発行者団体名",
  "発行者役職",
  "発行者肩書",
  "発行者氏名",
  "PDF様式",
  "備考",
  "作成日時",
  "更新日時",
  "プレビューPDFファイルID",
  "プレビューPDFURL",
  "プレビュー元更新日時",
  "プレビュー作成日時"
];

const CERTIFICATE_CONDITION_HEADERS_ = [
  "ルールID",
  "条件番号",
  "条件タイプ",
  "必要回数",
  "必須研修判定",
  "対象主催区分",
  "対象ブロック",
  "対象支部",
  "対象地区",
  "対象組織ID",
  "対象研修ID"
];

function jsonpOutput_(e, result) {

  const callback =
    e.parameter.callback || "callback";

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getOrCreateSheetWithHeaders_(sheetName, headers) {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet =
      ss.insertSheet(sheetName);
  }

  ensureHeaders_(
    sheet,
    headers
  );

  return sheet;
}

function getNextCertificateRuleId_() {

  const sheet =
    getOrCreateSheetWithHeaders_(
      "修了証ルール",
      CERTIFICATE_RULE_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const ruleIdCol =
    headerMap["ルールID"];

  let maxNo =
    0;

  for (let i = 1; i < values.length; i++) {

    const ruleId =
      String(values[i][ruleIdCol] || "").trim();

    const match =
      ruleId.match(/^CR-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(
          maxNo,
          Number(match[1])
        );
    }
  }

  return "CR-" + String(maxNo + 1).padStart(3, "0");
}

function getCertificateRulesJsonp_(e) {

  try {

    const result =
      getCertificateRules_();

    return jsonpOutput_(
      e,
      {
        ok: true,
        rules: result
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

function getCertificateRules_() {

  const ruleSheet =
    getOrCreateSheetWithHeaders_(
      "修了証ルール",
      CERTIFICATE_RULE_HEADERS_
    );

  const conditionSheet =
    getOrCreateSheetWithHeaders_(
      "修了証条件",
      CERTIFICATE_CONDITION_HEADERS_
    );

  const ruleValues =
    ruleSheet.getDataRange().getValues();

  const conditionValues =
    conditionSheet.getDataRange().getValues();

  const ruleHeaderMap =
    getHeaderMap_(ruleSheet);

  const conditionHeaderMap =
    getHeaderMap_(conditionSheet);

  const conditionMap =
    {};

  for (let i = 1; i < conditionValues.length; i++) {

    const row =
      conditionValues[i];

    const ruleId =
      String(getCellByHeader_(row, conditionHeaderMap, "ルールID") || "").trim();

    if (!ruleId) {
      continue;
    }

    if (!conditionMap[ruleId]) {
      conditionMap[ruleId] = [];
    }

    conditionMap[ruleId].push({
      conditionType: String(getCellByHeader_(row, conditionHeaderMap, "条件タイプ") || "count"),
      requiredCount: String(getCellByHeader_(row, conditionHeaderMap, "必要回数") || "1"),
      requiredMode: String(getCellByHeader_(row, conditionHeaderMap, "必須研修判定") || "all"),
      targetHostType: String(getCellByHeader_(row, conditionHeaderMap, "対象主催区分") || ""),
      targetBlock: String(getCellByHeader_(row, conditionHeaderMap, "対象ブロック") || ""),
      targetBranch: String(getCellByHeader_(row, conditionHeaderMap, "対象支部") || ""),
      targetDistrict: String(getCellByHeader_(row, conditionHeaderMap, "対象地区") || ""),
      targetOrgIds: String(getCellByHeader_(row, conditionHeaderMap, "対象組織ID") || ""),
      targetEventIds: String(getCellByHeader_(row, conditionHeaderMap, "対象研修ID") || "")
    });
  }

  const rules =
    [];

  for (let i = 1; i < ruleValues.length; i++) {

    const row =
      ruleValues[i];

    const ruleId =
      String(getCellByHeader_(row, ruleHeaderMap, "ルールID") || "").trim();

    if (!ruleId) {
      continue;
    }

    rules.push({
      ruleId: ruleId,
      ruleName: String(getCellByHeader_(row, ruleHeaderMap, "ルール名") || ""),
      targetYear: String(getCellByHeader_(row, ruleHeaderMap, "対象年度") || ""),
      active: String(getCellByHeader_(row, ruleHeaderMap, "有効") || "TRUE"),
      judgmentUnit: String(getCellByHeader_(row, ruleHeaderMap, "判定単位") || "会社単位"),
      outsideAttendanceMode: normalizeCertificateOutsideAttendanceMode_(
        getCellByHeader_(row, ruleHeaderMap, "対象外参加の扱い")
      ),
      certificateTitle: String(getCellByHeader_(row, ruleHeaderMap, "証書タイトル") || ""),
      certificateBody: String(getCellByHeader_(row, ruleHeaderMap, "証書本文") || ""),
      issuerOrganization: String(getCellByHeader_(row, ruleHeaderMap, "発行者団体名") || getCellByHeader_(row, ruleHeaderMap, "発行者肩書") || ""),
      issuerPosition: String(getCellByHeader_(row, ruleHeaderMap, "発行者役職") || ""),
      issuerTitle: String(getCellByHeader_(row, ruleHeaderMap, "発行者肩書") || ""),
      issuerName: String(getCellByHeader_(row, ruleHeaderMap, "発行者氏名") || ""),
      pdfTemplate: String(getCellByHeader_(row, ruleHeaderMap, "PDF様式") || "standard"),
      note: String(getCellByHeader_(row, ruleHeaderMap, "備考") || ""),
      updatedAt: String(getCellByHeader_(row, ruleHeaderMap, "更新日時") || ""),
      previewFileId: String(getCellByHeader_(row, ruleHeaderMap, "プレビューPDFファイルID") || ""),
      previewPdfUrl: String(getCellByHeader_(row, ruleHeaderMap, "プレビューPDFURL") || ""),
      previewSourceUpdatedAt: String(getCellByHeader_(row, ruleHeaderMap, "プレビュー元更新日時") || ""),
      previewCreatedAt: String(getCellByHeader_(row, ruleHeaderMap, "プレビュー作成日時") || ""),
      conditions: conditionMap[ruleId] || []
    });
  }

  return rules;
}

function normalizeCertificateOutsideAttendanceMode_(
  value
) {

  const text =
    String(value || "").trim();

  if (
    text === "含める" ||
    text === "include" ||
    text === "INCLUDE"
  ) {
    return "含める";
  }

  return "含めない";
}

function saveCertificateRuleJsonp_(e) {

  try {

    const result =
      saveCertificateRule_(e.parameter);

    return jsonpOutput_(
      e,
      result
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

function saveCertificateRule_(params) {

  const ruleSheet =
    getOrCreateSheetWithHeaders_(
      "修了証ルール",
      CERTIFICATE_RULE_HEADERS_
    );

  const conditionSheet =
    getOrCreateSheetWithHeaders_(
      "修了証条件",
      CERTIFICATE_CONDITION_HEADERS_
    );

  const now =
    new Date();

  let ruleId =
    String(params.ruleId || "").trim();

  const ruleName =
    String(params.ruleName || "").trim();

  if (!ruleName) {
    throw new Error("ルール名を入力してください。");
  }

  if (!ruleId) {
    ruleId =
      getNextCertificateRuleId_();
  }

  const conditions =
    JSON.parse(params.conditionsJson || "[]");

  if (!conditions.length) {
    throw new Error("条件を1つ以上登録してください。");
  }

  const ruleHeaderMap =
    getHeaderMap_(ruleSheet);

  const ruleValues =
    ruleSheet.getDataRange().getValues();

  let targetRowNo =
    0;

  for (let i = 1; i < ruleValues.length; i++) {

    const existingRuleId =
      String(getCellByHeader_(ruleValues[i], ruleHeaderMap, "ルールID") || "").trim();

    if (existingRuleId === ruleId) {
      targetRowNo =
        i + 1;
      break;
    }
  }

  if (!targetRowNo) {
    targetRowNo =
      ruleSheet.getLastRow() + 1;

    ruleSheet
      .getRange(targetRowNo, ruleHeaderMap["作成日時"] + 1)
      .setValue(now);
  }

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["ルールID"] + 1)
    .setValue(ruleId);

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["ルール名"] + 1)
    .setValue(ruleName);

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["対象年度"] + 1)
    .setValue(String(params.targetYear || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["有効"] + 1)
    .setValue(String(params.active || "TRUE").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["判定単位"] + 1)
    .setValue(String(params.judgmentUnit || "会社単位").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["対象外参加の扱い"] + 1)
    .setValue(normalizeCertificateOutsideAttendanceMode_(params.outsideAttendanceMode));

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["証書タイトル"] + 1)
    .setValue(String(params.certificateTitle || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["証書本文"] + 1)
    .setValue(String(params.certificateBody || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["発行者団体名"] + 1)
    .setValue(String(params.issuerOrganization || params.issuerTitle || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["発行者役職"] + 1)
    .setValue(String(params.issuerPosition || "").trim());
    
  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["発行者肩書"] + 1)
    .setValue(String(params.issuerTitle || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["発行者氏名"] + 1)
    .setValue(String(params.issuerName || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["PDF様式"] + 1)
    .setValue(String(params.pdfTemplate || "standard").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["備考"] + 1)
    .setValue(String(params.note || "").trim());

  ruleSheet
    .getRange(targetRowNo, ruleHeaderMap["更新日時"] + 1)
    .setValue(now);

  deleteCertificateConditions_(ruleId);

  saveCertificateConditions_(
    ruleId,
    conditions
  );

  return {
    ok: true,
    message: "修了証ルールを保存しました。",
    ruleId: ruleId
  };
}

function deleteCertificateConditions_(ruleId) {

  const sheet =
    getOrCreateSheetWithHeaders_(
      "修了証条件",
      CERTIFICATE_CONDITION_HEADERS_
    );

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 1; i--) {

    const rowRuleId =
      String(getCellByHeader_(values[i], headerMap, "ルールID") || "").trim();

    if (rowRuleId === ruleId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function saveCertificateConditions_(
  ruleId,
  conditions
) {

  const sheet =
    getOrCreateSheetWithHeaders_(
      "修了証条件",
      CERTIFICATE_CONDITION_HEADERS_
    );

  conditions.forEach(function(condition, index) {

    sheet.appendRow([
      ruleId,
      index + 1,
      String(condition.conditionType || "count"),
      String(condition.requiredCount || "1"),
      String(condition.requiredMode || "all"),
      String(condition.targetHostType || ""),
      String(condition.targetBlock || ""),
      String(condition.targetBranch || ""),
      String(condition.targetDistrict || ""),
      String(condition.targetOrgIds || ""),
      String(condition.targetEventIds || "")
    ]);
  });
}

const CERTIFICATE_ISSUER_HEADERS_ = [
  "発行者ID",
  "役職名",
  "発行者団体名",
  "発行者役職",
  "発行者肩書",
  "発行者氏名",
  "有効",
  "備考",
  "作成日時",
  "更新日時"
];

function getNextCertificateIssuerId_() {
  const sheet = getOrCreateSheetWithHeaders_("修了証発行者", CERTIFICATE_ISSUER_HEADERS_);
  const values = sheet.getDataRange().getValues();
  const headerMap = getHeaderMap_(sheet);
  const issuerIdCol = headerMap["発行者ID"];

  let maxNo = 0;

  for (let i = 1; i < values.length; i++) {
    const issuerId = String(values[i][issuerIdCol] || "").trim();
    const match = issuerId.match(/^CI-(\d+)$/);

    if (match) {
      maxNo = Math.max(maxNo, Number(match[1]));
    }
  }

  return "CI-" + String(maxNo + 1).padStart(3, "0");
}

function getCertificateIssuersJsonp_(e) {
  try {
    return jsonpOutput_(e, {
      ok: true,
      issuers: getCertificateIssuers_()
    });
  } catch (err) {
    return jsonpOutput_(e, {
      ok: false,
      message: err.message
    });
  }
}

function getCertificateIssuers_() {
  const sheet = getOrCreateSheetWithHeaders_("修了証発行者", CERTIFICATE_ISSUER_HEADERS_);
  const values = sheet.getDataRange().getValues();
  const headerMap = getHeaderMap_(sheet);

  const issuers = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const issuerId = String(getCellByHeader_(row, headerMap, "発行者ID") || "").trim();

    if (!issuerId) {
      continue;
    }

    issuers.push({
      issuerId: issuerId,
      roleName: String(getCellByHeader_(row, headerMap, "役職名") || ""),
      issuerOrganization: String(getCellByHeader_(row, headerMap, "発行者団体名") || getCellByHeader_(row, headerMap, "発行者肩書") || ""),
      issuerPosition: String(getCellByHeader_(row, headerMap, "発行者役職") || ""),
      issuerTitle: String(getCellByHeader_(row, headerMap, "発行者肩書") || ""),
      issuerName: String(getCellByHeader_(row, headerMap, "発行者氏名") || ""),
      active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE"),
      note: String(getCellByHeader_(row, headerMap, "備考") || ""),
      updatedAt: String(getCellByHeader_(row, headerMap, "更新日時") || "")
    });
  }

  return issuers;
}

function saveCertificateIssuerJsonp_(e) {
  try {
    return jsonpOutput_(e, saveCertificateIssuer_(e.parameter));
  } catch (err) {
    return jsonpOutput_(e, {
      ok: false,
      message: err.message
    });
  }
}

function saveCertificateIssuer_(params) {
  const sheet = getOrCreateSheetWithHeaders_("修了証発行者", CERTIFICATE_ISSUER_HEADERS_);
  const now = new Date();

  let issuerId = String(params.issuerId || "").trim();
  const roleName = String(params.roleName || "").trim();
  const issuerOrganization =
    String(params.issuerOrganization || params.issuerTitle || "").trim();

  const issuerPosition =
    String(params.issuerPosition || "").trim();

  const issuerTitle =
    String(params.issuerTitle || issuerOrganization || "").trim();

  const issuerName =
    String(params.issuerName || "").trim();

  if (!roleName || !issuerOrganization || !issuerPosition || !issuerName) {
    throw new Error("役職名、発行者団体名、発行者役職、発行者氏名を入力してください。");
  }

  if (!issuerId) {
    issuerId = getNextCertificateIssuerId_();
  }

  const headerMap = getHeaderMap_(sheet);
  const values = sheet.getDataRange().getValues();

  let rowNo = 0;

  for (let i = 1; i < values.length; i++) {
    const existingIssuerId = String(getCellByHeader_(values[i], headerMap, "発行者ID") || "").trim();

    if (existingIssuerId === issuerId) {
      rowNo = i + 1;
      break;
    }
  }

  if (!rowNo) {
    rowNo = sheet.getLastRow() + 1;
    sheet.getRange(rowNo, headerMap["作成日時"] + 1).setValue(now);
  }

  sheet.getRange(rowNo, headerMap["発行者ID"] + 1).setValue(issuerId);
  sheet.getRange(rowNo, headerMap["役職名"] + 1).setValue(roleName);
  sheet.getRange(rowNo, headerMap["発行者団体名"] + 1).setValue(issuerOrganization);
  sheet.getRange(rowNo, headerMap["発行者役職"] + 1).setValue(issuerPosition);
  sheet.getRange(rowNo, headerMap["発行者肩書"] + 1).setValue(issuerTitle);
  sheet.getRange(rowNo, headerMap["発行者氏名"] + 1).setValue(issuerName);
  sheet.getRange(rowNo, headerMap["有効"] + 1).setValue(String(params.active || "TRUE").trim());
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(String(params.note || "").trim());
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "修了証発行者を保存しました。",
    issuerId: issuerId
  };
}
