function getOrganizationsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getOrganizations_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function saveOrganizationJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const data = {
    orgId: String(e.parameter.orgId || "").trim(),
    orgName: String(e.parameter.orgName || "").trim(),
    senderName: String(e.parameter.senderName || "").trim(),
    active: String(e.parameter.active || "TRUE").trim(),
    hostAvailable: String(e.parameter.hostAvailable || "FALSE").trim(),
    csvImportName: String(e.parameter.csvImportName || "").trim(),
    csvImportMode: String(e.parameter.csvImportMode || "所属入替").trim()
  };

  const result =
    saveOrganization_(
      data
    );

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getOrganizations_() {

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("組織マスタ");

  const headers = [
    "組織ID",
    "組織名",
    "差出人名",
    "有効",
    "主催区分",
    "CSV取込名",
    "CSV取込方式",
    "作成日時",
    "更新日時"
  ];

  if (!sheet) {
    sheet =
      ss.insertSheet("組織マスタ");

    sheet.appendRow(headers);
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

  const list = [];

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const orgId =
      String(getCellByHeader_(row, headerMap, "組織ID") || "").trim();

    if (!orgId) {
      continue;
    }

    list.push({
      orgId: orgId,
      orgName: String(getCellByHeader_(row, headerMap, "組織名") || "").trim(),
      senderName: String(getCellByHeader_(row, headerMap, "差出人名") || "").trim(),
      active: String(getCellByHeader_(row, headerMap, "有効") || "").toUpperCase() === "FALSE" ? "FALSE" : "TRUE",
      hostAvailable: String(getCellByHeader_(row, headerMap, "主催区分") || "").toUpperCase() === "TRUE" ? "TRUE" : "FALSE",
      csvImportName: String(getCellByHeader_(row, headerMap, "CSV取込名") || "").trim(),
      csvImportMode: String(getCellByHeader_(row, headerMap, "CSV取込方式") || "").trim(),
      createdAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "作成日時")),
      updatedAt: formatDateTimeForClient_(getCellByHeader_(row, headerMap, "更新日時"))
    });
  }

  return {
    ok: true,
    organizations: list
  };
}
     
function saveOrganization_(
  data
) {

  if (!data.orgName) {
    return {
      ok: false,
      message: "組織名を入力してください。"
    };
  }

  if (!data.senderName) {
    return {
      ok: false,
      message: "差出人名を入力してください。"
    };
  }

  const ss =
    getSpreadsheet_();

  let sheet =
    ss.getSheetByName("組織マスタ");

  const headers = [
    "組織ID",
    "組織名",
    "差出人名",
    "有効",
    "主催区分",
    "CSV取込名",
    "CSV取込方式",
    "作成日時",
    "更新日時"
  ];

  if (!sheet) {
    sheet =
      ss.insertSheet("組織マスタ");

    sheet.appendRow(headers);
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

  const col = {};

  Object.keys(headerMap).forEach(function(header) {
    col[header] =
      headerMap[header] + 1;
  });

  const now =
    new Date();

  if (data.orgId) {

    for (let i = 1; i < values.length; i++) {

      const rowOrgId =
        String(getCellByHeader_(values[i], headerMap, "組織ID") || "").trim();

      if (rowOrgId === data.orgId) {

        sheet.getRange(i + 1, col["組織名"]).setValue(data.orgName);
        sheet.getRange(i + 1, col["差出人名"]).setValue(data.senderName);
        sheet.getRange(i + 1, col["有効"]).setValue(data.active === "FALSE" ? "FALSE" : "TRUE");
        sheet.getRange(i + 1, col["主催区分"]).setValue(data.hostAvailable === "TRUE" ? "TRUE" : "FALSE");
        sheet.getRange(i + 1, col["CSV取込名"]).setValue(data.csvImportName || "");
        sheet.getRange(i + 1, col["CSV取込方式"]).setValue(data.csvImportMode || "所属入替");
        sheet.getRange(i + 1, col["更新日時"]).setValue(now);

        return {
          ok: true,
          message: "組織を更新しました。"
        };
      }
    }
  }

  const newOrgId =
    getNextOrganizationId_(
      sheet
    );

  const newRow =
    new Array(sheet.getLastColumn()).fill("");

  newRow[col["組織ID"] - 1] = newOrgId;
  newRow[col["組織名"] - 1] = data.orgName;
  newRow[col["差出人名"] - 1] = data.senderName;
  newRow[col["有効"] - 1] = data.active === "FALSE" ? "FALSE" : "TRUE";
  newRow[col["主催区分"] - 1] = data.hostAvailable === "TRUE" ? "TRUE" : "FALSE";
  newRow[col["CSV取込名"] - 1] = data.csvImportName || "";
  newRow[col["CSV取込方式"] - 1] = data.csvImportMode || "所属入替";
  newRow[col["作成日時"] - 1] = now;
  newRow[col["更新日時"] - 1] = now;

  sheet.appendRow(newRow);

  return {
    ok: true,
    message: "組織を追加しました。",
    orgId: newOrgId
  };
}


function getNextOrganizationId_(
  sheet
) {

  const values =
    sheet.getDataRange().getValues();

  let maxId =
    0;

  for (let i = 1; i < values.length; i++) {

    const id =
      Number(values[i][0]);

    if (!isNaN(id) && id > maxId) {
      maxId = id;
    }
  }

  return String(maxId + 1);
}

function getOrganizationNameMap_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("組織マスタ");

  const map = {};

  if (!sheet) {
    return map;
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return map;
  }

  const headerMap =
    getHeaderMap_(sheet);

  for (let i = 1; i < values.length; i++) {

    const row =
      values[i];

    const orgId =
      String(getCellByHeader_(row, headerMap, "組織ID") || "").trim();

    const orgName =
      String(getCellByHeader_(row, headerMap, "組織名") || "").trim();

    if (orgId && orgName) {
      map[orgId] =
        orgName;
    }
  }

  return map;
}


function getOrganizationNamesText_(orgIdsText) {

  const ids =
    String(orgIdsText || "")
      .split(",")
      .map(function(v) {
        return String(v || "").trim();
      })
      .filter(function(v) {
        return v !== "";
      });

  if (ids.length === 0) {
    return "";
  }

  const nameMap =
    getOrganizationNameMap_();

  return ids
    .map(function(id) {
      return nameMap[id] || id;
    })
    .join("、");
}

function getDistrictsJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const result =
    getDistricts_();

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getDistricts_() {

  const ss =
    getSpreadsheet_();

  const sheet =
    ss.getSheetByName("地区マスタ");

  if (!sheet) {
    return {
      ok: true,
      districts: {}
    };
  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      ok: true,
      districts: {}
    };
  }

  const headers =
    values[0].map(function(h) {
      return String(h || "").trim();
    });

  const col = {
    branch: headers.indexOf("支部"),
    district: headers.indexOf("地区"),
    active: headers.indexOf("有効"),
    order: headers.indexOf("表示順")
  };

  const rows = [];

  for (let i = 1; i < values.length; i++) {

    const branch =
      col.branch >= 0
        ? String(values[i][col.branch] || "").trim()
        : "";

    const district =
      col.district >= 0
        ? String(values[i][col.district] || "").trim()
        : "";

    const active =
      col.active >= 0
        ? String(values[i][col.active] || "").toUpperCase()
        : "TRUE";

    const order =
      col.order >= 0
        ? Number(values[i][col.order] || 9999)
        : 9999;

    if (
      !branch ||
      !district ||
      active === "FALSE"
    ) {
      continue;
    }

    rows.push({
      branch: branch,
      district: district,
      order: isNaN(order) ? 9999 : order
    });
  }

  rows.sort(function(a, b) {

    if (a.branch !== b.branch) {
      return a.branch.localeCompare(b.branch, "ja");
    }

    return a.order - b.order;
  });

  const districts = {};

  rows.forEach(function(row) {

    if (!districts[row.branch]) {
      districts[row.branch] = [];
    }

    districts[row.branch].push(
      row.district
    );
  });

  return {
    ok: true,
    districts: districts
  };
}