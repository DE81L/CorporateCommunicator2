import * as tsConfigPaths from 'tsconfig-paths';
import { resolve } from 'path';

// Debug tsconfig paths resolution
const configResult = tsConfigPaths.loadConfig(resolve(__dirname, './tsconfig.json'));
console.log('TSConfig loading result:', configResult.resultType);
console.log('Resolved paths:', configResult.paths);

// Test module resolution
try {
  console.log('@shared/logger resolves to:', require.resolve('@shared/logger'));
} catch (e) {
  console.log('Failed to resolve @shared/logger:', e.message);
}

// Print environment info
console.log('TypeScript version:', require('typescript').version);
console.log('ts-node version:', require('ts-node').VERSION);
console.log('Node.js version:', process.version);
