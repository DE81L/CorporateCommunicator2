#!/bin/bash

# Remove generated JS files from shared folder
rm -f shared/electron-shared/*.js

# Remove backup files
rm -f client/src/components/*.bak
rm -f client/src/pages/*.bak

# Remove empty stub files
rm -f client/src/ui/*.tsx

# Remove test files
rm -f test.html

# Remove duplicate config files
rm -f tailwind.config.js vite.config.ts vite.config.mjs.d.ts

# Keep only the essential configs:
# - vite.config.mjs (root)
# - client/vite.config.ts 
# - client/tailwind.config.js

echo "Cleaned up duplicate config files"

# Remove old launch config
rm -f .vscode/launch.json
