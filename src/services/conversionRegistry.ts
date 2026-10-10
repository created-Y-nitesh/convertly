import { FormatDefinition, ConversionRoute, SupportedFormat } from '../types/conversion';

export const FORMAT_DEFINITIONS: Record<SupportedFormat, FormatDefinition> = {
  pdf: {
    id: 'pdf',
    name: 'Portable Document Format',
    extension: '.pdf',
    mimeTypes: ['application/pdf'],
    category: 'pdf',
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    magicBytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    description: 'Universal document format preserving exact formatting and layouts',
  },
  docx: {
    id: 'docx',
    name: 'Microsoft Word Document',
    extension: '.docx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ],
    category: 'office',
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
    magicBytes: [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP archive)
    description: 'Standard editable word processing document format',
  },
  txt: {
    id: 'txt',
    name: 'Plain Text File',
    extension: '.txt',
    mimeTypes: ['text/plain'],
    category: 'data',
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    description: 'Unformatted universal text readable across all platforms',
  },
  png: {
    id: 'png',
    name: 'Portable Network Graphics',
    extension: '.png',
    mimeTypes: ['image/png'],
    category: 'images',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    magicBytes: [0x89, 0x50, 0x4e, 0x47], // .PNG
    description: 'Lossless raster image format with full alpha transparency support',
  },
  jpg: {
    id: 'jpg',
    name: 'JPEG Image',
    extension: '.jpg',
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
    category: 'images',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    magicBytes: [0xff, 0xd8, 0xff], // JFIF/Exif header
    description: 'Compressed photograph and image format optimized for web storage',
  },
  jpeg: {
    id: 'jpeg',
    name: 'JPEG Image',
    extension: '.jpeg',
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
    category: 'images',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    magicBytes: [0xff, 0xd8, 0xff],
    description: 'Compressed photograph and image format optimized for web storage',
  },
  webp: {
    id: 'webp',
    name: 'WebP Modern Image',
    extension: '.webp',
    mimeTypes: ['image/webp'],
    category: 'images',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF header
    description: 'Modern high-efficiency image format with lossy and lossless compression',
  },
  csv: {
    id: 'csv',
    name: 'Comma-Separated Values',
    extension: '.csv',
    mimeTypes: ['text/csv', 'application/csv', 'text/plain'],
    category: 'data',
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    description: 'Tabular data stored in plain text with comma or semicolon separators',
  },
  xlsx: {
    id: 'xlsx',
    name: 'Microsoft Excel Spreadsheet',
    extension: '.xlsx',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
    ],
    category: 'data',
    maxSizeBytes: 30 * 1024 * 1024, // 30MB
    magicBytes: [0x50, 0x4b, 0x03, 0x04],
    description: 'Multi-sheet structured workbook with formulas and styled cells',
  },
};

export const CONVERSION_ROUTES: ConversionRoute[] = [
  // PDF workflows
  {
    id: 'pdf-to-docx',
    sourceFormat: 'pdf',
    targetFormat: 'docx',
    label: 'PDF to Word (.docx)',
    engine: 'pdf-engine',
    isAvailable: true,
    notes: 'Extracts text structure, headings, and paragraphs into editable Microsoft Word format using PyMuPDF. Runs natively on Vercel.',
  },
  {
    id: 'pdf-to-png',
    sourceFormat: 'pdf',
    targetFormat: 'png',
    label: 'PDF to PNG Images',
    engine: 'pdf-engine',
    isAvailable: true,
    notes: 'Renders high-resolution raster image frames of document pages.',
  },
  {
    id: 'pdf-to-jpg',
    sourceFormat: 'pdf',
    targetFormat: 'jpg',
    label: 'PDF to JPG Images',
    engine: 'pdf-engine',
    isAvailable: true,
    notes: 'Produces compact web-friendly JPEG images for each document page.',
  },
  {
    id: 'pdf-to-txt',
    sourceFormat: 'pdf',
    targetFormat: 'txt',
    label: 'PDF to Plain Text',
    engine: 'pdf-engine',
    isAvailable: true,
    notes: 'Extracts unformatted text stream suitable for indexing or analysis.',
  },

  // Office workflows
  {
    id: 'docx-to-pdf',
    sourceFormat: 'docx',
    targetFormat: 'pdf',
    label: 'Word (.docx) to PDF',
    engine: 'office-engine',
    isAvailable: true,
    notes: 'Compiles formatted document structure into standardized PDF. On Vercel serverless, requires configuring an external Gotenberg service (GOTENBERG_URL).',
  },
  {
    id: 'docx-to-txt',
    sourceFormat: 'docx',
    targetFormat: 'txt',
    label: 'Word (.docx) to Plain Text',
    engine: 'office-engine',
    isAvailable: true,
    notes: 'Strips markup and extracts raw paragraph contents from DOCX archive.',
  },

  // Image workflows
  {
    id: 'png-to-jpg',
    sourceFormat: 'png',
    targetFormat: 'jpg',
    label: 'PNG to JPG',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Compresses lossless PNG to lightweight JPEG with customizable quality.',
    defaultOptions: { imageQuality: 0.9 },
  },
  {
    id: 'jpg-to-png',
    sourceFormat: 'jpg',
    targetFormat: 'png',
    label: 'JPG to PNG',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Converts JPEG into lossless PNG graphic.',
  },
  {
    id: 'jpeg-to-png',
    sourceFormat: 'jpeg',
    targetFormat: 'png',
    label: 'JPEG to PNG',
    engine: 'image-engine',
    isAvailable: true,
  },
  {
    id: 'png-to-webp',
    sourceFormat: 'png',
    targetFormat: 'webp',
    label: 'PNG to WebP',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Converts PNG to modern WebP with superior compression.',
    defaultOptions: { imageQuality: 0.85 },
  },
  {
    id: 'webp-to-png',
    sourceFormat: 'webp',
    targetFormat: 'png',
    label: 'WebP to PNG',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Decodes WebP into standard PNG for universal legacy software support.',
  },
  {
    id: 'webp-to-jpg',
    sourceFormat: 'webp',
    targetFormat: 'jpg',
    label: 'WebP to JPG',
    engine: 'image-engine',
    isAvailable: true,
  },
  {
    id: 'png-to-pdf',
    sourceFormat: 'png',
    targetFormat: 'pdf',
    label: 'PNG to PDF Document',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Embeds image onto a standardized PDF page with proportional scaling.',
  },
  {
    id: 'jpg-to-pdf',
    sourceFormat: 'jpg',
    targetFormat: 'pdf',
    label: 'JPG to PDF Document',
    engine: 'image-engine',
    isAvailable: true,
    notes: 'Converts photo to clean printable PDF.',
  },
  {
    id: 'jpeg-to-pdf',
    sourceFormat: 'jpeg',
    targetFormat: 'pdf',
    label: 'JPEG to PDF Document',
    engine: 'image-engine',
    isAvailable: true,
  },

  // Data & Text workflows
  {
    id: 'csv-to-xlsx',
    sourceFormat: 'csv',
    targetFormat: 'xlsx',
    label: 'CSV to Excel (.xlsx)',
    engine: 'data-engine',
    isAvailable: true,
    notes: 'Parses delimited records into a structured Excel workbook with auto-typed columns.',
  },
  {
    id: 'xlsx-to-csv',
    sourceFormat: 'xlsx',
    targetFormat: 'csv',
    label: 'Excel (.xlsx) to CSV',
    engine: 'data-engine',
    isAvailable: true,
    notes: 'Extracts the active worksheet into a standard comma-separated text file.',
  },
  {
    id: 'txt-to-pdf',
    sourceFormat: 'txt',
    targetFormat: 'pdf',
    label: 'Text (.txt) to PDF',
    engine: 'data-engine',
    isAvailable: true,
    notes: 'Formats plain text with clean typography, page breaks, and standard margins.',
  },
];

/**
 * Detects format from filename and MIME type
 */
export function detectFileFormat(fileName: string, mimeType?: string): SupportedFormat | null {
  const ext = fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  
  if (ext === 'jpeg') return 'jpeg';
  if (ext === 'jpg') return 'jpg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx') return 'xlsx';

  if (mimeType) {
    for (const [fmt, def] of Object.entries(FORMAT_DEFINITIONS)) {
      if (def.mimeTypes.includes(mimeType)) {
        return fmt as SupportedFormat;
      }
    }
  }

  return null;
}

/**
 * Returns all available target formats for a given source format
 */
export function getAvailableTargets(sourceFormat: SupportedFormat): SupportedFormat[] {
  // Normalize jpeg/jpg
  const normalizedSource = sourceFormat === 'jpeg' ? 'jpg' : sourceFormat;

  const routes = CONVERSION_ROUTES.filter(
    (r) => r.isAvailable && (r.sourceFormat === sourceFormat || (normalizedSource === 'jpg' && r.sourceFormat === 'jpg'))
  );

  const targets = new Set<SupportedFormat>();
  routes.forEach((r) => targets.add(r.targetFormat));
  return Array.from(targets);
}

/**
 * Checks if a specific conversion route exists and is enabled
 */
export function findConversionRoute(source: SupportedFormat, target: SupportedFormat): ConversionRoute | undefined {
  return CONVERSION_ROUTES.find(
    (r) => (r.sourceFormat === source || (source === 'jpeg' && r.sourceFormat === 'jpg')) && r.targetFormat === target
  );
}

/**
 * Validates file signature (magic bytes)
 */
export async function validateFileSignature(file: File, expectedFormat: SupportedFormat): Promise<{ valid: boolean; reason?: string }> {
  const def = FORMAT_DEFINITIONS[expectedFormat];
  if (!def) {
    return { valid: false, reason: `Unknown format: ${expectedFormat}` };
  }

  if (file.size > def.maxSizeBytes) {
    const limitMB = Math.round(def.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      reason: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${limitMB} MB.`,
    };
  }

  // If format has magic bytes, check first chunk
  if (def.magicBytes && def.magicBytes.length > 0) {
    try {
      const buffer = await file.slice(0, def.magicBytes.length).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < def.magicBytes.length; i++) {
        if (bytes[i] !== def.magicBytes[i]) {
          return {
            valid: false,
            reason: `File signature mismatch. The file content does not match the valid ${def.name} format.`,
          };
        }
      }
    } catch {
      // If reading fails, let fallback continue
    }
  }

  return { valid: true };
}
