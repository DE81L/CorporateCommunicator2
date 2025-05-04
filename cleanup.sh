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
rm -f tailwind.config.js
rm -f vite.config.ts
rm -f vite.config.mjs.d.ts
rm -f server/register.ts # Not needed with new tsx version

# Keep only the essential configs:
# - client/vite.config.ts 
# - client/tailwind.config.js

echo "Cleaned up duplicate config files"
