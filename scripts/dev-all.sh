#!/usr/bin/env bash
set -e
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pnpm run build:back
concurrently \
  "pnpm run dev:server" \
  "pnpm run dev:client" \
  "./scripts/run-pyws.sh"
