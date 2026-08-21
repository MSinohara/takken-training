const AUTH_USER_SHEET_NAME =
  "ログインユーザー";

const AUTH_SESSION_SHEET_NAME =
  "ログインセッション";

const AUTH_OPERATION_LOG_SHEET_NAME =
  "操作ログ";

const AUTH_ENABLED_KEY =
  "WEB_AUTH_ENABLED";

const AUTH_SESSION_EXPIRE_HOURS =
  12;

const AUTH_USER_HEADERS =
  [
    "ユーザーID",
    "ログインID",
    "パスワードハッシュ",
    "パスワードソルト",
    "権限",
    "業者番号",
    "表示名",
    "メール",
    "有効",
    "初回PW変更",
    "見直し対象",
    "最終見直し日時",
    "メモ",
    "作成日時",
    "更新日時",
    "最終ログイン日時"
  ];

const AUTH_SESSION_HEADERS =
  [
    "セッショントークン",
    "ユーザーID",
    "ログインID",
    "権限",
    "発行日時",
    "期限日時",
    "無効",
    "更新日時"
  ];

const AUTH_PUBLIC_ACTIONS =
  {
    getAuthConfigJsonp: true,
    loginJsonp: true,
    logoutJsonp: true,
    getTrainingDetailJsonp: true,
    getMemberJsonp: true,
    searchMembersJsonp: true,
    getGuestPersonalCandidatesJsonp: true,
    registerGuestPersonalCheckinJsonp: true,
    registerCheckinJsonp: true,
    registerManualGuestCheckinJsonp: true,
    getLocationCheckinTokenJsonp: true,
    registerLocationCheckinJsonp: true,
    getDemoLocationMailJsonp: true,
    getAttendanceAnswerJsonp: true,
    saveAttendanceAnswerJsonp: true
  };

const AUTH_ACTION_ROLES =
  {
    getAuthUsersJsonp: ["admin"],
    saveAuthUserJsonp: ["admin"],
    updateAuthUsersActiveJsonp: ["admin"],
    deactivateVendorAuthUsersJsonp: ["admin"],
    startMemberImportJsonp: ["admin"],
    appendMemberImportChunkJsonp: ["admin"],
    finishMemberImportJsonp: ["admin"],
    syncCurrentMemberMasterToFirestoreJsonp: ["admin"],
    queueMemberMasterFirestoreSyncJsonp: ["admin"],
    getMemberMasterFirestoreSyncStatusJsonp: ["admin"],
    queueCheckinFirestoreResyncJsonp: ["admin"],
    getCheckinFirestoreResyncStatusJsonp: ["admin"],
    queuePendingCheckinSheetSyncJsonp: ["admin"],
    saveOrganizationJsonp: ["admin"],
    getOrganizationMembersJsonp: ["admin", "staff"],
    replaceOrganizationMembersJsonp: ["admin"],
    saveCertificateRuleJsonp: ["admin"],
    saveCertificateIssuerJsonp: ["admin"],
    deleteTrainingPdfJsonp: ["admin", "staff"],
    sendTrainingMailAllJsonp: ["admin", "staff"],
    sendTrainingMailTestOneJsonp: ["admin", "staff"],
    getMailTargetMembersJsonp: ["admin", "staff"],
    searchAdditionalMailMembersJsonp: ["admin", "staff"],
    sendAdditionalTrainingMailJsonp: ["admin", "staff"],
    resendTrainingMailJsonp: ["admin", "staff"],
    saveTrainingJsonp: ["admin", "staff"],
    getMailSignaturesJsonp: ["admin", "staff"],
    saveMailSignatureJsonp: ["admin", "staff"],
    getMailSendersJsonp: ["admin", "staff"],
    saveMailSenderJsonp: ["admin", "staff"],
    sendMailSenderTestJsonp: ["admin", "staff"],
    getSystemConnectionCheckJsonp: ["admin"],
    testFirestoreConnectionJsonp: ["admin"],
    getAttendanceConfigJsonp: ["admin", "staff"],
    saveAttendanceConfigJsonp: ["admin", "staff"],
    getAttendanceResponsesJsonp: ["admin", "staff"],
    getAttendanceListJsonp: ["admin", "staff"],
    getVenueMastersJsonp: ["admin", "staff", "reception"],
    saveVenueMasterJsonp: ["admin", "staff"],
    importVenueMastersFromTrainingsJsonp: ["admin", "staff"],
    getEventTypesJsonp: ["admin", "staff", "reception"],
    saveEventTypeJsonp: ["admin", "staff"],
    saveTrainingStatsJsonp: ["admin", "staff"],
    updateMemberSettingJsonp: ["admin", "staff"],
    saveMemberOrganizationsJsonp: ["admin", "staff"],
    getOrganizationsJsonp: ["admin", "staff", "reception"],
    getDistrictsJsonp: ["admin", "staff", "reception"],
    getPersonalMembersJsonp: ["admin", "staff", "reception"],
    savePersonalMemberJsonp: ["admin", "staff"],
    getPersonalOrganizationsJsonp: ["admin", "staff"],
    savePersonalOrganizationsJsonp: ["admin", "staff"],
    addPersonalMembersToOrganizationJsonp: ["admin", "staff"],
    createCertificateTargetsJsonp: ["admin", "staff"],
    createCertificatePdfJsonp: ["admin", "staff"],
    getActiveTrainingsJsonp: ["admin", "staff", "reception"],
    searchCheckinIndexMembersJsonp: ["admin", "staff", "reception"],
    getCheckinHistoryJsonp: ["admin", "staff", "reception"],
    getCheckinMonitorJsonp: ["admin", "staff", "reception"],
    getCheckinTargetMembersJsonp: ["admin", "staff", "reception"],
    getCheckinLoadTestTargetsJsonp: ["admin"],
    checkCheckinLoadTestConsistencyJsonp: ["admin"],
    resetCheckinLoadTestJsonp: ["admin"],
    checkCheckinLoadTestLockJsonp: ["admin"],
    debugCheckinTargetJsonp: ["admin", "staff"],
    updateCheckinStatusJsonp: ["admin", "staff", "reception"],
    getPlannedAttendeesJsonp: ["admin", "staff", "reception"],
    savePlannedAttendeeJsonp: ["admin", "staff", "reception"],
    checkinPlannedAttendeeJsonp: ["admin", "staff", "reception"],
    deletePlannedAttendeeJsonp: ["admin", "staff", "reception"],
    getRelatedPersonMastersJsonp: ["admin", "staff", "reception"],
    saveRelatedPersonMasterJsonp: ["admin", "staff"],
    addRelatedPersonsToPlannedJsonp: ["admin", "staff", "reception"],
    addPersonalMembersToPlannedJsonp: ["admin", "staff", "reception"],
    sendPlannedAttendeeMailJsonp: ["admin", "staff", "reception"],
    buildCheckinIndexJsonp: ["admin", "staff"],
    buildCheckinIndexChunkJsonp: ["admin", "staff"],
    startCheckinIndexJobJsonp: ["admin", "staff"],
    getCheckinIndexJobStatusJsonp: ["admin", "staff", "reception"],
    backupTrainingJsonp: ["admin", "staff"],
    getStatsTrainingOptionsJsonp: ["admin", "staff", "reception"],
    getTrainingStatsJsonp: ["admin", "staff", "reception"],
    getTrainingStatsSummaryJsonp: ["admin", "staff", "reception"],
    getAnnualTrainingStatsJsonp: ["admin", "staff", "reception"],
    getFollowAnalysisJsonp: ["admin", "staff"]
  };

function isWebAuthEnabled_() {

  const value =
    getConfigOptional_(AUTH_ENABLED_KEY) ||
    getSystemSetting_(AUTH_ENABLED_KEY);

  return normalizeAuthFlag_(value, false) === "TRUE";
}

function getConfigOptional_(key) {

  return PropertiesService
    .getScriptProperties()
    .getProperty(key) || "";
}

function authorizeJsonpAction_(e) {

  const action =
    String(e && e.parameter && e.parameter.action || "").trim();

  if (!action || !isWebAuthEnabled_()) {
    return {
      ok: true,
      user: getDemoAuthUser_()
    };
  }

  if (AUTH_PUBLIC_ACTIONS[action]) {
    return {
      ok: true
    };
  }

  const session =
    getValidAuthSession_(
      e.parameter.sessionToken || ""
    );

  if (!session) {
    return {
      ok: false,
      authRequired: true,
      message: "ログインが必要です。"
    };
  }

  const allowedRoles =
    AUTH_ACTION_ROLES[action] || ["admin", "staff"];

  if (allowedRoles.indexOf(session.role) === -1) {
    return {
      ok: false,
      forbidden: true,
      message: "この操作を行う権限がありません。"
    };
  }

  return {
    ok: true,
    user: session
  };
}

function getAuthConfigJsonp_(e) {

  const token =
    String(e.parameter.sessionToken || "").trim();

  const enabled =
    isWebAuthEnabled_();

  const session =
    enabled
      ? getValidAuthSession_(token)
      : getDemoAuthUser_();

  return authJsonpOutput_(e, {
    ok: true,
    enabled: enabled,
    user: session
  });
}

function loginJsonp_(e) {

  const result =
    loginAuthUser_(
      e.parameter.loginId || "",
      e.parameter.password || ""
    );

  return authJsonpOutput_(e, result);
}

function logoutJsonp_(e) {

  invalidateAuthSession_(
    e.parameter.sessionToken || ""
  );

  return authJsonpOutput_(e, {
    ok: true,
    message: "ログアウトしました。"
  });
}

function getAuthUsersJsonp_(e) {

  return authJsonpOutput_(
    e,
    getAuthUsers_()
  );
}

function saveAuthUserJsonp_(e) {

  const result =
    saveAuthUser_({
      userId: e.parameter.userId,
      loginId: e.parameter.loginId,
      password: e.parameter.password,
      role: e.parameter.role,
      vendorNo: e.parameter.vendorNo,
      displayName: e.parameter.displayName,
      email: e.parameter.email,
      active: e.parameter.active,
      mustChangePw: e.parameter.mustChangePw,
      reviewRequired: e.parameter.reviewRequired,
      note: e.parameter.note
    });

  return authJsonpOutput_(e, result);
}

function updateAuthUsersActiveJsonp_(e) {

  const userIds =
    String(e.parameter.userIds || "")
      .split(",")
      .map(function(id) {
        return String(id || "").trim();
      })
      .filter(function(id) {
        return id !== "";
      });

  return authJsonpOutput_(
    e,
    updateAuthUsersActive_(
      userIds,
      e.parameter.active
    )
  );
}

function deactivateVendorAuthUsersJsonp_(e) {

  return authJsonpOutput_(
    e,
    deactivateVendorAuthUsers_()
  );
}

function getAuthUsers_() {

  const sheet =
    getAuthUserSheet_();

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      users: []
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const users =
    [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const userId =
      String(getCellByHeader_(row, headerMap, "ユーザーID") || "").trim();

    const loginId =
      String(getCellByHeader_(row, headerMap, "ログインID") || "").trim();

    if (!userId && !loginId) {
      continue;
    }

    const role =
      normalizeAuthRole_(
        getCellByHeader_(row, headerMap, "権限")
      );

    users.push({
      userId: userId,
      loginId: loginId,
      role: role,
      vendorNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
      displayName: getCellByHeader_(row, headerMap, "表示名"),
      email: getCellByHeader_(row, headerMap, "メール"),
      active: normalizeAuthFlag_(getCellByHeader_(row, headerMap, "有効"), true),
      mustChangePw: normalizeAuthFlag_(getCellByHeader_(row, headerMap, "初回PW変更"), false),
      reviewRequired: normalizeAuthFlag_(getCellByHeader_(row, headerMap, "見直し対象"), role === "vendor"),
      lastReviewedAt: formatAuthDateTime_(getCellByHeader_(row, headerMap, "最終見直し日時")),
      note: getCellByHeader_(row, headerMap, "メモ"),
      updatedAt: formatAuthDateTime_(getCellByHeader_(row, headerMap, "更新日時")),
      lastLoginAt: formatAuthDateTime_(getCellByHeader_(row, headerMap, "最終ログイン日時"))
    });
  }

  return {
    ok: true,
    users: users
  };
}

function saveAuthUser_(data) {

  const loginId =
    String(data.loginId || "").trim();

  const displayName =
    String(data.displayName || "").trim();

  const role =
    normalizeAuthRole_(data.role);

  const vendorNo =
    normalizeMemberNo_(data.vendorNo);

  if (!loginId || !displayName) {
    return {
      ok: false,
      message: "ログインIDと表示名は必須です。"
    };
  }

  if (role === "vendor" && !vendorNo) {
    return {
      ok: false,
      message: "業者権限は現在使用しません。"
    };
  }

  if (
    role !== "admin" &&
    role !== "staff" &&
    role !== "reception"
  ) {
    return {
      ok: false,
      message: "使用できる権限は管理者・事務局・受付担当です。"
    };
  }

  const sheet =
    getAuthUserSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  let rowNumber =
    0;

  let userId =
    String(data.userId || "").trim();

  for (let i = 1; i < values.length; i++) {

    const rowUserId =
      String(getCellByHeader_(values[i], headerMap, "ユーザーID") || "").trim();

    const rowLoginId =
      String(getCellByHeader_(values[i], headerMap, "ログインID") || "").trim();

    if ((userId && rowUserId === userId) || (!userId && rowLoginId === loginId)) {
      rowNumber =
        i + 1;

      if (!userId) {
        userId =
          rowUserId;
      }

      break;
    }
  }

  if (!userId) {
    userId =
      "U" + Utilities.getUuid();
  }

  const now =
    new Date();

  const rowValues =
    rowNumber
      ? sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0]
      : new Array(sheet.getLastColumn()).fill("");

  if (data.password) {
    const salt =
      Utilities.getUuid();

    setAuthCell_(rowValues, headerMap, "パスワードソルト", salt);
    setAuthCell_(rowValues, headerMap, "パスワードハッシュ", hashAuthPassword_(data.password, salt));
  }

  setAuthCell_(rowValues, headerMap, "ユーザーID", userId);
  setAuthCell_(rowValues, headerMap, "ログインID", loginId);
  setAuthCell_(rowValues, headerMap, "権限", role);
  setAuthCell_(rowValues, headerMap, "業者番号", vendorNo);
  setAuthCell_(rowValues, headerMap, "表示名", displayName);
  setAuthCell_(rowValues, headerMap, "メール", String(data.email || "").trim());
  setAuthCell_(rowValues, headerMap, "有効", normalizeAuthFlag_(data.active, true));
  setAuthCell_(rowValues, headerMap, "初回PW変更", normalizeAuthFlag_(data.mustChangePw, !!data.password));
  setAuthCell_(rowValues, headerMap, "見直し対象", normalizeAuthFlag_(data.reviewRequired, role === "vendor"));
  setAuthCell_(rowValues, headerMap, "メモ", data.note || "");
  setAuthCell_(rowValues, headerMap, "更新日時", now);

  if (!rowNumber) {
    setAuthCell_(rowValues, headerMap, "作成日時", now);
    sheet.appendRow(rowValues);
  } else {
    sheet
      .getRange(rowNumber, 1, 1, rowValues.length)
      .setValues([rowValues]);
  }

  writeAuthOperationLog_(
    "SAVE_AUTH_USER",
    userId,
    loginId + " / " + role
  );

  return {
    ok: true,
    userId: userId,
    message: "ログイン権限を保存しました。"
  };
}

function loginAuthUser_(loginId, password) {

  loginId =
    String(loginId || "").trim();

  password =
    String(password || "");

  if (!loginId || !password) {
    return {
      ok: false,
      message: "ログインIDとパスワードを入力してください。"
    };
  }

  const sheet =
    getAuthUserSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "ログインID") || "").trim() !== loginId) {
      continue;
    }

    if (normalizeAuthFlag_(getCellByHeader_(row, headerMap, "有効"), true) !== "TRUE") {
      return {
        ok: false,
        message: "このアカウントは停止されています。"
      };
    }

    const salt =
      String(getCellByHeader_(row, headerMap, "パスワードソルト") || "");

    const storedHash =
      String(getCellByHeader_(row, headerMap, "パスワードハッシュ") || "");

    if (!storedHash || storedHash !== hashAuthPassword_(password, salt)) {
      return {
        ok: false,
        message: "ログインIDまたはパスワードが違います。"
      };
    }

    const user =
      {
        userId: String(getCellByHeader_(row, headerMap, "ユーザーID") || ""),
        loginId: loginId,
        role: normalizeAuthRole_(getCellByHeader_(row, headerMap, "権限")),
        vendorNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
        displayName: String(getCellByHeader_(row, headerMap, "表示名") || ""),
        mustChangePw: normalizeAuthFlag_(getCellByHeader_(row, headerMap, "初回PW変更"), false)
      };

    if (user.role === "vendor") {
      return {
        ok: false,
        message: "このアカウントは現在使用できません。"
      };
    }

    const session =
      createAuthSession_(user);

    if (headerMap["最終ログイン日時"] !== undefined) {
      sheet
        .getRange(i + 1, headerMap["最終ログイン日時"] + 1)
        .setValue(new Date());
    }

    writeAuthOperationLog_(
      "LOGIN",
      user.userId,
      user.loginId
    );

    return {
      ok: true,
      sessionToken: session.sessionToken,
      user: user
    };
  }

  return {
    ok: false,
    message: "ログインIDまたはパスワードが違います。"
  };
}

function updateAuthUsersActive_(userIds, activeValue) {

  const ids =
    {};

  (userIds || []).forEach(function(id) {
    ids[String(id || "").trim()] =
      true;
  });

  const active =
    normalizeAuthFlag_(activeValue, false);

  const sheet =
    getAuthUserSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  let updated =
    0;

  for (let i = 1; i < values.length; i++) {

    const userId =
      String(getCellByHeader_(values[i], headerMap, "ユーザーID") || "").trim();

    const loginId =
      String(getCellByHeader_(values[i], headerMap, "ログインID") || "").trim();

    if (!ids[userId] && !ids[loginId]) {
      continue;
    }

    sheet.getRange(i + 1, headerMap["有効"] + 1).setValue(active);
    sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);

    if (active === "FALSE" && headerMap["最終見直し日時"] !== undefined) {
      sheet.getRange(i + 1, headerMap["最終見直し日時"] + 1).setValue(now);
    }

    updated++;
  }

  return {
    ok: true,
    updated: updated,
    message: updated + "件更新しました。"
  };
}

function deactivateVendorAuthUsers_() {

  const sheet =
    getAuthUserSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  let updated =
    0;

  for (let i = 1; i < values.length; i++) {

    const role =
      normalizeAuthRole_(getCellByHeader_(values[i], headerMap, "権限"));

    if (role !== "vendor") {
      continue;
    }

    if (normalizeAuthFlag_(getCellByHeader_(values[i], headerMap, "有効"), true) !== "TRUE") {
      continue;
    }

    sheet.getRange(i + 1, headerMap["有効"] + 1).setValue("FALSE");
    sheet.getRange(i + 1, headerMap["見直し対象"] + 1).setValue("FALSE");
    sheet.getRange(i + 1, headerMap["最終見直し日時"] + 1).setValue(now);
    sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);

    updated++;
  }

  return {
    ok: true,
    updated: updated,
    message: "vendorを" + updated + "件停止しました。"
  };
}

function createAuthSession_(user) {

  const sheet =
    getAuthSessionSheet_();

  const now =
    new Date();

  const expiresAt =
    new Date(now.getTime() + AUTH_SESSION_EXPIRE_HOURS * 60 * 60 * 1000);

  const token =
    Utilities.getUuid() + Utilities.getUuid();

  sheet.appendRow([
    token,
    user.userId,
    user.loginId,
    user.role,
    now,
    expiresAt,
    "FALSE",
    now
  ]);

  return {
    sessionToken: token,
    expiresAt: expiresAt
  };
}

function getValidAuthSession_(token) {

  token =
    String(token || "").trim();

  if (!token) {
    return null;
  }

  const sheet =
    getAuthSessionSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  for (let i = values.length - 1; i >= 1; i--) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "セッショントークン") || "") !== token) {
      continue;
    }

    if (normalizeAuthFlag_(getCellByHeader_(row, headerMap, "無効"), false) === "TRUE") {
      return null;
    }

    const expiresAt =
      getCellByHeader_(row, headerMap, "期限日時");

    if (expiresAt instanceof Date && expiresAt.getTime() < now.getTime()) {
      return null;
    }

    return {
      userId: String(getCellByHeader_(row, headerMap, "ユーザーID") || ""),
      loginId: String(getCellByHeader_(row, headerMap, "ログインID") || ""),
      role: normalizeAuthRole_(getCellByHeader_(row, headerMap, "権限"))
    };
  }

  return null;
}

function invalidateAuthSession_(token) {

  token =
    String(token || "").trim();

  if (!token) {
    return;
  }

  const sheet =
    getAuthSessionSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(getCellByHeader_(values[i], headerMap, "セッショントークン") || "") === token) {
      sheet.getRange(i + 1, headerMap["無効"] + 1).setValue("TRUE");
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(new Date());
      return;
    }
  }
}

function getAuthUserSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(AUTH_USER_SHEET_NAME);

  if (!sheet) {
    sheet =
      ss.insertSheet(AUTH_USER_SHEET_NAME);
  }

  ensureHeaders_(sheet, AUTH_USER_HEADERS);

  return sheet;
}

function getAuthSessionSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(AUTH_SESSION_SHEET_NAME);

  if (!sheet) {
    sheet =
      ss.insertSheet(AUTH_SESSION_SHEET_NAME);
  }

  ensureHeaders_(sheet, AUTH_SESSION_HEADERS);

  return sheet;
}

function authJsonpOutput_(e, result) {

  const callback =
    e && e.parameter && e.parameter.callback
      ? e.parameter.callback
      : "callback";

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result || {}) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function hashAuthPassword_(password, salt) {

  const raw =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(salt || "") + ":" + String(password || ""),
      Utilities.Charset.UTF_8
    );

  return raw.map(function(byte) {
    const value =
      byte < 0
        ? byte + 256
        : byte;

    const hex =
      value.toString(16);

    return hex.length === 1
      ? "0" + hex
      : hex;
  }).join("");
}

function normalizeAuthRole_(role) {

  const text =
    String(role || "").trim().toLowerCase();

  if (
    text === "管理者" ||
    text === "administrator"
  ) {
    return "admin";
  }

  if (
    text === "事務局" ||
    text === "職員"
  ) {
    return "staff";
  }

  if (
    text === "受付" ||
    text === "受付担当"
  ) {
    return "reception";
  }

  if (
    text === "業者" ||
    text === "会員"
  ) {
    return "vendor";
  }

  if (
    text === "admin" ||
    text === "staff" ||
    text === "reception" ||
    text === "vendor"
  ) {
    return text;
  }

  return "vendor";
}

function normalizeAuthFlag_(value, defaultValue) {

  const text =
    String(value === undefined || value === null ? "" : value)
      .trim()
      .toUpperCase();

  if (text === "TRUE" || text === "1" || text === "YES") {
    return "TRUE";
  }

  if (text === "FALSE" || text === "0" || text === "NO") {
    return "FALSE";
  }

  return defaultValue
    ? "TRUE"
    : "FALSE";
}

function setAuthCell_(rowValues, headerMap, headerName, value) {

  const index =
    headerMap[headerName];

  if (index === undefined || index < 0) {
    return;
  }

  rowValues[index] =
    value;
}

function formatAuthDateTime_(value) {

  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy/MM/dd HH:mm:ss"
    );
  }

  return String(value || "");
}

function getDemoAuthUser_() {

  return {
    userId: "demo",
    loginId: "demo",
    role: "admin",
    displayName: "デモ管理者"
  };
}

function writeAuthOperationLog_(action, targetId, detail) {

  try {
    const ss =
      getSpreadsheet_();

    let sheet =
      ss.getSheetByName(AUTH_OPERATION_LOG_SHEET_NAME);

    if (!sheet) {
      sheet =
        ss.insertSheet(AUTH_OPERATION_LOG_SHEET_NAME);

      sheet.appendRow([
        "日時",
        "操作",
        "対象ID",
        "詳細"
      ]);
    }

    sheet.appendRow([
      new Date(),
      action || "",
      targetId || "",
      detail || ""
    ]);
  } catch (err) {
    writeLog_(
      "AUTH_LOG_ERROR",
      "操作ログを書き込めませんでした",
      String(err)
    );
  }
}
