function createCertificatePdfByRow_(rowNo) {

  if (!rowNo || rowNo < 2) {
    throw new Error("対象行が不正です。");
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("修了証対象");

  if (!sheet) {
    throw new Error("修了証対象シートがありません。");
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const row =
    sheet.getRange(rowNo, 1, 1, sheet.getLastColumn())
      .getValues()[0];

  const memberNo =
    String(getCellByHeader_(row, headerMap, "業者番号") || "").replace(".0", "").trim();

  const companyName =
    String(getCellByHeader_(row, headerMap, "会社名") || "").trim();

  const judgmentUnit =
    String(getCellByHeader_(row, headerMap, "判定単位") || "会社単位").trim();

  const participantName =
    String(getCellByHeader_(row, headerMap, "参加者名") || "").trim();

  const attendCount =
    getCellByHeader_(row, headerMap, "参加回数");

  const eventIdsText =
    String(getCellByHeader_(row, headerMap, "参加研修ID") || "").trim();

  const target =
    String(getCellByHeader_(row, headerMap, "修了証発行対象") || "").toUpperCase() === "FALSE"
      ? "FALSE"
      : "TRUE";

  const existingPdfFileId =
    String(getCellByHeader_(row, headerMap, "PDFファイルID") || "").trim();

  const ruleId =
    String(getCellByHeader_(row, headerMap, "ルールID") || "").trim();

  const rule =
    ruleId
      ? getCertificateRuleById_(ruleId)
      : null;
      
  if (!memberNo || !companyName) {
    throw new Error("業者番号または会社名が空です。");
  }

  if (target !== "TRUE") {
    throw new Error("修了証発行対象ではありません。");
  }

  if (existingPdfFileId) {
    throw new Error("既にPDF発行済みです。");
  }

  const eventIds =
    eventIdsText
      ? eventIdsText.split(",").map(function(v) {
          return String(v || "").trim();
        }).filter(function(v) {
          return v !== "";
        })
      : [];

  const trainingNames =
    getTrainingNamesByIds_(
      eventIds
    );

  const trainingSummaryText =
    getCertificateTrainingSummaryText_(
      trainingNames,
      rule,
      attendCount
    );

  const templateFile =
    getCertificateTemplateFile_();

  const folder =
    getCertificateFolder_();

  const copiedFile =
    templateFile.makeCopy(
      "修了証_" + getCertificateFileNameBase_(companyName, participantName, judgmentUnit),
      folder
    );

  const presentation =
    SlidesApp.openById(
      copiedFile.getId()
    );

  const replaceMap = {
    "{{証書タイトル}}": rule && rule.certificateTitle ? rule.certificateTitle : "修了証",
    "{{会社名}}": getCertificateRecipientName_(companyName, participantName, judgmentUnit),
    "{{証書本文}}": rule && rule.certificateBody ? rule.certificateBody : "貴社は所定の研修に参加されましたので、ここに修了証を授与します。",
    "{{参加研修一覧}}": trainingSummaryText,
    "{{発行日}}": Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy年M月d日"
    ),
    "{{発行者団体名}}": rule && rule.issuerOrganization ? rule.issuerOrganization : "東京都宅地建物取引業協会 第十ブロック",
    "{{発行者役職}}": rule && rule.issuerPosition ? rule.issuerPosition : "ブロック長",
    "{{発行者肩書}}": rule && rule.issuerTitle ? rule.issuerTitle : "東京都宅地建物取引業協会 第十ブロック",
    "{{発行者氏名}}": rule && rule.issuerName ? rule.issuerName : getCertificateRepresentativeName_()
  };

  Object.keys(replaceMap).forEach(function(key) {

    presentation.replaceAllText(
      key,
      replaceMap[key]
    );

  });

  presentation.saveAndClose();

  const pdfBlob =
    DriveApp
      .getFileById(copiedFile.getId())
      .getAs(
        MimeType.PDF
      );

  pdfBlob.setName(
    "修了証_" + getCertificateFileNameBase_(companyName, participantName, judgmentUnit) + ".pdf"
  );

  const pdfFile =
    folder.createFile(
      pdfBlob
    );

  pdfFile.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW
  );

  sheet.getRange(rowNo, 7).setValue(
    pdfFile.getId()
  );

  sheet.getRange(rowNo, 8).setValue(
    pdfFile.getUrl()
  );

  sheet.getRange(rowNo, 9).setValue(
    new Date()
  );

  copiedFile.setTrashed(
    true
  );
}

function getCertificateTrainingSummaryText_(
  trainingNames,
  rule,
  attendCount
) {

  const names =
    trainingNames || [];

  const count =
    Number(attendCount || names.length || 0);

  if (names.length > 0 && names.length <= 3) {
    return names.join("\n");
  }

  const lines =
    [];

  if (rule && rule.ruleName) {
    lines.push(
      rule.ruleName
    );
  }

  if (count > 0) {
    lines.push(
      "所定の研修 " + count + "回"
    );
  } else {
    lines.push(
      "所定の研修"
    );
  }

  return lines.join("\n");
}

function getCertificateRecipientName_(
  companyName,
  participantName,
  judgmentUnit
) {

  if (
    judgmentUnit === "個人単位" &&
    participantName
  ) {
    return participantName;
  }

  return companyName;
}

function getCertificateFileNameBase_(
  companyName,
  participantName,
  judgmentUnit
) {

  if (
    judgmentUnit === "個人単位" &&
    participantName
  ) {
    return companyName + "_" + participantName;
  }

  return companyName;
}

function getCertificateTemplateFile_() {

  const templateId =
    getConfig_(
      "CERTIFICATE_TEMPLATE_SLIDE_ID"
    );

  if (!templateId) {
    throw new Error("CERTIFICATE_TEMPLATE_SLIDE_ID が設定されていません。修了証テンプレートのGoogleスライドIDを確認してください。");
  }

  try {
    return DriveApp.getFileById(
      templateId
    );
  } catch (err) {
    throw new Error("修了証テンプレートを開けません。CERTIFICATE_TEMPLATE_SLIDE_ID のID、または協会アカウントへの共有権限を確認してください。ID: " + templateId);
  }
}

function getCertificateFolder_() {

  const folderId =
    getConfig_(
      "CERTIFICATE_FOLDER_ID"
    );

  if (!folderId) {
    throw new Error("CERTIFICATE_FOLDER_ID が設定されていません。修了証PDFの保存先フォルダIDを確認してください。");
  }

  try {
    return DriveApp.getFolderById(
      folderId
    );
  } catch (err) {
    throw new Error("修了証PDFの保存先フォルダを開けません。CERTIFICATE_FOLDER_ID のID、または協会アカウントへの共有権限を確認してください。ID: " + folderId);
  }
}

function createCertificateTargetsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    createCertificateTargets(e.parameter);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getCertificateTargetsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getCertificateTargets_(e.parameter);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getCertificateTargets_(params) {

  params =
    params || {};

  const selectedRuleId =
    String(params.ruleId || "").trim();

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("修了証対象");

  if (!sheet) {
    return {
      ok: true,
      targets: []
    };
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const targets = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const rowRuleId =
      String(getCellByHeader_(row, headerMap, "ルールID") || "").trim();

    if (
      selectedRuleId &&
      rowRuleId !== selectedRuleId
    ) {
      continue;
    }

    targets.push({
      rowNo: i + 1,
      createdAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "作成日時")),
      memberNo: String(getCellByHeader_(row, headerMap, "業者番号") || "").replace(".0", ""),
      companyName: getCellByHeader_(row, headerMap, "会社名"),
      count: getCellByHeader_(row, headerMap, "参加回数"),
      eventIds: getCellByHeader_(row, headerMap, "参加研修ID"),
      target: getCellByHeader_(row, headerMap, "修了証発行対象"),
      pdfFileId: String(getCellByHeader_(row, headerMap, "PDFファイルID") || ""),
      pdfUrl: getCellByHeader_(row, headerMap, "PDFURL") || "",
      issuedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "発行日時")),
      sendTarget: String(getCellByHeader_(row, headerMap, "送信対象") || ""),
      sentAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "送信日時")),
      sendResult: String(getCellByHeader_(row, headerMap, "送信結果") || ""),
      sendToMail: String(getCellByHeader_(row, headerMap, "送信先メール") || ""),
      hidden: String(getCellByHeader_(row, headerMap, "非表示") || ""),
      note: String(getCellByHeader_(row, headerMap, "備考") || ""),
      ruleId: String(getCellByHeader_(row, headerMap, "ルールID") || ""),
      ruleName: String(getCellByHeader_(row, headerMap, "ルール名") || ""),
      certificateTitle: String(getCellByHeader_(row, headerMap, "証書タイトル") || ""),
      pdfTemplate: String(getCellByHeader_(row, headerMap, "PDF様式") || ""),
      judgmentUnit: String(getCellByHeader_(row, headerMap, "判定単位") || "会社単位"),
      personalId: String(getCellByHeader_(row, headerMap, "個人ID") || ""),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "")
    });
  }

  return {
    ok: true,
    targets: targets
  };
}


function createCertificatePdfJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const rowNo =
    Number(e.parameter.rowNo || 0);

  let result;

  try {

    createCertificatePdfByRow_(rowNo);

    result = {
      ok: true,
      message: "PDFを発行しました。"
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

function sendCertificatePdfJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      sendCertificatePdfByRow_(
        Number(e.parameter.rowNo || 0),
        {
          force: String(e.parameter.force || "").toUpperCase() === "TRUE"
        }
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

function sendCertificatePdfBulkJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      sendCertificatePdfBulk_(
        {
          ruleId: String(e.parameter.ruleId || "").trim(),
          rowNos: String(e.parameter.rowNos || "").trim(),
          onlyUnsent: String(e.parameter.onlyUnsent || "TRUE").toUpperCase() !== "FALSE"
        }
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

function sendCertificatePdfBulk_(options) {

  options =
    options || {};

  const targets =
    getCertificateTargets_(
      {
        ruleId: options.ruleId || ""
      }
    ).targets || [];

  const rowNoMap = {};

  if (options.rowNos) {
    options.rowNos
      .split(",")
      .map(function(value) {
        return Number(value || 0);
      })
      .filter(function(value) {
        return value > 1;
      })
      .forEach(function(rowNo) {
        rowNoMap[rowNo] =
          true;
      });
  }

  let sent =
    0;

  let skipped =
    0;

  let failed =
    0;

  const messages =
    [];

  targets.forEach(function(target) {

    if (
      options.rowNos &&
      !rowNoMap[Number(target.rowNo || 0)]
    ) {
      return;
    }

    if (!target.rowNo || !target.pdfUrl) {
      skipped++;
      return;
    }

    if (
      options.onlyUnsent &&
      target.sentAt
    ) {
      skipped++;
      return;
    }

    const result =
      sendCertificatePdfByRow_(
        target.rowNo,
        {
          force: true
        }
      );

    if (result.ok) {
      sent++;
    } else {
      failed++;
      messages.push(
        (target.companyName || target.memberNo || target.rowNo) + ": " + result.message
      );
    }
  });

  return {
    ok: failed === 0,
    message:
      "修了証PDFの送信処理が完了しました。送信 " +
      sent +
      "件、スキップ " +
      skipped +
      "件、失敗 " +
      failed +
      "件",
    sent: sent,
    skipped: skipped,
    failed: failed,
    errors: messages.slice(0, 20)
  };
}

function sendCertificatePdfByRow_(rowNo, options) {

  options =
    options || {};

  if (!rowNo || rowNo < 2) {
    throw new Error("対象行が不正です。");
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("修了証対象");

  if (!sheet) {
    throw new Error("修了証対象シートがありません。");
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const row =
    sheet
      .getRange(rowNo, 1, 1, sheet.getLastColumn())
      .getValues()[0];

  const memberNo =
    String(getCellByHeader_(row, headerMap, "業者番号") || "")
      .replace(".0", "")
      .trim();

  const companyName =
    String(getCellByHeader_(row, headerMap, "会社名") || "").trim();

  const pdfFileId =
    String(getCellByHeader_(row, headerMap, "PDFファイルID") || "").trim();

  const sentAt =
    getCellByHeader_(row, headerMap, "送信日時");

  if (!memberNo || !companyName) {
    throw new Error("業者番号または会社名が空です。");
  }

  if (!pdfFileId) {
    return updateCertificateSendResult_(
      sheet,
      headerMap,
      rowNo,
      "",
      "PDF未作成"
    );
  }

  if (
    sentAt &&
    !options.force
  ) {
    return {
      ok: true,
      skipped: true,
      message: "送信済みのためスキップしました。"
    };
  }

  const sendTo =
    getCertificateSendToMail_(
      row,
      headerMap,
      memberNo
    );

  if (!sendTo) {
    return updateCertificateSendResult_(
      sheet,
      headerMap,
      rowNo,
      "",
      "送信先メールなし"
    );
  }

  let file;

  try {
    file =
      DriveApp.getFileById(
        pdfFileId
      );
  } catch (err) {
    return updateCertificateSendResult_(
      sheet,
      headerMap,
      rowNo,
      sendTo,
      "PDFファイルを開けません: " + err.message
    );
  }

  const subject =
    getCertificateMailSubject_(
      row,
      headerMap
    );

  const body =
    getCertificateMailBody_(
      row,
      headerMap,
      getCertificateRecipientName_(
        companyName,
        String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
        String(getCellByHeader_(row, headerMap, "判定単位") || "会社単位").trim()
      )
    );

  try {

    GmailApp.sendEmail(
      sendTo,
      subject,
      body,
      {
        attachments: [
          file.getBlob()
        ],
        name: getCertificateMailFromName_()
      }
    );

  } catch (err) {
    return updateCertificateSendResult_(
      sheet,
      headerMap,
      rowNo,
      sendTo,
      "送信失敗: " + err.message
    );
  }

  return updateCertificateSendResult_(
    sheet,
    headerMap,
    rowNo,
    sendTo,
    "送信済み",
    new Date()
  );
}

function getCertificateSendToMail_(
  row,
  headerMap,
  memberNo
) {

  const sheetMail =
    String(getCellByHeader_(row, headerMap, "送信先メール") || "").trim();

  if (sheetMail) {
    return sheetMail;
  }

  const members =
    getMemberRowsFromMaster_();

  for (let i = 0; i < members.length; i++) {

    if (
      String(members[i].memberNo || "").replace(".0", "").trim() === memberNo
    ) {
      return String(members[i].mail || "").trim();
    }
  }

  return "";
}

function getCertificateMailSubject_(
  row,
  headerMap
) {

  const title =
    String(getCellByHeader_(row, headerMap, "証書タイトル") || "修了証").trim();

  return title + "送付のご案内";
}

function getCertificateMailBody_(
  row,
  headerMap,
  recipientName
) {

  const title =
    String(getCellByHeader_(row, headerMap, "証書タイトル") || "修了証").trim();

  const issuerOrganization =
    getCertificateMailIssuerOrganization_(
      row,
      headerMap
    );

  const judgmentUnit =
    String(getCellByHeader_(row, headerMap, "判定単位") || "会社単位").trim();

  const completionLine =
    judgmentUnit === "個人単位"
      ? "所定の研修にご参加いただき、"
      : "貴社におかれましては、所定の研修にご参加いただき、";

  const lines = [
    recipientName + " 様",
    "",
    "いつもお世話になっております。",
    issuerOrganization + "です。",
    "",
    completionLine,
    "修了要件を満たされましたので、" + title + "をPDFにてお送りいたします。",
    "",
    "添付の" + title + "をご確認くださいますようお願い申し上げます。",
    "",
    "今後ともよろしくお願い申し上げます。",
    "",
    issuerOrganization
  ];

  return lines.join("\n");
}

function getCertificateMailIssuerOrganization_(
  row,
  headerMap
) {

  const ruleId =
    String(getCellByHeader_(row, headerMap, "ルールID") || "").trim();

  const rule =
    ruleId
      ? getCertificateRuleById_(ruleId)
      : null;

  return rule && rule.issuerOrganization
    ? rule.issuerOrganization
    : "東京都宅地建物取引業協会 第十ブロック";
}

function getCertificateMailFromName_() {

  const properties =
    PropertiesService
      .getScriptProperties();

  return properties.getProperty("CERTIFICATE_MAIL_FROM_NAME") ||
    properties.getProperty("MAIL_FROM_NAME_BLOCK10") ||
    "宅建 第十ブロック";
}

function updateCertificateSendResult_(
  sheet,
  headerMap,
  rowNo,
  sendTo,
  resultText,
  sentAt
) {

  if (headerMap["送信先メール"] !== undefined) {
    sheet
      .getRange(rowNo, headerMap["送信先メール"] + 1)
      .setValue(sendTo || "");
  }

  if (headerMap["送信結果"] !== undefined) {
    sheet
      .getRange(rowNo, headerMap["送信結果"] + 1)
      .setValue(resultText || "");
  }

  if (
    sentAt &&
    headerMap["送信日時"] !== undefined
  ) {
    sheet
      .getRange(rowNo, headerMap["送信日時"] + 1)
      .setValue(sentAt);
  }

  return {
    ok: resultText === "送信済み",
    message: resultText,
    sendToMail: sendTo || "",
    sentAt: sentAt ? formatDateTimeForClient_(sentAt) : ""
  };
}

function previewCertificatePdfJsonp_(e) {

  try {

    const params =
      e.parameter || {};

    const ruleId =
      String(params.ruleId || "").trim();

    const forceCreate =
      String(params.forceCreate || "").toUpperCase() === "TRUE";

    if (!ruleId) {
      throw new Error("ルールIDが指定されていません。");
    }

    const ruleSheet =
      getOrCreateSheetWithHeaders_(
        "修了証ルール",
        CERTIFICATE_RULE_HEADERS_
      );

    const ruleHeaderMap =
      getHeaderMap_(ruleSheet);

    const ruleValues =
      ruleSheet.getDataRange().getValues();

    let ruleRowNo =
      0;

    let ruleRow =
      null;

    for (let i = 1; i < ruleValues.length; i++) {

      const rowRuleId =
        String(getCellByHeader_(ruleValues[i], ruleHeaderMap, "ルールID") || "").trim();

      if (rowRuleId === ruleId) {
        ruleRowNo =
          i + 1;

        ruleRow =
          ruleValues[i];

        break;
      }
    }

    if (!ruleRowNo || !ruleRow) {
      throw new Error("修了証ルールが見つかりません。");
    }

    const updatedAt =
      String(getCellByHeader_(ruleRow, ruleHeaderMap, "更新日時") || "");

    const previewPdfUrl =
      String(getCellByHeader_(ruleRow, ruleHeaderMap, "プレビューPDFURL") || "");

    const previewSourceUpdatedAt =
      String(getCellByHeader_(ruleRow, ruleHeaderMap, "プレビュー元更新日時") || "");

    if (
      !forceCreate &&
      previewPdfUrl &&
      previewSourceUpdatedAt === updatedAt
    ) {
      return jsonpOutput_(
        e,
        {
          ok: true,
          url: previewPdfUrl,
          previewPdfUrl: previewPdfUrl,
          reused: true,
          message: "保存済みのPDFプレビューを開きます。"
        }
      );
    }

    const url =
      createCertificatePreviewPdf_(params);

    ruleSheet
      .getRange(ruleRowNo, ruleHeaderMap["プレビューPDFURL"] + 1)
      .setValue(url);

    ruleSheet
      .getRange(ruleRowNo, ruleHeaderMap["プレビュー元更新日時"] + 1)
      .setValue(updatedAt);

    ruleSheet
      .getRange(ruleRowNo, ruleHeaderMap["プレビュー作成日時"] + 1)
      .setValue(new Date());

    return jsonpOutput_(
      e,
      {
        ok: true,
        url: url,
        previewPdfUrl: url,
        reused: false,
        message: "PDFプレビューを作成しました。"
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


function createCertificatePreviewPdf_(params) {

  const previewData =
    getCertificatePreviewData_(params);

  const templateFile =
    getCertificateTemplateFile_();

  const folder =
    getCertificateFolder_();

  const copiedFile =
    templateFile.makeCopy(
      "修了証プレビュー_" +
      Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyyMMdd_HHmmss"),
      folder
    );

  const presentation =
    SlidesApp.openById(
      copiedFile.getId()
    );

  const replaceMap = {
    "{{証書タイトル}}": previewData.certificateTitle,
    "{{会社名}}": "株式会社サンプル",
    "{{証書本文}}": previewData.certificateBody,
    "{{参加研修一覧}}": "第1回 サンプル研修\n第2回 サンプル研修",
    "{{発行日}}": Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy年M月d日"
    ),
    "{{発行者団体名}}": previewData.issuerOrganization,
    "{{発行者役職}}": previewData.issuerPosition,
    "{{発行者肩書}}": previewData.issuerTitle,
    "{{発行者氏名}}": previewData.issuerName
  };

  Object.keys(replaceMap).forEach(function(key) {
    presentation.replaceAllText(
      key,
      replaceMap[key]
    );
  });

  presentation.saveAndClose();

  const pdfBlob =
    DriveApp
      .getFileById(copiedFile.getId())
      .getAs(MimeType.PDF);

  pdfBlob.setName(
    "修了証プレビュー.pdf"
  );

  const pdfFile =
    folder.createFile(pdfBlob);

  pdfFile.setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW
  );

  copiedFile.setTrashed(true);

  return pdfFile.getUrl();
}

function getCertificatePreviewData_(params) {

  const ruleId =
    String(params.ruleId || "").trim();

  if (ruleId) {

    const rule =
      getCertificateRuleById_(ruleId);

    if (!rule) {
      throw new Error("修了証ルールが見つかりません: " + ruleId);
    }

    return {
      certificateTitle:
        rule.certificateTitle || "修了証",
      certificateBody:
        rule.certificateBody || "貴社は所定の研修に参加されましたので、ここに修了証を授与します。",
      issuerOrganization:
        rule.issuerOrganization || rule.issuerTitle || "",
      issuerPosition:
        rule.issuerPosition || "",
      issuerTitle:
        rule.issuerTitle || rule.issuerOrganization || "",
      issuerName:
        rule.issuerName || "",
      pdfTemplate:
        rule.pdfTemplate || "standard"
    };
  }

  return {
    certificateTitle:
      String(params.certificateTitle || "修了証").trim(),
    certificateBody:
      String(params.certificateBody || "貴社は所定の研修に参加されましたので、ここに修了証を授与します。").trim(),
    issuerOrganization:
      String(params.issuerOrganization || params.issuerTitle || "").trim(),
    issuerPosition:
      String(params.issuerPosition || "").trim(),
    issuerTitle:
      String(params.issuerTitle || params.issuerOrganization || "").trim(),
    issuerName:
      String(params.issuerName || "").trim(),
    pdfTemplate:
      String(params.pdfTemplate || "standard").trim()
  };
}


function getCertificateRuleById_(ruleId) {

  const rules =
    getCertificateRules_();

  for (let i = 0; i < rules.length; i++) {

    if (String(rules[i].ruleId || "").trim() === ruleId) {
      return rules[i];
    }
  }

  return null;
}

function getTrainingNamesByIds_(eventIds) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  const map = {};

  if (!sheet) {
    return eventIds;
  }

  const values =
    sheet.getDataRange().getValues();

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  const eventIdCol =
    headers.indexOf("研修ID");

  const titleCol =
    headers.indexOf("研修名");

  if (eventIdCol === -1 || titleCol === -1) {
    return eventIds;
  }

  for (let i = 1; i < values.length; i++) {

    const eventId =
      String(values[i][eventIdCol] || "").trim();

    if (!eventId) {
      continue;
    }

    map[eventId] =
      String(values[i][titleCol] || "").trim();
  }

  return eventIds.map(function(eventId) {
    return map[eventId] || eventId;
  });
}


function getCertificateRepresentativeName_() {

  const name =
    PropertiesService
      .getScriptProperties()
      .getProperty("CERTIFICATE_REPRESENTATIVE_NAME");

  return name || "戸田　高廣";
}
