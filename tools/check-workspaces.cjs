#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  const usingPnpm = process.env.npm_execpath && process.env.npm_execpath.includes('pnpm');
  if (!usingPnpm) {
    console.warn("⚠️ Рекомендуется использовать pnpm для установки зависимостей.");
  }

  const clientNodeModules = path.resolve(__dirname, '../client/node_modules');
  if (fs.existsSync(clientNodeModules)) {
    console.warn("⚠️ Директория 'client/node_modules' присутствует. Удалите её и выполните установку заново через корневой pnpm.");
  }
  
  console.log("Workspace check completed. No blocking issues.");
} catch (e) {
  console.error("Workspace check encountered an error:", e);
}
