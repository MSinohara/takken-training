const FIRESTORE_ENABLED_KEY_ =
  "FIRESTORE_ENABLED";

const FIRESTORE_PROJECT_ID_KEY_ =
  "FIRESTORE_PROJECT_ID";

const FIRESTORE_PAUSE_CACHE_KEY_ =
  "FIRESTORE_PAUSE_UNTIL";

const FIRESTORE_PAUSE_REASON_CACHE_KEY_ =
  "FIRESTORE_PAUSE_REASON";

const FIRESTORE_PAUSE_UNTIL_PROPERTY_KEY_ =
  "FIRESTORE_PAUSE_UNTIL";

const FIRESTORE_PAUSE_REASON_PROPERTY_KEY_ =
  "FIRESTORE_PAUSE_REASON";

const CHECKIN_FIRESTORE_RESYNC_TRIGGER_FUNCTION_ =
  "runCheckinFirestoreResyncJob_";

const CHECKIN_FIRESTORE_RESYNC_STATUS_KEY_ =
  "CHECKIN_FIRESTORE_RESYNC_STATUS";

const CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_ =
  "CHECKIN_FIRESTORE_RESYNC_PHASE";

const CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_ =
  "CHECKIN_FIRESTORE_RESYNC_OFFSET";

const CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_ =
  "CHECKIN_FIRESTORE_RESYNC_MESSAGE";

const CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_ =
  50;

const CHECKIN_SHEET_SYNC_TRIGGER_FUNCTION_ =
  "runPendingCheckinSheetSyncJob_";

const CHECKIN_SHEET_SYNC_STATUS_KEY_ =
  "CHECKIN_SHEET_SYNC_STATUS";

const CHECKIN_SHEET_SYNC_MESSAGE_KEY_ =
  "CHECKIN_SHEET_SYNC_MESSAGE";

const CHECKIN_SHEET_SYNC_BATCH_SIZE_ =
  25;

function isFirestoreEnabled_() {

  const enabled =
    String(getConfigOptional_(FIRESTORE_ENABLED_KEY_) || "").toUpperCase();

  const projectId =
    getFirestoreProjectId_();

  return enabled === "TRUE" &&
    !!projectId &&
    !isFirestoreTemporarilyPaused_();
}

function isFirestoreTemporarilyPaused_() {

  const cacheUntil =
    Number(
      CacheService
        .getScriptCache()
        .get(FIRESTORE_PAUSE_CACHE_KEY_) || 0
    );

  const propertyUntil =
    Number(
      PropertiesService
        .getScriptProperties()
        .getProperty(FIRESTORE_PAUSE_UNTIL_PROPERTY_KEY_) || 0
    );

  const until =
    Math.max(
      cacheUntil,
      propertyUntil
    );

  return !!until && until > Date.now();
}

function getFirestoreTemporaryPauseReason_() {

  const cacheReason =
    CacheService
      .getScriptCache()
      .get(FIRESTORE_PAUSE_REASON_CACHE_KEY_);

  if (cacheReason) {
    return String(cacheReason);
  }

  return String(
    PropertiesService
      .getScriptProperties()
      .getProperty(FIRESTORE_PAUSE_REASON_PROPERTY_KEY_) || ""
  );
}

function pauseFirestoreTemporarily_(
  reason,
  seconds
) {

  seconds =
    Math.max(
      60,
      Math.min(
        Number(seconds || 600),
        86400
      )
    );

  const cache =
    CacheService.getScriptCache();

  const until =
    Date.now() + seconds * 1000;

  const reasonText =
    String(reason || "Firestoreを一時停止しました。").slice(0, 500);

  cache.put(
    FIRESTORE_PAUSE_CACHE_KEY_,
    String(until),
    Math.min(seconds, 21600)
  );

  cache.put(
    FIRESTORE_PAUSE_REASON_CACHE_KEY_,
    reasonText,
    Math.min(seconds, 21600)
  );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      FIRESTORE_PAUSE_UNTIL_PROPERTY_KEY_,
      String(until)
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      FIRESTORE_PAUSE_REASON_PROPERTY_KEY_,
      reasonText
    );
}

function shouldPauseFirestoreByResponse_(
  response,
  context
) {

  if (!response) {
    return false;
  }

  const code =
    response.getResponseCode();

  if (code !== 429 && code !== 503) {
    return false;
  }

  pauseFirestoreTemporarily_(
    String(context || "Firestore") +
      " / HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 200),
    code === 429
      ? 43200
      : 600
  );

  return true;
}

function getFirestoreSkippedResult_(
  message
) {

  return {
    ok: true,
    skipped: true,
    duplicate: false,
    message:
      message ||
      "Firestoreが一時停止中のため、スプレッドシート側で処理します。"
  };
}

function getFirestoreProjectId_() {

  return String(
    getConfigOptional_(FIRESTORE_PROJECT_ID_KEY_) || ""
  ).trim();
}

function testFirestoreConnectionJsonp_(e) {

  return jsonpOutput_(
    e,
    testFirestoreConnection_()
  );
}

function authorizeFirestore() {

  const result =
    testFirestoreConnection_();

  Logger.log(
    JSON.stringify(result)
  );

  return result;
}

function testFirestoreConnection_() {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      enabled: false,
      message: "Firestore連携は未使用です。"
    };
  }

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/_system/connection";

  const payload =
    {
      fields: firestoreFields_(
        {
          checkedAt: new Date(),
          source: "Apps Script",
          projectId: projectId
        }
      )
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "patch",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  const readValue =
    String(value("readValue") || "").trim();

  const plannedMatch =
    readValue.match(/^PLANNED:(.+)$/);

  return {
    ok: code >= 200 && code < 300,
    enabled: true,
    message:
      code >= 200 && code < 300
        ? "Firestoreへ接続できます。"
        : "Firestoreへ接続できません。",
    detail:
      code >= 200 && code < 300
        ? "_system / connection に確認用データを書き込みました。"
        : "HTTP " + code + " / " + response.getContentText().slice(0, 300)
  };
}

function syncCheckinHistoryToFirestore_(
  historyRowNo,
  eventId,
  method,
  readValue,
  memberNo,
  companyName,
  block,
  branch,
  district,
  result,
  note,
  meta,
  checkedAt
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      message: "Firestore連携は未使用です。"
    };
  }

  if (isFirestoreTemporarilyPaused_()) {
    return getFirestoreSkippedResult_(
      getFirestoreTemporaryPauseReason_()
    );
  }

  meta =
    meta || {};

  const projectId =
    getFirestoreProjectId_();

  const documentId =
    makeFirestoreDocumentId_(
      String(historyRowNo || Utilities.getUuid())
    );

  const path =
    "trainings/" +
    encodeURIComponent(String(eventId || "").trim()) +
    "/checkins/" +
    encodeURIComponent(documentId);

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/" +
    path;

  const payload =
    {
      fields: firestoreFields_(
        {
          historyRowNo: historyRowNo || "",
          eventId: eventId || "",
          method: method || "",
          readValue: readValue || "",
          memberNo: memberNo || "",
          companyName: companyName || "",
          block: block || "",
          branch: branch || "",
          district: district || "",
          result: result || "",
          note: note || "",
          receptionCategory: meta.receptionCategory || "",
          verificationStatus: meta.verificationStatus || "",
          attendanceUnit: meta.attendanceUnit || "",
          personalId: meta.personalId || "",
          participantName: meta.participantName || "",
          mail: meta.guestMail || "",
          phone: meta.guestPhone || "",
          locationToken: meta.locationToken || "",
          latitude: meta.latitude || "",
          longitude: meta.longitude || "",
          distanceMeters: meta.distanceMeters || "",
          checkinOrganizationIds: meta.checkinOrganizationIds || "",
          checkinOrganizationNames: meta.checkinOrganizationNames || "",
          checkedAt: checkedAt || new Date(),
          updatedAt: new Date()
        }
      )
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "patch",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "受付履歴保存"
  );

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreへの受付履歴保存に失敗しました。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  return {
    ok: true,
    skipped: false,
    documentId: documentId
  };
}

function reserveFirestoreCheckinKey_(
  eventId,
  attendanceKey,
  data
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      duplicate: false,
      message: "Firestore連携が未使用、またはプロジェクトIDが未設定です。"
    };
  }

  if (isFirestoreTemporarilyPaused_()) {
    return getFirestoreSkippedResult_(
      getFirestoreTemporaryPauseReason_()
    );
  }

  eventId =
    String(eventId || "").trim();

  attendanceKey =
    makeFirestoreDocumentId_(
      attendanceKey
    );

  if (!eventId || !attendanceKey) {
    return {
      ok: true,
      skipped: true,
      duplicate: false,
      message: "受付キー作成に必要な研修IDまたは受付キーがありません。"
    };
  }

  const reservedAt =
    new Date();

  const payloadData =
    Object.assign(
      {},
      data || {},
      {
        eventId: eventId,
        attendanceKey: attendanceKey,
        status: "受付済み",
        sheetSyncStatus: "PENDING",
        sheetSyncMessage: "",
        reservedAt: reservedAt,
        checkedAt: reservedAt,
        updatedAt: reservedAt
      }
    );

  const createResult =
    createFirestoreDocument_(
    "trainings/" +
      encodeURIComponent(eventId) +
      "/checkinKeys",
    attendanceKey,
    payloadData
  );

  if (
    createResult &&
    createResult.duplicate
  ) {
    const existing =
      getFirestoreCheckinKey_(
        eventId,
        attendanceKey
      );

    if (
      existing &&
      existing.status === "受付済み"
    ) {
      return {
        ok: true,
        skipped: false,
        duplicate: true,
        checkedAt: existing.checkedAt,
        companyName: existing.companyName,
        participantName: existing.participantName
      };
    }

    writeFirestoreDocument_(
      "trainings/" +
      encodeURIComponent(eventId) +
      "/checkinKeys/" +
      encodeURIComponent(attendanceKey),
      payloadData
    );
  }

  try {
    queuePendingCheckinSheetSync_();
  } catch (syncQueueErr) {
    try {
      writeFirestoreDocument_(
        "trainings/" +
        encodeURIComponent(eventId) +
        "/checkinKeys/" +
        encodeURIComponent(attendanceKey),
        {
          sheetSyncMessage:
            "スプレッドシート後追い反映の予約に失敗しました。管理画面から再同期してください。詳細: " +
            String(syncQueueErr && syncQueueErr.message || syncQueueErr || "").slice(0, 200),
          updatedAt: new Date()
        }
      );
    } catch (messageErr) {
    }
  }

  return {
    ok: true,
    skipped: false,
    duplicate: false,
    checkedAt: formatDateTimeForClient_(
      reservedAt
    ),
    checkedAtDate: reservedAt
  };
}

function getFirestoreCheckinKey_(
  eventId,
  attendanceKey
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return null;
  }

  eventId =
    String(eventId || "").trim();

  attendanceKey =
    makeFirestoreDocumentId_(
      attendanceKey
    );

  if (!eventId || !attendanceKey) {
    return null;
  }

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    "/checkinKeys/" +
    encodeURIComponent(attendanceKey);

  const response =
    firestoreFetch_(
      url,
      {
        method: "get",
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "受付済み確認"
  );

  if (code === 404) {
    return null;
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの受付済み確認に失敗しました。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const doc =
    JSON.parse(
      response.getContentText() || "{}"
    );

  const fields =
    doc.fields || {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  const readValue =
    String(value("readValue") || "").trim();

  const plannedMatch =
    readValue.match(/^PLANNED:(.+)$/);

  return {
    attendanceKey: value("attendanceKey"),
    status: value("status"),
    checkedAt: formatDateTimeForClient_(
      value("checkedAt") || value("reservedAt")
    ),
    companyName: value("companyName"),
    participantName: value("participantName")
  };
}

function updateFirestoreCheckinKeyAfterHistory_(
  eventId,
  attendanceKey,
  historyRowNo,
  checkedAt
) {

  if (!isFirestoreEnabled_()) {
    return;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return;
  }

  eventId =
    String(eventId || "").trim();

  attendanceKey =
    makeFirestoreDocumentId_(
      attendanceKey
    );

  if (!eventId || !attendanceKey) {
    return;
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/checkinKeys/" +
    encodeURIComponent(attendanceKey),
    {
      historyRowNo: historyRowNo || "",
      checkedAt: checkedAt || new Date(),
      updatedAt: new Date()
    }
  );
}

function updateFirestoreCheckinStatus_(
  eventId,
  historyRowNo,
  attendanceKey,
  mode,
  reason,
  operator,
  updatedAt
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true
    };
  }

  if (isFirestoreTemporarilyPaused_()) {
    return getFirestoreSkippedResult_(
      getFirestoreTemporaryPauseReason_()
    );
  }

  eventId =
    String(eventId || "").trim();

  historyRowNo =
    String(historyRowNo || "").trim();

  if (!eventId || !historyRowNo) {
    return {
      ok: true,
      skipped: true
    };
  }

  const isCancel =
    String(mode || "").trim() === "cancel";

  const data =
    {
      result: isCancel ? "受付取消" : "受付完了",
      updatedAt: updatedAt || new Date()
    };

  if (isCancel) {
    data.canceledAt =
      updatedAt || new Date();
    data.canceledBy =
      operator || "";
    data.cancelReason =
      reason || "";
  } else {
    data.restoredAt =
      updatedAt || new Date();
    data.restoredBy =
      operator || "";
    data.restoreReason =
      reason || "";
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/checkins/" +
    encodeURIComponent(makeFirestoreDocumentId_(historyRowNo)),
    data
  );

  attendanceKey =
    makeFirestoreDocumentId_(
      attendanceKey || ""
    );

  if (attendanceKey) {
    writeFirestoreDocument_(
      "trainings/" +
      encodeURIComponent(eventId) +
      "/checkinKeys/" +
      encodeURIComponent(attendanceKey),
      {
        status: isCancel ? "受付取消" : "受付済み",
        historyRowNo: historyRowNo,
        updatedAt: updatedAt || new Date()
      }
    );
  }

  return {
    ok: true,
    skipped: false
  };
}

function syncCheckinIndexTargetToFirestore_(
  eventId,
  member,
  targetType,
  status,
  checkedAt,
  method,
  historyRowNo,
  note,
  updatedAt
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true
    };
  }

  if (isFirestoreTemporarilyPaused_()) {
    return getFirestoreSkippedResult_(
      getFirestoreTemporaryPauseReason_()
    );
  }

  eventId =
    String(eventId || "").trim();

  const targetKey =
    makeFirestoreDocumentId_(
      makeCheckinIndexKey_(
        member
      )
    );

  if (!eventId || !targetKey) {
    return {
      ok: true,
      skipped: true
    };
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/targets/" +
    encodeURIComponent(targetKey),
    {
      eventId: eventId,
      targetKey: targetKey,
      plannedId: String(member && member.plannedId || "").trim(),
      memberNo: normalizeMemberNo_(member && member.memberNo),
      personalId: String(member && member.personalId || "").trim(),
      companyName: String(member && member.companyName || "").trim(),
      participantName: String(member && (member.participantName || member.personName) || "").trim(),
      mail: String(member && member.mail || "").trim(),
      block: String(member && member.block || "").trim(),
      branch: String(member && member.branch || "").trim(),
      district: String(member && member.district || "").trim(),
      targetType: targetType || "",
      status: status || "未受付",
      checkedAt: checkedAt || "",
      method: method || "",
      historyRowNo: historyRowNo || "",
      note: note || "",
      updatedAt: updatedAt || new Date()
    }
  );

  return {
    ok: true,
    skipped: false,
    targetKey: targetKey
  };
}

function syncCheckinIndexTargetsToFirestore_(
  eventId,
  items
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      count: 0
    };
  }

  if (isFirestoreTemporarilyPaused_()) {
    return {
      ok: true,
      skipped: true,
      count: 0,
      message: getFirestoreTemporaryPauseReason_()
    };
  }

  let count =
    0;

  (items || []).forEach(function(item) {

    try {
      syncCheckinIndexTargetToFirestore_(
        eventId,
        item.member,
        item.targetType,
        item.status,
        item.checkedAt,
        item.method,
        item.historyRowNo,
        item.note,
        item.updatedAt
      );

      count++;
    } catch (err) {
    }
  });

  return {
    ok: true,
    skipped: false,
    count: count
  };
}

function queueCheckinFirestoreResyncJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      queueCheckinFirestoreResync_();
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

function getCheckinFirestoreResyncStatusJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getCheckinFirestoreResyncStatus_();
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

function queuePendingCheckinSheetSyncJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    queuePendingCheckinSheetSync_();
    result = {
      ok: true,
      message: "未同期受付のスプレッドシート反映を予約しました。"
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

function queueCheckinFirestoreResync_() {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      message: "Firestore連携は未使用です。"
    };
  }

  const props =
    PropertiesService.getScriptProperties();

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_STATUS_KEY_,
    "RUNNING"
  );

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_,
    "HISTORY"
  );

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_,
    "2"
  );

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
    "参加履歴からFirestoreへ再同期を開始します。"
  );

  scheduleCheckinFirestoreResyncTrigger_(
    30
  );

  return {
    ok: true,
    queued: true,
    message: "受付データのFirestore再同期を予約しました。"
  };
}

function getCheckinFirestoreResyncStatus_() {

  const props =
    PropertiesService.getScriptProperties();

  return {
    ok: true,
    status: String(props.getProperty(CHECKIN_FIRESTORE_RESYNC_STATUS_KEY_) || "未実行"),
    phase: String(props.getProperty(CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_) || ""),
    offset: Number(props.getProperty(CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_) || 0),
    batchSize: CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_,
    message: String(props.getProperty(CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_) || "受付データのFirestore再同期はまだ実行されていません。"),
    sheetSyncStatus: String(props.getProperty(CHECKIN_SHEET_SYNC_STATUS_KEY_) || "未実行"),
    sheetSyncMessage: String(props.getProperty(CHECKIN_SHEET_SYNC_MESSAGE_KEY_) || "Firestoreからスプレッドシートへの未同期受付反映はまだ実行されていません。")
  };
}

function runPendingCheckinSheetSyncJob_() {

  processPendingCheckinSheetSyncJob_();
}

function processPendingCheckinSheetSyncJob_() {

  const props =
    PropertiesService.getScriptProperties();

  if (!isFirestoreEnabled_()) {
    props.setProperty(
      CHECKIN_SHEET_SYNC_STATUS_KEY_,
      "DONE"
    );
    props.setProperty(
      CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
      "Firestore連携は未使用です。"
    );
    removePendingCheckinSheetSyncTriggers_();
    return;
  }

  if (isFirestoreTemporarilyPaused_()) {
    props.setProperty(
      CHECKIN_SHEET_SYNC_STATUS_KEY_,
      "RUNNING"
    );
    props.setProperty(
      CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
      "Firestoreが一時停止中です。復旧後に未同期受付を反映します。詳細: " +
        getFirestoreTemporaryPauseReason_()
    );
    schedulePendingCheckinSheetSyncTrigger_(
      600
    );
    return;
  }

  let result;

  try {
    result =
      syncPendingFirestoreCheckinsToSheet_(
        CHECKIN_SHEET_SYNC_BATCH_SIZE_
      );
  } catch (err) {
    props.setProperty(
      CHECKIN_SHEET_SYNC_STATUS_KEY_,
      "RUNNING"
    );
    props.setProperty(
      CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
      "未同期受付のスプレッドシート反映で停止しました。続きから再実行します。詳細: " +
        err.message
    );
    schedulePendingCheckinSheetSyncTrigger_(
      600
    );
    return;
  }

  if (result.remaining) {
    props.setProperty(
      CHECKIN_SHEET_SYNC_STATUS_KEY_,
      "RUNNING"
    );
    props.setProperty(
      CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
      "未同期受付をスプレッドシートへ反映中です。今回反映: " +
        result.synced +
        "件"
    );
    schedulePendingCheckinSheetSyncTrigger_(
      30
    );
    return;
  }

  props.setProperty(
    CHECKIN_SHEET_SYNC_STATUS_KEY_,
    "DONE"
  );
  props.setProperty(
    CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
    "未同期受付のスプレッドシート反映は完了しています。"
  );
  removePendingCheckinSheetSyncTriggers_();
}

function syncPendingFirestoreCheckinsToSheet_(
  limit
) {

  const items =
    getPendingFirestoreCheckinKeys_(
      limit
    );

  let synced =
    0;

  items.forEach(function(item) {
    if (
      syncPendingFirestoreCheckinToSheet_(
        item
      )
    ) {
      synced++;
    }
  });

  return {
    ok: true,
    synced: synced,
    remaining: items.length >= Number(limit || CHECKIN_SHEET_SYNC_BATCH_SIZE_)
  };
}

function syncPendingFirestoreCheckinToSheet_(
  item
) {

  const data =
    item && item.data
      ? item.data
      : {};

  const eventId =
    String(data.eventId || "").trim();

  const attendanceKey =
    String(data.attendanceKey || "").trim();

  if (!eventId || !attendanceKey) {
    return false;
  }

  const personalId =
    String(data.personalId || "").trim();

  const memberNo =
    normalizeMemberNo_(
      data.memberNo
    );

  let duplicate =
    personalId
      ? isDuplicatePersonalCheckin_(
          eventId,
          personalId
        )
      : (
          memberNo
            ? isDuplicateCheckin_(
                eventId,
                memberNo
              )
            : null
        );

  let historyRowNo =
    duplicate && duplicate.rowNo
      ? duplicate.rowNo
      : "";

  const checkedAt =
    data.checkedAt || data.reservedAt || new Date();

  const member =
    {
      memberNo: memberNo,
      personalId: personalId,
      companyName: String(data.companyName || "").trim(),
      participantName: String(data.participantName || "").trim(),
      mail: String(data.guestMail || data.mail || "").trim(),
      block: String(data.block || "").trim(),
      branch: String(data.branch || "").trim(),
      district: String(data.district || "").trim()
    };

  if (!duplicate) {
    historyRowNo =
      saveCheckinHistory_(
        eventId,
        data.method || "",
        data.readValue || attendanceKey,
        memberNo,
        member.companyName,
        member.block,
        member.branch,
        member.district,
        "受付完了",
        "",
        {
          receptionCategory: data.receptionCategory || "",
          verificationStatus: data.verificationStatus || "",
          participantName: member.participantName || "",
          attendanceUnit: data.attendanceUnit || (personalId ? "個人" : "会社"),
          personalId: personalId,
          guestMail: data.guestMail || data.mail || "",
          guestPhone: data.guestPhone || "",
          locationToken: data.locationToken || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          distanceMeters: data.distanceMeters || "",
          checkedAt: checkedAt
        }
      );

    updateCheckinIndexAfterCheckin_(
      eventId,
      member,
      data.method || "",
      historyRowNo,
      checkedAt
    );
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/checkinKeys/" +
    encodeURIComponent(makeFirestoreDocumentId_(attendanceKey)),
    {
      sheetSyncStatus: "SYNCED",
      sheetSyncMessage: "",
      historyRowNo: historyRowNo || "",
      checkedAt: checkedAt || new Date(),
      updatedAt: new Date()
    }
  );

  return true;
}

function getPendingFirestoreCheckinKeys_(
  limit
) {

  if (!isFirestoreEnabled_()) {
    return [];
  }

  if (isFirestoreTemporarilyPaused_()) {
    return [];
  }

  limit =
    Math.max(
      1,
      Math.min(
        Number(limit || CHECKIN_SHEET_SYNC_BATCH_SIZE_),
        100
      )
    );

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents:runQuery";

  const payload =
    {
      structuredQuery: {
        from: [
          {
            collectionId: "checkinKeys",
            allDescendants: true
          }
        ],
        where: {
          fieldFilter: {
            field: {
              fieldPath: "sheetSyncStatus"
            },
            op: "EQUAL",
            value: {
              stringValue: "PENDING"
            }
          }
        },
        limit: limit
      }
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "未同期受付取得"
  );

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの未同期受付を取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const rows =
    JSON.parse(
      response.getContentText() || "[]"
    );

  const items = [];

  rows.forEach(function(row) {
    if (!row || !row.document) {
      return;
    }

    items.push({
      name: row.document.name,
      data: firestoreDocumentToPlainObject_(
        row.document
      )
    });
  });

  return items;
}

function runCheckinFirestoreResyncJob_() {

  processCheckinFirestoreResyncJob_();
}

function processCheckinFirestoreResyncJob_() {

  const props =
    PropertiesService.getScriptProperties();

  const status =
    String(props.getProperty(CHECKIN_FIRESTORE_RESYNC_STATUS_KEY_) || "");

  if (status !== "RUNNING") {
    removeCheckinFirestoreResyncTriggers_();
    return;
  }

  if (isFirestoreTemporarilyPaused_()) {
    props.setProperty(
      CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
      "Firestoreが一時停止中です。復旧後に続きを再実行します。詳細: " +
        getFirestoreTemporaryPauseReason_()
    );

    scheduleCheckinFirestoreResyncTrigger_(
      600
    );
    return;
  }

  const phase =
    String(props.getProperty(CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_) || "HISTORY");

  const offset =
    Number(props.getProperty(CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_) || 2);

  let result;

  try {
    result =
      phase === "INDEX"
        ? syncCheckinIndexSheetToFirestoreChunk_(
            offset,
            CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_
          )
        : syncCheckinHistorySheetToFirestoreChunk_(
            offset,
            CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_
          );
  } catch (err) {
    props.setProperty(
      CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
      "受付データのFirestore再同期で停止しました。続きから再実行します。詳細: " +
        err.message
    );

    scheduleCheckinFirestoreResyncTrigger_(
      600
    );
    return;
  }

  if (result.done) {
    if (phase !== "INDEX") {
      props.setProperty(
        CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_,
        "INDEX"
      );

      props.setProperty(
        CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_,
        "2"
      );

      props.setProperty(
        CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
        "参加履歴の再同期が完了しました。受付索引をFirestoreへ再同期します。"
      );

      scheduleCheckinFirestoreResyncTrigger_(
        30
      );
      return;
    }

    props.setProperty(
      CHECKIN_FIRESTORE_RESYNC_STATUS_KEY_,
      "DONE"
    );

    props.deleteProperty(
      CHECKIN_FIRESTORE_RESYNC_PHASE_KEY_
    );

    props.deleteProperty(
      CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_
    );

    props.setProperty(
      CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
      "受付データのFirestore再同期は完了しています。"
    );

    removeCheckinFirestoreResyncTriggers_();
    return;
  }

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_OFFSET_KEY_,
    String(result.nextOffset || offset)
  );

  props.setProperty(
    CHECKIN_FIRESTORE_RESYNC_MESSAGE_KEY_,
    result.message || "受付データをFirestoreへ再同期中です。"
  );

  scheduleCheckinFirestoreResyncTrigger_(
    30
  );
}

function syncCheckinHistorySheetToFirestoreChunk_(
  offset,
  limit
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      done: true,
      processed: 0,
      synced: 0
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const lastRow =
    sheet.getLastRow();

  const startRow =
    Math.max(2, Number(offset || 2));

  if (startRow > lastRow) {
    return {
      done: true,
      processed: 0,
      synced: 0
    };
  }

  const rowCount =
    Math.min(
      Number(limit || CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_),
      lastRow - startRow + 1
    );

  const values =
    sheet
      .getRange(
        startRow,
        1,
        rowCount,
        sheet.getLastColumn()
      )
      .getValues();

  let synced =
    0;

  values.forEach(function(row, index) {
    const rowNo =
      startRow + index;

    if (
      syncCheckinHistoryRowToFirestore_(
        rowNo,
        row,
        headerMap
      )
    ) {
      synced++;
    }
  });

  const nextOffset =
    startRow + rowCount;

  return {
    done: nextOffset > lastRow,
    nextOffset: nextOffset,
    processed: rowCount,
    synced: synced,
    message:
      "参加履歴をFirestoreへ再同期中です。処理済み: " +
      (nextOffset - 2) +
      " / " +
      (lastRow - 1) +
      " 行"
  };
}

function syncCheckinHistoryRowToFirestore_(
  rowNo,
  row,
  headerMap
) {

  const eventId =
    String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

  if (!eventId) {
    return false;
  }

  const memberNo =
    normalizeMemberNo_(
      getCellByHeader_(row, headerMap, "業者番号")
    );

  const personalId =
    String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();

  const result =
    String(getCellByHeader_(row, headerMap, "結果") || "").trim();

  const checkedAt =
    getCellByHeader_(row, headerMap, "日時") || new Date();

  const meta =
    {
      receptionCategory: getCellByHeader_(row, headerMap, "受付区分") || "",
      verificationStatus: getCellByHeader_(row, headerMap, "照合状態") || "",
      attendanceUnit: getCellByHeader_(row, headerMap, "受付単位") || "",
      personalId: personalId,
      participantName: getCellByHeader_(row, headerMap, "参加者名") || "",
      guestMail: getCellByHeader_(row, headerMap, "メール") || "",
      guestPhone: getCellByHeader_(row, headerMap, "電話") || "",
      locationToken: getCellByHeader_(row, headerMap, "受付トークン") || "",
      latitude: getCellByHeader_(row, headerMap, "緯度") || "",
      longitude: getCellByHeader_(row, headerMap, "経度") || "",
      distanceMeters: getCellByHeader_(row, headerMap, "会場距離m") || "",
      checkinOrganizationIds: getCellByHeader_(row, headerMap, "受付時所属組織ID") || "",
      checkinOrganizationNames: getCellByHeader_(row, headerMap, "受付時所属組織名") || ""
    };

  syncCheckinHistoryToFirestore_(
    rowNo,
    eventId,
    getCellByHeader_(row, headerMap, "受付方法") || "",
    getCellByHeader_(row, headerMap, "読取値") || "",
    memberNo,
    getCellByHeader_(row, headerMap, "会社名") || "",
    getCellByHeader_(row, headerMap, "ブロック") || "",
    getCellByHeader_(row, headerMap, "支部") || "",
    getCellByHeader_(row, headerMap, "地区") || "",
    result,
    cleanFirestoreSyncNote_(
      getCellByHeader_(row, headerMap, "備考") || ""
    ),
    meta,
    checkedAt
  );

  syncFirestoreCheckinKeySnapshotIfNeeded_(
    eventId,
    memberNo,
    personalId,
    getCellByHeader_(row, headerMap, "会社名") || "",
    meta.participantName || "",
    result,
    rowNo,
    checkedAt
  );

  return true;
}

function syncCheckinIndexSheetToFirestoreChunk_(
  offset,
  limit
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName(
      CHECKIN_INDEX_SHEET_NAME_
    );

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      done: true,
      processed: 0,
      synced: 0
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const lastRow =
    sheet.getLastRow();

  const startRow =
    Math.max(2, Number(offset || 2));

  if (startRow > lastRow) {
    return {
      done: true,
      processed: 0,
      synced: 0
    };
  }

  const rowCount =
    Math.min(
      Number(limit || CHECKIN_FIRESTORE_RESYNC_BATCH_SIZE_),
      lastRow - startRow + 1
    );

  const values =
    sheet
      .getRange(
        startRow,
        1,
        rowCount,
        sheet.getLastColumn()
      )
      .getValues();

  let synced =
    0;

  values.forEach(function(row) {
    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (!eventId) {
      return;
    }

    const member =
      {
        plannedId: String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim(),
        memberNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
        personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
        companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
        participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
        mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
        block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
        branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
        district: String(getCellByHeader_(row, headerMap, "地区") || "").trim()
      };

    const status =
      String(getCellByHeader_(row, headerMap, "受付状態") || "").trim();

    const checkedAt =
      getCellByHeader_(row, headerMap, "受付日時") || "";

    const historyRowNo =
      String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim();

    syncCheckinIndexTargetToFirestore_(
      eventId,
      member,
      getCellByHeader_(row, headerMap, "対象区分") || "",
      status,
      checkedAt,
      getCellByHeader_(row, headerMap, "受付方法") || "",
      historyRowNo,
      getCellByHeader_(row, headerMap, "備考") || "",
      getCellByHeader_(row, headerMap, "更新日時") || new Date()
    );

    syncFirestoreCheckinKeySnapshotIfNeeded_(
      eventId,
      member.memberNo,
      member.personalId,
      member.companyName,
      member.participantName,
      status === "取消済み" ? "受付取消" : status,
      historyRowNo,
      checkedAt
    );

    synced++;
  });

  const nextOffset =
    startRow + rowCount;

  return {
    done: nextOffset > lastRow,
    nextOffset: nextOffset,
    processed: rowCount,
    synced: synced,
    message:
      "受付索引をFirestoreへ再同期中です。処理済み: " +
      (nextOffset - 2) +
      " / " +
      (lastRow - 1) +
      " 行"
  };
}

function syncFirestoreCheckinKeySnapshotIfNeeded_(
  eventId,
  memberNo,
  personalId,
  companyName,
  participantName,
  status,
  historyRowNo,
  checkedAt
) {

  const normalizedStatus =
    String(status || "").trim();

  if (
    normalizedStatus !== "受付完了" &&
    normalizedStatus !== "受付済み" &&
    normalizedStatus !== "受付取消"
  ) {
    return;
  }

  const attendanceKey =
    personalId
      ? makeFirestorePersonalAttendanceKey_(
          personalId
        )
      : (
          memberNo
            ? makeFirestoreMemberAttendanceKey_(
                memberNo
              )
            : ""
        );

  if (!attendanceKey) {
    return;
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(String(eventId || "").trim()) +
    "/checkinKeys/" +
    encodeURIComponent(makeFirestoreDocumentId_(attendanceKey)),
    {
      eventId: eventId,
      attendanceKey: makeFirestoreDocumentId_(attendanceKey),
      status:
        normalizedStatus === "受付取消"
          ? "受付取消"
          : "受付済み",
      historyRowNo: historyRowNo || "",
      checkedAt: checkedAt || "",
      companyName: companyName || "",
      participantName: participantName || "",
      updatedAt: new Date()
    }
  );
}

function queuePendingCheckinSheetSync_() {

  const props =
    PropertiesService.getScriptProperties();

  props.setProperty(
    CHECKIN_SHEET_SYNC_STATUS_KEY_,
    "RUNNING"
  );

  props.setProperty(
    CHECKIN_SHEET_SYNC_MESSAGE_KEY_,
    "未同期受付をスプレッドシートへ反映する処理を予約しました。"
  );

  schedulePendingCheckinSheetSyncTrigger_(
    30
  );
}

function schedulePendingCheckinSheetSyncTrigger_(
  seconds
) {

  removePendingCheckinSheetSyncTriggers_();

  ScriptApp
    .newTrigger(
      CHECKIN_SHEET_SYNC_TRIGGER_FUNCTION_
    )
    .timeBased()
    .after(Math.max(30, Number(seconds || 30)) * 1000)
    .create();
}

function removePendingCheckinSheetSyncTriggers_() {

  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (
        trigger.getHandlerFunction() ===
        CHECKIN_SHEET_SYNC_TRIGGER_FUNCTION_
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    });
}

function cleanFirestoreSyncNote_(
  note
) {

  return String(note || "")
    .replace(/Firestore同期未完了:.*$/g, "")
    .replace(/\s+\/\s*$/g, "")
    .trim();
}

function scheduleCheckinFirestoreResyncTrigger_(
  seconds
) {

  removeCheckinFirestoreResyncTriggers_();

  ScriptApp
    .newTrigger(
      CHECKIN_FIRESTORE_RESYNC_TRIGGER_FUNCTION_
    )
    .timeBased()
    .after(Math.max(30, Number(seconds || 30)) * 1000)
    .create();
}

function removeCheckinFirestoreResyncTriggers_() {

  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (
        trigger.getHandlerFunction() ===
        CHECKIN_FIRESTORE_RESYNC_TRIGGER_FUNCTION_
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    });
}

function getFirestoreCheckinTargets_(
  eventId
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return null;
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return null;
  }

  const projectId =
    getFirestoreProjectId_();

  let url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    "/targets?pageSize=300";

  const targets = [];
  let pageCount = 0;

  while (url && pageCount < 10) {

    pageCount++;

    const response =
      firestoreFetch_(
        url,
        {
          method: "get",
          muteHttpExceptions: true
        }
      );

    const code =
      response.getResponseCode();

    shouldPauseFirestoreByResponse_(
      response,
      "受付対象取得"
    );

    if (code === 404) {
      return [];
    }

    if (code < 200 || code >= 300) {
      throw new Error(
        "Firestoreの受付対象を取得できません。HTTP " +
        code +
        " / " +
        response.getContentText().slice(0, 300)
      );
    }

    const data =
      JSON.parse(
        response.getContentText() || "{}"
      );

    (data.documents || []).forEach(function(doc) {
      targets.push(
        firestoreTargetDocumentToMember_(
          doc
        )
      );
    });

    url =
      data.nextPageToken
        ? "https://firestore.googleapis.com/v1/projects/" +
          encodeURIComponent(projectId) +
          "/databases/%28default%29/documents/trainings/" +
          encodeURIComponent(eventId) +
          "/targets?pageSize=300&pageToken=" +
          encodeURIComponent(data.nextPageToken)
        : "";
  }

  return targets;
}

function clearFirestoreCheckinTargets_(
  eventId
) {

  const targets =
    getFirestoreCheckinTargets_(
      eventId
    );

  if (!targets) {
    return {
      ok: true,
      skipped: true,
      count: 0
    };
  }

  const projectId =
    getFirestoreProjectId_();

  let count =
    0;

  targets.forEach(function(item) {

    const targetKey =
      makeFirestoreDocumentId_(
        item.targetKey ||
        makeCheckinIndexKey_(
          item
        )
      );

    if (!targetKey) {
      return;
    }

    const url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/%28default%29/documents/trainings/" +
      encodeURIComponent(eventId) +
      "/targets/" +
      encodeURIComponent(targetKey);

    const response =
      firestoreFetch_(
        url,
        {
          method: "delete",
          muteHttpExceptions: true
        }
      );

    const code =
      response.getResponseCode();

    if (code >= 200 && code < 300 || code === 404) {
      count++;
    }
  });

  return {
    ok: true,
    skipped: false,
    count: count
  };
}

function syncPlannedAttendeeToFirestore_(
  attendee
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true
    };
  }

  const eventId =
    String(attendee && attendee.eventId || "").trim();

  const plannedId =
    String(attendee && attendee.plannedId || "").trim();

  if (!eventId || !plannedId) {
    return {
      ok: true,
      skipped: true
    };
  }

  writeFirestoreDocument_(
    "trainings/" +
    encodeURIComponent(eventId) +
    "/plannedAttendees/" +
    encodeURIComponent(makeFirestoreDocumentId_(plannedId)),
    {
      eventId: eventId,
      plannedId: plannedId,
      receptionCategory: String(attendee.receptionCategory || "").trim(),
      block: String(attendee.block || "").trim(),
      branch: String(attendee.branch || "").trim(),
      companyName: String(attendee.companyName || "").trim(),
      participantName: String(attendee.participantName || "").trim(),
      mail: String(attendee.mail || "").trim(),
      phone: String(attendee.phone || "").trim(),
      note: String(attendee.note || "").trim(),
      status: String(attendee.status || "未受付").trim(),
      historyRowNo: String(attendee.historyRowNo || "").trim(),
      checkedAt: attendee.checkedAt || "",
      hidden: String(attendee.hidden || "FALSE").trim().toUpperCase() === "TRUE",
      createdAt: attendee.createdAt || new Date(),
      updatedAt: attendee.updatedAt || new Date()
    }
  );

  return {
    ok: true,
    skipped: false,
    plannedId: plannedId
  };
}

function getFirestorePlannedAttendees_(
  eventId
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return null;
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return [];
  }

  const projectId =
    getFirestoreProjectId_();

  let url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    "/plannedAttendees?pageSize=300";

  const attendees = [];
  let pageCount = 0;

  while (url && pageCount < 10) {

    pageCount++;

    const response =
      firestoreFetch_(
        url,
        {
          method: "get",
          muteHttpExceptions: true
        }
      );

    const code =
      response.getResponseCode();

    shouldPauseFirestoreByResponse_(
      response,
      "予定者一覧取得"
    );

    if (code === 404) {
      return [];
    }

    if (code < 200 || code >= 300) {
      throw new Error(
        "Firestoreの予定者一覧を取得できません。HTTP " +
        code +
        " / " +
        response.getContentText().slice(0, 300)
      );
    }

    const data =
      JSON.parse(
        response.getContentText() || "{}"
      );

    (data.documents || []).forEach(function(doc) {
      const attendee =
        firestorePlannedAttendeeDocumentToItem_(
          doc
        );

      if (!attendee.hidden) {
        attendees.push(
          attendee
        );
      }
    });

    url =
      data.nextPageToken
        ? "https://firestore.googleapis.com/v1/projects/" +
          encodeURIComponent(projectId) +
          "/databases/%28default%29/documents/trainings/" +
          encodeURIComponent(eventId) +
          "/plannedAttendees?pageSize=300&pageToken=" +
          encodeURIComponent(data.nextPageToken)
        : "";
  }

  attendees.sort(function(a, b) {
    return (a.status > b.status ? 1 : -1) ||
      (a.receptionCategory > b.receptionCategory ? 1 : -1) ||
      (a.participantName > b.participantName ? 1 : -1);
  });

  return attendees;
}

function firestorePlannedAttendeeDocumentToItem_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  const plannedId =
    String(value("plannedId") || "").trim();

  return {
    rowNo: "",
    createdAt: formatDateTimeForClient_(value("createdAt")),
    updatedAt: formatDateTimeForClient_(value("updatedAt")),
    eventId: String(value("eventId") || "").trim(),
    plannedId: plannedId,
    receptionCategory: String(value("receptionCategory") || "").trim(),
    block: String(value("block") || "").trim(),
    branch: String(value("branch") || "").trim(),
    companyName: String(value("companyName") || "").trim(),
    participantName: String(value("participantName") || "").trim(),
    mail: String(value("mail") || "").trim(),
    phone: String(value("phone") || "").trim(),
    note: String(value("note") || "").trim(),
    status: String(value("status") || "未受付").trim(),
    historyRowNo: String(value("historyRowNo") || "").trim(),
    checkedAt: formatDateTimeForClient_(value("checkedAt")),
    hidden: value("hidden") === true,
    qrText: plannedId ? "PLANNED:" + plannedId : "",
    locationUrl: ""
  };
}

function searchFirestoreCheckinTargets_(
  eventId,
  keyword,
  branch,
  limit
) {

  const targets =
    getFirestoreCheckinTargets_(
      eventId
    );

  if (!targets || targets.length === 0) {
    return targets
      ? {
          ok: true,
          indexReady: false,
          members: [],
          count: 0,
          source: "Firestore受付索引"
        }
      : null;
  }

  const key =
    normalizeFirestoreCheckinSearchText_(
      keyword
    );

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          branch
        )
      : String(branch || "").trim();

  const max =
    Math.max(
      1,
      Math.min(
        Number(limit || 50),
        100
      )
    );

  const list = [];

  for (let i = 0; i < targets.length; i++) {

    const item =
      targets[i];

    if (
      branchKey &&
      (
        typeof normalizeCheckinIndexBranchName_ === "function"
          ? normalizeCheckinIndexBranchName_(item.branch)
          : String(item.branch || "").trim()
      ) !== branchKey
    ) {
      continue;
    }

    const searchText =
      normalizeFirestoreCheckinSearchText_(
        [
          item.memberNo,
          item.personalId,
          item.plannedId,
          item.companyName,
          item.participantName,
          item.mail,
          item.block,
          item.branch,
          item.district,
          item.targetType
        ].join(" ")
      );

    if (
      key &&
      searchText.indexOf(key) === -1
    ) {
      continue;
    }

    list.push(item);

    if (list.length >= max) {
      break;
    }
  }

  return {
    ok: true,
    indexReady: true,
    members: list,
    count: list.length,
    source: "Firestore受付索引",
    total: targets.length
  };
}

function normalizeFirestoreCheckinSearchText_(
  value
) {

  let text =
    String(value || "");

  if (text.normalize) {
    text =
      text.normalize("NFKC");
  }

  return text
    .replace(/株式会社/g, "株")
    .replace(/有限会社/g, "有")
    .replace(/[ 　\t\r\n]/g, "")
    .replace(/区支部/g, "支部")
    .replace(/第十ブロック/g, "第十")
    .replace(/斉/g, "斎")
    .replace(/髙/g, "高")
    .toLowerCase();
}

function firestoreTargetDocumentToMember_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  const readValue =
    String(value("readValue") || "").trim();

  const plannedMatch =
    readValue.match(/^PLANNED:(.+)$/);

  return {
    targetKey: String(value("targetKey") || "").trim(),
    plannedId: String(value("plannedId") || "").trim(),
    memberNo: normalizeMemberNo_(
      value("memberNo")
    ),
    personalId: String(value("personalId") || "").trim(),
    companyName: String(value("companyName") || "").trim(),
    participantName: String(value("participantName") || "").trim(),
    representativeName: String(value("participantName") || "").trim(),
    mail: String(value("mail") || "").trim(),
    block: String(value("block") || "").trim(),
    branch: String(value("branch") || "").trim(),
    district: String(value("district") || "").trim(),
    targetType: String(value("targetType") || "").trim(),
    status: String(value("status") || "未受付").trim(),
    checkedAt: formatDateTimeForClient_(
      value("checkedAt")
    ),
    method: String(value("method") || "").trim(),
    source: "Firestore受付索引"
  };
}

function syncMemberMasterToFirestore_(
  members
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      count: 0
    };
  }

  let count =
    0;

  let unchanged =
    0;

  let failed =
    0;

  const existingMap =
    getFirestoreMemberMap_();

  (members || []).forEach(function(member) {

    try {
      if (
        !shouldSyncMemberToFirestore_(
          member,
          existingMap
        )
      ) {
        unchanged++;
        return;
      }

      syncMemberToFirestore_(
        member
      );

      count++;
    } catch (err) {
      failed++;
    }
  });

  return {
    ok: true,
    skipped: false,
    count: count,
    unchanged: unchanged,
    failed: failed,
    processed: (members || []).length
  };
}

function deactivateMissingMembersInFirestore_(
  activeMemberNoMap
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true,
      deactivated: 0,
      failed: 0
    };
  }

  const existingMembers =
    getFirestoreMembers_() || [];

  let deactivated =
    0;

  let failed =
    0;

  existingMembers.forEach(function(member) {

    const memberNo =
      normalizeMemberNo_(
        member && member.memberNo
      );

    if (!memberNo || activeMemberNoMap[memberNo]) {
      return;
    }

    if (
      String(member.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return;
    }

    try {
      syncMemberToFirestore_({
        memberNo: memberNo,
        companyName: member.companyName || "",
        representativeName: member.representativeName || "",
        mail: member.mail || "",
        block: member.block || "",
        branch: member.branch || "",
        district: member.district || "",
        active: "FALSE"
      });

      deactivated++;
    } catch (err) {
      failed++;
    }
  });

  return {
    ok: true,
    skipped: false,
    deactivated: deactivated,
    failed: failed
  };
}

function getFirestoreMemberMap_() {

  const list =
    getFirestoreMembers_() || [];

  const map = {};

  list.forEach(function(member) {
    if (member.memberNo) {
      map[member.memberNo] =
        member;
    }
  });

  return map;
}

function shouldSyncMemberToFirestore_(
  member,
  existingMap
) {

  const memberNo =
    normalizeMemberNo_(
      member && member.memberNo
    );

  if (!memberNo) {
    return false;
  }

  const existing =
    existingMap && existingMap[memberNo]
      ? existingMap[memberNo]
      : null;

  if (!existing) {
    return true;
  }

  const current = {
    memberNo: memberNo,
    companyName: String(member && member.companyName || "").trim(),
    representativeName: String(member && member.representativeName || "").trim(),
    mail: String(member && member.mail || "").trim(),
    block: String(member && member.block || "").trim(),
    branch: String(member && member.branch || "").trim(),
    branchKey:
      typeof normalizeCheckinIndexBranchName_ === "function"
        ? normalizeCheckinIndexBranchName_(member && member.branch || "")
        : String(member && member.branch || "").trim(),
    district: String(member && member.district || "").trim(),
    active: String(member && member.active || "TRUE").trim() || "TRUE"
  };

  return [
    "memberNo",
    "companyName",
    "representativeName",
    "mail",
    "block",
    "branch",
    "branchKey",
    "district",
    "active"
  ].some(function(key) {
    return String(current[key] || "") !== String(existing[key] || "");
  });
}

function syncMemberToFirestore_(
  member
) {

  if (!isFirestoreEnabled_()) {
    return {
      ok: true,
      skipped: true
    };
  }

  const memberNo =
    normalizeMemberNo_(
      member && member.memberNo
    );

  if (!memberNo) {
    return {
      ok: true,
      skipped: true
    };
  }

  writeFirestoreDocument_(
    "members/" +
    encodeURIComponent(makeFirestoreDocumentId_(memberNo)),
    {
      memberNo: memberNo,
      companyName: String(member && member.companyName || "").trim(),
      representativeName: String(member && member.representativeName || "").trim(),
      mail: String(member && member.mail || "").trim(),
      block: String(member && member.block || "").trim(),
      branch: String(member && member.branch || "").trim(),
      branchKey:
        typeof normalizeCheckinIndexBranchName_ === "function"
          ? normalizeCheckinIndexBranchName_(member && member.branch || "")
          : String(member && member.branch || "").trim(),
      district: String(member && member.district || "").trim(),
      active: String(member && member.active || "TRUE").trim() || "TRUE",
      updatedAt: new Date()
    }
  );

  return {
    ok: true,
    skipped: false,
    memberNo: memberNo
  };
}

function getFirestoreMembers_() {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return null;
  }

  const projectId =
    getFirestoreProjectId_();

  let url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/members?pageSize=300";

  const members = [];
  let pageCount = 0;

  while (url && pageCount < 20) {

    pageCount++;

    const response =
      firestoreFetch_(
        url,
        {
          method: "get",
          muteHttpExceptions: true
        }
      );

    const code =
      response.getResponseCode();

    shouldPauseFirestoreByResponse_(
      response,
      "会員マスタ取得"
    );

    if (code === 404) {
      return [];
    }

    if (code < 200 || code >= 300) {
      throw new Error(
        "Firestoreの会員マスタを取得できません。HTTP " +
        code +
        " / " +
        response.getContentText().slice(0, 300)
      );
    }

    const data =
      JSON.parse(
        response.getContentText() || "{}"
      );

    (data.documents || []).forEach(function(doc) {
      members.push(
        firestoreMemberDocumentToMember_(
          doc
        )
      );
    });

    url =
      data.nextPageToken
        ? "https://firestore.googleapis.com/v1/projects/" +
          encodeURIComponent(projectId) +
          "/databases/%28default%29/documents/members?pageSize=300&pageToken=" +
          encodeURIComponent(data.nextPageToken)
        : "";
  }

  return members;
}

function searchFirestoreMembersByBranch_(
  branch,
  limit
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  if (isFirestoreTemporarilyPaused_()) {
    return null;
  }

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(branch)
      : String(branch || "").trim();

  if (!branchKey) {
    return null;
  }

  limit =
    Math.max(
      1,
      Math.min(
        Number(limit || 700),
        1000
      )
    );

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents:runQuery";

  const payload = {
    structuredQuery: {
      from: [
        {
          collectionId: "members"
        }
      ],
      where: {
        fieldFilter: {
          field: {
            fieldPath: "branchKey"
          },
          op: "EQUAL",
          value: {
            stringValue: branchKey
          }
        }
      },
      limit: limit
    }
  };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "支部別会員マスタ取得"
  );

  if (code === 404) {
    return [];
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの支部別会員マスタを取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const rows =
    JSON.parse(
      response.getContentText() || "[]"
    );

  const members = [];

  rows.forEach(function(row) {
    if (row && row.document) {
      members.push(
        firestoreMemberDocumentToMember_(
          row.document
        )
      );
    }
  });

  return members;
}

function firestoreMemberDocumentToMember_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  return {
    memberNo: normalizeMemberNo_(
      value("memberNo")
    ),
    companyName: String(value("companyName") || "").trim(),
    representativeName: String(value("representativeName") || "").trim(),
    mail: String(value("mail") || "").trim(),
    block: String(value("block") || "").trim(),
    branch: String(value("branch") || "").trim(),
    branchKey: String(value("branchKey") || "").trim(),
    district: String(value("district") || "").trim(),
    active: String(value("active") || "TRUE").trim() || "TRUE"
  };
}

function makeFirestoreMemberAttendanceKey_(
  memberNo
) {

  return "member_" +
    normalizeMemberNo_(
      memberNo
    );
}

function makeFirestorePersonalAttendanceKey_(
  personalId
) {

  return "personal_" +
    String(personalId || "").trim();
}

function getFirestoreCheckinHistories_(
  eventId
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return null;
  }

  const projectId =
    getFirestoreProjectId_();

  let url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    "/checkins?pageSize=300";

  const histories = [];
  let pageCount = 0;

  while (url && pageCount < 10) {

    pageCount++;

    const response =
      firestoreFetch_(
        url,
        {
          method: "get",
          muteHttpExceptions: true
        }
      );

    const code =
      response.getResponseCode();

    if (code === 404) {
      return [];
    }

    if (code < 200 || code >= 300) {
      throw new Error(
        "Firestoreの受付履歴を取得できません。HTTP " +
        code +
        " / " +
        response.getContentText().slice(0, 300)
      );
    }

    const data =
      JSON.parse(
        response.getContentText() || "{}"
      );

    (data.documents || []).forEach(function(doc) {
      histories.push(
        firestoreCheckinDocumentToHistory_(
          doc
        )
      );
    });

    if (data.nextPageToken) {
      url =
        "https://firestore.googleapis.com/v1/projects/" +
        encodeURIComponent(projectId) +
        "/databases/%28default%29/documents/trainings/" +
        encodeURIComponent(eventId) +
        "/checkins?pageSize=300&pageToken=" +
        encodeURIComponent(data.nextPageToken);
    } else {
      url =
        "";
    }
  }

  histories.sort(function(a, b) {
    return String(b.date || "").localeCompare(
      String(a.date || "")
    );
  });

  return histories;
}

function getFirestoreRecentCheckinHistories_(
  eventId,
  limit
) {

  if (!isFirestoreEnabled_()) {
    return null;
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return null;
  }

  limit =
    Math.max(
      1,
      Math.min(
        Number(limit || 30),
        100
      )
    );

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    ":runQuery";

  const payload = {
    structuredQuery: {
      from: [
        {
          collectionId: "checkins"
        }
      ],
      orderBy: [
        {
          field: {
            fieldPath: "checkedAt"
          },
          direction: "DESCENDING"
        }
      ],
      limit: limit
    }
  };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  if (code === 404) {
    return [];
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの直近受付履歴を取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const rows =
    JSON.parse(
      response.getContentText() || "[]"
    );

  const histories = [];

  rows.forEach(function(row) {
    if (row && row.document) {
      histories.push(
        firestoreCheckinDocumentToHistory_(
          row.document
        )
      );
    }
  });

  return histories;
}

function getFirestoreRecentCheckinKeyHistories_(
  eventId,
  limit
) {

  if (!isFirestoreEnabled_()) {
    return [];
  }

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return [];
  }

  limit =
    Math.max(
      1,
      Math.min(
        Number(limit || 30),
        100
      )
    );

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/trainings/" +
    encodeURIComponent(eventId) +
    ":runQuery";

  const payload = {
    structuredQuery: {
      from: [
        {
          collectionId: "checkinKeys"
        }
      ],
      where: {
        fieldFilter: {
          field: {
            fieldPath: "status"
          },
          op: "EQUAL",
          value: {
            stringValue: "受付済み"
          }
        }
      },
      limit: Math.min(limit * 2, 100)
    }
  };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  if (code === 404) {
    return [];
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreの受付キー履歴を取得できません。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  const rows =
    JSON.parse(
      response.getContentText() || "[]"
    );

  const histories = [];

  rows.forEach(function(row) {
    if (row && row.document) {
      histories.push(
        firestoreCheckinKeyDocumentToHistory_(
          row.document
        )
      );
    }
  });

  histories.sort(function(a, b) {
    return String(b.date || "").localeCompare(
      String(a.date || "")
    );
  });

  return histories.slice(0, limit);
}

function firestoreCheckinKeyDocumentToHistory_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  return {
    rowNo: value("historyRowNo"),
    date: formatDateTimeForClient_(
      value("checkedAt")
    ),
    eventId: value("eventId"),
    trainingTitle: "",
    method: value("method"),
    readValue: value("readValue"),
    plannedId: "",
    memberNo: normalizeMemberNo_(
      value("memberNo")
    ),
    companyName: value("companyName"),
    receptionCategory: value("receptionCategory"),
    verificationStatus: value("verificationStatus"),
    attendanceUnit: value("attendanceUnit"),
    personalId: value("personalId"),
    participantName: value("participantName"),
    mail: value("guestMail") || value("mail"),
    phone: value("guestPhone"),
    snapshotOrgIds: "",
    snapshotOrgNames: "",
    block: value("block"),
    branch: value("branch"),
    district: value("district"),
    result: "受付完了",
    note: value("sheetSyncStatus") === "PENDING"
      ? "スプレッドシート反映待ち"
      : "",
    canceledAt: "",
    canceledBy: "",
    cancelReason: "",
    restoredAt: "",
    restoredBy: "",
    restoreReason: ""
  };
}

function firestoreCheckinDocumentToHistory_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  function value(name) {
    return firestorePlainValue_(
      fields[name]
    );
  }

  const readValue =
    String(value("readValue") || "").trim();

  const plannedMatch =
    readValue.match(/^PLANNED:(.+)$/);

  return {
    rowNo: value("historyRowNo"),
    date: formatDateTimeForClient_(
      value("checkedAt")
    ),
    eventId: value("eventId"),
    trainingTitle: "",
    method: value("method"),
    readValue: readValue,
    plannedId: plannedMatch
      ? String(plannedMatch[1] || "").trim()
      : "",
    memberNo: normalizeMemberNo_(
      value("memberNo")
    ),
    companyName: value("companyName"),
    receptionCategory: value("receptionCategory"),
    verificationStatus: value("verificationStatus"),
    attendanceUnit: value("attendanceUnit"),
    personalId: value("personalId"),
    participantName: value("participantName"),
    mail: value("mail"),
    phone: value("phone"),
    snapshotOrgIds: value("checkinOrganizationIds"),
    snapshotOrgNames: value("checkinOrganizationNames"),
    block: value("block"),
    branch: value("branch"),
    district: value("district"),
    result: value("result"),
    note: value("note"),
    canceledAt: formatDateTimeForClient_(value("canceledAt")),
    canceledBy: value("canceledBy"),
    cancelReason: value("cancelReason"),
    restoredAt: formatDateTimeForClient_(value("restoredAt")),
    restoredBy: value("restoredBy"),
    restoreReason: value("restoreReason")
  };
}

function firestorePlainValue_(
  field
) {

  if (!field) {
    return "";
  }

  if (field.stringValue !== undefined) {
    return field.stringValue;
  }

  if (field.integerValue !== undefined) {
    return field.integerValue;
  }

  if (field.doubleValue !== undefined) {
    return field.doubleValue;
  }

  if (field.booleanValue !== undefined) {
    return field.booleanValue;
  }

  if (field.timestampValue !== undefined) {
    return new Date(
      field.timestampValue
    );
  }

  return "";
}

function firestoreFetch_(
  url,
  options
) {

  const sendOptions =
    Object.assign(
      {},
      options || {}
    );

  sendOptions.headers =
    Object.assign(
      {},
      sendOptions.headers || {},
      {
        Authorization:
          "Bearer " + ScriptApp.getOAuthToken()
      }
    );

  const retryWaits =
    [250, 700, 1500];

  let lastResponse =
    null;

  for (let i = 0; i <= retryWaits.length; i++) {

    try {
      lastResponse =
        UrlFetchApp.fetch(
          url,
          sendOptions
        );
    } catch (err) {
      pauseFirestoreTemporarily_(
        "Firestore通信エラー: " + err.message,
        600
      );
      throw err;
    }

    const code =
      lastResponse.getResponseCode();

    if (code !== 429 && code !== 503) {
      return lastResponse;
    }

    if (i < retryWaits.length) {
      Utilities.sleep(
        retryWaits[i]
      );
    }
  }

  shouldPauseFirestoreByResponse_(
    lastResponse,
    "Firestore通信"
  );

  return lastResponse;
}

function writeFirestoreDocument_(
  path,
  data
) {

  const projectId =
    getFirestoreProjectId_();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/" +
    path;

  const payload =
    {
      fields: firestoreFields_(
        data || {}
      )
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "patch",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "Firestore保存"
  );

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreへの保存に失敗しました。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  return JSON.parse(
    response.getContentText() || "{}"
  );
}

function createFirestoreDocument_(
  collectionPath,
  documentId,
  data
) {

  const projectId =
    getFirestoreProjectId_();

  documentId =
    makeFirestoreDocumentId_(
      documentId
    );

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/%28default%29/documents/" +
    collectionPath +
    "?documentId=" +
    encodeURIComponent(documentId);

  const payload =
    {
      fields: firestoreFields_(
        data || {}
      )
    };

  const response =
    firestoreFetch_(
      url,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

  const code =
    response.getResponseCode();

  shouldPauseFirestoreByResponse_(
    response,
    "Firestore新規作成"
  );

  if (code === 409) {
    return {
      ok: false,
      duplicate: true
    };
  }

  if (code < 200 || code >= 300) {
    throw new Error(
      "Firestoreへの新規作成に失敗しました。HTTP " +
      code +
      " / " +
      response.getContentText().slice(0, 300)
    );
  }

  return {
    ok: true,
    duplicate: false,
    document: JSON.parse(
      response.getContentText() || "{}"
    )
  };
}

function firestoreDocumentToPlainObject_(
  doc
) {

  const fields =
    doc && doc.fields
      ? doc.fields
      : {};

  const data =
    {};

  Object.keys(fields).forEach(function(key) {
    data[key] =
      firestorePlainValue_(
        fields[key]
      );
  });

  return data;
}

function firestoreFields_(data) {

  const fields = {};

  Object.keys(data || {}).forEach(function(key) {
    fields[key] =
      firestoreValue_(
        data[key]
      );
  });

  return fields;
}

function firestoreValue_(value) {

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return {
      timestampValue: value.toISOString()
    };
  }

  if (typeof value === "boolean") {
    return {
      booleanValue: value
    };
  }

  if (typeof value === "number" && isFinite(value)) {
    return {
      doubleValue: value
    };
  }

  return {
    stringValue: String(value || "")
  };
}

function makeFirestoreDocumentId_(value) {

  return String(value || "")
    .trim()
    .replace(/[\/#?\[\]*]/g, "_") || Utilities.getUuid();
}
