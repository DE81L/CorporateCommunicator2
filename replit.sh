#!/bin/bash
# Run server without Electron
concurrently "tsx server/index.ts" "cd client && cross-env ELECTRON=false NODE_ENV=development vite --config vite.config.noelectron.ts --host 0.0.0.0"