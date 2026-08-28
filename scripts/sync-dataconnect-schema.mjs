import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const firebaseToolsRoot = path.join(
  process.env.APPDATA || "",
  "npm",
  "node_modules",
  "firebase-tools"
);
const { GoogleAuth } = require(
  path.join(firebaseToolsRoot, "node_modules", "google-auth-library")
);

const projectId = process.argv[2] || "takken-training-demo";
const serviceId = process.argv[3] || "takken-training";
const location = process.argv[4] || "asia-northeast1";
const accountFile = process.argv[5] || "ohzakai_kk_gmail.com_application_default_credentials.json";
const schemaPath = path.resolve("dataconnect", "schema", "schema.gql");
const credentialsPath = path.join(
  process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
  "firebase",
  accountFile
);

if (!fs.existsSync(schemaPath)) {
  throw new Error(`スキーマが見つかりません: ${schemaPath}`);
}
if (!fs.existsSync(credentialsPath)) {
  throw new Error("Firebase CLIへ再ログインしてください。");
}

const auth = new GoogleAuth({
  keyFilename: credentialsPath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const accessToken = await client.getAccessToken();
const schemaName = `projects/${projectId}/locations/${location}/services/${serviceId}/schemas/main`;
const url = `https://firebasedataconnect.googleapis.com/v1/${schemaName}`;
const headers = {
  Authorization: `Bearer ${accessToken.token}`,
  "Content-Type": "application/json",
};

const currentResponse = await fetch(url, { headers });
const current = await currentResponse.json();
if (!currentResponse.ok) {
  throw new Error(`現在の定義を取得できません: HTTP ${currentResponse.status}`);
}

const response = await fetch(`${url}?updateMask=source`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    name: schemaName,
    etag: current.etag,
    source: {
      files: [
        {
          path: "schema.gql",
          content: fs.readFileSync(schemaPath, "utf8"),
        },
      ],
    },
  }),
});
const result = await response.json();
if (!response.ok) {
  throw new Error(
    `スキーマ定義を更新できません: HTTP ${response.status} ${JSON.stringify(result)}`
  );
}

console.log(`Data Connectスキーマ定義を同期しました: ${schemaName}`);
