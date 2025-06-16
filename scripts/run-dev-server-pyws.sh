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

# ─────────── Запуск сервисов ──────────
pnpm --filter server run dev &
NODE_PID=$!

python "$ROOT_DIR/python_ws_server.py" &
PYWS_PID=$!

trap "kill $NODE_PID $PYWS_PID" EXIT
wait
