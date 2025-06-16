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

pip install --upgrade pip
pip install -r "$ROOT_DIR/requirements.txt"

# ─────────── Node: deps + build ──────────
pnpm install --frozen-lockfile

pnpm -r --filter 'shared...' run build
pnpm -r --filter 'server...' run build

# ─────────── Старт двух процессов ──────────
python "$ROOT_DIR/python_ws_server.py" &
PYWS_PID=$!

node --es-module-specifier-resolution=node \
     "$ROOT_DIR/dist/server/main.js" &
NODE_PID=$!

trap "kill $PYWS_PID $NODE_PID" EXIT

echo "[OK] pyws($PYWS_PID) + node($NODE_PID) подняты"
wait
