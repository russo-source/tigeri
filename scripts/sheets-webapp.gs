/**
 * Tigeri invoice sheet — write endpoint (reimbursements + add-invoice with Drive upload).
 *
 * UPDATE / REDEPLOY:
 *   1. Open the sheet → Extensions → Apps Script
 *   2. Select-all, delete, paste THIS file
 *   3. Re-set SECRET below to YOUR value (the one already in .env.local) — pasting overwrote it
 *   4. Save → Deploy → Manage deployments → ✏️ Edit → Version: "New version" → Deploy
 *      (the /exec URL stays the same)
 *
 * Two actions on doPost (JSON body, must include the secret):
 *   reimburse  (default): { row, reimbursed }            → sets the Reimbursed cell
 *   addInvoice          : { ...fields, fileBase64, ... }  → saves PDF to Drive + appends a row
 */
const SECRET = "PASTE_A_LONG_RANDOM_STRING_HERE";
const ROOT_FOLDER_ID = "1_9D5OhinPuVRerBNdxh0ThAEVQ4D6zkC"; // "Tigeri Expenses"
const REIMBURSED_COL = 2;
const PAIDBY_COL = 1;
const ALLOWED_REIMBURSED = ["", "Tim", "Pending"];

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function getOrCreateFolder_(parent, name) {
  name = String(name || "").trim() || "Unsorted";
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function doGet() {
  return json_({ ok: true, ping: "alive" });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.secret !== SECRET) return json_({ ok: false, error: "unauthorized" });
    if (body.action === "addInvoice") return addInvoice_(body);
    if (body.action === "deleteInvoice") return deleteInvoice_(body);
    return reimburse_(body);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function reimburse_(body) {
  const row = Number(body.row);
  const value = String(body.reimbursed == null ? "" : body.reimbursed);
  if (!Number.isInteger(row) || row < 2) return json_({ ok: false, error: "bad row" });
  if (ALLOWED_REIMBURSED.indexOf(value) === -1) return json_({ ok: false, error: "value not allowed" });
  const sh = sheet_();
  const paidBy = String(sh.getRange(row, PAIDBY_COL).getValue()).trim();
  if (paidBy !== "Russo") return json_({ ok: false, error: "row " + row + " is not a Russo-paid invoice" });
  sh.getRange(row, REIMBURSED_COL).setValue(value);
  return json_({ ok: true, row: row, reimbursed: value });
}

function addInvoice_(body) {
  const paidBy = String(body.paidBy || "").trim();
  if (paidBy !== "Tim" && paidBy !== "Russo") return json_({ ok: false, error: "paidBy must be Tim or Russo" });
  if (!body.fileBase64) return json_({ ok: false, error: "file is required" });

  const vendor = String(body.vendor || "").trim() || "Unsorted";
  const period = String(body.period || "").trim() || "Unsorted";

  // Drive: Tigeri Expenses / Person / Period / Vendor / file
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = getOrCreateFolder_(getOrCreateFolder_(getOrCreateFolder_(root, paidBy), period), vendor);
  const filename = String(body.filename || (vendor + ".pdf")).trim();
  const mime = String(body.mimeType || "application/pdf");
  const blob = Utilities.newBlob(Utilities.base64Decode(body.fileBase64), mime, filename);
  const file = folder.createFile(blob);
  const url = file.getUrl();

  // Sheet: insert a row just after the last Tim/Russo data row (above the totals block)
  const sh = sheet_();
  const colA = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  let lastData = 1;
  for (let i = 0; i < colA.length; i++) {
    const a = String(colA[i][0]).trim();
    if (a === "Tim" || a === "Russo") lastData = i + 1;
  }
  sh.insertRowAfter(lastData);
  const r = lastData + 1;
  sh.getRange(r, 1, 1, 9).setValues([[
    paidBy,
    String(body.reimbursed || ""),
    vendor,
    String(body.description || ""),
    String(body.invoiceNo || ""),
    String(body.date || ""),
    String(body.status || ""),
    Number(body.origAmount) || 0,
    String(body.currency || ""),
  ]]);
  sh.getRange(r, 10).setValue(Number(body.amountUSD) || 0);
  sh.getRange(r, 11).setFormula('=HYPERLINK("' + url + '","View PDF")');

  return json_({ ok: true, row: r, fileUrl: url, fileId: file.getId() });
}

// Trash the linked PDF + delete the row. Guarded to data rows only.
function deleteInvoice_(body) {
  const row = Number(body.row);
  if (!Number.isInteger(row) || row < 2) return json_({ ok: false, error: "bad row" });
  const sh = sheet_();
  const a = String(sh.getRange(row, PAIDBY_COL).getValue()).trim();
  if (a !== "Tim" && a !== "Russo") return json_({ ok: false, error: "row " + row + " is not a data row" });
  const out = { ok: true, row: row };
  if (body.fileId) {
    try { DriveApp.getFileById(String(body.fileId)).setTrashed(true); out.fileTrashed = true; }
    catch (e) { out.fileError = String(e); }
  }
  sh.deleteRow(row);
  return json_(out);
}
