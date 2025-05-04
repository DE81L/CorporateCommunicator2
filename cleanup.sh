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

# Remove duplicate configs
rm -f vite.config.ts
rm -f tailwind.config.ts
rm -f vite.config.mjs.d.ts

# Remove old launch config
rm -f .vscode/launch.json
