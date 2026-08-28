function showMailSendPage_() {

  const html =
    '<!DOCTYPE html>' +
    '<html lang="ja">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>研修会メール送信</title>' +
    '<style>' +
    'body{font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;background:#f7f7f7;padding:24px;}' +
    '.card{background:#fff;border-radius:12px;padding:24px;max-width:760px;margin:0 auto;box-shadow:0 2px 10px rgba(0,0,0,.12);}' +
    'h1{text-align:center;font-size:24px;}' +
    'label{display:block;margin-top:14px;font-weight:bold;}' +
    'select,button{width:100%;font-size:16px;padding:10px;margin-top:8px;box-sizing:border-box;}' +
    'button{font-size:18px;padding:12px;background:#222;color:#fff;border:none;border-radius:8px;cursor:pointer;}' +
    '.sub{background:#666;margin-top:10px;}' +
    '.box{background:#f4f4f4;padding:14px;border-radius:8px;margin-top:16px;white-space:pre-wrap;line-height:1.7;}' +
    '.result{margin-top:18px;font-size:15px;line-height:1.8;}' +
    '.ok{color:#0a7a2f;font-weight:bold;}' +
    '.ng{color:#b00020;font-weight:bold;}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<h1>研修会メール送信</h1>' +

    '<label>研修会</label>' +
    '<select id="eventId"></select>' +

    '<button class="sub" onclick="loadPreview()">内容確認</button>' +
    '<div id="preview" class="box">研修会を選択して「内容確認」を押してください。</div>' +

    '<button onclick="sendMail()">テスト送信（最初の1件のみ）</button>' +
    '<div id="result" class="result"></div>' +
    '</div>' +

    '<script>' +
    'function init(){' +
    '  google.script.run' +
    '    .withSuccessHandler(function(list){' +
    '      const sel=document.getElementById("eventId");' +
    '      sel.innerHTML="";' +
    '      list.forEach(function(t){' +
    '        const opt=document.createElement("option");' +
    '        opt.value=t.eventId;' +
    '        opt.textContent=t.eventId+" / "+t.title+" / "+t.hostType;' +
    '        sel.appendChild(opt);' +
    '      });' +
    '      if(list.length===0){document.getElementById("preview").textContent="有効な研修会がありません。";}' +
    '    })' +
    '    .getActiveTrainings();' +
    '}' +

    'function loadPreview(){' +
    '  const eventId=document.getElementById("eventId").value;' +
    '  if(!eventId){alert("研修会を選択してください");return;}' +
    '  document.getElementById("preview").textContent="読み込み中...";' +
    '  google.script.run' +
'    .withSuccessHandler(function(res){' +
'      if(!res){document.getElementById("preview").innerHTML="<span class=\\"ng\\">GASから結果が返りませんでした。</span>";return;}' +
'      if(!res.ok){document.getElementById("preview").innerHTML="<span class=\\"ng\\">"+res.message+"</span>";return;}' +
    '      document.getElementById("preview").textContent=' +
    '        "研修ID："+res.training.eventId+"\\n"+' +
    '        "研修名："+res.training.title+"\\n"+' +
    '        "主催："+res.training.hostType+"\\n"+' +
    '        "件名："+res.training.subject+"\\n\\n"+' +
    '        "本文：\\n"+res.training.body+"\\n\\n"+' +
    '        "送信対象件数："+res.targetCount+"件";' +
    '    })' +
    '    .getMailPreview(eventId);' +
    '}' +

    'function sendMail(){' +
    '  const eventId=document.getElementById("eventId").value;' +
    '  if(!eventId){alert("研修会を選択してください");return;}' +
    '  if(!confirm("最初の1件だけテスト送信します。よろしいですか？")){return;}' +
    '  document.getElementById("result").textContent="送信中...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res){' +
    '      if(res.ok){' +
    '        document.getElementById("result").innerHTML="<div class=\\"ok\\">"+res.message+"</div><div>"+res.detail+"</div>";' +
    '      }else{' +
    '        document.getElementById("result").innerHTML="<div class=\\"ng\\">"+res.message+"</div><div>"+(res.detail||"")+"</div>";' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(err){' +
    '      document.getElementById("result").innerHTML="<div class=\\"ng\\">エラー："+err.message+"</div>";' +
    '    })' +
    '    .sendTrainingMailTestOne(eventId);' +
    '}' +

    'init();' +
    '</script>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("研修会メール送信");
}


function getActiveTrainings() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    return [];
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  const col = {
    eventId: headers.indexOf("研修ID"),
    title: headers.indexOf("研修名"),
    eventType: headers.indexOf("イベント種別"),
    hostType: headers.indexOf("主催区分"),
    receptionType: headers.indexOf("受付方式"),
    attendanceUnit: headers.indexOf("受付単位"),
    eventDate: headers.indexOf("開催日"),
    active: headers.indexOf("有効"),
    certificateEnabled: headers.indexOf("修了証発行"),
    attendanceConfirmEnabled: headers.indexOf("出欠回答")
  };

  const list = [];

  for (let i = 1; i < values.length; i++) {

    const active =
      col.active >= 0
        ? String(values[i][col.active] || "").toUpperCase()
        : "TRUE";

    if (active !== "TRUE") {
      continue;
    }

    const certificateValue =
      col.certificateEnabled >= 0
        ? values[i][col.certificateEnabled]
        : true;

    list.push({
      eventId: col.eventId >= 0 ? String(values[i][col.eventId] || "").trim() : "",
      title: col.title >= 0 ? String(values[i][col.title] || "").trim() : "",
      eventType: col.eventType >= 0
        ? String(values[i][col.eventType] || "研修会").trim() || "研修会"
        : "研修会",
      hostType: col.hostType >= 0 ? String(values[i][col.hostType] || "").trim() : "",
      receptionType: col.receptionType >= 0 ? String(values[i][col.receptionType] || "").trim() : "",
      attendanceUnit: col.attendanceUnit >= 0
        ? String(values[i][col.attendanceUnit] || "会社").trim() || "会社"
        : "会社",
      eventDate: col.eventDate >= 0 ? formatDateForClient_(values[i][col.eventDate]) : "",
      certificateEnabled:
        certificateValue === false ||
        String(certificateValue || "").toUpperCase() === "FALSE"
          ? "FALSE"
          : "TRUE",
      attendanceConfirmEnabled:
        col.attendanceConfirmEnabled >= 0
          ? String(values[i][col.attendanceConfirmEnabled] || "").toUpperCase() === "TRUE"
          : false
    });
  }

  return list;
}


function getMailPreview(eventId) {

  writeLog_(
    "メールプレビュー",
    "eventId確認",
    String(eventId)
  );

  const training =
    findTrainingById_(eventId);

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const mailMembers =
    getTargetMembers_(
      training
    );

  const trainingMembers =
    getTrainingTargetMembers_(
      training
    );

  return {
    ok: true,
    training: training,
    attendanceItemCount:
      typeof getAttendanceItems_ === "function"
        ? getAttendanceItems_(eventId, false).length
        : 0,
    targetCount: trainingMembers.length,
    mailTargetCount: mailMembers.length,
    mailPreviewMember: getMailPreviewMember_(
      mailMembers
    ),
    mailPreviewUrls: getMailPreviewUrls_(
      training,
      mailMembers
    ),
    mailSender: getMailSenderPreviewForTraining_(
      training
    ),
    mailSignatureName: getMailSignatureNameById_(
      training.mailSignatureId
    ),
    mailSignatureBody: getMailSignatureBodyById_(
      training.mailSignatureId
    )
  };
}

function getMailPreviewMember_(
  members
) {

  const member =
    members && members.length > 0
      ? members[0]
      : null;

  if (member) {
    return {
      memberNo: member.memberNo || "",
      companyName: member.companyName || "",
      personalId: member.personalId || "",
      participantName: member.participantName || "",
      personType: member.personType || "",
      mail: member.mail || "",
      branch: member.branch || "",
      district: member.district || ""
    };
  }

  return {
    memberNo: "00000",
    companyName: "株式会社サンプル",
    mail: "sample@example.com",
    branch: "",
    district: ""
  };
}

function getMailPreviewUrls_(
  training,
  members
) {

  const member =
    getMailPreviewMember_(
      members
    );

  const urls = {
    companyQrUrl:
      getConfig_("WEB_APP_URL") +
      "?page=qr&member=" +
      encodeURIComponent(member.memberNo),
    memberRegisterUrl:
      getCheckinWebUrl_() +
      "/member-register.html?event=" +
      encodeURIComponent(training.eventId) +
      "&member=" +
      encodeURIComponent(member.memberNo),
    personalQrUrl:
      getCheckinWebUrl_() +
      "/personal-member-qr.html?personal=" +
      encodeURIComponent(member.personalId || "") +
      "&member=" +
      encodeURIComponent(member.memberNo || "") +
      "&company=" +
      encodeURIComponent(member.companyName || "") +
      "&name=" +
      encodeURIComponent(member.participantName || "") +
      "&type=" +
      encodeURIComponent(member.personType || ""),
    attendanceAnswerUrl:
      buildAttendanceAnswerUrl_(
        training,
        member
      ),
    locationCheckinUrl: ""
  };

  if (
    isLocationCheckinEnabled_(training) &&
    hasLocationCheckinVenue_(training)
  ) {
    urls.locationCheckinUrl =
      getCheckinWebUrl_() +
      "/location-checkin.html?token=preview";
  }

  return urls;
}

function hasLocationCheckinVenue_(
  training
) {

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  return !!(
    venue &&
    venue.latitude &&
    venue.longitude
  );
}


function sendTrainingMailTestOne(eventId) {

  const training =
    findTrainingById_(eventId);

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const members =
    getTargetMembers_(training);

  if (members.length === 0) {
    return {
      ok: false,
      message: "送信対象がありません。"
    };
  }

  const testMail =
    getSystemSetting_(
      "TEST_MAIL_TO"
    );

  if (!testMail) {
    return {
      ok: false,
      message: "管理設定シートに TEST_MAIL_TO を設定してください。"
    };
  }

  const baseMember =
    members[0];

  const testMember = {
    memberNo: baseMember.memberNo,
    companyName: baseMember.companyName,
    personalId: baseMember.personalId || "",
    participantName: baseMember.participantName || "",
    personType: baseMember.personType || "",
    mail: testMail,
    block: baseMember.block,
    branch: baseMember.branch,
    district: baseMember.district
  };

  try {

    sendTrainingMailToMember_(
      training,
      testMember
    );

    saveMailHistory_(
      training,
      testMember,
      "テスト送信完了",
      "管理設定 TEST_MAIL_TO 宛"
    );

  return {
    ok: true,
    message: "テスト送信しました。",
    detail:
      "送信先：" +
      testMail +
      "\n確認用データ：" +
      baseMember.companyName +
      (
        baseMember.participantName
          ? " / " + baseMember.participantName
          : ""
      ) +
      " 様送付分"
  };

  } catch (err) {

    saveMailHistory_(
      training,
      testMember,
      "テスト送信失敗",
      err.message
    );

    return {
      ok: false,
      message: "送信に失敗しました。",
      detail: err.message
    };
  }
}


function getTargetMembers_(training, options) {

  options =
    options || {};

  if (isPersonalAttendanceMailTraining_(training)) {
    return getTargetPersonalMembers_(
      training,
      options
    );
  }

  const trainingMembers =
    getTrainingTargetMembers_(
      training
    );

  const settingMap =
    getMemberSettingMap_();

  const list = [];

  trainingMembers.forEach(function(member) {

    if (
      !member.memberNo ||
      !member.companyName
    ) {
      return;
    }

    if (
      !options.includeWithoutMail &&
      !member.mail
    ) {
      return;
    }

    const setting =
      settingMap[member.memberNo] || {
        target: "TRUE",
        note: ""
      };

    if (setting.target !== "TRUE") {
      return;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district
    });
  });

  return list;
}

function isPersonalAttendanceMailTraining_(training) {

  return String(training && training.attendanceUnit || "会社").trim() === "個人";
}

function getTargetPersonalMembers_(training, options) {

  options =
    options || {};

  const trainingMembers =
    getTrainingTargetMembers_(
      training
    );

  const targetMemberMap = {};

  trainingMembers.forEach(function(member) {
    if (member.memberNo) {
      targetMemberMap[member.memberNo] =
        member;
    }
  });

  const personalMembers =
    getPersonalMembers_(
      {}
    ).members || [];

  const targetOrgIds =
    splitPersonalOrganizationIds_(
      training.targetOrgIdsNew || ""
    );

  const personalOrgMap =
    targetOrgIds.length > 0
      ? getPersonalOrganizationMap_()
      : {};

  const list = [];

  personalMembers.forEach(function(person) {

    const baseMember =
      targetMemberMap[person.memberNo];

    if (!baseMember) {
      return;
    }

    if (
      targetOrgIds.length > 0 &&
      !personalBelongsToAnyOrganization_(
        person.personalId,
        targetOrgIds,
        personalOrgMap
      )
    ) {
      return;
    }

    if (
      String(person.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return;
    }

    const personalId =
      String(person.personalId || "").trim();

    const participantName =
      String(person.personName || "").trim();

    if (!personalId || !participantName) {
      return;
    }

    if (
      !options.includeWithoutMail &&
      !person.mail
    ) {
      return;
    }

    list.push({
      memberNo: baseMember.memberNo,
      companyName: baseMember.companyName,
      personalId: personalId,
      participantName: participantName,
      personType: person.personType || "",
      mail: person.mail,
      block: baseMember.block,
      branch: baseMember.branch,
      district: baseMember.district
    });
  });

  return list;
}


function getOrganizationMemberMap_(targetOrgIds) {

  const map = {};

  if (!targetOrgIds || targetOrgIds.length === 0) {
    return map;
  }

  const orgIdMap = {};

  targetOrgIds.forEach(function(orgId) {
    orgIdMap[String(orgId).trim()] =
      true;
  });

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員所属");

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      String(values[i][0] || "")
        .replace(".0", "")
        .trim();

    const orgId =
      String(values[i][1] || "").trim();

    if (
      memberNo &&
      orgIdMap[orgId]
    ) {
      map[memberNo] =
        true;
    }
  }

  if (
    typeof getPersonalMembers_ === "function" &&
    typeof getPersonalOrganizationMap_ === "function"
  ) {

    const personalOrgMap =
      getPersonalOrganizationMap_();

    const personalMembers =
      getPersonalMembers_(
        {}
      ).members || [];

    personalMembers.forEach(function(personalMember) {

      const memberNo =
        String(personalMember.memberNo || "")
          .replace(".0", "")
          .trim();

      const personalId =
        String(personalMember.personalId || "").trim();

      if (
        !memberNo ||
        !personalId ||
        String(personalMember.active || "TRUE").toUpperCase() === "FALSE"
      ) {
        return;
      }

      const selectedOrgMap =
        personalOrgMap[personalId] || {};

      for (let i = 0; i < targetOrgIds.length; i++) {
        const orgId =
          String(targetOrgIds[i] || "").trim();

        if (selectedOrgMap[orgId]) {
          map[memberNo] =
            true;
          return;
        }
      }
    });
  }

  return map;
}


function sendTrainingMailToMember_(
  training,
  member
) {

  const options = {
    from: getMailFromAddress_(training),
    name: getMailFromName_(training)
  };

  const attachmentBlobs =
    getTrainingAttachmentBlobs_(
      training
    );

  if (attachmentBlobs.length > 0) {

    options.attachments =
      attachmentBlobs;
  }

  GmailApp.sendEmail(
    member.mail,
    training.subject,
    buildTrainingMailBody_(
      training,
      member
    ),
    options
  );
}

function getTrainingAttachmentBlobs_(
  training
) {

  const fileIds =
    String(training && training.pdfFileId || "")
      .split(",")
      .map(function(fileId) {
        return String(fileId || "").trim();
      })
      .filter(function(fileId) {
        return fileId !== "";
      });

  return fileIds.map(function(fileId) {

    return DriveApp
      .getFileById(fileId)
      .getBlob();
  });
}


function saveMailHistory_(
  training,
  member,
  result,
  note
) {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("送信履歴");

  if (!sheet) {
    sheet =
      ss.insertSheet("送信履歴");

    sheet.appendRow([
      "日時",
      "研修ID",
      "研修名",
      "業者番号",
      "会社名",
      "メール",
      "結果",
      "備考",
      "ブロック",
      "支部",
      "受付単位",
      "個人ID",
      "参加者名"
    ]);
  }

  ensureHeaders_(
    sheet,
    [
      "日時",
      "研修ID",
      "研修名",
      "業者番号",
      "会社名",
      "メール",
      "結果",
      "備考",
      "ブロック",
      "支部",
      "受付単位",
      "個人ID",
      "参加者名"
    ]
  );

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const row =
    new Array(
      sheet.getLastColumn()
    ).fill("");

  row[headerMap["日時"]] = new Date();
  row[headerMap["研修ID"]] = training.eventId;
  row[headerMap["研修名"]] = training.title;
  row[headerMap["業者番号"]] = member.memberNo;
  row[headerMap["会社名"]] = member.companyName;
  row[headerMap["メール"]] = member.mail;
  row[headerMap["結果"]] = result;
  row[headerMap["備考"]] = note || "";
  row[headerMap["ブロック"]] = member.block || "";
  row[headerMap["支部"]] = member.branch || "";
  row[headerMap["受付単位"]] = training.attendanceUnit || "会社";
  row[headerMap["個人ID"]] = member.personalId || "";
  row[headerMap["参加者名"]] = member.participantName || "";

  sheet.appendRow(row);
}

function getMailFromName_(training) {

  const configuredName =
    getMailFromDisplayName_(
      training
    );

  if (configuredName) {
    return configuredName;
  }

  if (
    training &&
    training.senderOrgId
  ) {

    const senderName =
      getOrganizationSenderNameById_(
        training.senderOrgId
      );

    if (senderName) {
      return senderName;
    }
  }

  const hostType =
    training && training.hostType
      ? training.hostType
      : "";

  const map = {
    "杉並支部": "MAIL_FROM_NAME_SUGINAMI",
    "中野支部": "MAIL_FROM_NAME_NAKANO",
    "世田谷支部": "MAIL_FROM_NAME_SETAGAYA",
    "第十ブロック": "MAIL_FROM_NAME_BLOCK10"
  };

  const key =
    map[hostType];

  if (!key) {
    throw new Error(
      "主催区分が不正です: " + hostType
    );
  }

  return getConfig_(key);
}

function getMailPreviewJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const result =
    getMailPreview(eventId);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getMailTargetMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const includeWithoutMail =
    String(e.parameter.includeWithoutMail || "").toUpperCase() === "TRUE";

  const result =
    getMailTargetMembers_(
      eventId,
      {
        includeWithoutMail: includeWithoutMail
      }
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getMailTargetMembers_(
  eventId,
  options
) {

  options =
    options || {};

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const members =
    getTargetMembers_(
      training,
      {
        includeWithoutMail: options.includeWithoutMail
      }
    );

  return {
    ok: true,
    eventId: training.eventId,
    title: training.title,
    attendanceUnit: training.attendanceUnit || "会社",
    count: members.length,
    members: members.map(function(member) {
      return {
        memberNo: member.memberNo,
        companyName: member.companyName,
        personalId: member.personalId || "",
        participantName: member.participantName || "",
        personType: member.personType || "",
        mail: member.mail,
        block: member.block || "",
        branch: member.branch || "",
        district: member.district || ""
      };
    })
  };
}

function searchAdditionalMailMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      searchAdditionalMailMembers_(
        String(e.parameter.event || "").trim(),
        String(e.parameter.keyword || "").trim()
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

function searchAdditionalMailMembers_(
  eventId,
  keyword
) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  if (!keyword || keyword.length < 2) {
    return {
      ok: false,
      message: "検索文字を2文字以上入力してください。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const word =
    String(keyword || "").trim().toLowerCase();

  const candidates =
    isPersonalAttendanceMailTraining_(training)
      ? searchAdditionalPersonalMailMembers_(word)
      : searchAdditionalCompanyMailMembers_(word);

  return {
    ok: true,
    eventId: training.eventId,
    attendanceUnit: training.attendanceUnit || "会社",
    count: candidates.length,
    members: candidates.slice(0, 30)
  };
}

function searchAdditionalCompanyMailMembers_(
  word
) {

  const rows =
    typeof getMemberRowsForFastRead_ === "function"
      ? getMemberRowsForFastRead_()
      : getMemberRowsFromMaster_();

  const list = [];

  rows.forEach(function(member) {

    const text =
      [
        member.memberNo,
        member.companyName,
        member.representativeName,
        member.mail,
        member.block,
        member.branch,
        member.district
      ].join(" ").toLowerCase();

    if (text.indexOf(word) === -1) {
      return;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      personalId: "",
      participantName: "",
      personType: "",
      mail: member.mail,
      block: member.block || "",
      branch: member.branch || "",
      district: member.district || ""
    });
  });

  return list;
}

function searchAdditionalPersonalMailMembers_(
  word
) {

  const memberMap = {};

  (
    typeof getMemberRowsForFastRead_ === "function"
      ? getMemberRowsForFastRead_()
      : getMemberRowsFromMaster_()
  )
    .forEach(function(member) {
      memberMap[member.memberNo] =
        member;
    });

  const personalMembers =
    getPersonalMembers_(
      {
        keyword: word
      }
    ).members || [];

  const list = [];

  personalMembers.forEach(function(person) {

    if (
      String(person.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return;
    }

    const member =
      memberMap[person.memberNo] || {};

    list.push({
      memberNo: person.memberNo || "",
      companyName: person.companyName || member.companyName || "",
      personalId: person.personalId || "",
      participantName: person.personName || "",
      personType: person.personType || "",
      mail: person.mail || member.mail || "",
      block: member.block || "",
      branch: member.branch || "",
      district: member.district || ""
    });
  });

  return list;
}

function sendAdditionalTrainingMailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      sendAdditionalTrainingMail_(
        String(e.parameter.event || "").trim(),
        String(e.parameter.member || "").replace(".0", "").trim(),
        String(e.parameter.personal || e.parameter.personalId || "").trim(),
        String(e.parameter.mail || "").trim()
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

function sendAdditionalTrainingMail_(
  eventId,
  memberNo,
  personalId,
  overrideMail
) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  if (!memberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const sendMember =
    isPersonalAttendanceMailTraining_(training)
      ? makeAdditionalPersonalMailMember_(memberNo, personalId, overrideMail)
      : makeAdditionalCompanyMailMember_(memberNo, overrideMail);

  if (!sendMember.mail) {
    return {
      ok: false,
      message: "送信先メールアドレスがありません。"
    };
  }

  const senderPreview =
    getMailSenderPreviewForTraining_(
      training
    );

  try {

    sendTrainingMailToMember_(
      training,
      sendMember
    );

  } catch (err) {

    throw new Error(
      buildTrainingMailSendErrorMessage_(
        err,
        senderPreview
      )
    );
  }

  saveMailHistory_(
    training,
    sendMember,
    "送信完了",
    overrideMail
      ? "追加送信（集計対象外・別アドレス）"
      : "追加送信（集計対象外）"
  );

  return {
    ok: true,
    message: "対象外の追加送信を行いました。",
    memberNo: sendMember.memberNo,
    companyName: sendMember.companyName,
    personalId: sendMember.personalId || "",
    participantName: sendMember.participantName || "",
    mail: sendMember.mail,
    fromMail: senderPreview.fromMail || "",
    fromName: senderPreview.displayName || ""
  };
}

function buildTrainingMailSendErrorMessage_(
  err,
  senderPreview
) {

  const rawMessage =
    String(err && err.message ? err.message : err || "");

  let hint =
    "メール送信に失敗しました。";

  if (
    rawMessage.indexOf("permission") !== -1 ||
    rawMessage.indexOf("Permission") !== -1 ||
    rawMessage.indexOf("権限") !== -1 ||
    rawMessage.indexOf("authorization") !== -1 ||
    rawMessage.indexOf("Gmail") !== -1
  ) {
    hint =
      "Gmailの送信権限、またはGoogle側の送信元メール設定を確認してください。";
  }

  if (
    rawMessage.indexOf("No item with the given ID") !== -1 ||
    rawMessage.indexOf("指定した ID のアイテム") !== -1 ||
    rawMessage.indexOf("File not found") !== -1
  ) {
    hint =
      "添付ファイルを開けません。研修会の添付ファイルID、またはDrive共有権限を確認してください。";
  }

  return (
    hint +
    " 送信元: " +
    String(senderPreview && senderPreview.displayName || "") +
    " <" +
    String(senderPreview && senderPreview.fromMail || "") +
    "> / 詳細: " +
    rawMessage
  );
}

function makeAdditionalCompanyMailMember_(
  memberNo,
  overrideMail
) {

  const member =
    findMemberByNo_(
      memberNo
    );

  if (!member) {
    throw new Error("会員情報が見つかりません。");
  }

  return {
    memberNo: member.memberNo,
    companyName: member.companyName,
    mail: overrideMail || member.mail || "",
    originalMail: member.mail || "",
    participantName: "",
    personalId: "",
    block: member.block || "",
    branch: member.branch || "",
    district: member.district || ""
  };
}

function makeAdditionalPersonalMailMember_(
  memberNo,
  personalId,
  overrideMail
) {

  if (!personalId) {
    throw new Error("個人IDが指定されていません。");
  }

  const personalMembers =
    getPersonalMembers_(
      {
        memberNo: memberNo
      }
    ).members || [];

  let target =
    null;

  for (let i = 0; i < personalMembers.length; i++) {

    if (
      String(personalMembers[i].personalId || "").trim() === personalId
    ) {
      target =
        personalMembers[i];
      break;
    }
  }

  if (!target) {
    throw new Error("個人会員が見つかりません。");
  }

  if (
    String(target.active || "TRUE").toUpperCase() === "FALSE"
  ) {
    throw new Error("この個人会員は無効です。");
  }

  const member =
    findMemberByNo_(
      memberNo
    ) || {};

  return {
    memberNo: target.memberNo,
    companyName: target.companyName || member.companyName || "",
    mail: overrideMail || target.mail || member.mail || "",
    originalMail: target.mail || "",
    personalId: target.personalId,
    participantName: target.personName || "",
    personType: target.personType || "",
    block: member.block || "",
    branch: member.branch || "",
    district: member.district || ""
  };
}


function sendTrainingMailTestOneJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const result =
    sendTrainingMailTestOne(eventId);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sendTrainingMailAllJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const result =
    sendTrainingMailAll(eventId);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function sendTrainingMailAll(eventId) {

  const training =
    findTrainingById_(eventId);

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const members =
    getTargetMembers_(training);

  let success =
    0;

  let error =
    0;

  members.forEach(function(member) {

    try {

      sendTrainingMailToMember_(
        training,
        member
      );

      saveMailHistory_(
        training,
        member,
        "送信完了",
        "一括送信"
      );

      success++;

    } catch (err) {

      saveMailHistory_(
        training,
        member,
        "送信失敗",
        err.message
      );

      error++;
    }
  });

  return {
    ok: true,
    message: "一括送信が完了しました。",
    detail:
      "送信成功：" + success + "件 / 失敗：" + error + "件"
  };
}

function getMailHistoryJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    const eventId =
      String(e.parameter.event || "").trim();

    const keyword =
      String(e.parameter.keyword || "").trim();

    const note =
      String(e.parameter.note || "").trim();

    result =
      getMailHistory_(
        eventId,
        keyword,
        note
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


function getMailHistory_(
  eventId,
  keyword,
  note
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("送信履歴");

  if (!sheet) {
    return {
      ok: true,
      histories: []
    };
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const histories = [];

  for (let i = 1; i < values.length; i++) {

    const row = values[i];

    const item = {
      date: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "日時")),
      eventId: String(getCellByHeader_(row, headerMap, "研修ID") || "").trim(),
      trainingTitle: String(getCellByHeader_(row, headerMap, "研修名") || "").trim(),
      memberNo: String(getCellByHeader_(row, headerMap, "業者番号") || "").replace(".0", "").trim(),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      result: String(getCellByHeader_(row, headerMap, "結果") || "").trim(),
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      attendanceUnit: String(getCellByHeader_(row, headerMap, "受付単位") || "").trim(),
      personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim()
    };

    if (
      eventId &&
      item.eventId !== eventId
    ) {
      continue;
    }

    if (
      keyword &&
      (
        item.companyName.indexOf(keyword) === -1 &&
        item.mail.indexOf(keyword) === -1 &&
        item.memberNo.indexOf(keyword) === -1 &&
        item.personalId.indexOf(keyword) === -1 &&
        item.participantName.indexOf(keyword) === -1
      )
    ) {
      continue;
    }

    if (
      note &&
      item.note.indexOf(note) === -1
    ) {
      continue;
    }

    histories.push(item);
  }

  histories.reverse();

  return {
    ok: true,
    histories: histories
  };
}

function getOrganizationSenderNameById_(orgId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("組織マスタ");

  if (!sheet) {
    return "";
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const rowOrgId =
      String(values[i][0] || "").trim();

    if (rowOrgId === String(orgId).trim()) {

      return String(values[i][2] || "").trim();
    }
  }

  return "";
}

function buildTrainingMailBody_(
  training,
  member
) {

  const receptionType =
    String(training.receptionType || "").trim();

  if (receptionType === "手入力") {
    return appendMailSignature_(
      training,
      buildGuestCheckinMailBody_(
        training,
        member
      )
    );
  }

  if (receptionType === "スマホ登録") {
    return appendMailSignature_(
      training,
      buildMemberRegisterMailBody_(
        training,
        member
      )
    );
  }

  if (receptionType === "会社QR") {
    if (isPersonalAttendanceMailTraining_(training)) {
      return appendMailSignature_(
        training,
        buildPersonalQrMailBody_(
          training,
          member
        )
      );
    }

    return appendMailSignature_(
      training,
      buildCompanyQrMailBody_(
        training,
        member
      )
    );
  }

  if (isPersonalAttendanceMailTraining_(training)) {
    return appendMailSignature_(
      training,
      buildPersonalQrMailBody_(
        training,
        member
      )
    );
  }

  return appendMailSignature_(
    training,
    buildCompanyQrMailBody_(
      training,
      member
    )
  );
}

function buildPersonalQrMailBody_(
  training,
  member
) {

  const participantName =
    String(member.participantName || "").trim();

  if (!member.personalId || !participantName) {
    throw new Error("個人単位メールの送信対象に個人IDまたは参加者名がありません。");
  }

  const personalQrUrl =
    getCheckinWebUrl_() +
    "/personal-member-qr.html?personal=" +
    encodeURIComponent(member.personalId || "") +
    "&member=" +
    encodeURIComponent(member.memberNo || "") +
    "&company=" +
    encodeURIComponent(member.companyName || "") +
    "&name=" +
    encodeURIComponent(member.participantName || "") +
    "&type=" +
    encodeURIComponent(member.personType || "");

  return appendLocationCheckinGuide_(
    training,
    member,
    member.companyName + "\n" +
    participantName + " 様\n\n" +
    buildTrainingBaseMailBody_(
      training,
      member
    ) + "\n\n" +
    "【個人単位受付用QR】\n" +
    "この研修会は個人単位受付です。下記URLを開き、受付で個人QRをご提示ください。\n" +
    personalQrUrl + "\n\n" +
    "※このメールは研修会参加確認システムから送信しています。"
  );
}


function buildCompanyQrMailBody_(
  training,
  member
) {

  const qrPageUrl =
    getConfig_("WEB_APP_URL") +
    "?page=qr&member=" +
    encodeURIComponent(member.memberNo);

  return appendLocationCheckinGuide_(
    training,
    member,
    member.companyName + " 様\n\n" +
    buildTrainingBaseMailBody_(
      training,
      member
    ) + "\n\n" +
    "【当日の受付用QRコード】\n" +
    "下記URLを開き、受付で画面をご提示ください。\n" +
    qrPageUrl + "\n\n" +
    "※このメールは研修会参加確認システムから送信しています。"
  );
}


function buildGuestCheckinMailBody_(
  training,
  member
) {

  return appendLocationCheckinGuide_(
    training,
    member,
    member.companyName + " 様\n\n" +
    buildTrainingBaseMailBody_(
      training,
      member
    ) + "\n\n" +
    "【当日の受付方法】\n" +
    "当日は会場に掲示された受付用QRコードから受付を行います。\n" +
    "会場到着後、受付案内に従って、会社名または業者番号で検索して受付してください。\n\n" +
    "※このメールは研修会参加確認システムから送信しています。"
  );
}


function buildMemberRegisterMailBody_(
  training,
  member
) {

  const registerUrl =
    getCheckinWebUrl_() +
    "/member-register.html?event=" +
    encodeURIComponent(training.eventId) +
    "&member=" +
    encodeURIComponent(member.memberNo);

  return appendLocationCheckinGuide_(
    training,
    member,
    member.companyName + " 様\n\n" +
    buildTrainingBaseMailBody_(
      training,
      member
    ) + "\n\n" +
    "【受付用スマートフォンの事前登録】\n" +
    "研修会当日に使用するスマートフォンで、下記URLを開いて事前登録を行ってください。\n\n" +
    registerUrl + "\n\n" +
    "登録後、当日は会場に掲示された受付用QRコードを読み取って受付してください。\n\n" +
    "※このメールは研修会参加確認システムから送信しています。"
  );
}

function buildTrainingBaseMailBody_(
  training,
  member
) {

  const originalBody =
    String(training && training.body || "");

  const replacedBody =
    replaceAttendanceAnswerUrl_(
      originalBody,
      training,
      member
    );

  return appendAttendanceAnswerGuideIfNeeded_(
    training,
    member,
    replacedBody,
    originalBody
  );
}

function appendAttendanceAnswerGuideIfNeeded_(
  training,
  member,
  body,
  originalBody
) {

  const enabled =
    training &&
    (
      training.attendanceConfirmEnabled === true ||
      String(training.attendanceConfirmEnabled).toUpperCase() === "TRUE"
    );

  if (!enabled) {
    return body;
  }

  if (
    String(originalBody || "").indexOf("{{出欠回答URL}}") !== -1 ||
    String(originalBody || "").indexOf("{{出欠確認URL}}") !== -1
  ) {
    return body;
  }

  const url =
    buildAttendanceAnswerUrl_(
      training,
      member
    );

  if (!url) {
    return body;
  }

  return String(body || "").replace(/\s+$/, "") +
    "\n\n" +
    "【出欠回答】\n" +
    "下記URLから出欠をご回答ください。\n" +
    url;
}

function appendLocationCheckinGuide_(
  training,
  member,
  body
) {

  if (!isLocationCheckinEnabled_(training)) {
    return body;
  }

  const url =
    buildLocationCheckinUrl_(
      training,
      member
    );

  if (!url) {
    return body;
  }

  const timeText =
    getLocationCheckinGuideTimeText_(
      training
    );

  return body +
    "\n\n" +
    "【位置情報受付】\n" +
    "当日は上記の受付方法に加えて、位置情報受付をすることも可能です。\n" +
    timeText +
    "会場に到着後、下記URLを開いて位置情報の取得を許可し、受付ボタンを押してください。\n" +
    url;
}

function getLocationCheckinGuideTimeText_(
  training
) {

  const timeWindow =
    getLocationCheckinTimeWindow_(
      training
    );

  if (!timeWindow.start || !timeWindow.end) {
    return "";
  }

  return "受付可能時間: " +
    formatDateTimeForClient_(timeWindow.start) +
    " から " +
    formatDateTimeForClient_(timeWindow.end) +
    " まで\n";
}

function appendMailSignature_(
  training,
  body
) {

  const signatureBody =
    getMailSignatureBodyById_(
      training && training.mailSignatureId
    );

  if (!signatureBody) {
    return body;
  }

  return String(body || "") +
    "\n\n" +
    signatureBody;
}

function resendTrainingMailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    String(e.parameter.event || "").trim();

  const memberNo =
    String(e.parameter.member || "").replace(".0", "").trim();

  const mail =
    String(e.parameter.mail || "").trim();

  const personalId =
    String(e.parameter.personal || e.parameter.personalId || "").trim();

  let result;

  try {

    result =
      resendTrainingMail_(
        eventId,
        memberNo,
        personalId,
        mail
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


function resendTrainingMail_(
  eventId,
  memberNo,
  personalId,
  overrideMail
) {

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDが指定されていません。"
    };
  }

  if (!memberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  if (isPersonalAttendanceMailTraining_(training)) {
    return resendTrainingMailToPersonalMember_(
      training,
      memberNo,
      personalId,
      overrideMail
    );
  }

  const member =
    findMemberByNo_(
      memberNo
    );

  if (!member) {
    return {
      ok: false,
      message: "会員情報が見つかりません。"
    };
  }

  const sendTo =
    overrideMail || member.mail || "";

  if (!sendTo) {
    return {
      ok: false,
      message: "送信先メールアドレスがありません。"
    };
  }

  const sendMember = {
    memberNo: member.memberNo,
    companyName: member.companyName,
    mail: sendTo,
    originalMail: member.mail || "",
    participantName: "",
    personalId: ""
  };

  sendTrainingMailToMember_(
    training,
    sendMember
  );

  saveMailHistory_(
    training,
    sendMember,
    "送信完了",
    overrideMail
      ? "個別再送（別アドレス）"
      : "個別再送（登録メール）"
  );

  return {
    ok: true,
    message: "メールを再送しました。",
    memberNo: member.memberNo,
    companyName: member.companyName,
    mail: sendTo
  };
}

function resendTrainingMailToPersonalMember_(
  training,
  memberNo,
  personalId,
  overrideMail
) {

  if (!personalId) {
    return {
      ok: false,
      message: "個人IDが指定されていません。"
    };
  }

  const members =
    getTargetMembers_(
      training,
      {
        includeWithoutMail: true
      }
    );

  let target =
    null;

  for (let i = 0; i < members.length; i++) {

    if (
      String(members[i].personalId || "").trim() === personalId &&
      (
        !memberNo ||
        String(members[i].memberNo || "").replace(".0", "").trim() === memberNo
      )
    ) {
      target =
        members[i];
      break;
    }
  }

  if (!target) {
    return {
      ok: false,
      message: "この研修会の個人送信対象が見つかりません。"
    };
  }

  const sendTo =
    overrideMail || target.mail || "";

  if (!sendTo) {
    return {
      ok: false,
      message: "送信先メールアドレスがありません。"
    };
  }

  const sendMember = {
    memberNo: target.memberNo,
    companyName: target.companyName,
    mail: sendTo,
    originalMail: target.mail || "",
    personalId: target.personalId,
    participantName: target.participantName,
    personType: target.personType || "",
    block: target.block || "",
    branch: target.branch || "",
    district: target.district || ""
  };

  sendTrainingMailToMember_(
    training,
    sendMember
  );

  saveMailHistory_(
    training,
    sendMember,
    "送信完了",
    overrideMail
      ? "個別再送（別アドレス）"
      : "個別再送（登録メール）"
  );

  return {
    ok: true,
    message: "メールを再送しました。",
    memberNo: sendMember.memberNo,
    companyName: sendMember.companyName,
    personalId: sendMember.personalId,
    participantName: sendMember.participantName,
    mail: sendTo
  };
}

function sendPlannedAttendeeMailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      sendPlannedAttendeeMail_(
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

function sendPlannedAttendeeMail_(
  eventId,
  plannedId
) {

  if (!eventId || !plannedId) {
    return {
      ok: false,
      message: "送信する予定者が指定されていません。"
    };
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  const attendees =
    getPlannedAttendeesForEvent_(
      eventId
    );

  const attendee =
    attendees.filter(function(item) {
      return item.plannedId === plannedId;
    })[0];

  if (!attendee) {
    return {
      ok: false,
      message: "当日参加予定者が見つかりません。"
    };
  }

  if (!attendee.mail) {
    return {
      ok: false,
      message: "この予定者にはメールアドレスが登録されていません。"
    };
  }

  const qrText =
    attendee.qrText || "PLANNED:" + attendee.plannedId;

  const qrImageUrl =
    "https://quickchart.io/qr?size=320&text=" +
    encodeURIComponent(qrText);

  const subject =
    "【受付案内】" + training.title;

  const options = {
    from: getMailFromAddress_(training),
    name: getMailFromName_(training)
  };

  GmailApp.sendEmail(
    attendee.mail,
    subject,
    buildPlannedAttendeeMailBody_(
      training,
      attendee,
      qrText,
      qrImageUrl
    ),
    options
  );

  saveMailHistory_(
    training,
    {
      memberNo: "",
      companyName: attendee.companyName || attendee.participantName || "",
      mail: attendee.mail,
      block: attendee.block || "",
      branch: attendee.branch || "",
      personalId: "",
      participantName: attendee.participantName || ""
    },
    "送信完了",
    "当日参加予定者受付案内"
  );

  return {
    ok: true,
    message: "予定者へ受付案内メールを送信しました。",
    sentTo: attendee.mail
  };
}

function buildPlannedAttendeeMailBody_(
  training,
  attendee,
  qrText,
  qrImageUrl
) {

  const lines =
    [];

  lines.push(
    [
      attendee.companyName || "",
      attendee.participantName || ""
    ].filter(function(v) {
      return String(v || "").trim() !== "";
    }).join(" ") +
    " 様"
  );

  lines.push("");
  lines.push(training.title + " の受付案内です。");
  lines.push("");
  lines.push("【研修会】");
  lines.push("研修ID: " + training.eventId);
  lines.push("開催日: " + (training.eventDate || ""));
  lines.push("主催: " + (training.hostType || ""));
  lines.push("");
  lines.push("【受付QR】");
  lines.push("当日は下記QRを受付で読み取ってください。");
  lines.push(qrImageUrl);
  lines.push("QR内容: " + qrText);

  if (attendee.locationUrl) {
    lines.push("");
    lines.push("【位置情報受付】");
    lines.push("会場到着後、下記URLから位置情報受付を行うこともできます。");
    lines.push(attendee.locationUrl);
  }

  const signatureBody =
    getMailSignatureBodyById_(
      training.mailSignatureId
    );

  if (signatureBody) {
    lines.push("");
    lines.push(signatureBody);
  }

  return lines.join("\n");
}

function getTrainingTargetCondition_(training) {

  return {
    targetBlock: String(training.targetBlock || "").trim(),
    targetBranch: String(training.targetBranch || "").trim(),
    targetDistrict: String(training.targetDistrict || "").trim(),
    targetOrgIdsNew: String(training.targetOrgIdsNew || "").trim()
  };
}


function isMemberMatchedTrainingCondition_(
  member,
  condition
) {

  if (
    condition.targetBlock &&
    normalizeTrainingBlockName_(member.block) !==
      normalizeTrainingBlockName_(condition.targetBlock)
  ) {
    return false;
  }

  if (
    condition.targetBranch &&
    normalizeTrainingBranchName_(member.branch) !==
      normalizeTrainingBranchName_(condition.targetBranch)
  ) {
    return false;
  }

  if (
    condition.targetDistrict &&
    normalizeTrainingDistrictName_(member.district) !==
      normalizeTrainingDistrictName_(condition.targetDistrict)
  ) {
    return false;
  }

  return true;
}

function normalizeTrainingBlockName_(value) {

  const text =
    String(value || "")
    .replace(/\s/g, "")
    .replace(/[０-９]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    })
    .trim();

  if (
    text === "第十ブロック" ||
    text === "第十" ||
    text === "第10ブロック" ||
    text === "10ブロック" ||
    text === "十ブロック" ||
    text === "10"
  ) {
    return "第十ブロック";
  }

  return text;
}

function normalizeTrainingBranchName_(value) {

  return String(value || "")
    .replace(/\s/g, "")
    .replace("杉並区支部", "杉並支部")
    .replace("中野区支部", "中野支部")
    .replace("世田谷区支部", "世田谷支部")
    .trim();
}

function normalizeTrainingDistrictName_(value) {

  return String(value || "")
    .replace(/\s/g, "")
    .replace(/地区$/, "")
    .trim();
}

function deleteTrainingPdfJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      deleteTrainingPdf_(
        e.parameter.event,
        e.parameter.pdfFileId
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


function deleteTrainingPdf_(
  eventId,
  pdfFileId
) {

  eventId =
    String(eventId || "").trim();

  const requestedPdfFileIds =
    String(pdfFileId || "")
      .split(",")
      .map(function(fileId) {
        return String(fileId || "").trim();
      })
      .filter(function(fileId) {
        return fileId !== "";
      });

  if (!eventId) {
    throw new Error("研修IDがありません。");
  }

  if (requestedPdfFileIds.length === 0) {
    throw new Error("PDFファイルIDがありません。");
  }

  const training =
    findTrainingById_(eventId);

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const currentPdfFileIds =
    String(training.pdfFileId || "")
      .split(",")
      .map(function(fileId) {
        return String(fileId || "").trim();
      })
      .filter(function(fileId) {
        return fileId !== "";
      });

  const currentPdfFileIdMap =
    {};

  currentPdfFileIds.forEach(function(fileId) {
    currentPdfFileIdMap[fileId] =
      true;
  });

  const hasUnknownFileId =
    requestedPdfFileIds.some(function(fileId) {
      return !currentPdfFileIdMap[fileId];
    });

  if (hasUnknownFileId) {
    throw new Error("現在登録されているPDFファイルIDと一致しません。画面を再読み込みしてください。");
  }

  requestedPdfFileIds.forEach(function(fileId) {

    DriveApp
      .getFileById(fileId)
      .setTrashed(true);
  });

  updateTrainingPdfFileId_(
    eventId,
    ""
  );

  return {
    ok: true,
    message: "添付ファイルをDriveから削除し、研修会から外しました。"
  };
}
