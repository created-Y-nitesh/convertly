/**
 * Convertly Google Sheets Integration Layer
 * Google Apps Script Web Application
 *
 * Handles audit log ingestion for document conversion operations.
 * Enforces shared secret authentication, schema validation, lock concurrency,
 * and duplicate event deduplication.
 */

// Configuration constants
var DEFAULT_SHEET_NAME = "ConversionLogs";
var HEADER_ROW = [
  "event_id",
  "job_id",
  "created_at",
  "source_format",
  "target_format",
  "original_file_size_bytes",
  "status",
  "processing_duration_ms",
  "error_code",
  "result_file_size_bytes",
  "logged_at_utc"
];

/**
 * HTTP POST Entry Point
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock for up to 30 seconds to prevent concurrent write conflicts
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        status: "error",
        code: "EMPTY_BODY",
        message: "No POST body contents received"
      }, 400);
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({
        status: "error",
        code: "INVALID_JSON",
        message: "Malformed JSON payload: " + parseErr.message
      }, 400);
    }

    // 1. Authenticate shared secret
    var scriptProperties = PropertiesService.getScriptProperties();
    var configuredSecret = scriptProperties.getProperty("CONVERTLY_SHARED_SECRET");

    if (configuredSecret && configuredSecret.trim().length > 0) {
      var clientSecret = body.shared_secret || "";
      if (clientSecret !== configuredSecret) {
        return jsonResponse({
          status: "unauthorized",
          code: "INVALID_SECRET",
          message: "Authentication failed. Invalid shared secret."
        }, 401);
      }
    }

    // 2. Handle Action Dispatch
    var action = body.action || "log_conversion";

    if (action === "ping") {
      return jsonResponse({
        status: "success",
        ping: "pong",
        authenticated: true,
        timestamp: new Date().toISOString()
      }, 200);
    }

    if (action === "log_conversion") {
      return handleLogConversion(body.event);
    }

    return jsonResponse({
      status: "error",
      code: "UNKNOWN_ACTION",
      message: "Unsupported action: " + action
    }, 400);

  } catch (err) {
    return jsonResponse({
      status: "error",
      code: "INTERNAL_ERROR",
      message: err.toString()
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * HTTP GET Entry Point for Health Verification
 */
function doGet(e) {
  return jsonResponse({
    status: "active",
    service: "Convertly Audit Logging Service",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "Send POST requests with action='log_conversion' and valid shared_secret"
  }, 200);
}

/**
 * Appends validated conversion record to Google Sheet
 */
function handleLogConversion(eventData) {
  if (!eventData) {
    return jsonResponse({
      status: "error",
      code: "MISSING_EVENT_DATA",
      message: "No event payload provided."
    }, 400);
  }

  // Schema validation
  var eventId = String(eventData.event_id || "").trim();
  var jobId = String(eventData.job_id || "").trim();
  var sourceFmt = String(eventData.source_format || "").trim().toLowerCase();
  var targetFmt = String(eventData.target_format || "").trim().toLowerCase();
  var status = String(eventData.status || "").trim().toLowerCase();
  var fileSize = Number(eventData.original_file_size || 0);
  var duration = Number(eventData.processing_duration_ms || 0);
  var createdAt = String(eventData.created_at || new Date().toISOString());
  var errorCode = String(eventData.error_code || "NONE").trim();
  var resultSize = Number(eventData.result_file_size || 0);

  if (!eventId || !jobId) {
    return jsonResponse({
      status: "error",
      code: "VALIDATION_FAILED",
      message: "event_id and job_id are required fields."
    }, 422);
  }

  // Get active spreadsheet and sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DEFAULT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DEFAULT_SHEET_NAME);
    // Add header row with styling
    sheet.appendRow(HEADER_ROW);
    var headerRange = sheet.getRange(1, 1, 1, HEADER_ROW.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#F5F7FB");
    headerRange.setFontColor("#172033");
    sheet.setFrozenRows(1);
  }

  // Check for duplicate event_id in last 500 rows to ensure idempotency
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var checkRows = Math.min(500, lastRow - 1);
    var startRow = lastRow - checkRows + 1;
    var existingIds = sheet.getRange(startRow, 1, checkRows, 1).getValues();
    for (var r = 0; r < existingIds.length; r++) {
      if (String(existingIds[r][0]) === eventId) {
        return jsonResponse({
          status: "success",
          code: "DUPLICATE_IGNORED",
          message: "Event " + eventId + " already recorded (idempotent duplicate).",
          event_id: eventId
        }, 200);
      }
    }
  }

  // Append validated row
  var newRow = [
    eventId,
    jobId,
    createdAt,
    sourceFmt,
    targetFmt,
    fileSize,
    status,
    duration,
    errorCode,
    resultSize,
    new Date().toISOString()
  ];

  sheet.appendRow(newRow);

  return jsonResponse({
    status: "success",
    message: "Conversion event logged successfully",
    event_id: eventId,
    row: sheet.getLastRow()
  }, 200);
}

/**
 * Standardized JSON response helper
 */
function jsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
