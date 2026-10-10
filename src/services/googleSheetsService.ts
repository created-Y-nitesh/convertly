/**
 * Google Sheets Integration through Google Apps Script
 * Dispatches operational conversion logs to administrative spreadsheets with authentication.
 */

import { ConversionEventRecord, GoogleSheetsConfig } from '../types/conversion';
import { API_BASE_URL } from '../config';

const STORAGE_KEY_SHEETS = 'convertly_sheets_config';

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  webhookUrl: '',
  sharedSecret: '',
  enabled: false,
  autoLog: false,
  sheetName: 'ConversionLogs',
};

export function getSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_SHEETS_CONFIG;
}

export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(config));
}

export interface SheetsDispatchResult {
  success: boolean;
  statusText: string;
  statusCode?: number;
  timestamp: string;
  eventId: string;
  payload: any;
}

/**
 * Logs a conversion event to Google Sheets via Apps Script Web App
 */
export async function logEventToGoogleSheets(
  record: ConversionEventRecord,
  config?: GoogleSheetsConfig
): Promise<SheetsDispatchResult> {
  const activeConfig = config || getSheetsConfig();

  if (!activeConfig.webhookUrl) {
    return {
      success: false,
      statusText: 'Google Apps Script Webhook URL is not configured.',
      timestamp: new Date().toISOString(),
      eventId: record.event_id,
      payload: record,
    };
  }

  const payload = {
    action: 'log_conversion',
    shared_secret: activeConfig.sharedSecret,
    event: {
      event_id: record.event_id,
      job_id: record.job_id,
      created_at: record.created_at,
      source_format: record.source_format,
      target_format: record.target_format,
      original_file_size: record.original_file_size,
      status: record.status,
      processing_duration_ms: record.processing_duration_ms,
      error_code: record.error_code || 'NONE',
      result_file_size: record.result_file_size || 0,
    },
    client_timestamp: new Date().toISOString(),
  };

  try {
    // Note: Google Apps Script Web Apps often redirect with a 302 to script.googleusercontent.com
    // We send payload as text/plain to avoid CORS preflight failures in browser or server
    const response = await fetch(activeConfig.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (response.ok) {
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { status: 'ok', text: await response.text() };
      }
      return {
        success: data.status === 'success' || response.status === 200,
        statusText: data.message || 'Logged successfully to Google Sheets',
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        eventId: record.event_id,
        payload,
      };
    } else {
      return {
        success: false,
        statusText: `HTTP Error ${response.status}: ${response.statusText}`,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        eventId: record.event_id,
        payload,
      };
    }
  } catch (err: any) {
    // Apps Script opaque response handling
    return {
      success: false,
      statusText: `Network or Apps Script error: ${err.message || 'Connection failed'}`,
      timestamp: new Date().toISOString(),
      eventId: record.event_id,
      payload,
    };
  }
}

/**
 * Tests the Google Apps Script Webhook connection
 * Uses server-side backend endpoint to preserve secret confidentiality
 */
export async function testSheetsConnection(config?: GoogleSheetsConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  // 1. Prefer server-side verification to keep shared secrets off the client
  try {
    const serverRes = await fetch(`${API_BASE_URL}/api/v1/integrations/google-sheets/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook_url: config?.webhookUrl || undefined,
        shared_secret: config?.sharedSecret || undefined,
      }),
    });
    if (serverRes.ok) {
      const data = await serverRes.json();
      return {
        success: data.success,
        message: data.message,
        details: data.details,
      };
    }
  } catch {
    // If backend is not running or running standalone SPA, proceed to client-side test
  }

  if (!config?.webhookUrl) {
    return {
      success: false,
      message: 'Please provide a valid Apps Script Web App URL or configure GOOGLE_SHEETS_WEBHOOK_URL in server .env.',
    };
  }

  const testPayload = {
    action: 'ping',
    shared_secret: config.sharedSecret,
    test_id: `test_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testPayload),
      redirect: 'follow',
    });

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP ${res.status}: Target endpoint returned an error status.`,
      };
    }

    try {
      const json = await res.json();
      if (json.status === 'success' || json.ping === 'pong' || json.authenticated) {
        return {
          success: true,
          message: 'Connection verified! Google Apps Script responded with valid authorization.',
          details: json,
        };
      }
      if (json.status === 'unauthorized') {
        return {
          success: false,
          message: 'Authentication failed. Check that your Shared Secret matches the Script Property.',
          details: json,
        };
      }
      return {
        success: true,
        message: `Connection successful: ${json.message || 'Endpoint reachable'}`,
        details: json,
      };
    } catch {
      return {
        success: true,
        message: 'Endpoint reached and accepted POST request with HTTP 200 OK.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to reach endpoint: ${err.message}. Ensure web app is deployed with access set to "Anyone".`,
    };
  }
}
