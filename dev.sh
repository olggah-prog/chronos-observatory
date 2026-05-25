#!/bin/bash
# Chronos Observatory — local dev startup
# Usage: ./dev.sh
# Stop: Ctrl+C

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ═══════════════════════════════════════"
echo "  CHRONOS OBSERVATORY — local dev"
echo "  ═══════════════════════════════════════"
echo "  backend  → http://localhost:8000"
echo "  frontend → http://localhost:3000"
echo "  stop     → Ctrl+C"
echo "  ═══════════════════════════════════════"
echo ""

# Kill children on exit
cleanup() {
  echo ""
  echo "  Stopping Chronos..."
  kill 0
}
trap cleanup EXIT INT TERM

# Start backend
echo "  [backend] starting uvicorn..."
cd "$ROOT"
python3 -m uvicorn main:app --port 8000 --reload 2>&1 | sed 's/^/  [backend] /' &

# Wait for backend to start
sleep 2

# Start frontend
echo "  [frontend] starting vite..."
cd "$ROOT/frontend"
node_modules/.bin/vite dev 2>&1 | sed 's/^/  [frontend] /' &

# Wait for both
wait
