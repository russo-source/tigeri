/**
 * Tigeri invoice sheet — write endpoint (reimbursements + add-invoice with Drive upload + delete).
 *
 * HEADER-AWARE: columns are located by their header name, so inserting or reordering
 * columns in the sheet (e.g. the "Business" column) will NOT break writes.
 *
 * DATE-ORDERED: new invoices are inserted into the right place by their Date, not appended.
 *
 * UPDATE / REDEPLOY:
 *   1. Open the sheet → Extensions → Apps Script
 *   2. Select-all, delete, paste THIS file
 *   3. Re-set SECRET below to YOUR value (pasting overwrote it)
 *   4. (one-time clean-up of the two shifted rows) Run ▶ the function: fixLedger
 *      — authorize if prompted; it repairs the misplaced columns and re-sorts those rows by date.
 *   5. Save → Deploy → Manage deployments → ✏️ Edit → Version: "New version" → Deploy
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
    width: values[hRow].length,
    values: values,
    col: function (name) { return map[String(name).toLowerCase()] || 0; },
  };
}

// Parse a date cell value (Date object or "dd Mon yyyy" / ISO string) -> ms timestamp, or NaN.
function parseDate_(v) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v)) return v.getTime();
  const s = String(v == null ? "" : v).trim();
  if (!s) return NaN;
  const M = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) { const mo = M[m[2].slice(0, 3).toLowerCase()]; if (mo != null) return new Date(+m[3], mo, +m[1]).getTime(); }
  const d = new Date(s);
  return isNaN(d) ? NaN : d.getTime();
}

// First data-row (1-based) whose Date is strictly after `ts`; else the row right after the last data row.
function findInsertRow_(sh, H, ts) {
  const dateCol = H.col("Date"), paidCol = H.col("Paid By");
  let lastData = H.headerRow;
  for (let i = 0; i < H.values.length; i++) {
    const a = String(H.values[i][paidCol - 1]).trim();
    if (a === "Tim" || a === "Russo") {
      lastData = i + 1;
      const rt = parseDate_(H.values[i][dateCol - 1]);
      if (!isNaN(rt) && !isNaN(ts) && rt > ts) return i + 1; // insert before this row
    }
  }
  return lastData + 1;
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
  // Insert in date order (falls back to after the last data row when the date is newest/unknown).
  const r = findInsertRow_(sh, H, parseDate_(body.date));
  sh.insertRowsBefore(r, 1);
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

/**
 * ONE-TIME clean-up. Repairs rows written by the OLD (pre-"Business") script, whose columns
 * are shifted one slot left from "Business" onward (the Invoice-Link cell empty while the
 * Amount-(USD) cell holds the =HYPERLINK formula). Un-shifts them, sets Business =
 * "Tigerscale OC" (Anthropic credits), preserves the Drive link, and re-inserts each by Date.
 * Run from the editor: select fixLedger ▶ Run.
 */
function fixLedger() {
  const sh = sheet_();
  let H = headers_(sh);
  const paidCol = H.col("Paid By"), linkCol = H.col("Invoice Link"), amtCol = H.col("Amount (USD)");

  // 1) Identify shifted rows.
  const bad = [];
  for (let i = 0; i < H.values.length; i++) {
    const a = String(H.values[i][paidCol - 1]).trim();
    if (a !== "Tim" && a !== "Russo") continue;
    const r = i + 1;
    const linkVal = String(sh.getRange(r, linkCol).getValue()).trim();
    const amtFormula = String(sh.getRange(r, amtCol).getFormula());
    if (linkVal === "" && /^=HYPERLINK/i.test(amtFormula)) bad.push(r);
  }
  if (!bad.length) return "nothing to fix";

  // 2) Capture corrected content for each (values shifted back by one; Business was lost).
  const fixed = bad.map(function (r) {
    const vals = sh.getRange(r, 1, 1, H.width).getValues()[0];
    const fors = sh.getRange(r, 1, 1, H.width).getFormulas()[0];
    const at = function (name) { return vals[H.col(name) - 1]; };
    return {
      "Paid By": at("Paid By"),
      "Reimbursed": at("Reimbursed"),
      "Vendor": at("Vendor"),
      "Business": "Tigerscale OC",
      "Description": at("Business"),
      "Invoice #": at("Description"),
      "Date": at("Invoice #"),
      "Status": at("Date"),
      "Orig. Amount": Number(String(at("Status")).replace(/[$,]/g, "")) || 0,
      "Cur.": at("Orig. Amount"),
      "Amount (USD)": Number(String(at("Cur.")).replace(/[$,]/g, "")) || 0,
      "_link": fors[H.col("Amount (USD)") - 1],
    };
  });

  // 3) Remove the bad rows (bottom-up so indices stay valid).
  bad.slice().sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });

  // 4) Re-insert each corrected row in date order.
  fixed.forEach(function (o) {
    H = headers_(sh);
    const ins = findInsertRow_(sh, H, parseDate_(o["Date"]));
    sh.insertRowsBefore(ins, 1);
    const set = function (name, val) { const c = H.col(name); if (c) sh.getRange(ins, c).setValue(val); };
    ["Paid By", "Reimbursed", "Vendor", "Business", "Description", "Invoice #", "Date", "Status", "Orig. Amount", "Cur.", "Amount (USD)"].forEach(function (n) { set(n, o[n]); });
    const lc = H.col("Invoice Link");
    if (lc && o["_link"]) sh.getRange(ins, lc).setFormula(o["_link"]);
  });

  return "fixed " + fixed.length + " row(s)";
}

// Run once to grant the Drive read/write permission.
function authorizeDrive() {
  var folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var f = folder.createFile("__perm_check__.txt", "ok");
  f.setTrashed(true);
}
