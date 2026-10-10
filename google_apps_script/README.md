# Convertly Google Sheets Integration via Google Apps Script

This module provides audit logging and operational telemetry for document conversions executed on Convertly.

---

## 1. Setup Instructions

### Step 1: Create a Google Spreadsheet
1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Rename the spreadsheet to: **Convertly Audit Logs**.
3. (Optional) Rename the first tab to `ConversionLogs`.

### Step 2: Open Google Apps Script Editor
1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Replace all existing content in `Code.gs` with the code in `google_apps_script/Code.gs`.
3. Save the project as **Convertly Sheets Webhook**.

### Step 3: Configure Shared Secret in Script Properties
1. In the Apps Script editor, click the **Gear icon (Project Settings)** on the left sidebar.
2. Scroll down to **Script Properties** and click **Add script property**.
3. Set:
   - **Property**: `CONVERTLY_SHARED_SECRET`
   - **Value**: A strong random string (e.g., `sk_conv_live_9f82a17cb03e481d9f`)
4. Click **Save script properties**.

### Step 4: Deploy as Web Application
1. Click the blue **Deploy** button > **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Fill in the deployment details:
   - **Description**: `Convertly Audit Ingestion v1`
   - **Execute as**: `Me (your email address)`
   - **Who has access**: `Anyone` (Required so the backend or browser webhook can submit logs without interactive OAuth prompts).
4. Click **Deploy**.
5. Copy the generated **Web app URL** (format: `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 5: Configure Convertly
1. Open the Convertly web application.
2. Navigate to the **Audit & Sync** modal/tab.
3. Paste your **Web app URL** and **Shared Secret**.
4. Click **Test Webhook Connection**. Convertly will verify connectivity and confirm the authentication handshake!

---

## 2. Spreadsheet Column Schema

| Column Index | Field Name | Data Type | Description |
|---|---|---|---|
| A | `event_id` | String | Unique UUID for the audit entry |
| B | `job_id` | String | Conversion job UUID |
| C | `created_at` | ISO 8601 UTC | Timestamp when user initiated conversion |
| D | `source_format` | String | Original document format (e.g., `pdf`, `docx`) |
| E | `target_format` | String | Output document format (e.g., `docx`, `xlsx`) |
| F | `original_file_size_bytes` | Number | Input file size in bytes |
| G | `status` | String | `completed` or `failed` |
| H | `processing_duration_ms` | Number | Conversion pipeline execution duration in milliseconds |
| I | `error_code` | String | Error code if failed, or `NONE` |
| J | `result_file_size_bytes` | Number | Converted output size in bytes |
| K | `logged_at_utc` | ISO 8601 UTC | Ingestion timestamp on Google Sheets server |

---

## 3. Example API Request

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{
    "action": "log_conversion",
    "shared_secret": "YOUR_SHARED_SECRET",
    "event": {
      "event_id": "evt_91f8c7b6-1234-5678",
      "job_id": "job_33a7e0d1-9876-5432",
      "created_at": "2026-10-10T12:00:00.000Z",
      "source_format": "pdf",
      "target_format": "docx",
      "original_file_size": 1048576,
      "status": "completed",
      "processing_duration_ms": 342,
      "error_code": "NONE",
      "result_file_size": 894520
    }
  }'
```

### Success Response (HTTP 200)
```json
{
  "status": "success",
  "message": "Conversion event logged successfully",
  "event_id": "evt_91f8c7b6-1234-5678",
  "row": 42
}
```

---

## 4. Security & Privacy Guarantees
- **Zero Document Contents**: Document binary contents, text extracts, file paths, and personal credentials are NEVER transmitted to Google Sheets.
- **Deduplication**: Ingestion checks previous rows for `event_id` to guarantee idempotent retries.
- **Locking**: Uses `LockService` with a 30s mutex lock to prevent concurrent write collisions across batch jobs.
