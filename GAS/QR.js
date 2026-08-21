function showQrPage_(e) {

  const memberNo =
    e.parameter.member || "";

  if (!memberNo) {
    return HtmlService
      .createHtmlOutput("業者番号が指定されていません。");
  }

  const member =
    findMemberByNo_(memberNo);

  if (!member) {
    return HtmlService
      .createHtmlOutput("該当する会員が見つかりません。");
  }

  const qrText =
    "MEMBER:" + member.memberNo;

  const qrImageUrl =
    "https://quickchart.io/qr?size=520&text=" +
    encodeURIComponent(qrText);

  const html =
    '<!DOCTYPE html>' +
    '<html lang="ja">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>受付用QRコード</title>' +
    '<style>' +
    'body{margin:0;font-family:Arial,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;background:#eef2f6;color:#111;}' +
    'header{background:#12345a;color:#fff;padding:22px 24px;}' +
    'header h1{margin:0;font-size:24px;line-height:1.35;}' +
    'main{max-width:720px;margin:24px auto;padding:0 16px 32px;}' +
    '.card{background:#fff;border-radius:12px;padding:26px;box-shadow:0 2px 12px rgba(0,0,0,.10);}' +
    '.label{display:inline-block;background:#e8f1ff;color:#12345a;border-radius:999px;padding:5px 10px;font-size:13px;font-weight:bold;margin-bottom:16px;}' +
    '.company{font-size:28px;font-weight:bold;line-height:1.35;overflow-wrap:anywhere;margin-bottom:8px;}' +
    '.representative{font-size:17px;font-weight:bold;color:#333;line-height:1.5;margin-bottom:14px;}' +
    '.meta{background:#f7f9fc;border:1px solid #d7dce3;border-radius:8px;padding:14px;line-height:1.8;color:#333;margin:16px 0 20px;}' +
    '.qrBox{text-align:center;background:#f7f9fc;border:1px solid #d7dce3;border-radius:10px;padding:22px 14px;}' +
    'img{width:320px;height:320px;max-width:100%;}' +
    '.qrText{font-size:13px;color:#555;margin-top:10px;overflow-wrap:anywhere;}' +
    '.note{background:#fff8e8;border:1px solid #e0c98b;border-radius:8px;padding:14px;color:#333;margin-top:18px;line-height:1.8;font-size:15px;}' +
    '@media(max-width:640px){header{padding:20px;}main{margin:18px auto;padding:0 14px 28px;}.card{padding:22px 18px;}.company{font-size:25px;}img{width:280px;height:280px;}}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<header><h1>会社受付QR</h1></header>' +
    '<main>' +
    '<div class="card">' +
    '<div class="label">会社単位受付用QR</div>' +
    '<div class="company">' + escapeHtml_(member.companyName) + ' 様</div>' +
    (
      member.representativeName
        ? '<div class="representative">代表者名：' + escapeHtml_(member.representativeName) + '</div>'
        : ''
    ) +
    '<div class="meta">' +
    '業者番号：' + escapeHtml_(member.memberNo) + '<br>' +
    '支部：' + escapeHtml_(member.branch || "未設定") +
    '</div>' +
    '<div class="qrBox">' +
    '<img src="' + qrImageUrl + '" alt="受付用QRコード">' +
    '<div class="qrText">' + escapeHtml_(qrText) + '</div>' +
    '</div>' +
    '<div class="note">' +
    '当日はこの画面を受付でご提示ください。<br>' +
    'スマートフォンで表示できない場合は、受付に会社名または業者番号をお伝えください。' +
    '</div>' +
    '</div>' +
    '</main>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle("受付用QRコード");
}

function findMemberByNo_(memberNo) {

  const targetMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  if (!targetMemberNo) {
    return null;
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員マスタ");

  if (!sheet) {
    throw new Error("会員マスタシートがありません");
  }

  const headerMap =
    getHeaderMap_(sheet);

  const memberNoCol =
    headerMap["業者番号"];

  if (memberNoCol === undefined || memberNoCol < 0) {
    throw new Error("会員マスタに業者番号列がありません");
  }

  const finder =
    sheet
      .getRange(
        2,
        memberNoCol + 1,
        Math.max(sheet.getLastRow() - 1, 1),
        1
      )
      .createTextFinder(targetMemberNo)
      .matchEntireCell(true);

  const cell =
    finder.findNext();

  if (cell) {

    const row =
      sheet
        .getRange(
          cell.getRow(),
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    return {
      memberNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      representativeName: String(getCellByHeader_(row, headerMap, "代表者名") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      district: String(getCellByHeader_(row, headerMap, "地区") || "").trim()
    };
  }

  return findMemberByNoSlow_(targetMemberNo);
}


function findMemberByNoSlow_(targetMemberNo) {

  const members =
    getMemberRowsFromMaster_();

  for (let i = 0; i < members.length; i++) {

    if (members[i].memberNo === targetMemberNo) {
      return {
        memberNo: members[i].memberNo,
        companyName: members[i].companyName,
        representativeName: members[i].representativeName,
        mail: members[i].mail,
        block: members[i].block,
        branch: members[i].branch,
        district: members[i].district
      };
    }
  }

  return null;
}

function escapeHtml_(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getMemberJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const memberNo =
    e.parameter.member || "";

  const member =
    findMemberByNo_(memberNo);

  const result =
    member
      ? {
          ok: true,
          member: member
        }
      : {
          ok: false,
          message: "会員情報が見つかりません。"
        };

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function cleanupBackupSheets_(
  prefix,
  keepCount
) {

  const ss =
    getSpreadsheet_();

  const sheets =
    ss.getSheets();

  const backupSheets =
    sheets
      .filter(function(sheet) {
        return sheet.getName().indexOf(prefix) === 0;
      })
      .sort(function(a, b) {
        return a.getName() < b.getName() ? 1 : -1;
      });

  for (let i = keepCount; i < backupSheets.length; i++) {
    ss.deleteSheet(
      backupSheets[i]
    );
  }
}
