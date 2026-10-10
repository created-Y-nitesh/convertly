/**
 * Core type definitions for Convertly Document Conversion Platform
 */

export type FormatCategory = 'pdf' | 'office' | 'images' | 'data';

export type SupportedFormat = 
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'csv'
  | 'xlsx';

export type JobStatus = 
  | 'idle'
  | 'selected'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface FormatDefinition {
  id: SupportedFormat;
  name: string;
  extension: string;
  mimeTypes: string[];
  category: FormatCategory;
  maxSizeBytes: number; // e.g., 50MB
  magicBytes?: number[]; // First few header bytes for signature verification
  description: string;
}

export interface ConversionRoute {
  id: string; // e.g., "pdf-to-docx"
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  label: string;
  engine: 'pdf-engine' | 'office-engine' | 'image-engine' | 'data-engine';
  isAvailable: boolean;
  notes?: string;
  defaultOptions?: Record<string, any>;
}

export interface ConversionOptions {
  imageQuality?: number; // 0.1 to 1.0
  imageWidth?: number;
  imageHeight?: number;
  csvDelimiter?: ',' | ';' | '\t';
  pageRange?: string; // e.g., "all", "1-5"
  preserveFormatting?: boolean;
}

export interface ConversionJob {
  id: string;
  originalFile: File;
  originalFileName: string;
  originalFileSize: number;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  status: JobStatus;
  progress: number; // 0 to 100
  options: ConversionOptions;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultFileName?: string;
  resultFileSize?: number;
  errorCode?: string;
  errorMessage?: string;
  sheetsLogged?: boolean;
}

export interface ConversionEventRecord {
  event_id: string;
  job_id: string;
  created_at: string;
  source_format: string;
  target_format: string;
  original_file_size: number;
  status: string;
  processing_duration_ms: number;
  error_code?: string;
  result_file_size?: number;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  sharedSecret: string;
  enabled: boolean;
  autoLog: boolean;
  sheetName?: string;
}

export interface MongoConfig {
  connectionUri: string;
  databaseName: string;
  collectionName: string;
  enabled: boolean;
}
