function showCheckinPage_(e) {

  const eventId =
  e.parameter.event || "";

if (!eventId) {

  return HtmlService
    .createHtmlOutput(
      "研修IDが指定されていません。"
    );

}

const training =
  findTrainingById_(eventId);

if (!training) {
  return HtmlService
    .createHtmlOutput("該当する研修会が見つかりません。");
}

  const html =
    '<!DOCTYPE html>' +
    '<html lang="ja">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>受付テスト</title>' +
    '<style>' +
    'body{font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;background:#f7f7f7;padding:24px;}' +
    '.card{background:#fff;border-radius:12px;padding:24px;max-width:480px;margin:0 auto;box-shadow:0 2px 10px rgba(0,0,0,.12);}' +
    'h1{text-align:center;font-size:24px;}' +
    'input{width:100%;font-size:20px;padding:12px;margin:16px 0;box-sizing:border-box;}' +
    'button{width:100%;font-size:20px;padding:12px;background:#222;color:#fff;border:none;border-radius:8px;}' +
    '.result{margin-top:20px;font-size:18px;line-height:1.8;text-align:center;}' +
    '.ok{color:#0a7a2f;font-weight:bold;}' +
    '.ng{color:#b00020;font-weight:bold;}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<h1>' + escapeHtml_(training.title) + '</h1>' +
    '<p style="text-align:center;">主催：' + escapeHtml_(training.hostType) + '</p>' +
    '<p>QRまたはバーコードの読取値を入力してください。</p>' +
    '<input id="code" placeholder="例：MEMBER:41796" autofocus>' +
    '<button onclick="checkin()">受付する</button>' +
    '<div id="result" class="result"></div>' +
    '</div>' +
    '<script>' +
    'function checkin(){' +
    '  const code=document.getElementById("code").value.trim();' +
    '  if(!code){alert("読取値を入力してください");return;}' +
    '  document.getElementById("result").innerHTML="受付処理中...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res){' +
    '      if(res.ok){' +
    '        document.getElementById("result").innerHTML=' +
    '          "<div class=\\"ok\\">" + res.message + "</div>" +' +
    '          "<div>" + res.companyName + " 様</div>" +' +
    '          "<div>業者番号：" + res.memberNo + "</div>";' +
    '        document.getElementById("code").value="";' +
    '        document.getElementById("code").focus();' +
    '      }else{' +
    '        document.getElementById("result").innerHTML="<div class=\\"ng\\">" + res.message + "</div>";' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(err){' +
    '      document.getElementById("result").innerHTML="<div class=\\"ng\\">エラー：" + err.message + "</div>";' +
    '    })' +
    '    .registerCheckin("' + eventId + '", code);' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("受付テスト");
}


function registerCheckin(eventId, code, method, meta) {

  meta =
    meta || {};

  const readValue =
    String(code || "").trim();

  const checkinMethod =
    String(method || "手入力").trim();

  if (!readValue) {
    return {
      ok: false,
      message: "読取値が空です。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "該当する研修会が見つかりません。"
    };
  }

  const attendanceUnit =
    String(training.attendanceUnit || "会社").trim() || "会社";

  if (readValue.indexOf("PERSONAL:") === 0) {
    return registerPersonalCheckin_(
      eventId,
      readValue,
      checkinMethod,
      meta,
      attendanceUnit
    );
  }

  if (readValue.indexOf("PLANNED:") === 0) {
    return checkinPlannedAttendee_(
      eventId,
      readValue.replace("PLANNED:", "").trim(),
      checkinMethod,
      meta
    );
  }

  if (attendanceUnit === "個人") {
    return {
      ok: false,
      message: "この研修会は個人単位受付です。個人QRを読み込んでください。"
    };
  }

  if (checkinMethod === "会社QR" && readValue.indexOf("MEMBER:") !== 0) {
    return {
      ok: false,
      message: "これは会社QRではありません。会社QRを読み取ってください。"
    };
  }

  const memberNo =
    readValue.replace("MEMBER:", "").trim();

  const member =
    findMemberByNo_(memberNo);

  if (!member) {
    saveCheckinHistory_(
      eventId,
      checkinMethod,
      readValue,
      memberNo,
      "",
      "",
      "",
      "",
      "該当なし",
      "会員マスタに存在しません",
      {
        receptionCategory: meta.receptionCategory || "",
        verificationStatus: "該当なし",
        participantName: meta.participantName || ""
      }
    );

    return {
      ok: false,
      message: "該当する会員が見つかりません。"
    };
  }

  const lock =
    LockService.getScriptLock();

  let historyRowNo =
    "";

  let firestoreAttendanceKey =
    "";

  let firestoreFallbackReason =
    "";

  let indexEntry =
    null;

  let checkedAt =
    null;

  let lockAcquired =
    false;

  firestoreAttendanceKey =
    makeFirestoreMemberAttendanceKey_(
      member.memberNo
    );

  let firestoreReserve = {
    duplicate: false,
    skipped: true,
    message: "Firestore高速受付は未使用です。"
  };

  if (shouldUseFirestoreFastCheckin_()) {
    try {
      firestoreReserve =
        reserveFirestoreCheckinKey_(
          eventId,
          firestoreAttendanceKey,
          {
            memberNo: member.memberNo,
            companyName: member.companyName,
            block: member.block,
            branch: member.branch,
            district: member.district,
            readValue: readValue,
            method: checkinMethod,
            receptionCategory: meta.receptionCategory || "第十ブロック会員",
            verificationStatus: meta.verificationStatus || "会員マスタ照合済み",
            attendanceUnit: "会社",
            participantName: meta.participantName || "",
            guestMail: meta.guestMail || "",
            guestPhone: meta.guestPhone || "",
            locationToken: meta.locationToken || "",
            latitude: meta.latitude || "",
            longitude: meta.longitude || "",
            distanceMeters: meta.distanceMeters || ""
          }
        );
    } catch (firestoreReserveErr) {
      firestoreFallbackReason =
        firestoreReserveErr && firestoreReserveErr.message
          ? firestoreReserveErr.message
          : String(firestoreReserveErr || "");
    }
  }

  if (firestoreReserve.duplicate) {
    return {
      ok: true,
      message: "既に受付済みです",
      memberNo: member.memberNo,
      companyName: firestoreReserve.companyName || member.companyName,
      checkedAt: firestoreReserve.checkedAt || ""
    };
  }

  if (
    !firestoreFallbackReason &&
    !firestoreReserve.skipped
  ) {
    try {
      indexEntry =
        getCheckinIndexEntry_(
          eventId,
          member.memberNo
        );

      if (typeof syncCheckinIndexTargetToFirestore_ === "function") {
        syncCheckinIndexTargetToFirestore_(
          eventId,
          member,
          indexEntry ? "対象者" : "当日受付",
          "受付済み",
          firestoreReserve.checkedAtDate || new Date(),
          checkinMethod,
          "",
          "スプレッドシート反映待ち",
          firestoreReserve.checkedAtDate || new Date()
        );
      }
    } catch (firestoreTargetFastErr) {
    }

    return {
      ok: true,
      message: "受付完了",
      memberNo: member.memberNo,
      companyName: member.companyName,
      checkedAt: firestoreReserve.checkedAt || formatDateTimeForClient_(new Date()),
      sheetSyncStatus: "PENDING"
    };
  }

  try {

    if (
      firestoreFallbackReason ||
      firestoreReserve.skipped
    ) {
      lock.waitLock(30000);
      lockAcquired =
        true;
    }

    let duplicate =
      null;

    indexEntry =
      getCheckinIndexEntry_(
        eventId,
        member.memberNo
      );

    duplicate =
      indexEntry && indexEntry.status === "受付済み"
        ? {
            checkedAt: formatDateTimeForClient_(indexEntry.checkedAt),
            companyName: indexEntry.companyName || member.companyName
          }
        : null;

    if (!duplicate) {
      duplicate =
        isDuplicateCheckin_(
          eventId,
          member.memberNo
        );
    }

    if (duplicate) {
      return {
        ok: true,
        message: "既に受付済みです",
        memberNo: member.memberNo,
        companyName: duplicate.companyName || member.companyName,
        checkedAt: duplicate.checkedAt || ""
      };
    }

    checkedAt =
      new Date();

    historyRowNo =
      saveCheckinHistory_(
      eventId,
      checkinMethod,
      readValue,
      member.memberNo,
      member.companyName,
      member.block,
      member.branch,
      member.district,
      "受付完了",
      "",
      {
        receptionCategory: meta.receptionCategory || "第十ブロック会員",
        verificationStatus: meta.verificationStatus || "会員マスタ照合済み",
        participantName: meta.participantName || "",
        attendanceUnit: "会社",
        personalId: "",
        guestCompanyName: "",
      guestMail: meta.guestMail || "",
      guestPhone: meta.guestPhone || "",
      locationToken: meta.locationToken || "",
      latitude: meta.latitude || "",
      longitude: meta.longitude || "",
      distanceMeters: meta.distanceMeters || ""
      }
    );

    updateCheckinIndexAfterCheckin_(
      eventId,
      member,
      checkinMethod,
      historyRowNo,
      checkedAt
    );

  } catch (err) {

    return makeCheckinBusyResponse_(
      err,
      meta
    );

  } finally {

    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {
      }
    }
  }

  const shouldSyncFirestoreAfterCheckin =
    !firestoreFallbackReason &&
    !firestoreReserve.skipped &&
    firestoreAttendanceKey;

  if (shouldSyncFirestoreAfterCheckin) {
    try {
      updateFirestoreCheckinKeyAfterHistory_(
        eventId,
        firestoreAttendanceKey,
        historyRowNo,
        checkedAt
      );
    } catch (firestoreKeyErr) {
    }
  }

  if (
    shouldSyncFirestoreAfterCheckin &&
    typeof syncCheckinIndexTargetToFirestore_ === "function"
  ) {
    try {
      syncCheckinIndexTargetToFirestore_(
        eventId,
        member,
        indexEntry ? "対象者" : "当日受付",
        "受付済み",
        checkedAt,
        checkinMethod,
        historyRowNo,
        "",
        checkedAt
      );
    } catch (firestoreTargetErr) {
    }
  }

  return {
    ok: true,
    message: "受付完了",
    memberNo: member.memberNo,
    companyName: member.companyName,
    checkedAt: formatDateTimeForClient_(new Date()),
    historyRowNo: historyRowNo
  };
}

function registerPersonalCheckin_(
  eventId,
  readValue,
  checkinMethod,
  meta,
  attendanceUnit
) {

  const trace =
    createCheckinDebugTrace_(meta);

  if (attendanceUnit !== "個人") {
    return attachCheckinDebugTrace_({
      ok: false,
      message: "個人QRは、個人単位受付の研修会でのみ使用できます。"
    }, trace);
  }

  const personalId =
    String(readValue || "").replace("PERSONAL:", "").trim();

  const indexEntry =
    getCheckinIndexEntry_(
      eventId,
      "",
      personalId
    );

  markCheckinDebugTrace_(
    trace,
    "受付索引取得"
  );

  if (
    indexEntry &&
    indexEntry.status === "受付済み"
  ) {
    return attachCheckinDebugTrace_({
      ok: true,
      message: "既に受付済みです",
      memberNo: indexEntry.memberNo,
      companyName: indexEntry.companyName,
      personalId: indexEntry.personalId || personalId,
      participantName: indexEntry.participantName,
      checkedAt: formatDateTimeForClient_(indexEntry.checkedAt || "")
    }, trace);
  }

  let personal = null;
  let member = null;

  if (indexEntry) {

    personal = {
      personalId: indexEntry.personalId || personalId,
      memberNo: indexEntry.memberNo,
      personName: indexEntry.participantName,
      mail: indexEntry.mail,
      active: "TRUE"
    };

    member = {
      memberNo: indexEntry.memberNo,
      companyName: indexEntry.companyName,
      mail: indexEntry.mail,
      block: indexEntry.block,
      branch: indexEntry.branch,
      district: indexEntry.district
    };

    markCheckinDebugTrace_(
      trace,
      "受付索引から対象者取得"
    );

  } else {

    personal =
      findPersonalMemberById_(
        personalId
      );

    markCheckinDebugTrace_(
      trace,
      "個人マスタ取得"
    );

    if (!personal) {
      saveCheckinHistory_(
        eventId,
        checkinMethod,
        readValue,
        "",
        "",
        "",
        "",
        "",
        "該当なし",
        "個人会員マスタに存在しません",
        {
          receptionCategory: meta.receptionCategory || "",
          verificationStatus: "該当なし",
          participantName: "",
          attendanceUnit: "個人",
          personalId: personalId
        }
      );

      markCheckinDebugTrace_(
        trace,
        "該当なし履歴保存"
      );

      return attachCheckinDebugTrace_({
        ok: false,
        message: "該当する個人会員が見つかりません。"
      }, trace);
    }

    if (
      String(personal.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return attachCheckinDebugTrace_({
        ok: false,
        message: "この個人会員は受付に使用できません。有効設定を確認してください。"
      }, trace);
    }

    member =
      findMemberByNo_(
        personal.memberNo
      );

    markCheckinDebugTrace_(
      trace,
      "会員マスタ取得"
    );

    if (!member) {
      return attachCheckinDebugTrace_({
        ok: false,
        message: "個人会員に紐づく会員情報が見つかりません。"
      }, trace);
    }
  }

  const lock =
    LockService.getScriptLock();

  let historyRowNo =
    "";

  let firestoreAttendanceKey =
    "";

  let firestoreFallbackReason =
    "";

  let targetMember =
    null;

  let checkedAt =
    null;

  let lockAcquired =
    false;

  firestoreAttendanceKey =
    makeFirestorePersonalAttendanceKey_(
      personal.personalId
    );

  let firestoreReserve = {
    duplicate: false,
    skipped: true,
    message: "Firestore高速受付は未使用です。"
  };

  if (shouldUseFirestoreFastCheckin_()) {
    try {
      firestoreReserve =
        reserveFirestoreCheckinKey_(
          eventId,
          firestoreAttendanceKey,
          {
            memberNo: member.memberNo,
            companyName: member.companyName,
            block: member.block,
            branch: member.branch,
            district: member.district,
            readValue: readValue,
            method: checkinMethod,
            receptionCategory: meta.receptionCategory || "第十ブロック会員",
            verificationStatus: meta.verificationStatus || "個人会員マスタ照合済み",
            attendanceUnit: "個人",
            personalId: personal.personalId,
            participantName: personal.personName || "",
            guestMail: personal.mail || "",
            guestPhone: meta.guestPhone || "",
            locationToken: meta.locationToken || "",
            latitude: meta.latitude || "",
            longitude: meta.longitude || "",
            distanceMeters: meta.distanceMeters || ""
          }
        );
    } catch (firestoreReserveErr) {
      firestoreFallbackReason =
        firestoreReserveErr && firestoreReserveErr.message
          ? firestoreReserveErr.message
          : String(firestoreReserveErr || "");
    }
  }

  markCheckinDebugTrace_(
    trace,
    "Firestore受付キー確認"
  );

  if (firestoreFallbackReason) {
    markCheckinDebugTrace_(
      trace,
      "Firestore予約失敗: " +
        firestoreFallbackReason.slice(0, 80)
    );
  } else if (firestoreReserve.skipped) {
    markCheckinDebugTrace_(
      trace,
      "Firestore予約スキップ: " +
        String(firestoreReserve.message || "理由未取得").slice(0, 80)
    );
  } else if (firestoreReserve.duplicate) {
    markCheckinDebugTrace_(
      trace,
      "Firestore既受付確認"
    );
  } else {
    markCheckinDebugTrace_(
      trace,
      "Firestore予約成功"
    );
  }

  if (firestoreReserve.duplicate) {
    return attachCheckinDebugTrace_({
      ok: true,
      message: "既に受付済みです",
      memberNo: member.memberNo,
      companyName: firestoreReserve.companyName || member.companyName,
      personalId: personal.personalId,
      participantName: firestoreReserve.participantName || personal.personName,
      checkedAt: firestoreReserve.checkedAt || ""
    }, trace);
  }

  if (
    !firestoreFallbackReason &&
    !firestoreReserve.skipped
  ) {
    try {
      targetMember = {
        memberNo: member.memberNo,
        personalId: personal.personalId,
        companyName: member.companyName,
        participantName: personal.personName || "",
        mail: personal.mail || member.mail || "",
        block: member.block,
        branch: member.branch,
        district: member.district
      };

      if (typeof syncCheckinIndexTargetToFirestore_ === "function") {
        syncCheckinIndexTargetToFirestore_(
          eventId,
          targetMember,
          indexEntry ? "対象者" : "当日受付",
          "受付済み",
          firestoreReserve.checkedAtDate || new Date(),
          checkinMethod,
          "",
          "スプレッドシート反映待ち",
          firestoreReserve.checkedAtDate || new Date()
        );
      }
    } catch (firestoreTargetFastErr) {
    }

    markCheckinDebugTrace_(
      trace,
      "スプレッドシート後追い"
    );

    return attachCheckinDebugTrace_({
      ok: true,
      message: "受付完了",
      memberNo: member.memberNo,
      companyName: member.companyName,
      personalId: personal.personalId,
      participantName: personal.personName,
      checkedAt: firestoreReserve.checkedAt || formatDateTimeForClient_(new Date()),
      sheetSyncStatus: "PENDING"
    }, trace);
  }

  try {

    if (
      firestoreFallbackReason ||
      firestoreReserve.skipped
    ) {
      lock.waitLock(30000);
      lockAcquired =
        true;

      markCheckinDebugTrace_(
        trace,
        "ロック取得"
      );
    } else {
      markCheckinDebugTrace_(
        trace,
        "ロック不要"
      );
    }

    let duplicate =
      null;

    if (indexEntry) {

      const latestIndexEntry =
        getCheckinIndexEntryByRow_(
          eventId,
          indexEntry.rowNo
        );

      if (
        latestIndexEntry &&
        latestIndexEntry.status === "受付済み"
      ) {
        duplicate = {
          checkedAt: latestIndexEntry.checkedAt || ""
        };
      }
    }

    if (!duplicate) {
      duplicate =
        isDuplicatePersonalCheckin_(
          eventId,
          personal.personalId
        );
    }

    markCheckinDebugTrace_(
      trace,
      "参加履歴重複確認"
    );

    if (duplicate) {
      return attachCheckinDebugTrace_({
        ok: true,
        message: "既に受付済みです",
        memberNo: member.memberNo,
        companyName: member.companyName,
        personalId: personal.personalId,
        participantName: personal.personName,
        checkedAt: duplicate.checkedAt || ""
      }, trace);
    }

    historyRowNo =
      saveCheckinHistory_(
        eventId,
        checkinMethod,
        readValue,
        member.memberNo,
        member.companyName,
        member.block,
        member.branch,
        member.district,
        "受付完了",
        "",
        {
          receptionCategory: meta.receptionCategory || "第十ブロック会員",
          verificationStatus: meta.verificationStatus || "個人会員マスタ照合済み",
          participantName: personal.personName || "",
          attendanceUnit: "個人",
          personalId: personal.personalId,
          guestMail: personal.mail || "",
          guestPhone: meta.guestPhone || "",
          locationToken: meta.locationToken || "",
          latitude: meta.latitude || "",
          longitude: meta.longitude || "",
          distanceMeters: meta.distanceMeters || ""
        }
      );

    markCheckinDebugTrace_(
      trace,
      "参加履歴保存"
    );

    checkedAt =
      new Date();

    targetMember = {
      memberNo: member.memberNo,
      personalId: personal.personalId,
      companyName: member.companyName,
      participantName: personal.personName || "",
      mail: personal.mail || member.mail || "",
      block: member.block,
      branch: member.branch,
      district: member.district
    };

    if (
      !indexEntry ||
      !updateCheckinIndexAfterCheckinByRow_(
        indexEntry.rowNo,
        targetMember,
        checkinMethod,
        historyRowNo,
        checkedAt
      )
    ) {
      updateCheckinIndexAfterCheckin_(
        eventId,
        targetMember,
        checkinMethod,
        historyRowNo,
        checkedAt
      );
    }

    markCheckinDebugTrace_(
      trace,
      "受付索引更新"
    );

  } catch (err) {

    return makeCheckinBusyResponse_(
      err,
      meta
    );

  } finally {

    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {
      }
    }
  }

  const shouldSyncFirestoreAfterCheckin =
    !firestoreFallbackReason &&
    !firestoreReserve.skipped &&
    firestoreAttendanceKey;

  if (shouldSyncFirestoreAfterCheckin) {
    try {
      updateFirestoreCheckinKeyAfterHistory_(
        eventId,
        firestoreAttendanceKey,
        historyRowNo,
        checkedAt
      );
    } catch (firestoreKeyErr) {
    }
  }

  markCheckinDebugTrace_(
    trace,
    shouldSyncFirestoreAfterCheckin
      ? "Firestore受付キー履歴反映"
      : "Firestore受付キー履歴反映スキップ"
  );

  if (
    shouldSyncFirestoreAfterCheckin &&
    targetMember &&
    typeof syncCheckinIndexTargetToFirestore_ === "function"
  ) {
    try {
      syncCheckinIndexTargetToFirestore_(
        eventId,
        targetMember,
        "対象者",
        "受付済み",
        checkedAt,
        checkinMethod,
        historyRowNo,
        "",
        checkedAt
      );
    } catch (firestoreTargetErr) {
    }
  }

  markCheckinDebugTrace_(
    trace,
    shouldSyncFirestoreAfterCheckin
      ? "Firestore受付対象反映"
      : "Firestore受付対象反映スキップ"
  );

  return attachCheckinDebugTrace_({
    ok: true,
    message: "受付完了",
    memberNo: member.memberNo,
    companyName: member.companyName,
    personalId: personal.personalId,
    participantName: personal.personName,
    checkedAt: formatDateTimeForClient_(new Date()),
    historyRowNo: historyRowNo
  }, trace);
}

function shouldUseFirestoreFastCheckin_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_CHECKIN_FAST_MODE") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function shouldUseFirestoreForPlannedAttendees_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_PLANNED_ATTENDEE_SYNC") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function shouldUseFirestoreForCheckinHistorySync_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_CHECKIN_HISTORY_SYNC") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function makeCheckinBusyResponse_(
  err,
  meta
) {

  const detail =
    err && err.message
      ? String(err.message)
      : String(err || "");

  try {
    Logger.log(
      "registerCheckin error: " +
      detail
    );
  } catch (logErr) {
  }

  if (meta && meta.loadTestDebug) {
    return {
      ok: false,
      message: "受付処理でエラーが発生しました: " + detail,
      debugMessage: detail
    };
  }

  return {
    ok: false,
    message: "受付が混み合っています。数秒後にもう一度お試しください。"
  };
}

function createCheckinDebugTrace_(
  meta
) {

  if (!meta || !meta.loadTestDebug) {
    return null;
  }

  return {
    startedAt:
      new Date().getTime(),
    marks: []
  };
}

function markCheckinDebugTrace_(
  trace,
  label
) {

  if (!trace) {
    return;
  }

  const now =
    new Date().getTime();

  trace.marks.push({
    label: label,
    elapsedMs: now - trace.startedAt
  });
}

function attachCheckinDebugTrace_(
  result,
  trace
) {

  if (!trace) {
    return result;
  }

  markCheckinDebugTrace_(
    trace,
    "応答作成"
  );

  result.debugTrace =
    trace.marks;

  return result;
}


function saveCheckinHistory_(
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
  meta
) {

  meta =
    meta || {};

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet) {
    sheet =
      ss.insertSheet("参加履歴");

    sheet.appendRow([
      "日時",
      "研修ID",
      "受付方法",
      "読取値",
      "業者番号",
      "会社名",
      "ブロック",
      "支部",
      "地区",
      "結果",
      "備考",
      "受付区分",
      "照合状態",
      "受付単位",
      "個人ID",
      "参加者名",
      "メール",
      "電話",
      "受付トークン",
      "緯度",
      "経度",
      "会場距離m",
      "受付時所属組織ID",
      "受付時所属組織名"
    ]);
  }

  ensureCheckinHistoryBaseHeaders_(
    sheet
  );

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const row =
    new Array(
      sheet.getLastColumn()
    ).fill("");

  const attendanceUnitForHistory =
    meta.attendanceUnit ||
    (
      meta.personalId
        ? "個人"
        : (
            memberNo
              ? "会社"
              : ""
          )
    );

  row[headerMap["日時"]] =
    meta.checkedAt || new Date();

  row[headerMap["研修ID"]] =
    eventId;

  row[headerMap["受付方法"]] =
    method;

  row[headerMap["読取値"]] =
    readValue;

  row[headerMap["業者番号"]] =
    memberNo;

  row[headerMap["会社名"]] =
    companyName;

  row[headerMap["ブロック"]] =
    block || "";

  row[headerMap["支部"]] =
    branch || "";

  row[headerMap["地区"]] =
    district || "";

  row[headerMap["結果"]] =
    result;

  row[headerMap["備考"]] =
    note || "";

  setHistoryCellIfExists_(
    row,
    headerMap,
    "受付区分",
    meta.receptionCategory || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "照合状態",
    meta.verificationStatus || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "参加者名",
    meta.participantName || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "受付単位",
    attendanceUnitForHistory
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "個人ID",
    meta.personalId || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "メール",
    meta.guestMail || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "電話",
    meta.guestPhone || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "受付トークン",
    meta.locationToken || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "緯度",
    meta.latitude || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "経度",
    meta.longitude || ""
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "会場距離m",
    meta.distanceMeters || ""
  );

  const organizationSnapshot =
    buildCheckinOrganizationSnapshot_(
      memberNo,
      meta.personalId || ""
    );

  meta.attendanceUnit =
    attendanceUnitForHistory;

  meta.checkinOrganizationIds =
    organizationSnapshot.orgIds;

  meta.checkinOrganizationNames =
    organizationSnapshot.orgNames;

  setHistoryCellIfExists_(
    row,
    headerMap,
    "受付時所属組織ID",
    organizationSnapshot.orgIds
  );

  setHistoryCellIfExists_(
    row,
    headerMap,
    "受付時所属組織名",
    organizationSnapshot.orgNames
  );

  sheet.appendRow(row);

  const historyRowNo =
    sheet.getLastRow();

  if (shouldUseFirestoreForCheckinHistorySync_()) {
    try {
      syncCheckinHistoryToFirestore_(
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
        row[headerMap["日時"]]
      );
    } catch (firestoreErr) {
      setHistoryCellIfExists_(
        row,
        headerMap,
        "備考",
        (note || "") +
        (
          note
            ? " / "
            : ""
        ) +
        "Firestore同期未完了: " +
        firestoreErr.message
      );

      sheet
        .getRange(
          historyRowNo,
          1,
          1,
          row.length
        )
        .setValues(
          [row]
        );
    }
  }

  return historyRowNo;
}


function ensureCheckinHistoryBaseHeaders_(sheet) {

  ensureHeaders_(
    sheet,
    [
      "日時",
      "研修ID",
      "受付方法",
      "読取値",
      "業者番号",
      "会社名",
      "ブロック",
      "支部",
      "地区",
      "結果",
      "備考",
      "受付区分",
      "照合状態",
      "受付単位",
      "個人ID",
      "参加者名",
      "メール",
      "電話",
      "受付トークン",
      "緯度",
      "経度",
      "会場距離m",
      "受付時所属組織ID",
      "受付時所属組織名"
    ]
  );
}

function buildCheckinOrganizationSnapshot_(
  memberNo,
  personalId
) {

  const orgIds =
    personalId
      ? getPersonalOrganizationIdsForSnapshot_(
          personalId
        )
      : getMemberOrganizationIdsForSnapshot_(
          memberNo
        );

  const orgNameMap =
    getOrganizationNameMapForSnapshot_();

  const orgNames =
    orgIds.map(function(orgId) {
      return orgNameMap[orgId] || orgId;
    });

  return {
    orgIds: orgIds.join(","),
    orgNames: orgNames.join("、")
  };
}

function getPersonalOrganizationIdsForSnapshot_(
  personalId
) {

  const map =
    getPersonalOrganizationMap_();

  return Object.keys(
    map[String(personalId || "").trim()] || {}
  ).sort();
}

function getMemberOrganizationIdsForSnapshot_(
  memberNo
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員所属");

  if (!sheet) {
    return [];
  }

  const values =
    sheet.getDataRange().getValues();

  const targetMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  const map = {};

  for (let i = 1; i < values.length; i++) {

    const rowMemberNo =
      normalizeMemberNo_(
        values[i][0]
      );

    const orgId =
      String(values[i][1] || "").trim();

    if (rowMemberNo === targetMemberNo && orgId) {
      map[orgId] =
        true;
    }
  }

  return Object.keys(map).sort();
}

function getOrganizationNameMapForSnapshot_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("組織マスタ");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const orgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || values[i][0] || "").trim();

    const orgName =
      String(getCellByHeader_(values[i], headerMap, "組織名") || values[i][1] || "").trim();

    if (orgId && orgName) {
      map[orgId] =
        orgName;
    }
  }

  return map;
}

function setHistoryCellIfExists_(
  row,
  headerMap,
  headerName,
  value
) {

  if (headerMap[headerName] === undefined) {
    return;
  }

  row[headerMap[headerName]] =
    value || "";
}


function isDuplicateCheckin_(eventId, memberNo) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet) {
    return null;
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const memberNoCol =
    headerMap["業者番号"];

  if (memberNoCol === undefined) {
    return null;
  }

  const memberNoRange =
    sheet.getRange(
      2,
      memberNoCol + 1,
      lastRow - 1,
      1
    );

  const cells =
    memberNoRange
      .createTextFinder(String(memberNo).trim())
      .matchEntireCell(true)
      .findAll();

  for (let i = cells.length - 1; i >= 0; i--) {

    const row =
      sheet
        .getRange(
          cells[i].getRow(),
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    const rowDate =
      getCellByHeader_(row, headerMap, "日時");

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const rowMemberNo =
      normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    const rowCompanyName =
      String(getCellByHeader_(row, headerMap, "会社名") || "").trim();

    const rowResult =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId === String(eventId).trim() &&
      rowMemberNo === String(memberNo).trim() &&
      rowResult === "受付完了"
    ) {
      return {
        checkedAt: formatDateTimeForClient_(rowDate),
        companyName: rowCompanyName
      };
    }
  }

  return null;
}

function isDuplicatePersonalCheckin_(eventId, personalId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const personalIdCol =
    headerMap["個人ID"];

  if (personalIdCol === undefined) {
    return null;
  }

  const range =
    sheet.getRange(
      2,
      personalIdCol + 1,
      sheet.getLastRow() - 1,
      1
    );

  const cells =
    range
      .createTextFinder(String(personalId).trim())
      .matchEntireCell(true)
      .findAll();

  for (let i = cells.length - 1; i >= 0; i--) {

    const row =
      sheet
        .getRange(
          cells[i].getRow(),
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    const rowResult =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (
      rowEventId === String(eventId).trim() &&
      rowResult === "受付完了"
    ) {
      return {
        checkedAt: formatDateTimeForClient_(
          getCellByHeader_(row, headerMap, "日時")
        )
      };
    }
  }

  return null;
}

function registerCheckinJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const isLoadTestDebug =
    String(e.parameter.loadTestDebug || "").toUpperCase() === "TRUE";

  let result;

  try {

    const eventId =
      e.parameter.event || "";

    const code =
      e.parameter.code || "";

    const method =
      e.parameter.method || "手入力";

    const meta = {
      receptionCategory: e.parameter.receptionCategory || "",
      verificationStatus: e.parameter.verificationStatus || "",
      participantName: e.parameter.participantName || "",
      guestMail: e.parameter.mail || "",
      guestPhone: e.parameter.phone || "",
      loadTestDebug:
        isLoadTestDebug
    };

    result =
      registerCheckin(
        eventId,
        code,
        method,
        meta
      );

  } catch (err) {

    const detail =
      err && err.message
        ? String(err.message)
        : String(err || "");

    result = {
      ok: false,
      message:
        isLoadTestDebug
          ? "受付処理でエラーが発生しました: " + detail
          : "通信に失敗しました。時間をおいて再度お試しください。続く場合は管理者に連絡してください。",
      debugMessage:
        detail
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getGuestPersonalCandidatesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getGuestPersonalCandidates_(
        e.parameter || {}
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

function registerGuestPersonalCheckinJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      registerGuestPersonalCheckin_(
        e.parameter || {}
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

function getGuestPersonalCandidates_(
  params
) {

  const memberNo =
    normalizeMemberNo_(
      params.memberNo || ""
    );

  const personName =
    normalizeGuestPersonDisplayName_(
      params.personName || ""
    );

  if (!memberNo || !personName) {
    return {
      ok: true,
      candidates: []
    };
  }

  const targetKey =
    normalizeGuestPersonNameKey_(
      personName
    );

  if (!targetKey) {
    return {
      ok: true,
      candidates: []
    };
  }

  const persons =
    getPersonalMembers_({
      memberNo: memberNo
    }).members || [];

  const candidates = [];

  persons.forEach(function(person) {

    if (String(person.active || "TRUE").toUpperCase() === "FALSE") {
      return;
    }

    const personKey =
      normalizeGuestPersonNameKey_(
        person.personName || ""
      );

    if (!personKey) {
      return;
    }

    let matchType =
      "";

    if (personKey === targetKey) {
      matchType =
        "一致";
    }

    if (!matchType) {
      return;
    }

    candidates.push({
      personalId: person.personalId || "",
      personName: person.personName || "",
      personType: person.personType || "",
      mail: person.mail || "",
      matchType: matchType
    });
  });

  return {
    ok: true,
    candidates: candidates.slice(0, 5)
  };
}

function registerGuestPersonalCheckin_(
  params
) {

  const eventId =
    String(params.event || "").trim();

  const memberNo =
    normalizeMemberNo_(
      params.memberNo || ""
    );

  const isRepresentative =
    String(params.representative || "").toUpperCase() === "TRUE";

  const selectedPersonalId =
    String(params.personalId || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!memberNo) {
    throw new Error("業者番号がありません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("該当する研修会が見つかりません。");
  }

  if (String(training.attendanceUnit || "会社").trim() !== "個人") {
    throw new Error("この研修会は個人単位受付ではありません。");
  }

  const member =
    findMemberByNo_(
      memberNo
    );

  if (!member) {
    throw new Error("会員マスタに存在しません。");
  }

  let personalId =
    "";

  let participantName =
    "";

  let mail =
    String(params.mail || "").trim();

  let createdPersonal =
    false;

  if (isRepresentative) {

    personalId =
      memberNo + "-001";

    participantName =
      String(member.representativeName || "").trim();

    mail =
      member.mail || mail;

    if (!participantName) {
      throw new Error("会員マスタに代表者名がありません。");
    }

  } else if (selectedPersonalId) {

    const selectedPerson =
      findPersonalMemberById_(
        selectedPersonalId
      );

    if (
      !selectedPerson ||
      normalizeMemberNo_(selectedPerson.memberNo) !== memberNo
    ) {
      throw new Error("選択した個人会員がこの会社に紐づいていません。");
    }

    personalId =
      selectedPerson.personalId;

    participantName =
      selectedPerson.personName || "";

    mail =
      mail || selectedPerson.mail || "";

  } else {

    const familyName =
      String(params.familyName || "").trim();

    const givenName =
      String(params.givenName || "").trim();

    participantName =
      normalizeGuestPersonDisplayName_(
        familyName + "　" + givenName
      );

    if (!familyName || !givenName) {
      throw new Error("姓、名を入力してください。");
    }

    const existingPerson =
      findGuestExistingPersonalByName_(
        memberNo,
        participantName
      );

    if (existingPerson) {
      personalId =
        existingPerson.personalId;

      participantName =
        existingPerson.personName || participantName;

      mail =
        mail || existingPerson.mail || "";
    } else {
      const saved =
        savePersonalMember_({
          memberNo: memberNo,
          companyName: member.companyName || "",
          personName: participantName,
          personType: "社員",
          mail: mail,
          active: "TRUE",
          source: "会場QR＋WEB検索",
          note: "会場QRから本人入力"
        });

      personalId =
        saved.personalId;

      createdPersonal =
        true;
    }
  }

  const result =
    registerCheckin(
      eventId,
      "PERSONAL:" + personalId,
      "会場QR＋検索受付",
      {
        receptionCategory: "第十ブロック会員",
        verificationStatus: createdPersonal
          ? "個人会員を会場QRで新規登録"
          : "個人会員マスタ照合済み",
        participantName: participantName,
        guestMail: mail
      }
    );

  result.personalId =
    result.personalId || personalId;

  result.participantName =
    result.participantName || participantName;

  result.mail =
    mail;

  result.createdPersonal =
    createdPersonal;

  return result;
}

function findGuestExistingPersonalByName_(
  memberNo,
  personName
) {

  const targetKey =
    normalizeGuestPersonNameKey_(
      personName
    );

  const persons =
    getPersonalMembers_({
      memberNo: memberNo
    }).members || [];

  for (let i = 0; i < persons.length; i++) {

    const person =
      persons[i];

    if (String(person.active || "TRUE").toUpperCase() === "FALSE") {
      continue;
    }

    if (
      normalizeGuestPersonNameKey_(
        person.personName || ""
      ) === targetKey
    ) {
      return person;
    }
  }

  return null;
}

function normalizeGuestPersonDisplayName_(
  value
) {

  return String(value || "")
    .replace(/[ 　]+/g, "　")
    .replace(/^　+|　+$/g, "")
    .trim();
}

function normalizeGuestPersonNameKey_(
  value
) {

  return String(value || "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    })
    .replace(/[ 　]/g, "")
    .replace(/髙/g, "高")
    .replace(/﨑/g, "崎")
    .replace(/邉/g, "辺")
    .replace(/邊/g, "辺")
    .replace(/渡邉/g, "渡辺")
    .replace(/渡邊/g, "渡辺")
    .replace(/齋/g, "斎")
    .replace(/齊/g, "斎")
    .replace(/斉/g, "斎")
    .toLowerCase();
}

function registerManualGuestCheckinJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      registerManualGuestCheckin_(e.parameter);

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

function registerManualGuestCheckin_(params) {

  const eventId =
    String(params.event || "").trim();

  const receptionCategory =
    String(params.receptionCategory || "").trim();

  const block =
    String(params.block || "").trim();

  const branch =
    String(params.branch || "").trim();

  const companyName =
    String(params.companyName || "").trim();

  const participantName =
    String(params.participantName || "").trim();

  const mail =
    String(params.mail || "").trim();

  const phone =
    String(params.phone || "").trim();

  const method =
    String(params.method || "会場QR＋自己入力").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!receptionCategory) {
    throw new Error("受付区分を選択してください。");
  }

  if (!participantName) {
    throw new Error("参加者名を入力してください。");
  }

  if (receptionCategory === "他ブロック会員") {

    if (!block || !branch || !companyName) {
      throw new Error("ブロック、支部、会社・団体名を入力してください。");
    }
  }

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(5000);

    const duplicate =
      findDuplicateManualGuestCheckin_(
        eventId,
        receptionCategory,
        block,
        branch,
        companyName,
        participantName
      );

    if (duplicate) {
      return {
        ok: true,
        message: "既に受付済みです",
        rowNo: duplicate.rowNo,
        receptionCategory: receptionCategory,
        companyName: companyName,
        participantName: participantName,
        block: block,
        branch: branch,
        checkedAt: duplicate.checkedAt || ""
      };
    }

    const readValue =
      "MANUAL:" + Utilities.getUuid();

    const historyRowNo =
      saveCheckinHistory_(
        eventId,
        method,
        readValue,
        "",
        companyName,
        block,
        branch,
        "",
        "受付完了",
        "",
        {
          receptionCategory: receptionCategory,
          verificationStatus: "自己申告",
          participantName: participantName,
          guestMail: mail,
          guestPhone: phone
        }
      );

    return {
      ok: true,
      message: "受付完了",
      rowNo: historyRowNo,
      receptionCategory: receptionCategory,
      companyName: companyName,
      participantName: participantName,
      block: block,
      branch: branch,
      checkedAt: formatDateTimeForClient_(new Date())
    };

  } finally {

    try {
      lock.releaseLock();
    } catch (releaseErr) {
    }
  }
}

function findDuplicateManualGuestCheckin_(
  eventId,
  receptionCategory,
  block,
  branch,
  companyName,
  participantName
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet || sheet.getLastRow() < 2) {
    return null;
  }

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const target = {
    eventId: normalizeManualCheckinText_(eventId),
    receptionCategory: normalizeManualCheckinText_(receptionCategory),
    block: normalizeManualCheckinText_(block),
    branch: normalizeManualCheckinText_(branch),
    companyName: normalizeManualCheckinText_(companyName),
    participantName: normalizeManualCheckinText_(participantName)
  };

  for (let i = values.length - 1; i >= 0; i--) {

    const row =
      values[i];

    const rowEventId =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "研修ID"));

    const rowResult =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (rowEventId !== target.eventId || rowResult !== "受付完了") {
      continue;
    }

    const rowReceptionCategory =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "受付区分"));

    const rowBlock =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "ブロック"));

    const rowBranch =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "支部"));

    const rowCompanyName =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "会社名"));

    const rowParticipantName =
      normalizeManualCheckinText_(getCellByHeader_(row, headerMap, "参加者名"));

    if (
      rowReceptionCategory === target.receptionCategory &&
      rowBlock === target.block &&
      rowBranch === target.branch &&
      rowCompanyName === target.companyName &&
      rowParticipantName === target.participantName
    ) {
      return {
        rowNo: i + 2,
        checkedAt: formatDateTimeForClient_(
          getCellByHeader_(row, headerMap, "日時")
        )
      };
    }
  }

  return null;
}

function normalizeManualCheckinText_(value) {

  return String(value || "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    })
    .replace(/\s/g, "")
    .trim()
    .toLowerCase();
}

const PLANNED_ATTENDEE_SHEET_NAME_ =
  "当日参加予定者";

const PLANNED_ATTENDEE_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "研修ID",
    "予定者ID",
    "受付区分",
    "ブロック",
    "支部",
    "会社・団体名",
    "参加者名",
    "メール",
    "電話",
    "備考",
    "受付状態",
    "参加履歴行番号",
    "受付日時",
    "非表示"
  ];

const RELATED_PERSON_MASTER_SHEET_NAME_ =
  "役員・関係者マスタ";

const RELATED_PERSON_MASTER_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "関係者ID",
    "区分",
    "役職",
    "ブロック",
    "支部",
    "会社・団体名",
    "氏名",
    "メール",
    "電話",
    "備考",
    "有効"
  ];

function getPlannedAttendeesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      getPlannedAttendeesResult_(
        String(e.parameter.event || "").trim()
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

function savePlannedAttendeeJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      savePlannedAttendee_(e.parameter);

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

function checkinPlannedAttendeeJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      checkinPlannedAttendee_(
        String(e.parameter.event || "").trim(),
        String(e.parameter.plannedId || "").trim()
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

function deletePlannedAttendeeJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      deletePlannedAttendee_(
        String(e.parameter.event || "").trim(),
        String(e.parameter.plannedId || "").trim()
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

function getRelatedPersonMastersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result = {
      ok: true,
      persons: getRelatedPersonMasters_()
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

function saveRelatedPersonMasterJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      saveRelatedPersonMaster_(e.parameter);

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

function addRelatedPersonsToPlannedJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    const personIds =
      String(e.parameter.personIds || "")
        .split(",")
        .map(function(id) {
          return String(id || "").trim();
        })
        .filter(function(id) {
          return id !== "";
        });

    result =
      addRelatedPersonsToPlanned_(
        String(e.parameter.event || "").trim(),
        personIds
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

function addPersonalMembersToPlannedJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    const personalIds =
      String(e.parameter.personalIds || "")
        .split(",")
        .map(function(id) {
          return String(id || "").trim();
        })
        .filter(function(id) {
          return id !== "";
        });

    result =
      addPersonalMembersToPlanned_(
        String(e.parameter.event || "").trim(),
        personalIds
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

function getOrCreatePlannedAttendeeSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(PLANNED_ATTENDEE_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(PLANNED_ATTENDEE_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    PLANNED_ATTENDEE_HEADERS_
  );

  return sheet;
}

function getOrCreateRelatedPersonMasterSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(RELATED_PERSON_MASTER_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(RELATED_PERSON_MASTER_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    RELATED_PERSON_MASTER_HEADERS_
  );

  return sheet;
}

function getNextPlannedAttendeeId_() {

  return "PA-" + Utilities.getUuid().slice(0, 8);
}

function getNextRelatedPersonId_() {

  return "RP-" + Utilities.getUuid().slice(0, 8);
}

function getRelatedPersonMasters_() {

  const sheet =
    getOrCreateRelatedPersonMasterSheet_();

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const persons = [];

  values.forEach(function(row) {

    const active =
      String(getCellByHeader_(row, headerMap, "有効") || "TRUE").trim();

    if (active.toUpperCase() === "FALSE") {
      return;
    }

    const personId =
      String(getCellByHeader_(row, headerMap, "関係者ID") || "").trim();

    if (!personId) {
      return;
    }

    persons.push({
      personId: personId,
      category: String(getCellByHeader_(row, headerMap, "区分") || "").trim(),
      role: String(getCellByHeader_(row, headerMap, "役職") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      companyName: String(getCellByHeader_(row, headerMap, "会社・団体名") || "").trim(),
      personName: String(getCellByHeader_(row, headerMap, "氏名") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      phone: String(getCellByHeader_(row, headerMap, "電話") || "").trim(),
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim()
    });
  });

  persons.sort(function(a, b) {
    return (a.category > b.category ? 1 : -1) ||
      (a.role > b.role ? 1 : -1) ||
      (a.personName > b.personName ? 1 : -1);
  });

  return persons;
}

function saveRelatedPersonMaster_(params) {

  const personIdParam =
    String(params.personId || "").trim();

  const category =
    String(params.category || "").trim();

  const role =
    String(params.role || "").trim();

  const block =
    String(params.block || "").trim();

  const branch =
    String(params.branch || "").trim();

  const companyName =
    String(params.companyName || "").trim();

  const personName =
    String(params.personName || "").trim();

  const mail =
    String(params.mail || "").trim();

  const phone =
    String(params.phone || "").trim();

  const note =
    String(params.note || "").trim();

  if (!category) {
    throw new Error("区分を入力してください。");
  }

  if (!personName) {
    throw new Error("氏名を入力してください。");
  }

  const sheet =
    getOrCreateRelatedPersonMasterSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  let personId =
    personIdParam;

  let rowNo =
    0;

  if (personId) {

    const values =
      sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {

      const rowPersonId =
        String(getCellByHeader_(values[i], headerMap, "関係者ID") || "").trim();

      if (rowPersonId === personId) {
        rowNo =
          i + 1;
        break;
      }
    }

    if (!rowNo) {
      throw new Error("更新する役員・関係者が見つかりません。");
    }
  }

  if (!personId) {
    personId =
      getNextRelatedPersonId_();
  }

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] =
    rowNo
      ? sheet.getRange(rowNo, headerMap["作成日時"] + 1).getValue()
      : now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["関係者ID"]] = personId;
  row[headerMap["区分"]] = category;
  row[headerMap["役職"]] = role;
  row[headerMap["ブロック"]] = block;
  row[headerMap["支部"]] = branch;
  row[headerMap["会社・団体名"]] = companyName;
  row[headerMap["氏名"]] = personName;
  row[headerMap["メール"]] = mail;
  row[headerMap["電話"]] = phone;
  row[headerMap["備考"]] = note;
  row[headerMap["有効"]] = "TRUE";

  if (rowNo) {
    sheet
      .getRange(rowNo, 1, 1, row.length)
      .setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return {
    ok: true,
    message: rowNo
      ? "役員・関係者マスタを更新しました。"
      : "役員・関係者マスタへ登録しました。",
    personId: personId
  };
}

function addRelatedPersonsToPlanned_(eventId, personIds) {

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!personIds || personIds.length === 0) {
    throw new Error("追加する関係者を選択してください。");
  }

  const personMap = {};

  getRelatedPersonMasters_().forEach(function(person) {
    personMap[person.personId] =
      person;
  });

  let added =
    0;

  let skipped =
    0;

  personIds.forEach(function(personId) {

    const person =
      personMap[personId];

    if (!person) {
      skipped++;
      return;
    }

    if (
      findDuplicatePlannedAttendee_(
        eventId,
        person.category || "役員・来賓",
        person.block || "",
        person.branch || "",
        person.companyName || "",
        person.personName || ""
      )
    ) {
      skipped++;
      return;
    }

    savePlannedAttendee_({
      event: eventId,
      receptionCategory: person.category || "役員・来賓",
      block: person.block || "",
      branch: person.branch || "",
      companyName: person.companyName || "",
      participantName: person.personName || "",
      mail: person.mail || "",
      phone: person.phone || "",
      note: [
        person.role || "",
        person.note || ""
      ].filter(function(v) {
        return String(v || "").trim() !== "";
      }).join(" / ")
    });

    added++;
  });

  return {
    ok: true,
    message:
      "予定者へ追加しました。追加 " +
      added +
      "件、重複等でスキップ " +
      skipped +
      "件。",
    added: added,
    skipped: skipped
  };
}

function addPersonalMembersToPlanned_(eventId, personalIds) {

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!personalIds || personalIds.length === 0) {
    throw new Error("追加する個人会員を選択してください。");
  }

  if (typeof getPersonalMembers_ !== "function") {
    throw new Error("個人会員マスタを取得できません。");
  }

  const memberMap =
    makeMemberMapForPlannedPersonal_();

  const personalMap = {};

  getPersonalMembers_({}).members.forEach(function(person) {
    const personalId =
      String(person.personalId || "").trim();

    if (personalId) {
      personalMap[personalId] =
        person;
    }
  });

  const sheet =
    getOrCreatePlannedAttendeeSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const existingDuplicateMap =
    makePlannedAttendeeDuplicateMap_(
      eventId
    );

  const now =
    new Date();

  const rows = [];
  const addedAttendees = [];
  let added =
    0;

  let skipped =
    0;

  const skipReasons = {};

  function skipPlannedPersonal_(reason) {
    skipped++;
    skipReasons[reason] =
      (skipReasons[reason] || 0) + 1;
  }

  personalIds.forEach(function(personalId) {

    const person =
      personalMap[personalId];

    if (!person) {
      skipPlannedPersonal_("個人会員マスタに見つかりません");
      return;
    }

    if (String(person.active || "TRUE").toUpperCase() === "FALSE") {
      skipPlannedPersonal_("無効な個人会員です");
      return;
    }

    const memberNo =
      normalizeMemberNo_(person.memberNo || "");

    const member =
      memberMap[memberNo] || {};

    const companyName =
      String(person.companyName || member.companyName || "").trim();

    const participantName =
      String(person.personName || "").trim();

    if (!companyName || !participantName) {
      skipPlannedPersonal_("会社名または氏名が不足しています");
      return;
    }

    const duplicateKey =
      makePlannedAttendeeDuplicateKey_(
        "事前申込者",
        member.block || "",
        member.branch || "",
        companyName,
        participantName
      );

    if (existingDuplicateMap[duplicateKey]) {
      skipPlannedPersonal_("既に登録済みです");
      return;
    }

    existingDuplicateMap[duplicateKey] =
      true;

    const row =
      new Array(sheet.getLastColumn()).fill("");

    row[headerMap["作成日時"]] = now;
    row[headerMap["更新日時"]] = now;
    row[headerMap["研修ID"]] = eventId;
    const plannedId =
      getNextPlannedAttendeeId_();

    row[headerMap["予定者ID"]] = plannedId;
    row[headerMap["受付区分"]] = "事前申込者";
    row[headerMap["ブロック"]] = member.block || "";
    row[headerMap["支部"]] = member.branch || "";
    row[headerMap["会社・団体名"]] = companyName;
    row[headerMap["参加者名"]] = participantName;
    row[headerMap["メール"]] = person.mail || member.mail || "";
    row[headerMap["電話"]] = "";
    row[headerMap["備考"]] = [
      person.personalId || "",
      person.personType || ""
    ].filter(function(v) {
      return String(v || "").trim() !== "";
    }).join(" / ");
    row[headerMap["受付状態"]] = "未受付";
    row[headerMap["非表示"]] = "FALSE";

    rows.push(row);

    addedAttendees.push({
      createdAt: now,
      updatedAt: now,
      eventId: eventId,
      plannedId: plannedId,
      receptionCategory: "事前申込者",
      block: member.block || "",
      branch: member.branch || "",
      companyName: companyName,
      participantName: participantName,
      mail: person.mail || member.mail || "",
      phone: "",
      note: row[headerMap["備考"]],
      status: "未受付",
      hidden: "FALSE"
    });

    added++;
  });

  if (rows.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        sheet.getLastColumn()
      )
      .setValues(rows);
  }

  if (
    shouldUseFirestoreForPlannedAttendees_() &&
    typeof syncPlannedAttendeeToFirestore_ === "function"
  ) {
    addedAttendees.forEach(function(attendee) {
      try {
        syncPlannedAttendeeToFirestore_(
          attendee
        );
      } catch (firestoreErr) {
      }
    });
  }

  return {
    ok: true,
    message:
      "個人会員マスタから事前申込者へ追加しました。追加 " +
      added +
      "件、追加しなかったもの " +
      skipped +
      "件。",
    added: added,
    skipped: skipped,
    skipReasons: skipReasons
  };
}

function makePlannedAttendeeDuplicateMap_(
  eventId
) {

  const map = {};

  getPlannedAttendeesForEvent_(
    eventId
  ).forEach(function(item) {

    const key =
      makePlannedAttendeeDuplicateKey_(
        item.receptionCategory,
        item.block,
        item.branch,
        item.companyName,
        item.participantName
      );

    map[key] =
      true;
  });

  return map;
}

function makePlannedAttendeeDuplicateKey_(
  receptionCategory,
  block,
  branch,
  companyName,
  participantName
) {

  return [
    receptionCategory,
    block,
    branch,
    companyName,
    participantName
  ].map(function(value) {
    return normalizeManualCheckinText_(
      value
    );
  }).join("\t");
}

function makeMemberMapForPlannedPersonal_() {

  const map = {};

  try {

    getMemberRowsFromMaster_().forEach(function(member) {
      const memberNo =
        normalizeMemberNo_(member.memberNo || "");

      if (memberNo) {
        map[memberNo] =
          member;
      }
    });

  } catch (err) {
  }

  return map;
}

function getPlannedAttendeesResult_(eventId) {

  const attendees =
    getPlannedAttendeesForEvent_(eventId);

  const checked =
    attendees.filter(function(item) {
      return item.status === "受付済み";
    }).length;

  return {
    ok: true,
    attendees: attendees,
    summary: {
      total: attendees.length,
      checked: checked,
      unchecked: Math.max(attendees.length - checked, 0)
    }
  };
}

function getPlannedAttendeesForEvent_(eventId) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    return [];
  }

  if (
    shouldUseFirestoreForPlannedAttendees_() &&
    typeof getFirestorePlannedAttendees_ === "function"
  ) {
    try {
      const firestoreAttendees =
        getFirestorePlannedAttendees_(
          eventId
        );

      if (firestoreAttendees && firestoreAttendees.length > 0) {
        const training =
          findTrainingById_(
            eventId
          );

        firestoreAttendees.forEach(function(attendee) {
          attendee.locationUrl =
            training
              ? buildPlannedLocationCheckinUrl_(
                  training,
                  attendee
                )
              : "";
        });

        return firestoreAttendees;
      }
    } catch (firestoreErr) {
    }
  }

  const sheet =
    getOrCreatePlannedAttendeeSheet_();

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const headerMap =
    getHeaderMap_(sheet);

  const training =
    findTrainingById_(
      eventId
    );

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();

  const attendees = [];

  values.forEach(function(row, index) {

    const rowEventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (rowEventId !== eventId) {
      return;
    }

    const hidden =
      String(getCellByHeader_(row, headerMap, "非表示") || "")
        .trim()
        .toUpperCase();

    if (hidden === "TRUE") {
      return;
    }

    const attendee = {
      rowNo: index + 2,
      createdAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "作成日時")),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時")),
      eventId: rowEventId,
      plannedId: String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim(),
      receptionCategory: String(getCellByHeader_(row, headerMap, "受付区分") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      companyName: String(getCellByHeader_(row, headerMap, "会社・団体名") || "").trim(),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      phone: String(getCellByHeader_(row, headerMap, "電話") || "").trim(),
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim(),
      status: String(getCellByHeader_(row, headerMap, "受付状態") || "未受付").trim(),
      historyRowNo: String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim(),
      checkedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "受付日時"))
    };

    attendee.qrText =
      attendee.plannedId
        ? "PLANNED:" + attendee.plannedId
        : "";

    attendee.locationUrl =
      training
        ? buildPlannedLocationCheckinUrl_(
            training,
            attendee
          )
        : "";

    attendees.push(attendee);
  });

  attendees.sort(function(a, b) {
    return (a.status > b.status ? 1 : -1) ||
      (a.receptionCategory > b.receptionCategory ? 1 : -1) ||
      (a.participantName > b.participantName ? 1 : -1);
  });

  if (
    shouldUseFirestoreForPlannedAttendees_() &&
    typeof syncPlannedAttendeeToFirestore_ === "function"
  ) {
    attendees.forEach(function(attendee) {
      try {
        syncPlannedAttendeeToFirestore_(
          attendee
        );
      } catch (firestoreErr) {
      }
    });
  }

  return attendees;
}

function getPlannedAttendeeSummary_(eventId) {

  const attendees =
    getPlannedAttendeesForEvent_(eventId);

  const checked =
    attendees.filter(function(item) {
      return item.status === "受付済み";
    }).length;

  return {
    total: attendees.length,
    checked: checked,
    unchecked: Math.max(attendees.length - checked, 0)
  };
}

function findDuplicatePlannedAttendee_(
  eventId,
  receptionCategory,
  block,
  branch,
  companyName,
  participantName
) {

  const attendees =
    getPlannedAttendeesForEvent_(
      eventId
    );

  const target = {
    receptionCategory: normalizeManualCheckinText_(receptionCategory),
    block: normalizeManualCheckinText_(block),
    branch: normalizeManualCheckinText_(branch),
    companyName: normalizeManualCheckinText_(companyName),
    participantName: normalizeManualCheckinText_(participantName)
  };

  for (let i = 0; i < attendees.length; i++) {

    const item =
      attendees[i];

    if (
      normalizeManualCheckinText_(item.receptionCategory) === target.receptionCategory &&
      normalizeManualCheckinText_(item.block) === target.block &&
      normalizeManualCheckinText_(item.branch) === target.branch &&
      normalizeManualCheckinText_(item.companyName) === target.companyName &&
      normalizeManualCheckinText_(item.participantName) === target.participantName
    ) {
      return item;
    }
  }

  return null;
}

function savePlannedAttendee_(params) {

  const eventId =
    String(params.event || "").trim();

  const receptionCategory =
    String(params.receptionCategory || "").trim();

  const block =
    String(params.block || "").trim();

  const branch =
    String(params.branch || "").trim();

  const companyName =
    String(params.companyName || "").trim();

  const participantName =
    String(params.participantName || "").trim();

  const mail =
    String(params.mail || "").trim();

  const phone =
    String(params.phone || "").trim();

  const note =
    String(params.note || "").trim();

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (!receptionCategory) {
    throw new Error("受付区分を選択してください。");
  }

  if (!participantName) {
    throw new Error("参加者名を入力してください。");
  }

  if (receptionCategory === "他ブロック会員" && (!block || !branch || !companyName)) {
    throw new Error("ブロック、支部、会社・団体名を入力してください。");
  }

  const duplicate =
    findDuplicatePlannedAttendee_(
      eventId,
      receptionCategory,
      block,
      branch,
      companyName,
      participantName
    );

  if (duplicate) {
    return {
      ok: true,
      message: "既に当日参加予定者に登録されています。",
      plannedId: duplicate.plannedId
    };
  }

  const sheet =
    getOrCreatePlannedAttendeeSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const now =
    new Date();

  const plannedId =
    getNextPlannedAttendeeId_();

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["予定者ID"]] = plannedId;
  row[headerMap["受付区分"]] = receptionCategory;
  row[headerMap["ブロック"]] = block;
  row[headerMap["支部"]] = branch;
  row[headerMap["会社・団体名"]] = companyName;
  row[headerMap["参加者名"]] = participantName;
  row[headerMap["メール"]] = mail;
  row[headerMap["電話"]] = phone;
  row[headerMap["備考"]] = note;
  row[headerMap["受付状態"]] = "未受付";
  row[headerMap["非表示"]] = "FALSE";

  sheet.appendRow(row);

  if (
    shouldUseFirestoreForPlannedAttendees_() &&
    typeof syncPlannedAttendeeToFirestore_ === "function"
  ) {
    try {
      syncPlannedAttendeeToFirestore_({
        createdAt: now,
        updatedAt: now,
        eventId: eventId,
        plannedId: plannedId,
        receptionCategory: receptionCategory,
        block: block,
        branch: branch,
        companyName: companyName,
        participantName: participantName,
        mail: mail,
        phone: phone,
        note: note,
        status: "未受付",
        hidden: "FALSE"
      });
    } catch (firestoreErr) {
    }
  }

  return {
    ok: true,
    message: "当日参加予定者を登録しました。",
    plannedId: plannedId
  };
}

function checkinPlannedAttendee_(eventId, plannedId, method, meta) {

  if (!eventId || !plannedId) {
    throw new Error("予定者が指定されていません。");
  }

  meta =
    meta || {};

  const checkinMethod =
    String(method || "予定者受付").trim() || "予定者受付";

  const lock =
    LockService.getScriptLock();

  try {

    lock.waitLock(5000);

    const sheet =
      getOrCreatePlannedAttendeeSheet_();

    const headerMap =
      getHeaderMap_(sheet);

    const values =
      sheet.getDataRange().getValues();

    let rowNo =
      0;

    let planned =
      null;

    for (let i = 1; i < values.length; i++) {

      const rowEventId =
        String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

      const rowPlannedId =
        String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim();

      if (rowEventId === eventId && rowPlannedId === plannedId) {
        rowNo =
          i + 1;

        planned =
          values[i];

        break;
      }
    }

    if (!rowNo || !planned) {
      throw new Error("当日参加予定者が見つかりません。");
    }

    const status =
      String(getCellByHeader_(planned, headerMap, "受付状態") || "").trim();

    if (status === "受付済み") {
      return {
        ok: true,
        message: "既に受付済みです",
        plannedId: plannedId,
        receptionCategory: String(getCellByHeader_(planned, headerMap, "受付区分") || "").trim(),
        companyName: String(getCellByHeader_(planned, headerMap, "会社・団体名") || "").trim(),
        participantName: String(getCellByHeader_(planned, headerMap, "参加者名") || "").trim(),
        checkedAt: formatDateTimeForClient_(getCellByHeader_(planned, headerMap, "受付日時"))
      };
    }

    const receptionCategory =
      String(getCellByHeader_(planned, headerMap, "受付区分") || "").trim();

    const block =
      String(getCellByHeader_(planned, headerMap, "ブロック") || "").trim();

    const branch =
      String(getCellByHeader_(planned, headerMap, "支部") || "").trim();

    const companyName =
      String(getCellByHeader_(planned, headerMap, "会社・団体名") || "").trim();

    const participantName =
      String(getCellByHeader_(planned, headerMap, "参加者名") || "").trim();

    const mail =
      String(getCellByHeader_(planned, headerMap, "メール") || "").trim();

    const phone =
      String(getCellByHeader_(planned, headerMap, "電話") || "").trim();

    const note =
      String(getCellByHeader_(planned, headerMap, "備考") || "").trim();

    const duplicate =
      findDuplicateManualGuestCheckin_(
        eventId,
        receptionCategory,
        block,
        branch,
        companyName,
        participantName
      );

    const checkedAt =
      new Date();

    const historyRowNo =
      duplicate
        ? duplicate.rowNo
        : saveCheckinHistory_(
            eventId,
            checkinMethod,
            "PLANNED:" + plannedId,
            "",
            companyName,
            block,
            branch,
            "",
            "受付完了",
            note,
            {
              receptionCategory: receptionCategory,
              verificationStatus: meta.verificationStatus || "事前予定",
              participantName: participantName,
              guestMail: mail,
              guestPhone: phone,
              locationToken: meta.locationToken || "",
              latitude: meta.latitude || "",
              longitude: meta.longitude || "",
              distanceMeters: meta.distanceMeters || ""
            }
          );

    sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(checkedAt);
    sheet.getRange(rowNo, headerMap["受付状態"] + 1).setValue("受付済み");
    sheet.getRange(rowNo, headerMap["参加履歴行番号"] + 1).setValue(historyRowNo || "");
    sheet.getRange(rowNo, headerMap["受付日時"] + 1).setValue(checkedAt);

    if (
      shouldUseFirestoreForPlannedAttendees_() &&
      typeof syncPlannedAttendeeToFirestore_ === "function"
    ) {
      try {
        syncPlannedAttendeeToFirestore_({
          createdAt: getCellByHeader_(planned, headerMap, "作成日時") || checkedAt,
          updatedAt: checkedAt,
          eventId: eventId,
          plannedId: plannedId,
          receptionCategory: receptionCategory,
          block: block,
          branch: branch,
          companyName: companyName,
          participantName: participantName,
          mail: mail,
          phone: phone,
          note: note,
          status: "受付済み",
          historyRowNo: historyRowNo || "",
          checkedAt: checkedAt,
          hidden: "FALSE"
        });
      } catch (firestoreErr) {
      }
    }

    if (
      typeof shouldUseFirestoreForCheckinIndex_ === "function" &&
      shouldUseFirestoreForCheckinIndex_() &&
      typeof syncCheckinIndexTargetToFirestore_ === "function"
    ) {
      try {
        syncCheckinIndexTargetToFirestore_(
          eventId,
          {
            plannedId: plannedId,
            companyName: companyName || participantName,
            participantName: participantName,
            mail: mail,
            block: block,
            branch: branch,
            district: "",
            receptionCategory: receptionCategory
          },
          receptionCategory === "事前申込者"
            ? "事前申込者"
            : "事前申込者:" + (receptionCategory || "予定者"),
          "受付済み",
          checkedAt,
          checkinMethod,
          historyRowNo || "",
          note,
          checkedAt
        );
      } catch (firestoreErr) {
      }
    }

    return {
      ok: true,
      message: duplicate ? "既に受付済みです" : "受付完了",
      plannedId: plannedId,
      receptionCategory: receptionCategory,
      companyName: companyName,
      participantName: participantName,
      checkedAt: formatDateTimeForClient_(checkedAt)
    };

  } finally {

    try {
      lock.releaseLock();
    } catch (releaseErr) {
    }
  }
}

function deletePlannedAttendee_(eventId, plannedId) {

  if (!eventId || !plannedId) {
    throw new Error("削除する予定者が指定されていません。");
  }

  const sheet =
    getOrCreatePlannedAttendeeSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowPlannedId =
      String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim();

    if (rowEventId !== eventId || rowPlannedId !== plannedId) {
      continue;
    }

    const rowNo =
      i + 1;

    sheet
      .getRange(rowNo, headerMap["更新日時"] + 1)
      .setValue(new Date());

    sheet
      .getRange(rowNo, headerMap["非表示"] + 1)
      .setValue("TRUE");

    if (
      shouldUseFirestoreForPlannedAttendees_() &&
      typeof syncPlannedAttendeeToFirestore_ === "function"
    ) {
      try {
        syncPlannedAttendeeToFirestore_({
          createdAt: getCellByHeader_(values[i], headerMap, "作成日時") || new Date(),
          updatedAt: new Date(),
          eventId: eventId,
          plannedId: plannedId,
          receptionCategory: String(getCellByHeader_(values[i], headerMap, "受付区分") || "").trim(),
          block: String(getCellByHeader_(values[i], headerMap, "ブロック") || "").trim(),
          branch: String(getCellByHeader_(values[i], headerMap, "支部") || "").trim(),
          companyName: String(getCellByHeader_(values[i], headerMap, "会社・団体名") || "").trim(),
          participantName: String(getCellByHeader_(values[i], headerMap, "参加者名") || "").trim(),
          mail: String(getCellByHeader_(values[i], headerMap, "メール") || "").trim(),
          phone: String(getCellByHeader_(values[i], headerMap, "電話") || "").trim(),
          note: String(getCellByHeader_(values[i], headerMap, "備考") || "").trim(),
          status: String(getCellByHeader_(values[i], headerMap, "受付状態") || "未受付").trim(),
          historyRowNo: String(getCellByHeader_(values[i], headerMap, "参加履歴行番号") || "").trim(),
          checkedAt: getCellByHeader_(values[i], headerMap, "受付日時") || "",
          hidden: "TRUE"
        });
      } catch (firestoreErr) {
      }
    }

    return {
      ok: true,
      message: "当日参加予定者を一覧から削除しました。"
    };
  }

  throw new Error("当日参加予定者が見つかりません。");
}
