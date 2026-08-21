function createCertificateTargets(params) {

  params =
    params || {};

  const ruleId =
    String(params.ruleId || "").trim();

  const rule =
    ruleId
      ? getCertificateRuleById_(ruleId)
      : null;

  if (ruleId && !rule) {
    throw new Error("修了証ルールが見つかりません: " + ruleId);
  }

  const ss =
    getSpreadsheet_();

  const trainingMap =
    getCertificateTrainingMap_();

  const histories =
    getCertificateCheckinHistoryItems_(
      trainingMap
    );

  const judgmentUnit =
    getCertificateJudgmentUnit_(
      rule
    );

  const targetCache =
    {};

  const map = {};

  histories.forEach(function(history) {

    const eventId =
      String(history.eventId || "").trim();

    const memberNo =
      String(history.memberNo || "").replace(".0", "").trim();

    const companyName =
      String(history.companyName || "").trim();

    const result =
      String(history.result || "").trim();

    const personalId =
      String(history.personalId || "").trim();

    const participantName =
      String(history.participantName || "").trim();

    if (!eventId || !memberNo || result !== "受付完了") {
      return;
    }

    if (!isCertificateEligibleTraining_(
      trainingMap[eventId],
      eventId
    )) {
      return;
    }

    if (
      shouldExcludeCertificateOutsideAttendance_(rule) &&
      !isCertificateAttendanceInsideTrainingTarget_(
        trainingMap[eventId],
        {
          memberNo: memberNo,
          personalId: personalId
        },
        targetCache
      )
    ) {
      return;
    }

    const targetKey =
      judgmentUnit === "個人単位"
        ? personalId
        : memberNo;

    if (!targetKey) {
      return;
    }

    if (!map[targetKey]) {
      map[targetKey] = {
        memberNo: memberNo,
        companyName: companyName,
        personalId: personalId,
        participantName: participantName,
        eventIds: {}
      };
    }

    map[targetKey].eventIds[eventId] = true;
  });

  let targetSheet =
    ss.getSheetByName("修了証対象");

  if (!targetSheet) {
    targetSheet =
      ss.insertSheet("修了証対象");
  }

  targetSheet.clear();

  targetSheet.appendRow([
    "作成日時",
    "業者番号",
    "会社名",
    "参加回数",
    "参加研修ID",
    "修了証発行対象",
    "PDFファイルID",
    "PDFURL",
    "発行日時",
    "送信対象",
    "送信日時",
    "送信結果",
    "送信先メール",
    "非表示",
    "備考",
    "ルールID",
    "ルール名",
    "証書タイトル",
    "PDF様式",
    "判定単位",
    "個人ID",
    "参加者名"
  ]);

  const now =
    new Date();

  let count =
    0;

  Object.keys(map).forEach(function(memberNo) {

    const item =
      map[memberNo];

    const eventIds =
      Object.keys(item.eventIds).sort();

    const certificateEventIds =
      getCertificateMatchedEventIds_(
        rule,
        eventIds,
        trainingMap
      );

    const attendCount =
      certificateEventIds.length;

    if (isCertificateTargetMatched_(rule, eventIds, trainingMap)) {

      targetSheet.appendRow([
        now,
        item.memberNo,
        item.companyName,
        attendCount,
        certificateEventIds.join(", "),
        "TRUE",
        "",
        "",
        "",
        "TRUE",
        "",
        "",
        "",
        "",
        "",
        rule ? rule.ruleId : "",
        rule ? rule.ruleName : "従来条件（2回以上）",
        rule ? rule.certificateTitle : "修了証",
        rule ? rule.pdfTemplate : "standard",
        judgmentUnit,
        item.personalId || "",
        item.participantName || ""
      ]);

      count++;
    }
  });

  return {
    ok: true,
    message: "修了証対象者一覧を作成しました。",
    targetCount: count
  };
}

function getCertificateCheckinHistoryItems_(
  trainingMap
) {

  const firestoreHistories =
    getCertificateCheckinHistoryItemsFromFirestore_(
      trainingMap
    );

  if (
    firestoreHistories &&
    firestoreHistories.length > 0
  ) {
    return firestoreHistories;
  }

  return getCertificateCheckinHistoryItemsFromSheet_();
}

function getCertificateCheckinHistoryItemsFromFirestore_(
  trainingMap
) {

  if (
    typeof getFirestoreCheckinHistories_ !== "function" ||
    typeof isFirestoreEnabled_ !== "function" ||
    !isFirestoreEnabled_()
  ) {
    return null;
  }

  const histories = [];
  const eventIds =
    Object.keys(trainingMap || {}).filter(function(eventId) {
      return isCertificateEligibleTraining_(
        trainingMap[eventId],
        eventId
      );
    });

  if (!eventIds.length) {
    return [];
  }

  try {

    eventIds.forEach(function(eventId) {

      const eventHistories =
        getFirestoreCheckinHistories_(
          eventId
        ) || [];

      eventHistories.forEach(function(history) {
        histories.push({
          eventId: String(history.eventId || eventId).trim(),
          memberNo: String(history.memberNo || "").replace(".0", "").trim(),
          companyName: String(history.companyName || "").trim(),
          result: String(history.result || "").trim(),
          personalId: String(history.personalId || "").trim(),
          participantName: String(history.participantName || "").trim()
        });
      });
    });

  } catch (err) {
    return null;
  }

  return histories;
}

function getCertificateCheckinHistoryItemsFromSheet_() {

  const ss =
    getSpreadsheet_();

  const historySheet =
    ss.getSheetByName("参加履歴");

  if (!historySheet) {
    return [];
  }

  const values =
    historySheet.getDataRange().getValues();

  const historyHeaderMap =
    getHeaderMap_(
      historySheet
    );

  const histories = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    histories.push({
      eventId: String(getCellByHeader_(row, historyHeaderMap, "研修ID") || "").trim(),
      memberNo: String(getCellByHeader_(row, historyHeaderMap, "業者番号") || "").replace(".0", "").trim(),
      companyName: String(getCellByHeader_(row, historyHeaderMap, "会社名") || "").trim(),
      result: String(getCellByHeader_(row, historyHeaderMap, "結果") || "").trim(),
      personalId: String(getCellByHeader_(row, historyHeaderMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(row, historyHeaderMap, "参加者名") || "").trim()
    });
  }

  return histories;
}

function getCertificateJudgmentUnit_(
  rule
) {

  const text =
    String(rule && rule.judgmentUnit || "会社単位").trim();

  return text === "個人単位"
    ? "個人単位"
    : "会社単位";
}

function shouldExcludeCertificateOutsideAttendance_(
  rule
) {

  if (!rule) {
    return false;
  }

  return String(rule.outsideAttendanceMode || "含めない").trim() !== "含める";
}

function isCertificateAttendanceInsideTrainingTarget_(
  training,
  item,
  cache
) {

  if (!training || !training.eventId) {
    return false;
  }

  const eventId =
    String(training.eventId || "").trim();

  if (!cache[eventId]) {
    cache[eventId] =
      getCertificateTrainingTargetKeyMap_(
        training
      );
  }

  const key =
    makeCertificateTrainingAttendanceKey_(
      training,
      item
    );

  return !!(
    key &&
    cache[eventId] &&
    cache[eventId][key]
  );
}

function getCertificateTrainingTargetKeyMap_(
  training
) {

  const map = {};

  let targets = [];

  if (typeof getStatsTargetMembers_ === "function") {
    targets =
      getStatsTargetMembers_(
        training
      ) || [];
  } else if (typeof getTrainingTargetMembers_ === "function") {
    targets =
      getTrainingTargetMembers_(
        training
      ) || [];
  }

  targets.forEach(function(target) {

    const key =
      makeCertificateTrainingAttendanceKey_(
        training,
        target
      );

    if (key) {
      map[key] =
        true;
    }
  });

  return map;
}

function makeCertificateTrainingAttendanceKey_(
  training,
  item
) {

  const attendanceUnit =
    String(training && training.attendanceUnit || "会社").trim();

  const personalId =
    String(item && item.personalId || "").trim();

  if (attendanceUnit === "個人" && personalId) {
    return "P:" + personalId;
  }

  const memberNo =
    String(item && item.memberNo || "")
      .replace(".0", "")
      .trim();

  return memberNo
    ? "M:" + memberNo
    : "";
}

function getPdfFilesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getPdfFiles_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getPdfFiles_() {

  const folderId =
    getConfig_("PDF_FOLDER_ID");

  if (!folderId) {
    return {
      ok: false,
      message: "PDF_FOLDER_ID が設定されていません。"
    };
  }

  const folder =
    DriveApp.getFolderById(folderId);

  const files =
    folder.getFiles();

  const list = [];

  while (files.hasNext()) {

    const file =
      files.next();

    list.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
      updated: formatDateTimeForClient_(file.getLastUpdated())
    });
  }

  list.sort(function(a, b) {
    return a.name.localeCompare(b.name, "ja");
  });

  return {
    ok: true,
    files: list
  };
}

function showPdfUploadPage_(e) {

  const eventId =
    e.parameter.event || "";

  const html =
    '<!DOCTYPE html>' +
    '<html lang="ja">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>添付ファイルアップロード</title>' +
    '<style>' +
    '*{box-sizing:border-box;}' +
    'body{font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;background:#f4f6f8;margin:0;color:#222;}' +
    'header{background:#12345a;color:#fff;padding:18px 22px;}' +
    'header h1{margin:0;font-size:22px;}' +
    'main{max-width:720px;margin:28px auto;padding:0 18px;}' +
    '.card{background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.10);}' +
    '.event-id{display:inline-block;background:#eef3f8;border-radius:999px;padding:6px 10px;font-weight:bold;margin:0 0 18px;}' +
    'label{display:block;font-weight:bold;margin-bottom:8px;}' +
    'input{width:100%;font-size:16px;padding:12px;box-sizing:border-box;border:1px solid #aaa;}' +
    '.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}' +
    'button{font-size:15px;padding:11px 14px;background:#12345a;color:#fff;border:none;border-radius:8px;cursor:pointer;}' +
    '.sub{background:#666;}' +
    '.danger{background:#b00020;}' +
    '.result{margin-top:18px;line-height:1.8;background:#f7f7f7;border-radius:8px;padding:14px;min-height:54px;}' +
    '.ok{color:#0a7a2f;font-weight:bold;}' +
    '.ng{color:#b00020;font-weight:bold;}' +
    '.muted{color:#666;font-size:14px;line-height:1.7;}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<header><h1>添付ファイルアップロード</h1></header>' +
    '<main>' +
    '<div class="card">' +
    '<p class="event-id">研修ID：' + escapeHtml_(eventId) + '</p>' +
    '<form id="uploadForm">' +
    '<input type="hidden" name="eventId" value="' + escapeHtml_(eventId) + '">' +
    '<input type="hidden" name="duplicateMode" id="duplicateMode" value="">' +
    '<label>添付ファイル</label>' +
    '<input type="file" name="pdfFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" multiple required>' +
    '<div class="actions">' +
    '<button type="button" onclick="uploadNormal()">アップロードする</button>' +
    '<button type="button" class="sub" onclick="closeUploadPage()">閉じる</button>' +
    '</div>' +
    '</form>' +
    '<div id="result" class="result"></div>' +
    '<p class="muted">PDF、Word、Excel、PowerPointを添付できます。複数選択もできます。アップロード後は、元の研修会編集画面で添付状態を更新してください。</p>' +
    '</div>' +
    '</main>' +

    '<script>' +

    'let duplicateFileId="";' +
    'const returnUrl="' + escapeHtml_(getConfigOptional_("PUBLIC_WEB_URL")) + '/training-form.html?event=' + encodeURIComponent(eventId) + '";' +

    'function uploadNormal(){' +
    '  document.getElementById("duplicateMode").value="";' +
    '  upload();' +
    '}' +

    'function uploadReplace(){' +
    '  if(!confirm("既存の同名ファイルを削除し、新しいファイルで置換します。よろしいですか？")){return;}' +
    '  document.getElementById("duplicateMode").value="replace";' +
    '  upload();' +
    '}' +

    'function useExisting(){' +
    '  if(!duplicateFileId){return;}' +
    '  document.getElementById("result").textContent="既存ファイルを研修会に紐付け中...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res){showResult(res);})' +
    '    .withFailureHandler(function(err){showError(err.message);})' +
    '    .useExistingTrainingPdf("' + escapeHtml_(eventId) + '", duplicateFileId);' +
    '}' +

    'function upload(){' +
    '  document.getElementById("result").textContent="アップロード中...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res){' +
    '      if(res.duplicate){' +
    '        duplicateFileId=res.existingFileId;' +
    '        document.getElementById("result").innerHTML=' +
    '          "<div class=\\"ng\\">同名ファイルが既に存在します。</div>" +' +
    '          "<div>"+res.fileName+"</div>" +' +
    '          "<button onclick=\\"useExisting()\\">既存ファイルを使用する</button>" +' +
    '          "<button class=\\"danger\\" onclick=\\"uploadReplace()\\">新しいファイルで置換する</button>" +' +
    '          "<button class=\\"sub\\" onclick=\\"cancelDuplicate()\\">キャンセル</button>";' +
    '        return;' +
    '      }' +
    '      showResult(res);' +
    '    })' +
    '    .withFailureHandler(function(err){showError(err.message);})' +
    '    .uploadTrainingPdfFromForm(document.getElementById("uploadForm"));' +
    '}' +

    'function cancelDuplicate(){' +
    '  document.getElementById("result").innerHTML="キャンセルしました。別のファイル名に変更してアップロードしてください。";' +
    '}' +

    'function closeUploadPage(){' +
    '  window.close();' +
    '  setTimeout(function(){' +
    '    location.href=returnUrl;' +
    '  }, 500);' +
    '}' +

    'function showResult(res){' +
    '  if(res.ok){' +
    '    notifyAttachmentUpdated();' +
    '    document.getElementById("result").innerHTML=' +
    '      "<div class=\\"ok\\">"+res.message+"</div>" +' +
    '      "<div>"+escapeHtmlForClient(res.fileNames || res.fileName || "")+"</div>" +' +
    '      "<div>ファイルID："+escapeHtmlForClient(res.fileIds || res.fileId || "")+"</div>" +' +
    '      "<div class=\\"actions\\"><button class=\\"sub\\" onclick=\\"closeUploadPage()\\">閉じる</button></div>" +' +
    '      "<div class=\\"muted\\">元の研修会編集画面で添付状態を更新してください。</div>";' +
    '  }else{' +
    '    document.getElementById("result").innerHTML="<div class=\\"ng\\">"+res.message+"</div>";' +
    '  }' +
    '}' +

    'function notifyAttachmentUpdated(){' +
    '  try{' +
    '    localStorage.setItem(' +
    '      "trainingAttachmentUpdated",' +
    '      JSON.stringify({' +
    '        eventId:"' + escapeHtml_(eventId) + '",' +
    '        updatedAt:Date.now()' +
    '      })' +
    '    );' +
    '  }catch(e){}' +
    '}' +

    'function escapeHtmlForClient(text){' +
    '  return String(text || "")' +
    '    .replace(/&/g,"&amp;")' +
    '    .replace(/</g,"&lt;")' +
    '    .replace(/>/g,"&gt;")' +
    '    .replace(/"/g,"&quot;")' +
    '    .replace(/\\x27/g,"&#039;");' +
    '}' +

    'function showError(message){' +
    '  document.getElementById("result").innerHTML="<div class=\\"ng\\">エラー："+message+"</div>";' +
    '}' +

    '</script>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("PDFアップロード");
}


function uploadTrainingPdfFromForm(form) {

  const eventId =
    String(form.eventId || "").trim();

  const duplicateMode =
    String(form.duplicateMode || "").trim();

  const rawFiles =
    form.pdfFile;

  const blobs =
    Array.isArray(rawFiles)
      ? rawFiles
      : rawFiles
        ? [rawFiles]
        : [];

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDがありません。"
    };
  }

  if (blobs.length === 0) {
    return {
      ok: false,
      message: "添付ファイルが選択されていません。"
    };
  }

  const allowedMimeTypes = {
    "application/pdf": true,
    "application/msword": true,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    "application/vnd.ms-excel": true,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
    "application/vnd.ms-powerpoint": true,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": true
  };

  for (let i = 0; i < blobs.length; i++) {

    const blob =
      blobs[i];

    if (!allowedMimeTypes[blob.getContentType()]) {
      return {
        ok: false,
        message: "添付できるのはPDF、Word、Excel、PowerPointです: " + blob.getName()
      };
    }
  }

  let folder;

  try {
    folder =
      DriveApp.getFolderById(
        getConfig_("PDF_FOLDER_ID")
      );
  } catch (err) {
    return {
      ok: false,
      message: "PDF保存先フォルダを開けません。PDF_FOLDER_ID、またはDriveの共有権限を確認してください。詳細: " + err.message
    };
  }

  for (let i = 0; i < blobs.length; i++) {

    const blob =
      blobs[i];

    const sameFiles =
      folder.getFilesByName(
        blob.getName()
      );

    if (!sameFiles.hasNext()) {
      continue;
    }

    const existingFile =
      sameFiles.next();

    if (duplicateMode !== "replace") {
      return {
        ok: false,
        duplicate: true,
        message: "同名ファイルが既に存在します。",
        fileName: blob.getName(),
        existingFileId: existingFile.getId(),
        existingFileUrl: existingFile.getUrl()
      };
    }

    try {
      existingFile.setTrashed(true);
    } catch (err) {
      return {
        ok: false,
        message: "同名ファイルは見つかりましたが、既存ファイルを削除できませんでした。ファイル名を変更して再アップロードするか、Drive上の既存ファイルを手動で削除してください。既存ファイル名: " + blob.getName() + " / 詳細: " + err.message
      };
    }
  }

  const createdFiles =
    [];

  for (let i = 0; i < blobs.length; i++) {

    try {
      createdFiles.push(
        folder.createFile(
          blobs[i]
        )
      );
    } catch (err) {
      return {
        ok: false,
        message: "添付ファイルをDriveへ作成できませんでした。研修PDFフォルダへの編集権限を確認してください。詳細: " + err.message
      };
    }
  }

  try {
    appendTrainingPdfFileIds_(
      eventId,
      createdFiles.map(function(file) {
        return file.getId();
      })
    );
  } catch (err) {
    return {
      ok: false,
      message: "添付ファイルはアップロードされましたが、研修会への紐付けに失敗しました。研修IDまたは研修会シートを確認してください。ファイルID: " + createdFiles.map(function(file) { return file.getId(); }).join(", ") + " / 詳細: " + err.message
    };
  }

  return {
    ok: true,
    message: "添付ファイルをアップロードし、研修会に紐付けました。",
    fileId: createdFiles[0].getId(),
    fileIds: createdFiles.map(function(file) { return file.getId(); }).join(", "),
    fileName: createdFiles[0].getName(),
    fileNames: createdFiles.map(function(file) { return file.getName(); }).join(" / "),
    fileUrl: createdFiles[0].getUrl()
  };
}

function useExistingTrainingPdf(
  eventId,
  fileId
) {

  if (!eventId || !fileId) {
    return {
      ok: false,
      message: "研修IDまたはPDFファイルIDがありません。"
    };
  }

  const file =
    DriveApp.getFileById(fileId);

  appendTrainingPdfFileIds_(
    eventId,
    [
      fileId
    ]
  );

  return {
    ok: true,
    message: "既存ファイルを研修会に紐付けました。",
    fileId: fileId,
    fileName: file.getName(),
    fileUrl: file.getUrl()
  };
}

function appendTrainingPdfFileIds_(
  eventId,
  fileIds
) {

  const currentTraining =
    findTrainingById_(eventId) || {};

  const existingIds =
    splitTrainingPdfFileIds_(
      currentTraining.pdfFileId
    );

  const idMap =
    {};

  const mergedIds =
    [];

  existingIds
    .concat(fileIds || [])
    .forEach(function(fileId) {

      fileId =
        String(fileId || "").trim();

      if (!fileId || idMap[fileId]) {
        return;
      }

      idMap[fileId] =
        true;

      mergedIds.push(fileId);
    });

  updateTrainingPdfFileId_(
    eventId,
    mergedIds.join(",")
  );
}

function splitTrainingPdfFileIds_(
  value
) {

  return String(value || "")
    .split(",")
    .map(function(fileId) {
      return String(fileId || "").trim();
    })
    .filter(function(fileId) {
      return fileId !== "";
    });
}

function updateTrainingPdfFileId_(
  eventId,
  pdfFileId
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    throw new Error("研修会シートがありません");
  }

  const values =
    sheet.getDataRange().getValues();

  const headers =
    values[0];

  const eventCol =
    headers.indexOf("研修ID");

  const pdfCol =
    headers.indexOf("PDFファイルID");

  const updatedCol =
    headers.indexOf("更新日時");

  if (eventCol === -1 || pdfCol === -1) {
    throw new Error("研修IDまたはPDFファイルID列が見つかりません");
  }

  for (let i = 1; i < values.length; i++) {

    if (String(values[i][eventCol]).trim() === String(eventId).trim()) {

      sheet
        .getRange(i + 1, pdfCol + 1)
        .setValue(pdfFileId);

      if (updatedCol !== -1) {
        sheet
          .getRange(i + 1, updatedCol + 1)
          .setValue(new Date());
      }

      return;
    }
  }

  throw new Error("該当する研修会が見つかりません: " + eventId);
}

function isCertificateTargetMatched_(
  rule,
  eventIds,
  trainingMap
) {

  if (!rule) {
    return eventIds.length >= 2;
  }

  const conditions =
    rule.conditions || [];

  if (!conditions.length) {
    return eventIds.length >= 2;
  }

  for (let i = 0; i < conditions.length; i++) {

    if (!isCertificateConditionMatched_(
      conditions[i],
      eventIds,
      trainingMap
    )) {
      return false;
    }
  }

  return true;
}

function getCertificateMatchedEventIds_(
  rule,
  eventIds,
  trainingMap
) {

  if (!rule) {
    return eventIds.slice().sort();
  }

  const conditions =
    rule.conditions || [];

  if (!conditions.length) {
    return eventIds.slice().sort();
  }

  const usedMap =
    {};

  conditions.forEach(function(condition) {

    getCertificateConditionEventIds_(
      condition,
      eventIds,
      trainingMap
    ).forEach(function(eventId) {
      usedMap[eventId] =
        true;
    });
  });

  return Object.keys(usedMap).sort();
}

function getCertificateConditionEventIds_(
  condition,
  eventIds,
  trainingMap
) {

  const targetEventIds =
    splitCertificateText_(
      condition.targetEventIds
    );

  if (targetEventIds.length > 0) {

    const attendedMap =
      {};

    eventIds.forEach(function(eventId) {
      attendedMap[eventId] =
        true;
    });

    return targetEventIds.filter(function(eventId) {
      return attendedMap[eventId] &&
        isCertificateEligibleTraining_(
          trainingMap[eventId],
          eventId
        );
    });
  }

  return eventIds.filter(function(eventId) {

    const training =
      trainingMap[eventId] || {};

    return isCertificateTrainingMatched_(
      training,
      condition,
      eventId
    );
  });
}


function isCertificateConditionMatched_(
  condition,
  eventIds,
  trainingMap
) {

  const matchedEventIds =
    eventIds.filter(function(eventId) {

      const training =
        trainingMap[eventId] || {};

      return isCertificateTrainingMatched_(
        training,
        condition,
        eventId
      );
    });

  const requiredCount =
    Number(condition.requiredCount || 1);

  const targetEventIds =
    splitCertificateText_(
      condition.targetEventIds
    );

  const requiredMode =
    String(condition.requiredMode || "all");

  if (targetEventIds.length > 0) {

    const attendedMap = {};

    eventIds.forEach(function(eventId) {
      attendedMap[eventId] =
        true;
    });

    const eligibleTargetEventIds =
      targetEventIds.filter(function(eventId) {
        return isCertificateEligibleTraining_(
          trainingMap[eventId],
          eventId
        );
      });

    if (requiredMode === "any") {

      return eligibleTargetEventIds.some(function(eventId) {
        return attendedMap[eventId];
      });
    }

    return eligibleTargetEventIds.length > 0 &&
      eligibleTargetEventIds.every(function(eventId) {
      return attendedMap[eventId];
    });
  }

  return matchedEventIds.length >= requiredCount;
}


function isCertificateTrainingMatched_(
  training,
  condition,
  eventId
) {

  if (!isCertificateEligibleTraining_(training, eventId)) {
    return false;
  }

  if (
    condition.targetHostType &&
    String(training.hostType || "") !== String(condition.targetHostType || "")
  ) {
    return false;
  }

  if (
    condition.targetBlock &&
    !certificateTextIncludesAny_(training.targetBlock, condition.targetBlock)
  ) {
    return false;
  }

  if (
    condition.targetBranch &&
    !certificateTextIncludesAny_(training.targetBranch, condition.targetBranch)
  ) {
    return false;
  }

  if (
    condition.targetDistrict &&
    !certificateTextIncludesAny_(training.targetDistrict, condition.targetDistrict)
  ) {
    return false;
  }

  if (
    condition.targetOrgIds &&
    !certificateTextIncludesAny_(training.targetOrgIds, condition.targetOrgIds)
  ) {
    return false;
  }

  return true;
}


function isCertificateEligibleTraining_(
  training,
  eventId
) {

  if (!training || !eventId) {
    return false;
  }

  if (String(training.eventType || "研修会").trim() !== "研修会") {
    return false;
  }

  if (String(training.certificateEnabled || "TRUE").toUpperCase() === "FALSE") {
    return false;
  }

  return true;
}


function getCertificateTrainingMap_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return map;
  }

  const headers =
    values[0].map(function(header) {
      return String(header || "").trim();
    });

  const col = {
    eventId: headers.indexOf("研修ID"),
    title: headers.indexOf("研修名"),
    eventType: headers.indexOf("イベント種別"),
    hostType: headers.indexOf("主催区分"),
    attendanceUnit: headers.indexOf("受付単位"),
    checkinTargetMode: headers.indexOf("受付対象方式"),
    targetBlock: headers.indexOf("対象ブロック"),
    targetBranch: headers.indexOf("対象支部"),
    targetDistrict: headers.indexOf("対象地区"),
    targetOrgIds: headers.indexOf("対象組織ID"),
    certificateEnabled: headers.indexOf("修了証発行")
  };

  for (let i = 1; i < values.length; i++) {

    const eventId =
      col.eventId >= 0
        ? String(values[i][col.eventId] || "").trim()
        : "";

    if (!eventId) {
      continue;
    }

    map[eventId] = {
      eventId: eventId,
      title: col.title >= 0 ? String(values[i][col.title] || "") : "",
      eventType: col.eventType >= 0 ? String(values[i][col.eventType] || "研修会").trim() || "研修会" : "研修会",
      hostType: col.hostType >= 0 ? String(values[i][col.hostType] || "") : "",
      attendanceUnit: col.attendanceUnit >= 0 ? String(values[i][col.attendanceUnit] || "会社").trim() || "会社" : "会社",
      checkinTargetMode: col.checkinTargetMode >= 0 ? String(values[i][col.checkinTargetMode] || "通常対象").trim() || "通常対象" : "通常対象",
      targetBlock: col.targetBlock >= 0 ? String(values[i][col.targetBlock] || "") : "",
      targetBranch: col.targetBranch >= 0 ? String(values[i][col.targetBranch] || "") : "",
      targetDistrict: col.targetDistrict >= 0 ? String(values[i][col.targetDistrict] || "") : "",
      targetOrgIds: col.targetOrgIds >= 0 ? String(values[i][col.targetOrgIds] || "") : "",
      targetOrgIdsNew: col.targetOrgIds >= 0 ? String(values[i][col.targetOrgIds] || "") : "",
      certificateEnabled: col.certificateEnabled >= 0 ? String(values[i][col.certificateEnabled] || "TRUE") : "TRUE"
    };
  }

  return map;
}


function certificateTextIncludesAny_(
  actualText,
  expectedText
) {

  const actualList =
    splitCertificateText_(actualText);

  const expectedList =
    splitCertificateText_(expectedText);

  if (!expectedList.length) {
    return true;
  }

  if (!actualList.length) {
    return false;
  }

  return expectedList.some(function(expected) {
    return actualList.indexOf(expected) !== -1;
  });
}


function splitCertificateText_(text) {

  return String(text || "")
    .split(/[,、\n]/)
    .map(function(value) {
      return String(value || "").trim();
    })
    .filter(function(value) {
      return value !== "";
    });
}
