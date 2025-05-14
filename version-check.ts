console.log('Environment versions:');
console.log('Node.js:', process.version);
console.log('TypeScript:', require('typescript').version);
console.log('ts-node-dev:', require('ts-node-dev/package.json').version);
console.log('tsconfig-paths:', require('tsconfig-paths/package.json').version);

console.log('Module system:', require.main?.path);
console.log('ESM enabled:', process.env.NODE_OPTIONS?.includes('--experimental-modules'));
