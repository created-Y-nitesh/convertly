# Production Dockerfile for Convertly FastAPI Conversion Engine with Headless LibreOffice
FROM python:3.12-slim AS base

# Prevent Python from writing .pyc and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies, headless LibreOffice Writer/Calc, and core font packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    libreoffice-writer-nogui \
    libreoffice-calc-nogui \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend /app

# Create ephemeral scratch storage directory with non-root ownership
RUN mkdir -p /tmp/convertly_storage && chmod 777 /tmp/convertly_storage

# Non-root security user
RUN useradd -m -u 1001 convertly && \
    chown -R convertly:convertly /app /tmp/convertly_storage
USER convertly

# Expose FastAPI service port
EXPOSE 8000

ENV HOST=0.0.0.0
ENV PORT=8000
ENV PYTHONPATH=/app
ENV TEMP_STORAGE_DIR=/tmp/convertly_storage
ENV ALLOW_IN_MEMORY_FALLBACK=false

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
