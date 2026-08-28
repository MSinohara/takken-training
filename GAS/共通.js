function doGet(e) {

  try {
    return doGetCore_(e);
  } catch (err) {
    return jsonpFatalErrorOutput_(e, err);
  }
}

function jsonpFatalErrorOutput_(
  e,
  err
) {

  const callback =
    e && e.parameter && e.parameter.callback
      ? e.parameter.callback
      : "callback";

  const action =
    e && e.parameter && e.parameter.action
      ? String(e.parameter.action || "")
      : "";

  const debug =
    e && e.parameter &&
    String(e.parameter.loadTestDebug || "").toUpperCase() === "TRUE";

  const hasSessionToken =
    e && e.parameter &&
    String(e.parameter.sessionToken || "").trim();

  const detail =
    err && err.message
      ? String(err.message)
      : String(err || "");

  const showDetail =
    debug ||
    hasSessionToken ||
    action.indexOf("CheckinLoadTest") !== -1;

  const result = {
    ok: false,
    message:
      showDetail
        ? "GAS入口でエラーが発生しました: " + detail
        : "処理中にエラーが発生しました。画面を再読み込みするか、時間をおいて再度お試しください。",
    debugMessage:
      detail
  };

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doGetCore_(e) {

  const authCheck =
    authorizeJsonpAction_(e);

  if (!authCheck.ok) {
    return authJsonpOutput_(e, authCheck);
  }

  if (e.parameter.action === "getAuthConfigJsonp") {
    return getAuthConfigJsonp_(e);
  }

  if (e.parameter.action === "loginJsonp") {
    return loginJsonp_(e);
  }

  if (e.parameter.action === "logoutJsonp") {
    return logoutJsonp_(e);
  }

  if (e.parameter.action === "getAuthUsersJsonp") {
    return getAuthUsersJsonp_(e);
  }

  if (e.parameter.action === "saveAuthUserJsonp") {
    return saveAuthUserJsonp_(e);
  }

  if (e.parameter.action === "updateAuthUsersActiveJsonp") {
    return updateAuthUsersActiveJsonp_(e);
  }

  if (e.parameter.action === "deactivateVendorAuthUsersJsonp") {
    return deactivateVendorAuthUsersJsonp_(e);
  }

  if (e.parameter.action === "getActiveTrainingsJsonp") {
    return getActiveTrainingsJsonp_(e);
  }  

  const page =
    e.parameter.page || "";

  if (page === "qr") {
    return showQrPage_(e);
  }

  if (page === "checkin") {
    return showCheckinPage_(e);
  }

  if (page === "trainingForm") {
    return showTrainingForm_();
  }

  if (e.parameter.action === "searchMembersJsonp") {
    return searchMembersJsonp_(e);
  }

  if (e.parameter.action === "syncCurrentMemberMasterToFirestoreJsonp") {
    return syncCurrentMemberMasterToFirestoreJsonp_(e);
  }

  if (e.parameter.action === "queueMemberMasterFirestoreSyncJsonp") {
    return queueMemberMasterFirestoreSyncJsonp_(e);
  }

  if (e.parameter.action === "getMemberMasterFirestoreSyncStatusJsonp") {
    return getMemberMasterFirestoreSyncStatusJsonp_(e);
  }

  if (e.parameter.action === "queueCheckinFirestoreResyncJsonp") {
    return queueCheckinFirestoreResyncJsonp_(e);
  }

  if (e.parameter.action === "getCheckinFirestoreResyncStatusJsonp") {
    return getCheckinFirestoreResyncStatusJsonp_(e);
  }

  if (e.parameter.action === "queuePendingCheckinSheetSyncJsonp") {
    return queuePendingCheckinSheetSyncJsonp_(e);
  }

  if (e.parameter.action === "searchCheckinIndexMembersJsonp") {
    return searchCheckinIndexMembersJsonp_(e);
  }

  if (e.parameter.action === "getPersonalMembersJsonp") {
    return getPersonalMembersJsonp_(e);
  }

  if (e.parameter.action === "savePersonalMemberJsonp") {
    return savePersonalMemberJsonp_(e);
  }

  if (e.parameter.action === "getGuestPersonalCandidatesJsonp") {
    return getGuestPersonalCandidatesJsonp_(e);
  }

  if (e.parameter.action === "registerGuestPersonalCheckinJsonp") {
    return registerGuestPersonalCheckinJsonp_(e);
  }

  if (e.parameter.action === "getPersonalOrganizationsJsonp") {
    return getPersonalOrganizationsJsonp_(e);
  }

  if (e.parameter.action === "savePersonalOrganizationsJsonp") {
    return savePersonalOrganizationsJsonp_(e);
  }

  if (e.parameter.action === "addPersonalMembersToOrganizationJsonp") {
    return addPersonalMembersToOrganizationJsonp_(e);
  }

  if (page === "mailSend") {
    return showMailSendPage_();
  }

  if (page === "pdfUpload") {
    return showPdfUploadPage_(e);
  }

  if (e.parameter.action === "getTrainingDetailJsonp") {
    return getTrainingDetailJsonp_(e);
  }

  if (e.parameter.action === "getMailPreviewJsonp") {
    return getMailPreviewJsonp_(e);
  }

  if (e.parameter.action === "getMailTargetMembersJsonp") {
    return getMailTargetMembersJsonp_(e);
  }

  if (e.parameter.action === "searchAdditionalMailMembersJsonp") {
    return searchAdditionalMailMembersJsonp_(e);
  }

  if (e.parameter.action === "sendAdditionalTrainingMailJsonp") {
    return sendAdditionalTrainingMailJsonp_(e);
  }

  if (e.parameter.action === "sendTrainingMailTestOneJsonp") {
    return sendTrainingMailTestOneJsonp_(e);
  }

  if (e.parameter.action === "saveTrainingJsonp") {
    return saveTrainingJsonp_(e);
  }

  if (e.parameter.action === "getMailSignaturesJsonp") {
    return getMailSignaturesJsonp_(e);
  }

  if (e.parameter.action === "saveMailSignatureJsonp") {
    return saveMailSignatureJsonp_(e);
  }

  if (e.parameter.action === "getMailSendersJsonp") {
    return getMailSendersJsonp_(e);
  }

  if (e.parameter.action === "saveMailSenderJsonp") {
    return saveMailSenderJsonp_(e);
  }

  if (e.parameter.action === "sendMailSenderTestJsonp") {
    return sendMailSenderTestJsonp_(e);
  }

  if (e.parameter.action === "getSystemConnectionCheckJsonp") {
    return getSystemConnectionCheckJsonp_(e);
  }

  if (e.parameter.action === "testFirestoreConnectionJsonp") {
    return testFirestoreConnectionJsonp_(e);
  }

  if (e.parameter.action === "getAttendanceConfigJsonp") {
    return getAttendanceConfigJsonp_(e);
  }

  if (e.parameter.action === "saveAttendanceConfigJsonp") {
    return saveAttendanceConfigJsonp_(e);
  }

  if (e.parameter.action === "getAttendanceResponsesJsonp") {
    return getAttendanceResponsesJsonp_(e);
  }

  if (e.parameter.action === "getAttendanceListJsonp") {
    return getAttendanceListJsonp_(e);
  }

  if (e.parameter.action === "getAttendanceAnswerJsonp") {
    return getAttendanceAnswerJsonp_(e);
  }

  if (e.parameter.action === "saveAttendanceAnswerJsonp") {
    return saveAttendanceAnswerJsonp_(e);
  }

  if (e.parameter.action === "getEventTypesJsonp") {
    return getEventTypesJsonp_(e);
  }

  if (e.parameter.action === "saveEventTypeJsonp") {
    return saveEventTypeJsonp_(e);
  }

  if (e.parameter.action === "getVenueMastersJsonp") {
    return getVenueMastersJsonp_(e);
  }

  if (e.parameter.action === "saveVenueMasterJsonp") {
    return saveVenueMasterJsonp_(e);
  }

  if (e.parameter.action === "importVenueMastersFromTrainingsJsonp") {
    return importVenueMastersFromTrainingsJsonp_(e);
  }

  if (e.parameter.action === "registerCheckinJsonp") {
    return registerCheckinJsonp_(e);
  }

  if (e.parameter.action === "getLocationCheckinTokenJsonp") {
    return getLocationCheckinTokenJsonp_(e);
  }

  if (e.parameter.action === "registerLocationCheckinJsonp") {
    return registerLocationCheckinJsonp_(e);
  }

  if (e.parameter.action === "getDemoLocationMailJsonp") {
    return getDemoLocationMailJsonp_(e);
  }

  if (e.parameter.action === "registerManualGuestCheckinJsonp") {
    return registerManualGuestCheckinJsonp_(e);
  }

  if (e.parameter.action === "getPlannedAttendeesJsonp") {
    return getPlannedAttendeesJsonp_(e);
  }

  if (e.parameter.action === "savePlannedAttendeeJsonp") {
    return savePlannedAttendeeJsonp_(e);
  }

  if (e.parameter.action === "checkinPlannedAttendeeJsonp") {
    return checkinPlannedAttendeeJsonp_(e);
  }

  if (e.parameter.action === "deletePlannedAttendeeJsonp") {
    return deletePlannedAttendeeJsonp_(e);
  }

  if (e.parameter.action === "getRelatedPersonMastersJsonp") {
    return getRelatedPersonMastersJsonp_(e);
  }

  if (e.parameter.action === "saveRelatedPersonMasterJsonp") {
    return saveRelatedPersonMasterJsonp_(e);
  }

  if (e.parameter.action === "addRelatedPersonsToPlannedJsonp") {
    return addRelatedPersonsToPlannedJsonp_(e);
  }

  if (e.parameter.action === "addPersonalMembersToPlannedJsonp") {
    return addPersonalMembersToPlannedJsonp_(e);
  }

  if (e.parameter.action === "sendPlannedAttendeeMailJsonp") {
    return sendPlannedAttendeeMailJsonp_(e);
  }

  if (e.parameter.action === "getCheckinHistoryJsonp") {
    return getCheckinHistoryJsonp_(e);
  }

  if (e.parameter.action === "getCheckinMonitorJsonp") {
    return getCheckinMonitorJsonp_(e);
  }

  if (e.parameter.action === "getCheckinTargetMembersJsonp") {
    return getCheckinTargetMembersJsonp_(e);
  }

  if (e.parameter.action === "getCheckinLoadTestTargetsJsonp") {
    return getCheckinLoadTestTargetsJsonp_(e);
  }

  if (e.parameter.action === "checkCheckinLoadTestConsistencyJsonp") {
    return checkCheckinLoadTestConsistencyJsonp_(e);
  }

  if (e.parameter.action === "resetCheckinLoadTestJsonp") {
    return resetCheckinLoadTestJsonp_(e);
  }

  if (e.parameter.action === "checkCheckinLoadTestLockJsonp") {
    return checkCheckinLoadTestLockJsonp_(e);
  }

  if (e.parameter.action === "debugCheckinTargetJsonp") {
    return debugCheckinTargetJsonp_(e);
  }

  if (e.parameter.action === "updateCheckinStatusJsonp") {
    return updateCheckinStatusJsonp_(e);
  }

  if (e.parameter.action === "buildCheckinIndexJsonp") {
    return buildCheckinIndexJsonp_(e);
  }

  if (e.parameter.action === "buildCheckinIndexChunkJsonp") {
    return buildCheckinIndexChunkJsonp_(e);
  }

  if (e.parameter.action === "startCheckinIndexJobJsonp") {
    return startCheckinIndexJobJsonp_(e);
  }

  if (e.parameter.action === "getCheckinIndexJobStatusJsonp") {
    return getCheckinIndexJobStatusJsonp_(e);
  }

  if (e.parameter.action === "backupTrainingJsonp") {
    return backupTrainingJsonp_(e);
  }

  if (e.parameter.action === "getCertificateRulesJsonp") {
    return getCertificateRulesJsonp_(e);
  }

  if (e.parameter.action === "saveCertificateRuleJsonp") {
    return saveCertificateRuleJsonp_(e);
  }

  if (e.parameter.action === "getCertificateIssuersJsonp") {
    return getCertificateIssuersJsonp_(e);
  }

  if (e.parameter.action === "saveCertificateIssuerJsonp") {
    return saveCertificateIssuerJsonp_(e);
  }

  if (e.parameter.action === "createCertificateTargetsJsonp") {
    return createCertificateTargetsJsonp_(e);
  }

  if (e.parameter.action === "getCertificateTargetsJsonp") {
    return getCertificateTargetsJsonp_(e);
  }

  if (e.parameter.action === "createCertificatePdfJsonp") {
    return createCertificatePdfJsonp_(e);
  }

  if (e.parameter.action === "sendCertificatePdfJsonp") {
    return sendCertificatePdfJsonp_(e);
  }

  if (e.parameter.action === "sendCertificatePdfBulkJsonp") {
    return sendCertificatePdfBulkJsonp_(e);
  }

  if (e.parameter.action === "previewCertificatePdfJsonp") {
    return previewCertificatePdfJsonp_(e);
  }

  if (e.parameter.action === "sendTrainingMailAllJsonp") {
    return sendTrainingMailAllJsonp_(e);
  }

  if (e.parameter.action === "getMemberJsonp") {
    return getMemberJsonp_(e);
  }

  if (e.parameter.action === "getMailHistoryJsonp") {
    return getMailHistoryJsonp_(e);
  }

  if (e.parameter.action === "startMemberImportJsonp") {
    return startMemberImportJsonp_(e);
  }

  if (e.parameter.action === "appendMemberImportChunkJsonp") {
    return appendMemberImportChunkJsonp_(e);
  }

  if (e.parameter.action === "finishMemberImportJsonp") {
    return finishMemberImportJsonp_(e);
  }

  if (e.parameter.action === "getMemberImportDuplicateCandidatesJsonp") {
    return getMemberImportDuplicateCandidatesJsonp_(e);
  }

  if (e.parameter.action === "applyMemberImportDuplicateChoicesJsonp") {
    return applyMemberImportDuplicateChoicesJsonp_(e);
  }

  if (e.parameter.action === "getMembersJsonp") {
    return getMembersJsonp_(e);
  }

  if (e.parameter.action === "updateMemberSettingJsonp") {
    return updateMemberSettingJsonp_(e);
  }

  if (e.parameter.action === "getPdfFilesJsonp") {
    return getPdfFilesJsonp_(e);
  }

  if (e.parameter.action === "getOrganizationsJsonp") {
    return getOrganizationsJsonp_(e);
  }

  if (e.parameter.action === "saveOrganizationJsonp") {
    return saveOrganizationJsonp_(e);
  }

  if (e.parameter.action === "getMemberOrganizationsJsonp") {
    return getMemberOrganizationsJsonp_(e);
  }

  if (e.parameter.action === "getOrganizationMembersJsonp") {
    return getOrganizationMembersJsonp_(e);
  }

  if (e.parameter.action === "saveMemberOrganizationsJsonp") {
    return saveMemberOrganizationsJsonp_(e);
  }

  if (e.parameter.action === "getMemberDetailJsonp") {
    return getMemberDetailJsonp_(e);
  }

  if (e.parameter.action === "replaceOrganizationMembersJsonp") {
    return replaceOrganizationMembersJsonp_(e);
  }

  if (e.parameter.action === "getTrainingStatsJsonp") {
    return getTrainingStatsJsonp_(e);
  }

  if (e.parameter.action === "getTrainingStatsSummaryJsonp") {
    return getTrainingStatsSummaryJsonp_(e);
  }

  if (e.parameter.action === "getAnnualTrainingStatsJsonp") {
    return getAnnualTrainingStatsJsonp_(e);
  }

  if (e.parameter.action === "getStatsTrainingOptionsJsonp") {
    return getStatsTrainingOptionsJsonp_(e);
  }

  if (e.parameter.action === "saveTrainingStatsJsonp") {
    return saveTrainingStatsJsonp_(e);
  }

  if (e.parameter.action === "getTrainingStatsSummariesJsonp") {
    return getTrainingStatsSummariesJsonp_(e);
  }

  if (e.parameter.action === "getFollowAnalysisJsonp") {
    return getFollowAnalysisJsonp_(e);
  }

  if (e.parameter.action === "getTrainingRecordsJsonp") {
    return getTrainingRecordsJsonp_(e);
  }

  if (e.parameter.action === "getNextTrainingIdJsonp") {
    return getNextTrainingIdJsonp_(e);
  }

  if (e.parameter.action === "resendTrainingMailJsonp") {
    return resendTrainingMailJsonp_(e);
  }

  if (e.parameter.action === "startLongTextJsonp") {
    return startLongTextJsonp_(e);
  }

  if (e.parameter.action === "appendLongTextChunkJsonp") {
    return appendLongTextChunkJsonp_(e);
  }

  if (e.parameter.action === "getDistrictsJsonp") {
    return getDistrictsJsonp_(e);
  }

  if (e.parameter.action === "deleteTrainingPdfJsonp") {
    return deleteTrainingPdfJsonp_(e);
  }

  return HtmlService
    .createHtmlOutput("研修会参加確認システム");
}

function getConfig_(key) {

  const value =
    PropertiesService
      .getScriptProperties()
      .getProperty(key);

  if (!value) {
    throw new Error(
      "スクリプトプロパティが未設定です: " + key
    );
  }

  return value;
}

function getCheckinWebUrl_() {

  const configured =
    typeof getConfigOptional_ === "function"
      ? String(getConfigOptional_("CHECKIN_WEB_URL") || "").trim()
      : "";

  if (configured) {
    return configured;
  }

  const publicWebUrl =
    getConfig_("PUBLIC_WEB_URL");

  if (/takken-training-demo\.web\.app\/?$/i.test(publicWebUrl)) {
    return "https://dev-takken10b-checkin.web.app";
  }

  return publicWebUrl;
}

function getSpreadsheet_() {

  const spreadsheetId =
    getConfig_("SPREADSHEET_ID");

  return SpreadsheetApp.openById(
    spreadsheetId
  );
}

function writeLog_(type, message, detail) {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("システムログ");

  if (!sheet) {
    sheet =
      ss.insertSheet("システムログ");

    sheet.appendRow([
      "日時",
      "区分",
      "内容",
      "詳細"
    ]);
  }

  sheet.appendRow([
    new Date(),
    type,
    message,
    detail || ""
  ]);
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
      .getValues()[0]
      .map(function(h) {
        return String(h || "").trim();
      });

  const map = {};

  headers.forEach(function(header, index) {
    if (header) {
      map[header] = index;
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


function normalizeMemberNo_(value) {

  return String(value || "")
    .replace(".0", "")
    .trim();
}

function ensureHeaders_(
  sheet,
  headers
) {

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const currentHeaders =
    sheet
      .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
      .getValues()[0]
      .map(function(h) {
        return String(h || "").trim();
      });

  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      sheet
        .getRange(1, sheet.getLastColumn() + 1)
        .setValue(header);

      currentHeaders.push(header);
    }
  });
}

function getSystemSetting_(
  key
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("管理設定");

  if (sheet) {

    const values =
      sheet.getDataRange().getValues();

    if (values.length >= 2) {

      const headers =
        values[0].map(function(h) {
          return String(h || "").trim();
        });

      const keyCol =
        headers.indexOf("設定キー");

      const valueCol =
        headers.indexOf("設定値");

      if (
        keyCol >= 0 &&
        valueCol >= 0
      ) {

        for (let i = 1; i < values.length; i++) {

          const rowKey =
            String(values[i][keyCol] || "").trim();

          if (rowKey === key) {
            return String(values[i][valueCol] || "").trim();
          }
        }
      }
    }
  }

  return PropertiesService
    .getScriptProperties()
    .getProperty(key) || "";
}
