#!/bin/bash

# Скрипт сборки и запуска CorporateCommunicator2 в production-режиме
# Запускает Node.js API-сервер и Python WebSocket-сервер
#
# Параметры окружения можно переопределить перед запуском:
#   PORT - порт для Node.js, по умолчанию 4000
#   PYWS_PORT - порт Python WS, по умолчанию 8001
#   DATABASE_URL - строка подключения к PostgreSQL
#   VITE_API_URL и VITE_WS_URL - адреса, прошиваемые в клиент

set -euo pipefail

PORT="${PORT:-4000}"
PYWS_PORT="${PYWS_PORT:-8001}"

pnpm install --frozen-lockfile --ignore-scripts=false
pnpm approve-builds || true

# Устанавливаем переменные для сборки клиента
export NODE_ENV=production
export PORT
export NO_NODE_WS=1
export DATABASE_URL="${DATABASE_URL:-postgresql://cc_user:123@localhost:5432/cc_db}"
export VITE_API_URL="${VITE_API_URL:-http://91.197.96.9:$PORT}"
export VITE_WS_URL="${VITE_WS_URL:-ws://91.197.96.9:$PYWS_PORT/ws}"

pnpm run build
pnpm prune --prod

# Запускаем сервисы
python3 python_ws_server.py --host 0.0.0.0 --port "$PYWS_PORT" &
PYWS_PID=$!
DIR=$(cd -- "$(dirname "$0")"/.. && pwd)
node --es-module-specifier-resolution=node "$DIR/dist/server/main.js" &
NODE_PID=$!

echo "Запущены Node.js (PID $NODE_PID, порт $PORT) и Python WS (PID $PYWS_PID, порт $PYWS_PORT)"
wait $NODE_PID $PYWS_PID

