import { google } from "googleapis";

function getPrivateKey() {
  const b64 = process.env.GOOGLE_PRIVATE_KEY_BASE64 || "";
  if (b64) {
    return Buffer.from(b64, "base64").toString("utf8");
  }

  const key = process.env.GOOGLE_PRIVATE_KEY_BASE64 || "";
  return key.replace(/\\n/g, "\n");
}

export async function fetchSheetValues() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = getPrivateKey();

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error(
      "ENV belum lengkap. Set GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY_BASE64."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const range = "DATA!A1:I";
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  return res.data.values ?? [];
}
