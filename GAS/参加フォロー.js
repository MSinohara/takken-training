function getFollowAnalysisJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  let result;

  try {

    result =
      getFollowAnalysis_(
        String(e.parameter.year || "").trim(),
        String(e.parameter.eventType || "研修会").trim()
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


function getFollowAnalysis_(
  year,
  eventType
) {

  const trainings =
    getFollowAnalysisTrainings_();

  const years =
    getFollowAnalysisYears_(
      trainings
    );

  const targetYear =
    year ||
    getFollowCurrentFiscalYear_();

  const targetEventType =
    eventType || "研修会";

  const yearTrainings =
    trainings.filter(function(training) {
      if (getFollowFiscalYear_(training.eventId, training.eventDate) !== targetYear) {
        return false;
      }

      if (targetEventType === "all") {
        return true;
      }

      return String(training.eventType || "研修会").trim() === targetEventType;
    });

  const eventIds =
    yearTrainings.map(function(training) {
      return training.eventId;
    });

  const attendanceMap =
    getFollowAttendanceMap_(
      eventIds
    );

  const memberMap = {};

  yearTrainings.forEach(function(training) {

    const targetMembers =
      getTrainingTargetMembers_(
        training
      );

    targetMembers.forEach(function(member) {

      const memberNo =
        normalizeMemberNoForStats_(
          member.memberNo
        );

      if (!memberNo) {
        return;
      }

      if (!memberMap[memberNo]) {
        memberMap[memberNo] = {
          memberNo: memberNo,
          companyName: member.companyName || "",
          block: member.block || "",
          branch: member.branch || "",
          district: member.district || "",
          targetCount: 0,
          attendedCount: 0,
          lastAttendedAt: "",
          events: []
        };
      }

      const attended =
        !!attendanceMap[training.eventId + "\t" + memberNo];

      memberMap[memberNo].targetCount++;

      if (attended) {
        memberMap[memberNo].attendedCount++;

        const attendedAt =
          attendanceMap[training.eventId + "\t" + memberNo];

        if (
          attendedAt &&
          (!memberMap[memberNo].lastAttendedAt || attendedAt > memberMap[memberNo].lastAttendedAt)
        ) {
          memberMap[memberNo].lastAttendedAt =
            attendedAt;
        }
      }

      memberMap[memberNo].events.push({
        eventId: training.eventId,
        title: training.title,
        eventDate: training.eventDate,
        attended: attended
      });
    });
  });

  const members =
    Object.keys(memberMap)
      .map(function(memberNo) {

        const item =
          memberMap[memberNo];

        item.attendanceRate =
          makeRateForStats_(
            item.attendedCount,
            item.targetCount
          );

        item.status =
          getFollowStatus_(
            item
          );

        item.lastAttendedAtText =
          item.lastAttendedAt
            ? item.lastAttendedAt.substring(0, 10)
            : "";

        return item;
      })
      .sort(function(a, b) {

        if (a.statusRank !== b.statusRank) {
          return a.statusRank - b.statusRank;
        }

        if (a.attendedCount !== b.attendedCount) {
          return a.attendedCount - b.attendedCount;
        }

        return a.companyName.localeCompare(b.companyName, "ja");
      });

  const summary =
    getFollowSummary_(
      members
    );

  return {
    ok: true,
    year: targetYear,
    eventType: targetEventType,
    years: years,
    eventTypes: getFollowAnalysisEventTypes_(trainings),
    trainingCount: yearTrainings.length,
    summary: summary,
    members: members
  };
}


function getFollowStatus_(item) {

  const recentTargets =
    item.events
      .slice()
      .sort(function(a, b) {
        return String(b.eventDate || "").localeCompare(String(a.eventDate || ""));
      })
      .slice(0, 3);

  const recentAbsent =
    recentTargets.length >= 3 &&
    recentTargets.every(function(event) {
      return !event.attended;
    });

  const rate =
    item.targetCount
      ? item.attendedCount / item.targetCount
      : 0;

  if (item.attendedCount === 0) {
    item.statusRank = 1;
    return "未参加";
  }

  if (recentAbsent) {
    item.statusRank = 2;
    return "最近未参加";
  }

  if (item.targetCount >= 3 && rate < 0.3) {
    item.statusRank = 3;
    return "低参加";
  }

  if (rate >= 0.8) {
    item.statusRank = 5;
    return "継続参加";
  }

  item.statusRank = 4;
  return "参加中";
}


function getFollowSummary_(members) {

  const summary = {
    targetMembers: members.length,
    participatedMembers: 0,
    neverAttended: 0,
    lowParticipation: 0,
    recentAbsent: 0,
    continuous: 0
  };

  members.forEach(function(member) {

    if (member.attendedCount > 0) {
      summary.participatedMembers++;
    }

    if (member.status === "未参加") {
      summary.neverAttended++;
    }

    if (member.status === "低参加") {
      summary.lowParticipation++;
    }

    if (member.status === "最近未参加") {
      summary.recentAbsent++;
    }

    if (member.status === "継続参加") {
      summary.continuous++;
    }
  });

  summary.participationRate =
    makeRateForStats_(
      summary.participatedMembers,
      summary.targetMembers
    );

  return summary;
}


function getFollowAnalysisTrainings_() {

  const activeTrainings =
    getActiveTrainings();

  return activeTrainings
    .map(function(training) {
      return findTrainingById_(
        training.eventId
      );
    })
    .filter(function(training) {
      return !!training;
    });
}


function getFollowAnalysisYears_(trainings) {

  const map = {};

  trainings.forEach(function(training) {

    const year =
      getFollowFiscalYear_(
        training.eventId,
        training.eventDate
      );

    if (year) {
      map[year] =
        true;
    }
  });

  return Object.keys(map).sort(function(a, b) {
    return Number(b) - Number(a);
  });
}


function getFollowAnalysisEventTypes_(trainings) {

  const eventTypes =
    getEventTypes_()
      .filter(function(eventType) {
        return String(eventType.active || "TRUE").toUpperCase() !== "FALSE";
      })
      .map(function(eventType) {
        return String(eventType.eventTypeName || "").trim();
      })
      .filter(function(eventTypeName) {
        return eventTypeName !== "";
      });

  if (eventTypes.length > 0) {
    return eventTypes;
  }

  const map = {};

  trainings.forEach(function(training) {

    const eventType =
      String(training.eventType || "研修会").trim() || "研修会";

    map[eventType] =
      true;
  });

  const names =
    Object.keys(map);

  if (names.length === 0) {
    names.push(
      "研修会"
    );
  }

  return names.sort(function(a, b) {
    return a.localeCompare(b, "ja");
  });
}


function getFollowAttendanceMap_(eventIds) {

  const map = {};

  if (!eventIds || eventIds.length === 0) {
    return map;
  }

  const eventMap = {};

  eventIds.forEach(function(eventId) {
    eventMap[eventId] =
      true;
  });

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("参加履歴");

  if (!sheet || sheet.getLastRow() < 2) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  const headerMap =
    getHeaderMap_(
      sheet
    );

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const eventId =
      String(getCellByHeader_(row, headerMap, "研修ID") || "").trim();

    if (!eventMap[eventId]) {
      continue;
    }

    const result =
      String(getCellByHeader_(row, headerMap, "結果") || "").trim();

    if (result !== "受付完了") {
      continue;
    }

    const memberNo =
      normalizeMemberNoForStats_(
        getCellByHeader_(row, headerMap, "業者番号")
      );

    if (!memberNo) {
      continue;
    }

    map[eventId + "\t" + memberNo] =
      formatDateForFollow_(
        getCellByHeader_(row, headerMap, "日時")
      );
  }

  return map;
}


function getFollowFiscalYear_(eventId, eventDate) {

  const match =
    String(eventId || "").trim().match(/^(\d{4})-/);

  if (match) {
    return match[1];
  }

  const text =
    formatDateForFollow_(
      eventDate
    );

  const dateMatch =
    text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!dateMatch) {
    return "";
  }

  const year =
    Number(dateMatch[1]);

  const month =
    Number(dateMatch[2]);

  return String(month <= 3 ? year - 1 : year);
}


function getFollowCurrentFiscalYear_() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    now.getMonth() + 1;

  return String(month <= 3 ? year - 1 : year);
}


function formatDateForFollow_(value) {

  if (!value) {
    return "";
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(
      value,
      "Asia/Tokyo",
      "yyyy-MM-dd HH:mm:ss"
    );
  }

  return String(value || "").replace(/\//g, "-").trim();
}
