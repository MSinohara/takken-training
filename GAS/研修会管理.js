function showTrainingForm_() {

  const html =
    '<!DOCTYPE html>' +
    '<html lang="ja">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>研修会作成</title>' +
    '<style>' +
    'body{font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;background:#f7f7f7;padding:24px;}' +
    '.card{background:#fff;border-radius:12px;padding:24px;max-width:760px;margin:0 auto;box-shadow:0 2px 10px rgba(0,0,0,.12);}' +
    'h1{text-align:center;font-size:24px;}' +
    'label{display:block;margin-top:14px;font-weight:bold;}' +
    'input,select,textarea{width:100%;font-size:16px;padding:10px;margin-top:6px;box-sizing:border-box;}' +
    'textarea{height:180px;}' +
    'button{width:100%;font-size:18px;padding:12px;margin-top:22px;background:#222;color:#fff;border:none;border-radius:8px;}' +
    '.note{font-size:13px;color:#666;line-height:1.7;}' +
    '.result{margin-top:18px;text-align:center;font-size:17px;}' +
    '.ok{color:#0a7a2f;font-weight:bold;}' +
    '.ng{color:#b00020;font-weight:bold;}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<h1>研修会作成</h1>' +

    '<label>研修ID</label>' +
    '<input id="eventId" placeholder="例：2026-001">' +

    '<label>研修名</label>' +
    '<input id="title" placeholder="例：法令改正研修会">' +

    '<label>主催区分</label>' +
    '<select id="hostType">' +
    '<option value="杉並支部">杉並支部</option>' +
    '<option value="中野支部">中野支部</option>' +
    '<option value="世田谷支部">世田谷支部</option>' +
    '<option value="第十ブロック">第十ブロック</option>' +
    '</select>' +

    '<label>受付方式</label>' +
    '<select id="receptionType">' +
    '<option value="会社QR">会社QR</option>' +
    '<option value="WEBフォーム">WEBフォーム</option>' +
    '</select>' +

    '<label>開催日</label>' +
    '<input id="eventDate" type="date">' +

    '<label>メール件名</label>' +
    '<input id="subject" placeholder="例：法令改正研修会のご案内">' +

    '<label>メール本文</label>' +
    '<textarea id="body" placeholder="ここに案内文を入力します。"></textarea>' +

    '<label>PDFファイルID</label>' +
    '<input id="pdfFileId" placeholder="Google DriveのPDFファイルID。空欄でも可。">' +
    '<div class="note">※後でPDF添付送信に使います。最初は空欄でも大丈夫です。</div>' +

    '<label>有効</label>' +
    '<select id="active">' +
    '<option value="TRUE">TRUE</option>' +
    '<option value="FALSE">FALSE</option>' +
    '</select>' +

    '<button onclick="saveTraining()">保存する</button>' +
    '<div id="result" class="result"></div>' +
    '</div>' +

    '<script>' +
    'function saveTraining(){' +
    '  const data={' +
    '    eventId:document.getElementById("eventId").value.trim(),' +
    '    title:document.getElementById("title").value.trim(),' +
    '    hostType:document.getElementById("hostType").value,' +
    '    receptionType:document.getElementById("receptionType").value,' +
    '    eventDate:document.getElementById("eventDate").value,' +
    '    subject:document.getElementById("subject").value.trim(),' +
    '    body:document.getElementById("body").value,' +
    '    pdfFileId:document.getElementById("pdfFileId").value.trim(),' +
    '    active:document.getElementById("active").value' +
    '  };' +
    '  if(!data.eventId || !data.title || !data.subject){' +
    '    alert("研修ID、研修名、メール件名は必須です。");return;' +
    '  }' +
    '  document.getElementById("result").innerHTML="保存中...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(res){' +
    '      if(res.ok){document.getElementById("result").innerHTML="<div class=\\"ok\\">"+res.message+"</div>";}' +
    '      else{document.getElementById("result").innerHTML="<div class=\\"ng\\">"+res.message+"</div>";}' +
    '    })' +
    '    .withFailureHandler(function(err){' +
    '      document.getElementById("result").innerHTML="<div class=\\"ng\\">エラー："+err.message+"</div>";' +
    '    })' +
    '    .saveTraining(data);' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("研修会作成");
}


function saveTraining(data) {

  data =
    normalizeTrainingTargetDefaults_(
      data || {}
    );

  data.checkinTargetMode =
    normalizeCheckinTargetMode_(
      data.checkinTargetMode
    );

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("研修会");

  const headers = [
    "研修ID",
    "研修名",
    "イベント種別",
    "主催区分",
    "受付方式",
    "受付単位",
    "受付対象方式",
    "開催日",
    "対象ブロック",
    "対象支部",
    "対象地区",
    "対象組織ID",
    "集計表示組織区分",
    "集計表示組織ID",
    "差出人組織ID",
    "メール署名ID",
    "修了証発行",
    "出欠回答",
    "出欠状況公開",
    "位置情報受付",
    "位置情報受付開始",
    "位置情報受付終了",
    "件名",
    "本文",
    "PDFファイルID",
    "有効",
    "会場ID",
    "開始時刻",
    "終了時刻",
    "講師名",
    "講師所属",
    "講師連絡先",
    "会場費",
    "会場費メモ",
    "講師費",
    "資料印刷費",
    "飲み物代",
    "その他費用",
    "費用備考",
    "実施メモ",
    "作成日時",
    "更新日時"
  ];

  if (!sheet) {
    sheet =
      ss.insertSheet("研修会");

    sheet.appendRow(headers);
  }

  const values =
    sheet.getDataRange().getValues();

  const currentHeaders =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  headers.forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      currentHeaders.push(header);
    }
  });

  const allValues =
    sheet.getDataRange().getValues();

  const finalHeaders =
    allValues[0].map(function(h) {
      return String(h || "").trim();
    });

  const col = {};

  finalHeaders.forEach(function(header, index) {
    col[header] =
      index + 1;
  });

  const now =
    new Date();

  const eventId =
    String(data.eventId || "").trim();

  if (!eventId) {
    return {
      ok: false,
      message: "研修IDがありません。"
    };
  }

  for (let i = 1; i < allValues.length; i++) {

    const rowEventId =
      String(allValues[i][col["研修ID"] - 1] || "").trim();

    if (rowEventId === eventId) {

      const rowValues =
        allValues[i].slice();

      function setValue(header, value) {
        if (col[header]) {
          rowValues[col[header] - 1] =
            value;
        }
      }

      setValue("研修名", data.title || "");
      setValue("イベント種別", data.eventType || "研修会");
      setValue("主催区分", data.hostType || "");
      setValue("受付方式", data.receptionType || "");
      setOptionalTrainingValue_(
        data,
        setValue,
        "attendanceUnit",
        "受付単位"
      );
      setOptionalTrainingValue_(
        data,
        setValue,
        "checkinTargetMode",
        "受付対象方式"
      );
      setValue("開催日", data.eventDate || "");
      setValue("件名", data.subject || "");
      setValue("本文", data.body || "");
      setValue("PDFファイルID", data.pdfFileId || "");
      setValue("有効", data.active === "FALSE" ? "FALSE" : "TRUE");
      setValue("更新日時", now);
      setValue("対象ブロック", data.targetBlock || "");
      setValue("対象支部", data.targetBranch || "");
      setValue("対象地区", data.targetDistrict || "");
      setValue("対象組織ID", data.targetOrgIdsNew || "");
      setOptionalTrainingValue_(
        data,
        setValue,
        "statsOrgMode",
        "集計表示組織区分"
      );
      setOptionalTrainingValue_(
        data,
        setValue,
        "statsOrgIds",
        "集計表示組織ID"
      );
      setValue("差出人組織ID", data.senderOrgId || "");
      setOptionalTrainingValue_(
        data,
        setValue,
        "mailSignatureId",
        "メール署名ID"
      );
      setValue("修了証発行", data.certificateEnabled === "FALSE" ? "FALSE" : "TRUE");
      setOptionalTrainingValue_(
        data,
        setValue,
        "attendanceConfirmEnabled",
        "出欠回答"
      );
      setOptionalTrainingValue_(
        data,
        setValue,
        "attendanceStatusPublic",
        "出欠状況公開"
      );
      setOptionalTrainingValue_(
        data,
        setValue,
        "locationCheckEnabled",
        "位置情報受付"
      );
      setOptionalTrainingValue_(data, setValue, "locationCheckinStart", "位置情報受付開始");
      setOptionalTrainingValue_(data, setValue, "locationCheckinEnd", "位置情報受付終了");

      setOptionalTrainingValue_(
        data,
        setValue,
        "venueId",
        "会場ID"
      );

      setOptionalTrainingValue_(data, setValue, "startTime", "開始時刻");
      setOptionalTrainingValue_(data, setValue, "endTime", "終了時刻");
      setOptionalTrainingValue_(data, setValue, "lecturerName", "講師名");
      setOptionalTrainingValue_(data, setValue, "lecturerOrg", "講師所属");
      setOptionalTrainingValue_(data, setValue, "lecturerContact", "講師連絡先");
      setOptionalTrainingValue_(data, setValue, "venueCost", "会場費");
      setOptionalTrainingValue_(data, setValue, "venueFeeMemo", "会場費メモ");
      setOptionalTrainingValue_(data, setValue, "lecturerCost", "講師費");
      setOptionalTrainingValue_(data, setValue, "printCost", "資料印刷費");
      setOptionalTrainingValue_(data, setValue, "drinkCost", "飲み物代");
      setOptionalTrainingValue_(data, setValue, "otherCost", "その他費用");
      setOptionalTrainingValue_(data, setValue, "costNote", "費用備考");
      setOptionalTrainingValue_(data, setValue, "eventMemo", "実施メモ");

      sheet
        .getRange(
          i + 1,
          1,
          1,
          rowValues.length
        )
        .setValues([
          rowValues
        ]);

      return {
        ok: true,
        message: "研修会を更新しました。受付対象を反映する場合は、研修会詳細の「受付索引を更新」を押してください。"
      };
    }
  }

  const newRow =
    new Array(finalHeaders.length).fill("");

  newRow[col["研修ID"] - 1] = eventId;
  newRow[col["研修名"] - 1] = data.title || "";
  newRow[col["イベント種別"] - 1] = data.eventType || "研修会";
  newRow[col["主催区分"] - 1] = data.hostType || "";
  newRow[col["受付方式"] - 1] = data.receptionType || "";
  newRow[col["受付単位"] - 1] = data.attendanceUnit || "会社";
  newRow[col["受付対象方式"] - 1] = data.checkinTargetMode || "通常対象";
  newRow[col["開催日"] - 1] = data.eventDate || "";
  newRow[col["件名"] - 1] = data.subject || "";
  newRow[col["本文"] - 1] = data.body || "";
  newRow[col["PDFファイルID"] - 1] = data.pdfFileId || "";
  newRow[col["有効"] - 1] = data.active === "FALSE" ? "FALSE" : "TRUE";
  newRow[col["作成日時"] - 1] = now;
  newRow[col["更新日時"] - 1] = now;
  newRow[col["対象ブロック"] - 1] = data.targetBlock || "";
  newRow[col["対象支部"] - 1] = data.targetBranch || "";
  newRow[col["対象地区"] - 1] = data.targetDistrict || "";
  newRow[col["対象組織ID"] - 1] = data.targetOrgIdsNew || "";
  newRow[col["集計表示組織区分"] - 1] = data.statsOrgMode || "none";
  newRow[col["集計表示組織ID"] - 1] = data.statsOrgIds || "";
  newRow[col["差出人組織ID"] - 1] = data.senderOrgId || "";
  newRow[col["メール署名ID"] - 1] = data.mailSignatureId || "";
  newRow[col["修了証発行"] - 1] = data.certificateEnabled === "FALSE" ? "FALSE" : "TRUE";
  newRow[col["出欠回答"] - 1] = data.attendanceConfirmEnabled === "TRUE" ? "TRUE" : "FALSE";
  newRow[col["出欠状況公開"] - 1] = data.attendanceStatusPublic === "TRUE" ? "TRUE" : "FALSE";
  newRow[col["位置情報受付"] - 1] = data.locationCheckEnabled === "TRUE" ? "TRUE" : "FALSE";
  newRow[col["位置情報受付開始"] - 1] = data.locationCheckinStart || "";
  newRow[col["位置情報受付終了"] - 1] = data.locationCheckinEnd || "";
  newRow[col["会場ID"] - 1] = data.venueId || "";

  newRow[col["開始時刻"] - 1] = data.startTime || "";
  newRow[col["終了時刻"] - 1] = data.endTime || "";
  newRow[col["講師名"] - 1] = data.lecturerName || "";
  newRow[col["講師所属"] - 1] = data.lecturerOrg || "";
  newRow[col["講師連絡先"] - 1] = data.lecturerContact || "";
  newRow[col["会場費"] - 1] = data.venueCost || "";
  newRow[col["会場費メモ"] - 1] = data.venueFeeMemo || "";
  newRow[col["講師費"] - 1] = data.lecturerCost || "";
  newRow[col["資料印刷費"] - 1] = data.printCost || "";
  newRow[col["飲み物代"] - 1] = data.drinkCost || "";
  newRow[col["その他費用"] - 1] = data.otherCost || "";
  newRow[col["費用備考"] - 1] = data.costNote || "";
  newRow[col["実施メモ"] - 1] = data.eventMemo || "";

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      newRow.length
    )
    .setValues([
      newRow
    ]);

  return {
    ok: true,
    message: "研修会を登録しました。受付対象を反映する場合は、研修会詳細の「受付索引を更新」を押してください。"
  };
}

function normalizeTrainingTargetDefaults_(
  data
) {

  const hostType =
    String(data.hostType || "").trim();

  const hasExplicitTarget =
    String(data.targetBlock || "").trim() ||
    String(data.targetBranch || "").trim() ||
    String(data.targetDistrict || "").trim() ||
    String(data.targetOrgIdsNew || "").trim();

  if (hasExplicitTarget) {
    return data;
  }

  if (hostType === "第十ブロック") {
    data.targetBlock =
      "第十ブロック";
    return data;
  }

  if (
    hostType === "杉並支部" ||
    hostType === "中野支部" ||
    hostType === "世田谷支部"
  ) {
    data.targetBlock =
      "第十ブロック";

    data.targetBranch =
      hostType;
  }

  return data;
}

function normalizeCheckinTargetMode_(
  value
) {

  const text =
    String(value || "").trim();

  if (
    text === "事前申込者のみ" ||
    text === "事前申込" ||
    text === "事前申込者" ||
    text === "事前受付" ||
    text === "planned" ||
    text === "plannedOnly"
  ) {
    return "事前申込者のみ";
  }

  return "通常対象";
}

function buildCheckinIndexAfterTrainingSave_(
  eventId,
  result
) {

  try {

    const indexResult =
      buildCheckinIndexForEvent_(
        eventId
      );

    result.message =
      result.message +
      " 受付索引も更新しました。";

    result.checkinIndexUpdated =
      true;

    result.checkinIndexTargetCount =
      indexResult.targetCount || 0;

    result.checkinIndexMessage =
      indexResult.message || "";

  } catch (err) {

    result.message =
      result.message +
      " ただし、受付索引は自動更新できませんでした。研修会詳細の「受付索引を更新」を押してください。";

    result.checkinIndexUpdated =
      false;

    result.checkinIndexWarning =
      err.message;
  }

  return result;
}

function setOptionalTrainingValue_(
  data,
  setValue,
  dataKey,
  headerName
) {

  if (!Object.prototype.hasOwnProperty.call(data, dataKey)) {
    return;
  }

  setValue(
    headerName,
    data[dataKey] || ""
  );
}

function findTrainingById_(eventId) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  if (!sheet) {
    throw new Error("研修会シートがありません");
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return null;
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
    checkinTargetMode: headers.indexOf("受付対象方式"),
    eventDate: headers.indexOf("開催日"),
    subject: headers.indexOf("件名"),
    body: headers.indexOf("本文"),
    pdfFileId: headers.indexOf("PDFファイルID"),
    active: headers.indexOf("有効"),
    createdAt: headers.indexOf("作成日時"),
    updatedAt: headers.indexOf("更新日時"),
    targetOrgIds: headers.indexOf("送信対象組織ID"),
    targetBlock: headers.indexOf("対象ブロック"),
    targetBranch: headers.indexOf("対象支部"),
    targetDistrict: headers.indexOf("対象地区"),
    targetOrgIdsNew: headers.indexOf("対象組織ID"),
    statsOrgMode: headers.indexOf("集計表示組織区分"),
    statsOrgIds: headers.indexOf("集計表示組織ID"),
    senderOrgId: headers.indexOf("差出人組織ID"),
    mailSignatureId: headers.indexOf("メール署名ID"),
    certificateEnabled: headers.indexOf("修了証発行"),
    attendanceConfirmEnabled: headers.indexOf("出欠回答"),
    attendanceStatusPublic: headers.indexOf("出欠状況公開"),
    locationCheckEnabled: headers.indexOf("位置情報受付"),
    locationCheckinStart: headers.indexOf("位置情報受付開始"),
    locationCheckinEnd: headers.indexOf("位置情報受付終了"),
    venueId: headers.indexOf("会場ID"),
    venueName: headers.indexOf("会場名"),
    venueAddress: headers.indexOf("会場住所"),
    venueContactName: headers.indexOf("会場担当者"),
    venueContactPhone: headers.indexOf("会場連絡先"),
    venueContactMail: headers.indexOf("会場メール"),
    venueUrl: headers.indexOf("会場URL"),
    venueCapacity: headers.indexOf("会場定員"),
    startTime: headers.indexOf("開始時刻"),
    endTime: headers.indexOf("終了時刻"),
    lecturerName: headers.indexOf("講師名"),
    lecturerOrg: headers.indexOf("講師所属"),
    lecturerContact: headers.indexOf("講師連絡先"),
    venueCost: headers.indexOf("会場費"),
    venueFeeMemo: headers.indexOf("会場費メモ"),
    lecturerCost: headers.indexOf("講師費"),
    printCost: headers.indexOf("資料印刷費"),
    drinkCost: headers.indexOf("飲み物代"),
    otherCost: headers.indexOf("その他費用"),
    costNote: headers.indexOf("費用備考"),
    eventMemo: headers.indexOf("実施メモ")
  };

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(values[i][col.eventId] || "").trim();

    if (rowEventId !== String(eventId).trim()) {
      continue;
    }

    const pdfFileId =
      col.pdfFileId >= 0
        ? String(values[i][col.pdfFileId] || "").trim()
        : "";

    const pdfFiles =
      [];

    let pdfFileName =
      "";

    let pdfFileUrl =
      "";

    if (pdfFileId) {

      const pdfFileIds =
        String(pdfFileId || "")
          .split(",")
          .map(function(fileId) {
            return String(fileId || "").trim();
          })
          .filter(function(fileId) {
            return fileId !== "";
          });

      pdfFileIds.forEach(function(fileId) {

        try {

          const pdfFile =
            DriveApp.getFileById(fileId);

          pdfFiles.push({
            id: fileId,
            name: pdfFile.getName(),
            url: pdfFile.getUrl()
          });

        } catch (err) {

          pdfFiles.push({
            id: fileId,
            name: "添付ファイルを確認できません",
            url: ""
          });
        }
      });

      pdfFileName =
        pdfFiles.map(function(file) {
          return file.name;
        }).join(" / ");

      pdfFileUrl =
        pdfFiles.length === 1
          ? pdfFiles[0].url
          : "";
    }

    const venueId =
      col.venueId >= 0
        ? String(values[i][col.venueId] || "").trim()
        : "";

    const masterVenue =
      getVenueMasterById_(venueId) || {};

    return {
      eventId: rowEventId,
      title: col.title >= 0 ? values[i][col.title] : "",
      eventType: col.eventType >= 0
        ? String(values[i][col.eventType] || "研修会").trim() || "研修会"
        : "研修会",
      hostType: col.hostType >= 0 ? values[i][col.hostType] : "",
      receptionType: col.receptionType >= 0 ? values[i][col.receptionType] : "",
      attendanceUnit: col.attendanceUnit >= 0
        ? String(values[i][col.attendanceUnit] || "会社").trim() || "会社"
        : "会社",
      checkinTargetMode: col.checkinTargetMode >= 0
        ? String(values[i][col.checkinTargetMode] || "通常対象").trim() || "通常対象"
        : "通常対象",
      eventDate: col.eventDate >= 0 ? formatDateForClient_(values[i][col.eventDate]) : "",
      subject: col.subject >= 0 ? values[i][col.subject] : "",
      body: col.body >= 0 ? values[i][col.body] : "",
      pdfFileId: pdfFileId,
      pdfFileName: pdfFileName,
      pdfFileUrl: pdfFileUrl,
      pdfFiles: pdfFiles,
      active: col.active >= 0 ? values[i][col.active] : "TRUE",

      targetOrgIds: col.targetOrgIds >= 0
        ? String(values[i][col.targetOrgIds] || "").trim()
        : "",

      targetBlock: col.targetBlock >= 0
        ? String(values[i][col.targetBlock] || "").trim()
        : "",

      targetBranch: col.targetBranch >= 0
        ? String(values[i][col.targetBranch] || "").trim()
        : "",

      targetDistrict: col.targetDistrict >= 0
        ? String(values[i][col.targetDistrict] || "").trim()
        : "",

      targetOrgIdsNew: col.targetOrgIdsNew >= 0
        ? String(values[i][col.targetOrgIdsNew] || "").trim()
        : "",

      targetOrgNames: getOrganizationNamesText_(
        col.targetOrgIdsNew >= 0
          ? String(values[i][col.targetOrgIdsNew] || "").trim()
          : ""
      ),

      statsOrgIds: col.statsOrgIds >= 0
        ? String(values[i][col.statsOrgIds] || "").trim()
        : "",

      statsOrgMode: col.statsOrgMode >= 0
        ? String(values[i][col.statsOrgMode] || "none").trim() || "none"
        : (
            col.statsOrgIds >= 0 &&
            String(values[i][col.statsOrgIds] || "").trim()
              ? "custom"
              : "none"
          ),

      statsOrgNames: getOrganizationNamesText_(
        col.statsOrgIds >= 0
          ? String(values[i][col.statsOrgIds] || "").trim()
          : ""
      ),

      senderOrgId: col.senderOrgId >= 0
        ? String(values[i][col.senderOrgId] || "").trim()
        : "",

      mailSignatureId: col.mailSignatureId >= 0
        ? String(values[i][col.mailSignatureId] || "").trim()
        : "",

      certificateEnabled:
        (
          col.eventType >= 0
            ? String(values[i][col.eventType] || "研修会").trim() || "研修会"
            : "研修会"
        ) === "研修会" &&
        (
          col.certificateEnabled >= 0
            ? String(values[i][col.certificateEnabled] || "").toUpperCase() !== "FALSE"
            : true
        ),

      attendanceConfirmEnabled: col.attendanceConfirmEnabled >= 0
        ? String(values[i][col.attendanceConfirmEnabled] || "").toUpperCase() === "TRUE"
        : false,

      attendanceStatusPublic: col.attendanceStatusPublic >= 0
        ? String(values[i][col.attendanceStatusPublic] || "").toUpperCase() === "TRUE"
        : false,

      locationCheckEnabled: col.locationCheckEnabled >= 0
        ? String(values[i][col.locationCheckEnabled] || "").toUpperCase() === "TRUE"
        : false,

      locationCheckinStart: col.locationCheckinStart >= 0
        ? formatDateTimeForClient_(values[i][col.locationCheckinStart])
        : "",

      locationCheckinEnd: col.locationCheckinEnd >= 0
        ? formatDateTimeForClient_(values[i][col.locationCheckinEnd])
        : "",

      venueId: venueId,
      venueName: masterVenue.venueName || (col.venueName >= 0 ? values[i][col.venueName] : ""),
      venueAddress: masterVenue.venueAddress || (col.venueAddress >= 0 ? values[i][col.venueAddress] : ""),
      venueContactName: masterVenue.venueContactName || (col.venueContactName >= 0 ? values[i][col.venueContactName] : ""),
      venueContactPhone: masterVenue.venueContactPhone || (col.venueContactPhone >= 0 ? values[i][col.venueContactPhone] : ""),
      venueContactMail: masterVenue.venueContactMail || (col.venueContactMail >= 0 ? values[i][col.venueContactMail] : ""),
      venueUrl: masterVenue.venueUrl || (col.venueUrl >= 0 ? values[i][col.venueUrl] : ""),
      venueCapacity: masterVenue.venueCapacity || (col.venueCapacity >= 0 ? values[i][col.venueCapacity] : ""),
      startTime: col.startTime >= 0 ? values[i][col.startTime] : "",
      endTime: col.endTime >= 0 ? values[i][col.endTime] : "",
      lecturerName: col.lecturerName >= 0 ? values[i][col.lecturerName] : "",
      lecturerOrg: col.lecturerOrg >= 0 ? values[i][col.lecturerOrg] : "",
      lecturerContact: col.lecturerContact >= 0 ? values[i][col.lecturerContact] : "",
      venueCost: col.venueCost >= 0 ? values[i][col.venueCost] : "",
      venueFeeMemo: col.venueFeeMemo >= 0 ? values[i][col.venueFeeMemo] : "",
      lecturerCost: col.lecturerCost >= 0 ? values[i][col.lecturerCost] : "",
      printCost: col.printCost >= 0 ? values[i][col.printCost] : "",
      drinkCost: col.drinkCost >= 0 ? values[i][col.drinkCost] : "",
      otherCost: col.otherCost >= 0 ? values[i][col.otherCost] : "",
      costNote: col.costNote >= 0 ? values[i][col.costNote] : "",
      eventMemo: col.eventMemo >= 0 ? values[i][col.eventMemo] : ""
    };
  }

  return null;
}

function formatDateForClient_(value) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy/MM/dd"
    );
  }

  return String(value);
}

function getActiveTrainingsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const list =
    getActiveTrainings();

  const text =
    callback + "(" + JSON.stringify({
      ok: true,
      trainings: list
    }) + ")";

  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getTrainingDetailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const eventId =
    e.parameter.event || "";

  const training =
    findTrainingById_(eventId);

  if (!training) {

    const result = {
      ok: false,
      message: "研修会が見つかりません。"
    };

    return ContentService
      .createTextOutput(
        callback + "(" + JSON.stringify(result) + ")"
      )
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

    const withCounts =
      String(e.parameter.withCounts || "").toUpperCase() === "TRUE";

    let attendanceItemCount =
      0;

    try {

      attendanceItemCount =
        typeof getAttendanceItems_ === "function"
          ? getAttendanceItems_(eventId, false).length
          : 0;

    } catch (attendanceErr) {

      attendanceItemCount =
        0;
    }

    const result = {
      ok: true,
      training: training,
      attendanceItemCount: attendanceItemCount
    };

    if (withCounts) {

      const mailMembers =
        getTargetMembers_(
          training
        );

      const trainingMembers =
        getTrainingTargetMembers_(
          training
        );

      result.targetCount =
        trainingMembers.length;

      result.mailTargetCount =
        mailMembers.length;
    }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function saveTrainingJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const data = {
    eventId: e.parameter.eventId || "",
    title: e.parameter.title || "",
    eventType: e.parameter.eventType || "研修会",
    hostType: e.parameter.hostType || "",
    receptionType: e.parameter.receptionType || "",
    attendanceUnit: e.parameter.attendanceUnit || "会社",
    eventDate: e.parameter.eventDate || "",
    subject: e.parameter.subject || "",
    body:
      e.parameter.bodyToken
        ? getLongTextByToken_(e.parameter.bodyToken)
        : e.parameter.body || "",
    pdfFileId: e.parameter.pdfFileId || "",
    active: e.parameter.active || "TRUE",

    targetBlock:
      e.parameter.targetBlock || "",

    targetBranch:
      e.parameter.targetBranch || "",

    targetDistrict:
      e.parameter.targetDistrict || "",

    targetOrgIdsNew:
      e.parameter.targetOrgIdsNew || "",

    senderOrgId:
      e.parameter.senderOrgId || "",

    certificateEnabled:
      e.parameter.certificateEnabled || "TRUE",
  };

  if (String(data.eventType || "研修会").trim() !== "研修会") {
    data.certificateEnabled =
      "FALSE";
  }

  copyOptionalTrainingParam_(e.parameter, data, "statsOrgMode");
  copyOptionalTrainingParam_(e.parameter, data, "statsOrgIds");
  copyOptionalTrainingParam_(e.parameter, data, "checkinTargetMode");
  copyOptionalTrainingParam_(e.parameter, data, "mailSignatureId");
  copyOptionalTrainingParam_(e.parameter, data, "attendanceConfirmEnabled");
  copyOptionalTrainingParam_(e.parameter, data, "attendanceStatusPublic");

  copyOptionalTrainingParam_(e.parameter, data, "locationCheckEnabled");
  copyOptionalTrainingParam_(e.parameter, data, "locationCheckinStart");
  copyOptionalTrainingParam_(e.parameter, data, "locationCheckinEnd");

  copyOptionalTrainingParam_(
    e.parameter,
    data,
    "venueId"
  );

  copyOptionalTrainingParam_(e.parameter, data, "venueName");
  copyOptionalTrainingParam_(e.parameter, data, "venueAddress");
  copyOptionalTrainingParam_(e.parameter, data, "venueContactName");
  copyOptionalTrainingParam_(e.parameter, data, "venueContactPhone");
  copyOptionalTrainingParam_(e.parameter, data, "venueContactMail");
  copyOptionalTrainingParam_(e.parameter, data, "venueUrl");
  copyOptionalTrainingParam_(e.parameter, data, "venueCapacity");
  copyOptionalTrainingParam_(e.parameter, data, "startTime");
  copyOptionalTrainingParam_(e.parameter, data, "endTime");
  copyOptionalTrainingParam_(e.parameter, data, "lecturerName");
  copyOptionalTrainingParam_(e.parameter, data, "lecturerOrg");
  copyOptionalTrainingParam_(e.parameter, data, "lecturerContact");
  copyOptionalTrainingParam_(e.parameter, data, "venueCost");
  copyOptionalTrainingParam_(e.parameter, data, "venueFeeMemo");
  copyOptionalTrainingParam_(e.parameter, data, "lecturerCost");
  copyOptionalTrainingParam_(e.parameter, data, "printCost");
  copyOptionalTrainingParam_(e.parameter, data, "drinkCost");
  copyOptionalTrainingParam_(e.parameter, data, "otherCost");
  copyOptionalTrainingParam_(e.parameter, data, "costNote");
  copyOptionalTrainingParam_(e.parameter, data, "eventMemo");

  let result;

  try {

    result =
      saveTraining(data);

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

function copyOptionalTrainingParam_(
  params,
  data,
  key
) {

  if (Object.prototype.hasOwnProperty.call(params, key)) {
    data[key] =
      params[key] || "";
  }
}

function getNextTrainingIdJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getNextTrainingId_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getNextTrainingId_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("研修会");

  const year =
    getTrainingFiscalYear_(
      new Date()
    );

  let maxNo =
    0;

  if (sheet) {

    const values =
      sheet.getDataRange().getValues();

    for (let i = 1; i < values.length; i++) {

      const eventId =
        String(values[i][0] || "").trim();

      const match =
        eventId.match(
          new RegExp("^" + year + "-(\\d+)$")
        );

      if (!match) {
        continue;
      }

      const no =
        Number(match[1]);

      if (!isNaN(no) && no > maxNo) {
        maxNo = no;
      }
    }
  }

  const nextNo =
    maxNo + 1;

  return {
    ok: true,
    eventId:
      year +
      "-" +
      String(nextNo).padStart(3, "0")
  };
}


function getTrainingFiscalYear_(date) {

  const year =
    Number(
      Utilities.formatDate(
        date,
        "Asia/Tokyo",
        "yyyy"
      )
    );

  const month =
    Number(
      Utilities.formatDate(
        date,
        "Asia/Tokyo",
        "M"
      )
    );

  return String(
    month <= 3
      ? year - 1
      : year
  );
}
