const PERSONAL_MEMBER_SHEET_NAME_ =
  "個人会員マスタ";

const PERSONAL_MEMBER_HEADERS_ =
  [
    "個人ID",
    "業者番号",
    "会社名",
    "氏名",
    "区分",
    "メール",
    "承認状態",
    "有効",
    "由来",
    "備考",
    "作成日時",
    "更新日時"
  ];

const PERSONAL_MEMBER_ORG_SHEET_NAME_ =
  "個人所属";

const PERSONAL_MEMBER_ORG_HEADERS_ =
  [
    "個人ID",
    "組織ID",
    "登録日時",
    "由来",
    "備考"
  ];

const PERSONAL_MEMBER_ORG_SOURCE_COMPANY_SYNC_ =
  "会社所属同期";

function getPersonalMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getPersonalMembers_(
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

function savePersonalMemberJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      savePersonalMember_(
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

function getPersonalOrganizationsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getPersonalOrganizations_(
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

function savePersonalOrganizationsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      savePersonalOrganizations_(
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

function addPersonalMembersToOrganizationJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      addPersonalMembersToOrganization_(
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

function getPersonalMembers_(
  params
) {

  const keyword =
    String(params.keyword || "").trim().toLowerCase();

  const memberNoFilter =
    normalizeMemberNo_(
      params.memberNo || ""
    );

  const branchFilter =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          params.branch || ""
        )
      : String(params.branch || "").trim();

  const districtFilter =
    String(params.district || "").trim();

  const mailStatusFilter =
    String(params.mailStatus || "").trim();

  const orgIdFilterList =
    splitPersonalOrganizationIds_(
      params.orgIds || params.orgId || ""
    );

  const manualMembers =
    getManualPersonalMembers_();

  const autoMembers =
    getAutoRepresentativePersonalMembers_(
      manualMembers.idMap
    );

  const list =
    autoMembers.concat(
      manualMembers.list
    );

  const memberMap =
    makePersonalMemberCompanyMap_();

  const personalOrgMap =
    orgIdFilterList.length
      ? getPersonalOrganizationMap_()
      : {};

  const memberOrgMap =
    orgIdFilterList.length
      ? makeMemberOrganizationIdMapForPersonalSearch_()
      : {};

  const filtered =
    list.filter(function(item) {

      if (
        memberNoFilter &&
        item.memberNo !== memberNoFilter
      ) {
        return false;
      }

      const master =
        memberMap[item.memberNo] || {};

      item.block =
        item.block || master.block || "";

      item.branch =
        item.branch || master.branch || "";

      item.district =
        item.district || master.district || "";

      item.companyName =
        item.companyName || master.companyName || "";

      item.mail =
        item.mail || master.mail || "";

      const itemMail =
        String(item.mail || "").trim();

      if (
        mailStatusFilter === "HAS_MAIL" &&
        !itemMail
      ) {
        return false;
      }

      if (
        mailStatusFilter === "NO_MAIL" &&
        itemMail
      ) {
        return false;
      }

      const itemBranchKey =
        typeof normalizeCheckinIndexBranchName_ === "function"
          ? normalizeCheckinIndexBranchName_(
              item.branch
            )
          : String(item.branch || "").trim();

      if (
        branchFilter &&
        itemBranchKey !== branchFilter
      ) {
        return false;
      }

      if (
        districtFilter &&
        String(item.district || "") !== districtFilter
      ) {
        return false;
      }

      if (
        orgIdFilterList.length &&
        !personalMatchesOrganizationForSearch_(
          item,
          orgIdFilterList,
          personalOrgMap,
          memberOrgMap
        )
      ) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [
        item.personalId,
        item.memberNo,
        item.companyName,
        item.personName,
        item.personType,
        item.mail,
        item.block,
        item.branch,
        item.district,
        item.approvalStatus,
        item.source,
        item.note
      ].join(" ").toLowerCase().indexOf(keyword) !== -1;
    });

  filtered.sort(function(a, b) {
    return String(a.personalId || "") < String(b.personalId || "")
      ? -1
      : 1;
  });

  return {
    ok: true,
    members: filtered,
    count: filtered.length
  };
}

function makePersonalMemberCompanyMap_() {

  const map = {};

  try {

    getMemberRowsFromMaster_().forEach(function(member) {
      const memberNo =
        normalizeMemberNo_(
          member.memberNo || ""
        );

      if (memberNo) {
        map[memberNo] =
          member;
      }
    });

  } catch (err) {
  }

  return map;
}

function makeMemberOrganizationIdMapForPersonalSearch_() {

  const map = {};

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
      normalizeMemberNo_(
        values[i][0]
      );

    const orgId =
      String(values[i][1] || "").trim();

    if (!memberNo || !orgId) {
      continue;
    }

    if (!map[memberNo]) {
      map[memberNo] =
        {};
    }

    map[memberNo][orgId] =
      true;
  }

  return map;
}

function personalMatchesOrganizationForSearch_(
  item,
  orgIds,
  personalOrgMap,
  memberOrgMap
) {

  const personalId =
    String(item && item.personalId || "").trim();

  const selectedMap =
    personalOrgMap[personalId] || {};

  for (let i = 0; i < orgIds.length; i++) {
    if (selectedMap[orgIds[i]]) {
      return true;
    }
  }

  if (isRepresentativePersonalId_(personalId)) {

    const memberNo =
      normalizeMemberNo_(
        item && item.memberNo
      );

    const companyOrgMap =
      memberOrgMap[memberNo] || {};

    for (let i = 0; i < orgIds.length; i++) {
      if (companyOrgMap[orgIds[i]]) {
        return true;
      }
    }
  }

  return false;
}

function getManualPersonalMembers_() {

  const sheet =
    getPersonalMemberSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const list = [];
  const idMap = {};

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const personalId =
      String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();

    if (!personalId) {
      continue;
    }

    idMap[personalId] =
      true;

    list.push({
      personalId: personalId,
      memberNo: normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号")),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      personName: String(getCellByHeader_(row, headerMap, "氏名") || "").trim(),
      personType: String(getCellByHeader_(row, headerMap, "区分") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      approvalStatus: String(getCellByHeader_(row, headerMap, "承認状態") || "承認済み").trim(),
      active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE" ? "FALSE" : "TRUE",
      source: String(getCellByHeader_(row, headerMap, "由来") || "").trim(),
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim(),
      createdAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "作成日時")),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時")),
      autoGenerated: false
    });
  }

  return {
    list: list,
    idMap: idMap
  };
}

function getAutoRepresentativePersonalMembers_(
  manualIdMap
) {

  const members =
    getMemberRowsFromMaster_();

  const list = [];

  members.forEach(function(member) {

    const memberNo =
      normalizeMemberNo_(
        member.memberNo
      );

    const representativeName =
      String(member.representativeName || "").trim();

    if (!memberNo || !representativeName) {
      return;
    }

    const personalId =
      memberNo + "-001";

    if (manualIdMap[personalId]) {
      return;
    }

    list.push({
      personalId: personalId,
      memberNo: memberNo,
      companyName: member.companyName || "",
      personName: representativeName,
      personType: "代表者",
      mail: member.mail || "",
      approvalStatus: "承認済み",
      active: "TRUE",
      source: "代表者自動生成",
      note: "",
      createdAt: "",
      updatedAt: "",
      autoGenerated: true
    });
  });

  return list;
}

function savePersonalMember_(
  params
) {

  const sheet =
    getPersonalMemberSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const now =
    new Date();

  const memberNo =
    normalizeMemberNo_(
      params.memberNo || ""
    );

  const personName =
    String(params.personName || "").trim();

  if (!memberNo || !personName) {
    throw new Error("業者番号と氏名を入力してください。");
  }

  const companyName =
    String(params.companyName || getCompanyNameByMemberNo_(memberNo) || "").trim();

  let personalId =
    String(params.personalId || "").trim();

  if (!personalId) {
    personalId =
      getNextPersonalMemberId_(
        memberNo
      );
  }

  const values =
    sheet.getDataRange().getValues();

  let rowNo =
    0;

  for (let i = 1; i < values.length; i++) {

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    if (rowPersonalId === personalId) {
      rowNo =
        i + 1;
      break;
    }
  }

  if (!rowNo) {
    rowNo =
      sheet.getLastRow() + 1;

    sheet
      .getRange(rowNo, headerMap["作成日時"] + 1)
      .setValue(now);
  }

  sheet.getRange(rowNo, headerMap["個人ID"] + 1).setValue(personalId);
  sheet.getRange(rowNo, headerMap["業者番号"] + 1).setValue(memberNo);
  sheet.getRange(rowNo, headerMap["会社名"] + 1).setValue(companyName);
  sheet.getRange(rowNo, headerMap["氏名"] + 1).setValue(personName);
  sheet.getRange(rowNo, headerMap["区分"] + 1).setValue(normalizePersonalMemberType_(params.personType));
  sheet.getRange(rowNo, headerMap["メール"] + 1).setValue(String(params.mail || "").trim());
  sheet.getRange(rowNo, headerMap["承認状態"] + 1).setValue("承認済み");
  sheet.getRange(rowNo, headerMap["有効"] + 1).setValue(String(params.active || "TRUE").toUpperCase() === "FALSE" ? "FALSE" : "TRUE");
  sheet.getRange(rowNo, headerMap["由来"] + 1).setValue(String(params.source || "手入力").trim());
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(String(params.note || "").trim());
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "個人会員を保存しました。",
    personalId: personalId
  };
}

function normalizePersonalMemberType_(
  value
) {

  const type =
    String(value || "社員").trim();

  if (type === "代表者" || type === "社員" || type === "その他") {
    return type;
  }

  return "社員";
}

function findPersonalMemberById_(
  personalId
) {

  const targetId =
    String(personalId || "").trim();

  if (!targetId) {
    return null;
  }

  const members =
    getPersonalMembers_(
      {}
    ).members || [];

  for (let i = 0; i < members.length; i++) {
    if (members[i].personalId === targetId) {
      return members[i];
    }
  }

  return null;
}

function getPersonalOrganizations_(
  params
) {

  const personalId =
    String(params.personalId || "").trim();

  if (!personalId) {
    return {
      ok: false,
      message: "個人IDが指定されていません。"
    };
  }

  const member =
    findPersonalMemberById_(
      personalId
    );

  if (!member) {
    return {
      ok: false,
      message: "個人会員が見つかりません。"
    };
  }

  if (isRepresentativePersonalId_(personalId)) {
    syncRepresentativePersonalOrganizations_(
      member.memberNo,
      getMemberOrganizationIds_(
        member.memberNo
      )
    );
  }

  const selectedMap =
    getPersonalOrganizationSelectedMap_(
      personalId
    );

  const organizations =
    getOrganizationRowsForPersonal_()
      .map(function(org) {
        org.selected =
          !!selectedMap[org.orgId];

        return org;
      });

  return {
    ok: true,
    personalId: personalId,
    memberNo: member.memberNo,
    companyName: member.companyName,
    personName: member.personName,
    isRepresentative: isRepresentativePersonalId_(personalId),
    organizations: organizations
  };
}

function savePersonalOrganizations_(
  params
) {

  const personalId =
    String(params.personalId || "").trim();

  if (!personalId) {
    return {
      ok: false,
      message: "個人IDが指定されていません。"
    };
  }

  const member =
    findPersonalMemberById_(
      personalId
    );

  if (!member) {
    return {
      ok: false,
      message: "個人会員が見つかりません。"
    };
  }

  const orgIds =
    uniqueTextValues_(
      String(params.orgIds || "")
        .split(",")
    );

  if (isRepresentativePersonalId_(personalId)) {
    return saveMemberOrganizations_(
      member.memberNo,
      orgIds
    );
  }

  const sheet =
    getPersonalMemberOrganizationSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = values.length - 1; i >= 1; i--) {

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    if (rowPersonalId === personalId) {
      sheet.deleteRow(i + 1);
    }
  }

  const now =
    new Date();

  const rows =
    orgIds.map(function(orgId) {
      return [
        personalId,
        orgId,
        now,
        "個人設定",
        ""
      ];
    });

  if (rows.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        PERSONAL_MEMBER_ORG_HEADERS_.length
      )
      .setValues(rows);
  }

  return {
    ok: true,
    message: "個人所属を更新しました。",
    count: orgIds.length
  };
}

function addPersonalMembersToOrganization_(
  params
) {

  const orgId =
    String(params.orgId || "").trim();

  if (!orgId) {
    throw new Error("組織IDが指定されていません。");
  }

  const personalIds =
    uniqueTextValues_(
      String(params.personalIds || "")
        .split(",")
    );

  if (personalIds.length === 0) {
    throw new Error("追加する個人を選択してください。");
  }

  const personalMap = {};

  getPersonalMembers_({}).members.forEach(function(person) {

    const personalId =
      String(person.personalId || "").trim();

    if (personalId) {
      personalMap[personalId] =
        person;
    }
  });

  const memberOrgSheet =
    getOrCreateMemberOrganizationSheetForPersonalAdd_();

  const personalOrgSheet =
    getPersonalMemberOrganizationSheet_();

  const memberOrgMap =
    makeExistingMemberOrganizationMap_(
      memberOrgSheet
    );

  const personalOrgMap =
    makeExistingPersonalOrganizationPairMap_(
      personalOrgSheet
    );

  const now =
    new Date();

  const memberOrgRows = [];
  const personalOrgRows = [];
  const unknownIds = [];

  personalIds.forEach(function(personalId) {

    const person =
      personalMap[personalId];

    if (!person) {
      unknownIds.push(personalId);
      return;
    }

    if (
      String(person.active || "TRUE").toUpperCase() === "FALSE"
    ) {
      return;
    }

    if (isRepresentativePersonalId_(personalId)) {

      const memberNo =
        normalizeMemberNo_(
          person.memberNo || personalId.replace(/-001$/, "")
        );

      const key =
        memberNo + "\t" + orgId;

      if (memberNo && !memberOrgMap[key]) {
        memberOrgRows.push([
          memberNo,
          orgId,
          now
        ]);
        memberOrgMap[key] =
          true;
      }

      return;
    }

    const personalKey =
      personalId + "\t" + orgId;

    if (!personalOrgMap[personalKey]) {
      personalOrgRows.push([
        personalId,
        orgId,
        now,
        "組織設定画面",
        ""
      ]);
      personalOrgMap[personalKey] =
        true;
    }
  });

  if (memberOrgRows.length > 0) {
    memberOrgSheet
      .getRange(
        memberOrgSheet.getLastRow() + 1,
        1,
        memberOrgRows.length,
        3
      )
      .setValues(memberOrgRows);
  }

  if (personalOrgRows.length > 0) {
    personalOrgSheet
      .getRange(
        personalOrgSheet.getLastRow() + 1,
        1,
        personalOrgRows.length,
        PERSONAL_MEMBER_ORG_HEADERS_.length
      )
      .setValues(personalOrgRows);
  }

  const addedCount =
    memberOrgRows.length + personalOrgRows.length;

  return {
    ok: true,
    message:
      "所属個人を追加しました。追加 " +
      addedCount +
      "件 / 選択 " +
      personalIds.length +
      "件",
    added: addedCount,
    selected: personalIds.length,
    unknown: unknownIds.length,
    unknownList: unknownIds.slice(0, 20)
  };
}

function getNextPersonalMemberId_(
  memberNo
) {

  const sheet =
    getPersonalMemberSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  let maxNo =
    1;

  const prefix =
    normalizeMemberNo_(memberNo) + "-";

  for (let i = 1; i < values.length; i++) {

    const personalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    if (personalId.indexOf(prefix) !== 0) {
      continue;
    }

    const match =
      personalId.match(/-(\d+)$/);

    if (match) {
      maxNo =
        Math.max(
          maxNo,
          Number(match[1])
        );
    }
  }

  return prefix +
    String(maxNo + 1).padStart(3, "0");
}

function getCompanyNameByMemberNo_(
  memberNo
) {

  const members =
    getMemberRowsFromMaster_();

  const target =
    normalizeMemberNo_(
      memberNo
    );

  for (let i = 0; i < members.length; i++) {
    if (members[i].memberNo === target) {
      return members[i].companyName || "";
    }
  }

  return "";
}

function getPersonalMemberSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      PERSONAL_MEMBER_SHEET_NAME_
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        PERSONAL_MEMBER_SHEET_NAME_
      );
  }

  ensureHeaders_(
    sheet,
    PERSONAL_MEMBER_HEADERS_
  );

  return sheet;
}

function syncRepresentativePersonalOrganizations_(
  memberNo,
  orgIds
) {

  const normalizedMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  if (!normalizedMemberNo) {
    return;
  }

  const personalId =
    normalizedMemberNo + "-001";

  const uniqueOrgIds =
    uniqueTextValues_(
      orgIds
    );

  const sheet =
    getPersonalMemberOrganizationSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const existingManualMap = {};

  for (let i = values.length - 1; i >= 1; i--) {

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    if (rowPersonalId !== personalId) {
      continue;
    }

    const rowOrgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

    const source =
      String(getCellByHeader_(values[i], headerMap, "由来") || "").trim();

    if (source === PERSONAL_MEMBER_ORG_SOURCE_COMPANY_SYNC_) {
      sheet.deleteRow(i + 1);
      continue;
    }

    if (rowOrgId) {
      existingManualMap[rowOrgId] =
        true;
    }
  }

  const now =
    new Date();

  const rows =
    uniqueOrgIds
      .filter(function(orgId) {
        return !existingManualMap[orgId];
      })
      .map(function(orgId) {
        return [
          personalId,
          orgId,
          now,
          PERSONAL_MEMBER_ORG_SOURCE_COMPANY_SYNC_,
          "会社の所属組織から自動同期"
        ];
      });

  if (rows.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        PERSONAL_MEMBER_ORG_HEADERS_.length
      )
      .setValues(rows);
  }
}

function getPersonalOrganizationSelectedMap_(
  personalId
) {

  const sheet =
    getPersonalMemberOrganizationSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const map = {};

  for (let i = 1; i < values.length; i++) {

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const orgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

    if (rowPersonalId === personalId && orgId) {
      map[orgId] =
        true;
    }
  }

  return map;
}

function getPersonalOrganizationMap_() {

  const sheet =
    getPersonalMemberOrganizationSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const map = {};

  for (let i = 1; i < values.length; i++) {

    const personalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const orgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

    if (!personalId || !orgId) {
      continue;
    }

    if (!map[personalId]) {
      map[personalId] =
        {};
    }

    map[personalId][orgId] =
      true;
  }

  return map;
}

function personalBelongsToAnyOrganization_(
  personalId,
  orgIds,
  personalOrgMap
) {

  const targetPersonalId =
    String(personalId || "").trim();

  const targetOrgIds =
    uniqueTextValues_(
      orgIds
    );

  if (targetOrgIds.length === 0) {
    return true;
  }

  const orgMap =
    personalOrgMap || getPersonalOrganizationMap_();

  const selectedMap =
    orgMap[targetPersonalId] || {};

  for (let i = 0; i < targetOrgIds.length; i++) {
    if (selectedMap[targetOrgIds[i]]) {
      return true;
    }
  }

  if (isRepresentativePersonalId_(targetPersonalId)) {

    const representativeMemberNo =
      normalizeMemberNo_(
        targetPersonalId.replace(/-001$/, "")
      );

    const memberOrgIds =
      getMemberOrganizationIds_(
        representativeMemberNo
      );

    const memberOrgMap = {};

    memberOrgIds.forEach(function(orgId) {
      memberOrgMap[String(orgId || "").trim()] =
        true;
    });

    for (let i = 0; i < targetOrgIds.length; i++) {
      if (memberOrgMap[targetOrgIds[i]]) {
        return true;
      }
    }
  }

  return false;
}

function splitPersonalOrganizationIds_(
  text
) {

  return String(text || "")
    .split(",")
    .map(function(value) {
      return String(value || "").trim();
    })
    .filter(function(value) {
      return value !== "";
    });
}

function getOrganizationRowsForPersonal_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("組織マスタ");

  if (!sheet) {
    return [];
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const organizations = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const orgId =
      String(getCellByHeader_(row, headerMap, "組織ID") || "").trim();

    const orgName =
      String(getCellByHeader_(row, headerMap, "組織名") || "").trim();

    const active =
      String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE";

    if (!orgId || !orgName) {
      continue;
    }

    organizations.push({
      orgId: orgId,
      orgName: orgName,
      active: active,
      selected: false
    });
  }

  return organizations;
}

function getMemberOrganizationIds_(
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

  const orgIds = [];

  for (let i = 1; i < values.length; i++) {

    const rowMemberNo =
      normalizeMemberNo_(
        values[i][0]
      );

    const orgId =
      String(values[i][1] || "").trim();

    if (rowMemberNo === targetMemberNo && orgId) {
      orgIds.push(
        orgId
      );
    }
  }

  return orgIds;
}

function isRepresentativePersonalId_(
  personalId
) {

  return /-001$/.test(
    String(personalId || "").trim()
  );
}

function syncOrganizationRepresentativesForOrg_(
  orgId,
  memberNos
) {

  const targetOrgId =
    String(orgId || "").trim();

  if (!targetOrgId) {
    return;
  }

  const targetPersonalIdMap = {};

  uniqueTextValues_(
    memberNos
  ).forEach(function(memberNo) {

    const normalizedMemberNo =
      normalizeMemberNo_(
        memberNo
      );

    if (normalizedMemberNo) {
      targetPersonalIdMap[normalizedMemberNo + "-001"] =
        true;
    }
  });

  const sheet =
    getPersonalMemberOrganizationSheet_();

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const existingMap = {};

  for (let i = values.length - 1; i >= 1; i--) {

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const rowOrgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

    const source =
      String(getCellByHeader_(values[i], headerMap, "由来") || "").trim();

    if (rowOrgId !== targetOrgId) {
      continue;
    }

    if (source === PERSONAL_MEMBER_ORG_SOURCE_COMPANY_SYNC_) {
      sheet.deleteRow(i + 1);
      continue;
    }

    if (targetPersonalIdMap[rowPersonalId]) {
      existingMap[rowPersonalId] =
        true;
    }
  }

  const now =
    new Date();

  const rows =
    Object.keys(targetPersonalIdMap)
      .filter(function(personalId) {
        return !existingMap[personalId];
      })
      .map(function(personalId) {
        return [
          personalId,
          targetOrgId,
          now,
          PERSONAL_MEMBER_ORG_SOURCE_COMPANY_SYNC_,
          "会社の所属組織から自動同期"
        ];
      });

  if (rows.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        PERSONAL_MEMBER_ORG_HEADERS_.length
      )
      .setValues(rows);
  }
}

function getPersonalMemberOrganizationSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      PERSONAL_MEMBER_ORG_SHEET_NAME_
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        PERSONAL_MEMBER_ORG_SHEET_NAME_
      );
  }

  ensureHeaders_(
    sheet,
    PERSONAL_MEMBER_ORG_HEADERS_
  );

  return sheet;
}

function getOrCreateMemberOrganizationSheetForPersonalAdd_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      "会員所属"
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        "会員所属"
      );

    sheet.appendRow([
      "業者番号",
      "組織ID",
      "登録日時"
    ]);
  }

  return sheet;
}

function makeExistingMemberOrganizationMap_(
  sheet
) {

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      normalizeMemberNo_(
        values[i][0] || ""
      );

    const orgId =
      String(values[i][1] || "").trim();

    if (memberNo && orgId) {
      map[memberNo + "\t" + orgId] =
        true;
    }
  }

  return map;
}

function makeExistingPersonalOrganizationPairMap_(
  sheet
) {

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

    const personalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const orgId =
      String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

    if (personalId && orgId) {
      map[personalId + "\t" + orgId] =
        true;
    }
  }

  return map;
}

function uniqueTextValues_(
  values
) {

  const map = {};

  (values || []).forEach(function(value) {

    const text =
      String(value || "").trim();

    if (text) {
      map[text] =
        true;
    }
  });

  return Object.keys(map);
}
