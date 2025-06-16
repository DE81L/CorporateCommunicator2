#!/usr/bin/env bash
set -euo pipefail

# ─────────── директории ───────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PY_ENV="${ROOT_DIR}/.venv"

# ─────────── Python: venv + deps ──────────
if [[ ! -d "$PY_ENV" ]]; then
  echo "[pyws] creating venv @ $PY_ENV"
  python3.12 -m venv "$PY_ENV"
fi
source "$PY_ENV/bin/activate"

pip install --upgrade pip || echo "[WARN] pip upgrade failed"
pip install -r "$ROOT_DIR/requirements.txt" || echo "[WARN] pip install failed"

# ─────────── Node: deps + build ──────────
pnpm install --frozen-lockfile || echo "[WARN] pnpm install failed"

pnpm -r --filter 'shared...' run build || true
pnpm -r --filter 'server...' run build || true

# ─────────── Старт двух процессов ──────────
"$PY_ENV/bin/python" "$ROOT_DIR/python_ws_server.py" &
PYWS_PID=$!

if [[ -f "$ROOT_DIR/dist/server/main.js" ]]; then
  node --es-module-specifier-resolution=node \
       "$ROOT_DIR/dist/server/main.js" &
  NODE_PID=$!
  echo "[OK] pyws($PYWS_PID) + node($NODE_PID) подняты"
else
  NODE_PID=""
  echo "[WARN] Node server not found; only pyws($PYWS_PID) запущен"
fi

trap "kill $PYWS_PID ${NODE_PID:-}" EXIT

wait
