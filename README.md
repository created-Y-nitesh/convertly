# Convertly — Premium Document Conversion Platform

Convertly is an enterprise-grade document conversion web platform featuring a light-theme interface, high-fidelity server-side conversion pipelines (headless LibreOffice, PyMuPDF, python-docx, Pillow, openpyxl), MongoDB Atlas metadata persistence with TTL indexing, Google Sheets operational telemetry via Google Apps Script, capability-based download authorization, and full deployment support for decoupled architectures (Vercel SPA frontend + Docker/Cloud Run FastAPI backend).

---

## 1. Architecture Overview

Convertly is architected with strict separation between client presentation, conversion processing, metadata management, and administrative reporting:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Convertly UI (SPA)                            │
│           React 19 + TypeScript + Tailwind CSS (Hosted on Vercel)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼ HTTPS API Calls                ▼ Server Telemetry
┌─────────────────────────────────────────┐  ┌───────────────────────────┐
│       FastAPI Conversion Engine         │  │   Google Sheets Service   │
│  (Docker on Cloud Run / Render / VPS)   │  │   Apps Script Web App     │
│  - Headless LibreOffice / Gotenberg     │  │   Shared Secret Auth      │
│  - PyMuPDF, Pillow, openpyxl, docx      │  │   Idempotent Deduplication│
│  - Capability Token Auth & Rate Limiter │  └─────────────┬─────────────┘
└─────────────┬───────────────────────────┘                │
              │                                            │
       ┌──────┴──────┐                                     │
       ▼             ▼                                     ▼
┌─────────────┐ ┌──────────────────────┐   ┌───────────────────────────┐
│ Local Disk  │ │ MongoDB Atlas        │   │   Operational Dashboard   │
│ Ephemeral   │ │ Job Metadata, TTL,   │   │   Spreadsheet Log Sheet   │
│ Auto-Purge  │ │ State Validation     │   └───────────────────────────┘
└─────────────┘ └──────────────────────┘
```

---

## 2. Conversion Engines & Format Matrix

| Input Format | Output Format | Processing Engine | Fidelity & Architecture Notes |
|---|---|---|---|
| `.docx` | `.pdf` | Headless LibreOffice / Gotenberg | Server-side conversion preserving tables, headers, footers, margins, and inline media. Fails with HTTP 503 if engine is absent (no silent downgrade). |
| `.pdf` | `.docx` | PyMuPDF + python-docx | Structural extraction into editable Microsoft Word (.docx). Note inherent limitation: PDFs use absolute coordinate geometry $(x, y)$; multi-column flows, complex borderless tables, or non-Unicode typefaces cannot be reconstructed into identical Word reflowable flows. |
| `.pdf` | `.png`, `.jpg` | PyMuPDF (fitz) | High-resolution rasterization (150 DPI) per document page. |
| `.pdf` | `.txt` | PyMuPDF (fitz) | Clean text stream extraction. |
| `.docx` | `.txt` | python-docx / XML parser | Text extraction from Word XML paragraphs. |
| `.csv` | `.xlsx` | openpyxl / SheetJS | Tabular delimited conversion into styled multi-column workbooks. |
| `.xlsx` | `.csv` | openpyxl / SheetJS | Spreadsheet sheet flattening to RFC 4180 CSV. |
| `.png`, `.jpg`, `.webp` | `.pdf` | Pillow + PyMuPDF / pdf-lib | Image-to-document compilation with auto-scaling to standard A4/Letter bounds. |
| `.png`, `.jpg`, `.webp` | Raster images | Pillow / HTML5 Canvas | Lossless and lossy raster format transformation with adjustable quality. |
| `.txt` | `.pdf` | PyMuPDF / pdf-lib | Paginated PDF compilation with typography and page numbering. |

---

## 3. Production Hardening Features

### Priority 1: High-Fidelity DOCX-to-PDF Conversion
- Headless LibreOffice binary auto-detection (`soffice` / `libreoffice` in system PATH or custom `LIBREOFFICE_PATH`).
- Gotenberg HTTP microservice integration via `GOTENBERG_URL` environment variable.
- Explicit `HTTP 503 Service Unavailable` returned if no conversion engine is installed in the active runtime.
- Never silently substitutes lower-quality text scrapers.

### Priority 2: MongoDB Atlas Durable Metadata Store
- Connection ping validation at startup (`app.db.mongodb.connect_to_mongodb`).
- Strict production mode: raises `RuntimeError` on startup if `ALLOW_IN_MEMORY_FALLBACK=False` and MongoDB fails to connect.
- Indexes enforced automatically on startup:
  - `idx_job_id_unique`: `{ job_id: 1 }` (unique)
  - `idx_access_token`: `{ access_token: 1 }`
  - `idx_created_at_desc`: `{ created_at: -1 }`
  - `idx_status_created`: `{ status: 1, created_at: -1 }`
  - `idx_ttl_expires_at`: `{ expires_at: 1 }` (expireAfterSeconds: 0)
- Filesystem cleanup runs independently of MongoDB TTL through `storage_service.purge_expired_files(max_age_seconds=3600)`.

### Priority 3: Capability-Based Download Authorization & Security
- **Capability Tokens**: Every conversion generates a cryptographic 256-bit URL-safe token (`access_token`).
- Downloads and job deletions require `?token=<access_token>` or `Authorization: Bearer <access_token>`.
- Unauthorized requests receive `HTTP 403 Forbidden`.
- **Sliding-Window Rate Limiting**: In-memory rate limiter protects endpoints against automated abuse (default: 60 requests/min per IP).
- **Magic-Byte Signature Verification**: Rejects spoofed files (e.g. executable disguised as PDF) before processing.
- **Path Traversal Protection**: Enforces strict basename checks against isolated temporary sandboxes.
- **Anonymous Privacy**: History endpoints mask original filenames (`document_xxxxxx.ext`) unless authenticated via `X-Admin-Key`.

### Priority 4: Google Sheets Operational Telemetry
- Deployed via Google Apps Script Web App (`google_apps_script/Code.gs`).
- Shared secret authentication (`CONVERTLY_SHARED_SECRET`) configured server-side.
- Handles HTTP 302 redirects to `script.googleusercontent.com` with `follow_redirects=True`.
- Built-in retry logic with exponential backoff on transient network failures.
- Concurrency locks (30s) and 500-row deduplication window prevent duplicate log entries.
- Telemetry failure is completely non-fatal to conversion jobs.
- Direct diagnostics via `POST /api/v1/integrations/google-sheets/test`.

---

## 4. Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- (Optional) Docker & Docker Compose

### Running Frontend Gateway
```bash
# Install frontend dependencies
npm install

# Start Express + Vite dev server (runs at http://localhost:3000)
npm run dev
```

### Running Backend API
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Automated Test Suites
```bash
# Run backend pytest suite (34 unit & integration tests)
python -m pytest backend/tests -c backend/pytest.ini -v

# Run frontend TypeScript and build verification
npm run lint
npm run build
```

---

## 5. Deployment Guide

Because document conversions require headless LibreOffice binaries and C-compiled libraries (PyMuPDF) which exceed Vercel serverless limits (50 MB bundle limit, 10-60s timeout, 4.5 MB request payload limit), Convertly utilizes a decoupled deployment model:
1. **Frontend**: Hosted on Vercel (Edge CDN, fast static asset delivery).
2. **Backend**: Hosted on Google Cloud Run, Render, Railway, or AWS ECS via Docker.

### Step 1: Deploy Backend via Docker

#### Option A: Google Cloud Run (Recommended)
```bash
# 1. Build and push container to Google Artifact Registry
gcloud auth configure-docker
docker build -t gcr.io/<PROJECT_ID>/convertly-api:latest .
docker push gcr.io/<PROJECT_ID>/convertly-api:latest

# 2. Deploy Cloud Run service
gcloud run deploy convertly-api \
  --image gcr.io/<PROJECT_ID>/convertly-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars ENVIRONMENT=production,ALLOW_IN_MEMORY_FALLBACK=false,ALLOWED_ORIGINS=https://<YOUR_VERCEL_DOMAIN>.vercel.app,MONGODB_URI=<YOUR_ATLAS_URI>
```

#### Option B: Docker Compose (VPS / Self-Hosted)
```bash
docker compose up -d --build
```

### Step 2: Deploy Frontend on Vercel

1. Push your repository to GitHub / GitLab.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import the repository.
4. Set the Framework Preset to **Vite**.
5. Add the Environment Variable:
   - `VITE_API_BASE_URL`: The HTTPS URL of your deployed backend (e.g. `https://convertly-api-xxxx.a.run.app`).
6. Click **Deploy**.

---

## 6. Environment Variables Reference

### Backend (`backend/.env` or Container Environment)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ENVIRONMENT` | Yes | `development` | Set to `production` in production deployments. |
| `ALLOWED_ORIGINS` | Yes | `http://localhost:3000` | Comma-separated list of allowed origins (e.g. `https://convertly.vercel.app`). |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017` | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `MONGODB_DB_NAME` | No | `convertly_production` | Target MongoDB database name. |
| `ALLOW_IN_MEMORY_FALLBACK` | Yes | `true` (dev) | Set to `false` in production to fail fast if Atlas is unreachable. |
| `LIBREOFFICE_PATH` | No | Auto-detected | Custom path to LibreOffice binary (`soffice` or `libreoffice`). |
| `GOTENBERG_URL` | No | `""` | Optional Gotenberg service endpoint (e.g. `http://gotenberg:3000`). |
| `GOOGLE_SHEETS_WEBHOOK_URL`| No | `""` | Deployed Apps Script Web App URL. |
| `GOOGLE_SHEETS_SHARED_SECRET`| No | `""` | Shared secret token matching Apps Script property. |
| `GOOGLE_SHEETS_AUTO_SYNC` | No | `false` | When `true`, automatically transmits telemetry for completed conversions. |
| `ADMIN_API_KEY` | No | `""` | Secret key required to view unredacted history records via `X-Admin-Key`. |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Maximum requests per minute per IP address. |
| `TEMP_STORAGE_DIR` | No | `/tmp/convertly_storage` | Ephemeral scratch directory for conversions. |
| `MAX_FILE_SIZE_BYTES` | No | `52428800` (50 MB) | Maximum upload payload size in bytes. |
| `FILE_RETENTION_SECONDS` | No | `3600` (1 hour) | Retention duration before local storage purge. |

### Frontend (`.env` or Vercel Environment Variables)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Production | `""` | HTTPS origin of the deployed FastAPI backend. |
| `PORT` | Local | `3000` | Express gateway dev server port. |
| `BACKEND_TARGET_URL` | Local | `http://127.0.0.1:8000` | Express gateway upstream proxy target. |

---

## 7. Security & File Privacy Policy

1. **Strict File Size Limits**: Files exceeding 50 MB (25 MB for images) are rejected at the edge before parsing.
2. **Magic Byte Signature Verification**: Header bytes (`%PDF`, `PK\x03\x04`, `\x89PNG`, `\xFF\xD8\xFF`, `RIFF`) are checked to prevent extension spoofing and malicious payloads.
3. **Capability Token Isolation**: Ephemeral download tokens ensure users can only access files they created.
4. **Path Traversal Protection**: Inputs are sanitized against isolated sandbox directories.
5. **Zero Document Logging**: Document contents are never stored in databases, transmitted to Google Sheets, or logged to console output.
6. **Decoupled File Purge**: Files are deleted from disk independent of database TTL policies.
