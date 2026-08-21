function replaceOrganizationMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const orgId =
    String(e.parameter.orgId || "").trim();

  const memberNosText =
    String(e.parameter.memberNos || "").trim();

  const memberNos =
    memberNosText
      ? memberNosText.split(",").map(function(v) {
          return String(v || "").replace(".0", "").trim();
        }).filter(function(v) {
          return v !== "";
        })
      : [];

  const result =
    replaceOrganizationMembers_(
      orgId,
      memberNos
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function replaceOrganizationMembers_(
  orgId,
  memberNos
) {

  if (!orgId) {
    return {
      ok: false,
      message: "対象組織が指定されていません。"
    };
  }

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("会員所属");

  if (!sheet) {
    sheet =
      ss.insertSheet("会員所属");

    sheet.appendRow([
      "業者番号",
      "組織ID",
      "登録日時"
    ]);
  }

  const validMemberMap =
    getValidMemberNoMap_();

  const uniqueMap = {};
  const unknownList = [];

  memberNos.forEach(function(memberNo) {

    if (!memberNo) {
      return;
    }

    if (!validMemberMap[memberNo]) {
      unknownList.push(memberNo);
      return;
    }

    uniqueMap[memberNo] =
      true;
  });

  const uniqueMemberNos =
    Object.keys(uniqueMap);

  const values =
    sheet.getDataRange().getValues();

  let deleted =
    0;

  for (let i = values.length - 1; i >= 1; i--) {

    const rowOrgId =
      String(values[i][1] || "").trim();

    if (rowOrgId === orgId) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }

  const now =
    new Date();

  if (uniqueMemberNos.length > 0) {

    const rows =
      uniqueMemberNos.map(function(memberNo) {
        return [
          memberNo,
          orgId,
          now
        ];
      });

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        3
      )
      .setValues(rows);
  }

  let syncWarning =
    "";

  try {

    syncOrganizationRepresentativesForOrg_(
      orgId,
      uniqueMemberNos
    );

  } catch (err) {

    syncWarning =
      "代表者001への個人所属同期に失敗しました: " + err.message;

    writeLog_(
      "PERSONAL_ORG_SYNC_ERROR",
      syncWarning,
      "orgId=" + orgId
    );
  }

  return {
    ok: true,
    message: syncWarning
      ? "所属組織を更新しました。ただし、" + syncWarning
      : "所属組織を更新しました。",
    deleted: deleted,
    imported: uniqueMemberNos.length,
    unknown: unknownList.length,
    unknownList: unknownList.slice(0, 20)
  };
}


function getValidMemberNoMap_() {

  const map = {};

  let members;

  try {

    members =
      getMemberRowsFromMaster_();

  } catch (err) {

    throw new Error(err.message);
  }

  members.forEach(function(member) {

    if (member.memberNo) {
      map[member.memberNo] =
        true;
    }
  });

  return map;
}
