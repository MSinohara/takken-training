const LOCATION_CHECKIN_TOKEN_SHEET_NAME_ =
  "位置情報受付トークン";

const LOCATION_CHECKIN_TOKEN_HEADERS_ =
  [
    "作成日時",
    "更新日時",
    "トークン",
    "研修ID",
    "業者番号",
    "会社名",
    "メール",
    "受付対象区分",
    "予定者ID",
    "個人ID",
    "参加者名",
    "受付区分",
    "ブロック",
    "支部",
    "有効",
    "使用日時",
    "参加履歴行番号",
    "備考"
  ];

function auditLegacyLocationCheckinTokensForSqlMigration() {

  const sheet =
    getSpreadsheet_()
      .getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      ok: true,
      total: 0,
      active: 0,
      inactive: 0,
      used: 0,
      duplicateTokens: 0,
      duplicateTargets: 0,
      missingTrainingId: 0,
      missingTargetId: 0,
      unknownTargetType: 0,
      tokenValuesReturned: 0,
      mailsSent: 0
    };
  }

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const tokenCounts = {};
  const targetCounts = {};
  const result = {
    ok: true,
    total: 0,
    active: 0,
    inactive: 0,
    used: 0,
    duplicateTokens: 0,
    duplicateTargets: 0,
    missingTrainingId: 0,
    missingTargetId: 0,
    unknownTargetType: 0,
    tokenValuesReturned: 0,
    mailsSent: 0
  };

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const token = String(getCellByHeader_(row, headerMap, "トークン") || "").trim();
    const trainingId = String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();
    const targetType = String(getCellByHeader_(row, headerMap, "受付対象区分") || "会員").trim() || "会員";
    const memberNo = normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号"));
    const plannedId = String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim();
    const personalId = String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();
    const active = String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() !== "FALSE";
    const usedAt = getCellByHeader_(row, headerMap, "使用日時");
    let targetId = "";

    if (targetType === "当日予定者") {
      targetId = plannedId;
    } else if (targetType === "個人会員") {
      targetId = personalId;
    } else if (targetType === "会員") {
      targetId = memberNo;
    } else {
      result.unknownTargetType++;
    }

    result.total++;
    result[active ? "active" : "inactive"]++;
    if (usedAt) result.used++;
    if (!trainingId) result.missingTrainingId++;
    if (!targetId) result.missingTargetId++;
    if (token) tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    if (trainingId && targetId) {
      const targetKey = trainingId + "\n" + targetType + "\n" + targetId;
      targetCounts[targetKey] = (targetCounts[targetKey] || 0) + 1;
    }
  }

  result.duplicateTokens =
    Object.keys(tokenCounts).filter(function(key) { return tokenCounts[key] > 1; }).length;

  result.duplicateTargets =
    Object.keys(targetCounts).filter(function(key) { return targetCounts[key] > 1; }).length;

  console.log(JSON.stringify(result));
  return result;
}

function locationCheckinSqlRequest_(query, variables, write) {
  if (!isSqlDataRuntime_()) {
    throw new Error("位置情報受付トークンのSQL移行は開発環境に限定されています。");
  }
  const response = UrlFetchApp.fetch(
    getSqlDataConnectEndpoint_(write),
    {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({ query: query, variables: variables || {} })
    }
  );
  if (response.getResponseCode() !== 200) {
    throw new Error("位置情報受付トークンSQLに接続できません（HTTP " + response.getResponseCode() + "）。");
  }
  const result = JSON.parse(response.getContentText());
  if (result.errors || !result.data) {
    const detail = (result.errors || []).slice(0, 3).map(function(error) {
      const message = String(error && error.message || "").slice(0, 300);
      const code = String(error && error.extensions && error.extensions.code || "").slice(0, 80);
      return (code ? code + ": " : "") + message;
    }).join(" / ");
    throw new Error("位置情報受付トークンSQLの処理結果を確認できません。" +
      (detail ? " " + detail : ""));
  }
  return result.data;
}

function locationCheckinMigrationTimestamp_(value, fallback) {
  const date = value instanceof Date ? value : value ? new Date(value) : fallback;
  if (!(date instanceof Date) || isNaN(date.getTime())) return fallback.toISOString();
  return date.toISOString();
}

function migrateLegacyLocationCheckinTokensToSql() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const audit = auditLegacyLocationCheckinTokensForSqlMigration();
    if (audit.duplicateTokens || audit.duplicateTargets || audit.missingTrainingId ||
        audit.missingTargetId || audit.unknownTargetType) {
      throw new Error("旧トークンに移行できない行があります。先に監査結果を確認してください。");
    }
    const sheet = getSpreadsheet_().getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
    if (!sheet || sheet.getLastRow() < 2) {
      return { ok: true, source: 0, insertedOrUpdated: 0, alreadyPresent: 0, omittedReferences: 0, sqlTotal: 0, mailsSent: 0 };
    }
    const headerMap = getHeaderMap_(sheet);
    const values = sheet.getDataRange().getValues();
    const now = new Date();
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const targetType = String(getCellByHeader_(row, headerMap, "受付対象区分") || "会員").trim() || "会員";
      const memberNo = normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号"));
      const plannedId = String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim();
      const personalId = String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();
      const targetId = targetType === "当日予定者" ? plannedId : targetType === "個人会員" ? personalId : memberNo;
      rows.push({
        token: String(getCellByHeader_(row, headerMap, "トークン") || "").trim(),
        trainingId: String(getCellByHeader_(row, headerMap, "研修ID") || "").trim(),
        targetType: targetType,
        targetId: targetId,
        memberNo: memberNo || null,
        personalId: personalId || null,
        plannedId: plannedId || null,
        companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim() || null,
        participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim() || null,
        email: String(getCellByHeader_(row, headerMap, "メール") || "").trim() || null,
        receptionCategory: String(getCellByHeader_(row, headerMap, "受付区分") || "").trim() || null,
        block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim() || null,
        branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim() || null,
        active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() !== "FALSE",
        usedAt: getCellByHeader_(row, headerMap, "使用日時") ? locationCheckinMigrationTimestamp_(getCellByHeader_(row, headerMap, "使用日時"), now) : null,
        checkinId: String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim() || null,
        note: String(getCellByHeader_(row, headerMap, "備考") || "").trim() || null,
        revision: 1,
        createdAt: locationCheckinMigrationTimestamp_(getCellByHeader_(row, headerMap, "作成日時"), now),
        updatedAt: locationCheckinMigrationTimestamp_(getCellByHeader_(row, headerMap, "更新日時"), now)
      });
    }

    const existingData = locationCheckinSqlRequest_(
      "query { locationCheckinTokens(orderBy:[{token:ASC}],limit:1000){token trainingId targetType targetId} }",
      {}, false
    );
    const existing = existingData.locationCheckinTokens || [];
    const sourceByToken = {};
    rows.forEach(function(row) { sourceByToken[row.token] = row; });
    existing.forEach(function(row) {
      const source = sourceByToken[row.token];
      if (!source || source.trainingId !== row.trainingId || source.targetType !== row.targetType || source.targetId !== row.targetId) {
        throw new Error("SQL側に旧シートと一致しないトークンがあります。移行を停止しました。");
      }
    });

    let migrated = 0;
    let alreadyPresent = existing.length;
    let omittedReferences = 0;
    const existingTokens = {};
    existing.forEach(function(row) { existingTokens[row.token] = true; });
    const mutation = "mutation MigrateLocationCheckinToken($token:String!,$trainingId:String!,$targetType:String!,$targetId:String!,$memberNo:String,$personalId:String,$plannedId:String,$companyName:String,$participantName:String,$email:String,$receptionCategory:String,$block:String,$branch:String,$active:Boolean!,$usedAt:Timestamp,$checkinId:String,$note:String,$revision:Int!,$createdAt:Timestamp!,$updatedAt:Timestamp!){locationCheckinToken_upsert(data:{token:$token,trainingId:$trainingId,targetType:$targetType,targetId:$targetId,memberNo:$memberNo,personalId:$personalId,plannedId:$plannedId,companyName:$companyName,participantName:$participantName,email:$email,receptionCategory:$receptionCategory,block:$block,branch:$branch,active:$active,usedAt:$usedAt,checkinId:$checkinId,note:$note,revision:$revision,createdAt:$createdAt,updatedAt:$updatedAt})}";
    rows.forEach(function(row) {
      const refs = locationCheckinSqlRequest_(
        "query CheckLocationTokenRefs($trainingId:String!,$memberNo:String!,$personalId:String!,$plannedId:String!){training(key:{trainingId:$trainingId}){trainingId} memberCompany(key:{memberNo:$memberNo}){memberNo} person(key:{personalId:$personalId}){personalId} plannedAttendee(key:{plannedId:$plannedId}){plannedId}}",
        { trainingId: row.trainingId, memberNo: row.memberNo || "__NONE__", personalId: row.personalId || "__NONE__", plannedId: row.plannedId || "__NONE__" }, false
      );
      if (!refs.training) throw new Error("SQLに研修がない旧トークンがあります。移行を停止しました。");
      if (row.memberNo && !refs.memberCompany) { row.memberNo = null; omittedReferences++; }
      if (row.personalId && !refs.person) { row.personalId = null; omittedReferences++; }
      if (row.plannedId && !refs.plannedAttendee) { row.plannedId = null; omittedReferences++; }
      if (!existingTokens[row.token]) {
        locationCheckinSqlRequest_(mutation, row, true);
        migrated++;
      }
    });
    const verify = locationCheckinSqlRequest_("query { locationCheckinTokens(limit:1000){token} }", {}, false);
    const sqlTotal = (verify.locationCheckinTokens || []).length;
    if (sqlTotal !== rows.length) throw new Error("SQL移行後の件数が一致しません。受付切替は行わないでください。");
    const result = { ok: true, source: rows.length, insertedOrUpdated: migrated, alreadyPresent: alreadyPresent, omittedReferences: omittedReferences, sqlTotal: sqlTotal, tokenValuesReturned: 0, mailsSent: 0 };
    console.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function auditLocationCheckinTokenSqlParity() {
  if (!isSqlDataRuntime_()) {
    throw new Error("位置情報受付トークンのSQL照合は開発環境に限定されています。");
  }
  const sheet = getSpreadsheet_().getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
  const source = {};
  if (sheet && sheet.getLastRow() >= 2) {
    const headerMap = getHeaderMap_(sheet);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const token = String(getCellByHeader_(row, headerMap, "トークン") || "").trim();
      const targetType = String(getCellByHeader_(row, headerMap, "受付対象区分") || "会員").trim() || "会員";
      const memberNo = normalizeMemberNo_(getCellByHeader_(row, headerMap, "業者番号"));
      const personalId = String(getCellByHeader_(row, headerMap, "個人ID") || "").trim();
      const plannedId = String(getCellByHeader_(row, headerMap, "予定者ID") || "").trim();
      source[token] = {
        token: token,
        trainingId: String(getCellByHeader_(row, headerMap, "研修ID") || "").trim(),
        targetType: targetType,
        targetId: targetType === "当日予定者" ? plannedId : targetType === "個人会員" ? personalId : memberNo,
        memberNo: memberNo,
        personalId: personalId,
        plannedId: plannedId,
        companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
        participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
        email: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
        receptionCategory: String(getCellByHeader_(row, headerMap, "受付区分") || "").trim(),
        block: String(getCellByHeader_(row, headerMap, "ブロック") || "").trim(),
        branch: String(getCellByHeader_(row, headerMap, "支部") || "").trim(),
        active: String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() !== "FALSE",
        used: !!getCellByHeader_(row, headerMap, "使用日時"),
        checkinId: String(getCellByHeader_(row, headerMap, "参加履歴行番号") || "").trim(),
        note: String(getCellByHeader_(row, headerMap, "備考") || "").trim()
      };
    }
  }
  const data = locationCheckinSqlRequest_(
    "query { locationCheckinTokens(limit:1000){token trainingId targetType targetId memberNo personalId plannedId companyName participantName email receptionCategory block branch active usedAt checkinId note} }",
    {}, false
  );
  const sqlRows = data.locationCheckinTokens || [];
  const result = {
    ok: true,
    legacyTotal: Object.keys(source).length,
    sqlTotal: sqlRows.length,
    missingInSql: 0,
    extraInSql: 0,
    identityDifferences: 0,
    stateDifferences: 0,
    displayDifferences: 0,
    omittedReferenceFields: 0,
    tokenValuesReturned: 0,
    mailsSent: 0
  };
  const seen = {};
  sqlRows.forEach(function(sql) {
    const old = source[sql.token];
    if (!old) { result.extraInSql++; return; }
    seen[sql.token] = true;
    if (old.trainingId !== sql.trainingId || old.targetType !== sql.targetType || old.targetId !== sql.targetId) {
      result.identityDifferences++;
    }
    if (old.active !== sql.active || old.used !== !!sql.usedAt || old.checkinId !== String(sql.checkinId || "") || old.note !== String(sql.note || "")) {
      result.stateDifferences++;
    }
    if (["companyName", "participantName", "email", "receptionCategory", "block", "branch"].some(function(key) {
      return old[key] !== String(sql[key] || "");
    })) result.displayDifferences++;
    ["memberNo", "personalId", "plannedId"].forEach(function(key) {
      if (old[key] && !sql[key]) result.omittedReferenceFields++;
    });
  });
  Object.keys(source).forEach(function(token) { if (!seen[token]) result.missingInSql++; });
  result.ok = !result.missingInSql && !result.extraInSql && !result.identityDifferences &&
    !result.stateDifferences && !result.displayDifferences;
  console.log(JSON.stringify(result));
  return result;
}

function isSqlLocationCheckinTokenReadEnabled_() {
  return isSqlDataRuntime_();
}

function findSqlLocationCheckinToken_(token) {
  const targetToken = String(token || "").trim();
  if (!targetToken) return null;
  if (!isSqlLocationCheckinTokenReadEnabled_()) return findLocationCheckinTokenRow_(targetToken);
  const data = locationCheckinSqlRequest_(
    "query ReadLocationCheckinToken($token:String!){locationCheckinToken(key:{token:$token}){token trainingId targetType targetId memberNo personalId plannedId companyName participantName receptionCategory block branch active usedAt}}",
    { token: targetToken }, false
  );
  const row = data.locationCheckinToken;
  if (!row || row.active !== true) return null;
  return {
    token: row.token,
    eventId: row.trainingId,
    targetType: row.targetType || "会員",
    memberNo: row.memberNo || (row.targetType === "会員" ? row.targetId : ""),
    personalId: row.personalId || (row.targetType === "個人会員" ? row.targetId : ""),
    plannedId: row.plannedId || (row.targetType === "当日予定者" ? row.targetId : ""),
    companyName: row.companyName || "",
    participantName: row.participantName || "",
    receptionCategory: row.receptionCategory || "",
    block: row.block || "",
    branch: row.branch || "",
    usedAt: row.usedAt ? formatDateTimeForClient_(new Date(row.usedAt)) : ""
  };
}

function verifySqlLocationCheckinTokenReadCutover() {
  if (!isSqlLocationCheckinTokenReadEnabled_()) throw new Error("SQL読取確認は開発環境に限定されています。");
  const sheet = getSpreadsheet_().getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
  const result = { ok: true, checked: 0, resolved: 0, identityDifferences: 0, stateDifferences: 0, tokenValuesReturned: 0, mailsSent: 0 };
  if (!sheet || sheet.getLastRow() < 2) return result;
  const headerMap = getHeaderMap_(sheet);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const old = values[i];
    const token = String(getCellByHeader_(old, headerMap, "トークン") || "").trim();
    const targetType = String(getCellByHeader_(old, headerMap, "受付対象区分") || "会員").trim() || "会員";
    const expectedTarget = targetType === "当日予定者"
      ? String(getCellByHeader_(old, headerMap, "予定者ID") || "").trim()
      : targetType === "個人会員"
        ? String(getCellByHeader_(old, headerMap, "個人ID") || "").trim()
        : normalizeMemberNo_(getCellByHeader_(old, headerMap, "業者番号"));
    const sql = findSqlLocationCheckinToken_(token);
    result.checked++;
    if (!sql) continue;
    result.resolved++;
    const actualTarget = targetType === "当日予定者" ? sql.plannedId : targetType === "個人会員" ? sql.personalId : sql.memberNo;
    if (sql.eventId !== String(getCellByHeader_(old, headerMap, "研修ID") || "").trim() || sql.targetType !== targetType || actualTarget !== expectedTarget) {
      result.identityDifferences++;
    }
    if (!!sql.usedAt !== !!getCellByHeader_(old, headerMap, "使用日時")) result.stateDifferences++;
  }
  result.ok = result.checked === result.resolved && !result.identityDifferences && !result.stateDifferences;
  console.log(JSON.stringify(result));
  return result;
}

function ensureSqlLocationCheckinToken_(token, training, targetType, targetId, values) {
  if (!isSqlLocationCheckinTokenReadEnabled_()) return token;
  const eventId = String(training && training.eventId || "").trim();
  targetId = String(targetId || "").trim();
  if (!eventId || !targetType || !targetId) throw new Error("位置情報受付対象を確認できません。");
  const found = locationCheckinSqlRequest_(
    "query ExistingLocationToken($trainingId:String!,$targetType:String!,$targetId:String!){" +
      "tokens:locationCheckinTokens(where:{trainingId:{eq:$trainingId},targetType:{eq:$targetType}," +
      "targetId:{eq:$targetId},active:{eq:true}},limit:2){token}}",
    {trainingId:eventId,targetType:targetType,targetId:targetId}, false
  ).tokens || [];
  if (found.length > 1) throw new Error("位置情報受付URLが重複しています。");
  if (found.length === 1) return found[0].token;
  const now = new Date().toISOString();
  locationCheckinSqlRequest_(
    "mutation CreateLocationToken($token:String!,$trainingId:String!,$targetType:String!,$targetId:String!," +
      "$memberNo:String,$personalId:String,$plannedId:String,$companyName:String,$participantName:String," +
      "$email:String,$receptionCategory:String,$block:String,$branch:String,$now:Timestamp!){" +
      "locationCheckinToken_insert(data:{token:$token,trainingId:$trainingId,targetType:$targetType,targetId:$targetId," +
      "memberNo:$memberNo,personalId:$personalId,plannedId:$plannedId,companyName:$companyName," +
      "participantName:$participantName,email:$email,receptionCategory:$receptionCategory,block:$block,branch:$branch," +
      "active:true,revision:1,createdAt:$now,updatedAt:$now})}",
    {token:token,trainingId:eventId,targetType:targetType,targetId:targetId,
      memberNo:values.memberNo||null,personalId:values.personalId||null,plannedId:values.plannedId||null,
      companyName:values.companyName||"",participantName:values.participantName||"",email:values.mail||values.email||"",
      receptionCategory:values.receptionCategory||"",block:values.block||"",branch:values.branch||"",now:now}, true
  );
  return token;
}

function getOrCreateLocationCheckinToken_(
  training,
  member
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const eventId =
    String(training.eventId || "").trim();

  const memberNo =
    normalizeMemberNo_(member.memberNo);

  if (!eventId || !memberNo) {
    return "";
  }

  if (isSqlLocationCheckinTokenReadEnabled_()) {
    return ensureSqlLocationCheckinToken_(
      createLocationCheckinTokenValue_(), training, "会員", memberNo, member
    );
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowMemberNo =
      normalizeMemberNo_(
        getCellByHeader_(values[i], headerMap, "業者番号")
      );

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowMemberNo === memberNo &&
      active !== "FALSE" &&
      token
    ) {
      const sqlToken = ensureSqlLocationCheckinToken_(token, training, "会員", memberNo, member);
      if (sqlToken !== token) sheet.getRange(i + 1, headerMap["トークン"] + 1).setValue(sqlToken);
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(member.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(member.mail || "");
      return sqlToken;
    }
  }

  const token = ensureSqlLocationCheckinToken_(
    createLocationCheckinTokenValue_(), training, "会員", memberNo, member
  );

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = memberNo;
  row[headerMap["会社名"]] = member.companyName || "";
  row[headerMap["メール"]] = member.mail || "";
  if (headerMap["受付対象区分"] !== undefined) {
    row[headerMap["受付対象区分"]] = "会員";
  }
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getOrCreateLocationCheckinTokenForPlanned_(
  training,
  attendee
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const eventId =
    String(training.eventId || "").trim();

  const plannedId =
    String(attendee.plannedId || "").trim();

  if (!eventId || !plannedId) {
    return "";
  }

  if (isSqlLocationCheckinTokenReadEnabled_()) {
    return ensureSqlLocationCheckinToken_(
      createLocationCheckinTokenValue_(), training, "当日予定者", plannedId, attendee
    );
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowPlannedId =
      String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim();

    const targetType =
      String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim();

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowPlannedId === plannedId &&
      targetType === "当日予定者" &&
      active !== "FALSE" &&
      token
    ) {
      const sqlToken = ensureSqlLocationCheckinToken_(token, training, "当日予定者", plannedId, attendee);
      if (sqlToken !== token) sheet.getRange(i + 1, headerMap["トークン"] + 1).setValue(sqlToken);
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(attendee.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(attendee.mail || "");
      sheet.getRange(i + 1, headerMap["参加者名"] + 1).setValue(attendee.participantName || "");
      sheet.getRange(i + 1, headerMap["受付区分"] + 1).setValue(attendee.receptionCategory || "");
      sheet.getRange(i + 1, headerMap["ブロック"] + 1).setValue(attendee.block || "");
      sheet.getRange(i + 1, headerMap["支部"] + 1).setValue(attendee.branch || "");
      return sqlToken;
    }
  }

  const token = ensureSqlLocationCheckinToken_(
    createLocationCheckinTokenValue_(), training, "当日予定者", plannedId, attendee
  );

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = "";
  row[headerMap["会社名"]] = attendee.companyName || "";
  row[headerMap["メール"]] = attendee.mail || "";
  row[headerMap["受付対象区分"]] = "当日予定者";
  row[headerMap["予定者ID"]] = plannedId;
  row[headerMap["参加者名"]] = attendee.participantName || "";
  row[headerMap["受付区分"]] = attendee.receptionCategory || "";
  row[headerMap["ブロック"]] = attendee.block || "";
  row[headerMap["支部"]] = attendee.branch || "";
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getOrCreateLocationCheckinTokenForPersonal_(
  training,
  person
) {

  if (!isLocationCheckinEnabled_(training)) {
    return "";
  }

  const eventId =
    String(training.eventId || "").trim();

  const personalId =
    String(person.personalId || "").trim();

  if (!eventId || !personalId) {
    return "";
  }

  if (isSqlLocationCheckinTokenReadEnabled_()) {
    return ensureSqlLocationCheckinToken_(
      createLocationCheckinTokenValue_(), training, "個人会員", personalId, person
    );
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  const now =
    new Date();

  for (let i = 1; i < values.length; i++) {

    const rowEventId =
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim();

    const rowPersonalId =
      String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim();

    const targetType =
      String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim();

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    const token =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (
      rowEventId === eventId &&
      rowPersonalId === personalId &&
      targetType === "個人会員" &&
      active !== "FALSE" &&
      token
    ) {
      const sqlToken = ensureSqlLocationCheckinToken_(token, training, "個人会員", personalId, person);
      if (sqlToken !== token) sheet.getRange(i + 1, headerMap["トークン"] + 1).setValue(sqlToken);
      sheet.getRange(i + 1, headerMap["更新日時"] + 1).setValue(now);
      sheet.getRange(i + 1, headerMap["業者番号"] + 1).setValue(person.memberNo || "");
      sheet.getRange(i + 1, headerMap["会社名"] + 1).setValue(person.companyName || "");
      sheet.getRange(i + 1, headerMap["メール"] + 1).setValue(person.mail || "");
      sheet.getRange(i + 1, headerMap["参加者名"] + 1).setValue(person.participantName || person.personName || "");
      return sqlToken;
    }
  }

  const token = ensureSqlLocationCheckinToken_(
    createLocationCheckinTokenValue_(), training, "個人会員", personalId, person
  );

  const row =
    new Array(sheet.getLastColumn()).fill("");

  row[headerMap["作成日時"]] = now;
  row[headerMap["更新日時"]] = now;
  row[headerMap["トークン"]] = token;
  row[headerMap["研修ID"]] = eventId;
  row[headerMap["業者番号"]] = person.memberNo || "";
  row[headerMap["会社名"]] = person.companyName || "";
  row[headerMap["メール"]] = person.mail || "";
  row[headerMap["受付対象区分"]] = "個人会員";
  row[headerMap["個人ID"]] = personalId;
  row[headerMap["参加者名"]] = person.participantName || person.personName || "";
  row[headerMap["有効"]] = "TRUE";

  sheet.appendRow(row);

  return token;
}

function getLocationCheckinTokenSheet_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);

  if (!sheet) {
    sheet =
      ss.insertSheet(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
  }

  ensureHeaders_(
    sheet,
    LOCATION_CHECKIN_TOKEN_HEADERS_
  );

  return sheet;
}

function createLocationCheckinTokenValue_() {

  return Utilities
    .getUuid()
    .replace(/-/g, "") +
    Utilities
      .getUuid()
      .replace(/-/g, "")
      .substring(0, 12);
}

function isLocationCheckinEnabled_(training) {

  return training &&
    (
      training.locationCheckEnabled === true ||
      String(training.locationCheckEnabled || "").toUpperCase() === "TRUE"
    );
}

function buildLocationCheckinUrl_(
  training,
  member
) {

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return "";
  }

  const token =
    shouldUsePersonalLocationCheckin_(
      training,
      member
    )
      ? getOrCreateLocationCheckinTokenForPersonal_(
          training,
          member
        )
      : getOrCreateLocationCheckinToken_(
          training,
          member
        );

  if (!token) {
    return "";
  }

  return getCheckinWebUrl_() +
    "/location-checkin.html?token=" +
    encodeURIComponent(token);
}

function shouldUsePersonalLocationCheckin_(
  training,
  member
) {

  return String(training && training.attendanceUnit || "会社").trim() === "個人" &&
    !!(member && member.personalId);
}

function buildPlannedLocationCheckinUrl_(
  training,
  attendee
) {

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return "";
  }

  const token =
    getOrCreateLocationCheckinTokenForPlanned_(
      training,
      attendee
    );

  if (!token) {
    return "";
  }

  return getCheckinWebUrl_() +
    "/location-checkin.html?token=" +
    encodeURIComponent(token);
}

function getLocationCheckinTokenJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const token =
    String(e.parameter.token || "").trim();

  let result;

  try {
    result =
      getLocationCheckinTokenInfo_(
        token
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

function registerLocationCheckinJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      registerLocationCheckin_(
        e.parameter
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

function getDemoLocationMailJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {
    result =
      getDemoLocationMail_(
        e.parameter
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

function getDemoLocationMail_(
  params
) {

  const eventId =
    String(params.event || "2026-015").trim();

  const memberNo =
    normalizeMemberNo_(
      params.member
    );

  if (!eventId) {
    throw new Error("研修IDが指定されていません。");
  }

  if (!memberNo) {
    throw new Error("業者番号が指定されていません。");
  }

  const training =
    findTrainingById_(
      eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません: " + eventId);
  }

  const member =
    findMemberByNo_(
      memberNo
    );

  if (!member) {
    throw new Error("会員情報が見つかりません: " + memberNo);
  }

  const locationUrl =
    buildLocationCheckinUrl_(
      training,
      member
    );

  if (!locationUrl) {
    throw new Error("位置情報受付URLを作成できませんでした。研修会の位置情報受付設定と会場マスタを確認してください。");
  }

  const timeWindow =
    getLocationCheckinTimeWindow_(
      training
    );

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      body: training.body || "",
      locationCheckinStart: formatDateTimeForClient_(timeWindow.start),
      locationCheckinEnd: formatDateTimeForClient_(timeWindow.end)
    },
    member: {
      memberNo: member.memberNo,
      companyName: member.companyName,
      branch: member.branch || "",
      district: member.district || ""
    },
    locationUrl: locationUrl,
    signatureBody: getMailSignatureBodyById_(
      training.mailSignatureId
    )
  };
}

function getLocationCheckinTokenInfo_(
  token
) {

  const tokenRow =
    findSqlLocationCheckinToken_(
      token
    );

  if (!tokenRow) {
    return {
      ok: false,
      message: "受付URLを確認できませんでした。"
    };
  }

  const training =
    findTrainingById_(
      tokenRow.eventId
    );

  if (!training) {
    return {
      ok: false,
      message: "研修会が見つかりません。"
    };
  }

  if (!isLocationCheckinEnabled_(training)) {
    return {
      ok: false,
      message: "この研修会では位置情報受付を使用しない設定です。"
    };
  }

  const timeWindow =
    getLocationCheckinTimeWindow_(
      training
    );

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    return {
      ok: false,
      message: "会場の位置情報が登録されていません。"
    };
  }

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      hostType: training.hostType,
      locationCheckinStart: formatDateTimeForClient_(timeWindow.start),
      locationCheckinEnd: formatDateTimeForClient_(timeWindow.end)
    },
    member: {
      memberNo: tokenRow.memberNo,
      companyName: tokenRow.companyName,
      personalId: tokenRow.personalId,
      participantName: tokenRow.participantName,
      receptionCategory: tokenRow.receptionCategory,
      targetType: tokenRow.targetType
    },
    venue: {
      venueName: venue.venueName,
      venueAddress: venue.venueAddress,
      latitude: venue.latitude,
      longitude: venue.longitude,
      geoRadius: venue.geoRadius || "200"
    },
    usedAt: tokenRow.usedAt
  };
}

function registerLocationCheckin_(
  params
) {

  const token =
    String(params.token || "").trim();

  const latitude =
    Number(params.latitude || "");

  const longitude =
    Number(params.longitude || "");

  if (!token) {
    throw new Error("受付トークンがありません。");
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error("位置情報を取得できませんでした。");
  }

  const tokenRow =
    isSqlLocationCheckinTokenReadEnabled_()
      ? findSqlLocationCheckinToken_(token)
      : findLocationCheckinTokenRow_(token);

  if (!tokenRow) {
    throw new Error("受付URLを確認できませんでした。");
  }

  const training =
    findTrainingById_(
      tokenRow.eventId
    );

  if (!training) {
    throw new Error("研修会が見つかりません。");
  }

  if (!isLocationCheckinEnabled_(training)) {
    throw new Error("この研修会では位置情報受付を使用しない設定です。");
  }

  const timeCheck =
    checkLocationCheckinTime_(
      training,
      new Date()
    );

  if (!timeCheck.ok) {
    return timeCheck;
  }

  const venue =
    getVenueMasterById_(
      training.venueId
    );

  if (!venue || !venue.latitude || !venue.longitude) {
    throw new Error("会場の位置情報が登録されていません。");
  }

  const distance =
    calculateDistanceMeters_(
      latitude,
      longitude,
      Number(venue.latitude),
      Number(venue.longitude)
    );

  const radius =
    Number(venue.geoRadius || 200);

  if (distance > radius) {
    return {
      ok: false,
      message: "会場から離れているため受付できません。",
      distance: Math.round(distance),
      radius: radius,
      venueName: venue.venueName || ""
    };
  }

  const result =
    isSqlLocationCheckinTokenReadEnabled_()
      ? registerSqlLocationCheckin_(training, tokenRow, token, new Date())
      : tokenRow.targetType === "当日予定者"
      ? checkinPlannedAttendee_(
          training.eventId,
          tokenRow.plannedId,
          "位置情報受付",
          {
            verificationStatus: "受付トークン照合済み",
            locationToken: token,
            latitude: latitude,
            longitude: longitude,
            distanceMeters: Math.round(distance)
          }
        )
      : tokenRow.targetType === "個人会員"
        ? registerCheckin(
            training.eventId,
            "PERSONAL:" + tokenRow.personalId,
            "位置情報受付",
            {
              receptionCategory: "第十ブロック会員",
              verificationStatus: "受付トークン照合済み",
              locationToken: token,
              latitude: latitude,
              longitude: longitude,
              distanceMeters: Math.round(distance)
            }
          )
      : registerCheckin(
          training.eventId,
          "MEMBER:" + tokenRow.memberNo,
          "位置情報受付",
          {
            receptionCategory: "第十ブロック会員",
            verificationStatus: "受付トークン照合済み",
            locationToken: token,
            latitude: latitude,
            longitude: longitude,
            distanceMeters: Math.round(distance)
          }
        );

  markLocationCheckinTokenUsed_(
    tokenRow,
    result
  );

  result.distance =
    Math.round(distance);

  result.radius =
    radius;

  result.venueName =
    venue.venueName || "";

  return result;
}

function registerSqlLocationCheckin_(training, tokenRow, token, checkedAt) {
  const personalId = String(tokenRow.personalId || "").trim();
  const memberNo = String(tokenRow.memberNo || "").trim();
  if (!memberNo || (String(training.attendanceUnit || "").trim() === "個人" && !personalId)) {
    throw new Error("位置情報受付対象の会員情報を確認できません。");
  }
  const attendanceUnit = personalId ? "PERSONAL" : "COMPANY";
  const targetId = personalId || memberNo;
  const checkinId = String(training.eventId) + ":" + attendanceUnit + ":" + targetId;
  const current = locationCheckinSqlRequest_(
    "query LocationCheckinState($token:String!,$checkinId:String!){locationCheckinToken(key:{token:$token}){token revision usedAt} checkin(key:{checkinId:$checkinId}){checkinId cancelled checkedInAt}}",
    { token: token, checkinId: checkinId }, false
  );
  if (!current.locationCheckinToken) throw new Error("SQLに位置情報受付URLがありません。");
  if (current.locationCheckinToken.usedAt) throw new Error("この位置情報受付URLは使用済みです。");
  if (current.checkin && !current.checkin.cancelled) {
    markSqlLocationCheckinTokenUsed_(token, { ok: true, message: "既に受付済みです", checkinId: checkinId }, checkedAt);
    return { ok: true, message: "既に受付済みです", checkinId: checkinId, checkedAt: formatDateTimeForClient_(new Date(current.checkin.checkedInAt)) };
  }
  if (current.checkin && current.checkin.cancelled) {
    const variables = {
      token: token, revision: current.locationCheckinToken.revision,
      nextRevision: current.locationCheckinToken.revision + 1,
      usedAt: locationCheckinMigrationTimestamp_(checkedAt, new Date()),
      checkinId: checkinId
    };
    locationCheckinSqlRequest_(
      "mutation RestoreLocationCheckin($token:String!,$revision:Int!,$nextRevision:Int!,$usedAt:Timestamp!,$checkinId:String!) @transaction {changed:locationCheckinToken_updateMany(where:{token:{eq:$token},revision:{eq:$revision},usedAt:{isNull:true}},data:{usedAt:$usedAt,checkinId:$checkinId,note:\"再受付完了\",revision:$nextRevision,updatedAt_expr:\"request.time\"}) @check(expr:\"this == 1\",message:\"位置情報受付URLの状態が更新されています。\") restored:checkin_updateMany(where:{checkinId:{eq:$checkinId},cancelled:{eq:true}},data:{cancelled:false,restoredAt:$usedAt,restoredBy:\"位置情報再受付\",restoreReason:\"参加者による再受付\",checkinMethod:\"位置情報受付\",checkedInAt:$usedAt}) @check(expr:\"this == 1\",message:\"取消済み受付を復活できませんでした。\")}",
      variables, true
    );
    return { ok: true, message: "受付完了", checkinId: checkinId, checkedAt: formatDateTimeForClient_(checkedAt) };
  }
  const variables = {
    token: token,
    revision: current.locationCheckinToken.revision,
    nextRevision: current.locationCheckinToken.revision + 1,
    usedAt: locationCheckinMigrationTimestamp_(checkedAt, new Date()),
    checkinId: checkinId,
    trainingId: String(training.eventId),
    memberNo: memberNo,
    personalId: personalId || null,
    attendanceUnit: attendanceUnit,
    targetId: targetId
  };
  locationCheckinSqlRequest_(
    "mutation RegisterLocationCheckin($token:String!,$revision:Int!,$nextRevision:Int!,$usedAt:Timestamp!,$checkinId:String!,$trainingId:String!,$memberNo:String!,$personalId:String,$attendanceUnit:String!,$targetId:String!) @transaction {changed:locationCheckinToken_updateMany(where:{token:{eq:$token},revision:{eq:$revision},usedAt:{isNull:true}},data:{usedAt:$usedAt,checkinId:$checkinId,note:\"受付完了\",revision:$nextRevision,updatedAt_expr:\"request.time\"}) @check(expr:\"this == 1\",message:\"位置情報受付URLの状態が更新されています。\") checkin_insert(data:{checkinId:$checkinId,trainingId:$trainingId,memberNo:$memberNo,personalId:$personalId,attendanceUnit:$attendanceUnit,targetId:$targetId,checkinMethod:\"位置情報受付\",cancelled:false})}",
    variables, true
  );
  return { ok: true, message: "受付完了", checkinId: checkinId, checkedAt: formatDateTimeForClient_(checkedAt) };
}

function checkLocationCheckinTime_(
  training,
  now
) {

  const window =
    getLocationCheckinTimeWindow_(
      training
    );

  if (!window.start || !window.end) {
    return {
      ok: false,
      message: "位置情報受付の利用時間を確認できませんでした。"
    };
  }

  if (now < window.start) {
    return {
      ok: false,
      message: "位置情報受付の開始前です。",
      startsAt: formatDateTimeForClient_(window.start),
      endsAt: formatDateTimeForClient_(window.end)
    };
  }

  if (now > window.end) {
    return {
      ok: false,
      message: "位置情報受付の終了後です。",
      startsAt: formatDateTimeForClient_(window.start),
      endsAt: formatDateTimeForClient_(window.end)
    };
  }

  return {
    ok: true,
    startsAt: formatDateTimeForClient_(window.start),
    endsAt: formatDateTimeForClient_(window.end)
  };
}

function getLocationCheckinTimeWindow_(
  training
) {

  const start =
    parseLocationDateTime_(
      training.locationCheckinStart
    ) ||
    parseLocationDateTimeFromTrainingTime_(
      training.eventDate,
      training.startTime,
      -30
    ) ||
    parseLocationDateTimeFromEventDate_(
      training.eventDate,
      "00:00"
    );

  const end =
    parseLocationDateTime_(
      training.locationCheckinEnd
    ) ||
    parseLocationDateTimeFromTrainingTime_(
      training.eventDate,
      training.endTime,
      120
    ) ||
    parseLocationDateTimeFromEventDate_(
      training.eventDate,
      "23:59"
    );

  return {
    start: start,
    end: end
  };
}

function parseLocationDateTime_(
  value
) {

  if (!value) {
    return null;
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value;
  }

  const text =
    String(value || "").trim();

  if (!text) {
    return null;
  }

  const normalized =
    text
      .replace(/\//g, "-")
      .replace(" ", "T");

  const date =
    new Date(normalized);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseLocationDateTimeFromTrainingTime_(
  eventDate,
  timeValue,
  offsetMinutes
) {

  const timeText =
    parseLocationTimeText_(
      timeValue
    );

  if (!timeText) {
    return null;
  }

  const date =
    parseLocationDateTimeFromEventDate_(
      eventDate,
      timeText
    );

  if (!date) {
    return null;
  }

  date.setMinutes(
    date.getMinutes() + Number(offsetMinutes || 0)
  );

  return date;
}

function parseLocationTimeText_(
  value
) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "HH:mm"
    );
  }

  const text =
    String(value || "").trim();

  const match =
    text.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return "";
  }

  return String(match[1]).padStart(2, "0") +
    ":" +
    match[2];
}

function parseLocationDateTimeFromEventDate_(
  eventDate,
  timeText,
  addDays
) {

  const dateText =
    String(eventDate || "")
      .replace(/\//g, "-")
      .substring(0, 10);

  if (!dateText) {
    return null;
  }

  const date =
    new Date(dateText + "T" + timeText + ":00+09:00");

  if (isNaN(date.getTime())) {
    return null;
  }

  if (addDays) {
    date.setDate(
      date.getDate() + Number(addDays)
    );
  }

  return date;
}

function findLocationCheckinTokenRow_(
  token
) {

  const targetToken =
    String(token || "").trim();

  if (!targetToken) {
    return null;
  }

  const sheet =
    getLocationCheckinTokenSheet_();

  const headerMap =
    getHeaderMap_(sheet);

  const values =
    sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {

    const rowToken =
      String(getCellByHeader_(values[i], headerMap, "トークン") || "").trim();

    if (rowToken !== targetToken) {
      continue;
    }

    const active =
      String(getCellByHeader_(values[i], headerMap, "有効") || "TRUE").toUpperCase();

    if (active === "FALSE") {
      return null;
    }

    return {
      sheet: sheet,
      rowNo: i + 1,
      headerMap: headerMap,
      token: rowToken,
      eventId: String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim(),
      memberNo: normalizeMemberNo_(getCellByHeader_(values[i], headerMap, "業者番号")),
      companyName: String(getCellByHeader_(values[i], headerMap, "会社名") || "").trim(),
      mail: String(getCellByHeader_(values[i], headerMap, "メール") || "").trim(),
      targetType: String(getCellByHeader_(values[i], headerMap, "受付対象区分") || "").trim() || "会員",
      plannedId: String(getCellByHeader_(values[i], headerMap, "予定者ID") || "").trim(),
      personalId: String(getCellByHeader_(values[i], headerMap, "個人ID") || "").trim(),
      participantName: String(getCellByHeader_(values[i], headerMap, "参加者名") || "").trim(),
      receptionCategory: String(getCellByHeader_(values[i], headerMap, "受付区分") || "").trim(),
      block: String(getCellByHeader_(values[i], headerMap, "ブロック") || "").trim(),
      branch: String(getCellByHeader_(values[i], headerMap, "支部") || "").trim(),
      usedAt: formatDateTimeForClient_(getCellByHeader_(values[i], headerMap, "使用日時"))
    };
  }

  return null;
}

function markLocationCheckinTokenUsed_(
  tokenRow,
  result
) {

  if (!tokenRow || !tokenRow.sheet) {
    return;
  }

  const now =
    new Date();

  const sheet =
    tokenRow.sheet;

  const headerMap =
    tokenRow.headerMap;

  sheet.getRange(tokenRow.rowNo, headerMap["更新日時"] + 1).setValue(now);

  if (result && result.ok) {
    sheet.getRange(tokenRow.rowNo, headerMap["使用日時"] + 1).setValue(now);
  }

  if (result && result.historyRowNo && headerMap["参加履歴行番号"] !== undefined) {
    sheet.getRange(tokenRow.rowNo, headerMap["参加履歴行番号"] + 1).setValue(result.historyRowNo);
  }

  if (headerMap["備考"] !== undefined) {
    sheet.getRange(tokenRow.rowNo, headerMap["備考"] + 1).setValue(result && result.message ? result.message : "");
  }

  if (result && result.ok && isSqlLocationCheckinTokenReadEnabled_()) {
    try {
      markSqlLocationCheckinTokenUsed_(tokenRow.token, result, now);
    } catch (_error) {
      // Reception has already succeeded in the legacy source of truth. Never
      // turn that participant-facing success into an error because SQL lagged.
      PropertiesService.getScriptProperties().setProperty("LOCATION_TOKEN_SQL_SYNC_PENDING", now.toISOString());
      console.error("位置情報受付トークンのSQL同期が保留されました。再同期を実行してください。");
    }
  }
}

function markSqlLocationCheckinTokenUsed_(token, result, usedAt) {
  const current = locationCheckinSqlRequest_(
    "query SqlLocationTokenState($token:String!){locationCheckinToken(key:{token:$token}){token revision usedAt}}",
    { token: String(token || "").trim() }, false
  ).locationCheckinToken;
  if (!current) throw new Error("SQLに位置情報受付トークンがありません。");
  if (current.usedAt) return { updated: false, alreadyUsed: true };
  const variables = {
    token: current.token,
    revision: current.revision,
    nextRevision: current.revision + 1,
    usedAt: locationCheckinMigrationTimestamp_(usedAt, new Date()),
    checkinId: result && result.historyRowNo ? String(result.historyRowNo) : null,
    note: result && result.message ? String(result.message) : null
  };
  locationCheckinSqlRequest_(
    "mutation SyncLocationTokenUse($token:String!,$revision:Int!,$nextRevision:Int!,$usedAt:Timestamp!,$checkinId:String,$note:String) @transaction {changed:locationCheckinToken_updateMany(where:{token:{eq:$token},revision:{eq:$revision},usedAt:{isNull:true}},data:{usedAt:$usedAt,checkinId:$checkinId,note:$note,revision:$nextRevision,updatedAt_expr:\"request.time\"}) @check(expr:\"this == 1\",message:\"位置情報受付トークンの状態が更新されています。\")}",
    variables, true
  );
  return { updated: true, alreadyUsed: false };
}

function reconcileLocationCheckinTokenUsageToSql() {
  if (!isSqlLocationCheckinTokenReadEnabled_()) throw new Error("SQL再同期は開発環境に限定されています。");
  const sheet = getSpreadsheet_().getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
  const summary = { ok: true, legacyUsed: 0, updated: 0, alreadyUsed: 0, failed: 0, tokenValuesReturned: 0, mailsSent: 0 };
  if (!sheet || sheet.getLastRow() < 2) return summary;
  const headerMap = getHeaderMap_(sheet);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const usedAt = getCellByHeader_(row, headerMap, "使用日時");
    if (!usedAt) continue;
    summary.legacyUsed++;
    try {
      const synced = markSqlLocationCheckinTokenUsed_(
        String(getCellByHeader_(row, headerMap, "トークン") || "").trim(),
        {
          historyRowNo: getCellByHeader_(row, headerMap, "参加履歴行番号"),
          message: String(getCellByHeader_(row, headerMap, "備考") || "")
        },
        usedAt
      );
      summary[synced.updated ? "updated" : "alreadyUsed"]++;
    } catch (_error) {
      summary.failed++;
    }
  }
  summary.ok = summary.failed === 0;
  const properties = PropertiesService.getScriptProperties();
  if (summary.ok) properties.deleteProperty("LOCATION_TOKEN_SQL_SYNC_PENDING");
  else properties.setProperty("LOCATION_TOKEN_SQL_SYNC_PENDING", new Date().toISOString());
  console.log(JSON.stringify(summary));
  return summary;
}

function testOneUnusedLocationCheckinDualSync() {
  if (!isSqlLocationCheckinTokenReadEnabled_()) throw new Error("二重同期テストは開発環境に限定されています。");
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSpreadsheet_().getSheetByName(LOCATION_CHECKIN_TOKEN_SHEET_NAME_);
    const result = { ok: false, eligible: 0, tested: 0, receptionSucceeded: 0, legacyUsed: 0, sqlUsed: 0, identityMatched: 0, eventId: "", targetType: "", tokenValuesReturned: 0, mailsSent: 0 };
    if (!sheet || sheet.getLastRow() < 2) return result;
    const headerMap = getHeaderMap_(sheet);
    const values = sheet.getDataRange().getValues();
    const candidates = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (getCellByHeader_(row, headerMap, "使用日時")) continue;
      if (String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() === "FALSE") continue;
      const eventId = String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();
      const training = findTrainingById_(eventId);
      if (!training || !isLocationCheckinEnabled_(training) || !checkLocationCheckinTime_(training, new Date()).ok) continue;
      const venue = getVenueMasterById_(training.venueId);
      if (!venue || !venue.latitude || !venue.longitude) continue;
      candidates.push({ rowNo: i + 1, token: String(getCellByHeader_(row, headerMap, "トークン") || "").trim(), eventId: eventId, targetType: String(getCellByHeader_(row, headerMap, "受付対象区分") || "会員").trim() || "会員", latitude: Number(venue.latitude), longitude: Number(venue.longitude) });
    }
    result.eligible = candidates.length;
    if (!candidates.length) {
      result.message = "現在の受付時間内にある未使用の開発用URLはありません。";
      console.log(JSON.stringify(result));
      return result;
    }
    const candidate = candidates[0];
    const reception = registerLocationCheckin_({ token: candidate.token, latitude: candidate.latitude, longitude: candidate.longitude });
    result.tested = 1;
    result.receptionSucceeded = reception && reception.ok ? 1 : 0;
    result.eventId = candidate.eventId;
    result.targetType = candidate.targetType;
    const legacy = findLocationCheckinTokenRow_(candidate.token);
    const sql = findSqlLocationCheckinToken_(candidate.token);
    result.legacyUsed = legacy && legacy.usedAt ? 1 : 0;
    result.sqlUsed = sql && sql.usedAt ? 1 : 0;
    result.identityMatched = legacy && sql && legacy.eventId === sql.eventId && legacy.targetType === sql.targetType ? 1 : 0;
    result.ok = result.receptionSucceeded === 1 && result.legacyUsed === 1 && result.sqlUsed === 1 && result.identityMatched === 1;
    console.log(JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function calculateDistanceMeters_(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const rad =
    Math.PI / 180;

  const r =
    6371000;

  const dLat =
    (lat2 - lat1) * rad;

  const dLon =
    (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
    Math.cos(lat2 * rad) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
