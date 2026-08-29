import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { adminListDistricts, adminListOrganizations, connectorConfig } from "./generated.js?v=38";
import { firebaseConfig } from "./config.js?v=17";
import { requireSqlAdmin } from "./admin-auth.js?v=16";

const app = initializeApp(firebaseConfig);
const dc = getDataConnect(app, connectorConfig);

async function load() {
  await requireSqlAdmin(app, document.getElementById("targetOrgArea") || document.body);
  const [organizationResult, districtResult] = await Promise.all([
    adminListOrganizations(dc, {}, { fetchPolicy: "SERVER_ONLY" }),
    adminListDistricts(dc, {}, { fetchPolicy: "SERVER_ONLY" }),
  ]);
  const organizations = (organizationResult.data.organizations || []).map((row) => ({
    orgId: row.orgId,
    orgName: row.orgName,
    senderName: row.senderName || "",
    active: row.active ? "TRUE" : "FALSE",
    hostAvailable: row.hostAvailable ? "TRUE" : "FALSE",
  }));
  const districts = {};
  (districtResult.data.districts || []).filter((row) => row.active).forEach((row) => {
    if (!districts[row.branch]) districts[row.branch] = [];
    districts[row.branch].push(row.districtName);
  });
  return { organizations, districts };
}

window.sqlTrainingMasters = { load };
