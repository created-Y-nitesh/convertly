import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

function resolvePythonBinary() {
  const isWin = process.platform === 'win32';

  // 1. Check local virtual environment paths
  const localVenvs = [
    path.join(backendDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(backendDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(rootDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(rootDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
  ];

  for (const venvPath of localVenvs) {
    if (fs.existsSync(venvPath)) {
      return venvPath;
    }
  }

  // 2. Check system commands
  const candidates = isWin ? ['python', 'py'] : ['python3', 'python'];
  for (const cmd of candidates) {
    try {
      const res = spawnSync(cmd, ['--version'], { encoding: 'utf-8' });
      if (res.status === 0) {
        return cmd;
      }
    } catch {}
  }

  return isWin ? 'python' : 'python3';
}

const pythonBin = resolvePythonBinary();
console.log(`[backend] Starting FastAPI with: ${pythonBin} (cwd: ${backendDir})`);

const backendProc = spawn(
  pythonBin,
  ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'],
  {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  }
);

backendProc.on('error', (err) => {
  console.error(`[backend] Failed to start Python process: ${err.message}`);
  process.exit(1);
});

backendProc.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code || 0);
});

function handleShutdown() {
  if (!backendProc.killed) {
    backendProc.kill('SIGINT');
  }
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
