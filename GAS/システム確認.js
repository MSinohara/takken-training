function getSystemConnectionCheckJsonp_(e) {

  return jsonpOutput_(
    e,
    getSystemConnectionCheck_()
  );
}

function getSystemConnectionCheck_() {

  const checks =
    [
      checkSystemSpreadsheet_(),
      checkSystemPdfFolder_(),
      checkSystemCertificateFolder_(),
      checkSystemCertificateTemplate_(),
      checkSystemBackupFolder_(),
      checkSystemFirestore_(),
      checkSystemPublicWebUrl_(),
      checkSystemCheckinWebUrl_(),
      checkSystemWebAppUrl_(),
      checkSystemMailSenderSetting_()
    ];

  const ok =
    checks.every(function(check) {
      return check.ok;
    });

  return {
    ok: ok,
    checkedAt: Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyy/MM/dd HH:mm:ss"
    ),
    checks: checks
  };
}

function makeSystemCheckResult_(
  name,
  ok,
  message,
  detail
) {

  return {
    name: name,
    ok: ok,
    message: message,
    detail: detail || ""
  };
}

function checkSystemSpreadsheet_() {

  try {
    const ss =
      getSpreadsheet_();

    return makeSystemCheckResult_(
      "スプレッドシート",
      true,
      "接続できます。",
      ss.getName()
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "スプレッドシート",
      false,
      "接続できません。",
      err.message
    );
  }
}

function checkSystemPdfFolder_() {

  const folderId =
    getConfigOptional_("PDF_FOLDER_ID");

  if (!folderId) {
    return makeSystemCheckResult_(
      "研修PDFフォルダ",
      false,
      "PDF_FOLDER_ID が設定されていません。",
      ""
    );
  }

  try {
    const folder =
      DriveApp.getFolderById(
        folderId
      );

    return makeSystemCheckResult_(
      "研修PDFフォルダ",
      true,
      "接続できます。",
      folder.getName()
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "研修PDFフォルダ",
      false,
      "接続できません。PDF_FOLDER_ID またはDrive共有権限を確認してください。",
      err.message
    );
  }
}

function checkSystemCertificateFolder_() {

  const folderId =
    getConfigOptional_("CERTIFICATE_FOLDER_ID");

  if (!folderId) {
    return makeSystemCheckResult_(
      "修了証PDF保存先",
      false,
      "CERTIFICATE_FOLDER_ID が設定されていません。",
      ""
    );
  }

  try {
    const folder =
      DriveApp.getFolderById(
        folderId
      );

    return makeSystemCheckResult_(
      "修了証PDF保存先",
      true,
      "接続できます。",
      folder.getName()
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "修了証PDF保存先",
      false,
      "接続できません。CERTIFICATE_FOLDER_ID またはDrive共有権限を確認してください。",
      err.message
    );
  }
}

function checkSystemCertificateTemplate_() {

  const templateId =
    getConfigOptional_("CERTIFICATE_TEMPLATE_SLIDE_ID");

  if (!templateId) {
    return makeSystemCheckResult_(
      "修了証テンプレート",
      false,
      "CERTIFICATE_TEMPLATE_SLIDE_ID が設定されていません。",
      ""
    );
  }

  try {
    const file =
      DriveApp.getFileById(
        templateId
      );

    SlidesApp.openById(
      templateId
    );

    return makeSystemCheckResult_(
      "修了証テンプレート",
      true,
      "接続できます。",
      file.getName()
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "修了証テンプレート",
      false,
      "接続できません。CERTIFICATE_TEMPLATE_SLIDE_ID、Drive共有権限、またはSlides権限を確認してください。",
      err.message
    );
  }
}

function checkSystemBackupFolder_() {

  const folderId =
    getConfigOptional_("BACKUP_FOLDER_ID");

  if (!folderId) {
    return makeSystemCheckResult_(
      "バックアップ保存先",
      false,
      "BACKUP_FOLDER_ID が設定されていません。",
      ""
    );
  }

  try {
    const folder =
      DriveApp.getFolderById(
        folderId
      );

    return makeSystemCheckResult_(
      "バックアップ保存先",
      true,
      "接続できます。",
      folder.getName()
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "バックアップ保存先",
      false,
      "接続できません。BACKUP_FOLDER_ID またはDrive共有権限を確認してください。",
      err.message
    );
  }
}

function checkSystemFirestore_() {

  if (!isFirestoreEnabled_()) {
    return makeSystemCheckResult_(
      "Firestore",
      true,
      "未使用です。",
      "FIRESTORE_ENABLED を TRUE にすると受付履歴をFirestoreにも保存します。"
    );
  }

  try {
    const result =
      testFirestoreConnection_();

    return makeSystemCheckResult_(
      "Firestore",
      result.ok,
      result.message,
      result.detail || ""
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "Firestore",
      false,
      "接続できません。FIRESTORE_PROJECT_ID、Firestore作成状況、または権限を確認してください。",
      err.message
    );
  }
}

function checkSystemPublicWebUrl_() {

  const url =
    getConfigOptional_("PUBLIC_WEB_URL");

  return makeSystemCheckResult_(
    "公開WEB URL",
    !!url,
    url ? "設定されています。" : "PUBLIC_WEB_URL が設定されていません。",
    url
  );
}

function checkSystemCheckinWebUrl_() {

  const configured =
    getConfigOptional_("CHECKIN_WEB_URL");

  const url =
    getCheckinWebUrl_();

  return makeSystemCheckResult_(
    "受付専用WEB URL",
    !!url,
    configured
      ? "設定されています。"
      : "開発環境の受付専用URLを使用しています。",
    url
  );
}

function checkSystemWebAppUrl_() {

  const url =
    getConfigOptional_("WEB_APP_URL");

  return makeSystemCheckResult_(
    "GAS WEBアプリURL",
    !!url,
    url ? "設定されています。" : "WEB_APP_URL が設定されていません。",
    url
  );
}

function checkSystemMailSenderSetting_() {

  try {
    const from =
      getConfigOptional_("MAIL_FROM");

    const senders =
      getMailSenders_()
        .filter(function(sender) {
          return sender.active !== "FALSE";
        });

    if (senders.length > 0) {
      return makeSystemCheckResult_(
        "メール送信元",
        true,
        "メール送信元設定があります。",
        senders.length + "件"
      );
    }

    return makeSystemCheckResult_(
      "メール送信元",
      !!from,
      from ? "従来のMAIL_FROM設定があります。" : "MAIL_FROM またはメール送信元設定がありません。",
      from
    );
  } catch (err) {
    return makeSystemCheckResult_(
      "メール送信元",
      false,
      "確認できません。",
      err.message
    );
  }
}
