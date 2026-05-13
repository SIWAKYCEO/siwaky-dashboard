/**
 * SIWAKY — Google Apps Script webhook (fallback when backend cannot use Sheets API).
 *
 * 21 columns (same order as backend sheets_webhook.py): #, Date, Time, Name, Phone,
 * City, Country, Product, Qty, Price SAR, Status, Confirmed, Delivered, Returned,
 * COD Fee, IP Address, Device, Source, Campaign, Notes, Order ID.
 */

var FIRST_DATA_ROW = 4;
var ROME_TZ = "Europe/Rome";

function _nextOrderNumber_(sheet) {
  var lr = sheet.getLastRow();
  var end = Math.max(lr, FIRST_DATA_ROW);
  var values = sheet.getRange(FIRST_DATA_ROW, 1, end, 1).getValues();
  var maxN = 0;
  for (var i = 0; i < values.length; i++) {
    var cell = values[i][0];
    var n = _parseOrderIndex(cell);
    if (n !== null && n >= maxN) maxN = n;
  }
  return maxN + 1;
}

function _parseOrderIndex(v) {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number") {
    var x = Math.floor(v);
    return x >= 1 ? x : null;
  }
  var s = String(v).replace(/^#+/i, "").trim();
  if (!s) return null;
  var m = /^(\d+)(\.\d+)?$/.exec(s.replace(",", "."));
  if (!m) return null;
  var num = parseInt(m[1], 10);
  return num >= 1 ? num : null;
}

function _forceText_(s) {
  s = s == null ? "" : String(s).trim();
  if (!s) return "";
  return "'" + s;
}

function _nowROME_() {
  var now = new Date();
  return {
    date: Utilities.formatDate(now, ROME_TZ, "dd/MM/yyyy"),
    time: Utilities.formatDate(now, ROME_TZ, "HH:mm:ss"),
  };
}

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var SHEET_ID = props.getProperty("SHEET_ID");
    var SECRET = props.getProperty("WEBHOOK_SECRET") || "";

    if (!SHEET_ID) return _resp({ ok: false, error: "missing_sheet_id" });

    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(raw);

    if (SECRET && data.secret !== SECRET) return _resp({ ok: false, error: "unauthorized" });

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("📦 Orders") || ss.getActiveSheet();

    var nextNum = _nextOrderNumber_(sheet);
    var nextRow = sheet.getLastRow() + 1;
    var codFee = Number(data.price || 0) * 0.05;
    var useServerDate = data.date && data.time ? true : false;
    var dt = useServerDate ? null : _nowROME_();
    var dateStr = String(useServerDate ? data.date || "" : dt.date);
    var timeStr = String(useServerDate ? data.time || "" : dt.time);
    var ipStr = String(data.ip_address || "");
    var phoneStr = String(data.phone || "");

    sheet.getRange(nextRow, 1, nextRow, 21).setValues([[
      nextNum,
      _forceText_(dateStr),
      _forceText_(timeStr),
      String(data.name || ""),
      _forceText_(phoneStr),
      String(data.city || ""),
      String(data.country || "SA"),
      String(data.product || ""),
      Number(data.quantity || 0),
      Number(data.price || 0),
      String(data.status || "Pending"),
      "No",
      "No",
      "No",
      codFee,
      _forceText_(ipStr),
      String(data.device || ""),
      String(data.source || "Website"),
      String(data.campaign || ""),
      String(data.notes || ""),
      String(data.order_id || ""),
    ]]);

    return _resp({ ok: true, row: nextRow });
  } catch (err) {
    return _resp({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _resp({ ok: true, service: "siwaky-sheets-webhook" });
}

function _resp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
