#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const flagIndex = args.indexOf('-localp2p');
const flagIndex2 = args.indexOf('--localp2p');
const local = flagIndex !== -1 || flagIndex2 !== -1;
if (flagIndex !== -1) args.splice(flagIndex, 1);
if (flagIndex2 !== -1) args.splice(flagIndex2, 1);

const env = { ...process.env };
if (local) {
  env.VITE_STUN_SERVER = 'none';
  env.STUN_SERVER = 'none';
}

const child = spawn(
  'pnpm',
  [
    'exec',
    'concurrently',
    '-k',
    '-n',
    'server,client,electron',
    '-c',
    'green,blue,magenta',
    'pnpm run dev:server',
    'pnpm run dev:client',
    'pnpm run dev:electron'
  ],
  { stdio: 'inherit', env }
);

child.on('exit', code => process.exit(code ?? 0));
