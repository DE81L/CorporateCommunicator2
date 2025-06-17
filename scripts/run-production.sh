#!/usr/bin/env bash
set -e

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

if [ ! -d "client/dist" ]; then
  pnpm run build:prod
fi

# ─────────── Очистка зависших процессов ───────────
# Если прошлый запуск python_ws_server.py не завершился,
# порт 8001 может быть занят. Остановим такие процессы.
pkill -f python_ws_server.py 2>/dev/null || true

# ─────────── Старт двух процессов ──────────
"$PY_ENV/bin/python" "$ROOT_DIR/python_ws_server.py" &
PYWS_PID=$!

if [[ -f "$ROOT_DIR/dist/server/index.js" ]]; then
  # подключаем резолвер путей tsconfig, иначе алиасы не работают
  node -r tsconfig-paths/register "$ROOT_DIR/dist/server/index.js" &
  NODE_PID=$!
  echo "[OK] pyws($PYWS_PID) + node($NODE_PID) подняты"
else
  NODE_PID=""
  echo "[WARN] Node server not found; only pyws($PYWS_PID) запущен"
fi

trap "kill $PYWS_PID ${NODE_PID:-}" EXIT

wait
