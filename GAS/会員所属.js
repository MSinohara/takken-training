function getMemberOrganizationsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const memberNo =
    String(e.parameter.member || "").replace(".0", "").trim();

  const result =
    getMemberOrganizations_(
      memberNo
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function saveMemberOrganizationsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const memberNo =
    String(e.parameter.member || "").replace(".0", "").trim();

  const orgIdsText =
    String(e.parameter.orgIds || "").trim();

  const orgIds =
    orgIdsText
      ? orgIdsText.split(",").map(function(id) {
          return String(id || "").trim();
        }).filter(function(id) {
          return id !== "";
        })
      : [];

  const result =
    saveMemberOrganizations_(
      memberNo,
      orgIds
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getOrganizationMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const orgId =
    String(e.parameter.orgId || "").trim();

  let result;

  try {

    result =
      getOrganizationMembers_(
        orgId
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


function getOrganizationMembers_(
  orgId
) {

  if (!orgId) {
    return {
      ok: false,
      message: "組織IDが指定されていません。"
    };
  }

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員所属");

  if (!sheet) {
    return {
      ok: true,
      orgId: orgId,
      members: []
    };
  }

  const memberMap = {};

  getMemberRowsFromMaster_().forEach(function(member) {

    if (member.memberNo) {
      memberMap[member.memberNo] =
        member;
    }
  });

  const personalMembers =
    getPersonalMembers_(
      {}
    ).members || [];

  const personalMembersByMemberNo =
    {};

  personalMembers.forEach(function(personalMember) {

    const memberNo =
      String(personalMember.memberNo || "").replace(".0", "").trim();

    if (!memberNo) {
      return;
    }

    if (!personalMembersByMemberNo[memberNo]) {
      personalMembersByMemberNo[memberNo] =
        [];
    }

    personalMembersByMemberNo[memberNo].push(
      personalMember
    );
  });

  const personalOrgMap =
    getPersonalOrganizationMap_();

  const values =
    sheet.getDataRange().getValues();

  const members = [];

  for (let i = 1; i < values.length; i++) {

    const rowMemberNo =
      String(values[i][0] || "").replace(".0", "").trim();

    const rowOrgId =
      String(values[i][1] || "").trim();

    if (rowOrgId !== orgId || !rowMemberNo) {
      continue;
    }

    const member =
      memberMap[rowMemberNo] || {};

    const representativePersonalId =
      rowMemberNo + "-001";

    const personalList =
      (personalMembersByMemberNo[rowMemberNo] || [])
        .filter(function(personalMember) {

          if (String(personalMember.active || "TRUE").toUpperCase() === "FALSE") {
            return false;
          }

          if (personalMember.personalId === representativePersonalId) {
            return true;
          }

          return !!(
            personalOrgMap[personalMember.personalId] &&
            personalOrgMap[personalMember.personalId][orgId]
          );
        });

    if (personalList.length === 0) {
      members.push({
        memberNo: rowMemberNo,
        companyName: member.companyName || "",
        personalId: "",
        personName: "",
        personType: "",
        block: member.block || "",
        branch: member.branch || "",
        district: member.district || "",
        mail: member.mail || "",
        registeredAt: formatDateTimeForClient_(values[i][2])
      });
      continue;
    }

    personalList.forEach(function(personalMember) {

      members.push({
        memberNo: rowMemberNo,
        companyName: member.companyName || personalMember.companyName || "",
        personalId: personalMember.personalId || "",
        personName: personalMember.personName || "",
        personType: personalMember.personType || "",
        block: member.block || "",
        branch: member.branch || "",
        district: member.district || "",
        mail: personalMember.mail || member.mail || "",
        registeredAt: formatDateTimeForClient_(values[i][2])
      });
    });
  }

  members.sort(function(a, b) {
    const companyCompare =
      String(a.companyName || "").localeCompare(String(b.companyName || ""), "ja");

    if (companyCompare !== 0) {
      return companyCompare;
    }

    return String(a.personalId || "").localeCompare(String(b.personalId || ""), "ja");
  });

  return {
    ok: true,
    orgId: orgId,
    members: members
  };
}


function getMemberOrganizations_(
  memberNo
) {

  if (!memberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
    };
  }

  const ss =
    getSpreadsheet_();

  const orgSheet =
    ss.getSheetByName("組織マスタ");

  const memberOrgSheet =
    ss.getSheetByName("会員所属");

  if (!orgSheet) {
    return {
      ok: false,
      message: "組織マスタシートがありません。"
    };
  }

  if (!memberOrgSheet) {
    return {
      ok: false,
      message: "会員所属シートがありません。"
    };
  }

  const orgValues =
    orgSheet.getDataRange().getValues();

  const memberOrgValues =
    memberOrgSheet.getDataRange().getValues();

  const selectedMap = {};

  for (let i = 1; i < memberOrgValues.length; i++) {

    const rowMemberNo =
      String(memberOrgValues[i][0] || "").replace(".0", "").trim();

    const orgId =
      String(memberOrgValues[i][1] || "").trim();

    if (rowMemberNo === memberNo && orgId) {
      selectedMap[orgId] = true;
    }
  }

  const organizations = [];

  for (let i = 1; i < orgValues.length; i++) {

    const orgId =
      String(orgValues[i][0] || "").trim();

    const orgName =
      String(orgValues[i][1] || "").trim();

    const senderName =
      String(orgValues[i][2] || "").trim();

    const active =
      String(orgValues[i][3] || "").toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE";

    if (!orgId || !orgName) {
      continue;
    }

    organizations.push({
      orgId: orgId,
      orgName: orgName,
      senderName: senderName,
      active: active,
      selected: !!selectedMap[orgId]
    });
  }

  return {
    ok: true,
    memberNo: memberNo,
    organizations: organizations
  };
}


function saveMemberOrganizations_(
  memberNo,
  orgIds
) {

  if (!memberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
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

  const values =
    sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 1; i--) {

    const rowMemberNo =
      String(values[i][0] || "").replace(".0", "").trim();

    if (rowMemberNo === memberNo) {
      sheet.deleteRow(i + 1);
    }
  }

  const now =
    new Date();

  orgIds.forEach(function(orgId) {

    sheet.appendRow([
      memberNo,
      orgId,
      now
    ]);

  });

  let syncWarning =
    "";

  try {

    syncRepresentativePersonalOrganizations_(
      memberNo,
      orgIds
    );

  } catch (err) {

    syncWarning =
      "代表者001への個人所属同期に失敗しました: " + err.message;

    writeLog_(
      "PERSONAL_ORG_SYNC_ERROR",
      syncWarning,
      "memberNo=" + memberNo
    );
  }

  return {
    ok: true,
    message: syncWarning
      ? "会員所属を更新しました。ただし、" + syncWarning
      : "会員所属を更新しました。",
    count: orgIds.length
  };
}
