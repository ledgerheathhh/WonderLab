#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null || ! command -v node >/dev/null; then
  echo '需要 Python 3.11+ 和 Node.js 22.12+ / Python 3.11+ and Node.js 22.12+ are required.'
  exit 1
fi
if [ ! -d .venv ]; then python3 -m venv .venv; fi
if [ ! -f .venv/.wonderlab-installed ] || [ backend/requirements.txt -nt .venv/.wonderlab-installed ]; then
  .venv/bin/python -m pip install -r backend/requirements.txt
  touch .venv/.wonderlab-installed
fi
if [ ! -d node_modules ]; then npm ci; fi
npm run build
printf '\nWonderLab: http://127.0.0.1:8000\n按 Ctrl+C 停止 / Press Ctrl+C to stop\n\n'
exec .venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
