/**
 * MongoDB Metadata Service for Convertly
 * Manages conversion job schemas, indexes, and persistence synchronization.
 */

import { ConversionJob, MongoConfig, ConversionEventRecord } from '../types/conversion';

const STORAGE_KEY_CONFIG = 'convertly_mongo_config';
const STORAGE_KEY_AUDIT_LOGS = 'convertly_audit_logs';

export const DEFAULT_MONGO_CONFIG: MongoConfig = {
  connectionUri: 'mongodb+srv://app_user:********@cluster0.convertly.mongodb.net/?retryWrites=true&w=majority',
  databaseName: 'convertly_production',
  collectionName: 'conversion_jobs',
  enabled: true,
};

/**
 * MongoDB Document Schema Specification
 */
export interface MongoConversionDocument {
  _id?: string;
  job_id: string;
  user_id?: string;
  original_filename: string;
  source_format: string;
  target_format: string;
  original_file_size_bytes: number;
  status: 'idle' | 'selected' | 'validating' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string; // ISO 8601 UTC
  updated_at: string;
  completed_at?: string;
  processing_duration_ms?: number;
  result_file_size_bytes?: number;
  error_code?: string;
  safe_error_description?: string;
  storage_reference?: string;
  expires_at: string; // TTL 24h
  ip_hash?: string;
}

/**
 * Recommended MongoDB Atlas Indexes
 */
export const MONGO_INDEX_SPECS = [
  { key: { job_id: 1 }, unique: true, name: 'idx_job_id_unique' },
  { key: { created_at: -1 }, name: 'idx_created_at_desc' },
  { key: { status: 1, created_at: -1 }, name: 'idx_status_created' },
  { key: { expires_at: 1 }, expireAfterSeconds: 0, name: 'idx_ttl_expires_at' },
  { key: { source_format: 1, target_format: 1 }, name: 'idx_formats' },
];

export function getMongoConfig(): MongoConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_MONGO_CONFIG;
}

export function saveMongoConfig(config: MongoConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function getStoredAuditLogs(): ConversionEventRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function recordAuditLog(record: ConversionEventRecord): void {
  try {
    const existing = getStoredAuditLogs();
    const updated = [record, ...existing].slice(0, 200); // Keep last 200
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
  } catch {}
}

export function clearAuditLogs(): void {
  localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
}

/**
 * Converts a runtime ConversionJob into a pristine MongoDB Document schema
 */
export function jobToMongoDocument(job: ConversionJob): MongoConversionDocument {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    job_id: job.id,
    original_filename: job.originalFileName,
    source_format: job.sourceFormat,
    target_format: job.targetFormat,
    original_file_size_bytes: job.originalFileSize,
    status: job.status,
    created_at: job.createdAt || now,
    updated_at: now,
    completed_at: job.completedAt,
    processing_duration_ms: job.durationMs,
    result_file_size_bytes: job.resultFileSize,
    error_code: job.errorCode,
    safe_error_description: job.errorMessage,
    storage_reference: job.resultFileName ? `ephemeral://${job.id}/${job.resultFileName}` : undefined,
    expires_at: expiresAt,
  };
}
