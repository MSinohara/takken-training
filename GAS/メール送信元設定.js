const MAIL_SENDER_SHEET_NAME_ =
  "メール送信元設定";

const MAIL_SENDER_HEADERS_ =
  [
    "送信元ID",
    "表示名",
    "送信元メール",
    "対象区分",
    "対象支部",
    "対象組織ID",
    "有効",
    "備考",
    "作成日時",
    "更新日時"
  ];

function getMailSendersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result = {
      ok: true,
      senders: getMailSenders_(),
      gmailSettingUrl: "https://mail.google.com/mail/u/0/#settings/accounts"
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

function saveMailSenderJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      saveMailSender_(
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

function sendMailSenderTestJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      sendMailSenderTest_(
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

function getMailSenders_() {

  const sheet =
    getMailSenderSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const list = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const senderId =
      String(getCellByHeader_(row, headerMap, "送信元ID") || "").trim();

    if (!senderId) {
      continue;
    }

    list.push({
      senderId: senderId,
      displayName: String(getCellByHeader_(row, headerMap, "表示名") || "").trim(),
      fromMail: String(getCellByHeader_(row, headerMap, "送信元メール") || "").trim(),
      targetType: String(getCellByHeader_(row, headerMap, "対象区分") || "").trim(),
      targetBranch: String(getCellByHeader_(row, headerMap, "対象支部") || "").trim(),
      targetOrgId: String(getCellByHeader_(row, headerMap, "対象組織ID") || "").trim(),
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

function saveMailSender_(
  params
) {

  const sheet =
    getMailSenderSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  let senderId =
    String(params.senderId || "").trim();

  const displayName =
    String(params.displayName || "").trim();

  const fromMail =
    String(params.fromMail || "").trim();

  const targetType =
    String(params.targetType || "").trim();

  if (!displayName || !fromMail) {
    throw new Error("表示名と送信元メールを入力してください。");
  }

  if (fromMail.indexOf("@") === -1) {
    throw new Error("送信元メールの形式を確認してください。");
  }

  if (!senderId) {
    senderId =
      getNextMailSenderId_();
  }

  let rowNo = 0;

  for (let i = 1; i < values.length; i++) {

    const rowSenderId =
      String(getCellByHeader_(values[i], headerMap, "送信元ID") || "").trim();

    if (rowSenderId === senderId) {
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

  sheet.getRange(rowNo, headerMap["送信元ID"] + 1).setValue(senderId);
  sheet.getRange(rowNo, headerMap["表示名"] + 1).setValue(displayName);
  sheet.getRange(rowNo, headerMap["送信元メール"] + 1).setValue(fromMail);
  sheet.getRange(rowNo, headerMap["対象区分"] + 1).setValue(targetType || "共通");
  sheet.getRange(rowNo, headerMap["対象支部"] + 1).setValue(String(params.targetBranch || "").trim());
  sheet.getRange(rowNo, headerMap["対象組織ID"] + 1).setValue(String(params.targetOrgId || "").trim());
  sheet.getRange(rowNo, headerMap["有効"] + 1).setValue(
    String(params.active || "TRUE").toUpperCase() === "FALSE"
      ? "FALSE"
      : "TRUE"
  );
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(String(params.note || ""));
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "メール送信元を保存しました。",
    senderId: senderId
  };
}

function sendMailSenderTest_(
  params
) {

  const senderId =
    String(params.senderId || "").trim();

  const toMail =
    String(params.toMail || "").trim();

  if (!senderId) {
    throw new Error("テストする送信元を選択してください。");
  }

  if (!toMail || toMail.indexOf("@") === -1) {
    throw new Error("テスト送信先メールを入力してください。");
  }

  const sender =
    getMailSenderById_(
      senderId
    );

  if (!sender) {
    throw new Error("メール送信元が見つかりません。");
  }

  if (sender.active === "FALSE") {
    throw new Error("無効な送信元はテスト送信できません。");
  }

  GmailApp.sendEmail(
    toMail,
    "【テスト】研修会参加確認システム",
    "このメールは、研修会参加確認システムの送信元設定テストです。\n\n" +
      "送信元名: " + sender.displayName + "\n" +
      "送信元メール: " + sender.fromMail + "\n\n" +
      "このメールが届いていれば、Google側の送信元設定とシステム側の設定を確認できています。",
    {
      from: sender.fromMail,
      name: sender.displayName
    }
  );

  return {
    ok: true,
    message: "テスト送信しました。",
    toMail: toMail
  };
}

function getMailSenderById_(
  senderId
) {

  const targetId =
    String(senderId || "").trim();

  if (!targetId) {
    return null;
  }

  const senders =
    getMailSenders_();

  for (let i = 0; i < senders.length; i++) {
    if (senders[i].senderId === targetId) {
      return senders[i];
    }
  }

  return null;
}

function getMailSenderForTraining_(
  training
) {

  const senders =
    getMailSenders_()
      .filter(function(sender) {
        return sender.active !== "FALSE";
      });

  const senderOrgId =
    String(training && training.senderOrgId || "").trim();

  if (senderOrgId) {
    for (let i = 0; i < senders.length; i++) {
      if (
        senders[i].targetType === "組織" &&
        senders[i].targetOrgId === senderOrgId
      ) {
        return senders[i];
      }
    }
  }

  const hostType =
    String(training && training.hostType || "").trim();

  if (hostType) {
    for (let i = 0; i < senders.length; i++) {
      if (
        senders[i].targetType === "支部" &&
        senders[i].targetBranch === hostType
      ) {
        return senders[i];
      }
    }

    if (hostType === "第十ブロック") {
      for (let i = 0; i < senders.length; i++) {
        if (senders[i].targetType === "ブロック") {
          return senders[i];
        }
      }
    }
  }

  for (let i = 0; i < senders.length; i++) {
    if (senders[i].targetType === "共通") {
      return senders[i];
    }
  }

  return null;
}

function getMailSenderPreviewForTraining_(
  training
) {

  const sender =
    getMailSenderForTraining_(
      training
    );

  if (sender) {
    return {
      displayName: sender.displayName || "",
      fromMail: sender.fromMail || "",
      source: "メール送信元設定",
      targetText: buildMailSenderTargetText_(
        sender
      )
    };
  }

  return {
    displayName: getMailFromName_(
      training
    ),
    fromMail: getConfig_("MAIL_FROM"),
    source: "GASプロパティ",
    targetText: "従来設定"
  };
}

function buildMailSenderTargetText_(
  sender
) {

  const type =
    sender && sender.targetType
      ? sender.targetType
      : "共通";

  if (type === "支部") {
    return "支部：" + (sender.targetBranch || "");
  }

  if (type === "組織") {
    return "組織ID：" + (sender.targetOrgId || "");
  }

  if (type === "ブロック") {
    return "第十ブロック";
  }

  return "共通";
}

function getMailFromAddress_(
  training
) {

  const sender =
    getMailSenderForTraining_(
      training
    );

  if (sender && sender.fromMail) {
    return sender.fromMail;
  }

  return getConfig_("MAIL_FROM");
}

function getMailFromDisplayName_(
  training
) {

  const sender =
    getMailSenderForTraining_(
      training
    );

  if (sender && sender.displayName) {
    return sender.displayName;
  }

  return "";
}

function getNextMailSenderId_() {

  const sheet =
    getMailSenderSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  let maxNo = 0;

  for (let i = 1; i < values.length; i++) {

    const senderId =
      String(getCellByHeader_(values[i], headerMap, "送信元ID") || "").trim();

    const match =
      senderId.match(/^MF-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(maxNo, Number(match[1]));
    }
  }

  return "MF-" +
    String(maxNo + 1).padStart(3, "0");
}

function getMailSenderSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(MAIL_SENDER_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(MAIL_SENDER_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    MAIL_SENDER_HEADERS_
  );

  return sheet;
}
