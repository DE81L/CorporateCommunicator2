import * as tsconfig from 'tsconfig';

console.log('TSConfig version:', require('tsconfig/package.json').version);
console.log('TSConfig path:', require.resolve('tsconfig'));

// Also check ts-node-dev configuration
try {
  const tsNodeDev = require('ts-node-dev');
  console.log('ts-node-dev version:', tsNodeDev.version);
} catch (e) {
  console.log('ts-node-dev not found in current context');
}

// Print current TypeScript version
console.log('TypeScript version:', require('typescript').version);
