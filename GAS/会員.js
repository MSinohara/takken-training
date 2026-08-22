const MEMBER_MASTER_FIRESTORE_SYNC_TRIGGER_FUNCTION_ =
  "runMemberMasterFirestoreSyncJob_";

const MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_ =
  "MEMBER_MASTER_FIRESTORE_SYNC_OFFSET";

const MEMBER_MASTER_FIRESTORE_SYNC_STATUS_KEY_ =
  "MEMBER_MASTER_FIRESTORE_SYNC_STATUS";

const MEMBER_MASTER_FIRESTORE_SYNC_BATCH_SIZE_ =
  120;

function searchMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const keyword =
    String(e.parameter.keyword || "").trim();

  const branch =
    String(e.parameter.branch || "").trim();

  const eventId =
    String(e.parameter.event || "").trim();

  const result =
    searchMembers_(keyword, branch, eventId);

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function searchMembers_(keyword, branch, eventId) {

  const eventSearchResult =
    searchMembersFromFirestoreTargets_(
      keyword,
      branch,
      eventId
    );

  if (eventSearchResult) {
    return eventSearchResult;
  }

  const firestoreSearchResult =
    searchMembersFromFirestoreMaster_(
      keyword,
      branch
    );

  if (firestoreSearchResult) {
    return firestoreSearchResult;
  }

  let members;

  try {

    members =
      getMemberRowsFromMaster_();

  } catch (err) {

    return {
      ok: false,
      message: err.message
    };
  }

  const list = [];

  const key =
    normalizeMemberSearchText_(
      keyword
    );

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          branch || ""
        )
      : String(branch || "").trim();

  for (let i = 0; i < members.length; i++) {

    const member =
      members[i];

    if (!member.memberNo || !member.companyName) {
      continue;
    }

    const memberBranchKey =
      typeof normalizeCheckinIndexBranchName_ === "function"
        ? normalizeCheckinIndexBranchName_(
            member.branch || ""
          )
        : String(member.branch || "").trim();

    if (
      branchKey &&
      memberBranchKey !== branchKey
    ) {
      continue;
    }

    if (
      key &&
      normalizeMemberSearchText_(
        [
          member.memberNo,
          member.companyName,
          member.representativeName,
          member.mail,
          member.branch,
          member.district,
          member.block
        ].join(" ")
      ).indexOf(key) === -1
    ) {
      continue;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      representativeName: member.representativeName || "",
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district
    });
  }

  return {
    ok: true,
    members: list.slice(0, 50),
    source: "会員マスタ"
  };
}

function searchMembersFromFirestoreMaster_(
  keyword,
  branch
) {

  if (
    typeof searchFirestoreMembersByBranch_ !== "function"
  ) {
    return null;
  }

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          branch
        )
      : String(branch || "").trim();

  if (!branchKey) {
    return null;
  }

  let members;

  try {
    members =
      searchFirestoreMembersByBranch_(
        branch,
        700
      );
  } catch (err) {
    return null;
  }

  if (!members || members.length === 0) {
    return null;
  }

  const list = [];

  const key =
    normalizeMemberSearchText_(
      keyword
    );

  for (let i = 0; i < members.length; i++) {

    const member =
      members[i];

    if (!member.memberNo || !member.companyName) {
      continue;
    }

    const itemBranchKey =
      typeof normalizeCheckinIndexBranchName_ === "function"
        ? normalizeCheckinIndexBranchName_(
            member.branch
          )
        : String(member.branch || "").trim();

    if (
      branchKey &&
      itemBranchKey !== branchKey
    ) {
      continue;
    }

    if (
      key &&
      normalizeMemberSearchText_(
        [
          member.memberNo,
          member.companyName,
          member.representativeName,
          member.mail,
          member.branch,
          member.district,
          member.block
        ].join(" ")
      ).indexOf(key) === -1
    ) {
      continue;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      representativeName: member.representativeName || "",
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district
    });

    if (list.length >= 50) {
      break;
    }
  }

  return {
    ok: true,
    members: list,
    source: "Firestore会員マスタ"
  };
}

function searchMembersFromFirestoreTargets_(
  keyword,
  branch,
  eventId
) {

  eventId =
    String(eventId || "").trim();

  if (
    !eventId ||
    typeof getFirestoreCheckinTargets_ !== "function"
  ) {
    return null;
  }

  let targets;

  try {
    targets =
      getFirestoreCheckinTargets_(
        eventId
      );
  } catch (err) {
    return null;
  }

  if (!targets || targets.length === 0) {
    return null;
  }

  const key =
    normalizeMemberSearchText_(
      keyword
    );

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          branch
        )
      : String(branch || "").trim();

  const seen = {};
  const list = [];

  for (let i = 0; i < targets.length; i++) {

    const item =
      targets[i];

    const memberNo =
      normalizeMemberNo_(
        item.memberNo
      );

    if (!memberNo || !item.companyName) {
      continue;
    }

    if (seen[memberNo]) {
      continue;
    }

    const itemBranchKey =
      typeof normalizeCheckinIndexBranchName_ === "function"
        ? normalizeCheckinIndexBranchName_(
            item.branch
          )
        : String(item.branch || "").trim();

    if (
      branchKey &&
      itemBranchKey !== branchKey
    ) {
      continue;
    }

    const searchText =
      normalizeMemberSearchText_(
        [
          memberNo,
          item.companyName,
          item.participantName,
          item.mail,
          item.block,
          item.branch,
          item.district
        ].join(" ")
      );

    if (
      key &&
      searchText.indexOf(key) === -1
    ) {
      continue;
    }

    seen[memberNo] =
      true;

    list.push({
      memberNo: memberNo,
      companyName: item.companyName,
      representativeName: item.participantName || "",
      mail: item.mail || "",
      block: item.block || "",
      branch: item.branch || "",
      district: item.district || ""
    });

    if (list.length >= 50) {
      break;
    }
  }

  return {
    ok: true,
    members: list,
    source: "Firestore受付対象",
    targetCount: targets.length
  };
}

function normalizeMemberSearchText_(
  value
) {

  if (typeof normalizeFirestoreCheckinSearchText_ === "function") {
    return normalizeFirestoreCheckinSearchText_(
      value
    );
  }

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

function setupMemberSettingsFromMaster_() {

  const ss =
    getSpreadsheet_();

  const masterSheet =
    ss.getSheetByName("会員マスタ");

  if (!masterSheet) {
    throw new Error("会員マスタシートがありません");
  }

  let settingSheet =
    ss.getSheetByName("会員設定");

  if (!settingSheet) {
    settingSheet =
      ss.insertSheet("会員設定");

    settingSheet.appendRow([
      "業者番号",
      "送信対象",
      "備考",
      "最終更新日時"
    ]);
  }

  const settingValues =
    settingSheet.getDataRange().getValues();

  const existingMap = {};

  for (let i = 1; i < settingValues.length; i++) {

    const memberNo =
      String(settingValues[i][0] || "")
        .replace(".0", "")
        .trim();

    if (memberNo) {
      existingMap[memberNo] = true;
    }
  }

  const masterValues =
    masterSheet.getDataRange().getValues();

  let added =
    0;

  for (let i = 1; i < masterValues.length; i++) {

    const memberNo =
      String(masterValues[i][0] || "")
        .replace(".0", "")
        .trim();

    if (!memberNo) {
      continue;
    }

    if (existingMap[memberNo]) {
      continue;
    }

    const target =
      "TRUE";

    settingSheet.appendRow([
      memberNo,
      target,
      "",
      new Date()
    ]);

    added++;
  }

  return {
    ok: true,
    message: "会員設定シートを作成・更新しました。",
    added: added
  };
}

function startMemberImportJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    startMemberImport_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function appendMemberImportChunkJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const rowsJson =
    e.parameter.rows || "[]";

  const rows =
    JSON.parse(rowsJson);

  const result =
    appendMemberImportChunk_(
      rows
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function finishMemberImportJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    finishMemberImport_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getMemberImportDuplicateCandidatesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getMemberImportDuplicateCandidates_();
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

function applyMemberImportDuplicateChoicesJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      applyMemberImportDuplicateChoices_(
        JSON.parse(e.parameter.choices || "[]")
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


function startMemberImport_() {

  const ss =
    getSpreadsheet_();

  let tempSheet =
    ss.getSheetByName("会員マスタ取込一時");

  if (!tempSheet) {
    tempSheet =
      ss.insertSheet("会員マスタ取込一時");
  }

  tempSheet.clear();

  tempSheet.appendRow([
    "業者番号",
    "会社名",
    "代表者名",
    "ブロック",
    "支部",
    "地区",
    "メール"
  ]);

  return {
    ok: true,
    message: "取込準備が完了しました。"
  };
}


function appendMemberImportChunk_(
  rows
) {

  const ss =
    getSpreadsheet_();

  const tempSheet =
    ss.getSheetByName("会員マスタ取込一時");

  if (!tempSheet) {
    throw new Error("会員マスタ取込一時シートがありません");
  }

  if (!rows || rows.length === 0) {
    return {
      ok: true,
      count: 0
    };
  }

  const values =
    rows.map(function(row) {
      return [
        normalizeMemberNo_(row[0]),
        String(row[1] || "").trim(),
        String(row[2] || "").trim(),
        String(row[3] || "").trim(),
        String(row[4] || "").trim(),
        String(row[5] || "").trim(),
        String(row[6] || "").trim()
      ];
    });

  tempSheet
    .getRange(
      tempSheet.getLastRow() + 1,
      1,
      values.length,
      7
    )
    .setValues(values);

  return {
    ok: true,
    count: values.length
  };
}


function finishMemberImport_() {

  const ss =
    getSpreadsheet_();

  const tempSheet =
    ss.getSheetByName("会員マスタ取込一時");

  if (!tempSheet) {
    throw new Error("会員マスタ取込一時シートがありません");
  }

  let masterSheet =
    ss.getSheetByName("会員マスタ");

  if (!masterSheet) {
    masterSheet =
      ss.insertSheet("会員マスタ");
  }

  backupSheet_(
    masterSheet,
    "会員マスタ_BK_"
  );

  cleanupBackupSheets_(
    "会員マスタ_BK_",
    3
  );

  const tempValues =
    tempSheet.getDataRange().getValues();

  const tempHeaderMap =
    getHeaderMap_(tempSheet);

  const map = {};

  const duplicateGroupMap = {};

  let skipped =
    0;

  for (let i = 1; i < tempValues.length; i++) {

    const row =
      tempValues[i];

    const memberNo =
      normalizeMemberNo_(
        getCellByHeader_(row, tempHeaderMap, "業者番号")
      );

    const companyName =
      String(getCellByHeader_(row, tempHeaderMap, "会社名") || "").trim();

    const representativeName =
      String(getCellByHeader_(row, tempHeaderMap, "代表者名") || "").trim();

    const block =
      String(getCellByHeader_(row, tempHeaderMap, "ブロック") || "").trim();

    const branch =
      String(getCellByHeader_(row, tempHeaderMap, "支部") || "").trim();

    const district =
      String(getCellByHeader_(row, tempHeaderMap, "地区") || "").trim();

    const mail =
      String(getCellByHeader_(row, tempHeaderMap, "メール") || "").trim();

    if (
      !memberNo ||
      !companyName ||
      !block ||
      !branch ||
      !district
    ) {
      skipped++;
      continue;
    }

    if (!duplicateGroupMap[memberNo]) {
      duplicateGroupMap[memberNo] =
        [];
    }

    duplicateGroupMap[memberNo].push({
      memberNo: memberNo,
      companyName: companyName,
      representativeName: representativeName,
      block: block,
      branch: branch,
      district: district,
      mail: mail
    });

    map[memberNo] = [
      memberNo,
      companyName,
      representativeName,
      block,
      branch,
      district,
      mail
    ];
  }

  const duplicateCandidateCount =
    saveMemberImportDuplicateCandidates_(
      duplicateGroupMap
    );

  const output =
    [
      [
        "業者番号",
        "会社名",
        "代表者名",
        "ブロック",
        "支部",
        "地区",
        "メール"
      ]
    ];

  Object.keys(map)
    .sort()
    .forEach(function(memberNo) {
      output.push(map[memberNo]);
    });

  masterSheet.clear();

  masterSheet
    .getRange(
      1,
      1,
      output.length,
      output[0].length
    )
    .setValues(output);

  const settingResult =
    ensureMemberSettingsAfterImport_(
      Object.keys(map)
    );

  let firestoreSynced =
    0;

  let firestoreSyncQueued =
    false;

  let firestoreSyncMessage =
    "";

  if (
    typeof syncMemberMasterToFirestore_ === "function" &&
    Object.keys(map).length <= 120
  ) {
    const firestoreResult =
      syncMemberMasterToFirestore_(
        Object.keys(map).map(function(memberNo) {
          const row =
            map[memberNo];

          return {
            memberNo: row[0],
            companyName: row[1],
            representativeName: row[2],
            block: row[3],
            branch: row[4],
            district: row[5],
            mail: row[6],
            active: "TRUE"
          };
        })
      );

    firestoreSynced =
      firestoreResult.count || 0;
  } else if (typeof syncMemberMasterToFirestore_ === "function") {
    try {
      queueMemberMasterFirestoreSync_();

      firestoreSyncQueued =
        true;

      firestoreSyncMessage =
        "会員マスタのFirestore同期を裏で開始します。";
    } catch (err) {
      firestoreSyncMessage =
        "会員マスタ取込は完了しましたが、Firestore自動同期の予約に失敗しました。接続確認画面から手動同期してください。詳細: " +
        err.message;
    }
  }

  return {
    ok: true,
    message: "会員マスタを取り込みました。",
    imported: output.length - 1,
    skipped: skipped,
    duplicateCandidateGroups: duplicateCandidateCount.groups,
    duplicateCandidateRows: duplicateCandidateCount.rows,
    addedSettings: settingResult.added,
    firestoreSynced: firestoreSynced,
    firestoreSyncQueued: firestoreSyncQueued,
    firestoreSyncMessage: firestoreSyncMessage
  };
}

function getMemberImportDuplicateCandidateSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(
      "会員マスタ重複候補"
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        "会員マスタ重複候補"
      );
  }

  ensureHeaders_(
    sheet,
    [
      "作成日時",
      "業者番号",
      "候補番号",
      "会社名",
      "氏名",
      "ブロック",
      "支部",
      "地区",
      "メール"
    ]
  );

  return sheet;
}

function saveMemberImportDuplicateCandidates_(
  duplicateGroupMap
) {

  const sheet =
    getMemberImportDuplicateCandidateSheet_();

  sheet.clear();

  sheet.appendRow([
    "作成日時",
    "業者番号",
    "候補番号",
    "会社名",
    "氏名",
    "ブロック",
    "支部",
    "地区",
    "メール"
  ]);

  const now =
    new Date();

  const rows = [];
  let groups = 0;

  Object.keys(duplicateGroupMap || {})
    .sort()
    .forEach(function(memberNo) {

      const candidates =
        duplicateGroupMap[memberNo] || [];

      if (candidates.length < 2) {
        return;
      }

      groups++;

      candidates.forEach(function(item, index) {
        rows.push([
          now,
          item.memberNo,
          index + 1,
          item.companyName,
          item.representativeName,
          item.block,
          item.branch,
          item.district,
          item.mail
        ]);
      });
    });

  if (rows.length) {
    sheet
      .getRange(
        2,
        1,
        rows.length,
        rows[0].length
      )
      .setValues(rows);
  }

  return {
    groups: groups,
    rows: rows.length
  };
}

function getMemberImportDuplicateCandidates_() {

  const sheet =
    getMemberImportDuplicateCandidateSheet_();

  if (sheet.getLastRow() < 2) {
    return {
      ok: true,
      groups: [],
      count: 0
    };
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const groupMap = {};

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const memberNo =
      normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    if (!memberNo) {
      continue;
    }

    if (!groupMap[memberNo]) {
      groupMap[memberNo] =
        {
          memberNo: memberNo,
          candidates: []
        };
    }

    groupMap[memberNo].candidates.push({
      candidateNo: Number(getCellByHeader_(row, headerMap, "候補番号") || 0),
      memberNo: memberNo,
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      representativeName: String(getCellByHeader_(row, headerMap, "氏名") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      district: String(getCellByHeader_(row, headerMap, "地区") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim()
    });
  }

  const groups =
    Object.keys(groupMap)
      .sort()
      .map(function(memberNo) {
        return groupMap[memberNo];
      });

  return {
    ok: true,
    groups: groups,
    count: groups.length
  };
}

function applyMemberImportDuplicateChoices_(
  choices
) {

  if (!Array.isArray(choices)) {
    throw new Error("候補の指定が正しくありません。");
  }

  const candidateMap =
    makeMemberImportDuplicateCandidateMap_();

  const sheet =
    getPersonalMemberSheet_();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  const values =
    sheet.getDataRange().getValues();

  const rowByPersonalId = {};

  for (let i = 1; i < values.length; i++) {

    const personalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    if (personalId) {
      rowByPersonalId[personalId] =
        i + 1;
    }
  }

  const suffixMap = {};
  const rowsToWrite = [];
  let saved = 0;
  let skipped = 0;
  const now =
    new Date();

  choices.forEach(function(choice) {

    const memberNo =
      normalizeMemberNo_(
        choice && choice.memberNo
      );

    const candidateNo =
      Number(choice && choice.candidateNo || 0);

    const suffix =
      normalizeMemberImportPersonalSuffix_(
        choice && choice.suffix
      );

    if (!memberNo || !candidateNo || !suffix) {
      skipped++;
      return;
    }

    const candidate =
      candidateMap[memberNo + "\t" + candidateNo];

    if (!candidate || !candidate.representativeName) {
      skipped++;
      return;
    }

    if (!suffixMap[memberNo]) {
      suffixMap[memberNo] =
        {};
    }

    if (suffixMap[memberNo][suffix]) {
      throw new Error(
        memberNo +
        " で同じ個人番号 " +
        suffix +
        " が複数選択されています。"
      );
    }

    suffixMap[memberNo][suffix] =
      true;

    const personalId =
      memberNo + "-" + suffix;

    const existingRowNo =
      rowByPersonalId[personalId] || 0;

    const existingRow =
      existingRowNo
        ? values[existingRowNo - 1]
        : [];

    rowsToWrite.push({
      rowNo: existingRowNo,
      row: [
        personalId,
        memberNo,
        candidate.companyName,
        candidate.representativeName,
        normalizePersonalMemberType_(suffix === "001" ? "代表者" : "社員"),
        candidate.mail,
        "承認済み",
        "TRUE",
        "会員CSV重複候補",
        "会員マスタCSV取込時の同一業者番号候補から登録",
        existingRowNo
          ? getCellByHeader_(existingRow, headerMap, "作成日時") || now
          : now,
        now
      ]
    });

    saved++;
  });

  rowsToWrite.forEach(function(item) {

    const rowNo =
      item.rowNo || sheet.getLastRow() + 1;

    sheet
      .getRange(
        rowNo,
        1,
        1,
        PERSONAL_MEMBER_HEADERS_.length
      )
      .setValues([
        item.row
      ]);
  });

  return {
    ok: true,
    message:
      "重複候補を個人会員マスタへ反映しました。登録 " +
      saved +
      "件、取込しない " +
      skipped +
      "件。",
    saved: saved,
    skipped: skipped
  };
}

function makeMemberImportDuplicateCandidateMap_() {

  const result =
    getMemberImportDuplicateCandidates_();

  const map = {};

  (result.groups || []).forEach(function(group) {
    (group.candidates || []).forEach(function(candidate) {
      map[
        normalizeMemberNo_(candidate.memberNo) +
        "\t" +
        Number(candidate.candidateNo || 0)
      ] =
        candidate;
    });
  });

  return map;
}

function normalizeMemberImportPersonalSuffix_(
  value
) {

  const text =
    String(value || "").trim();

  if (!text || text === "skip") {
    return "";
  }

  const match =
    text.match(/^0*([0-9]{1,3})$/);

  if (!match) {
    return "";
  }

  const num =
    Number(match[1]);

  if (num < 1 || num > 999) {
    return "";
  }

  return String(num).padStart(3, "0");
}

function syncCurrentMemberMasterToFirestore() {

  return syncCurrentMemberMasterToFirestoreChunk_(
    0,
    120
  );
}

function syncCurrentMemberMasterToFirestoreChunk_(
  offset,
  limit
) {

  const members =
    getMemberRowsFromMaster_();

  offset =
    Math.max(
      0,
      Number(offset || 0)
    );

  limit =
    Math.max(
      1,
      Math.min(
        Number(limit || 120),
        150
      )
    );

  const chunk =
    members.slice(
      offset,
      offset + limit
    );

  const result =
    typeof syncMemberMasterToFirestore_ === "function"
      ? syncMemberMasterToFirestore_(
          chunk
        )
      : {
          ok: true,
          skipped: true,
          count: 0
        };

  const done =
    offset + chunk.length >= members.length;

  let deactivated =
    0;

  let deactivateFailed =
    0;

  if (
    done &&
    typeof deactivateMissingMembersInFirestore_ === "function"
  ) {
    const activeMemberNoMap = {};

    members.forEach(function(member) {
      const memberNo =
        normalizeMemberNo_(
          member && member.memberNo
        );

      if (memberNo) {
        activeMemberNoMap[memberNo] =
          true;
      }
    });

    const deactivateResult =
      deactivateMissingMembersInFirestore_(
        activeMemberNoMap
      );

    deactivated =
      deactivateResult.deactivated || 0;

    deactivateFailed =
      deactivateResult.failed || 0;
  }

  Logger.log(
    JSON.stringify({
      ok: result.ok,
      count: result.count || 0,
      unchanged: result.unchanged || 0,
      failed: result.failed || 0,
      deactivated: deactivated,
      deactivateFailed: deactivateFailed,
      processed: result.processed || chunk.length,
      offset: offset,
      nextOffset: offset + chunk.length,
      total: members.length
    })
  );

  return {
    ok: result.ok,
    skipped: result.skipped,
    count: result.count || 0,
    unchanged: result.unchanged || 0,
    failed: result.failed || 0,
    deactivated: deactivated,
    deactivateFailed: deactivateFailed,
    processed: result.processed || chunk.length,
    offset: offset,
    nextOffset: offset + chunk.length,
    total: members.length,
    done: done
  };
}

function syncCurrentMemberMasterToFirestoreJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      syncCurrentMemberMasterToFirestoreChunk_(
        e.parameter.offset || 0,
        e.parameter.limit || 120
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

function queueMemberMasterFirestoreSyncJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      queueMemberMasterFirestoreSync_();
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

function getMemberMasterFirestoreSyncStatusJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getMemberMasterFirestoreSyncStatus_();
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

function runMemberMasterFirestoreSyncJob_() {

  processMemberMasterFirestoreSyncJob_();
}

function queueMemberMasterFirestoreSync_() {

  if (
    typeof isFirestoreEnabled_ === "function" &&
    !isFirestoreEnabled_()
  ) {
    return {
      ok: true,
      skipped: true,
      message: "Firestore連携は未使用です。"
    };
  }

  const props =
    PropertiesService.getScriptProperties();

  props.setProperty(
    MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_,
    "0"
  );

  props.setProperty(
    MEMBER_MASTER_FIRESTORE_SYNC_STATUS_KEY_,
    "RUNNING"
  );

  scheduleMemberMasterFirestoreSyncTrigger_();

  return {
    ok: true,
    queued: true,
    message: "会員マスタのFirestore同期を予約しました。"
  };
}

function getMemberMasterFirestoreSyncStatus_() {

  const props =
    PropertiesService.getScriptProperties();

  const status =
    String(
      props.getProperty(
        MEMBER_MASTER_FIRESTORE_SYNC_STATUS_KEY_
      ) || "未実行"
    );

  const offset =
    Number(
      props.getProperty(
        MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_
      ) || 0
    );

  return {
    ok: true,
    status: status,
    offset: offset,
    batchSize: MEMBER_MASTER_FIRESTORE_SYNC_BATCH_SIZE_,
    message: makeMemberMasterFirestoreSyncStatusMessage_(
      status,
      offset
    )
  };
}

function makeMemberMasterFirestoreSyncStatusMessage_(
  status,
  offset
) {

  if (status === "RUNNING") {
    return "会員マスタをFirestoreへ同期中です。次は " +
      offset +
      " 件目から処理します。";
  }

  if (status === "DONE") {
    return "会員マスタのFirestore同期は完了しています。";
  }

  return "会員マスタのFirestore同期はまだ実行されていません。";
}

function processMemberMasterFirestoreSyncJob_() {

  const props =
    PropertiesService.getScriptProperties();

  const status =
    String(
      props.getProperty(
        MEMBER_MASTER_FIRESTORE_SYNC_STATUS_KEY_
      ) || ""
    );

  if (status !== "RUNNING") {
    removeMemberMasterFirestoreSyncTriggers_();
    return;
  }

  const offset =
    Number(
      props.getProperty(
        MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_
      ) || 0
    );

  const result =
    syncCurrentMemberMasterToFirestoreChunk_(
      offset,
      MEMBER_MASTER_FIRESTORE_SYNC_BATCH_SIZE_
    );

  if (result.done) {
    props.setProperty(
      MEMBER_MASTER_FIRESTORE_SYNC_STATUS_KEY_,
      "DONE"
    );

    props.deleteProperty(
      MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_
    );

    removeMemberMasterFirestoreSyncTriggers_();
    return;
  }

  props.setProperty(
    MEMBER_MASTER_FIRESTORE_SYNC_OFFSET_KEY_,
    String(result.nextOffset || 0)
  );

  scheduleMemberMasterFirestoreSyncTrigger_();
}

function scheduleMemberMasterFirestoreSyncTrigger_() {

  removeMemberMasterFirestoreSyncTriggers_();

  ScriptApp
    .newTrigger(
      MEMBER_MASTER_FIRESTORE_SYNC_TRIGGER_FUNCTION_
    )
    .timeBased()
    .after(30 * 1000)
    .create();
}

function removeMemberMasterFirestoreSyncTriggers_() {

  ScriptApp
    .getProjectTriggers()
    .forEach(function(trigger) {
      if (
        trigger.getHandlerFunction() ===
        MEMBER_MASTER_FIRESTORE_SYNC_TRIGGER_FUNCTION_
      ) {
        ScriptApp.deleteTrigger(
          trigger
        );
      }
    });
}


function backupSheet_(
  sheet,
  prefix
) {

  const ss =
    getSpreadsheet_();

  const now =
    Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyyMMdd_HHmmss"
    );

  const backupName =
    prefix + now;

  const copied =
    sheet.copyTo(ss);

  copied.setName(
    backupName
  );

  return backupName;
}


function ensureMemberSettingsAfterImport_(
  memberNos
) {

  const ss =
    getSpreadsheet_();

  let settingSheet =
    ss.getSheetByName("会員設定");

  if (!settingSheet) {
    settingSheet =
      ss.insertSheet("会員設定");

    settingSheet.appendRow([
      "業者番号",
      "送信対象",
      "備考",
      "最終更新日時"
    ]);
  }

  const values =
    settingSheet.getDataRange().getValues();

  const existing = {};

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      String(values[i][0] || "")
        .replace(".0", "")
        .trim();

    if (memberNo) {
      existing[memberNo] = true;
    }
  }

  let added =
    0;

  memberNos.forEach(function(memberNo) {

    if (existing[memberNo]) {
      return;
    }

    settingSheet.appendRow([
      memberNo,
      true,
      "",
      new Date()
    ]);

    added++;
  });

  return {
    added: added
  };
}

function getMembersJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const keyword =
    String(e.parameter.keyword || "").trim();

  const branch =
    String(e.parameter.branch || "").trim();

  const target =
    String(e.parameter.target || "").trim();

  const mailStatus =
    String(e.parameter.mailStatus || "").trim();

  const offset =
    Math.max(
      0,
      Number(e.parameter.offset || 0)
    );

  const limit =
    Math.min(
      100,
      Math.max(
        1,
        Number(e.parameter.limit || 10)
      )
    );

  let result;

  try {

    result =
      getMembers_(
        keyword,
        branch,
        target,
        offset,
        limit,
        mailStatus
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


function updateMemberSettingJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const memberNo =
    String(e.parameter.member || "").trim();

  const mail =
    String(e.parameter.mail || "").trim();

  const target =
    String(e.parameter.target || "").trim();

  const note =
    String(e.parameter.note || "").trim();

  const result =
    updateMemberSetting_(
      memberNo,
      mail,
      target,
      note
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getMembers_(
  keyword,
  branch,
  target,
  offset,
  limit,
  mailStatus
) {

  let members;

  try {

    members =
      getMemberRowsFromMaster_();

  } catch (err) {

    return {
      ok: false,
      message: err.message
    };
  }

  const settingMap =
    getMemberSettingMap_();

  const list = [];

  const key =
    String(keyword || "").toLowerCase();

  const branchKey =
    typeof normalizeCheckinIndexBranchName_ === "function"
      ? normalizeCheckinIndexBranchName_(
          branch
        )
      : String(branch || "").trim();

  const mailStatusKey =
    String(mailStatus || "").trim();

  for (let i = 0; i < members.length; i++) {

    const member =
      members[i];

    if (!member.memberNo) {
      continue;
    }

    const setting =
      settingMap[member.memberNo] || {
        target: "TRUE",
        note: ""
      };

    if (
      key &&
      member.memberNo.toLowerCase().indexOf(key) === -1 &&
      member.companyName.toLowerCase().indexOf(key) === -1 &&
      String(member.representativeName || "").toLowerCase().indexOf(key) === -1 &&
      member.mail.toLowerCase().indexOf(key) === -1 &&
      member.block.toLowerCase().indexOf(key) === -1 &&
      member.branch.toLowerCase().indexOf(key) === -1 &&
      member.district.toLowerCase().indexOf(key) === -1
    ) {
      continue;
    }

    const memberBranchKey =
      typeof normalizeCheckinIndexBranchName_ === "function"
        ? normalizeCheckinIndexBranchName_(
            member.branch
          )
        : String(member.branch || "").trim();

    if (
      branchKey &&
      memberBranchKey !== branchKey
    ) {
      continue;
    }

    const memberMail =
      String(member.mail || "").trim();

    if (
      mailStatusKey === "HAS_MAIL" &&
      !memberMail
    ) {
      continue;
    }

    if (
      mailStatusKey === "NO_MAIL" &&
      memberMail
    ) {
      continue;
    }

    if (
      target &&
      setting.target !== target
    ) {
      continue;
    }

    list.push({
      memberNo: member.memberNo,
      companyName: member.companyName,
      representativeName: member.representativeName || "",
      mail: member.mail,
      block: member.block,
      branch: member.branch,
      district: member.district,
      target: setting.target,
      note: setting.note
    });
  }

  const totalCount =
    list.length;

  const start =
    offset === undefined || offset === null
      ? 0
      : Math.max(0, Number(offset) || 0);

  const count =
    limit === undefined || limit === null
      ? totalCount
      : Math.max(1, Number(limit) || 10);

  return {
    ok: true,
    members: list.slice(
      start,
      start + count
    ),
    totalCount: totalCount,
    offset: start,
    limit: count
  };
}


function getMemberSettingMap_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員設定");

  const values =
    sheet.getDataRange().getValues();

  const map = {};

  for (let i = 1; i < values.length; i++) {

    const memberNo =
      String(values[i][0] || "")
        .replace(".0", "")
        .trim();

    const rawTarget =
      values[i][1];

    let target =
      "";

    if (rawTarget === true) {
      target = "TRUE";
    } else if (rawTarget === false) {
      target = "FALSE";
    } else {
      target =
        String(rawTarget || "")
          .toUpperCase()
          .trim();
    }

    target =
      target === "TRUE"
        ? "TRUE"
        : "FALSE";

    const note =
      String(values[i][2] || "").trim();

    if (memberNo) {
      map[memberNo] = {
        target: target,
        note: note
      };
    }
  }

  return map;
}

function updateMemberSetting_(
  memberNo,
  mail,
  target,
  note
) {

  const normalizedMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  if (!normalizedMemberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
    };
  }

  const normalizedTarget =
    target === "FALSE"
      ? "FALSE"
      : "TRUE";

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("会員設定");

  const headers = [
    "業者番号",
    "送信対象",
    "備考",
    "最終更新日時"
  ];

  if (!sheet) {
    sheet =
      ss.insertSheet("会員設定");

    sheet.appendRow(
      headers
    );
  }

  ensureHeaders_(
    sheet,
    headers
  );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  let updated =
    false;

  for (let i = 1; i < values.length; i++) {

    const rowMemberNo =
      normalizeMemberNo_(
        getCellByHeader_(
          values[i],
          headerMap,
          "業者番号"
        )
      );

    if (rowMemberNo !== normalizedMemberNo) {
      continue;
    }

    sheet
      .getRange(i + 1, headerMap["送信対象"] + 1)
      .setValue(normalizedTarget);

    sheet
      .getRange(i + 1, headerMap["備考"] + 1)
      .setValue(note || "");

    sheet
      .getRange(i + 1, headerMap["最終更新日時"] + 1)
      .setValue(new Date());

    updated =
      true;

    break;
  }

  if (!updated) {
    const row =
      new Array(
        sheet.getLastColumn()
      ).fill("");

    row[headerMap["業者番号"]] =
      normalizedMemberNo;

    row[headerMap["送信対象"]] =
      normalizedTarget;

    row[headerMap["備考"]] =
      note || "";

    row[headerMap["最終更新日時"]] =
      new Date();

    sheet.appendRow(
      row
    );
  }

  const mailResult =
    updateMemberMasterMail_(
      normalizedMemberNo,
      mail || ""
    );

  if (!mailResult.ok) {
    return mailResult;
  }

  if (typeof syncMemberToFirestore_ === "function") {
    try {
      const member =
        findMemberByNo_(
          normalizedMemberNo
        );

      if (member) {
        syncMemberToFirestore_(
          member
        );
      }
    } catch (firestoreErr) {
    }
  }

  return {
    ok: true,
    message: "会員設定を保存しました。"
  };
}

function getMemberDetailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const memberNo =
    normalizeMemberNo_(
      e.parameter.member || ""
    );

  let result;

  try {

    result =
      getMemberDetail_(
        memberNo
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


function getMemberDetail_(memberNo) {

  const targetMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  if (!targetMemberNo) {
    return {
      ok: false,
      message: "業者番号が指定されていません。"
    };
  }

  const member =
    findMemberByExactMemberNo_(
      targetMemberNo
    );

  if (!member) {
    return {
      ok: false,
      message: "会員情報が見つかりません。"
    };
  }

  const settingMap =
    getMemberSettingMap_();

  const setting =
    settingMap[targetMemberNo] || {
      target: "TRUE",
      note: ""
    };

  const orgs =
    getMemberOrganizations_(
      targetMemberNo
    );

  return {
    ok: true,
    member: Object.assign(
      {},
      member,
      {
        target: setting.target,
        note: setting.note
      }
    ),
    organizations: orgs.ok ? orgs.organizations : []
  };
}

function findMemberByExactMemberNo_(
  memberNo
) {

  const targetMemberNo =
    normalizeMemberNo_(
      memberNo
    );

  if (!targetMemberNo) {
    return null;
  }

  const members =
    getMemberRowsFromMaster_();

  for (let i = 0; i < members.length; i++) {
    if (
      normalizeMemberNo_(members[i].memberNo) === targetMemberNo
    ) {
      return members[i];
    }
  }

  return null;
}

function getMemberRowsFromMaster_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員マスタ");

  if (!sheet) {
    throw new Error("会員マスタシートがありません");
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headerMap =
    getHeaderMap_(sheet);

  const rows = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const memberNo =
      normalizeMemberNo_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    if (!memberNo) {
      continue;
    }

    rows.push({
      memberNo: memberNo,
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      representativeName: String(getCellByHeader_(row, headerMap, "代表者名") || "").trim(),
      block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
      district: String(getCellByHeader_(row, headerMap, "地区") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim()
    });
  }

  return rows;
}

function getMemberRowsForFastRead_() {

  if (
    shouldUseFirestoreForMemberFastRead_() &&
    typeof getFirestoreMembers_ === "function" &&
    typeof isFirestoreEnabled_ === "function"
  ) {

    try {

      const firestoreMembers =
        getFirestoreMembers_();

      if (
        firestoreMembers &&
        firestoreMembers.length > 0
      ) {
        return firestoreMembers.filter(function(member) {
          return String(member.active || "TRUE").toUpperCase() !== "FALSE";
        });
      }

    } catch (err) {
      // Firestoreが一時的に使えない場合は、従来の会員マスタシートに戻します。
    }
  }

  return getMemberRowsFromMaster_();
}

function shouldUseFirestoreForMemberFastRead_() {

  try {
    return (
      String(getConfigOptional_("FIRESTORE_MEMBER_FAST_READ") || "").toUpperCase() === "TRUE" &&
      typeof isFirestoreEnabled_ === "function" &&
      isFirestoreEnabled_()
    );
  } catch (err) {
    return false;
  }
}

function updateMemberMasterMail_(
  memberNo,
  mail
) {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("会員マスタ");

  if (!sheet) {
    return {
      ok: false,
      message: "会員マスタシートがありません。"
    };
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  if (headerMap["業者番号"] === undefined) {
    return {
      ok: false,
      message: "会員マスタに業者番号列がありません。"
    };
  }

  if (headerMap["メール"] === undefined) {
    return {
      ok: false,
      message: "会員マスタにメール列がありません。"
    };
  }

  for (let i = 1; i < values.length; i++) {

    const rowMemberNo =
      normalizeMemberNo_(
        getCellByHeader_(
          values[i],
          headerMap,
          "業者番号"
        )
      );

    if (rowMemberNo !== memberNo) {
      continue;
    }

    sheet
      .getRange(i + 1, headerMap["メール"] + 1)
      .setValue(mail || "");

    return {
      ok: true
    };
  }

  return {
    ok: false,
    message: "会員マスタに該当する会員が見つかりません。"
  };
}
