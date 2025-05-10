#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const log = fs.readFileSync(path.resolve('ts-report.log'), 'utf8');
const rows = [...log.matchAll(/([\\w./-]+\\.ts):(\\d+):(\\d+) - error (TS\\d+): ([^\\n]+)/g)]
  .map(([_, file, line, col, code, msg]) => ({ file, line, col, code, msg }));
console.table(rows);
