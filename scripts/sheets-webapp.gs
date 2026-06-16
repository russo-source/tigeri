/**
 * Tigeri invoice sheet — minimal WRITE endpoint for marking reimbursements.
 *
 * Setup (do this signed in as the SHEET OWNER only — use Incognito if you have
 * multiple Google accounts):
 *   1. Open the sheet → Extensions → Apps Script
 *   2. Delete the default contents, paste THIS file
 *   3. Set SECRET below to the value provided (must match SHEETS_WEBAPP_SECRET in .env.local)
 *   4. Save (disk icon)
 *   5. Deploy → New deployment → gear ⚙ → Web app
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   6. Deploy → Authorize access → (if "app isn't verified") Advanced → Go to … (unsafe) → Allow
 *   7. Copy the Web app URL that ends in /exec  ← give THIS to the app
 *
 * Safety: only the "Reimbursed" cell (column B) can be written, only to allowed
 * values, only on Russo-paid rows, and only with the correct secret.
 */
const SECRET = "PASTE_A_LONG_RANDOM_STRING_HERE";
const REIMBURSED_COL = 2; // column B = "Reimbursed"
const PAIDBY_COL = 1;     // column A = "Paid By"
const ALLOWED = ["", "Tim", "Pending"];

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function doGet() {
  return json_({ ok: true, ping: "alive" });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.secret !== SECRET) return json_({ ok: false, error: "unauthorized" });

    const row = Number(body.row);
    const value = String(body.reimbursed == null ? "" : body.reimbursed);
    if (!Number.isInteger(row) || row < 2) return json_({ ok: false, error: "bad row" });
    if (ALLOWED.indexOf(value) === -1) return json_({ ok: false, error: "value not allowed" });

    const sh = sheet_();
    const paidBy = String(sh.getRange(row, PAIDBY_COL).getValue()).trim();
    if (paidBy !== "Russo") {
      return json_({ ok: false, error: "row " + row + " is not a Russo-paid invoice" });
    }

    sh.getRange(row, REIMBURSED_COL).setValue(value);
    return json_({ ok: true, row: row, reimbursed: value });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
