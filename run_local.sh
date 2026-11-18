#!/usr/bin/env bash
# Runs the whole AgriCast system on your computer WITHOUT Docker:
#   backend  http://localhost:8000  (FastAPI, SQLite file agricast.db)   docs: http://localhost:8000/docs
#   frontend http://localhost:5173  (React)
# The real KALRO/FAO calendar records load automatically on first start (AUTO_LOAD_CALENDAR=0 to skip).
set -e
cd "$(dirname "$0")"
command -v python3 >/dev/null || { echo "Python 3 is missing. Run: sudo apt install -y python3 python3-venv python3-pip"; exit 1; }
command -v npm >/dev/null || { echo "Node.js is missing. See README.md (Install Node 20)."; exit 1; }
[ -d backend/.venv ] || python3 -m venv backend/.venv || { echo "Run: sudo apt install -y python3-venv"; exit 1; }
echo "Installing backend packages..."; backend/.venv/bin/pip install -q -r backend/requirements.txt
echo "Installing frontend packages..."; (cd frontend && npm install --silent)
export DATABASE_URL="sqlite:///$(pwd)/agricast.db" CORS_ORIGINS="http://localhost:5173" DEMO_SAMPLE_CALENDAR="${DEMO_SAMPLE_CALENDAR:-0}" AUTO_LOAD_CALENDAR="${AUTO_LOAD_CALENDAR:-1}"
(cd backend && .venv/bin/uvicorn app.main:app --port 8000) &
API=$!
trap 'kill $API 2>/dev/null' EXIT INT TERM
echo; echo "Open http://localhost:5173 in your browser. Press Ctrl+C to stop everything."; echo
(cd frontend && npm run dev -- --port 5173)
