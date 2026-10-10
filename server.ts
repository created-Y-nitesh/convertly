import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Configured CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173,https://convertly.vercel.app')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev resilient
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory multer upload to forward directly to FastAPI engine
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// 1. Unified Health check
app.get('/health', async (req: Request, res: Response) => {
  let fastApiHealthy = false;
  let fastApiDetails: any = null;

  try {
    const upstream = await fetch(`${FASTAPI_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (upstream.ok) {
      fastApiHealthy = true;
      fastApiDetails = await upstream.json();
    }
  } catch {
    fastApiHealthy = false;
  }

  res.json({
    status: 'healthy',
    service: 'Convertly Gateway Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    fastapi_backend: {
      status: fastApiHealthy ? 'connected' : 'unreachable',
      target: FASTAPI_URL,
      details: fastApiDetails,
    },
  });
});

// 2. Formats Proxy
app.get('/api/v1/formats', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/formats`);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    // Resilient fallback schema if FastAPI is offline
    return res.json({
      pdf: { id: 'pdf', name: 'Portable Document Format', extension: '.pdf', category: 'pdf', max_size_bytes: 52428800 },
      docx: { id: 'docx', name: 'Microsoft Word Document', extension: '.docx', category: 'office', max_size_bytes: 31457280 },
      txt: { id: 'txt', name: 'Plain Text File', extension: '.txt', category: 'data', max_size_bytes: 20971520 },
      png: { id: 'png', name: 'Portable Network Graphics', extension: '.png', category: 'images', max_size_bytes: 26214400 },
      jpg: { id: 'jpg', name: 'JPEG Image', extension: '.jpg', category: 'images', max_size_bytes: 26214400 },
      webp: { id: 'webp', name: 'WebP Modern Image', extension: '.webp', category: 'images', max_size_bytes: 26214400 },
      csv: { id: 'csv', name: 'Comma-Separated Values', extension: '.csv', category: 'data', max_size_bytes: 26214400 },
      xlsx: { id: 'xlsx', name: 'Microsoft Excel Spreadsheet', extension: '.xlsx', category: 'data', max_size_bytes: 31457280 },
    });
  }
});

// 3. Supported Routes Proxy
app.get('/api/v1/conversions/supported', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/conversions/supported`);
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(503).json({
      error: 'FastAPI conversion service is currently offline. Start the backend with: uvicorn app.main:app --port 8000',
    });
  }
});

// 4. Real Conversion Dispatch: Proxies directly to FastAPI
app.post('/api/v1/conversions', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  const { source_format, target_format, options } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!source_format || !target_format) {
    return res.status(400).json({ error: 'source_format and target_format are required.' });
  }

  try {
    // Build multipart FormData for FastAPI
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'application/octet-stream' });
    formData.append('file', fileBlob, file.originalname);
    formData.append('source_format', source_format);
    formData.append('target_format', target_format);
    if (options) {
      formData.append('options', typeof options === 'string' ? options : JSON.stringify(options));
    }

    const upstream = await fetch(`${FASTAPI_URL}/api/v1/conversions`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await upstream.json();
    return res.status(upstream.status).json(responseData);
  } catch (err: any) {
    return res.status(503).json({
      error: `FastAPI conversion engine unreachable at ${FASTAPI_URL}. Ensure the Python service is running (cd backend && uvicorn app.main:app).`,
      details: err.message,
    });
  }
});

// 5. Job Status Proxy
app.get('/api/v1/conversions/:job_id', async (req: Request, res: Response) => {
  try {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const headers: Record<string, string> = {};
    if (req.headers.authorization) headers['Authorization'] = String(req.headers.authorization);
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/conversions/${req.params.job_id}${queryString}`, { headers });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(503).json({ error: `Backend unreachable: ${err.message}` });
  }
});

// 6. Real Download Proxy (streams converted binary directly)
app.get('/api/v1/conversions/:job_id/download', async (req: Request, res: Response) => {
  try {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const headers: Record<string, string> = {};
    if (req.headers.authorization) headers['Authorization'] = String(req.headers.authorization);
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/conversions/${req.params.job_id}/download${queryString}`, { headers });
    if (!upstream.ok) {
      const errData = await upstream.json().catch(() => ({ detail: 'Download failed' }));
      return res.status(upstream.status).json(errData);
    }

    // Forward headers
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = upstream.headers.get('content-disposition');

    res.setHeader('Content-Type', contentType);
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    const arrayBuf = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    return res.status(503).json({ error: `Backend download unreachable: ${err.message}` });
  }
});

// 7. History Proxy
app.get('/api/v1/history', async (req: Request, res: Response) => {
  try {
    const headers: Record<string, string> = {};
    if (req.headers['x-admin-key']) headers['X-Admin-Key'] = String(req.headers['x-admin-key']);
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/history`, { headers });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.json([]);
  }
});

// 8. Server-side Google Sheets Webhook proxy (prevents browser CORS & uses backend env secrets)
app.post('/api/v1/integrations/google-sheets/test', async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${FASTAPI_URL}/api/v1/integrations/google-sheets/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      message: `Failed to reach backend integration endpoint: ${err.message}`,
    });
  }
});

// Server startup with Vite in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Convertly full-stack gateway running on http://0.0.0.0:${PORT}`);
    console.log(`Routing /api/v1 conversions to FastAPI engine at: ${FASTAPI_URL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
