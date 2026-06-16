/**
 * Tigeri invoice sheet — write endpoint (reimbursements + add-invoice with Drive upload + delete).
 *
 * HEADER-AWARE: columns are located by their header name, so inserting or reordering
 * columns in the sheet (e.g. the "Business" column) will NOT break writes.
 *
 * UPDATE / REDEPLOY:
 *   1. Open the sheet → Extensions → Apps Script
 *   2. Select-all, delete, paste THIS file
 *   3. Re-set SECRET below to YOUR value (pasting overwrote it)
 *   4. Save → Deploy → Manage deployments → ✏️ Edit → Version: "New version" → Deploy
 *      (the /exec URL stays the same)
 */
const SECRET = "PASTE_A_LONG_RANDOM_STRING_HERE";
const ROOT_FOLDER_ID = "1_9D5OhinPuVRerBNdxh0ThAEVQ4D6zkC"; // "Tigeri Expenses"
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

// Locate the header row and map column names -> 1-based column numbers.
function headers_(sh) {
  const values = sh.getDataRange().getValues();
  let hRow = -1;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === "Paid By") { hRow = i; break; }
  }
  if (hRow === -1) throw new Error('Header row ("Paid By") not found');
  const map = {};
  values[hRow].forEach(function (name, c) { map[String(name).trim().toLowerCase()] = c + 1; });
  return {
    headerRow: hRow + 1,
    values: values,
    col: function (name) { return map[String(name).toLowerCase()] || 0; },
  };
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
  const H = headers_(sh);
  const paidBy = String(sh.getRange(row, H.col("Paid By")).getValue()).trim();
  if (paidBy !== "Russo") return json_({ ok: false, error: "row " + row + " is not a Russo-paid invoice" });
  sh.getRange(row, H.col("Reimbursed")).setValue(value);
  return json_({ ok: true, row: row, reimbursed: value });
}

function addInvoice_(body) {
  const paidBy = String(body.paidBy || "").trim();
  if (paidBy !== "Tim" && paidBy !== "Russo") return json_({ ok: false, error: "paidBy must be Tim or Russo" });
  if (!body.fileBase64) return json_({ ok: false, error: "file is required" });

  const vendor = String(body.vendor || "").trim() || "Unsorted";
  const period = String(body.period || "").trim() || "Unsorted";

  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = getOrCreateFolder_(getOrCreateFolder_(getOrCreateFolder_(root, paidBy), period), vendor);
  const filename = String(body.filename || (vendor + ".pdf")).trim();
  const mime = String(body.mimeType || "application/pdf");
  const blob = Utilities.newBlob(Utilities.base64Decode(body.fileBase64), mime, filename);
  const file = folder.createFile(blob);
  const url = file.getUrl();

  const sh = sheet_();
  const H = headers_(sh);
  const paidByCol = H.col("Paid By");
  // last data row = the last row whose Paid-By cell is Tim/Russo (above the totals block)
  let lastData = H.headerRow;
  for (let i = 0; i < H.values.length; i++) {
    const a = String(H.values[i][paidByCol - 1]).trim();
    if (a === "Tim" || a === "Russo") lastData = i + 1;
  }
  sh.insertRowAfter(lastData);
  const r = lastData + 1;
  function set(name, val) { const c = H.col(name); if (c) sh.getRange(r, c).setValue(val); }
  set("Paid By", paidBy);
  set("Reimbursed", String(body.reimbursed || ""));
  set("Vendor", vendor);
  set("Business", String(body.business || ""));
  set("Description", String(body.description || ""));
  set("Invoice #", String(body.invoiceNo || ""));
  set("Date", String(body.date || ""));
  set("Status", String(body.status || ""));
  set("Orig. Amount", Number(body.origAmount) || 0);
  set("Cur.", String(body.currency || ""));
  set("Amount (USD)", Number(body.amountUSD) || 0);
  const linkCol = H.col("Invoice Link");
  if (linkCol) sh.getRange(r, linkCol).setFormula('=HYPERLINK("' + url + '","View PDF")');

  return json_({ ok: true, row: r, fileUrl: url, fileId: file.getId() });
}

function deleteInvoice_(body) {
  const row = Number(body.row);
  if (!Number.isInteger(row) || row < 2) return json_({ ok: false, error: "bad row" });
  const sh = sheet_();
  const H = headers_(sh);
  const a = String(sh.getRange(row, H.col("Paid By")).getValue()).trim();
  if (a !== "Tim" && a !== "Russo") return json_({ ok: false, error: "row " + row + " is not a data row" });
  const out = { ok: true, row: row };
  if (body.fileId) {
    try { DriveApp.getFileById(String(body.fileId)).setTrashed(true); out.fileTrashed = true; }
    catch (e) { out.fileError = String(e); }
  }
  sh.deleteRow(row);
  return json_(out);
}

// Run once to grant the Drive read/write permission.
function authorizeDrive() {
  var folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var f = folder.createFile("__perm_check__.txt", "ok");
  f.setTrashed(true);
}
