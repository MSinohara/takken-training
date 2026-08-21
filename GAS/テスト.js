function testOpenSpreadsheet() {

  const ss =
    getSpreadsheet_();

  Logger.log("スプレッドシート名: " + ss.getName());
}

function testOpenPdfFolder() {

  const folderId =
    getConfig_("PDF_FOLDER_ID");

  Logger.log("PDF_FOLDER_ID: " + folderId);

  const folder =
    DriveApp.getFolderById(
      folderId
    );

  Logger.log("PDFフォルダ名: " + folder.getName());
}

function testReadMembers() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員マスタ");

  if (!sheet) {
    throw new Error("会員マスタシートがありません");
  }

  const values =
    sheet.getDataRange().getValues();

  Logger.log(values);
}

function testSendMailNakano() {

  sendTestMailByHostType_("中野支部");
}

function testSendMailSetagaya() {

  sendTestMailByHostType_("世田谷支部");
}

function testSendMailSuginami() {

  sendTestMailByHostType_("杉並支部");
}

function testDebugCheckinTarget2026001() {

  const result =
    debugCheckinTarget_(
      "2026-001"
    );

  Logger.log(
    JSON.stringify(result)
  );

  return result;
}

function authorizeGmailAppOnce() {

  const aliases =
    GmailApp.getAliases();

  Logger.log(
    "Gmail権限を確認しました。送信元エイリアス数: " + aliases.length
  );
}

function testSendMailBlock10() {

  sendTestMailByHostType_("第十ブロック");
}

function testWriteLog() {

  writeLog_(
    "テスト",
    "ログ書き込みテスト",
    "この行が出ればログ機能は成功"
  );
}

function testGetUrl() {

  Logger.log(
    ScriptApp
      .getService()
      .getUrl()
  );

}

function testGetMailPreview() {

  const res =
    getMailPreview("2026-002");

  Logger.log(JSON.stringify(res, null, 2));
}

function testCreateCertificateTargets() {

  const res =
    createCertificateTargets();

  Logger.log(
    JSON.stringify(res, null, 2)
  );
}

function testCreateCertificatePdf() {

  createCertificatePdfByRow_(2);

}

function testSetupMemberSettingsFromMaster() {

  const result =
    setupMemberSettingsFromMaster_();

  Logger.log(result);
}

function testGetTargetMembers() {

  const members =
    getTargetMembers_();

  Logger.log(
    JSON.stringify(members, null, 2)
  );

  Logger.log(
    "送信対象件数: " + members.length
  );
}

function testMemberSettingMap() {

  const ss =
    getSpreadsheet_();

  const settingSheet =
    ss.getSheetByName("会員設定");

  const values =
    settingSheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      String(values[i][0] || "")
        .replace(".0", "")
        .trim();

    const target =
      String(values[i][1] || "")
        .toUpperCase()
        .trim();

    Logger.log(
      "会員設定 " +
      i +
      "行目 / 業者番号=[" +
      memberNo +
      "] / 送信対象=[" +
      target +
      "]"
    );
  }
}

function testMemberSettingsCellDetail() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員設定");

  Logger.log("スプレッドシートID: " + ss.getId());
  Logger.log("シート名: " + sheet.getName());

  const lastRow =
    sheet.getLastRow();

  for (let i = 1; i <= lastRow; i++) {

    const a =
      sheet.getRange(i, 1);

    const b =
      sheet.getRange(i, 2);

    Logger.log(
      i +
      "行目 A表示=[" + a.getDisplayValue() + "]" +
      " A値=[" + a.getValue() + "]" +
      " / B表示=[" + b.getDisplayValue() + "]" +
      " B値=[" + b.getValue() + "]" +
      " / B数式=[" + b.getFormula() + "]"
    );
  }
}

function testTargetMembers() {

  const training =
    findTrainingById_("研修ID");

  Logger.log(
    "targetOrgIds=" +
    training.targetOrgIds
  );

  const members =
    getTargetMembers_(training);

  Logger.log(
    "件数=" +
    members.length
  );

  members.forEach(function(member){

    Logger.log(
      member.memberNo +
      " / " +
      member.companyName
    );

  });

}

function testFindTraining() {

  const training =
    findTrainingById_("2026-004");

  Logger.log(
    JSON.stringify(
      training,
      null,
      2
    )
  );

}

function testOrganizationMemberMap() {

  const map =
    getOrganizationMemberMap_(["2"]);

  Logger.log(
    JSON.stringify(
      map,
      null,
      2
    )
  );

}

function testTargetMembers() {

  const training =
    findTrainingById_("2026-004");

  const members =
    getTargetMembers_(training);

  Logger.log(
    "件数=" +
    members.length
  );

  members.forEach(function(m){

    Logger.log(
      m.memberNo +
      " / " +
      m.companyName
    );

  });
}

function testMailPreviewCount() {

  const res =
    getMailPreview("2026-004");

  Logger.log(
    JSON.stringify(
      res,
      null,
      2
    )
  );
}
//googleスライド利用
function authorizeSlidesAppOnce() {

  const templateId =
    getConfig_(
      "CERTIFICATE_TEMPLATE_SLIDE_ID"
    );

  SlidesApp.openById(
    templateId
  );
}
