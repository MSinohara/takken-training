const ATTENDANCE_ITEM_SHEET_NAME_ =
  "出欠項目";

const ATTENDANCE_RESPONSE_SHEET_NAME_ =
  "出欠回答";

const ATTENDANCE_ITEM_HEADERS_ = [
  "項目ID",
  "研修ID",
  "項目名",
  "回答形式",
  "選択肢",
  "対象区分",
  "個別対象キー",
  "有効",
  "表示順",
  "作成日時",
  "更新日時"
];

const ATTENDANCE_RESPONSE_HEADERS_ = [
  "回答ID",
  "研修ID",
  "回答者キー",
  "業者番号",
  "個人ID",
  "会社名",
  "参加者名",
  "メール",
  "回答JSON",
  "備考",
  "回答日時",
  "更新日時"
];

function getAttendanceConfigJsonp_(e) {

  const training =
    findTrainingById_(e.parameter.event || "");

  return authJsonpOutput_(e, {
    ok: true,
    training: training,
    items: getAttendanceItems_(e.parameter.event || "", true),
    organizations: getActiveAttendanceOrganizations_(),
    targetMembers: training
      ? getAttendanceTargetRespondents_(
          training
        )
      : []
  });
}

function saveAttendanceConfigJsonp_(e) {

  let result;

  try {
    result =
      saveAttendanceConfig_(
        e.parameter
      );
  } catch (err) {
    result = {
      ok: false,
      message: err.message
    };
  }

  return authJsonpOutput_(e, result);
}

function getAttendanceResponsesJsonp_(e) {

  let result;

  try {
    result =
      getAttendanceResponses_(
        e.parameter.event || ""
      );
  } catch (err) {
    result = {
      ok: false,
      message: err.message
    };
  }

  return authJsonpOutput_(e, result);
}

function getAttendanceListJsonp_(e) {

  let result;

  try {
    result =
      getAttendanceList_(
        e.parameter
      );
  } catch (err) {
    result = {
      ok: false,
      message: err.message
    };
  }

  return authJsonpOutput_(e, result);
}

function getAttendanceAnswerJsonp_(e) {

  let result;

  try {
    result =
      getAttendanceAnswer_(
        e.parameter
      );
  } catch (err) {
    result = {
      ok: false,
      message: err.message
    };
  }

  return authJsonpOutput_(e, result);
}

function saveAttendanceAnswerJsonp_(e) {

  let result;

  try {
    result =
      saveAttendanceAnswer_(
        e.parameter
      );
  } catch (err) {
    result = {
      ok: false,
      message: err.message
    };
  }

  return authJsonpOutput_(e, result);
}

function saveAttendanceConfig_(
  params
) {

  const eventId =
    String(params.event || "").trim();

  if (!eventId) {
    throw new Error("イベントIDが指定されていません。");
  }

  const training =
    findTrainingById_(eventId);

  if (!training) {
    throw new Error("イベントが見つかりません。");
  }

  let items;

  try {
    items =
      JSON.parse(
        String(params.itemsJson || "[]")
      );
  } catch (err) {
    throw new Error("出欠項目の形式を確認してください。");
  }

  const sheet =
    getOrCreateAttendanceSheet_(
      ATTENDANCE_ITEM_SHEET_NAME_,
      ATTENDANCE_ITEM_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][1] || "").trim() === eventId) {
      sheet.deleteRow(i + 1);
    }
  }

  const now =
    new Date();

  const rows = [];

  items.forEach(function(item, index) {

    const itemName =
      String(item.itemName || "").trim();

    if (!itemName) {
      return;
    }

    rows.push([
      item.itemId || createAttendanceItemId_(),
      eventId,
      itemName,
      String(item.answerType || "出欠").trim(),
      String(item.options || "出席,欠席,未定").trim(),
      String(item.targetScope || "全員").trim(),
      String(item.targetKeys || "").trim(),
      String(item.active || "TRUE").trim(),
      Number(item.displayOrder || index + 1),
      now,
      now
    ]);
  });

  if (rows.length > 0) {
    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        rows.length,
        ATTENDANCE_ITEM_HEADERS_.length
      )
      .setValues(rows);
  }

  return {
    ok: true,
    message: "出欠確認設定を保存しました。",
    count: rows.length
  };
}

function getAttendanceAnswer_(
  params
) {

  const eventId =
    String(params.event || "").trim();

  if (!eventId) {
    throw new Error("イベントIDが指定されていません。");
  }

  const training =
    findTrainingById_(eventId);

  if (!training) {
    throw new Error("イベントが見つかりません。");
  }

  const member =
    getAttendanceAnswerMember_(
      params
    );

  const respondentKey =
    buildAttendanceRespondentKey_(
      member
    );

  const items =
    filterAttendanceItemsForRespondent_(
      getAttendanceItems_(eventId, false),
      respondentKey,
      member,
      training
    );

  const response =
    getAttendanceResponseByKey_(
      eventId,
      respondentKey
    );

  const statusPublic =
    training.attendanceStatusPublic === true;

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      hostType: training.hostType
    },
    member: member,
    items: items,
    response: response,
    statusPublic: statusPublic,
    publicResponses: statusPublic
      ? getAttendancePublicResponses_(eventId)
      : []
  };
}

function getAttendancePublicResponses_(
  eventId
) {

  const result =
    getAttendanceResponses_(
      eventId
    );

  return (result.responses || []).map(function(response) {
    return {
      respondentKey: response.respondentKey,
      memberNo: response.memberNo,
      personalId: response.personalId,
      companyName: response.companyName,
      participantName: response.participantName,
      answers: response.answers || {},
      note: response.note,
      updatedAt: response.updatedAt
    };
  });
}

function saveAttendanceAnswer_(
  params
) {

  const eventId =
    String(params.event || "").trim();

  if (!eventId) {
    throw new Error("イベントIDが指定されていません。");
  }

  const training =
    findTrainingById_(eventId);

  if (!training) {
    throw new Error("イベントが見つかりません。");
  }

  const member =
    getAttendanceAnswerMember_(
      params
    );

  const respondentKey =
    buildAttendanceRespondentKey_(
      member
    );

  if (!respondentKey) {
    throw new Error("回答者を確認できません。");
  }

  let answers = {};

  try {
    answers =
      JSON.parse(
        String(params.answersJson || "{}")
      );
  } catch (err) {
    throw new Error("回答内容の形式を確認してください。");
  }

  const note =
    String(params.note || "").trim();

  const sheet =
    getOrCreateAttendanceSheet_(
      ATTENDANCE_RESPONSE_SHEET_NAME_,
      ATTENDANCE_RESPONSE_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  let rowNo = 0;

  for (let i = 1; i < values.length; i++) {
    if (
      String(getCellByHeader_(values[i], headerMap, "研修ID") || "").trim() === eventId &&
      String(getCellByHeader_(values[i], headerMap, "回答者キー") || "").trim() === respondentKey
    ) {
      rowNo =
        i + 1;
      break;
    }
  }

  const now =
    new Date();

  if (!rowNo) {
    rowNo =
      sheet.getLastRow() + 1;

    sheet.getRange(rowNo, headerMap["回答ID"] + 1).setValue(createAttendanceResponseId_());
    sheet.getRange(rowNo, headerMap["回答日時"] + 1).setValue(now);
  }

  sheet.getRange(rowNo, headerMap["研修ID"] + 1).setValue(eventId);
  sheet.getRange(rowNo, headerMap["回答者キー"] + 1).setValue(respondentKey);
  sheet.getRange(rowNo, headerMap["業者番号"] + 1).setValue(member.memberNo || "");
  sheet.getRange(rowNo, headerMap["個人ID"] + 1).setValue(member.personalId || "");
  sheet.getRange(rowNo, headerMap["会社名"] + 1).setValue(member.companyName || "");
  sheet.getRange(rowNo, headerMap["参加者名"] + 1).setValue(member.participantName || "");
  sheet.getRange(rowNo, headerMap["メール"] + 1).setValue(member.mail || "");
  sheet.getRange(rowNo, headerMap["回答JSON"] + 1).setValue(JSON.stringify(answers));
  sheet.getRange(rowNo, headerMap["備考"] + 1).setValue(note);
  sheet.getRange(rowNo, headerMap["更新日時"] + 1).setValue(now);

  return {
    ok: true,
    message: "出欠回答を保存しました。"
  };
}

function getAttendanceResponses_(
  eventId
) {

  eventId =
    String(eventId || "").trim();

  if (!eventId) {
    throw new Error("イベントIDが指定されていません。");
  }

  const training =
    findTrainingById_(eventId);

  if (!training) {
    throw new Error("イベントが見つかりません。");
  }

  const items =
    getAttendanceItems_(
      eventId,
      false
    );

  const sheet =
    getOrCreateAttendanceSheet_(
      ATTENDANCE_RESPONSE_SHEET_NAME_,
      ATTENDANCE_RESPONSE_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const responses = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "研修ID") || "").trim() !== eventId) {
      continue;
    }

    const answersJson =
      String(getCellByHeader_(row, headerMap, "回答JSON") || "{}");

    let answers = {};

    try {
      answers =
        JSON.parse(answersJson);
    } catch (err) {
      answers =
        {};
    }

    responses.push({
      responseId: String(getCellByHeader_(row, headerMap, "回答ID") || "").trim(),
      respondentKey: String(getCellByHeader_(row, headerMap, "回答者キー") || "").trim(),
      memberNo: String(getCellByHeader_(row, headerMap, "業者番号") || "").replace(".0", "").trim(),
      personalId: String(getCellByHeader_(row, headerMap, "個人ID") || "").trim(),
      companyName: String(getCellByHeader_(row, headerMap, "会社名") || "").trim(),
      participantName: String(getCellByHeader_(row, headerMap, "参加者名") || "").trim(),
      mail: String(getCellByHeader_(row, headerMap, "メール") || "").trim(),
      answers: answers,
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim(),
      answeredAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "回答日時")),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時"))
    });
  }

  const targetMembers =
    getAttendanceTargetRespondentsForItems_(
      training,
      items
    );

  const responseMap = {};

  responses.forEach(function(response) {
    if (response.respondentKey) {
      responseMap[response.respondentKey] =
        true;
    }
  });

  const answeredMembers =
    targetMembers.filter(function(member) {
      return !!responseMap[member.respondentKey];
    });

  const unansweredMembers =
    targetMembers.filter(function(member) {
      return !responseMap[member.respondentKey];
    });

  return {
    ok: true,
    training: {
      eventId: training.eventId,
      title: training.title,
      eventDate: training.eventDate,
      hostType: training.hostType
    },
    items: items,
    responses: responses,
    targetMembers: targetMembers,
    answeredMembers: answeredMembers,
    unansweredMembers: unansweredMembers,
    targetCount: targetMembers.length,
    answeredCount: answeredMembers.length,
    unansweredCount: unansweredMembers.length,
    summary: buildAttendanceResponseSummary_(items, responses)
  };
}

function getAttendanceList_(
  params
) {

  const keyword =
    String(params.keyword || "").trim().toLowerCase();

  const year =
    String(params.year || "").trim();

  const trainings =
    getActiveTrainings()
      .filter(function(training) {
        return training.attendanceConfirmEnabled === true;
      })
      .filter(function(training) {
        const trainingYear =
          getAttendanceFiscalYear_(
            training
          );

        if (!year) {
          return true;
        }

        return trainingYear === year;
      })
      .filter(function(training) {
        if (!keyword) {
          return true;
        }

        return [
          training.eventId || "",
          training.title || "",
          training.eventDate || "",
          training.hostType || "",
          training.eventType || ""
        ].join(" ").toLowerCase().indexOf(keyword) !== -1;
      });

  const list =
    trainings.map(function(training) {

      let item = {
        eventId: training.eventId,
        title: training.title,
        eventDate: training.eventDate,
        year: getAttendanceFiscalYear_(
          training
        ),
        hostType: training.hostType,
        eventType: training.eventType || "研修会",
        attendanceUnit: training.attendanceUnit || "会社",
        itemCount: 0,
        targetCount: 0,
        answeredCount: 0,
        unansweredCount: 0,
        summaries: [],
        ok: true,
        message: ""
      };

      try {
        const responses =
          getAttendanceResponses_(
            training.eventId
          );

        item.itemCount =
          (responses.items || []).length;

        item.targetCount =
          responses.targetCount || 0;

        item.answeredCount =
          responses.answeredCount || 0;

        item.unansweredCount =
          responses.unansweredCount || 0;

        item.summaries =
          responses.summary || [];

      } catch (err) {
        item.ok =
          false;

        item.message =
          err.message;
      }

      return item;
    });

  list.sort(function(a, b) {
    const dateA =
      String(a.eventDate || "");

    const dateB =
      String(b.eventDate || "");

    if (dateA === dateB) {
      return String(a.eventId || "") < String(b.eventId || "") ? 1 : -1;
    }

    return dateA < dateB ? 1 : -1;
  });

  return {
    ok: true,
    attendances: list,
    count: list.length
  };
}

function getAttendanceFiscalYear_(
  training
) {

  const eventDate =
    String(training && training.eventDate || "").trim();

  const match =
    eventDate.match(/^(\d{4})[\/-](\d{1,2})/);

  if (match) {
    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    return String(month <= 3 ? year - 1 : year);
  }

  const eventId =
    String(training && training.eventId || "").trim();

  const idMatch =
    eventId.match(/^(\d{4})-/);

  return idMatch
    ? idMatch[1]
    : "";
}

function getAttendanceTargetRespondents_(
  training
) {

  const members =
    getTargetMembers_(
      training,
      {
        includeWithoutMail: true
      }
    );

  const representativeMap =
    getRepresentativeNameMapForAttendance_();

  return members.map(function(member) {

    const personalId =
      String(member.personalId || "").trim();

    const memberNo =
      String(member.memberNo || "").replace(".0", "").trim();

    const participantName =
      String(member.participantName || "").trim() ||
      (
        memberNo
          ? representativeMap[memberNo] || ""
          : ""
      );

    return {
      respondentKey: personalId
        ? "P:" + personalId
        : "M:" + memberNo,
      memberNo: memberNo,
      personalId: personalId,
      companyName: member.companyName || "",
      participantName: participantName,
      mail: member.mail || "",
      block: member.block || "",
      branch: member.branch || "",
      district: member.district || ""
    };
  });
}

function getAttendanceTargetRespondentsForItems_(
  training,
  items
) {

  const members =
    getAttendanceTargetRespondents_(
      training
    );

  const activeItems =
    (items || []).filter(function(item) {
      return String(item.active || "TRUE").toUpperCase() !== "FALSE";
    });

  if (activeItems.length === 0) {
    return members;
  }

  return members.filter(function(member) {
    for (let i = 0; i < activeItems.length; i++) {
      if (
        attendanceItemMatchesRespondent_(
          activeItems[i],
          member.respondentKey,
          member,
          training
        )
      ) {
        return true;
      }
    }

    return false;
  });
}

function getRepresentativeNameMapForAttendance_() {

  const map = {};

  try {
    getMemberRowsFromMaster_().forEach(function(member) {
      const memberNo =
        String(member.memberNo || "").replace(".0", "").trim();

      if (memberNo) {
        map[memberNo] =
          String(member.representativeName || "").trim();
      }
    });
  } catch (err) {
  }

  return map;
}

function buildAttendanceResponseSummary_(
  items,
  responses
) {

  return items.map(function(item) {

    const counts = {};

    item.optionList.forEach(function(option) {
      counts[option] =
        0;
    });

    responses.forEach(function(response) {
      const value =
        String(response.answers[item.itemId] || "").trim();

      if (!value) {
        return;
      }

      if (!counts[value]) {
        counts[value] =
          0;
      }

      counts[value]++;
    });

    return {
      itemId: item.itemId,
      itemName: item.itemName,
      counts: counts
    };
  });
}

function getAttendanceItems_(
  eventId,
  includeInactive
) {

  const sheet =
    getOrCreateAttendanceSheet_(
      ATTENDANCE_ITEM_SHEET_NAME_,
      ATTENDANCE_ITEM_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  const items = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    if (String(getCellByHeader_(row, headerMap, "研修ID") || "").trim() !== String(eventId || "").trim()) {
      continue;
    }

    const active =
      String(getCellByHeader_(row, headerMap, "有効") || "TRUE").toUpperCase() !== "FALSE";

    if (!includeInactive && !active) {
      continue;
    }

    const options =
      String(getCellByHeader_(row, headerMap, "選択肢") || "")
        .split(",")
        .map(function(option) {
          return String(option || "").trim();
        })
        .filter(function(option) {
          return option !== "";
        });

    items.push({
      itemId: String(getCellByHeader_(row, headerMap, "項目ID") || "").trim(),
      eventId: String(getCellByHeader_(row, headerMap, "研修ID") || "").trim(),
      itemName: String(getCellByHeader_(row, headerMap, "項目名") || "").trim(),
      answerType: String(getCellByHeader_(row, headerMap, "回答形式") || "出欠").trim(),
      options: String(getCellByHeader_(row, headerMap, "選択肢") || "").trim(),
      optionList: options,
      targetScope: String(getCellByHeader_(row, headerMap, "対象区分") || "全員").trim(),
      targetKeys: String(getCellByHeader_(row, headerMap, "個別対象キー") || "").trim(),
      active: active ? "TRUE" : "FALSE",
      displayOrder: Number(getCellByHeader_(row, headerMap, "表示順") || 0)
    });
  }

  items.sort(function(a, b) {
    return Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
  });

  return items;
}

function filterAttendanceItemsForRespondent_(
  items,
  respondentKey,
  member,
  training
) {

  return items.filter(function(item) {
    return attendanceItemMatchesRespondent_(
      item,
      respondentKey,
      member,
      training
    );
  });
}

function attendanceItemMatchesRespondent_(
  item,
  respondentKey,
  member,
  training
) {

  const scope =
    String(item && item.targetScope || "全員").trim();

  if (!scope || scope === "全員") {
    return true;
  }

  if (scope === "個別指定") {

    const targetMap =
      buildAttendanceTargetKeyMap_(
        item.targetKeys
      );

    return !!targetMap[String(respondentKey || "").trim()];
  }

  let orgIds = [];

  if (scope === "対象組織と同じ") {
    orgIds =
      splitPersonalOrganizationIds_(
        training && (training.targetOrgIdsNew || training.targetOrgIds) || ""
      );
  }

  if (scope === "組織指定") {
    orgIds =
      splitPersonalOrganizationIds_(
        item.targetKeys || ""
      );
  }

  if (scope === "組織指定＋個別追加") {

    const mixedKeys =
      splitAttendanceMixedTargetKeys_(
        item.targetKeys || ""
      );

    const individualMap =
      buildAttendanceTargetKeyMap_(
        mixedKeys.respondentKeys.join(",")
      );

    if (individualMap[String(respondentKey || "").trim()]) {
      return true;
    }

    orgIds =
      mixedKeys.orgIds;
  }

  if (orgIds.length === 0) {
    return scope === "対象組織と同じ";
  }

  return attendanceRespondentBelongsToAnyOrganization_(
    member,
    orgIds
  );
}

function buildAttendanceTargetKeyMap_(
  keysText
) {

  const map = {};

  String(keysText || "")
    .split(",")
    .forEach(function(key) {
      key =
        String(key || "").trim();

      if (key) {
        map[key] =
          true;
      }
    });

  return map;
}

function splitAttendanceMixedTargetKeys_(
  keysText
) {

  const orgIds = [];
  const respondentKeys = [];

  String(keysText || "")
    .split(",")
    .forEach(function(key) {
      key =
        String(key || "").trim();

      if (!key) {
        return;
      }

      if (key.indexOf("ORG:") === 0) {
        orgIds.push(
          key.substring(4)
        );
        return;
      }

      if (
        key.indexOf("M:") === 0 ||
        key.indexOf("P:") === 0
      ) {
        respondentKeys.push(
          key
        );
      }
    });

  return {
    orgIds: orgIds,
    respondentKeys: respondentKeys
  };
}

function attendanceRespondentBelongsToAnyOrganization_(
  member,
  orgIds
) {

  const targetOrgIds =
    splitPersonalOrganizationIds_(
      orgIds
    );

  if (targetOrgIds.length === 0) {
    return false;
  }

  const personalId =
    String(member && member.personalId || "").trim();

  if (personalId) {
    return personalBelongsToAnyOrganization_(
      personalId,
      targetOrgIds
    );
  }

  const memberNo =
    String(member && member.memberNo || "").replace(".0", "").trim();

  if (!memberNo) {
    return false;
  }

  const memberMap =
    getOrganizationMemberMap_(
      targetOrgIds
    );

  return !!memberMap[memberNo];
}

function getActiveAttendanceOrganizations_() {

  try {
    return (getOrganizations_().organizations || [])
      .filter(function(org) {
        return String(org.active || "TRUE").toUpperCase() !== "FALSE";
      })
      .map(function(org) {
        return {
          orgId: org.orgId,
          orgName: org.orgName
        };
      });
  } catch (err) {
    return [];
  }
}

function getAttendanceResponseByKey_(
  eventId,
  respondentKey
) {

  const sheet =
    getOrCreateAttendanceSheet_(
      ATTENDANCE_RESPONSE_SHEET_NAME_,
      ATTENDANCE_RESPONSE_HEADERS_
    );

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    if (
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim() !== String(eventId || "").trim() ||
      String(getCellByHeader_(row, headerMap, "回答者キー") || "").trim() !== String(respondentKey || "").trim()
    ) {
      continue;
    }

    let answers = {};

    try {
      answers =
        JSON.parse(
          String(getCellByHeader_(row, headerMap, "回答JSON") || "{}")
        );
    } catch (err) {
      answers =
        {};
    }

    return {
      answers: answers,
      note: String(getCellByHeader_(row, headerMap, "備考") || "").trim(),
      answeredAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "回答日時")),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時"))
    };
  }

  return null;
}

function getAttendanceAnswerMember_(
  params
) {

  const personalId =
    String(params.personal || "").trim();

  const memberNo =
    String(params.member || "").replace(".0", "").trim();

  let member =
    null;

  let personal =
    null;

  if (personalId) {
    personal =
      findPersonalMemberById_(
        personalId
      );
  }

  const lookupMemberNo =
    memberNo ||
    (
      personal
        ? String(personal.memberNo || "").replace(".0", "").trim()
        : ""
    );

  if (lookupMemberNo) {
    member =
      findMemberByNo_(lookupMemberNo);
  }

  return {
    memberNo: lookupMemberNo,
    personalId: personalId,
    companyName:
      String(params.companyName || "").trim() ||
      (personal ? personal.companyName : "") ||
      (member ? member.companyName : ""),
    participantName:
      String(params.name || "").trim() ||
      (personal ? personal.personName : "") ||
      (member ? member.representativeName : ""),
    mail:
      String(params.mail || "").trim() ||
      (personal ? personal.mail : "") ||
      (member ? member.mail : ""),
    branch:
      member ? member.branch : "",
    district:
      member ? member.district : ""
  };
}

function buildAttendanceRespondentKey_(
  member
) {

  if (member.personalId) {
    return "P:" + member.personalId;
  }

  if (member.memberNo) {
    return "M:" + member.memberNo;
  }

  return "";
}

function buildAttendanceAnswerUrl_(
  training,
  member
) {

  if (!training || !training.eventId || !member || !member.memberNo) {
    return "";
  }

  return getCheckinWebUrl_() +
    "/attendance-answer.html?event=" +
    encodeURIComponent(training.eventId) +
    "&member=" +
    encodeURIComponent(member.memberNo || "") +
    "&personal=" +
    encodeURIComponent(member.personalId || "") +
    "&name=" +
    encodeURIComponent(member.participantName || "") +
    "&mail=" +
    encodeURIComponent(member.mail || "");
}

function replaceAttendanceAnswerUrl_(
  text,
  training,
  member
) {

  const url =
    buildAttendanceAnswerUrl_(
      training,
      member
    );

  return String(text || "")
    .replace(/{{出欠回答URL}}/g, url)
    .replace(/{{出欠確認URL}}/g, url);
}

function getOrCreateAttendanceSheet_(
  sheetName,
  headers
) {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet =
      ss.insertSheet(sheetName);

    sheet.appendRow(headers);
  }

  ensureHeaders_(
    sheet,
    headers
  );

  return sheet;
}

function createAttendanceItemId_() {
  return "AI-" + Utilities.getUuid().slice(0, 8);
}

function createAttendanceResponseId_() {
  return "AR-" + Utilities.getUuid().slice(0, 8);
}
